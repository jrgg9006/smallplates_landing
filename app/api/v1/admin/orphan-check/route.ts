import { NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth/admin';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

// Reason: Detects recipes that exist but aren't linked to any group — invisible in Book Production
export async function GET() {
  try {
    await requireAdminAuth();
    const supabase = createSupabaseAdminClient();

    const { data: orphans, error } = await supabase
      .from('guest_recipes')
      .select(`
        id,
        recipe_name,
        group_id,
        created_at,
        guests (first_name, last_name)
      `)
      .is('deleted_at', null)
      .not('id', 'in', `(SELECT recipe_id FROM group_recipes WHERE removed_at IS NULL)`)
      .order('created_at', { ascending: false });

    if (error) {
      // Reason: The subquery filter may not work with all Supabase clients — fall back to manual check
      const { data: allRecipes } = await supabase
        .from('guest_recipes')
        .select('id, recipe_name, group_id, created_at, guests (first_name, last_name)')
        .is('deleted_at', null);

      const { data: linkedRecipes } = await supabase
        .from('group_recipes')
        .select('recipe_id')
        .is('removed_at', null);

      const linkedIds = new Set((linkedRecipes || []).map(r => r.recipe_id));
      const orphanList = (allRecipes || []).filter(r => !linkedIds.has(r.id));

      return NextResponse.json({
        count: orphanList.length,
        orphans: orphanList.slice(0, 50),
      });
    }

    return NextResponse.json({
      count: (orphans || []).length,
      orphans: (orphans || []).slice(0, 50),
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
