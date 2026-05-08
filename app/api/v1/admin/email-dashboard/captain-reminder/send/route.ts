import { NextRequest, NextResponse } from 'next/server';
import { ServerClient } from 'postmark';
import { requireAdminAuth } from '@/lib/auth/admin';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import {
  buildCaptainReminderHTML,
  buildCaptainReminderSubject,
} from '@/lib/email/captain-reminder-template';

const postmarkClient = new ServerClient(process.env.POSTMARK_SERVER_TOKEN || '');

// Reason: no cap. The dashboard shows the full chronological trail so the
// founder can decide when to stop based on context, not an arbitrary limit.
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
      .select('id, name, couple_display_name, created_by')
      .eq('id', group_id)
      .single();

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    const { data: organizer } = await supabase
      .from('profiles')
      .select('id, email, full_name, notification_emails_opt_out')
      .eq('id', group.created_by)
      .single();

    if (!organizer?.email) {
      return NextResponse.json({ error: 'Organizer has no email on file' }, { status: 400 });
    }

    if (organizer.notification_emails_opt_out) {
      return NextResponse.json(
        { error: 'Organizer opted out of book updates' },
        { status: 400 }
      );
    }

    // Reason: race-safety — the founder may have just added a captain.
    // Captains are role = 'member' in this codebase ('owner' rows are the organizer).
    const { data: existingCaptains } = await supabase
      .from('group_members')
      .select('profile_id')
      .eq('group_id', group_id)
      .eq('role', 'member')
      .limit(1);

    if (existingCaptains && existingCaptains.length > 0) {
      return NextResponse.json(
        { error: 'Group now has captains — reminder no longer needed' },
        { status: 400 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://smallplatesandcompany.com';
    const coupleNamePlain = group.couple_display_name || group.name || 'The couple';
    const coupleNameHtml = coupleNamePlain.replace(/&/g, '&amp;');
    const organizerFirstName = organizer.full_name?.split(' ')[0] || 'There';

    // Reason: public group join page — anyone with this link can become a captain.
    // The organizer copies it from the email and shares via WhatsApp/iMessage.
    const joinLink = `${baseUrl}/groups/${group_id}/join`;
    const unsubscribePageUrl = `${baseUrl}/unsubscribe-profile?uid=${organizer.id}`;
    const unsubscribeApiUrl = `${baseUrl}/api/v1/unsubscribe-profile?uid=${organizer.id}`;
    const unsubMailto = `mailto:team@smallplatesandcompany.com?subject=Unsubscribe&body=Profile%20ID%3A%20${encodeURIComponent(organizer.id)}`;

    const html = buildCaptainReminderHTML({
      organizerName: organizerFirstName,
      coupleName: coupleNameHtml,
      coupleNamePlain,
      joinLink,
      unsubscribeUrl: unsubscribePageUrl,
    });
    const subject = buildCaptainReminderSubject(coupleNamePlain);
    const fromEmail = process.env.POSTMARK_FROM_EMAIL || 'team@smallplatesandcompany.com';

    await postmarkClient.sendEmail({
      From: `Small Plates & Co. <${fromEmail}>`,
      ReplyTo: 'team@smallplatesandcompany.com',
      To: organizer.email,
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
      recipient_profile_id: organizer.id,
      group_id,
      user_id: adminUser.id,
      type: 'captain_reminder',
      channel: 'email',
      subject,
      status: 'sent',
      sent_at: sentAt,
    });

    if (logError) {
      console.error('Failed to log captain_reminder email:', logError.message);
    }

    return NextResponse.json({
      success: true,
      sent_at: sentAt,
      recipient: organizer.email,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Send failed' },
      { status: 500 }
    );
  }
}
