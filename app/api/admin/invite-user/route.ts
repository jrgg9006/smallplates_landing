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

    console.log('📧 Inviting user from waitlist:', email);

    // Step 1: Get waitlist user data first
    const { data: waitlistUser, error: waitlistError } = await supabaseAdmin
      .from('waitlist')
      .select('*')
      .eq('id', waitlistId)
      .single();

    if (waitlistError || !waitlistUser) {
      console.error('❌ Error fetching waitlist user:', waitlistError);
      return NextResponse.json(
        { error: 'Waitlist user not found' },
        { status: 404 }
      );
    }

    console.log('✅ Waitlist user data retrieved:', {
      name: `${waitlistUser.first_name} ${waitlistUser.last_name}`,
      recipe_goal: waitlistUser.recipe_goal_category
    });

    // Step 2: Create user account first
    const { data: createData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      email_confirm: true,
      user_metadata: {
        // User metadata that will be attached to the user
        invited_from_waitlist: true,
        waitlist_id: waitlistId,
        firstName: waitlistUser.first_name,
        lastName: waitlistUser.last_name,
        full_name: `${waitlistUser.first_name} ${waitlistUser.last_name}`,
        hasPartner: waitlistUser.has_partner || false,
        partnerFirstName: waitlistUser.partner_first_name || null,
        partnerLastName: waitlistUser.partner_last_name || null,
      }
    });

    if (createError) {
      console.error('❌ Error creating user:', createError);
      return NextResponse.json(
        { error: createError.message },
        { status: 500 }
      );
    }

    // Step 3: Send password reset email (which respects redirectTo)
    const { error: resetError } = await supabaseAdmin.auth.resetPasswordForEmail(
      email,
      {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/reset-password`
      }
    );

    const inviteData = createData;
    const inviteError = resetError;

    if (inviteError) {
      console.error('❌ Error inviting user:', inviteError);
      return NextResponse.json(
        { error: inviteError.message },
        { status: 500 }
      );
    }

    console.log('✅ User invited successfully:', inviteData.user.id);
    console.log('📝 User metadata stored:', {
      waitlist_id: waitlistId,
      full_name: `${waitlistUser.first_name} ${waitlistUser.last_name}`
    });

    // Note: We DON'T create the profile here
    // The profile will be created automatically when the user accepts the invitation
    // and sets their password. At that point, our trigger will detect the new profile
    // and automatically update the waitlist status to 'converted'

    // Step 3: Update waitlist status to 'invited'
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
      data: inviteData
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

