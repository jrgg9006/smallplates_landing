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
      .select('id, first_name, email, group_id, recipes_received, emails_sent_count')
      .eq('id', guestId)
      .single();

    if (!guest || guest.group_id !== groupId) {
      return NextResponse.json({ error: 'Guest not found in this group' }, { status: 404 });
    }

    if ((guest.recipes_received || 0) > 0) {
      return NextResponse.json({ error: 'Guest already submitted a recipe' }, { status: 400 });
    }

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

    // Fetch group data for email
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
    const collectionLink = `${appUrl}/collect/${creatorProfile.collection_link_token}?group=${groupId}`;

    // Get captain name
    const { data: senderProfile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single();

    // Reason: emails_sent_count tracks total emails sent (1 = initial invite).
    // Next email number = current count + 1, clamped to max 4 (last template).
    const nextEmailNumber = Math.min((guest.emails_sent_count || 1) + 1, 4) as 1 | 2 | 3 | 4;

    // Reason: Template 3 uses recipe count for social proof ("X people already shared")
    let recipeCount: number | undefined;
    if (nextEmailNumber === 3) {
      const { count } = await supabase
        .from('guest_recipes')
        .select('id', { count: 'exact', head: true })
        .eq('group_id', groupId)
        .is('deleted_at', null);
      recipeCount = count || undefined;
    }

    const result = await sendGuestInvitationEmail({
      to: guest.email,
      guestName: guest.first_name,
      coupleName: coupleNames,
      collectionLink,
      coupleImageUrl: group.couple_image_url || undefined,
      captainName: senderProfile?.full_name || undefined,
      emailNumber: nextEmailNumber,
      recipeCount,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Failed to send reminder' }, { status: 500 });
    }

    // Update tracking
    await supabase
      .from('guests')
      .update({
        last_email_sent_at: new Date().toISOString(),
        emails_sent_count: (guest.emails_sent_count || 1) + 1,
      })
      .eq('id', guestId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in remind:', error);
    return NextResponse.json({ error: 'Failed to send reminder' }, { status: 500 });
  }
}
