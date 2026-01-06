/**
 * Collection API functions for recipe collection feature
 * Handles guest-facing recipe submission flow
 */

import { createSupabaseClient } from './client';
import { generateSessionId, uploadFilesToStagingWithClient, moveFilesToFinalLocationWithClient, cleanupStagingFiles } from './storage';
import { generateAndSaveMidjourneyPrompt } from './midjourneyPrompts';
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
 * If groupId is provided, it will look for custom message in group_members first
 */
export async function validateCollectionToken(token: string, groupId?: string | null): Promise<{ data: CollectionTokenInfo | null; error: string | null }> {
  const supabase = createSupabaseClient();
  
  try {
    console.log('🔍 Validating token:', token, 'groupId:', groupId);
    
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

    // Use profileCheck data directly (already validated above)
    const profile = profileCheck;

    // No profile fallback - only use group_members message
    let customShareMessage: string | null = null;
    let customShareSignature: string | null = null;
    let coupleNames: string | null = null;
    let coupleImageUrl: string | null = null;

    // If groupId is provided, get group-specific message, couple names, and image
    if (groupId) {
      // Get group info for couple names and image
      const { data: group } = await supabase
        .from('groups')
        .select('couple_first_name, partner_first_name, couple_image_url')
        .eq('id', groupId)
        .single();

      if (group) {
        if (group.couple_first_name && group.partner_first_name) {
          coupleNames = `${group.couple_first_name} & ${group.partner_first_name}`;
        } else if (group.couple_first_name) {
          coupleNames = group.couple_first_name;
        } else if (group.partner_first_name) {
          coupleNames = group.partner_first_name;
        }
        
        // Set couple image URL if available
        coupleImageUrl = group.couple_image_url;
      }

      // Get group-specific message from group_members
      const { data: groupMember } = await supabase
        .from('group_members')
        .select('custom_share_message, custom_share_signature')
        .eq('group_id', groupId)
        .eq('profile_id', profile.id)
        .single();

      if (groupMember?.custom_share_message) {
        console.log('📝 Using group-specific share message');
        customShareMessage = groupMember.custom_share_message;
        customShareSignature = groupMember.custom_share_signature || null;
      }
    }

    return {
      data: {
        user_id: profile.id,
        user_name: profile.full_name || 'Recipe Collector',
        raw_full_name: profile.full_name,
        custom_share_message: customShareMessage,
        custom_share_signature: customShareSignature,
        couple_names: coupleNames,
        couple_image_url: coupleImageUrl,
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
 * If groupId is provided, only returns guests who have contributed to that specific group
 */
export async function searchGuestInCollection(
  userId: string, 
  firstName: string, 
  lastName: string,
  groupId?: string | null
): Promise<{ data: Guest[] | null; error: string | null }> {
  const supabase = createSupabaseClient();
  
  try {
    // If groupId is provided, only show guests who have contributed to that specific group
    if (groupId) {
      console.log('🔍 Searching guests for specific group:', groupId);
      
      // First, get all guest_ids who have contributed to this specific group
      const { data: guestRecipes, error: recipesError } = await supabase
        .from('guest_recipes')
        .select('guest_id')
        .eq('group_id', groupId)
        .eq('user_id', userId);
      
      if (recipesError) {
        console.error('Error fetching guest recipes:', recipesError);
        return { data: null, error: recipesError.message };
      }
      
      // If no recipes found for this group, return empty array
      if (!guestRecipes || guestRecipes.length === 0) {
        console.log('📭 No guests have contributed to this group yet');
        return { data: [], error: null };
      }
      
      // Get unique guest IDs
      const uniqueGuestIds = [...new Set(guestRecipes.map(r => r.guest_id))];
      console.log(`📋 Found ${uniqueGuestIds.length} unique guests who contributed to this group`);
      
      // Now search for guests matching the name criteria within this group's contributors
      const { data: guests, error } = await supabase
        .from('guests')
        .select('*')
        .eq('user_id', userId)
        .eq('is_archived', false)
        .in('id', uniqueGuestIds)
        .ilike('first_name', `${firstName.trim()}%`)
        .ilike('last_name', `%${lastName.trim()}%`)
        .order('first_name', { ascending: true });

      if (error) {
        return { data: null, error: error.message };
      }

      return { data: guests || [], error: null };
    } else {
      // Original behavior when no groupId is provided
      console.log('🔍 Searching guests without group filter (general collection)');
      
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
    }
  } catch (err) {
    console.error('Error searching guest in collection:', err);
    return { data: null, error: 'Failed to search for guest' };
  }
}

/**
 * New improved upload flow: Create guest/recipe records first, then handle file uploads with proper hierarchy
 */
export async function submitGuestRecipeWithFiles(
  collectionToken: string,
  submission: CollectionGuestSubmission,
  files?: File[],
  context?: { cookbookId?: string | null; groupId?: string | null }
): Promise<{ 
  data: { 
    guest_id: string; 
    recipe_id: string; 
    guest_notify_opt_in?: boolean; 
    guest_notify_email?: string | null;
    file_urls?: string[];
  } | null; 
  error: string | null 
}> {
  const supabase = createSupabaseClient();
  let sessionId: string | null = null;
  let fileMetadata: Array<{originalName: string; tempPath: string; size: number; type: string}> = [];
  
  try {
    // Step 1: Validate token and get user info
    const { data: tokenInfo, error: tokenError } = await validateCollectionToken(collectionToken);
    if (tokenError || !tokenInfo) {
      return { data: null, error: tokenError || 'Invalid collection link' };
    }

    // Step 2: If files provided, upload to staging area first
    if (files && files.length > 0) {
      sessionId = generateSessionId();
      
      // Pass the same supabase instance to ensure consistent auth context
      const stagingResult = await uploadFilesToStagingWithClient(supabase, sessionId, files);
      
      if (stagingResult.error) {
        return { data: null, error: stagingResult.error };
      }
      
      fileMetadata = stagingResult.fileMetadata;
      console.log(`Successfully staged ${fileMetadata.length} files with session: ${sessionId}`);
    }

    // Step 3: Handle guest creation/update (same logic as original function)
    const { data: existingGuests } = await searchGuestInCollection(
      tokenInfo.user_id,
      submission.first_name,
      submission.last_name,
      context?.groupId  // Pass groupId to filter by specific group
    );

    let guestId: string;
    const existingGuest = existingGuests?.[0];

    if (existingGuest) {
      // Use existing guest
      guestId = existingGuest.id;
      
      // Update guest recipe count if needed
      const currentRecipeCount = existingGuest.recipes_received || 0;
      const expectedRecipes = existingGuest.number_of_recipes || 1;
      const willHaveRecipes = currentRecipeCount + 1;
      
      if (willHaveRecipes > expectedRecipes) {
        const { error: updateExpectedError } = await supabase
          .from('guests')
          .update({ number_of_recipes: willHaveRecipes })
          .eq('id', guestId);
          
        if (updateExpectedError) {
          if (sessionId) await cleanupStagingFiles(sessionId);
          return { data: null, error: 'Failed to update guest recipe limit' };
        }
      }

      // Update status to submitted if needed
      if (existingGuest.status === 'pending' || existingGuest.status === 'reached_out') {
        const { error: updateError } = await supabase
          .from('guests')
          .update({ status: 'submitted' })
          .eq('id', guestId);
        
        if (updateError) {
          if (sessionId) await cleanupStagingFiles(sessionId);
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
        group_id: context?.groupId || null,
      };

      const { data: newGuest, error: guestError } = await supabase
        .from('guests')
        .insert(newGuestData)
        .select()
        .single();

      if (guestError || !newGuest) {
        if (sessionId) await cleanupStagingFiles(sessionId);
        return { data: null, error: guestError?.message || 'Failed to create guest' };
      }

      guestId = newGuest.id;
    }

    // Step 4: Generate a temporary recipe ID for file organization
    // This allows us to organize files properly before creating the recipe
    const tempRecipeId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    let finalFileUrls: string[] = [];

    // Step 5: If files were staged, move them to final hierarchical location BEFORE creating recipe
    if (sessionId && fileMetadata.length > 0) {
      console.log(`Moving ${fileMetadata.length} files from staging to final location...`);
      
      const moveResult = await moveFilesToFinalLocationWithClient(
        supabase,
        tokenInfo.user_id,
        guestId,
        tempRecipeId,  // Use temp ID for now
        sessionId,
        fileMetadata
      );

      if (moveResult.error) {
        // Cleanup staging files on error
        if (sessionId) await cleanupStagingFiles(sessionId);
        return { data: null, error: moveResult.error };
      }

      finalFileUrls = moveResult.urls;
      console.log(`✅ Files moved successfully. URLs:`, finalFileUrls);
    }

    // Step 6: Create recipe record WITH document_urls already populated
    console.log('🔧 DEBUG: Creating recipe record with context:', {
      contextProvided: !!context,
      cookbookId: context?.cookbookId,
      groupId: context?.groupId,
      groupIdToSave: context?.groupId || null,
      documentUrls: finalFileUrls
    });
    
    const recipeData: GuestRecipeInsert = {
      guest_id: guestId,
      user_id: tokenInfo.user_id,
      recipe_name: submission.recipe_name.trim(),
      ingredients: submission.raw_recipe_text ? 'See full recipe' : (submission.upload_method === 'image' ? 'See uploaded images' : submission.ingredients.trim()),
      instructions: submission.raw_recipe_text ? 'See full recipe' : (submission.upload_method === 'image' ? 'See uploaded images' : submission.instructions.trim()),
      comments: submission.comments?.trim() || null,
      raw_recipe_text: submission.raw_recipe_text?.trim() || null,
      upload_method: submission.upload_method || 'text',
      document_urls: finalFileUrls.length > 0 ? finalFileUrls : null, // Include URLs in initial insert
      audio_url: submission.audio_url || null,
      submission_status: 'submitted',
      submitted_at: new Date().toISOString(),
      source: 'collection',
      group_id: context?.groupId || null,
    };
    
    console.log('🔧 DEBUG: Recipe data to insert:', {
      recipeDataKeys: Object.keys(recipeData),
      groupIdInData: recipeData.group_id,
      documentUrlsCount: recipeData.document_urls?.length || 0,
      fullRecipeData: recipeData
    });

    const { data: recipe, error: recipeError } = await supabase
      .from('guest_recipes')
      .insert(recipeData)
      .select()
      .single();

    if (recipeError || !recipe) {
      console.error('Recipe creation error:', recipeError);
      // TODO: Clean up uploaded files if recipe creation fails
      return { data: null, error: recipeError?.message || 'Failed to create recipe' };
    }

    console.log('✅ Recipe created successfully:', { 
      recipeId: recipe.id, 
      guestId, 
      userId: tokenInfo.user_id,
      groupIdSaved: recipe.group_id,
      contextGroupId: context?.groupId,
      documentUrlsSaved: recipe.document_urls
    });

    // Generate Midjourney prompt asynchronously (don't block recipe creation)
    // Only for text-based recipes (not image uploads or raw_recipe_text)
    if (recipe && submission.upload_method !== 'image' && !submission.raw_recipe_text) {
      generateAndSaveMidjourneyPrompt(
        recipe.id,
        submission.recipe_name.trim(),
        submission.ingredients.trim(),
        submission.instructions.trim()
      ).catch((error) => {
        // Log but don't throw - we don't want to break recipe creation
        console.error('Failed to generate Midjourney prompt:', error);
      });
    }

    // Step 7: If we used a temp ID for files, rename them to use the real recipe ID
    if (finalFileUrls.length > 0 && tempRecipeId !== recipe.id) {
      console.log(`📝 Note: Files were organized with temp ID ${tempRecipeId}, real recipe ID is ${recipe.id}`);
      // In a production system, you might want to rename the files here
      // For now, the files will work with the temp ID in the path
    }

    // Step 8: Automatically add recipe to cookbook/group if context is provided
    // Use API endpoint to bypass RLS (since we're in anonymous context)
    // Check if we have at least one valid context value (cookbookId OR groupId)
    const hasValidContext = context && (context.cookbookId || context.groupId);
    
    if (hasValidContext && recipe.id && tokenInfo) {
      
      try {
        const response = await fetch('/api/v1/collection/link-recipe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            recipeId: recipe.id,
            cookbookId: context.cookbookId || null,
            groupId: context.groupId || null,
            collectionToken: collectionToken,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.warn('❌ Failed to link recipe to cookbook/group:', errorData.error || 'Unknown error');
        }
      } catch (linkError) {
        console.error('Error linking recipe to cookbook/group:', linkError);
        // Don't fail the submission - recipe is still created
      }
    }

    // Step 9: Return success with all IDs and URLs
    return {
      data: {
        guest_id: guestId,
        recipe_id: recipe.id,
        guest_notify_opt_in: undefined, // These fields don't exist in current schema
        guest_notify_email: null,
        file_urls: finalFileUrls
      },
      error: null
    };

  } catch (err) {
    console.error('Error in submitGuestRecipeWithFiles:', err);
    // Cleanup on any error
    if (sessionId) await cleanupStagingFiles(sessionId);
    return { data: null, error: 'An unexpected error occurred while submitting the recipe' };
  }
}

/**
 * Submit a recipe from a guest (either existing or new)
 * @deprecated Use submitGuestRecipeWithFiles for new implementations
 */
export async function submitGuestRecipe(
  collectionToken: string,
  submission: CollectionGuestSubmission,
  context?: { cookbookId?: string | null; groupId?: string | null }
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
      submission.last_name,
      context?.groupId  // Pass groupId to filter by specific group
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
        group_id: context?.groupId || null,
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
      ingredients: submission.raw_recipe_text ? 'See full recipe' : (submission.upload_method === 'image' ? 'See uploaded images' : submission.ingredients.trim()),
      instructions: submission.raw_recipe_text ? 'See full recipe' : (submission.upload_method === 'image' ? 'See uploaded images' : submission.instructions.trim()),
      comments: submission.comments?.trim() || null,
      raw_recipe_text: submission.raw_recipe_text?.trim() || null,
      upload_method: submission.upload_method || 'text',
      document_urls: submission.document_urls || null,
      audio_url: submission.audio_url || null,
      submission_status: 'submitted',
      submitted_at: new Date().toISOString(),
      source: 'collection',
      group_id: context?.groupId || null,
    };

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

    // Generate Midjourney prompt asynchronously (don't block recipe creation)
    // Only for text-based recipes (not image uploads or raw_recipe_text)
    if (recipe && submission.upload_method !== 'image' && !submission.raw_recipe_text) {
      generateAndSaveMidjourneyPrompt(
        recipe.id,
        submission.recipe_name.trim(),
        submission.ingredients.trim(),
        submission.instructions.trim()
      ).catch((error) => {
        // Log but don't throw - we don't want to break recipe creation
        console.error('Failed to generate Midjourney prompt:', error);
      });
    }

    // Automatically add recipe to cookbook/group if context is provided
    // Use API endpoint to bypass RLS (since we're in anonymous context)
    // Check if we have at least one valid context value (cookbookId OR groupId)
    const hasValidContext = context && (context.cookbookId || context.groupId);

    if (hasValidContext && recipe.id && tokenInfo) {
      
      try {
        const response = await fetch('/api/v1/collection/link-recipe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            recipeId: recipe.id,
            cookbookId: context.cookbookId || null,
            groupId: context.groupId || null,
            collectionToken: collectionToken,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.warn('❌ Failed to link recipe to cookbook/group:', errorData.error || 'Unknown error');
        }
      } catch (linkError) {
        console.error('Error linking recipe to cookbook/group:', linkError);
        // Don't fail the submission - recipe is still created
      }
    }

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

/**
 * Get social proof data for a collection (recipe count for a specific group)
 * Used to show "X recipes and counting" on the collection landing page
 * 
 * IMPORTANT: groupId is required. If not provided, returns null (fail safe).
 */
export async function getCollectionSocialProof(
  groupId: string | null | undefined
): Promise<{
  data: { count: number } | null;
  error: string | null;
}> {
  // If no groupId, don't show social proof (fail safe)
  if (!groupId) {
    return { data: null, error: null };
  }
  
  try {
    const supabase = createSupabaseClient();
    
    // Count recipes for this specific group only
    const { count, error } = await supabase
      .from('guest_recipes')
      .select('*', { count: 'exact', head: true })
      .eq('group_id', groupId)
      .eq('submission_status', 'submitted');
    
    if (error) {
      console.error('Error fetching social proof:', error);
      return { data: null, error: error.message };
    }
    
    return {
      data: { count: count || 0 },
      error: null
    };
  } catch (err) {
    console.error('Error in getCollectionSocialProof:', err);
    return { data: null, error: 'Failed to fetch social proof data' };
  }
}