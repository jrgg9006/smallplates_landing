/**
 * API Route - Send Group Invitations
 * Allows group members to invite new members to a group
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createSupabaseRoute } from '@/lib/supabase/route';
import { sendGroupInvitationEmail } from '@/lib/postmark';

// Create Supabase Admin client for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

const resolveBaseUrl = (request: Request) => {
  const envUrl = process.env.NEXT_PUBLIC_BASE_URL?.trim();
  if (envUrl) {
    return envUrl.replace(/\/$/, '');
  }

  const vercelUrl = process.env.NEXT_PUBLIC_VERCEL_URL?.trim() || process.env.VERCEL_URL?.trim();
  if (vercelUrl) {
    const normalized = vercelUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
    return `https://${normalized}`;
  }

  const host = request.headers.get('host');
  if (host) {
    const normalizedHost = host.replace(/\/$/, '');
    const protocol = normalizedHost.includes('localhost') ? 'http' : 'https';
    return `${protocol}://${normalizedHost}`;
  }

  return 'http://localhost:3000';
};

export async function POST(
  request: Request,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const { groupId } = await params;
    const { name, email } = await request.json();

    // Validate input
    if (!name?.trim()) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    if (!email?.trim()) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      );
    }

    // Get authenticated user
    const supabase = await createSupabaseRoute();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    console.log('🔐 User authenticated:', user.id);
    console.log('👥 Inviting to group:', groupId);
    console.log('📧 Inviting email:', email);

    // Check if user is a member of the group
    const { data: membership, error: membershipError } = await supabaseAdmin
      .from('group_members')
      .select('role, groups(*)')
      .eq('group_id', groupId)
      .eq('profile_id', user.id)
      .single();

    if (membershipError || !membership) {
      console.error('❌ User not a member of group:', membershipError);
      return NextResponse.json(
        { error: 'You are not a member of this group' },
        { status: 403 }
      );
    }

    console.log('✅ User is a member of the group (role: ' + membership.role + ')');

    // Check if user is already a member of the group
    const { data: existingMember, error: existingMemberError } = await supabaseAdmin
      .from('group_members')
      .select('profile_id, profiles(email)')
      .eq('group_id', groupId)
      .eq('profiles.email', email.toLowerCase())
      .single();

    if (existingMember) {
      return NextResponse.json(
        { error: 'This person is already a member of this group' },
        { status: 400 }
      );
    }

    // Check for existing pending invitation
    const { data: existingInvitation, error: existingInvitationError } = await supabaseAdmin
      .from('group_invitations')
      .select('id, status, expires_at')
      .eq('group_id', groupId)
      .eq('email', email.toLowerCase())
      .eq('status', 'pending')
      .single();

    if (existingInvitation) {
      // Check if existing invitation is still valid
      const now = new Date();
      const expiresAt = new Date(existingInvitation.expires_at);
      
      if (now < expiresAt) {
        return NextResponse.json(
          { error: 'An invitation has already been sent to this email address' },
          { status: 400 }
        );
      } else {
        // Existing invitation expired, we can send a new one
        console.log('🕐 Previous invitation expired, sending new one');
      }
    }

    // Generate unique invitation token
    const token = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

    console.log('🎫 Generated invitation token:', token);
    console.log('📅 Expires at:', expiresAt.toISOString());

    // Create invitation record
    const { data: invitation, error: invitationError } = await supabaseAdmin
      .from('group_invitations')
      .insert({
        group_id: groupId,
        email: email.toLowerCase(),
        name: name.trim(),
        invited_by: user.id,
        status: 'pending',
        token,
        expires_at: expiresAt.toISOString()
      })
      .select('*')
      .single();

    if (invitationError) {
      console.error('❌ Error creating invitation:', invitationError);
      return NextResponse.json(
        { error: 'Failed to create invitation' },
        { status: 500 }
      );
    }

    console.log('✅ Invitation created:', invitation.id);

    // Get inviter's profile for email
    const { data: inviterProfile, error: inviterError } = await supabaseAdmin
      .from('profiles')
      .select('full_name, email')
      .eq('id', user.id)
      .single();

    if (inviterError || !inviterProfile) {
      console.error('⚠️ Could not get inviter profile:', inviterError);
    }

    const inviterName = inviterProfile?.full_name || inviterProfile?.email || 'Someone';

    // Generate invitation URL
    const baseUrl = resolveBaseUrl(request);
    const invitationUrl = `${baseUrl}/invitations/group/${token}`;

    console.log('🔗 Invitation URL:', invitationUrl);

    // Send email invitation
    const emailResult = await sendGroupInvitationEmail({
      to: email,
      inviterName,
      groupName: (membership.groups as any).name,
      groupDescription: (membership.groups as any).description || undefined,
      joinUrl: invitationUrl
    });

    if (!emailResult.success) {
      console.error('❌ Failed to send invitation email:', emailResult.error);
      
      // Clean up invitation record if email failed
      await supabaseAdmin
        .from('group_invitations')
        .delete()
        .eq('id', invitation.id);

      return NextResponse.json(
        { error: 'Failed to send invitation email. Please try again.' },
        { status: 500 }
      );
    }

    console.log('✅ Group invitation sent successfully');

    return NextResponse.json({
      success: true,
      message: `Invitation sent to ${email}`,
      data: {
        invitationId: invitation.id,
        email,
        expiresAt: invitation.expires_at,
        messageId: emailResult.messageId
      }
    });

  } catch (error) {
    console.error('❌ Unexpected error in group invitation route:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to send invitation'
      },
      { status: 500 }
    );
  }
}