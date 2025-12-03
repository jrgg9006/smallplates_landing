/**
 * Admin API Route - Invite User
 * Sends email invitation to waitlist users via Supabase Auth
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { updateWaitlistStatus } from '@/lib/supabase/waitlist';

// Create Supabase Admin client (uses service role key)
// This bypasses RLS and has full access
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
    const { email, waitlistId } = await request.json();

    // Validate input
    if (!email || !waitlistId) {
      return NextResponse.json(
        { error: 'Email and waitlistId are required' },
        { status: 400 }
      );
    }

    console.log('📧 Sending invitation to:', email);

    // Send invitation email via Supabase Auth
    // This creates a user account and sends a magic link email
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      email,
      {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/profile`,
        data: {
          invited_from_waitlist: true,
          waitlist_id: waitlistId
        }
      }
    );

    if (authError) {
      console.error('❌ Supabase Auth error:', authError);
      return NextResponse.json(
        { error: authError.message },
        { status: 500 }
      );
    }

    console.log('✅ Invitation sent successfully');

    // Update waitlist status to 'invited'
    const { success, error: updateError } = await updateWaitlistStatus(
      waitlistId,
      'invited',
      'invited_at'
    );

    if (!success) {
      console.error('⚠️ Failed to update waitlist status:', updateError);
      // Don't fail the request - invitation was sent successfully
    }

    return NextResponse.json({
      success: true,
      message: `Invitation sent to ${email}`,
      data: authData
    });

  } catch (error) {
    console.error('❌ Unexpected error in invite-user route:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to invite user',
        details: 'Check server logs for more information'
      },
      { status: 500 }
    );
  }
}

