import { createSupabaseClient } from '@/lib/supabase/client';
import { getCurrentProfile } from '@/lib/supabase/profiles';
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
      ingredients: formData.ingredients,
      instructions: formData.instructions,
      comments: formData.comments,
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
        email
      )
    `)
    .order('created_at', { ascending: false });

  return { data, error: error?.message || null };
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
        email
      )
    `)
    .eq('submission_status', status)
    .order('created_at', { ascending: false });

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

    // If no self guest exists, create one with user's name
    if (selfGuestError || !selfGuest) {
      const { data: newSelfGuest, error: createError } = await supabase
        .from('guests')
        .insert({
          user_id: user.id,
          first_name: firstName,
          last_name: lastName,
          email: user.email || '',
          is_self: true,
          status: 'submitted'
        })
        .select('id')
        .single();

      if (createError) {
        console.error('Failed to create self guest:', createError);
        return { data: null, error: 'Failed to create recipe collection' };
      }

      selfGuest = newSelfGuest;
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
        ingredients: recipeData.ingredients,
        instructions: recipeData.instructions,
        comments: recipeData.personalNote || null,
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