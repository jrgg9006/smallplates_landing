import { createSupabaseClient } from '@/lib/supabase/client';
import { getCurrentProfile } from '@/lib/supabase/profiles';
import {
  uploadFilesToStagingWithClient,
  moveFilesToFinalLocationWithClient,
  cleanupStagingFiles,
  generateSessionId,
} from '@/lib/supabase/storage';
import type {
  GuestRecipe,
  GuestRecipeInsert,
  GuestRecipeUpdate,
  RecipeFormData,
} from '@/lib/types/database';

// User recipe types
export interface UserRecipeData {
  recipeName: string;
  ingredients: string;
  instructions: string;
  personalNote?: string;
  upload_method?: 'text' | 'image';
  document_urls?: string[];
}

/**
 * Add a new recipe for a guest
 */
export async function addRecipe(guestId: string, formData: RecipeFormData) {
  const supabase = createSupabaseClient();
  
  // Get the current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return { data: null, error: 'User not authenticated' };
  }

  try {
    // Get current guest data to check if we need to increase expected recipe count
    const { data: guestData, error: guestFetchError } = await supabase
      .from('guests')
      .select('recipes_received, number_of_recipes')
      .eq('id', guestId)
      .single();
      
    if (guestFetchError) {
      console.error('Failed to fetch guest data:', guestFetchError);
      return { data: null, error: 'Failed to fetch guest data' };
    }
    
    const currentRecipes = guestData?.recipes_received || 0;
    const expectedRecipes = guestData?.number_of_recipes || 1;
    const willHaveRecipes = currentRecipes + 1;
    
    // If we need more expected recipes, update that first
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

    // Now insert the recipe as submitted - let triggers handle the rest
    const recipeData: GuestRecipeInsert = {
      guest_id: guestId,
      user_id: user.id,
      recipe_name: formData.recipe_name,
      ingredients: formData.upload_method === 'image' ? 'See uploaded images' : formData.ingredients,
      instructions: formData.upload_method === 'image' ? `${formData.document_urls?.length || 0} images uploaded` : formData.instructions,
      comments: formData.comments,
      upload_method: formData.upload_method || 'text',
      document_urls: formData.document_urls || null,
      submission_status: 'submitted',
      submitted_at: new Date().toISOString(),
    };

    console.log('Inserting recipe with data:', recipeData);
    const { data: insertedRecipe, error: recipeError } = await supabase
      .from('guest_recipes')
      .insert(recipeData)
      .select()
      .single();
      
    if (recipeError) {
      console.error('Recipe insert error:', recipeError);
      return { data: null, error: recipeError.message };
    }

    console.log('Recipe inserted successfully:', insertedRecipe);
    return { data: insertedRecipe, error: null };
    
  } catch (err) {
    console.error('Unexpected error in addRecipe:', err);
    return { data: null, error: 'An unexpected error occurred' };
  }
}

/**
 * Get all recipes for a specific guest
 */
export async function getRecipesByGuest(guestId: string) {
  const supabase = createSupabaseClient();
  
  const { data, error } = await supabase
    .from('guest_recipes')
    .select('*')
    .eq('guest_id', guestId)
    .order('created_at', { ascending: false });

  return { data, error: error?.message || null };
}

/**
 * Get all recipes for the current user
 */
export async function getAllRecipes() {
  const supabase = createSupabaseClient();
  
  const { data, error } = await supabase
    .from('guest_recipes')
    .select(`
      *,
      guests (
        first_name,
        last_name,
        printed_name,
        email,
        is_self,
        source
      )
    `)
    .order('updated_at', { ascending: false });

  return { data, error: error?.message || null };
}

/**
 * Search recipes by recipe name, guest name, or ingredients
 */
export async function searchRecipes(searchQuery: string) {
  const supabase = createSupabaseClient();
  
  // Get the current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return { data: null, error: 'User not authenticated' };
  }

  if (!searchQuery.trim()) {
    // If search query is empty, return all recipes
    return getAllRecipes();
  }

  const searchTerm = searchQuery.trim();

  try {
    // First, find guests that match the search query
    const { data: matchingGuests, error: guestsError } = await supabase
      .from('guests')
      .select('id')
      .eq('user_id', user.id)
      .or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,printed_name.ilike.%${searchTerm}%`);

    const guestIds = matchingGuests?.map(g => g.id) || [];

    // Search recipes by recipe name, ingredients, or instructions
    const { data: recipesByContent, error: recipesError } = await supabase
      .from('guest_recipes')
      .select(`
        *,
        guests (
          first_name,
          last_name,
          printed_name,
          email,
          is_self,
          source
        )
      `)
      .eq('user_id', user.id)
      .or(`recipe_name.ilike.%${searchTerm}%,ingredients.ilike.%${searchTerm}%,instructions.ilike.%${searchTerm}%`)
      .order('updated_at', { ascending: false });

    if (recipesError) {
      return { data: null, error: recipesError.message };
    }

    // If we found matching guests, also get their recipes
    let recipesByGuest: any[] = [];
    if (guestIds.length > 0) {
      const { data: guestRecipes, error: guestRecipesError } = await supabase
        .from('guest_recipes')
        .select(`
          *,
          guests (
            first_name,
            last_name,
            printed_name,
            email,
            is_self,
            source
          )
        `)
        .eq('user_id', user.id)
        .in('guest_id', guestIds)
        .order('updated_at', { ascending: false });

      if (!guestRecipesError && guestRecipes) {
        recipesByGuest = guestRecipes;
      }
    }

    // Combine and deduplicate recipes
    const allRecipes = [...(recipesByContent || []), ...recipesByGuest];
    const uniqueRecipes = Array.from(
      new Map(allRecipes.map(recipe => [recipe.id, recipe])).values()
    );

    // Sort by updated_at descending (most recently updated first)
    uniqueRecipes.sort((a, b) => {
      const aDate = new Date(a.updated_at).getTime();
      const bDate = new Date(b.updated_at).getTime();
      return bDate - aDate;
    });

    return { data: uniqueRecipes, error: null };
  } catch (err) {
    console.error('Error searching recipes:', err);
    return { data: null, error: 'Failed to search recipes' };
  }
}

/**
 * Get recipes by submission status
 */
export async function getRecipesByStatus(status: GuestRecipe['submission_status']) {
  const supabase = createSupabaseClient();
  
  const { data, error } = await supabase
    .from('guest_recipes')
    .select(`
      *,
      guests (
        first_name,
        last_name,
        printed_name,
        email,
        is_self
      )
      `)
      .eq('submission_status', status)
      .order('updated_at', { ascending: false });

  return { data, error: error?.message || null };
}

/**
 * Update a recipe
 */
export async function updateRecipe(recipeId: string, updates: GuestRecipeUpdate) {
  const supabase = createSupabaseClient();
  
  const { data, error } = await supabase
    .from('guest_recipes')
    .update(updates)
    .eq('id', recipeId)
    .select()
    .single();

  return { data, error: error?.message || null };
}

/**
 * Submit a recipe (mark as submitted)
 */
export async function submitRecipe(recipeId: string) {
  return updateRecipe(recipeId, {
    submission_status: 'submitted',
    submitted_at: new Date().toISOString(),
  });
}

/**
 * Approve a recipe
 */
export async function approveRecipe(recipeId: string) {
  return updateRecipe(recipeId, {
    submission_status: 'approved',
    approved_at: new Date().toISOString(),
  });
}

/**
 * Reject a recipe
 */
export async function rejectRecipe(recipeId: string) {
  return updateRecipe(recipeId, {
    submission_status: 'rejected',
  });
}

/**
 * Delete a recipe
 */
export async function deleteRecipe(recipeId: string) {
  const supabase = createSupabaseClient();
  
  const { error } = await supabase
    .from('guest_recipes')
    .delete()
    .eq('id', recipeId);

  return { data: null, error: error?.message || null };
}

/**
 * Add a user's own recipe to their collection
 */
export async function addUserRecipe(recipeData: UserRecipeData) {
  const supabase = createSupabaseClient();
  
  // Get the current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return { data: null, error: 'User not authenticated' };
  }

  try {
    // Get user's profile to get their name
    const { data: profile, error: profileError } = await getCurrentProfile();
    if (profileError) {
      console.error('Failed to get user profile:', profileError);
      return { data: null, error: 'Failed to get user profile' };
    }

    // Extract name from profile
    const fullName = profile?.full_name || '';
    const nameParts = fullName.split(' ');
    const firstName = nameParts[0] || 'My';
    const lastName = nameParts.slice(1).join(' ') || 'Recipes';

    // Check if user has a "self" guest entry
    let { data: selfGuest, error: selfGuestError } = await supabase
      .from('guests')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_self', true)
      .single();

    // If no self guest exists, create a NEW one
    // IMPORTANT: We do NOT update existing guests to is_self = true
    // because that would make all their recipes appear as "My Own"
    // even if they were added in a different context
    if (selfGuestError || !selfGuest) {
      // Try to create a new self guest
      const { data: newSelfGuest, error: createError } = await supabase
        .from('guests')
        .insert({
          user_id: user.id,
          first_name: firstName,
          last_name: lastName,
          email: user.email || '',
          is_self: true,
          status: 'submitted',
          number_of_recipes: 1,
          recipes_received: 0,
          is_archived: false,
          source: 'manual'
        })
        .select('id')
        .single();

      if (createError) {
        // If it fails due to unique constraint, a guest with this email already exists
        // But we should NOT update it - instead, we need to handle this edge case
        console.error('Failed to create self guest:', createError);
        const errorMessage = createError.message || createError.details || 'Failed to create recipe collection';
        
        // Check if it's a unique constraint violation
        if (errorMessage.includes('unique_guest_per_user')) {
          // A guest with this email exists but is NOT a self guest
          // We cannot create a new one due to unique constraint
          // We also cannot update it because it might have recipes from other contexts
          // Best solution: return a helpful error message
          return { 
            data: null, 
            error: 'Unable to create your recipe collection. A guest with your email already exists. Please contact support to resolve this issue.' 
          };
        }
        
        return { data: null, error: errorMessage };
      }

      if (!newSelfGuest) {
        return { data: null, error: 'Failed to create recipe collection: No guest returned' };
      }

      selfGuest = newSelfGuest;
    }

    // Before adding the recipe, ensure number_of_recipes is sufficient
    // Get current guest data to check if we need to increase expected recipe count
    const { data: guestData, error: guestFetchError } = await supabase
      .from('guests')
      .select('recipes_received, number_of_recipes')
      .eq('id', selfGuest.id)
      .single();
      
    if (guestFetchError) {
      console.error('Failed to fetch guest data:', guestFetchError);
      return { data: null, error: 'Failed to fetch guest data' };
    }
    
    const currentRecipes = guestData?.recipes_received || 0;
    const expectedRecipes = guestData?.number_of_recipes || 1;
    const willHaveRecipes = currentRecipes + 1;
    
    // If we need more expected recipes, update that first (same logic as addRecipe)
    if (willHaveRecipes > expectedRecipes) {
      console.log(`Updating number_of_recipes from ${expectedRecipes} to ${willHaveRecipes}`);
      const { error: updateExpectedError } = await supabase
        .from('guests')
        .update({ number_of_recipes: willHaveRecipes })
        .eq('id', selfGuest.id);
        
      if (updateExpectedError) {
        console.error('Failed to update number_of_recipes:', updateExpectedError);
        return { data: null, error: 'Failed to update guest recipe limit' };
      }
    }

    // Add the recipe with correct column names
    // Use 'submitted' status so the trigger increments recipes_received
    // User's own recipes are auto-approved but stored as 'submitted' for consistency
    const { data, error } = await supabase
      .from('guest_recipes')
      .insert({
        guest_id: selfGuest.id,
        user_id: user.id,
        recipe_name: recipeData.recipeName,
        ingredients: recipeData.upload_method === 'image' ? 'See uploaded images' : recipeData.ingredients,
        instructions: recipeData.upload_method === 'image' ? `${recipeData.document_urls?.length || 0} images uploaded` : recipeData.instructions,
        comments: recipeData.personalNote || null,
        upload_method: recipeData.upload_method || 'text',
        document_urls: recipeData.document_urls || null,
        submission_status: 'submitted',
        submitted_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to add user recipe:', error);
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (err) {
    console.error('Unexpected error in addUserRecipe:', err);
    return { data: null, error: 'An unexpected error occurred' };
  }
}

/**
 * Add a recipe with file uploads (for image mode)
 * Handles file staging, recipe creation, and file move to final location
 */
export async function addRecipeWithFiles(
  guestId: string | null,
  formData: RecipeFormData | UserRecipeData,
  files: File[],
  isUserRecipe: boolean = false
): Promise<{ data: GuestRecipe | null; error: string | null }> {
  const supabase = createSupabaseClient();
  
  // Get the current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return { data: null, error: 'User not authenticated' };
  }

  let sessionId: string | null = null;
  let fileMetadata: Array<{originalName: string; tempPath: string; size: number; type: string}> = [];
  let resolvedGuestId: string;

  try {
    // Step 1: If user recipe, get or create self guest
    if (isUserRecipe) {
      const { data: profile, error: profileError } = await getCurrentProfile();
      if (profileError) {
        return { data: null, error: 'Failed to get user profile' };
      }

      const fullName = profile?.full_name || '';
      const nameParts = fullName.split(' ');
      const firstName = nameParts[0] || 'My';
      const lastName = nameParts.slice(1).join(' ') || 'Recipes';

      let { data: selfGuest, error: selfGuestError } = await supabase
        .from('guests')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_self', true)
        .single();

      if (selfGuestError || !selfGuest) {
        const { data: newSelfGuest, error: createError } = await supabase
          .from('guests')
          .insert({
            user_id: user.id,
            first_name: firstName,
            last_name: lastName,
            email: user.email || '',
            is_self: true,
            status: 'submitted',
            number_of_recipes: 1,
            recipes_received: 0,
            is_archived: false,
            source: 'manual'
          })
          .select('id')
          .single();

        if (createError || !newSelfGuest) {
          return { data: null, error: createError?.message || 'Failed to create recipe collection' };
        }
        selfGuest = newSelfGuest;
      }

      resolvedGuestId = selfGuest.id;
    } else {
      if (!guestId) {
        return { data: null, error: 'Guest ID is required' };
      }
      resolvedGuestId = guestId;
    }

    // Step 2: Upload files to staging
    if (files && files.length > 0) {
      sessionId = generateSessionId();
      const stagingResult = await uploadFilesToStagingWithClient(supabase, sessionId, files);
      
      if (stagingResult.error) {
        return { data: null, error: stagingResult.error };
      }
      
      fileMetadata = stagingResult.fileMetadata;
      console.log(`Successfully staged ${fileMetadata.length} files with session: ${sessionId}`);
    }

    // Step 3: Update guest recipe count if needed
    const { data: guestData, error: guestFetchError } = await supabase
      .from('guests')
      .select('recipes_received, number_of_recipes')
      .eq('id', resolvedGuestId)
      .single();
      
    if (guestFetchError) {
      if (sessionId) await cleanupStagingFiles(sessionId);
      return { data: null, error: 'Failed to fetch guest data' };
    }
    
    const currentRecipes = guestData?.recipes_received || 0;
    const expectedRecipes = guestData?.number_of_recipes || 1;
    const willHaveRecipes = currentRecipes + 1;
    
    if (willHaveRecipes > expectedRecipes) {
      const { error: updateExpectedError } = await supabase
        .from('guests')
        .update({ number_of_recipes: willHaveRecipes })
        .eq('id', resolvedGuestId);
        
      if (updateExpectedError) {
        if (sessionId) await cleanupStagingFiles(sessionId);
        return { data: null, error: 'Failed to update guest recipe limit' };
      }
    }

    // Step 4: Create recipe record
    const recipeName = isUserRecipe ? (formData as UserRecipeData).recipeName : (formData as RecipeFormData).recipe_name;
    const comments = isUserRecipe ? (formData as UserRecipeData).personalNote : (formData as RecipeFormData).comments;
    
    const recipeData: GuestRecipeInsert = {
      guest_id: resolvedGuestId,
      user_id: user.id,
      recipe_name: recipeName,
      ingredients: 'See uploaded images',
      instructions: `${files.length} images uploaded`,
      comments: comments || null,
      upload_method: 'image',
      document_urls: null, // Will be populated after file move
      submission_status: 'submitted',
      submitted_at: new Date().toISOString(),
    };

    const { data: recipe, error: recipeError } = await supabase
      .from('guest_recipes')
      .insert(recipeData)
      .select()
      .single();

    if (recipeError || !recipe) {
      if (sessionId) await cleanupStagingFiles(sessionId);
      return { data: null, error: recipeError?.message || 'Failed to create recipe' };
    }

    console.log('✅ Recipe created successfully:', { recipeId: recipe.id, guestId: resolvedGuestId });

    // Step 5: Move files to final location
    let finalFileUrls: string[] = [];
    if (sessionId && fileMetadata.length > 0) {
      const moveResult = await moveFilesToFinalLocationWithClient(
        supabase,
        user.id,
        resolvedGuestId,
        recipe.id,
        sessionId,
        fileMetadata
      );

      if (moveResult.error) {
        // Cleanup recipe on error
        await supabase.from('guest_recipes').delete().eq('id', recipe.id);
        return { data: null, error: moveResult.error };
      }

      finalFileUrls = moveResult.urls;
      
      // Update recipe with final file URLs
      const { error: updateError } = await supabase
        .from('guest_recipes')
        .update({ document_urls: finalFileUrls })
        .eq('id', recipe.id);

      if (updateError) {
        console.error('Error updating recipe with file URLs:', updateError);
      } else {
        console.log(`✅ Updated recipe with ${finalFileUrls.length} file URLs`);
      }
    }

    return { data: recipe, error: null };
  } catch (err) {
    console.error('Error in addRecipeWithFiles:', err);
    if (sessionId) await cleanupStagingFiles(sessionId);
    return { data: null, error: 'An unexpected error occurred while adding the recipe' };
  }
}

/**
 * Upload recipe image
 */
export async function uploadRecipeImage(recipeId: string, file: File) {
  const supabase = createSupabaseClient();
  
  // Upload the image to Supabase storage
  const fileExt = file.name.split('.').pop();
  const fileName = `${recipeId}.${fileExt}`;
  const filePath = `recipe-images/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('recipes')
    .upload(filePath, file, {
      upsert: true,
    });

  if (uploadError) {
    return { data: null, error: uploadError.message };
  }

  // Get the public URL
  const { data: { publicUrl } } = supabase.storage
    .from('recipes')
    .getPublicUrl(filePath);

  // Update the recipe with the image URL
  const { data, error } = await updateRecipe(recipeId, {
    image_url: publicUrl,
  });

  return { data, error };
}

/**
 * Guest submission functions (for public forms)
 */

/**
 * Submit a recipe as a guest (using guest ID and optional token)
 * This would be used in a public form where guests submit their recipes
 */
export async function submitRecipeAsGuest(
  guestId: string,
  formData: RecipeFormData,
  token?: string
) {
  const supabase = createSupabaseClient();
  
  // In a real implementation, you'd validate the token here
  // For now, we'll just check if the guest exists
  const { data: guest, error: guestError } = await supabase
    .from('guests')
    .select('user_id')
    .eq('id', guestId)
    .single();

  if (guestError || !guest) {
    return { data: null, error: 'Invalid guest ID' };
  }

  const recipeData: GuestRecipeInsert = {
    guest_id: guestId,
    user_id: guest.user_id,
    recipe_name: formData.recipe_name,
    ingredients: formData.ingredients,
    instructions: formData.instructions,
    comments: formData.comments,
    submission_status: 'submitted',
    submitted_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('guest_recipes')
    .insert(recipeData)
    .select()
    .single();

  return { data, error: error?.message || null };
}