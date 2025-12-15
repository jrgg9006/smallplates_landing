/**
 * Wedding onboarding data persistence functions
 * Handles saving onboarding responses for both couples and gift givers
 * Updated to save event data to groups table instead of profiles
 */

import { createSupabaseClient } from './client';
import { createClient } from '@supabase/supabase-js';
import { OnboardingData } from '@/lib/types/onboarding';
import { createGroup } from './groups';

/**
 * Save couple onboarding data
 * 
 * Args:
 *   userId (string): The user's UUID
 *   answers (OnboardingData): Complete onboarding answers
 * 
 * Returns:
 *   Promise<{data: any, error: string | null}>
 */
export async function saveCoupleOnboardingData(userId: string, answers: OnboardingData) {
  try {
    const supabase = createSupabaseClient();

    // Extract data from steps
    const step1Data = answers.step1;
    const step2Data = answers.step2;
    const step3Data = answers.step3;
    const step4Data = answers.step4;

    // Build full name
    let fullName = '';
    if (step2Data?.brideFirstName && step2Data?.brideLastName) {
      fullName = `${step2Data.brideFirstName} ${step2Data.brideLastName}`;
      if (step2Data.partnerFirstName && step2Data.partnerLastName) {
        fullName += ` and ${step2Data.partnerFirstName} ${step2Data.partnerLastName}`;
      }
    }

    // Generate collection token for the user
    const { data: newToken, error: tokenError } = await supabase
      .rpc('generate_collection_token');

    if (tokenError || !newToken) {
      console.error('Failed to generate collection token:', tokenError);
      return {
        data: null,
        error: 'Failed to generate collection token'
      };
    }

    // Parse wedding date
    let weddingDate = null;
    let weddingDateUndecided = false;
    if (step2Data?.dateUndecided) {
      weddingDateUndecided = true;
    } else if (step2Data?.weddingDate) {
      weddingDate = step2Data.weddingDate;
    }

    // Create or update the user's profile with onboarding data using upsert
    const { data, error } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        full_name: fullName,
        email: step4Data?.email || '',
        user_type: 'couple',
        wedding_date: weddingDate,
        wedding_date_undecided: weddingDateUndecided,
        planning_stage: step1Data?.planningStage || null,
        partner_first_name: step2Data?.partnerFirstName || null,
        partner_last_name: step2Data?.partnerLastName || null,
        guest_count: step3Data?.guestCount || null,
        collection_link_token: newToken,
        collection_enabled: true,
        updated_at: new Date().toISOString()
      })
      .select();

    if (error) {
      console.error('Error saving couple onboarding data:', error);
      return {
        data: null,
        error: error.message
      };
    }

    return {
      data: data?.[0] || null,
      error: null
    };

  } catch (err) {
    console.error('Error in saveCoupleOnboardingData:', err);
    return {
      data: null,
      error: err instanceof Error ? err.message : 'Unknown error occurred'
    };
  }
}

/**
 * Save gift giver onboarding data
 * 
 * Args:
 *   userId (string): The user's UUID
 *   answers (OnboardingData): Complete onboarding answers
 * 
 * Returns:
 *   Promise<{data: any, error: string | null}>
 */
export async function saveGiftGiverOnboardingData(userId: string, answers: OnboardingData) {
  try {
    const supabase = createSupabaseClient();

    // Extract data from steps
    const step1Data = answers.step1;
    const step2Data = answers.step2;
    const step3Data = answers.step3;

    // Generate collection token for the user
    const { data: newToken, error: tokenError } = await supabase
      .rpc('generate_collection_token');

    if (tokenError || !newToken) {
      console.error('Failed to generate collection token:', tokenError);
      return {
        data: null,
        error: 'Failed to generate collection token'
      };
    }

    // Create or update the user's profile with onboarding data using upsert
    const { data, error } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        full_name: step2Data?.giftGiverName || '',
        email: step3Data?.email || '',
        user_type: 'gift_giver',
        timeline: step1Data?.timeline || null,
        couple_first_name: step2Data?.firstName || null,
        couple_partner_name: step2Data?.partnerFirstName || null,
        relationship_to_couple: step2Data?.relationship || null,
        collection_link_token: newToken,
        collection_enabled: true,
        updated_at: new Date().toISOString()
      })
      .select();

    if (error) {
      console.error('Error saving gift giver onboarding data:', error);
      return {
        data: null,
        error: error.message
      };
    }

    return {
      data: data?.[0] || null,
      error: null
    };

  } catch (err) {
    console.error('Error in saveGiftGiverOnboardingData:', err);
    return {
      data: null,
      error: err instanceof Error ? err.message : 'Unknown error occurred'
    };
  }
}

/**
 * Create user profile with admin privileges (bypasses RLS)
 * Used during onboarding when user is not yet authenticated
 * Supports both couple and gift giver types
 */
export async function createUserProfileAdmin(userId: string, answers: OnboardingData, userType: 'couple' | 'gift_giver', userEmail?: string) {
  try {
    // Debug logging for all incoming data
    console.log('🔍 CREATE PROFILE ADMIN DEBUG:', {
      userId,
      userType,
      userEmail,
      answers,
      answersKeys: Object.keys(answers),
      step1: answers.step1,
      step2: answers.step2,
      step3: answers.step3,
      step4: answers.step4
    });
    // Use admin client to bypass RLS
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!, // Service role key
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Generate collection token
    const { data: newToken, error: tokenError } = await supabaseAdmin
      .rpc('generate_collection_token');

    if (tokenError || !newToken) {
      console.error('Failed to generate collection token:', tokenError);
      return { data: null, error: 'Failed to generate collection token' };
    }

    // Generate email verification token
    const emailVerificationToken = crypto.randomUUID();
    const emailVerificationExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

    // Base profile data (only personal info)
    let profileData: any = {
      id: userId,
      user_type: userType,
      collection_link_token: newToken,
      collection_enabled: true,
      email_verification_token: emailVerificationToken,
      email_verification_expires_at: emailVerificationExpiresAt,
      email_verified: false,
      updated_at: new Date().toISOString()
    };

    // Group data (event-specific info)
    let groupData: any = null;

    if (userType === 'couple') {
      // Extract couple data
      const step1Data = answers.step1;
      const step2Data = answers.step2;
      const step3Data = answers.step3;
      const step4Data = answers.step4;

      // Build full name
      let fullName = '';
      if (step2Data?.brideFirstName && step2Data?.partnerFirstName) {
        fullName = `${step2Data.brideFirstName} & ${step2Data.partnerFirstName}`;
      } else if (step2Data?.brideFirstName) {
        fullName = step2Data.brideFirstName;
      }

      // Parse wedding date
      let weddingDate = null;
      let weddingDateUndecided = false;
      if (step2Data?.dateUndecided) {
        weddingDateUndecided = true;
      } else if (step2Data?.weddingDate) {
        weddingDate = step2Data.weddingDate;
      }

      // Debug logging for couple profile
      console.log('🔍 COUPLE PROFILE DEBUG:', {
        step4Data,
        email: step4Data?.email,
        emailExists: !!step4Data?.email,
        fullName,
        individualNames: {
          couple_first_name: step2Data?.brideFirstName,
          couple_last_name: step2Data?.brideLastName,
          couple_partner_first_name: step2Data?.partnerFirstName,
          couple_partner_last_name: step2Data?.partnerLastName
        }
      });

      // Profile only gets personal data
      profileData = {
        ...profileData,
        full_name: fullName,
        email: userEmail || step4Data?.email || '',
        couple_first_name: step2Data?.brideFirstName || null,
        couple_last_name: step2Data?.brideLastName || null,
        couple_partner_first_name: step2Data?.partnerFirstName || null,
        couple_partner_last_name: step2Data?.partnerLastName || null
      };

      // Group gets event-specific data
      groupData = {
        name: fullName,
        description: 'A collection of recipes from our loved ones',
        wedding_date: weddingDate,
        wedding_date_undecided: weddingDateUndecided,
        planning_stage: step1Data?.planningStage || null,
        partner_first_name: step2Data?.partnerFirstName || null,
        partner_last_name: step2Data?.partnerLastName || null,
        created_by: userId
      };

    } else {
      // Extract gift giver data
      const step1Data = answers.step1;
      const step2Data = answers.step2;
      const step3Data = answers.step3;

      // Debug logging for gift giver profile
      console.log('🔍 GIFT GIVER PROFILE DEBUG:', {
        step3Data,
        email: step3Data?.email,
        emailExists: !!step3Data?.email,
        giftGiverName: step2Data?.giftGiverName
      });

      // Profile only gets personal data
      profileData = {
        ...profileData,
        full_name: step2Data?.giftGiverName || '',
        email: userEmail || step3Data?.email || ''
      };

      // Group gets event-specific data for gift givers
      const coupleName = `${step2Data?.firstName || ''} & ${step2Data?.partnerFirstName || ''}`.trim();
      groupData = {
        name: `${coupleName}'s Wedding Cookbook`,
        description: 'A thoughtful gift collection of recipes',
        timeline: step1Data?.timeline || null,
        partner_first_name: step2Data?.partnerFirstName || null,
        relationship_to_couple: step2Data?.relationship || null,
        created_by: userId
      };
    }

    // Create profile with admin privileges
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert(profileData)
      .select()
      .single();

    if (profileError) {
      console.error('Error creating profile with admin:', profileError);
      return { data: null, error: profileError.message };
    }

    // Create group using admin client (this will also trigger cookbook creation)
    const { data: group, error: groupError } = await supabaseAdmin
      .from('groups')
      .insert(groupData)
      .select()
      .single();

    if (groupError) {
      console.error('Error creating group:', groupError);
      // Profile was created but group failed - still return success but log the issue
    }

    // Add user as owner of the group
    if (group) {
      const { error: memberError } = await supabaseAdmin
        .from('group_members')
        .insert({
          group_id: group.id,
          profile_id: userId,
          role: 'owner'
        });

      if (memberError) {
        console.error('Error adding user to group:', memberError);
      }
    }

    return { 
      data: {
        profile,
        group,
        emailVerificationToken
      }, 
      error: null 
    };

  } catch (err) {
    console.error('Error in createUserProfileAdmin:', err);
    return { 
      data: null, 
      error: err instanceof Error ? err.message : 'Unknown error occurred' 
    };
  }
}