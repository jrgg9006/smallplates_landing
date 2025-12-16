/**
 * Wedding onboarding data persistence functions
 * Handles saving onboarding responses for both couples and gift givers
 * Updated to save event data to groups table instead of profiles
 */

import { createSupabaseClient } from './client';
import { createClient } from '@supabase/supabase-js';
import { OnboardingData } from '@/lib/types/onboarding';
import { createGroupAdmin } from './groups';


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

      // Build full name for the user (person creating the account)
      let fullName = '';
      if (step2Data?.brideFirstName && step2Data?.brideLastName) {
        fullName = `${step2Data.brideFirstName} ${step2Data.brideLastName}`;
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

      // Profile only gets personal data (no couple info)
      profileData = {
        ...profileData,
        full_name: fullName,
        email: userEmail || step4Data?.email || ''
      };

      // Map planning stage to timeline
      let weddingTimeline = null;
      if (step1Data?.planningStage) {
        const planningStageMap = {
          'just-engaged': '6-plus-months',
          'deep-planning': '3-6-months',
          'almost-done': '1-3-months',
          'just-exploring': '6-plus-months'
        };
        weddingTimeline = planningStageMap[step1Data.planningStage as keyof typeof planningStageMap] || null;
      }

      // Build group name using couple's first names
      const groupName = step2Data?.brideFirstName && step2Data?.partnerFirstName 
        ? `${step2Data.brideFirstName} & ${step2Data.partnerFirstName}`
        : fullName;

      // Group gets event-specific data including both couple members
      groupData = {
        name: groupName,
        description: 'A collection of recipes from our loved ones',
        wedding_date: weddingDate,
        wedding_date_undecided: weddingDateUndecided,
        wedding_timeline: weddingTimeline,
        couple_first_name: step2Data?.brideFirstName || null,
        couple_last_name: step2Data?.brideLastName || null,
        partner_first_name: step2Data?.partnerFirstName || null,
        partner_last_name: step2Data?.partnerLastName || null,
        relationship_to_couple: null, // null for couples since they are the couple
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
        name: coupleName,
        description: 'A thoughtful gift collection of recipes',
        wedding_timeline: step1Data?.timeline || null,
        couple_first_name: step2Data?.firstName || null,
        couple_last_name: null, // Gift giver doesn't provide last names
        partner_first_name: step2Data?.partnerFirstName || null,
        partner_last_name: null, // Gift giver doesn't provide last names
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

    // Create group using the admin function
    const { data: group, error: groupError } = await createGroupAdmin(groupData);

    if (groupError) {
      console.error('Error creating group:', groupError);
      // Profile was created but group failed - still return success but log the issue
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