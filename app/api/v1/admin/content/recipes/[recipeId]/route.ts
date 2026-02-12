import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth/admin';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ recipeId: string }> }
) {
  try {
    await requireAdminAuth();
    const { recipeId } = await params;
    const supabase = createSupabaseAdminClient();

    const { data: recipe, error: recipeError } = await supabase
      .from('guest_recipes')
      .select(`
        id, recipe_name, ingredients, instructions, comments,
        submission_status, created_at, updated_at, guest_id,
        guests(first_name, last_name, email, is_self)
      `)
      .eq('id', recipeId)
      .single();

    if (recipeError) {
      return NextResponse.json({ error: recipeError.message }, { status: 404 });
    }

    // Fetch print-ready version (may not exist)
    const { data: printReadyRaw } = await supabase
      .from('recipe_print_ready')
      .select('recipe_name_clean, ingredients_clean, instructions_clean, detected_language, cleaning_version, updated_at')
      .eq('recipe_id', recipeId)
      .maybeSingle();

    const { data: history } = await supabase
      .from('recipe_edit_history')
      .select(`
        id, edited_at, edit_reason, edit_target,
        recipe_name_before, ingredients_before, instructions_before, comments_before,
        recipe_name_after, ingredients_after, instructions_after, comments_after,
        profiles!recipe_edit_history_edited_by_fkey(email, full_name)
      `)
      .eq('recipe_id', recipeId)
      .order('edited_at', { ascending: false });

    return NextResponse.json({
      recipe,
      print_ready: printReadyRaw || null,
      history: history || [],
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unauthorized' },
      { status: 401 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ recipeId: string }> }
) {
  try {
    const admin = await requireAdminAuth();
    const { recipeId } = await params;
    const supabase = createSupabaseAdminClient();

    const body = await req.json();
    const { recipe_name, ingredients, instructions, comments, edit_reason, target } = body;
    const editTarget: 'original' | 'print_ready' = target === 'print_ready' ? 'print_ready' : 'original';

    if (editTarget === 'print_ready') {
      // Editing the print-ready version
      const { data: current } = await supabase
        .from('recipe_print_ready')
        .select('recipe_name_clean, ingredients_clean, instructions_clean')
        .eq('recipe_id', recipeId)
        .single();

      if (!current) {
        return NextResponse.json({ error: 'No print-ready version exists for this recipe' }, { status: 404 });
      }

      // Audit trail
      const { error: historyError } = await supabase
        .from('recipe_edit_history')
        .insert({
          recipe_id: recipeId,
          edited_by: admin.id,
          edit_target: 'print_ready',
          recipe_name_before: current.recipe_name_clean,
          ingredients_before: current.ingredients_clean,
          instructions_before: current.instructions_clean,
          comments_before: null,
          recipe_name_after: recipe_name,
          ingredients_after: ingredients,
          instructions_after: instructions,
          comments_after: null,
          edit_reason: edit_reason || null,
        });

      if (historyError) {
        return NextResponse.json({ error: historyError.message }, { status: 500 });
      }

      // Update print-ready
      const { error: updateError } = await supabase
        .from('recipe_print_ready')
        .update({
          recipe_name_clean: recipe_name,
          ingredients_clean: ingredients,
          instructions_clean: instructions,
        })
        .eq('recipe_id', recipeId);

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, target: 'print_ready' });
    }

    // Editing the original (guest_recipes)
    const { data: current, error: fetchError } = await supabase
      .from('guest_recipes')
      .select('recipe_name, ingredients, instructions, comments')
      .eq('id', recipeId)
      .single();

    if (fetchError || !current) {
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
    }

    // Audit trail
    const { error: historyError } = await supabase
      .from('recipe_edit_history')
      .insert({
        recipe_id: recipeId,
        edited_by: admin.id,
        edit_target: 'original',
        recipe_name_before: current.recipe_name,
        ingredients_before: current.ingredients,
        instructions_before: current.instructions,
        comments_before: current.comments,
        recipe_name_after: recipe_name,
        ingredients_after: ingredients,
        instructions_after: instructions,
        comments_after: comments || null,
        edit_reason: edit_reason || null,
      });

    if (historyError) {
      return NextResponse.json({ error: historyError.message }, { status: 500 });
    }

    // Update original
    const { data: updated, error: updateError } = await supabase
      .from('guest_recipes')
      .update({
        recipe_name,
        ingredients,
        instructions,
        comments: comments || null,
      })
      .eq('id', recipeId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Mark needs_review in production status (upsert)
    await supabase
      .from('recipe_production_status')
      .upsert(
        { recipe_id: recipeId, needs_review: true },
        { onConflict: 'recipe_id' }
      );

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unauthorized' },
      { status: 401 }
    );
  }
}
