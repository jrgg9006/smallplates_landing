import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth/admin';
import { 
  updateRecipeProductionStatusAdmin,
  markRecipeAsReviewedAdmin 
} from '@/lib/supabase/operations';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import type { RecipeProductionStatusUpdate } from '@/lib/types/database';

interface PatchRequestBody extends RecipeProductionStatusUpdate {
  generated_image_url?: string;
  clearPrintReady?: boolean; // When true, clears generated_image_url_print, image_upscale_status, and image_dimensions
  deleteImage?: boolean;     // When true, deletes original + print-ready images and clears related fields
  restore?: boolean;         // When true, clears deleted_at on guest_recipes and removed_at/removed_by on group_recipes
  archive?: boolean;         // When true, soft-archives recipe from a specific group (mirrors removeRecipeFromGroup)
  archiveGroupId?: string;   // Required when archive=true
  printReady?: {
    ingredients_clean?: string;
    instructions_clean?: string;
    note_clean?: string;
  };
  markNeedsReview?: boolean;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ recipeId: string }> }
) {
  try {
    // Verify admin authentication
    const admin = await requireAdminAuth();

    const { recipeId } = await params;
    const body = await req.json() as PatchRequestBody;

    const supabase = createSupabaseAdminClient();
    let productionStatusData = null;
    let printReadyData = null;

    // ============================================================
    // ARCHIVE: soft-remove recipe from a specific group (reversible)
    // Mirrors removeRecipeFromGroup in lib/supabase/groupRecipes.ts:272
    // ============================================================
    if (body.archive) {
      if (!body.archiveGroupId) {
        return NextResponse.json(
          { error: 'archiveGroupId is required when archive=true' },
          { status: 400 }
        );
      }

      const nowIso = new Date().toISOString();

      // Reason: idempotent — `.is('removed_at', null)` ensures double-calls are no-ops
      const { error: removeError } = await supabase
        .from('group_recipes')
        .update({ removed_at: nowIso, removed_by: admin.id })
        .eq('recipe_id', recipeId)
        .eq('group_id', body.archiveGroupId)
        .is('removed_at', null);

      if (removeError) {
        return NextResponse.json({ error: removeError.message }, { status: 500 });
      }

      // Reason: if recipe no longer belongs to any active group, soft-delete it entirely
      const { data: remaining, error: remainingError } = await supabase
        .from('group_recipes')
        .select('group_id')
        .eq('recipe_id', recipeId)
        .is('removed_at', null)
        .limit(1);

      if (remainingError) {
        return NextResponse.json({ error: remainingError.message }, { status: 500 });
      }

      const fullySoftDeleted = !remaining || remaining.length === 0;
      if (fullySoftDeleted) {
        const { error: deleteError } = await supabase
          .from('guest_recipes')
          .update({ deleted_at: nowIso })
          .eq('id', recipeId);

        if (deleteError) {
          return NextResponse.json({ error: deleteError.message }, { status: 500 });
        }
      }

      return NextResponse.json({ success: true, archived: true, fullySoftDeleted });
    }

    // ============================================================
    // RESTORE: clear deleted_at and removed_at so recipe is active again
    // ============================================================
    if (body.restore) {
      // Reason: Both guest_recipes.deleted_at and group_recipes.removed_at must be cleared
      // to fully restore an archived recipe back to its group
      const { data: restoredRecipe, error: restoreRecipeError } = await supabase
        .from('guest_recipes')
        .update({ deleted_at: null })
        .eq('id', recipeId)
        .select('guest_id, submission_status')
        .maybeSingle();

      if (restoreRecipeError) {
        return NextResponse.json({ error: restoreRecipeError.message }, { status: 500 });
      }

      const { error: restoreGroupError } = await supabase
        .from('group_recipes')
        .update({ removed_at: null, removed_by: null })
        .eq('recipe_id', recipeId);

      if (restoreGroupError) {
        return NextResponse.json({ error: restoreGroupError.message }, { status: 500 });
      }

      // Reason: Recompute guests.recipes_received from truth instead of trying
      // to invert the original delete. Handles both user-delete (which decrements)
      // and admin-archive (which doesn't) origins symmetrically.
      if (restoredRecipe?.guest_id) {
        const { count } = await supabase
          .from('guest_recipes')
          .select('id', { count: 'exact', head: true })
          .eq('guest_id', restoredRecipe.guest_id)
          .eq('submission_status', 'submitted')
          .is('deleted_at', null);

        const { data: guest } = await supabase
          .from('guests')
          .select('number_of_recipes, status')
          .eq('id', restoredRecipe.guest_id)
          .maybeSingle();

        if (guest) {
          const actualReceived = count || 0;
          const expected = guest.number_of_recipes || 0;
          const newStatus = actualReceived >= expected ? 'submitted' : (actualReceived > 0 ? 'responded' : guest.status);

          const { error: counterError } = await supabase
            .from('guests')
            .update({
              recipes_received: actualReceived,
              status: newStatus,
              updated_at: new Date().toISOString(),
            })
            .eq('id', restoredRecipe.guest_id);

          if (counterError) {
            console.error('restore: failed to recompute guests counter', counterError);
          }
        }
      }

      return NextResponse.json({ success: true, restored: true });
    }

    // ============================================================
    // DELETE IMAGE: remove original + print-ready image safely
    // ============================================================
    if (body.deleteImage) {
      // 1) Load current URLs for this recipe
      const { data: recipe, error: recipeError } = await supabase
        .from('guest_recipes')
        .select('id, generated_image_url, generated_image_url_print')
        .eq('id', recipeId)
        .maybeSingle();

      if (recipeError) {
        return NextResponse.json({ error: recipeError.message }, { status: 500 });
      }

      const urls: string[] = [];
      if (recipe?.generated_image_url) urls.push(recipe.generated_image_url);
      if (recipe?.generated_image_url_print) urls.push(recipe.generated_image_url_print);

      // 2) Derive safe storage paths ONLY for this recipe
      const marker = '/storage/v1/object/public/recipes/';
      const pathsToDelete: string[] = [];

      for (const url of urls) {
        if (typeof url !== 'string') continue;
        const idx = url.indexOf(marker);
        if (idx < 0) continue;

        const path = url.substring(idx + marker.length);

        // SECURITY: only allow generated/ or print/ paths that contain this recipeId and no traversal
        if (
          (path.startsWith('generated/') || path.startsWith('print/')) &&
          path.includes(recipeId) &&
          !path.includes('..')
        ) {
          pathsToDelete.push(path);
        } else {
          console.warn(
            `Security: not deleting unexpected path for recipe ${recipeId}:`,
            path
          );
        }
      }

      // 3) Delete files from storage (images only)
      if (pathsToDelete.length > 0) {
        const { error: removeError } = await supabase.storage
          .from('recipes')
          .remove(pathsToDelete);

        if (removeError) {
          console.error('Error deleting image files:', removeError);
          // We continue anyway to clear DB fields, but return the error message
        }
      }

      // 4) Clear image-related fields from guest_recipes (but NEVER touch text/recipe data)
      const { error: clearError } = await supabase
        .from('guest_recipes')
        .update({
          generated_image_url: null,
          generated_image_url_print: null,
          image_upscale_status: null,
          image_dimensions: null,
        })
        .eq('id', recipeId);

      if (clearError) {
        return NextResponse.json({ error: clearError.message }, { status: 500 });
      }

      // 5) Optional: mark image_generated as false in production_status, recipe text remains untouched
      const { error: statusError } = await supabase
        .from('recipe_production_status')
        .update({ image_generated: false })
        .eq('recipe_id', recipeId);

      if (statusError) {
        console.warn('Error clearing image_generated status:', statusError);
      }

      return NextResponse.json({
        success: true,
        deletedFiles: pathsToDelete,
      });
    }

    // Handle generated_image_url update on guest_recipes table
    if (body.generated_image_url !== undefined) {
      const updateData: { generated_image_url: string; generated_image_url_print?: null; image_upscale_status?: null; image_dimensions?: null } = {
        generated_image_url: body.generated_image_url,
      };
      
      // When replacing the image, clear the print-ready version and reset upscale status
      // (upscale Edge Function will run when it sees generated_image_url change)
      if (body.clearPrintReady !== false) {
        updateData.generated_image_url_print = null;
        updateData.image_upscale_status = null;
        updateData.image_dimensions = null;
      }
      
      const { error: imageUrlError } = await supabase
        .from('guest_recipes')
        .update(updateData)
        .eq('id', recipeId);

      if (imageUrlError) {
        return NextResponse.json({ error: imageUrlError.message }, { status: 500 });
      }
    }

    // Handle production status updates (existing functionality)
    const productionStatusUpdates: RecipeProductionStatusUpdate = {};
    if (body.text_finalized_in_indesign !== undefined) {
      productionStatusUpdates.text_finalized_in_indesign = body.text_finalized_in_indesign;
    }
    if (body.image_generated !== undefined) {
      productionStatusUpdates.image_generated = body.image_generated;
    }
    if (body.image_placed_in_indesign !== undefined) {
      productionStatusUpdates.image_placed_in_indesign = body.image_placed_in_indesign;
    }
    if (body.operations_notes !== undefined) {
      productionStatusUpdates.operations_notes = body.operations_notes;
    }
    if (body.needs_review !== undefined) {
      productionStatusUpdates.needs_review = body.needs_review;
      // Reason: an explicit admin toggle supersedes the auto "Guest edited the original"
      // reason — clear it so the badge doesn't linger misleadingly after a human acts on it.
      productionStatusUpdates.needs_review_reason = null;
    }
    if (body.manually_cleared !== undefined) {
      productionStatusUpdates.manually_cleared = body.manually_cleared;
    }

    if (Object.keys(productionStatusUpdates).length > 0) {
      const { data, error } = await updateRecipeProductionStatusAdmin(recipeId, productionStatusUpdates);
      if (error) {
        return NextResponse.json({ error }, { status: 500 });
      }
      productionStatusData = data;
    }

    // Handle print_ready updates (new functionality)
    if (body.printReady) {
      // First, get existing print_ready record to preserve fields we're not updating
      const { data: existingPrintReady } = await supabase
        .from('recipe_print_ready')
        .select('*')
        .eq('recipe_id', recipeId)
        .maybeSingle();

      const updateData: {
        recipe_id: string;
        ingredients_clean?: string;
        instructions_clean?: string;
        note_clean?: string | null;
        recipe_name_clean?: string;
        detected_language?: string | null;
        cleaning_version?: number | null;
        updated_at?: string;
      } = {
        recipe_id: recipeId,
        updated_at: new Date().toISOString(),
      };

      if (body.printReady.ingredients_clean !== undefined) {
        updateData.ingredients_clean = body.printReady.ingredients_clean;
      }
      if (body.printReady.instructions_clean !== undefined) {
        updateData.instructions_clean = body.printReady.instructions_clean;
      }
      if (body.printReady.note_clean !== undefined) {
        updateData.note_clean = body.printReady.note_clean;
      }

      // Snapshot the "before" state for the audit trail. Reason: prefer the
      // existing clean version; if none exists yet, fall back to the guest's
      // original — that's what the editor was shown as the starting point.
      let beforeName = existingPrintReady?.recipe_name_clean || '';
      let beforeIngredients = existingPrintReady?.ingredients_clean ?? '';
      let beforeInstructions = existingPrintReady?.instructions_clean ?? '';
      let beforeNotes: string | null = existingPrintReady?.note_clean ?? null;

      // Preserve existing fields if they exist
      if (existingPrintReady) {
        updateData.recipe_name_clean = existingPrintReady.recipe_name_clean || '';
        updateData.detected_language = existingPrintReady.detected_language;
        updateData.cleaning_version = existingPrintReady.cleaning_version;
      } else {
        // If no existing record, seed from the guest's original recipe
        const { data: recipe } = await supabase
          .from('guest_recipes')
          .select('recipe_name, ingredients, instructions, comments')
          .eq('id', recipeId)
          .single();

        updateData.recipe_name_clean = recipe?.recipe_name || '';
        updateData.detected_language = null;
        updateData.cleaning_version = null;

        beforeName = recipe?.recipe_name || '';
        beforeIngredients = recipe?.ingredients || '';
        beforeInstructions = recipe?.instructions || '';
        beforeNotes = recipe?.comments || null;
      }

      const { data: printReadyResult, error: printReadyError } = await supabase
        .from('recipe_print_ready')
        .upsert(updateData, { onConflict: 'recipe_id' })
        .select()
        .single();

      if (printReadyError) {
        return NextResponse.json({ error: printReadyError.message }, { status: 500 });
      }
      printReadyData = printReadyResult;

      // Audit trail: record the edit in recipe_edit_history (edit_target = 'print_ready').
      // Reason: mirrors the Content editor so Operations edits are traceable too.
      const afterIngredients = body.printReady.ingredients_clean !== undefined
        ? body.printReady.ingredients_clean
        : beforeIngredients;
      const afterInstructions = body.printReady.instructions_clean !== undefined
        ? body.printReady.instructions_clean
        : beforeInstructions;
      const afterNotes: string | null = body.printReady.note_clean !== undefined
        ? body.printReady.note_clean
        : beforeNotes;

      const hasChanges =
        afterIngredients !== beforeIngredients ||
        afterInstructions !== beforeInstructions ||
        afterNotes !== beforeNotes;

      if (hasChanges) {
        const { error: historyError } = await supabase
          .from('recipe_edit_history')
          .insert({
            recipe_id: recipeId,
            edited_by: admin.id,
            edit_target: 'print_ready',
            recipe_name_before: beforeName,
            ingredients_before: beforeIngredients,
            instructions_before: beforeInstructions,
            comments_before: beforeNotes,
            recipe_name_after: updateData.recipe_name_clean,
            ingredients_after: afterIngredients,
            instructions_after: afterInstructions,
            comments_after: afterNotes,
            edit_reason: 'Edited in Operations',
          });

        if (historyError) {
          console.error('Error writing recipe_edit_history:', historyError);
          // Reason: audit logging is best-effort — don't fail the edit if it errors
        }
      }

      // If markNeedsReview is true, update production_status to mark as needing review
      if (body.markNeedsReview) {
        const noteDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        const noteText = `Ingredients/Steps edited in Operations on ${noteDate}`;
        
        // Get existing production status
        const { data: existingStatus } = await supabase
          .from('recipe_production_status')
          .select('operations_notes')
          .eq('recipe_id', recipeId)
          .maybeSingle();

        const existingNote = existingStatus?.operations_notes || '';
        const newNote = existingNote ? `${existingNote}\n${noteText}` : noteText;

        const { error: reviewError } = await supabase
          .from('recipe_production_status')
          .upsert({
            recipe_id: recipeId,
            needs_review: true,
            // Reason: this review is now due to an Operations edit (tracked in operations_notes),
            // so clear any stale "Guest edited the original" auto-reason.
            needs_review_reason: null,
            operations_notes: newNote,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'recipe_id' });

        if (reviewError) {
          console.error('Error marking needs review:', reviewError);
          // Don't fail the whole request if this fails
        }
      }
    }
    
    return NextResponse.json({
      production_status: productionStatusData,
      print_ready: printReadyData,
    });
  } catch (error) {
    console.error('Error in /api/admin/operations/recipes/[recipeId] PATCH:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unauthorized' }, 
      { status: 401 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ recipeId: string }> }
) {
  try {
    // Verify admin authentication
    await requireAdminAuth();
    
    const { recipeId } = await params;

    const { data, error } = await markRecipeAsReviewedAdmin(recipeId);
    
    if (error) {
      return NextResponse.json({ error }, { status: 500 });
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in /api/admin/operations/recipes/[recipeId] POST:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unauthorized' }, 
      { status: 401 }
    );
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ recipeId: string }> }
) {
  try {
    await requireAdminAuth();
    
    const { recipeId } = await params;

    if (!recipeId) {
      return NextResponse.json({ error: 'recipeId is required' }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();

    const { data, error } = await supabase
      .from('guest_recipes')
      .select(`
        *,
        guests (*),
        profiles!guest_recipes_user_id_fkey (*),
        recipe_production_status (*),
        group_recipes (*),
        midjourney_prompts (*),
        recipe_print_ready (*)
      `)
      .eq('id', recipeId)
      .is('deleted_at', null)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in /api/admin/operations/recipes/[recipeId] GET:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unauthorized' },
      { status: 401 }
    );
  }
}

