/**
 * API Route - Verify Group Invitation Token
 * Checks if a group invitation token is valid, not expired, and not used
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create Supabase Admin client
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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }

    console.log('🔍 Verifying group invitation token:', token);

    // Fetch invitation from database with group and inviter details
    const { data: invitation, error } = await supabaseAdmin
      .from('group_invitations')
      .select(`
        *,
        groups (
          id,
          name,
          description,
          created_at
        ),
        inviter:profiles!group_invitations_invited_by_fkey (
          id,
          full_name,
          email
        )
      `)
      .eq('token', token)
      .single();

    if (error || !invitation) {
      console.error('❌ Group invitation not found:', error);
      return NextResponse.json(
        { 
          error: 'Invalid invitation link',
          status: 'invalid'
        },
        { status: 404 }
      );
    }

    // Check if invitation is expired
    const now = new Date();
    const expiresAt = new Date(invitation.expires_at);
    
    if (now > expiresAt) {
      console.error('❌ Group invitation expired:', {
        expiresAt: invitation.expires_at,
        now: now.toISOString()
      });
      return NextResponse.json(
        { 
          error: 'This invitation has expired',
          status: 'expired',
          expiresAt: invitation.expires_at
        },
        { status: 410 }
      );
    }

    // Check if invitation has been used
    if (invitation.status === 'accepted') {
      console.error('❌ Group invitation already accepted');
      return NextResponse.json(
        { 
          error: 'This invitation has already been accepted',
          status: 'used'
        },
        { status: 410 }
      );
    }

    if (invitation.status === 'declined') {
      console.error('❌ Group invitation was declined');
      return NextResponse.json(
        { 
          error: 'This invitation was declined',
          status: 'declined'
        },
        { status: 410 }
      );
    }

    // Check if user is already a member of the group
    const { data: existingMember } = await supabaseAdmin
      .from('group_members')
      .select('profile_id, profiles(email)')
      .eq('group_id', invitation.group_id)
      .eq('profiles.email', invitation.email.toLowerCase())
      .single();

    if (existingMember) {
      console.error('❌ User already a member of group');
      return NextResponse.json(
        { 
          error: 'You are already a member of this group',
          status: 'already_member'
        },
        { status: 400 }
      );
    }

    console.log('✅ Group invitation is valid:', {
      email: invitation.email,
      name: invitation.name,
      groupName: invitation.groups.name
    });

    // Return invitation data
    return NextResponse.json({
      success: true,
      status: 'valid',
      data: {
        // Invitation details
        email: invitation.email,
        name: invitation.name,
        expiresAt: invitation.expires_at,
        createdAt: invitation.created_at,
        
        // Group details
        group: {
          id: invitation.groups.id,
          name: invitation.groups.name,
          description: invitation.groups.description,
          createdAt: invitation.groups.created_at
        },
        
        // Inviter details
        inviter: {
          name: invitation.inviter?.full_name || invitation.inviter?.email || 'Someone',
          email: invitation.inviter?.email
        }
      }
    });

  } catch (error) {
    console.error('❌ Unexpected error in group verify token route:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to verify invitation',
        status: 'error'
      },
      { status: 500 }
    );
  }
}