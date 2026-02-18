import { NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth/admin';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  try {
    await requireAdminAuth();
    const supabase = createSupabaseAdminClient();

    // Fetch all groups with couple info
    const { data: groups, error: groupsError } = await supabase
      .from('groups')
      .select(`
        id,
        name,
        couple_display_name,
        couple_first_name,
        partner_first_name,
        wedding_date,
        book_status,
        book_notes,
        book_reviewed_at,
        created_at
      `)
      .order('created_at', { ascending: false });

    if (groupsError) {
      return NextResponse.json({ error: groupsError.message }, { status: 500 });
    }

    const groupIds = (groups || []).map(g => g.id);

    if (groupIds.length === 0) {
      return NextResponse.json([]);
    }

    // Fetch contributor counts (guests with recipes, not archived)
    const { data: contributors } = await supabase
      .from('guests')
      .select('group_id')
      .in('group_id', groupIds)
      .eq('is_archived', false)
      .gt('recipes_received', 0);

    // Fetch recipe counts
    const { data: recipes } = await supabase
      .from('guest_recipes')
      .select('group_id')
      .in('group_id', groupIds);

    // Fetch all recipes with image info to determine truly print-ready ones
    // (clean text + print image)
    const { data: allRecipes } = await supabase
      .from('guest_recipes')
      .select('id, group_id, generated_image_url_print')
      .in('group_id', groupIds);

    const recipeIds = (allRecipes || []).map(r => r.id);
    const printReadyMap: Record<string, number> = {};

    if (recipeIds.length > 0) {
      const { data: printReady } = await supabase
        .from('recipe_print_ready')
        .select('recipe_id')
        .in('recipe_id', recipeIds);

      const { data: prodStatus } = await supabase
        .from('recipe_production_status')
        .select('recipe_id, needs_review')
        .in('recipe_id', recipeIds);

      const cleanRecipeIds = new Set((printReady || []).map(pr => pr.recipe_id));
      const needsReviewIds = new Set(
        (prodStatus || []).filter(ps => ps.needs_review).map(ps => ps.recipe_id)
      );

      // Reason: "print-ready" = clean text + print image + no ops review needed
      (allRecipes || []).forEach(r => {
        if (r.group_id && cleanRecipeIds.has(r.id) && r.generated_image_url_print && !needsReviewIds.has(r.id)) {
          printReadyMap[r.group_id] = (printReadyMap[r.group_id] || 0) + 1;
        }
      });
    }

    // Fetch owner names per group
    const { data: members } = await supabase
      .from('group_members')
      .select('group_id, role, profiles!group_members_profile_id_fkey(full_name, email)')
      .in('group_id', groupIds)
      .eq('role', 'owner');

    // Build count maps
    const contributorCountMap: Record<string, number> = {};
    const recipeCountMap: Record<string, number> = {};
    const ownerNameMap: Record<string, string[]> = {};

    (contributors || []).forEach(g => {
      if (g.group_id) {
        contributorCountMap[g.group_id] = (contributorCountMap[g.group_id] || 0) + 1;
      }
    });

    (recipes || []).forEach(r => {
      if (r.group_id) {
        recipeCountMap[r.group_id] = (recipeCountMap[r.group_id] || 0) + 1;
      }
    });

    (members || []).forEach(m => {
      if (m.group_id) {
        const profile = m.profiles as unknown as { full_name: string | null; email: string } | null;
        const name = profile?.full_name || profile?.email || 'Unknown';
        if (!ownerNameMap[m.group_id]) ownerNameMap[m.group_id] = [];
        ownerNameMap[m.group_id].push(name);
      }
    });

    const result = (groups || []).map(g => ({
      id: g.id,
      name: g.name,
      couple_display_name: g.couple_display_name ||
        `${g.couple_first_name || ''} & ${g.partner_first_name || ''}`.trim() || g.name,
      wedding_date: g.wedding_date,
      book_status: g.book_status || 'active',
      book_notes: g.book_notes,
      book_reviewed_at: g.book_reviewed_at,
      contributor_count: contributorCountMap[g.id] || 0,
      recipe_count: recipeCountMap[g.id] || 0,
      print_ready_count: printReadyMap[g.id] || 0,
      owner_names: ownerNameMap[g.id] || [],
      created_at: g.created_at,
    }));

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unauthorized' },
      { status: 401 }
    );
  }
}
