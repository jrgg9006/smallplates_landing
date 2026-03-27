import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseRoute } from '@/lib/supabase/route';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import type { RecipeForReview } from '@/lib/types/database';

async function verifyGroupMember(userId: string, groupId: string) {
  const admin = createSupabaseAdminClient();

  // Reason: User can be a group member OR the group creator
  const { data: member } = await admin
    .from('group_members')
    .select('profile_id')
    .eq('group_id', groupId)
    .eq('profile_id', userId)
    .maybeSingle();

  if (member) return true;

  const { data: group } = await admin
    .from('groups')
    .select('created_by')
    .eq('id', groupId)
    .eq('created_by', userId)
    .maybeSingle();

  return !!group;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const supabase = await createSupabaseRoute();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { groupId } = await params;
    const isMember = await verifyGroupMember(user.id, groupId);
    if (!isMember) {
      return NextResponse.json({ error: 'Not a group member' }, { status: 403 });
    }

    const admin = createSupabaseAdminClient();

    // Reason: Get active recipe IDs for this group
    const { data: groupRecipes, error: grError } = await admin
      .from('group_recipes')
      .select('recipe_id')
      .eq('group_id', groupId)
      .is('removed_at', null);

    if (grError) {
      return NextResponse.json({ error: grError.message }, { status: 500 });
    }
    if (!groupRecipes || groupRecipes.length === 0) {
      return NextResponse.json({ recipes: [] });
    }

    const recipeIds = groupRecipes.map(gr => gr.recipe_id);

    // Fetch recipes with guest info
    const { data: recipes, error: recipeError } = await admin
      .from('guest_recipes')
      .select(`
        id, recipe_name, ingredients, instructions, comments,
        upload_method, document_urls,
        guests(first_name, last_name, printed_name)
      `)
      .in('id', recipeIds)
      .is('deleted_at', null);

    if (recipeError) {
      return NextResponse.json({ error: recipeError.message }, { status: 500 });
    }

    // Batch-fetch print-ready versions
    const { data: printReady } = await admin
      .from('recipe_print_ready')
      .select('recipe_id, recipe_name_clean, ingredients_clean, instructions_clean, note_clean')
      .in('recipe_id', recipeIds);

    const printReadyMap = (printReady || []).reduce<Record<string, RecipeForReview['print_ready']>>((acc, pr) => {
      acc[pr.recipe_id] = {
        recipe_name_clean: pr.recipe_name_clean,
        ingredients_clean: pr.ingredients_clean,
        instructions_clean: pr.instructions_clean,
        note_clean: pr.note_clean,
      };
      return acc;
    }, {});

    const result: RecipeForReview[] = (recipes || []).map((r: any) => ({
      id: r.id,
      recipe_name: r.recipe_name,
      ingredients: r.ingredients,
      instructions: r.instructions,
      comments: r.comments,
      upload_method: r.upload_method,
      document_urls: r.document_urls,
      guests: r.guests || null,
      print_ready: printReadyMap[r.id] || null,
    }));

    return NextResponse.json({ recipes: result });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const supabase = await createSupabaseRoute();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { groupId } = await params;
    const isMember = await verifyGroupMember(user.id, groupId);
    if (!isMember) {
      return NextResponse.json({ error: 'Not a group member' }, { status: 403 });
    }

    const body = await req.json();
    const { recipeId, recipe_name, ingredients, instructions, note } = body;

    if (!recipeId) {
      return NextResponse.json({ error: 'recipeId is required' }, { status: 400 });
    }

    const admin = createSupabaseAdminClient();

    // Reason: Verify recipe belongs to this group
    const { data: groupRecipe } = await admin
      .from('group_recipes')
      .select('recipe_id')
      .eq('group_id', groupId)
      .eq('recipe_id', recipeId)
      .is('removed_at', null)
      .maybeSingle();

    if (!groupRecipe) {
      return NextResponse.json({ error: 'Recipe not in this group' }, { status: 404 });
    }

    // Get current print-ready values for audit trail
    const { data: current } = await admin
      .from('recipe_print_ready')
      .select('recipe_name_clean, ingredients_clean, instructions_clean, note_clean')
      .eq('recipe_id', recipeId)
      .maybeSingle();

    // Audit trail
    const { error: historyError } = await admin
      .from('recipe_edit_history')
      .insert({
        recipe_id: recipeId,
        edited_by: user.id,
        edit_target: 'print_ready',
        recipe_name_before: current?.recipe_name_clean || '',
        ingredients_before: current?.ingredients_clean || '',
        instructions_before: current?.instructions_clean || '',
        comments_before: current?.note_clean || null,
        recipe_name_after: recipe_name,
        ingredients_after: ingredients,
        instructions_after: instructions,
        comments_after: note || null,
        edit_reason: 'User edit during book review',
      });

    if (historyError) {
      return NextResponse.json({ error: historyError.message }, { status: 500 });
    }

    // Upsert print-ready version
    const { error: upsertError } = await admin
      .from('recipe_print_ready')
      .upsert({
        recipe_id: recipeId,
        recipe_name_clean: recipe_name,
        ingredients_clean: ingredients,
        instructions_clean: instructions,
        note_clean: note || null,
      }, { onConflict: 'recipe_id' });

    if (upsertError) {
      return NextResponse.json({ error: upsertError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      print_ready: {
        recipe_name_clean: recipe_name,
        ingredients_clean: ingredients,
        instructions_clean: instructions,
        note_clean: note || null,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 }
    );
  }
}
