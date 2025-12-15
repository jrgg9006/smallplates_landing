/**
 * API Route - Join Group (Direct Link)
 * Handles group joining via direct link without token
 * Creates account if needed, adds user to group
 * For existing users, verifies password before adding to group
 * Similar to token-based join but without invitation tracking
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

export async function POST(
  request: Request,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const { groupId } = await params;
    const { password, firstName, lastName, email: providedEmail } = await request.json();

    // Validate input
    if (!groupId) {
      return NextResponse.json(
        { error: 'Group ID is required' },
        { status: 400 }
      );
    }

    if (!providedEmail?.trim()) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const email = providedEmail.trim().toLowerCase();

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      );
    }

    console.log('🔗 Direct join request for group:', groupId);
    console.log('📧 Email:', email);

    // Step 1: Verify group exists
    const { data: group, error: groupError } = await supabaseAdmin
      .from('groups')
      .select('id, name, description')
      .eq('id', groupId)
      .single();

    if (groupError || !group) {
      console.error('❌ Group not found:', groupError);
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      );
    }

    console.log('✅ Group found:', group.name);

    // Check if user already exists in Supabase Auth
    const { data: { users }, error: getUsersError } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = users?.find(u => u.email?.toLowerCase() === email);
    
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
        .eq('group_id', groupId)
        .eq('profile_id', userId)
        .single();

      if (existingMember) {
        console.error('❌ User already a member of group');
        return NextResponse.json({
          success: true,
          message: 'You are already a member of this group',
          data: {
            userId,
            isNewUser: false,
            groupId: group.id,
            groupName: group.name,
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
        email_confirm: true, // Auto-confirm email
        user_metadata: {
          joined_from_direct_link: true,
          group_id: groupId,
          group_name: group.name,
          firstName: firstName.trim(),
          lastName: lastName?.trim() || '',
          full_name: fullName
        }
      });

      if (signUpError) {
        console.error('❌ Error creating user:', signUpError);
        
        // Handle duplicate email
        if (signUpError.message?.includes('already registered')) {
          return NextResponse.json(
            { error: 'This email is already registered. Please log in first, then visit the join link again.' },
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

      userId = signUpData.user.id;
      isNewUser = true;

      console.log('✅ New user created successfully:', userId);
    }

    // Step 2: Add user to group as member
    // For direct links, we don't have an inviter, so set invited_by to null
    const { error: memberError } = await supabaseAdmin
      .from('group_members')
      .insert({
        group_id: groupId,
        profile_id: userId,
        role: 'member',
        invited_by: null // No specific inviter for direct links
      });

    if (memberError) {
      console.error('❌ Error adding user to group:', memberError);
      
      // If it's a duplicate error, that's actually fine (race condition)
      if (memberError.code === '23505') {
        console.log('ℹ️ User already in group (duplicate key), continuing...');
      } else {
        return NextResponse.json(
          { error: 'Failed to add user to group' },
          { status: 500 }
        );
      }
    } else {
      console.log('✅ User added to group successfully');
    }

    console.log('✅ Direct group join complete');

    // Return success with user data
    return NextResponse.json({
      success: true,
      message: isNewUser ? 'Account created and added to group successfully' : 'Added to group successfully',
      data: {
        userId,
        email,
        isNewUser,
        groupId: group.id,
        groupName: group.name,
        groupDescription: group.description
      }
    });

  } catch (error) {
    console.error('❌ Unexpected error in direct group join:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to join group'
      },
      { status: 500 }
    );
  }
}

