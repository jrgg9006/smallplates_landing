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
 * @param isAdditionalBook - When true, only creates group (user already has profile)
 */
export async function createUserProfileAdmin(userId: string, answers: OnboardingData, userType: 'couple' | 'gift_giver', userEmail?: string, isAdditionalBook: boolean = false) {
  try {
    // Debug logging for all incoming data
    console.log('🔍 CREATE PROFILE ADMIN DEBUG:', {
      userId,
      userType,
      userEmail,
      isAdditionalBook,
      answers,
      answersKeys: Object.keys(answers),
      step1: answers.step1,
      step3: answers.step3,
      step4: answers.step4,
      step5: answers.step5
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

    // Reason: Skip profile updates for additional books to preserve existing verification token
    let emailVerificationToken: string | null = null;
    let profile: any = null;

    if (!isAdditionalBook) {
      // Generate collection token
      const { data: newToken, error: tokenError } = await supabaseAdmin
        .rpc('generate_collection_token');

      if (tokenError || !newToken) {
        console.error('Failed to generate collection token:', tokenError);
        return { data: null, error: 'Failed to generate collection token' };
      }

      // Generate email verification token
      emailVerificationToken = crypto.randomUUID();
      const emailVerificationExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

      // Base profile data (only personal info)
      var profileData: any = {
        id: userId,
        user_type: userType,
        collection_link_token: newToken,
        collection_enabled: true,
        email_verification_token: emailVerificationToken,
        email_verification_expires_at: emailVerificationExpiresAt,
        email_verified: false,
        updated_at: new Date().toISOString()
      };
    }

    // Group data (event-specific info)
    let groupData: any = null;

    if (userType === 'couple') {
      // Extract couple data
      // step1 = planning stage, step3 = couple info, step4 = guest count (unused), step5 = email
      const step1Data = answers.step1;
      const coupleInfoData = answers.step3; // Couple names, wedding date
      const accountData = answers.step5; // Email/password

      // Build full name for the user (person creating the account)
      let fullName = '';
      if (coupleInfoData?.brideFirstName && coupleInfoData?.brideLastName) {
        fullName = `${coupleInfoData.brideFirstName} ${coupleInfoData.brideLastName}`;
      } else if (coupleInfoData?.brideFirstName) {
        fullName = coupleInfoData.brideFirstName;
      }

      // Parse wedding date
      let weddingDate = null;
      let weddingDateUndecided = false;
      if (coupleInfoData?.dateUndecided) {
        weddingDateUndecided = true;
      } else if (coupleInfoData?.weddingDate) {
        weddingDate = coupleInfoData.weddingDate;
      }

      // Debug logging for couple profile
      console.log('🔍 COUPLE PROFILE DEBUG:', {
        accountData,
        email: accountData?.email,
        emailExists: !!accountData?.email,
        fullName,
        individualNames: {
          couple_first_name: coupleInfoData?.brideFirstName,
          couple_last_name: coupleInfoData?.brideLastName,
          couple_partner_first_name: coupleInfoData?.partnerFirstName,
          couple_partner_last_name: coupleInfoData?.partnerLastName
        }
      });

      // Profile only gets personal data (no couple info) - skip for additional books
      if (!isAdditionalBook) {
        profileData = {
          ...profileData,
          full_name: fullName,
          email: userEmail || accountData?.email || ''
        };
      }

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
      const groupName = coupleInfoData?.brideFirstName && coupleInfoData?.partnerFirstName
        ? `${coupleInfoData.brideFirstName} & ${coupleInfoData.partnerFirstName}`
        : fullName;

      // Build couple display name for emails (consistent format)
      const coupleDisplayName = coupleInfoData?.brideFirstName && coupleInfoData?.partnerFirstName
        ? `${coupleInfoData.brideFirstName} & ${coupleInfoData.partnerFirstName}`
        : fullName;

      // Group gets event-specific data including both couple members
      groupData = {
        name: groupName,
        description: 'A collection of recipes from our loved ones',
        wedding_date: weddingDate,
        wedding_date_undecided: weddingDateUndecided,
        wedding_timeline: weddingTimeline,
        couple_first_name: coupleInfoData?.brideFirstName || null,
        couple_last_name: coupleInfoData?.brideLastName || null,
        partner_first_name: coupleInfoData?.partnerFirstName || null,
        partner_last_name: coupleInfoData?.partnerLastName || null,
        couple_display_name: coupleDisplayName,
        relationship_to_couple: null, // null for couples since they are the couple
        created_by: userId
      };

    } else {
      // Extract gift giver data
      // step1 = timeline, step3 = gift giver + couple info, step4 = email/password
      const step1Data = answers.step1;
      const giftGiverInfoData = answers.step3; // giftGiverName, firstName, partnerFirstName, relationship
      const accountData = answers.step4; // email, password

      // Debug logging for gift giver profile
      console.log('🔍 GIFT GIVER PROFILE DEBUG:', {
        accountData,
        email: accountData?.email,
        emailExists: !!accountData?.email,
        giftGiverName: giftGiverInfoData?.giftGiverName,
        isAdditionalBook
      });

      // Profile only gets personal data - skip for additional books
      if (!isAdditionalBook) {
        profileData = {
          ...profileData,
          full_name: giftGiverInfoData?.giftGiverName || '',
          email: userEmail || accountData?.email || ''
        };
      }

      // Group gets event-specific data for gift givers
      const coupleName = `${giftGiverInfoData?.firstName || ''} & ${giftGiverInfoData?.partnerFirstName || ''}`.trim();

      // Build couple display name for emails (same format as couple flow)
      const coupleDisplayName = giftGiverInfoData?.firstName && giftGiverInfoData?.partnerFirstName
        ? `${giftGiverInfoData.firstName} & ${giftGiverInfoData.partnerFirstName}`
        : coupleName;

      groupData = {
        name: coupleName,
        description: 'A thoughtful gift collection of recipes',
        wedding_timeline: step1Data?.timeline || null,
        couple_first_name: giftGiverInfoData?.firstName || null,
        couple_last_name: null, // Gift giver doesn't provide last names
        partner_first_name: giftGiverInfoData?.partnerFirstName || null,
        partner_last_name: null, // Gift giver doesn't provide last names
        couple_display_name: coupleDisplayName,
        relationship_to_couple: giftGiverInfoData?.relationship || null,
        created_by: userId
      };
    }

    // Create profile with admin privileges - skip for additional books
    if (!isAdditionalBook) {
      const { data: createdProfile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .upsert(profileData)
        .select()
        .single();

      if (profileError) {
        console.error('Error creating profile with admin:', profileError);
        return { data: null, error: profileError.message };
      }
      profile = createdProfile;

      // Also update Supabase Auth user metadata with display name
      if (profileData.full_name) {
        const { error: metadataError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
          user_metadata: { display_name: profileData.full_name }
        });
        if (metadataError) {
          console.error('Error updating user metadata:', metadataError);
          // Don't fail - profile was created successfully
        }
      }
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