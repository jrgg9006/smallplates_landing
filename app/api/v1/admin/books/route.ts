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
        book_closed_by_user,
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

    // Reason: group_recipes is the source of truth for group membership,
    // not guest_recipes.group_id which can be stale for linked/moved recipes
    const { data: activeGroupRecipes } = await supabase
      .from('group_recipes')
      .select('group_id, recipe_id')
      .in('group_id', groupIds)
      .is('removed_at', null);

    const activeRecipeIds = (activeGroupRecipes || []).map(gr => gr.recipe_id);

    // Fetch recipe details for active group_recipes entries (exclude soft-deleted)
    const { data: allRecipes } = activeRecipeIds.length > 0
      ? await supabase
          .from('guest_recipes')
          .select('id, guest_id, generated_image_url_print, book_review_status')
          .in('id', activeRecipeIds)
          .is('deleted_at', null)
      : { data: null };

    // Build a recipe_id -> group_id map from group_recipes
    const recipeToGroupMap = new Map<string, string>();
    (activeGroupRecipes || []).forEach(gr => {
      recipeToGroupMap.set(gr.recipe_id, gr.group_id);
    });

    const activeRecipeIdsSet = new Set((allRecipes || []).map(r => r.id));
    const printReadyMap: Record<string, number> = {};

    if (activeRecipeIdsSet.size > 0) {
      const recipeIds = Array.from(activeRecipeIdsSet);

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

      // Reason: "print-ready" = clean text + print image + no ops review needed + not flagged in book review
      (allRecipes || []).forEach(r => {
        const groupId = recipeToGroupMap.get(r.id);
        const reviewStatus = (r as Record<string, unknown>).book_review_status as string | null;
        if (
          groupId &&
          cleanRecipeIds.has(r.id) &&
          r.generated_image_url_print &&
          !needsReviewIds.has(r.id) &&
          reviewStatus !== 'needs_revision'
        ) {
          printReadyMap[groupId] = (printReadyMap[groupId] || 0) + 1;
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

    // Reason: Derive contributor counts from recipes, not from guests table.
    // A contributor is a unique guest_id with a recipe in the book.
    const guestsByGroup = new Map<string, Set<string>>();
    (allRecipes || []).forEach(r => {
      const groupId = recipeToGroupMap.get(r.id);
      if (groupId && r.guest_id) {
        if (!guestsByGroup.has(groupId)) guestsByGroup.set(groupId, new Set());
        guestsByGroup.get(groupId)!.add(r.guest_id);
      }
    });
    guestsByGroup.forEach((guests, groupId) => {
      contributorCountMap[groupId] = guests.size;
    });

    // Reason: count only recipes that exist in guest_recipes and aren't soft-deleted
    (allRecipes || []).forEach(r => {
      const groupId = recipeToGroupMap.get(r.id);
      if (groupId) {
        recipeCountMap[groupId] = (recipeCountMap[groupId] || 0) + 1;
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
      book_closed_by_user: g.book_closed_by_user || null,
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
