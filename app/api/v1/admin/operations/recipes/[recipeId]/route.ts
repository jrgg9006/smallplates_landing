import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth/admin';
import { 
  updateRecipeProductionStatusAdmin,
  markRecipeAsReviewedAdmin 
} from '@/lib/supabase/operations';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import type { RecipeProductionStatusUpdate } from '@/lib/types/database';

interface PatchRequestBody extends RecipeProductionStatusUpdate {
  printReady?: {
    ingredients_clean?: string;
    instructions_clean?: string;
  };
  markNeedsReview?: boolean;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ recipeId: string }> }
) {
  try {
    // Verify admin authentication
    await requireAdminAuth();
    
    const { recipeId } = await params;
    const body = await req.json() as PatchRequestBody;

    const supabase = createSupabaseAdminClient();
    let productionStatusData = null;
    let printReadyData = null;

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

      // Preserve existing fields if they exist
      if (existingPrintReady) {
        updateData.recipe_name_clean = existingPrintReady.recipe_name_clean || '';
        updateData.detected_language = existingPrintReady.detected_language;
        updateData.cleaning_version = existingPrintReady.cleaning_version;
      } else {
        // If no existing record, get recipe_name from guest_recipes
        const { data: recipe } = await supabase
          .from('guest_recipes')
          .select('recipe_name')
          .eq('id', recipeId)
          .single();
        
        updateData.recipe_name_clean = recipe?.recipe_name || '';
        updateData.detected_language = null;
        updateData.cleaning_version = null;
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

