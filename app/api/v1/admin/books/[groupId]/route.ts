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

    // 2. Contributors (guests with recipes, not archived)
    const { data: contributors } = await supabase
      .from('guests')
      .select('id, first_name, last_name, printed_name, recipes_received')
      .eq('group_id', groupId)
      .eq('is_archived', false)
      .gt('recipes_received', 0)
      .order('first_name');

    // 3. Owners & Captains
    const { data: members } = await supabase
      .from('group_members')
      .select(`
        group_id, profile_id, role, printed_name,
        profiles!group_members_profile_id_fkey(full_name, email)
      `)
      .eq('group_id', groupId)
      .in('role', ['owner', 'member']);

    // 4. Recipes with print-ready versions
    const { data: recipes } = await supabase
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
      .eq('group_id', groupId)
      .order('recipe_name');

    const coupleDisplayName = group.couple_display_name ||
      `${group.couple_first_name || ''} & ${group.partner_first_name || ''}`.trim();

    const owners = (members || [])
      .filter(m => m.role === 'owner')
      .map(m => {
        const profile = m.profiles as { full_name: string | null; email: string } | null;
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
        const profile = m.profiles as { full_name: string | null; email: string } | null;
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

      const guest = r.guests as { first_name: string; last_name: string; printed_name: string | null } | null;

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
      contributors: contributors || [],
      owners,
      captains,
      recipes: formattedRecipes,
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

      // Reason: enforce that ALL recipes must be approved before moving to 'reviewed'
      if (currentStatus === 'active' && newStatus === 'reviewed') {
        const { data: recipes } = await supabase
          .from('guest_recipes')
          .select('id, book_review_status')
          .eq('group_id', groupId);

        if (!recipes || recipes.length === 0) {
          return NextResponse.json(
            { error: 'Cannot mark as reviewed: no recipes in this book' },
            { status: 400 }
          );
        }

        const unapproved = recipes.filter(
          r => (r as Record<string, unknown>).book_review_status !== 'approved'
        );
        if (unapproved.length > 0) {
          return NextResponse.json(
            { error: `Cannot mark as reviewed: ${unapproved.length} recipe(s) are not yet approved` },
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
