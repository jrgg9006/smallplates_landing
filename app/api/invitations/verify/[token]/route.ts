/**
 * API Route - Verify Invitation Token
 * Checks if an invitation token is valid, not expired, and not used
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
  { params }: { params: { token: string } }
) {
  try {
    const token = params.token;

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }

    console.log('🔍 Verifying invitation token:', token);

    // Fetch invitation from database
    const { data: invitation, error } = await supabaseAdmin
      .from('waitlist_invitations')
      .select('*')
      .eq('token', token)
      .single();

    if (error || !invitation) {
      console.error('❌ Invitation not found:', error);
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
      console.error('❌ Invitation expired:', {
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
    if (invitation.used) {
      console.error('❌ Invitation already used:', {
        usedAt: invitation.used_at
      });
      return NextResponse.json(
        { 
          error: 'This invitation has already been used',
          status: 'used',
          usedAt: invitation.used_at
        },
        { status: 410 }
      );
    }

    console.log('✅ Invitation is valid:', {
      email: invitation.email,
      firstName: invitation.first_name,
      lastName: invitation.last_name
    });

    // Return invitation data
    return NextResponse.json({
      success: true,
      status: 'valid',
      data: {
        email: invitation.email,
        firstName: invitation.first_name,
        lastName: invitation.last_name,
        expiresAt: invitation.expires_at,
        createdAt: invitation.created_at
      }
    });

  } catch (error) {
    console.error('❌ Unexpected error in verify token route:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to verify invitation',
        status: 'error'
      },
      { status: 500 }
    );
  }
}