import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import {
  buildClosingNudgeHTML,
  buildClosingNudgeSubject,
} from '@/lib/email/closing-nudge-template';

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
      .select('id, name, couple_display_name, book_close_date')
      .eq('id', groupId)
      .single();

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    if (!group.book_close_date) {
      return NextResponse.json(
        { error: 'Group has no book_close_date — cannot render closing nudge' },
        { status: 400 }
      );
    }

    const closeDate = new Date(group.book_close_date);
    const daysUntilClose = Math.max(
      0,
      Math.floor((closeDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000))
    );

    // Reason: within a week, "Friday" reads more urgent than "May 14".
    // Beyond, the explicit date is clearer.
    const closeDateLabel = daysUntilClose <= 7
      ? closeDate.toLocaleDateString('en-US', { weekday: 'long' })
      : closeDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });

    const closeDateLong = closeDate.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;
    const coupleNamePlain = group.couple_display_name || group.name || 'The couple';
    const coupleNameHtml = coupleNamePlain.replace(/&/g, '&amp;');
    const guestName = url.searchParams.get('guest_name') || 'Alex';

    // Reason: in real send, collectionUrl is the public collection link for that group's
    // organizer (profiles.collection_link_token). Preview uses a placeholder.
    const previewCollectionUrl = url.searchParams.get('collection_url')
      || `${baseUrl}/collect/preview-token`;

    const html = buildClosingNudgeHTML({
      guestName,
      coupleName: coupleNameHtml,
      coupleNamePlain,
      closeDateLabel,
      closeDateLong,
      collectionUrl: previewCollectionUrl,
      unsubscribeUrl: `${baseUrl}/api/v1/unsubscribe?gid=preview`,
    });

    // Reason: encode subject for HTTP header safety — names with accents (ñ, ó, é)
    // would otherwise reject the response with an InvalidCharacterError.
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'X-Email-Subject': encodeURIComponent(
          buildClosingNudgeSubject({ coupleNamePlain, closeDateLabel })
        ),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to preview' },
      { status: 500 }
    );
  }
}
