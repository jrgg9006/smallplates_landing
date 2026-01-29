/**
 * API Route - Activate Account from Purchase
 * Creates user account and profile from purchase intent data
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createUserProfileAdmin } from '@/lib/supabase/wedding-onboarding';
import { OnboardingData } from '@/lib/types/onboarding';

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

    // Get activation record with purchase intent data
    const { data: activation, error: activationError } = await supabaseAdmin
      .from('purchase_activations')
      .select(`
        *,
        purchase_intents (*)
      `)
      .eq('token', token)
      .single();

    if (activationError || !activation) {
      return NextResponse.json(
        { error: 'Invalid activation token' },
        { status: 404 }
      );
    }

    // Check if already used
    if (activation.used) {
      return NextResponse.json(
        { error: 'This activation link has already been used' },
        { status: 410 }
      );
    }

    // Check if expired
    const now = new Date();
    const expiresAt = new Date(activation.expires_at);
    if (now > expiresAt) {
      return NextResponse.json(
        { error: 'This activation link has expired' },
        { status: 410 }
      );
    }

    const purchaseIntent = activation.purchase_intents as any;

    // Check if email already exists
    const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers();
    const userExists = existingUser?.users?.some(u => u.email === activation.email);

    if (userExists) {
      return NextResponse.json(
        { error: 'An account with this email already exists. Please login instead.' },
        { status: 409 }
      );
    }

    // Create user account in Supabase Auth
    const { data: signUpData, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
      email: activation.email,
      password: password,
      email_confirm: true, // Auto-confirm since they paid
      user_metadata: {
        from_purchase_intent: true,
        purchase_intent_id: purchaseIntent.id,
        user_type: purchaseIntent.user_type
      }
    });

    if (signUpError) {
      console.error('❌ Error creating user:', signUpError);
      return NextResponse.json(
        { error: signUpError.message || 'Failed to create account' },
        { status: 500 }
      );
    }

    if (!signUpData.user) {
      return NextResponse.json(
        { error: 'Failed to create account' },
        { status: 500 }
      );
    }

    console.log('✅ User created successfully:', signUpData.user.id);

    // Check if a group already exists for this purchase intent
    // Find other users who activated from the same purchase_intent
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const usersFromSameIntent = existingUsers?.users?.filter(u => 
      u.user_metadata?.purchase_intent_id === purchaseIntent.id &&
      u.id !== signUpData.user.id // Exclude current user
    ) || [];

    let existingGroupId: string | null = null;
    let firstUserFromIntent: string | null = null;

    if (usersFromSameIntent.length > 0) {
      // Find groups where these users are owners
      const userIds = usersFromSameIntent.map(u => u.id);
      firstUserFromIntent = userIds[0]; // Use first user as inviter
      
      const { data: existingGroups } = await supabaseAdmin
        .from('group_members')
        .select('group_id')
        .in('profile_id', userIds)
        .eq('role', 'owner')
        .limit(1);
      
      if (existingGroups && existingGroups.length > 0) {
        existingGroupId = existingGroups[0].group_id;
        console.log('✅ Found existing group for purchase intent:', existingGroupId);
      }
    }

    // Convert purchase intent data to onboarding format
    const onboardingData: OnboardingData = {
      step1: purchaseIntent.user_type === 'couple' 
        ? { planningStage: purchaseIntent.planning_stage || undefined }
        : { timeline: purchaseIntent.timeline || undefined },
      step3: purchaseIntent.user_type === 'couple'
        ? {
            brideFirstName: purchaseIntent.couple_first_name || '',
            brideLastName: purchaseIntent.couple_last_name || '',
            partnerFirstName: purchaseIntent.partner_first_name || '',
            partnerLastName: purchaseIntent.partner_last_name || '',
            weddingDate: purchaseIntent.wedding_date || undefined,
            dateUndecided: purchaseIntent.wedding_date_undecided || false
          }
        : {
            giftGiverName: purchaseIntent.gift_giver_name || '',
            firstName: purchaseIntent.couple_first_name || '',
            partnerFirstName: purchaseIntent.partner_first_name || '',
            relationship: purchaseIntent.relationship || ''
          },
      step4: purchaseIntent.user_type === 'couple'
        ? { guestCount: purchaseIntent.guest_count || undefined }
        : { email: activation.email },
      step5: purchaseIntent.user_type === 'couple' 
        ? { email: activation.email }
        : undefined
    };

    // Create profile and group using existing function
    // If group already exists, only create profile (isAdditionalBook = true)
    const { data: profileData, error: profileError } = await createUserProfileAdmin(
      signUpData.user.id,
      onboardingData,
      purchaseIntent.user_type as 'couple' | 'gift_giver',
      activation.email,
      existingGroupId !== null // isAdditionalBook = true if group exists
    );

    if (profileError) {
      console.error('❌ Error creating profile:', profileError);
      // User was created but profile failed - this is bad but we'll continue
      // The user can still login and we can fix this manually
    }

    // If group already exists, add user as captain (admin) to existing group
    if (existingGroupId && firstUserFromIntent) {
      // Check if user is already a member (shouldn't happen, but safety check)
      const { data: existingMember } = await supabaseAdmin
        .from('group_members')
        .select('profile_id')
        .eq('group_id', existingGroupId)
        .eq('profile_id', signUpData.user.id)
        .single();

      if (!existingMember) {
        const { error: memberError } = await supabaseAdmin
          .from('group_members')
          .insert({
            group_id: existingGroupId,
            profile_id: signUpData.user.id,
            role: 'member', // Captain role (shown as "Captain" in UI)
            invited_by: firstUserFromIntent
          });

        if (memberError) {
          console.error('❌ Error adding user to existing group:', memberError);
          // Don't fail - user can still access their account
        } else {
          console.log('✅ Added user as captain to existing group');
        }
      } else {
        console.log('ℹ️ User already a member of the group');
      }
    }

    // Mark activation as used
    const { error: updateError } = await supabaseAdmin
      .from('purchase_activations')
      .update({
        used: true,
        used_at: new Date().toISOString()
      })
      .eq('token', token);

    if (updateError) {
      console.error('⚠️ Error marking activation as used:', updateError);
      // Don't fail the request - account was created successfully
    }

    // Update purchase intent status to 'paid' and link to profile
    const { error: intentUpdateError } = await supabaseAdmin
      .from('purchase_intents')
      .update({
        status: 'paid',
        migrated_to_profile_id: signUpData.user.id,
        migrated_at: new Date().toISOString()
      })
      .eq('id', purchaseIntent.id);

    if (intentUpdateError) {
      console.error('⚠️ Error updating purchase intent:', intentUpdateError);
      // Don't fail the request
    }

    return NextResponse.json({
      success: true,
      message: 'Account activated successfully',
      userId: signUpData.user.id
    });

  } catch (err) {
    console.error('Error activating account:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
