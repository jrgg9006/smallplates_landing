/**
 * API Route - Accept Group Invitation
 * Handles group invitation acceptance for both new and existing users
 * Creates account if needed, adds user to group, marks invitation as accepted
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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

export async function POST(request: Request) {
  try {
    const { token, password, firstName, lastName, email: providedEmail } = await request.json();

    // Validate input
    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }

    console.log('🔐 Accepting group invitation with token:', token);

    // Step 1: Verify invitation is valid and get details
    const { data: invitation, error: inviteError } = await supabaseAdmin
      .from('group_invitations')
      .select(`
        *,
        groups (
          id,
          name,
          description
        )
      `)
      .eq('token', token)
      .single();

    if (inviteError || !invitation) {
      console.error('❌ Invalid group invitation:', inviteError);
      return NextResponse.json(
        { error: 'Invalid invitation link' },
        { status: 404 }
      );
    }

    // Check if expired
    const now = new Date();
    const expiresAt = new Date(invitation.expires_at);
    
    if (now > expiresAt) {
      console.error('❌ Group invitation expired');
      return NextResponse.json(
        { error: 'This invitation has expired' },
        { status: 410 }
      );
    }

    // Check if already used
    if (invitation.status === 'accepted') {
      console.error('❌ Group invitation already accepted');
      return NextResponse.json(
        { error: 'This invitation has already been accepted' },
        { status: 410 }
      );
    }

    console.log('✅ Group invitation is valid for:', invitation.email);

    // Use email from invitation (trusted source) or provided email
    const email = invitation.email || providedEmail;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Check if user already exists in Supabase Auth
    const { data: { users }, error: getUsersError } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = users?.find(u => u.email === email);
    
    let userId: string;
    let isNewUser = false;

    if (existingUser) {
      // User exists - verify password before adding them to the group
      userId = existingUser.id;
      console.log('👤 Existing user found:', userId);
      
      // Verify password for existing users
      if (!password) {
        return NextResponse.json(
          { error: 'Password is required to verify your account' },
          { status: 400 }
        );
      }

      // Try to sign in with the provided password to verify it's correct
      const { data: signInData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
        email: email.toLowerCase(),
        password: password
      });

      if (signInError || !signInData.user) {
        console.error('❌ Password verification failed:', signInError);
        return NextResponse.json(
          { error: 'Invalid password. Please check your password and try again.' },
          { status: 401 }
        );
      }

      // Verify that the signed-in user matches the existing user
      if (signInData.user.id !== userId) {
        console.error('❌ User ID mismatch during password verification');
        // Sign out to clean up
        await supabaseAdmin.auth.signOut();
        return NextResponse.json(
          { error: 'Authentication error. Please try again.' },
          { status: 401 }
        );
      }

      console.log('✅ Password verified for existing user');
      
      // Sign out after verification - frontend will create its own session
      // This ensures no server-side session is left hanging
      await supabaseAdmin.auth.signOut();
      
      // Check if user is already a member of this group
      const { data: existingMember } = await supabaseAdmin
        .from('group_members')
        .select('profile_id')
        .eq('group_id', invitation.group_id)
        .eq('profile_id', userId)
        .single();

      if (existingMember) {
        console.error('❌ User already a member of group');
        
        // Mark invitation as accepted anyway
        await supabaseAdmin
          .from('group_invitations')
          .update({
            status: 'accepted'
          })
          .eq('token', token);

        return NextResponse.json({
          success: true,
          message: 'You are already a member of this group',
          data: {
            userId,
            isNewUser: false,
            groupId: invitation.group_id,
            groupName: invitation.groups.name,
            alreadyMember: true
          }
        });
      }

    } else {
      // New user - create account
      if (!password) {
        return NextResponse.json(
          { error: 'Password is required for new users' },
          { status: 400 }
        );
      }

      if (password.length < 8) {
        return NextResponse.json(
          { error: 'Password must be at least 8 characters long' },
          { status: 400 }
        );
      }

      if (!firstName?.trim()) {
        return NextResponse.json(
          { error: 'First name is required' },
          { status: 400 }
        );
      }

      const fullName = `${firstName.trim()} ${(lastName || '').trim()}`.trim();

      console.log('👤 Creating new user account for:', email);

      const { data: signUpData, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true, // Auto-confirm email since it's from invitation
        user_metadata: {
          invited_from_group: true,
          group_id: invitation.group_id,
          group_name: invitation.groups.name,
          firstName: firstName.trim(),
          lastName: lastName?.trim() || '',
          full_name: fullName
        }
      });

      if (signUpError) {
        console.error('❌ Error creating user:', signUpError);
        
        // Handle duplicate email - check if user was created by another concurrent request
        if (signUpError.message?.includes('already registered') || signUpError.message?.includes('User already registered')) {
          console.log('⚠️ User already exists (race condition), fetching existing user...');
          // Re-fetch the user list to get the newly created user
          const { data: { users: refreshedUsers }, error: refreshError } = await supabaseAdmin.auth.admin.listUsers();
          const refreshedUser = refreshedUsers?.find(u => u.email === email);
          
          if (refreshedUser) {
            userId = refreshedUser.id;
            console.log('✅ Found existing user after race condition:', userId);
          } else {
            return NextResponse.json(
              { error: 'Unable to create or find user account. Please try again.' },
              { status: 500 }
            );
          }
        } else {
          return NextResponse.json(
            { error: signUpError.message || 'Failed to create account' },
            { status: 500 }
          );
        }
      }

      if (!signUpData.user) {
        console.error('❌ No user data returned');
        return NextResponse.json(
          { error: 'Failed to create account' },
          { status: 500 }
        );
      }

      userId = signUpData.user.id;
      isNewUser = true;

      console.log('✅ New user created successfully:', userId);
    }

    // Step 2: Add user to group as member (using upsert for race condition protection)
    const { error: memberError } = await supabaseAdmin
      .from('group_members')
      .upsert({
        group_id: invitation.group_id,
        profile_id: userId,
        role: 'member',
        invited_by: invitation.invited_by,
        relationship_to_couple: invitation.relationship_to_couple
      }, {
        onConflict: 'group_id,profile_id'
      });

    if (memberError) {
      console.error('❌ Error adding user to group:', memberError);
      return NextResponse.json(
        { error: 'Failed to add user to group: ' + memberError.message },
        { status: 500 }
      );
    } else {
      console.log('✅ User added to group successfully');
    }

    // Step 3: Mark invitation as accepted
    const { error: updateError } = await supabaseAdmin
      .from('group_invitations')
      .update({
        status: 'accepted'
      })
      .eq('token', token);

    if (updateError) {
      console.error('⚠️ Failed to mark invitation as accepted:', updateError);
      // Don't fail the request - user was created and added to group successfully
    }

    console.log('✅ Group invitation acceptance complete');

    // Return success with user data
    return NextResponse.json({
      success: true,
      message: isNewUser ? 'Account created and added to group successfully' : 'Added to group successfully',
      data: {
        userId,
        email,
        isNewUser,
        groupId: invitation.group_id,
        groupName: invitation.groups.name,
        groupDescription: invitation.groups.description
      }
    });

  } catch (error) {
    console.error('❌ Unexpected error in group invitation acceptance:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to accept invitation'
      },
      { status: 500 }
    );
  }
}