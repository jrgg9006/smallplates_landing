import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import {
  buildWeeklyStatusHTML,
  buildWeeklyStatusSubject,
} from '@/lib/email/weekly-status-template';

// Reason: read-only preview, no auth check — same pattern as pdf-delivery/preview-email.
export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseAdminClient();
    const url = new URL(request.url);
    const groupId = url.searchParams.get('group_id');

    if (!groupId) {
      return NextResponse.json({ error: 'group_id is required' }, { status: 400 });
    }

    const { data: group } = await supabase
      .from('groups')
      .select('id, name, couple_display_name, created_by, book_close_date')
      .eq('id', groupId)
      .single();

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const [recipesAllRes, recipesWeekRes, guestsWeekRes, organizerRes] = await Promise.all([
      supabase
        .from('guest_recipes')
        .select('id', { count: 'exact', head: true })
        .eq('group_id', groupId)
        .in('submission_status', ['submitted', 'approved']),
      supabase
        .from('guest_recipes')
        .select('id', { count: 'exact', head: true })
        .eq('group_id', groupId)
        .in('submission_status', ['submitted', 'approved'])
        .gte('submitted_at', oneWeekAgo),
      supabase
        .from('guests')
        .select('id', { count: 'exact', head: true })
        .eq('group_id', groupId)
        .gte('created_at', oneWeekAgo),
      supabase
        .from('profiles')
        .select('full_name, collection_link_token')
        .eq('id', group.created_by)
        .single(),
    ]);

    const totalRecipes = recipesAllRes.count ?? 0;
    const recipesThisWeek = recipesWeekRes.count ?? 0;
    const newGuestsThisWeek = guestsWeekRes.count ?? 0;
    const recipientName = url.searchParams.get('recipient_name')
      || organizerRes.data?.full_name?.split(' ')[0]
      || 'There';

    let daysLeft: number | null = null;
    if (group.book_close_date) {
      const ms = new Date(group.book_close_date).getTime() - Date.now();
      daysLeft = Math.max(0, Math.floor(ms / (24 * 60 * 60 * 1000)));
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;
    const coupleNamePlain = group.couple_display_name || group.name || 'The couple';
    const coupleNameHtml = coupleNamePlain.replace(/&/g, '&amp;');

    // Reason: same shape captain reminder uses — organizer's public collection
    // token + ?group= disambiguator. Falls back to a placeholder for groups
    // without a token so the preview still renders.
    const token = organizerRes.data?.collection_link_token ?? 'preview-token';
    const collectionLink =
      `${baseUrl}/collect/${token}` +
      `?group=${groupId}&utm_source=weekly_status&utm_medium=email`;

    const html = buildWeeklyStatusHTML({
      recipientName,
      coupleName: coupleNameHtml,
      coupleNamePlain,
      totalRecipes,
      recipesThisWeek,
      newGuestsThisWeek,
      daysLeft,
      collectionLink,
      unsubscribeUrl: `${baseUrl}/api/v1/unsubscribe-profile?uid=${group.created_by}`,
    });

    // Reason: subject can contain non-ASCII (accented names, etc.), so encode it
    // before placing in an HTTP header — undici rejects raw non-ISO-8859-1 chars.
    const subject = buildWeeklyStatusSubject({ coupleNamePlain, totalRecipes, daysLeft });
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'X-Email-Subject': encodeURIComponent(subject),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to preview' },
      { status: 500 }
    );
  }
}
