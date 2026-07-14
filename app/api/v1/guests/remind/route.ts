import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';
import { sendGuestInvitationEmail } from '@/lib/email/send-invitation-email';

// Reason: Prevent harassment and protect Postmark reputation
const MAX_REMINDERS_PER_HOUR = 10;
const MAX_EMAILS_PER_GUEST = 4;
const MAX_EMAILS_PER_GROUP_MONTHLY = 500;

export async function POST(request: NextRequest) {
  try {
    const { guestId, groupId } = await request.json();

    if (!guestId || !groupId) {
      return NextResponse.json(
        { error: 'guestId and groupId are required' },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is member of the group
    const { data: membership } = await supabase
      .from('group_members')
      .select('role')
      .eq('group_id', groupId)
      .eq('profile_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Not a member of this group' }, { status: 403 });
    }

    // ── Guard: hourly reminder limit per user ──
    const hourAgoCutoff = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count: recentReminders } = await supabase
      .from('guests')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('last_email_sent_at', hourAgoCutoff)
      .gt('emails_sent_count', 1);

    if ((recentReminders || 0) >= MAX_REMINDERS_PER_HOUR) {
      return NextResponse.json(
        { error: 'Too many reminders sent recently. Try again later.' },
        { status: 429 }
      );
    }

    // Fetch guest
    const { data: guest } = await supabase
      .from('guests')
      .select('id, first_name, email, group_id, recipes_received, emails_sent_count, invitation_started_at')
      .eq('id', guestId)
      .single();

    if (!guest || guest.group_id !== groupId) {
      return NextResponse.json({ error: 'Guest not found in this group' }, { status: 404 });
    }

    // Reason: removed the "already submitted" guard. The Send Reminders modal
    // intentionally shows submitted guests with a "Recipe received" badge and
    // lets the organizer choose whether to include them (e.g., to send a thank
    // you). If they explicitly checked the box, we trust the choice.

    if (!guest.email || guest.email.startsWith('NO_EMAIL_')) {
      return NextResponse.json({ error: 'Guest has no valid email' }, { status: 400 });
    }

    // ── Guard: max emails per guest ──
    if ((guest.emails_sent_count || 0) >= MAX_EMAILS_PER_GUEST) {
      return NextResponse.json(
        { error: `This guest has already received ${MAX_EMAILS_PER_GUEST} emails` },
        { status: 400 }
      );
    }

    // ── Guard: monthly limit per group ──
    const monthAgoCutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { count: monthlyEmails } = await supabase
      .from('guests')
      .select('id', { count: 'exact', head: true })
      .eq('group_id', groupId)
      .gte('last_email_sent_at', monthAgoCutoff)
      .gt('emails_sent_count', 0);

    if ((monthlyEmails || 0) >= MAX_EMAILS_PER_GROUP_MONTHLY) {
      return NextResponse.json(
        { error: 'Monthly email limit for this group reached.' },
        { status: 429 }
      );
    }

    // Fetch group data for email (incl. organizer's custom body)
    const { data: group } = await supabase
      .from('groups')
      .select('name, couple_first_name, partner_first_name, couple_image_url, created_by, email_reminder_message, email_from_name, email_reminder_subject')
      .eq('id', groupId)
      .single();

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    // Reason: the Book Name (groups.name) is the single source of truth, same
    // as the invite routes. First names are only a fallback for legacy rows
    // that never set a name. Keeps the reminder consistent with every other
    // email (invitation, weekly, delivery) instead of showing "Ana & Rich"
    // when the rest of the product shows the cookbook title.
    const coupleNames = group.name
      || [group.couple_first_name, group.partner_first_name].filter(Boolean).join(' & ')
      || 'The Couple';

    // Get collection token
    const { data: creatorProfile } = await supabase
      .from('profiles')
      .select('collection_link_token')
      .eq('id', group.created_by)
      .single();

    if (!creatorProfile?.collection_link_token) {
      return NextResponse.json({ error: 'Collection link not configured' }, { status: 400 });
    }

    const appUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://smallplatesandcompany.com';
    const collectionLink = `${appUrl}/collect/${creatorProfile.collection_link_token}?group=${groupId}&inviter_id=${encodeURIComponent(user.id)}&utm_source=collection_link&utm_medium=email&utm_campaign=guest_invite`;

    // Get captain name
    const { data: senderProfile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single();

    // Reason: simplified MVP — single reminder template (email2) regardless
    // of how many times we've reminded this guest before. The max-emails-per-guest
    // guard above still enforces the cap.
    const result = await sendGuestInvitationEmail({
      to: guest.email,
      guestName: guest.first_name,
      coupleName: coupleNames,
      collectionLink,
      coupleImageUrl: group.couple_image_url || undefined,
      captainName: senderProfile?.full_name || undefined,
      emailNumber: 2,
      customBody: group.email_reminder_message || undefined,
      namesArePeople: Boolean(group.couple_first_name || group.partner_first_name),
      fromName: group.email_from_name || undefined,
      customSubject: group.email_reminder_subject || undefined,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Failed to send reminder' }, { status: 500 });
    }

    // Update tracking
    const trackingUpdate: {
      last_email_sent_at: string;
      emails_sent_count: number;
      invitation_started_at?: string;
    } = {
      last_email_sent_at: new Date().toISOString(),
      // Reason: count the email we just sent. Falls back to 0 (not 1) so a
      // guest contacted here for the first time lands at 1, not 2.
      emails_sent_count: (guest.emails_sent_count || 0) + 1,
    };
    // Reason: this modal can now email guests who were never invited. The first
    // time we contact anyone, mark invitation_started_at so they stop showing as
    // "uninvited" in Send Emails and both flows stay consistent.
    if (!guest.invitation_started_at) {
      trackingUpdate.invitation_started_at = new Date().toISOString();
    }
    await supabase
      .from('guests')
      .update(trackingUpdate)
      .eq('id', guestId);

    // Reason: log the reminder so it shows up in the Radar Live Feed
    // ("Correo reminder enviado"). Best-effort — RLS allows the insert because
    // user_id === auth.uid(); a logging failure must never fail the send.
    try {
      await supabase.from('communication_log').insert({
        guest_id: guestId,
        group_id: groupId,
        user_id: user.id,
        type: 'reminder',
        channel: 'email',
        status: 'sent',
        sent_at: new Date().toISOString(),
      });
    } catch {
      // Silent fail — the email already went out; the log is telemetry only.
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in remind:', error);
    return NextResponse.json({ error: 'Failed to send reminder' }, { status: 500 });
  }
}
