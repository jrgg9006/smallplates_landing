import { NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth/admin';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  try {
    await requireAdminAuth();
    const supabase = createSupabaseAdminClient();

    const { data: groups, error } = await supabase
      .from('groups')
      .select(`
        id,
        name,
        couple_display_name,
        created_by,
        created_at,
        profiles!groups_created_by_fkey(email, full_name)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get guest and recipe counts per group
    const groupIds = (groups || []).map(g => g.id);

    const { data: guestCounts } = await supabase
      .from('guests')
      .select('group_id')
      .in('group_id', groupIds)
      .eq('is_archived', false);

    const { data: recipeCounts } = await supabase
      .from('group_recipes')
      .select('group_id')
      .in('group_id', groupIds)
      .is('removed_at' as string, null);

    const guestCountMap: Record<string, number> = {};
    const recipeCountMap: Record<string, number> = {};

    (guestCounts || []).forEach(g => {
      if (g.group_id) {
        guestCountMap[g.group_id] = (guestCountMap[g.group_id] || 0) + 1;
      }
    });

    (recipeCounts || []).forEach(r => {
      if (r.group_id) {
        recipeCountMap[r.group_id] = (recipeCountMap[r.group_id] || 0) + 1;
      }
    });

    const result = (groups || []).map(g => ({
      ...g,
      guest_count: guestCountMap[g.id] || 0,
      recipe_count: recipeCountMap[g.id] || 0,
    }));

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unauthorized' },
      { status: 401 }
    );
  }
}
