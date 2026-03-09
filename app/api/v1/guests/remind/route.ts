import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';
import { sendGuestInvitationEmail } from '@/lib/email/send-invitation-email';

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

    // Fetch group data for email
    const { data: group } = await supabase
      .from('groups')
      .select('couple_first_name, partner_first_name, couple_image_url, created_by')
      .eq('id', groupId)
      .single();

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    const coupleNames = [group.couple_first_name, group.partner_first_name]
      .filter(Boolean)
      .join(' & ') || 'The Couple';

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

    const result = await sendGuestInvitationEmail({
      to: guest.email,
      guestName: guest.first_name,
      coupleName: coupleNames,
      collectionLink,
      coupleImageUrl: group.couple_image_url || undefined,
      captainName: senderProfile?.full_name || undefined,
      emailNumber: 2,
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
