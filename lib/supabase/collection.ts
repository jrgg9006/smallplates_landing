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
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, full_name, collection_enabled')
      .eq('collection_link_token', token)
      .eq('collection_enabled', true)
      .single();

    if (error || !profile) {
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
): Promise<{ data: { guest_id: string; recipe_id: string } | null; error: string | null }> {
  const supabase = createSupabaseClient();
  
  try {
    // First validate the token and get user info
    const { data: tokenInfo, error: tokenError } = await validateCollectionToken(collectionToken);
    if (tokenError || !tokenInfo) {
      return { data: null, error: tokenError || 'Invalid collection link' };
    }

    // Search for existing guest
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
      
      // Update their status to 'submitted' if not already
      if (existingGuest.status === 'pending' || existingGuest.status === 'reached_out') {
        await supabase
          .from('guests')
          .update({ 
            status: 'submitted',
            recipes_received: (existingGuest.recipes_received || 0) + 1
          })
          .eq('id', guestId);
      } else {
        // Just increment recipe count
        await supabase
          .from('guests')
          .update({ 
            recipes_received: (existingGuest.recipes_received || 0) + 1
          })
          .eq('id', guestId);
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

      // Update the recipe count after creating the guest
      await supabase
        .from('guests')
        .update({ 
          recipes_received: 1
        })
        .eq('id', guestId);
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

    const { data: recipe, error: recipeError } = await supabase
      .from('guest_recipes')
      .insert(recipeData)
      .select()
      .single();

    if (recipeError || !recipe) {
      return { data: null, error: recipeError?.message || 'Failed to save recipe' };
    }

    return {
      data: {
        guest_id: guestId,
        recipe_id: recipe.id,
      },
      error: null
    };

  } catch (err) {
    console.error('Error submitting guest recipe:', err);
    return { data: null, error: 'An unexpected error occurred while submitting the recipe' };
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