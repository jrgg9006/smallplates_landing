/**
 * User progress tracking functions
 * Handles calculation of recipe collection progress towards goals
 */

import { createSupabaseClient } from './client';

export interface UserProgress {
  current_recipes: number;      // Total recipes collected
  goal_recipes: number;         // Target recipes from onboarding
  progress_percentage: number;  // Percentage towards goal (0-100)
  goal_category: string | null; // Original onboarding category
  is_goal_reached: boolean;     // Whether user has reached their goal
}

/**
 * Get user's recipe collection progress
 * Calculates total recipes collected across all guests vs goal
 * 
 * Args:
 *   userId (string): The user's UUID
 * 
 * Returns:
 *   Promise<{data: UserProgress | null, error: string | null}>
 */
export async function getUserProgress(userId: string) {
  try {
    const supabase = createSupabaseClient();

    // Get user's recipe goal from profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('recipe_goal_number, recipe_goal_category')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('Error fetching user profile:', profileError);
      return {
        data: null,
        error: profileError.message
      };
    }

    // Get total recipes collected from all guests (excluding archived/deleted guests)
    const { data: guestStats, error: statsError } = await supabase
      .from('guests')
      .select('recipes_received')
      .eq('user_id', userId)
      .eq('is_archived', false);

    if (statsError) {
      console.error('Error fetching guest stats:', statsError);
      return {
        data: null,
        error: statsError.message
      };
    }

    // Calculate total recipes collected
    const totalRecipesCollected = guestStats.reduce(
      (total, guest) => total + (guest.recipes_received || 0), 
      0
    );

    // Use default goal if not set (for existing users)
    const goalRecipes = profile.recipe_goal_number || 40;
    
    // Calculate progress percentage (capped at 100%)
    const progressPercentage = Math.min(
      (totalRecipesCollected / goalRecipes) * 100, 
      100
    );

    const progressData: UserProgress = {
      current_recipes: totalRecipesCollected,
      goal_recipes: goalRecipes,
      progress_percentage: Math.round(progressPercentage * 100) / 100, // Round to 2 decimal places
      goal_category: profile.recipe_goal_category,
      is_goal_reached: totalRecipesCollected >= goalRecipes
    };

    return {
      data: progressData,
      error: null
    };

  } catch (err) {
    console.error('Error in getUserProgress:', err);
    return {
      data: null,
      error: err instanceof Error ? err.message : 'Unknown error occurred'
    };
  }
}

/**
 * Update user's recipe goal (allows them to change their target)
 * 
 * Args:
 *   userId (string): The user's UUID
 *   newGoal (number): New recipe goal number
 *   newCategory (string): New goal category (optional)
 * 
 * Returns:
 *   Promise<{data: any, error: string | null}>
 */
export async function updateUserGoal(
  userId: string, 
  newGoal: number, 
  newCategory?: string
) {
  try {
    const supabase = createSupabaseClient();

    const updateData: any = {
      recipe_goal_number: newGoal,
      updated_at: new Date().toISOString()
    };

    if (newCategory) {
      updateData.recipe_goal_category = newCategory;
    }

    const { data, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', userId)
      .select();

    if (error) {
      console.error('Error updating user goal:', error);
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
    console.error('Error in updateUserGoal:', err);
    return {
      data: null,
      error: err instanceof Error ? err.message : 'Unknown error occurred'
    };
  }
}