/**
 * Collection API functions for recipe collection feature
 * Handles guest-facing recipe submission flow
 */

import { createSupabaseClient } from './client';
import type { 
  CollectionTokenInfo, 
  CollectionGuestSubmission, 
  Guest, 
  GuestInsert,
  GuestRecipeInsert,
  Profile 
} from '@/lib/types/database';

/**
 * Validate a collection token and get user info
 */
export async function validateCollectionToken(token: string): Promise<{ data: CollectionTokenInfo | null; error: string | null }> {
  const supabase = createSupabaseClient();
  
  try {
    console.log('🔍 Validating token:', token);
    
    // First, let's check if the token exists at all (without collection_enabled filter)
    const { data: profileCheck, error: checkError } = await supabase
      .from('profiles')
      .select('id, full_name, collection_enabled, collection_link_token')
      .eq('collection_link_token', token)
      .single();
    
    console.log('📊 Profile check result:', { profileCheck, checkError });
    
    if (checkError) {
      console.log('❌ Token not found in database:', checkError.message);
      return { data: null, error: 'Invalid or expired collection link' };
    }
    
    if (!profileCheck.collection_enabled) {
      console.log('❌ Collection disabled for this user');
      return { data: null, error: 'Collection is disabled for this user' };
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, full_name, collection_enabled')
      .eq('collection_link_token', token)
      .eq('collection_enabled', true)
      .single();

    if (error || !profile) {
      console.log('❌ Final validation failed:', error);
      return { data: null, error: 'Invalid or expired collection link' };
    }

    return {
      data: {
        user_id: profile.id,
        user_name: profile.full_name || 'Recipe Collector',
        raw_full_name: profile.full_name,
        token,
        is_valid: true,
      },
      error: null
    };
  } catch (err) {
    console.error('Error validating collection token:', err);
    return { data: null, error: 'Failed to validate collection link' };
  }
}

/**
 * Search for a guest by name within a specific user's guest list
 */
export async function searchGuestInCollection(
  userId: string, 
  firstName: string, 
  lastName: string
): Promise<{ data: Guest[] | null; error: string | null }> {
  const supabase = createSupabaseClient();
  
  try {
    // Search for guests where first name starts with the initial and last name matches
    const { data: guests, error } = await supabase
      .from('guests')
      .select('*')
      .eq('user_id', userId)
      .eq('is_archived', false)
      .ilike('first_name', `${firstName.trim()}%`)
      .ilike('last_name', `%${lastName.trim()}%`)
      .order('first_name', { ascending: true });

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: guests || [], error: null };
  } catch (err) {
    console.error('Error searching guest in collection:', err);
    return { data: null, error: 'Failed to search for guest' };
  }
}

/**
 * Submit a recipe from a guest (either existing or new)
 */
export async function submitGuestRecipe(
  collectionToken: string,
  submission: CollectionGuestSubmission
): Promise<{ data: { guest_id: string; recipe_id: string; guest_notify_opt_in?: boolean; guest_notify_email?: string | null } | null; error: string | null }> {
  const supabase = createSupabaseClient();
  
  try {
    // First validate the token and get user info
    const { data: tokenInfo, error: tokenError } = await validateCollectionToken(collectionToken);
    if (tokenError || !tokenInfo) {
      return { data: null, error: tokenError || 'Invalid collection link' };
    }

    // Search for existing guest by name (and later we also store email if provided)
    const { data: existingGuests } = await searchGuestInCollection(
      tokenInfo.user_id,
      submission.first_name,
      submission.last_name
    );

    let guestId: string;

    // Use the first matching guest if any exist
    const existingGuest = existingGuests?.[0];

    if (existingGuest) {
      // Use existing guest
      guestId = existingGuest.id;
      
      // Get current guest data to check if we need to increase expected recipe count
      const currentRecipeCount = existingGuest.recipes_received || 0;
      const expectedRecipes = existingGuest.number_of_recipes || 1;
      const willHaveRecipes = currentRecipeCount + 1;
      
      console.log('Guest recipe count check:', {
        guestId,
        currentRecipeCount,
        expectedRecipes,
        willHaveRecipes
      });
      
      // If we need more expected recipes, update that first (same as addRecipe function)
      if (willHaveRecipes > expectedRecipes) {
        console.log(`Updating number_of_recipes from ${expectedRecipes} to ${willHaveRecipes}`);
        const { error: updateExpectedError } = await supabase
          .from('guests')
          .update({ number_of_recipes: willHaveRecipes })
          .eq('id', guestId);
          
        if (updateExpectedError) {
          console.error('Failed to update number_of_recipes:', updateExpectedError);
          return { data: null, error: 'Failed to update guest recipe limit' };
        }
      }

      // Update status to submitted if needed (don't touch recipes_received - let triggers handle it)
      if (existingGuest.status === 'pending' || existingGuest.status === 'reached_out') {
        const { error: updateError } = await supabase
          .from('guests')
          .update({ status: 'submitted' })
          .eq('id', guestId);
        
        if (updateError) {
          console.error('Error updating guest status:', updateError);
          return { data: null, error: updateError.message };
        }
      }
    } else {
      // Create new guest
      const newGuestData: GuestInsert = {
        user_id: tokenInfo.user_id,
        first_name: submission.first_name.trim(),
        last_name: submission.last_name.trim(),
        email: submission.email?.trim() || '',
        phone: submission.phone?.trim() || null,
        status: 'submitted',
        source: 'collection',
        number_of_recipes: 1,
        recipes_received: 0,
        is_archived: false,
      };

      const { data: newGuest, error: guestError } = await supabase
        .from('guests')
        .insert(newGuestData)
        .select()
        .single();

      if (guestError || !newGuest) {
        return { data: null, error: guestError?.message || 'Failed to create guest' };
      }

      guestId = newGuest.id;
    }

    // Now create the recipe
    const recipeData: GuestRecipeInsert = {
      guest_id: guestId,
      user_id: tokenInfo.user_id,
      recipe_name: submission.recipe_name.trim(),
      ingredients: submission.ingredients.trim(),
      instructions: submission.instructions.trim(),
      comments: submission.comments?.trim() || null,
      submission_status: 'submitted',
      submitted_at: new Date().toISOString(),
    };

    // DEBUG: Log authentication status and recipe data
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    console.log('🔍 DEBUG - Before recipe insert:', {
      isAnonymous: currentUser === null,
      currentUserId: currentUser?.id || 'NULL (anonymous)',
      recipeUserId: tokenInfo.user_id,
      guestId: guestId,
      recipeData: {
        recipe_name: recipeData.recipe_name,
        user_id: recipeData.user_id,
      }
    });

    const { data: recipe, error: recipeError } = await supabase
      .from('guest_recipes')
      .insert(recipeData)
      .select()
      .single();

    if (recipeError || !recipe) {
      console.error('❌ Recipe insert failed:', {
        error: recipeError,
        errorMessage: recipeError?.message,
        errorCode: recipeError?.code,
        errorDetails: recipeError?.details,
      });
      return { data: null, error: recipeError?.message || 'Failed to save recipe' };
    }

    // Fetch guest notify fields to drive UI (show/hide opt-in controls)
    const { data: guestRow } = await supabase
      .from('guests')
      .select('notify_opt_in, notify_email')
      .eq('id', guestId)
      .single();

    return {
      data: {
        guest_id: guestId,
        recipe_id: recipe.id,
        guest_notify_opt_in: guestRow?.notify_opt_in ?? undefined,
        guest_notify_email: (guestRow?.notify_email as string | null) ?? undefined,
      },
      error: null
    };

  } catch (err) {
    console.error('Error submitting guest recipe:', err);
    return { data: null, error: 'An unexpected error occurred while submitting the recipe' };
  }
}

/**
 * Update a guest recipe with notification preferences (optional)
 */
export async function updateGuestRecipeNotification(
  recipeId: string,
  opts: { notify_opt_in?: boolean; notify_email?: string | null }
): Promise<{ error: string | null }> {
  const supabase = createSupabaseClient();
  try {
    const update: Record<string, any> = {};
    if (typeof opts.notify_opt_in === 'boolean') update.notify_opt_in = opts.notify_opt_in;
    if (typeof opts.notify_email !== 'undefined') update.notify_email = opts.notify_email || null;

    if (Object.keys(update).length === 0) return { error: null };

    const { error } = await supabase
      .from('guest_recipes')
      .update(update)
      .eq('id', recipeId);

    return { error: error?.message || null };
  } catch (err) {
    console.error('Error updating recipe notification:', err);
    return { error: 'Failed to update notification preferences' };
  }
}

/**
 * Update guest-level notification preferences
 */
export async function updateGuestNotification(
  guestId: string,
  opts: { notify_opt_in?: boolean; notify_email?: string | null }
): Promise<{ error: string | null }> {
  const supabase = createSupabaseClient();
  try {
    const update: Record<string, any> = {};
    if (typeof opts.notify_opt_in === 'boolean') update.notify_opt_in = opts.notify_opt_in;
    if (typeof opts.notify_email !== 'undefined') update.notify_email = opts.notify_email || null;
    if (update.notify_opt_in === true) {
      update.notify_opt_in_at = new Date().toISOString();
    }

    if (Object.keys(update).length === 0) return { error: null };

    const { error } = await supabase
      .from('guests')
      .update(update)
      .eq('id', guestId);

    return { error: error?.message || null };
  } catch (err) {
    console.error('Error updating guest notification:', err);
    return { error: 'Failed to update guest notification preferences' };
  }
}

/**
 * Generate a new collection token for a user
 */
export async function regenerateCollectionToken(userId: string): Promise<{ data: string | null; error: string | null }> {
  const supabase = createSupabaseClient();
  
  try {
    // Generate new token using database function
    const { data: tokenResult, error: tokenError } = await supabase
      .rpc('generate_collection_token');

    if (tokenError || !tokenResult) {
      return { data: null, error: 'Failed to generate new token' };
    }

    // Update user's profile with new token
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ collection_link_token: tokenResult })
      .eq('id', userId);

    if (updateError) {
      return { data: null, error: updateError.message };
    }

    return { data: tokenResult, error: null };
  } catch (err) {
    console.error('Error regenerating collection token:', err);
    return { data: null, error: 'Failed to regenerate collection token' };
  }
}

/**
 * Get user's current collection token
 */
export async function getUserCollectionToken(): Promise<{ data: string | null; error: string | null }> {
  const supabase = createSupabaseClient();
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { data: null, error: 'User not authenticated' };
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('collection_link_token')
      .eq('id', user.id)
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: profile?.collection_link_token || null, error: null };
  } catch (err) {
    console.error('Error getting user collection token:', err);
    return { data: null, error: 'Failed to get collection token' };
  }
}

/**
 * Toggle collection enabled status for a user
 */
export async function toggleCollectionEnabled(enabled: boolean): Promise<{ data: boolean | null; error: string | null }> {
  const supabase = createSupabaseClient();
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { data: null, error: 'User not authenticated' };
    }

    const { error } = await supabase
      .from('profiles')
      .update({ collection_enabled: enabled })
      .eq('id', user.id);

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: enabled, error: null };
  } catch (err) {
    console.error('Error toggling collection enabled:', err);
    return { data: null, error: 'Failed to update collection settings' };
  }
}