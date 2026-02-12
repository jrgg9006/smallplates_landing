import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth/admin';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    await requireAdminAuth();
    const { groupId } = await params;
    const supabase = createSupabaseAdminClient();

    // Fetch guests for this group
    const { data: guests, error: guestsError } = await supabase
      .from('guests')
      .select('id, first_name, last_name, email, number_of_recipes, recipes_received, source, is_self')
      .eq('group_id', groupId)
      .eq('is_archived', false)
      .order('created_at', { ascending: false });

    if (guestsError) {
      return NextResponse.json({ error: guestsError.message }, { status: 500 });
    }

    // Fetch active recipes in this group
    const { data: groupRecipes, error: grError } = await supabase
      .from('group_recipes')
      .select('recipe_id, added_by, added_at')
      .eq('group_id', groupId)
      .is('removed_at' as string, null);

    if (grError) {
      return NextResponse.json({ error: grError.message }, { status: 500 });
    }

    const recipeIds = (groupRecipes || []).map(gr => gr.recipe_id);

    let recipes: Record<string, unknown>[] = [];
    if (recipeIds.length > 0) {
      const { data: recipeData, error: recipeError } = await supabase
        .from('guest_recipes')
        .select(`
          id, recipe_name, ingredients, instructions, comments,
          submission_status, created_at, guest_id,
          guests(first_name, last_name, email, is_self)
        `)
        .in('id', recipeIds)
        .order('created_at', { ascending: false });

      if (recipeError) {
        return NextResponse.json({ error: recipeError.message }, { status: 500 });
      }

      // Merge group_recipes metadata
      const grMap = new Map(
        (groupRecipes || []).map(gr => [gr.recipe_id, gr])
      );
      recipes = (recipeData || []).map(r => ({
        ...r,
        added_by: grMap.get(r.id)?.added_by,
        added_at: grMap.get(r.id)?.added_at,
      }));
    }

    return NextResponse.json({ guests: guests || [], recipes });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unauthorized' },
      { status: 401 }
    );
  }
}
