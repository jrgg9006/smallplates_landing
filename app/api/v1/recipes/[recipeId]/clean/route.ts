import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseRoute } from '@/lib/supabase/route';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

// Reason: mirrors canEdit in RecipeDetailsModal — creator OR member of any group
// the recipe is active in. Uses the admin client so RLS/column grants on
// recipe_print_ready never block a legitimate edit.
async function canUserEditRecipe(userId: string, recipeId: string): Promise<boolean> {
  const admin = createSupabaseAdminClient();

  const { data: recipe } = await admin
    .from('guest_recipes')
    .select('user_id')
    .eq('id', recipeId)
    .is('deleted_at', null)
    .maybeSingle();

  if (!recipe) return false;
  if (recipe.user_id === userId) return true;

  const { data: groupRecipes } = await admin
    .from('group_recipes')
    .select('group_id')
    .eq('recipe_id', recipeId)
    .is('removed_at', null);

  const groupIds = (groupRecipes || []).map((g) => g.group_id);
  if (groupIds.length === 0) return false;

  const { data: membership } = await admin
    .from('group_members')
    .select('group_id')
    .eq('profile_id', userId)
    .in('group_id', groupIds)
    .limit(1);

  return !!(membership && membership.length > 0);
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ recipeId: string }> }
) {
  try {
    const supabase = await createSupabaseRoute();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { recipeId } = await params;
    const canEdit = await canUserEditRecipe(user.id, recipeId);
    if (!canEdit) {
      return NextResponse.json({ error: 'Not allowed' }, { status: 403 });
    }

    const admin = createSupabaseAdminClient();
    const { data: printReady } = await admin
      .from('recipe_print_ready')
      .select('recipe_name_clean, ingredients_clean, instructions_clean, note_clean')
      .eq('recipe_id', recipeId)
      .maybeSingle();

    return NextResponse.json({ print_ready: printReady || null, can_edit: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ recipeId: string }> }
) {
  try {
    const supabase = await createSupabaseRoute();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { recipeId } = await params;
    const canEdit = await canUserEditRecipe(user.id, recipeId);
    if (!canEdit) {
      return NextResponse.json({ error: 'Not allowed' }, { status: 403 });
    }

    const body = await req.json();
    const { recipe_name, ingredients, instructions, note } = body as {
      recipe_name: string; ingredients: string; instructions: string; note: string | null;
    };

    if (!recipe_name?.trim() || !ingredients?.trim() || !instructions?.trim()) {
      return NextResponse.json(
        { error: 'Name, ingredients and instructions are required' },
        { status: 400 }
      );
    }

    const admin = createSupabaseAdminClient();

    // Snapshot the current clean version for the audit trail.
    const { data: current } = await admin
      .from('recipe_print_ready')
      .select('recipe_name_clean, ingredients_clean, instructions_clean, note_clean')
      .eq('recipe_id', recipeId)
      .maybeSingle();

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
        recipe_name_after: recipe_name.trim(),
        ingredients_after: ingredients.trim(),
        instructions_after: instructions.trim(),
        comments_after: note?.trim() || null,
        edit_reason: 'Edited by recipe owner (clean version)',
      });
    if (historyError) {
      return NextResponse.json({ error: historyError.message }, { status: 500 });
    }

    const printReady = {
      recipe_name_clean: recipe_name.trim(),
      ingredients_clean: ingredients.trim(),
      instructions_clean: instructions.trim(),
      note_clean: note?.trim() || null,
    };

    const { error: upsertError } = await admin
      .from('recipe_print_ready')
      .upsert(
        { recipe_id: recipeId, ...printReady, updated_at: new Date().toISOString() },
        { onConflict: 'recipe_id' }
      );
    if (upsertError) {
      return NextResponse.json({ error: upsertError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, print_ready: printReady });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 }
    );
  }
}
