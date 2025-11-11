/**
 * Admin API Route - Custom Invite User
 * Sends invitation email using Postmark with custom token system
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { updateWaitlistStatus } from '@/lib/supabase/waitlist';
import { sendInvitationEmail } from '@/lib/postmark';
import crypto from 'crypto';

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

    // Step 2: Check for rate limiting (max 3 invites per email in 24h)
    // TEMPORARILY DISABLED FOR TESTING
    /*
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: recentInvites, error: rateError } = await supabaseAdmin
      .from('waitlist_invitations')
      .select('id')
      .eq('email', email)
      .gte('created_at', twentyFourHoursAgo);

    if (!rateError && recentInvites && recentInvites.length >= 3) {
      console.error('❌ Rate limit exceeded for email:', email);
      return NextResponse.json(
        { error: 'Too many invitations sent to this email. Please wait 24 hours.' },
        { status: 429 }
      );
    }
    */

    // Step 3: Generate unique invitation token
    const invitationToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

    console.log('🔐 Generated invitation token:', invitationToken);
    console.log('📅 Expires at:', expiresAt.toISOString());

    // Step 4: Save invitation to database
    const { error: inviteError } = await supabaseAdmin
      .from('waitlist_invitations')
      .insert({
        email: email,
        token: invitationToken,
        waitlist_id: waitlistId,
        first_name: waitlistUser.first_name,
        last_name: waitlistUser.last_name,
        expires_at: expiresAt.toISOString()
      });

    if (inviteError) {
      console.error('❌ Error saving invitation:', inviteError);
      return NextResponse.json(
        { error: 'Failed to create invitation: ' + inviteError.message },
        { status: 500 }
      );
    }

    console.log('✅ Invitation saved to database');

    // Step 5: Send invitation email via Postmark
    console.log('🔍 NEXT_PUBLIC_SITE_URL from process.env:', process.env.NEXT_PUBLIC_SITE_URL);
    const confirmationUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/join/${invitationToken}`;
    console.log('🔗 Generated confirmation URL:', confirmationUrl);
    
    const emailResult = await sendInvitationEmail({
      to: email,
      confirmationUrl: confirmationUrl
    });

    if (!emailResult.success) {
      console.error('❌ Failed to send email:', emailResult.error);
      // Delete the invitation since email failed
      await supabaseAdmin
        .from('waitlist_invitations')
        .delete()
        .eq('token', invitationToken);
      
      return NextResponse.json(
        { error: 'Failed to send invitation email: ' + emailResult.error },
        { status: 500 }
      );
    }

    console.log('✅ Invitation email sent successfully');

    // Step 6: Update waitlist status to 'invited'
    const { success: statusUpdated, error: updateError } = await updateWaitlistStatus(
      waitlistId,
      'invited',
      'invited_at'
    );

    if (!statusUpdated) {
      console.error('⚠️ Failed to update waitlist status:', updateError);
      // Don't fail the request - invitation was sent successfully
    }

    return NextResponse.json({
      success: true,
      message: `Invitation sent to ${email}`,
      data: {
        email: email,
        expiresAt: expiresAt.toISOString(),
        invitationUrl: confirmationUrl
      }
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