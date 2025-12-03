/**
 * API Route - Consume Invitation
 * Uses invitation token to create user account in Supabase Auth
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { updateWaitlistStatus } from '@/lib/supabase/waitlist';
import { createSupabaseClient } from '@/lib/supabase/client';

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

export async function POST(request: Request) {
  try {
    const { token, password } = await request.json();

    // Validate input
    if (!token || !password) {
      return NextResponse.json(
        { error: 'Token and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    console.log('🔐 Consuming invitation token:', token);

    // Step 1: Verify invitation is valid
    const { data: invitation, error: inviteError } = await supabaseAdmin
      .from('waitlist_invitations')
      .select('*')
      .eq('token', token)
      .single();

    if (inviteError || !invitation) {
      console.error('❌ Invalid invitation:', inviteError);
      return NextResponse.json(
        { error: 'Invalid invitation link' },
        { status: 404 }
      );
    }

    // Check if expired
    const now = new Date();
    const expiresAt = new Date(invitation.expires_at);
    
    if (now > expiresAt) {
      console.error('❌ Invitation expired');
      return NextResponse.json(
        { error: 'This invitation has expired' },
        { status: 410 }
      );
    }

    // Check if already used
    if (invitation.used) {
      console.error('❌ Invitation already used');
      return NextResponse.json(
        { error: 'This invitation has already been used' },
        { status: 410 }
      );
    }

    console.log('✅ Invitation is valid for:', invitation.email);

    // Step 2: Create user account in Supabase Auth
    const { data: signUpData, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
      email: invitation.email,
      password: password,
      email_confirm: true, // Auto-confirm email since it's from invitation
      user_metadata: {
        invited_from_waitlist: true,
        waitlist_id: invitation.waitlist_id,
        firstName: invitation.first_name,
        lastName: invitation.last_name,
        full_name: `${invitation.first_name} ${invitation.last_name}`
      }
    });

    if (signUpError) {
      console.error('❌ Error creating user:', signUpError);
      
      // Handle duplicate email
      if (signUpError.message?.includes('already registered')) {
        return NextResponse.json(
          { error: 'This email is already registered. Please login instead.' },
          { status: 409 }
        );
      }
      
      return NextResponse.json(
        { error: signUpError.message || 'Failed to create account' },
        { status: 500 }
      );
    }

    if (!signUpData.user) {
      console.error('❌ No user data returned');
      return NextResponse.json(
        { error: 'Failed to create account' },
        { status: 500 }
      );
    }

    console.log('✅ User created successfully:', signUpData.user.id);

    // Step 3: Mark invitation as used
    const { error: updateError } = await supabaseAdmin
      .from('waitlist_invitations')
      .update({
        used: true,
        used_at: new Date().toISOString()
      })
      .eq('token', token);

    if (updateError) {
      console.error('⚠️ Failed to mark invitation as used:', updateError);
      // Don't fail the request - user was created successfully
    }

    // Step 4: Update waitlist status to 'converted'
    const { success: statusUpdated } = await updateWaitlistStatus(
      invitation.waitlist_id,
      'converted',
      'converted_at'
    );

    if (!statusUpdated) {
      console.error('⚠️ Failed to update waitlist status');
      // Don't fail the request - user was created successfully
    }

    console.log('✅ Account creation complete');

    // Return success with user data
    return NextResponse.json({
      success: true,
      message: 'Account created successfully',
      data: {
        userId: signUpData.user.id,
        email: signUpData.user.email
      }
    });

  } catch (error) {
    console.error('❌ Unexpected error in consume invitation route:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to create account'
      },
      { status: 500 }
    );
  }
}