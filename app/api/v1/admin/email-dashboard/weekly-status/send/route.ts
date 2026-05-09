import { NextRequest, NextResponse } from 'next/server';
import { ServerClient } from 'postmark';
import { requireAdminAuth } from '@/lib/auth/admin';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { getWeeklyStatsForGroup } from '@/lib/email/queries';
import {
  buildWeeklyStatusHTML,
  buildWeeklyStatusSubject,
} from '@/lib/email/weekly-status-template';

const postmarkClient = new ServerClient(process.env.POSTMARK_SERVER_TOKEN || '');

interface SendResult {
  email: string;
  status: 'sent' | 'skipped' | 'error';
  reason?: string;
}

export async function POST(request: NextRequest) {
  try {
    const adminUser = await requireAdminAuth();
    const supabase = createSupabaseAdminClient();

    const { group_id } = (await request.json()) as { group_id: string };
    if (!group_id) {
      return NextResponse.json({ error: 'group_id is required' }, { status: 400 });
    }

    const stats = await getWeeklyStatsForGroup(group_id);
    if (!stats) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    if (stats.recipients.length === 0) {
      return NextResponse.json(
        { error: 'No captains or organizer found for this group' },
        { status: 400 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://smallplatesandcompany.com';
    const coupleNamePlain = stats.couple_display_name || stats.group_name || 'The couple';
    const coupleNameHtml = coupleNamePlain.replace(/&/g, '&amp;');
    const fromEmail = process.env.POSTMARK_FROM_EMAIL || 'team@smallplatesandcompany.com';

    // Reason: we no longer abort if the creator has no token — instead we
    // build a per-recipient link inside the loop. We only abort if NO
    // recipient has a usable token (neither their own nor the creator's).
    const creatorToken = stats.collection_link_token;
    const anyTokenAvailable =
      !!creatorToken || stats.recipients.some(r => !!r.collection_link_token);
    if (!anyTokenAvailable) {
      return NextResponse.json(
        { error: 'No collection link token available — cannot build CTA URL' },
        { status: 400 }
      );
    }

    const subject = buildWeeklyStatusSubject({
      coupleNamePlain,
      totalRecipes: stats.total_recipes,
      daysLeft: stats.days_left,
    });

    const results: SendResult[] = [];

    for (const recipient of stats.recipients) {
      if (recipient.notification_emails_opt_out) {
        results.push({ email: recipient.email, status: 'skipped', reason: 'opted out' });
        continue;
      }

      // Reason: each recipient gets a link built with their own token so that
      // recipes captured via that link are attributed to them. Falls back to
      // the creator's token if the recipient has none (defensive — every
      // profile should have a token).
      const recipientToken = recipient.collection_link_token || creatorToken;
      if (!recipientToken) {
        results.push({ email: recipient.email, status: 'skipped', reason: 'no token available' });
        continue;
      }
      const collectionLink =
        `${baseUrl}/collect/${recipientToken}` +
        `?group=${group_id}&utm_source=weekly_status&utm_medium=email`;

      const recipientFirstName = recipient.full_name?.split(' ')[0] || '';
      const unsubscribePageUrl = `${baseUrl}/unsubscribe-profile?uid=${recipient.profile_id}`;
      const unsubscribeApiUrl = `${baseUrl}/api/v1/unsubscribe-profile?uid=${recipient.profile_id}`;
      const unsubMailto = `mailto:team@smallplatesandcompany.com?subject=Unsubscribe&body=Profile%20ID%3A%20${encodeURIComponent(recipient.profile_id)}`;

      const html = buildWeeklyStatusHTML({
        recipientName: recipientFirstName,
        coupleName: coupleNameHtml,
        coupleNamePlain,
        totalRecipes: stats.total_recipes,
        recipesThisWeek: stats.recipes_this_week,
        newGuestsThisWeek: stats.new_guests_this_week,
        daysLeft: stats.days_left,
        collectionLink,
        unsubscribeUrl: unsubscribePageUrl,
      });

      try {
        await postmarkClient.sendEmail({
          From: `Small Plates & Co. <${fromEmail}>`,
          ReplyTo: 'team@smallplatesandcompany.com',
          To: recipient.email,
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
          recipient_profile_id: recipient.profile_id,
          group_id,
          user_id: adminUser.id,
          type: 'weekly_status',
          channel: 'email',
          subject,
          status: 'sent',
          sent_at: sentAt,
        });

        if (logError) {
          console.error('Failed to log weekly_status email:', logError.message);
        }

        results.push({ email: recipient.email, status: 'sent' });
      } catch (sendError) {
        const reason = sendError instanceof Error ? sendError.message : 'unknown error';
        console.error(`Weekly status send failed for ${recipient.email}:`, reason);
        results.push({ email: recipient.email, status: 'error', reason });
      }
    }

    const sent = results.filter(r => r.status === 'sent').length;
    const skipped = results.filter(r => r.status === 'skipped').length;
    const errored = results.filter(r => r.status === 'error').length;

    return NextResponse.json({ success: true, sent, skipped, errored, results });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Send failed' },
      { status: 500 }
    );
  }
}
