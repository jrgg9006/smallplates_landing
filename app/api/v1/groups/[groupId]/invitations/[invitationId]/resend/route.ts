/**
 * API Route - Resend Group Invitation
 * Allows group members to resend a pending invitation email
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
  { params }: { params: Promise<{ groupId: string; invitationId: string }> }
) {
  try {
    const { groupId, invitationId } = await params;

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
    console.log('📧 Resending invitation:', invitationId);

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

    // Get the invitation with all details
    const { data: invitation, error: invitationError } = await supabaseAdmin
      .from('group_invitations')
      .select(`
        *,
        groups (
          id,
          name,
          description
        ),
        inviter:profiles!group_invitations_invited_by_fkey (
          id,
          full_name,
          email
        )
      `)
      .eq('id', invitationId)
      .eq('group_id', groupId)
      .single();

    if (invitationError || !invitation) {
      console.error('❌ Invitation not found:', invitationError);
      return NextResponse.json(
        { error: 'Invitation not found' },
        { status: 404 }
      );
    }

    // Check if invitation is still pending
    if (invitation.status !== 'pending') {
      return NextResponse.json(
        { error: 'Only pending invitations can be resent' },
        { status: 400 }
      );
    }

    // Check if invitation is expired
    const now = new Date();
    const expiresAt = new Date(invitation.expires_at);
    if (now > expiresAt) {
      // Extend expiration by 7 days from now
      const newExpiresAt = new Date();
      newExpiresAt.setDate(newExpiresAt.getDate() + 7);
      
      await supabaseAdmin
        .from('group_invitations')
        .update({ expires_at: newExpiresAt.toISOString() })
        .eq('id', invitationId);
      
      console.log('📅 Extended invitation expiration date');
    }

    // Get inviter's profile for email
    const inviterName = invitation.inviter?.full_name || invitation.inviter?.email || 'Someone';

    // Generate invitation URL
    const baseUrl = resolveBaseUrl(request);
    const invitationUrl = `${baseUrl}/invitations/group/${invitation.token}`;

    console.log('🔗 Invitation URL:', invitationUrl);

    // Resend email invitation
    const emailResult = await sendGroupInvitationEmail({
      to: invitation.email,
      inviterName,
      groupName: (invitation.groups as any).name,
      groupDescription: (invitation.groups as any).description || undefined,
      invitationUrl
    });

    if (!emailResult.success) {
      console.error('❌ Failed to resend invitation email:', emailResult.error);
      return NextResponse.json(
        { error: 'Failed to resend invitation email. Please try again.' },
        { status: 500 }
      );
    }

    console.log('✅ Group invitation resent successfully');

    return NextResponse.json({
      success: true,
      message: `Invitation resent to ${invitation.email}`,
      data: {
        invitationId: invitation.id,
        email: invitation.email,
        messageId: emailResult.messageId
      }
    });

  } catch (error) {
    console.error('❌ Unexpected error in resend invitation route:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to resend invitation'
      },
      { status: 500 }
    );
  }
}

