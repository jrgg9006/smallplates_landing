/**
 * Onboarding data persistence functions
 * Handles saving onboarding responses to the database
 */

import { createSupabaseClient } from './client';
import { createClient } from '@supabase/supabase-js';
import { OnboardingData } from '@/lib/types/onboarding';

/**
 * Map onboarding recipe category to specific goal number
 */
function mapRecipeCategoryToNumber(category: string): number {
  switch (category) {
    case '40-or-less':
      return 40;
    case '40-60':
      return 60;
    case '60-or-more':
      return 80; // Setting a specific goal for "60 or more"
    default:
      return 40; // Default fallback
  }
}

/**
 * Save onboarding answers to user profile
 * 
 * Args:
 *   userId (string): The user's UUID
 *   answers (OnboardingData): Complete onboarding answers
 * 
 * Returns:
 *   Promise<{data: any, error: string | null}>
 */
export async function saveOnboardingData(userId: string, answers: OnboardingData) {
  try {
    const supabase = createSupabaseClient();

    // Extract recipe goal from step 1 answers
    const recipeCount = answers.step1?.recipeCount;
    
    if (!recipeCount) {
      return {
        data: null,
        error: 'Recipe count not found in onboarding answers'
      };
    }

    // Extract use case from step 2
    const useCase = answers.step2?.useCase;

    // Extract personal information from step 3
    const step3Data = answers.step3;
    if (!step3Data?.firstName || !step3Data?.lastName || !step3Data?.email) {
      return {
        data: null,
        error: 'Personal information not found in onboarding answers'
      };
    }

    // Map category to specific number
    const recipeGoalNumber = mapRecipeCategoryToNumber(recipeCount);

    // Build full name - concatenate with partner if exists
    let fullName = `${step3Data.firstName} ${step3Data.lastName}`;
    if (step3Data.hasPartner && step3Data.partnerFirstName && step3Data.partnerLastName) {
      fullName = `${step3Data.firstName} ${step3Data.lastName} and ${step3Data.partnerFirstName} ${step3Data.partnerLastName}`;
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

    // Create or update the user's profile with onboarding data using upsert
    const { data, error } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        full_name: fullName,
        email: step3Data.email,
        recipe_goal_category: recipeCount,
        recipe_goal_number: recipeGoalNumber,
        use_case: useCase || null,
        collection_link_token: newToken,
        collection_enabled: true,
        updated_at: new Date().toISOString()
      })
      .select();

    if (error) {
      console.error('Error saving onboarding data:', error);
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
    console.error('Error in saveOnboardingData:', err);
    return {
      data: null,
      error: err instanceof Error ? err.message : 'Unknown error occurred'
    };
  }
}

/**
 * Get user's onboarding data from profile
 * 
 * Args:
 *   userId (string): The user's UUID
 * 
 * Returns:
 *   Promise<{data: any, error: string | null}>
 */
export async function getUserOnboardingData(userId: string) {
  try {
    const supabase = createSupabaseClient();

    const { data, error } = await supabase
      .from('profiles')
      .select('recipe_goal_category, recipe_goal_number')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user onboarding data:', error);
      return {
        data: null,
        error: error.message
      };
    }

    return {
      data,
      error: null
    };

  } catch (err) {
    console.error('Error in getUserOnboardingData:', err);
    return {
      data: null,
      error: err instanceof Error ? err.message : 'Unknown error occurred'
    };
  }
}

/**
 * Create user profile with admin privileges (bypasses RLS)
 * Used during onboarding when user is not yet authenticated
 */
export async function createUserProfileAdmin(userId: string, step2Data: any) {
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

    // Build full name
    let fullName = `${step2Data.firstName} ${step2Data.lastName}`;
    if (step2Data.hasPartner && step2Data.partnerFirstName && step2Data.partnerLastName) {
      fullName = `${step2Data.firstName} ${step2Data.lastName} and ${step2Data.partnerFirstName} ${step2Data.partnerLastName}`;
    }

    // Map recipe count to number
    const recipeGoalNumber = mapRecipeCategoryToNumber(step2Data.recipeCount || '40');

    // Create profile with admin privileges
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: userId,
        full_name: fullName,
        email: step2Data.email,
        recipe_goal_category: step2Data.recipeCount,
        recipe_goal_number: recipeGoalNumber,
        use_case: step2Data.useCase || null,
        collection_link_token: newToken,
        collection_enabled: true,
        updated_at: new Date().toISOString()
      })
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