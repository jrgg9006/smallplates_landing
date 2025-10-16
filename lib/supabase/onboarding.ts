/**
 * Onboarding data persistence functions
 * Handles saving onboarding responses to the database
 */

import { createSupabaseClient } from './client';
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

    // Extract personal information from step 2
    const step2Data = answers.step2;
    if (!step2Data?.firstName || !step2Data?.lastName || !step2Data?.email) {
      return {
        data: null,
        error: 'Personal information not found in onboarding answers'
      };
    }

    // Map category to specific number
    const recipeGoalNumber = mapRecipeCategoryToNumber(recipeCount);

    // Build full name - concatenate with partner if exists
    let fullName = `${step2Data.firstName} ${step2Data.lastName}`;
    if (step2Data.hasPartner && step2Data.partnerFirstName && step2Data.partnerLastName) {
      fullName = `${step2Data.firstName} ${step2Data.lastName} and ${step2Data.partnerFirstName} ${step2Data.partnerLastName}`;
    }

    // Update the user's profile with onboarding data
    const { data, error } = await supabase
      .from('profiles')
      .update({
        full_name: fullName,
        email: step2Data.email,
        recipe_goal_category: recipeCount,
        recipe_goal_number: recipeGoalNumber,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
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