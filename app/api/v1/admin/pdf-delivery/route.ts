import { NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth/admin';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  try {
    await requireAdminAuth();
    const supabase = createSupabaseAdminClient();

    // Fetch all non-inactive groups so admin sees the full pipeline
    const { data: groups, error: groupsErr } = await supabase
      .from('groups')
      .select('id, name, couple_display_name, book_status, pdf_url')
      .not('book_status', 'eq', 'inactive')
      .order('name');

    if (groupsErr) throw groupsErr;
    if (!groups?.length) return NextResponse.json({ groups: [] });

    const groupIds = groups.map(g => g.id);

    // Guests with any known email in these groups, not archived.
    // notify_email = email the guest provided themselves during recipe submission (preferred).
    // email = email the organizer has on file (fallback).
    const { data: guests, error: guestsErr } = await supabase
      .from('guests')
      .select('id, first_name, last_name, email, notify_email, group_id, showcase_opted_out')
      .in('group_id', groupIds)
      .eq('is_archived', false)
      .or('notify_email.not.is.null,email.not.is.null');

    if (guestsErr) throw guestsErr;

    const guestIds = (guests || []).map(g => g.id);

    // PDF delivery send log — one row per guest per send
    const { data: sendLog, error: logErr } = await supabase
      .from('communication_log')
      .select('guest_id, sent_at')
      .eq('type', 'pdf_delivery')
      .in('guest_id', guestIds);

    if (logErr) throw logErr;

    // Recipe counts per group — submitted/approved only
    const { data: recipes, error: recipesErr } = await supabase
      .from('guest_recipes')
      .select('group_id, guest_id, submission_status')
      .in('group_id', groupIds)
      .in('submission_status', ['submitted', 'approved']);

    if (recipesErr) throw recipesErr;

    // Assemble maps for O(1) lookups
    const sentAtByGuestId = new Map<string, string>(
      (sendLog || []).map(l => [l.guest_id, l.sent_at])
    );

    const recipesByGroup = new Map<string, { totalRecipes: number; contributorIds: Set<string> }>();
    for (const r of recipes || []) {
      if (!r.group_id) continue;
      const entry = recipesByGroup.get(r.group_id) ?? { totalRecipes: 0, contributorIds: new Set() };
      entry.totalRecipes++;
      entry.contributorIds.add(r.guest_id);
      recipesByGroup.set(r.group_id, entry);
    }

    const guestsByGroup = new Map<string, typeof guests>();
    for (const g of guests || []) {
      if (!g.group_id) continue;
      const list = guestsByGroup.get(g.group_id) ?? [];
      list.push(g);
      guestsByGroup.set(g.group_id, list);
    }

    const result = groups.map(group => {
      const stats = recipesByGroup.get(group.id);
      const groupGuests = guestsByGroup.get(group.id) ?? [];

      return {
        group_id: group.id,
        group_name: group.name,
        couple_display_name: group.couple_display_name,
        book_status: group.book_status,
        pdf_url: group.pdf_url,
        total_contributors: stats?.contributorIds.size ?? 0,
        total_recipes: stats?.totalRecipes ?? 0,
        guests: groupGuests
          .map(g => ({
            guest_id: g.id,
            guest_name: `${g.first_name} ${g.last_name}`.trim(),
            guest_email: ((g as Record<string, unknown>).notify_email as string || g.email || '').trim(),
            showcase_opted_out: g.showcase_opted_out,
            pdf_sent_at: sentAtByGuestId.get(g.id) ?? null,
          }))
          .filter(g => g.guest_email !== ''),
      };
    });

    return NextResponse.json({ groups: result });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to load data' },
      { status: 500 }
    );
  }
}
