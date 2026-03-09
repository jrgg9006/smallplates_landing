import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';
import { sendGuestInvitationEmail } from '@/lib/email/send-invitation-email';

// Reason: These limits protect against abuse and keep our Postmark reputation clean
const MAX_GUESTS_PER_REQUEST = 100;
const MAX_INVITATIONS_PER_DAY = 200;
const MAX_EMAILS_PER_GROUP_MONTHLY = 500;
const COOLDOWN_SECONDS = 30;

export async function POST(request: NextRequest) {
  try {
    const { guestIds, groupId } = await request.json();

    if (!guestIds?.length || !groupId) {
      return NextResponse.json(
        { error: 'guestIds and groupId are required' },
        { status: 400 }
      );
    }

    // ── Guard: batch size cap ──
    if (guestIds.length > MAX_GUESTS_PER_REQUEST) {
      return NextResponse.json(
        { error: `Maximum ${MAX_GUESTS_PER_REQUEST} guests per request` },
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

    // ── Guard: cooldown — prevent rapid-fire requests ──
    const cooldownCutoff = new Date(Date.now() - COOLDOWN_SECONDS * 1000).toISOString();
    const { count: recentSends } = await supabase
      .from('guests')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('invitation_started_at', cooldownCutoff);

    if (recentSends && recentSends > 0) {
      return NextResponse.json(
        { error: 'Please wait a moment before sending more invitations' },
        { status: 429 }
      );
    }

    // ── Guard: daily limit — max invitations per 24h across all groups ──
    const dayAgoCutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count: dailySent } = await supabase
      .from('guests')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('invitation_started_at', dayAgoCutoff);

    const remaining = MAX_INVITATIONS_PER_DAY - (dailySent || 0);
    if (remaining <= 0) {
      return NextResponse.json(
        { error: 'Daily invitation limit reached. Try again tomorrow.' },
        { status: 429 }
      );
    }

    // ── Guard: monthly limit per group — max emails per group per 30 days ──
    const monthAgoCutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { count: monthlySent } = await supabase
      .from('guests')
      .select('id', { count: 'exact', head: true })
      .eq('group_id', groupId)
      .gte('invitation_started_at', monthAgoCutoff);

    const monthlyRemaining = MAX_EMAILS_PER_GROUP_MONTHLY - (monthlySent || 0);
    if (monthlyRemaining <= 0) {
      return NextResponse.json(
        { error: 'Monthly email limit for this group reached. Try again next month.' },
        { status: 429 }
      );
    }

    // Reason: Only process up to what's left in the daily and monthly allowance
    const safeGuestIds = guestIds.slice(0, Math.min(guestIds.length, remaining, monthlyRemaining));

    // Fetch group data for email template
    const { data: group } = await supabase
      .from('groups')
      .select('name, couple_first_name, partner_first_name, couple_image_url, created_by')
      .eq('id', groupId)
      .single();

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    const coupleNames = [group.couple_first_name, group.partner_first_name]
      .filter(Boolean)
      .join(' & ') || group.name || 'The Couple';

    // Get collection token from the group creator's profile
    const { data: creatorProfile } = await supabase
      .from('profiles')
      .select('collection_link_token')
      .eq('id', group.created_by)
      .single();

    if (!creatorProfile?.collection_link_token) {
      return NextResponse.json(
        { error: 'Collection link not configured' },
        { status: 400 }
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://smallplatesandcompany.com';
    const collectionLink = `${appUrl}/collect/${creatorProfile.collection_link_token}?group=${groupId}`;

    // Get captain name for email footer
    const { data: senderProfile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single();

    let sent = 0;
    let failed = 0;
    const errors: string[] = [];

    // Send emails sequentially to avoid Postmark rate limits
    for (const guestId of safeGuestIds) {
      const { data: guest } = await supabase
        .from('guests')
        .select('id, first_name, last_name, email, group_id, invitation_started_at')
        .eq('id', guestId)
        .single();

      if (!guest) {
        failed++;
        errors.push(`Guest ${guestId} not found`);
        continue;
      }

      if (guest.group_id !== groupId) {
        failed++;
        errors.push(`Guest ${guest.first_name} doesn't belong to this group`);
        continue;
      }

      if (!guest.email || guest.email.startsWith('NO_EMAIL_')) {
        failed++;
        errors.push(`${guest.first_name} has no email`);
        continue;
      }

      if (guest.invitation_started_at) {
        failed++;
        errors.push(`${guest.first_name} already invited`);
        continue;
      }

      const result = await sendGuestInvitationEmail({
        to: guest.email,
        guestName: guest.first_name,
        coupleName: coupleNames,
        collectionLink,
        coupleImageUrl: group.couple_image_url || undefined,
        captainName: senderProfile?.full_name || undefined,
        emailNumber: 1,
      });

      if (result.success) {
        await supabase
          .from('guests')
          .update({
            invitation_started_at: new Date().toISOString(),
            last_email_sent_at: new Date().toISOString(),
            emails_sent_count: 1,
          })
          .eq('id', guestId);

        sent++;
      } else {
        failed++;
        errors.push(`${guest.first_name}: ${result.error}`);
      }
    }

    return NextResponse.json({ success: true, sent, failed, errors });
  } catch (error) {
    console.error('Error in send-invitations:', error);
    return NextResponse.json(
      { error: 'Failed to send invitations' },
      { status: 500 }
    );
  }
}
