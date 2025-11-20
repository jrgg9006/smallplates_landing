/**
 * API Route - Cancel Group Invitation
 * Allows group members to cancel a pending invitation
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createSupabaseRoute } from '@/lib/supabase/route';

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

export async function PATCH(
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
    console.log('❌ Canceling invitation:', invitationId);

    // Check if user is a member of the group
    const { data: membership, error: membershipError } = await supabaseAdmin
      .from('group_members')
      .select('role')
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

    // Get the invitation to verify it exists and belongs to this group
    const { data: invitation, error: invitationError } = await supabaseAdmin
      .from('group_invitations')
      .select('id, group_id, status')
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

    // Check if invitation is already canceled/accepted
    if (invitation.status !== 'pending') {
      return NextResponse.json(
        { error: 'Invitation is not pending and cannot be canceled' },
        { status: 400 }
      );
    }

    // Update invitation status to 'declined' (we use declined for canceled)
    const { error: updateError } = await supabaseAdmin
      .from('group_invitations')
      .update({ status: 'declined' })
      .eq('id', invitationId);

    if (updateError) {
      console.error('❌ Error canceling invitation:', updateError);
      return NextResponse.json(
        { error: 'Failed to cancel invitation' },
        { status: 500 }
      );
    }

    console.log('✅ Invitation canceled successfully');

    return NextResponse.json({
      success: true,
      message: 'Invitation canceled successfully'
    });

  } catch (error) {
    console.error('❌ Unexpected error in cancel invitation route:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to cancel invitation'
      },
      { status: 500 }
    );
  }
}

