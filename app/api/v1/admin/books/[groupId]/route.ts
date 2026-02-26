import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth/admin';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import type { BookStatus, BookReviewStatus } from '@/lib/types/database';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    await requireAdminAuth();
    const { groupId } = await params;
    const supabase = createSupabaseAdminClient();

    // 1. Group/couple info
    const { data: group, error: groupError } = await supabase
      .from('groups')
      .select(`
        id, name, couple_display_name, couple_first_name, couple_last_name,
        partner_first_name, partner_last_name, wedding_date,
        book_status, book_reviewed_by, book_reviewed_at, book_notes
      `)
      .eq('id', groupId)
      .single();

    if (groupError) {
      return NextResponse.json({ error: groupError.message }, { status: 404 });
    }

    // 2. Contributors — derived from actual recipes in step 4 (see below)

    // 3. Owners & Captains
    const { data: members } = await supabase
      .from('group_members')
      .select(`
        group_id, profile_id, role, printed_name,
        profiles!group_members_profile_id_fkey(full_name, email)
      `)
      .eq('group_id', groupId)
      .in('role', ['owner', 'member']);

    // 4. Recipes via group_recipes (source of truth for group membership)
    // Reason: guest_recipes.group_id can be stale when recipes are linked/moved between groups.
    // group_recipes tracks the actual add/remove operations.
    const { data: activeGroupRecipes } = await supabase
      .from('group_recipes')
      .select('recipe_id')
      .eq('group_id', groupId)
      .is('removed_at', null);

    const activeRecipeIds = (activeGroupRecipes || []).map(gr => gr.recipe_id);

    const { data: recipes } = activeRecipeIds.length > 0
      ? await supabase
          .from('guest_recipes')
          .select(`
            id, recipe_name, ingredients, instructions, comments,
            image_url, generated_image_url, generated_image_url_print, image_upscale_status,
            guest_id, book_review_status, book_review_notes,
            guests(first_name, last_name, printed_name),
            recipe_print_ready(
              recipe_name_clean, ingredients_clean, instructions_clean,
              note_clean, cleaning_version
            ),
            recipe_production_status(needs_review)
          `)
          .in('id', activeRecipeIds)
          .is('deleted_at', null)
          .order('recipe_name')
      : { data: null };

    // 5. Archived recipes (removed from group) for admin visibility
    const { data: removedGroupRecipes } = await supabase
      .from('group_recipes')
      .select('recipe_id, removed_at, removed_by')
      .eq('group_id', groupId)
      .not('removed_at', 'is', null);

    let archivedRecipes: { id: string; recipe_name: string; guest_name: string; removed_at: string; removed_by_name: string | null }[] = [];

    if (removedGroupRecipes && removedGroupRecipes.length > 0) {
      const removedRecipeIds = removedGroupRecipes.map(gr => gr.recipe_id);

      // Fetch recipe + guest info
      const { data: removedRecipeData } = await supabase
        .from('guest_recipes')
        .select('id, recipe_name, guests(first_name, last_name, printed_name)')
        .in('id', removedRecipeIds);

      // Batch-fetch who removed them
      const removedByIds = [...new Set(removedGroupRecipes.filter(gr => gr.removed_by).map(gr => gr.removed_by as string))];
      const removedByNames = new Map<string, string>();
      if (removedByIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', removedByIds);
        (profiles || []).forEach(p => {
          removedByNames.set(p.id, p.full_name || p.email || 'Unknown');
        });
      }

      // Build a lookup from recipe_id to group_recipes info
      const removedMap = new Map(removedGroupRecipes.map(gr => [gr.recipe_id, gr]));

      archivedRecipes = (removedRecipeData || []).map(r => {
        const guest = r.guests as unknown as { first_name: string; last_name: string; printed_name: string | null } | null;
        const grEntry = removedMap.get(r.id);
        return {
          id: r.id,
          recipe_name: r.recipe_name,
          guest_name: guest?.printed_name || `${guest?.first_name || ''} ${guest?.last_name || ''}`.trim() || 'Unknown',
          removed_at: grEntry?.removed_at || '',
          removed_by_name: grEntry?.removed_by ? removedByNames.get(grEntry.removed_by) || null : null,
        };
      });
    }

    const coupleDisplayName = group.couple_display_name ||
      `${group.couple_first_name || ''} & ${group.partner_first_name || ''}`.trim();

    const owners = (members || [])
      .filter(m => m.role === 'owner')
      .map(m => {
        const profile = m.profiles as unknown as { full_name: string | null; email: string } | null;
        return {
          profile_id: m.profile_id,
          role: m.role,
          printed_name: m.printed_name,
          profile_name: profile?.full_name || null,
          profile_email: profile?.email || null,
        };
      });

    const captains = (members || [])
      .filter(m => m.role === 'member')
      .map(m => {
        const profile = m.profiles as unknown as { full_name: string | null; email: string } | null;
        return {
          profile_id: m.profile_id,
          role: m.role,
          printed_name: m.printed_name,
          profile_name: profile?.full_name || null,
          profile_email: profile?.email || null,
        };
      });

    const formattedRecipes = (recipes || []).map(r => {
      const printReady = Array.isArray(r.recipe_print_ready)
        ? r.recipe_print_ready[0] || null
        : r.recipe_print_ready || null;

      const guest = r.guests as unknown as { first_name: string; last_name: string; printed_name: string | null } | null;

      return {
        id: r.id,
        recipe_name: r.recipe_name,
        ingredients: r.ingredients,
        instructions: r.instructions,
        comments: r.comments,
        guest_id: r.guest_id,
        guest_name: guest?.printed_name ||
          `${guest?.first_name || ''} ${guest?.last_name || ''}`.trim() || 'Unknown',
        image_url: r.image_url,
        generated_image_url: r.generated_image_url,
        generated_image_url_print: r.generated_image_url_print,
        image_upscale_status: r.image_upscale_status,
        has_print_ready: !!printReady,
        print_ready: printReady ? {
          recipe_name_clean: printReady.recipe_name_clean,
          ingredients_clean: printReady.ingredients_clean,
          instructions_clean: printReady.instructions_clean,
          note_clean: printReady.note_clean,
          cleaning_version: printReady.cleaning_version,
        } : null,
        needs_review: (() => {
          const ps = Array.isArray(r.recipe_production_status)
            ? r.recipe_production_status[0] || null
            : r.recipe_production_status || null;
          return ps?.needs_review ?? false;
        })(),
        book_review_status: (r as Record<string, unknown>).book_review_status as string || 'pending',
        book_review_notes: (r as Record<string, unknown>).book_review_notes as string | null || null,
      };
    });

    // Reason: Derive contributors from actual recipes in the book, not from the guests table.
    // A person is a contributor if they have a recipe — regardless of being captain/owner.
    const contributorMap = new Map<string, { id: string; first_name: string; last_name: string; printed_name: string | null; recipes_received: number }>();
    for (const r of (recipes || [])) {
      const guest = r.guests as unknown as { first_name: string; last_name: string; printed_name: string | null } | null;
      if (!r.guest_id || !guest) continue;
      const existing = contributorMap.get(r.guest_id);
      if (existing) {
        existing.recipes_received++;
      } else {
        contributorMap.set(r.guest_id, {
          id: r.guest_id,
          first_name: guest.first_name,
          last_name: guest.last_name,
          printed_name: guest.printed_name,
          recipes_received: 1,
        });
      }
    }
    const contributors = Array.from(contributorMap.values())
      .sort((a, b) => (a.first_name || '').localeCompare(b.first_name || ''));

    return NextResponse.json({
      group: {
        id: group.id,
        name: group.name,
        couple_display_name: coupleDisplayName,
        couple_first_name: group.couple_first_name,
        couple_last_name: group.couple_last_name,
        partner_first_name: group.partner_first_name,
        partner_last_name: group.partner_last_name,
        wedding_date: group.wedding_date,
        book_status: group.book_status || 'active',
        book_reviewed_by: group.book_reviewed_by,
        book_reviewed_at: group.book_reviewed_at,
        book_notes: group.book_notes,
      },
      contributors,
      owners,
      captains,
      recipes: formattedRecipes,
      archived_recipes: archivedRecipes,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unauthorized' },
      { status: 401 }
    );
  }
}

// Reason: any status can go to 'inactive', and 'inactive' can only go back to 'active'
const VALID_TRANSITIONS: Record<BookStatus, BookStatus[]> = {
  active: ['reviewed', 'inactive'],
  reviewed: ['active', 'ready_to_print', 'inactive'],
  ready_to_print: ['reviewed', 'printed', 'inactive'],
  printed: ['ready_to_print', 'inactive'],
  inactive: ['active'],
};

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const user = await requireAdminAuth();
    const { groupId } = await params;
    const supabase = createSupabaseAdminClient();
    const body = await request.json();

    // Handle recipe review updates
    if (body.recipe_reviews && Array.isArray(body.recipe_reviews)) {
      for (const review of body.recipe_reviews) {
        const { recipe_id, book_review_status, book_review_notes } = review as {
          recipe_id: string;
          book_review_status: BookReviewStatus;
          book_review_notes?: string | null;
        };

        if (!recipe_id || !book_review_status) continue;

        const updateData: Record<string, unknown> = {
          book_review_status,
          // Reason: clear notes when approving, save notes when marking needs_revision
          book_review_notes: book_review_status === 'approved' ? null : (book_review_notes || null),
        };

        const { error } = await supabase
          .from('guest_recipes')
          .update(updateData)
          .eq('id', recipe_id)
          .eq('group_id', groupId);

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 });
        }
      }

      // Reason: auto-transition book status based on recipe review statuses
      const { data: currentGroup } = await supabase
        .from('groups')
        .select('book_status')
        .eq('id', groupId)
        .single();

      const bookStatus = (currentGroup?.book_status || 'active') as BookStatus;

      const { data: allRecipes } = await supabase
        .from('guest_recipes')
        .select('id, book_review_status')
        .eq('group_id', groupId)
        .is('deleted_at', null);

      if (allRecipes && allRecipes.length > 0) {
        const statuses = allRecipes.map(r => (r as Record<string, unknown>).book_review_status as string);
        const allApproved = statuses.every(s => s === 'approved');
        const anyReviewed = statuses.some(s => s === 'approved' || s === 'needs_revision');

        let newBookStatus: BookStatus | null = null;

        // Reason: check allApproved first — it's a stronger condition than anyReviewed
        if ((bookStatus === 'active' || bookStatus === 'reviewed') && allApproved) {
          newBookStatus = 'ready_to_print';
        } else if (bookStatus === 'active' && anyReviewed) {
          newBookStatus = 'reviewed';
        } else if (bookStatus === 'ready_to_print' && !allApproved) {
          newBookStatus = 'reviewed';
        }

        if (newBookStatus && newBookStatus !== bookStatus) {
          const autoUpdate: Record<string, unknown> = { book_status: newBookStatus };
          if (newBookStatus === 'reviewed' && bookStatus === 'active') {
            autoUpdate.book_reviewed_by = user.id;
            autoUpdate.book_reviewed_at = new Date().toISOString();
          }
          await supabase.from('groups').update(autoUpdate).eq('id', groupId);
        }
      }
    }

    // Handle status transition
    if (body.book_status) {
      const { data: current } = await supabase
        .from('groups')
        .select('book_status')
        .eq('id', groupId)
        .single();

      const currentStatus = (current?.book_status || 'active') as BookStatus;
      const newStatus = body.book_status as BookStatus;

      if (!VALID_TRANSITIONS[currentStatus]?.includes(newStatus)) {
        return NextResponse.json(
          { error: `Cannot transition from '${currentStatus}' to '${newStatus}'` },
          { status: 400 }
        );
      }

      // Reason: enforce that ALL recipes must be approved before moving FORWARD to 'ready_to_print'
      // Skip validation when going backward from 'printed' — the book was already validated
      if (newStatus === 'ready_to_print' && currentStatus !== 'printed') {
        const { data: recipes } = await supabase
          .from('guest_recipes')
          .select('id, book_review_status')
          .eq('group_id', groupId)
          .is('deleted_at', null);

        if (!recipes || recipes.length === 0) {
          return NextResponse.json(
            { error: 'Cannot mark as ready to print: no recipes in this book' },
            { status: 400 }
          );
        }

        const unapproved = recipes.filter(
          r => (r as Record<string, unknown>).book_review_status !== 'approved'
        );
        if (unapproved.length > 0) {
          return NextResponse.json(
            { error: `Cannot mark as ready to print: ${unapproved.length} recipe(s) are not yet approved` },
            { status: 400 }
          );
        }
      }

      const updateData: Record<string, unknown> = { book_status: newStatus };

      // Auto-set reviewer info when moving to 'reviewed'
      if (newStatus === 'reviewed') {
        updateData.book_reviewed_by = user.id;
        updateData.book_reviewed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('groups')
        .update(updateData)
        .eq('id', groupId);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    // Handle group field edits (couple names, wedding_date, book_notes)
    if (body.group_updates) {
      const allowed = [
        'couple_display_name', 'couple_first_name', 'couple_last_name',
        'partner_first_name', 'partner_last_name', 'wedding_date', 'book_notes'
      ];
      const updates: Record<string, unknown> = {};
      for (const key of allowed) {
        if (key in body.group_updates) {
          updates[key] = body.group_updates[key];
        }
      }

      if (Object.keys(updates).length > 0) {
        const { error } = await supabase
          .from('groups')
          .update(updates)
          .eq('id', groupId);

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 });
        }
      }
    }

    // Handle contributor name edits (guests.printed_name)
    if (body.contributor_updates && Array.isArray(body.contributor_updates)) {
      for (const update of body.contributor_updates) {
        if (update.guest_id && typeof update.printed_name === 'string') {
          const { error } = await supabase
            .from('guests')
            .update({ printed_name: update.printed_name || null })
            .eq('id', update.guest_id)
            .eq('group_id', groupId);

          if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
          }
        }
      }
    }

    // Handle captain/owner name edits (group_members.printed_name)
    if (body.member_updates && Array.isArray(body.member_updates)) {
      for (const update of body.member_updates) {
        if (update.profile_id && typeof update.printed_name === 'string') {
          const { error } = await supabase
            .from('group_members')
            .update({ printed_name: update.printed_name || null })
            .eq('profile_id', update.profile_id)
            .eq('group_id', groupId);

          if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
          }
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unauthorized' },
      { status: 401 }
    );
  }
}
