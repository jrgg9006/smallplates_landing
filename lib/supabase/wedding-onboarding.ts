/**
 * Wedding onboarding data persistence functions
 * Handles saving onboarding responses for both couples and gift givers
 */

import { createSupabaseClient } from './client';
import { createClient } from '@supabase/supabase-js';
import { OnboardingData } from '@/lib/types/onboarding';

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
export async function createUserProfileAdmin(userId: string, answers: OnboardingData, userType: 'couple' | 'gift_giver') {
  try {
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

    let profileData: any = {
      id: userId,
      user_type: userType,
      collection_link_token: newToken,
      collection_enabled: true,
      updated_at: new Date().toISOString()
    };

    if (userType === 'couple') {
      // Extract couple data
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

      // Parse wedding date
      let weddingDate = null;
      let weddingDateUndecided = false;
      if (step2Data?.dateUndecided) {
        weddingDateUndecided = true;
      } else if (step2Data?.weddingDate) {
        weddingDate = step2Data.weddingDate;
      }

      profileData = {
        ...profileData,
        full_name: fullName,
        email: step4Data?.email || '',
        wedding_date: weddingDate,
        wedding_date_undecided: weddingDateUndecided,
        planning_stage: step1Data?.planningStage || null,
        partner_first_name: step2Data?.partnerFirstName || null,
        partner_last_name: step2Data?.partnerLastName || null,
        guest_count: step3Data?.guestCount || null,
      };
    } else {
      // Extract gift giver data
      const step1Data = answers.step1;
      const step2Data = answers.step2;
      const step3Data = answers.step3;

      profileData = {
        ...profileData,
        full_name: step2Data?.giftGiverName || '',
        email: step3Data?.email || '',
        timeline: step1Data?.timeline || null,
        couple_first_name: step2Data?.firstName || null,
        couple_partner_name: step2Data?.partnerFirstName || null,
        relationship_to_couple: step2Data?.relationship || null,
      };
    }

    // Create profile with admin privileges
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .upsert(profileData)
      .select();

    if (error) {
      console.error('Error creating profile with admin:', error);
      return { data: null, error: error.message };
    }

    return { data: data?.[0] || null, error: null };

  } catch (err) {
    console.error('Error in createUserProfileAdmin:', err);
    return { 
      data: null, 
      error: err instanceof Error ? err.message : 'Unknown error occurred' 
    };
  }
}