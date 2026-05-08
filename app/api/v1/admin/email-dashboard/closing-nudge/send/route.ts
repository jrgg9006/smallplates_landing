import { NextRequest, NextResponse } from 'next/server';
import { ServerClient } from 'postmark';
import { requireAdminAuth } from '@/lib/auth/admin';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import {
  buildClosingNudgeHTML,
  buildClosingNudgeSubject,
} from '@/lib/email/closing-nudge-template';

const postmarkClient = new ServerClient(process.env.POSTMARK_SERVER_TOKEN || '');

interface SendResult {
  email: string;
  guest_id: string;
  status: 'sent' | 'skipped' | 'error';
  reason?: string;
}

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export async function POST(request: NextRequest) {
  try {
    const adminUser = await requireAdminAuth();
    const supabase = createSupabaseAdminClient();

    const { group_id } = (await request.json()) as { group_id: string };
    if (!group_id) {
      return NextResponse.json({ error: 'group_id is required' }, { status: 400 });
    }

    const { data: group } = await supabase
      .from('groups')
      .select('id, name, couple_display_name, book_close_date, created_by')
      .eq('id', group_id)
      .single();

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    if (!group.book_close_date) {
      return NextResponse.json(
        { error: 'Group has no book_close_date — cannot send closing nudge' },
        { status: 400 }
      );
    }

    // Reason: collection_link_token is per-organizer; the public collection journey
    // takes ?group= to disambiguate when an organizer has multiple groups.
    const { data: organizer } = await supabase
      .from('profiles')
      .select('collection_link_token')
      .eq('id', group.created_by)
      .single();

    if (!organizer?.collection_link_token) {
      return NextResponse.json(
        { error: 'Organizer has no collection link token — cannot build CTA URL' },
        { status: 400 }
      );
    }

    // Eligible guests: email + not opted out + not already nudged for this cycle
    const [guestsRes, alreadyNudgedRes] = await Promise.all([
      supabase
        .from('guests')
        .select('id, email, first_name')
        .eq('group_id', group_id)
        .not('email', 'is', null)
        .neq('email', '')
        .eq('showcase_opted_out', false),
      supabase
        .from('communication_log')
        .select('guest_id')
        .eq('group_id', group_id)
        .eq('type', 'closing_nudge'),
    ]);

    if (guestsRes.error) {
      return NextResponse.json(
        { error: `Failed to load guests: ${guestsRes.error.message}` },
        { status: 500 }
      );
    }

    const alreadyNudged = new Set(
      (alreadyNudgedRes.data ?? [])
        .map(r => r.guest_id)
        .filter((id): id is string => !!id)
    );

    const eligibleGuests = (guestsRes.data ?? []).filter(g => !alreadyNudged.has(g.id));

    if (eligibleGuests.length === 0) {
      return NextResponse.json(
        { error: 'No eligible guests — everyone has already been nudged or opted out' },
        { status: 400 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://smallplatesandcompany.com';
    const coupleNamePlain = group.couple_display_name || group.name || 'The couple';
    const coupleNameHtml = coupleNamePlain.replace(/&/g, '&amp;');
    const fromEmail = process.env.POSTMARK_FROM_EMAIL || 'team@smallplatesandcompany.com';

    const closeDate = new Date(group.book_close_date);
    const daysUntilClose = Math.max(
      0,
      Math.floor((closeDate.getTime() - Date.now()) / ONE_DAY_MS)
    );
    const closeDateLabel =
      daysUntilClose <= 7
        ? closeDate.toLocaleDateString('en-US', { weekday: 'long' })
        : closeDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
    const closeDateLong = closeDate.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });

    const subject = buildClosingNudgeSubject({ coupleNamePlain, closeDateLabel });
    const collectionUrl =
      `${baseUrl}/collect/${organizer.collection_link_token}` +
      `?group=${group_id}&utm_source=closing_nudge&utm_medium=email`;

    const results: SendResult[] = [];

    for (const guest of eligibleGuests) {
      const guestFirstName = guest.first_name || 'There';
      const unsubscribePageUrl = `${baseUrl}/unsubscribe?gid=${guest.id}`;
      const unsubscribeApiUrl = `${baseUrl}/api/v1/unsubscribe?gid=${guest.id}`;
      const unsubMailto = `mailto:team@smallplatesandcompany.com?subject=Unsubscribe&body=Guest%20ID%3A%20${encodeURIComponent(guest.id)}`;

      const html = buildClosingNudgeHTML({
        guestName: guestFirstName,
        coupleName: coupleNameHtml,
        coupleNamePlain,
        closeDateLabel,
        closeDateLong,
        collectionUrl,
        unsubscribeUrl: unsubscribePageUrl,
      });

      try {
        await postmarkClient.sendEmail({
          From: `Small Plates & Co. <${fromEmail}>`,
          ReplyTo: 'team@smallplatesandcompany.com',
          To: guest.email,
          Subject: subject,
          HtmlBody: html,
          MessageStream: 'outbound',
          Headers: [
            { Name: 'List-Unsubscribe', Value: `<${unsubscribeApiUrl}>, <${unsubMailto}>` },
            { Name: 'List-Unsubscribe-Post', Value: 'List-Unsubscribe=One-Click' },
          ],
        });

        const sentAt = new Date().toISOString();
        const { error: logError } = await supabase.from('communication_log').insert({
          guest_id: guest.id,
          group_id,
          user_id: adminUser.id,
          type: 'closing_nudge',
          channel: 'email',
          subject,
          status: 'sent',
          sent_at: sentAt,
        });

        if (logError) {
          console.error('Failed to log closing_nudge email:', logError.message);
        }

        results.push({ email: guest.email, guest_id: guest.id, status: 'sent' });
      } catch (sendError) {
        const reason = sendError instanceof Error ? sendError.message : 'unknown error';
        console.error(`Closing nudge send failed for ${guest.email}:`, reason);
        results.push({
          email: guest.email,
          guest_id: guest.id,
          status: 'error',
          reason,
        });
      }
    }

    const sent = results.filter(r => r.status === 'sent').length;
    const errored = results.filter(r => r.status === 'error').length;

    return NextResponse.json({ success: true, sent, errored, results });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Send failed' },
      { status: 500 }
    );
  }
}
