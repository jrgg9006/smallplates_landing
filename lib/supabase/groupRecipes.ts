import { createSupabaseClient } from '@/lib/supabase/client';
import type {
  RecipeWithGuest,
  RecipeWithGroup,
  GuestRecipeInsert,
} from '@/lib/types/database';

/**
 * Get all recipes for a specific group
 */
export async function getGroupRecipes(groupId: string): Promise<{ data: RecipeWithGuest[] | null; error: string | null }> {
  const supabase = createSupabaseClient();
  
  // Get the current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return { data: null, error: 'User not authenticated' };
  }

  const { data, error } = await supabase
    .from('guest_recipes')
    .select(`
      *,
      guests(
        first_name,
        last_name,
        printed_name,
        email,
        is_self,
        source
      )
    `)
    .eq('group_id', groupId)
    .order('created_at', { ascending: false });

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as RecipeWithGuest[], error: null };
}

/**
 * Add an existing recipe to a group
 */
export async function addRecipeToGroup(groupId: string, recipeId: string) {
  const supabase = createSupabaseClient();
  
  // Get the current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return { data: null, error: 'User not authenticated' };
  }

  const { data, error } = await supabase
    .from('guest_recipes')
    .update({ group_id: groupId })
    .eq('id', recipeId)
    .select(`
      *,
      guests(
        first_name,
        last_name,
        printed_name,
        email,
        is_self,
        source
      )
    `)
    .single();

  return { data, error: error?.message || null };
}

/**
 * Remove a recipe from a group (only the recipe owner or group admins can do this)
 */
export async function removeRecipeFromGroup(recipeId: string, groupId: string) {
  const supabase = createSupabaseClient();
  
  // Get the current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return { data: null, error: 'User not authenticated' };
  }

  const { data, error } = await supabase
    .from('guest_recipes')
    .update({ group_id: null })
    .eq('id', recipeId)
    .eq('group_id', groupId)
    .select()
    .single();

  return { data, error: error?.message || null };
}

/**
 * Copy a group recipe to user's personal collection (create a duplicate)
 */
export async function copyRecipeToPersonal(recipeId: string) {
  const supabase = createSupabaseClient();
  
  // Get the current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return { data: null, error: 'User not authenticated' };
  }

  // First, get the original recipe
  const { data: originalRecipe, error: fetchError } = await supabase
    .from('guest_recipes')
    .select('*')
    .eq('id', recipeId)
    .single();

  if (fetchError) {
    return { data: null, error: fetchError.message };
  }

  // Get user's self guest record
  const { data: selfGuest, error: selfGuestError } = await supabase
    .from('guests')
    .select('id')
    .eq('user_id', user.id)
    .eq('is_self', true)
    .single();

  if (selfGuestError) {
    return { data: null, error: 'Could not find user\'s self guest record' };
  }

  // Create a copy of the recipe for the current user
  const recipeData: GuestRecipeInsert = {
    guest_id: selfGuest.id,
    user_id: user.id,
    recipe_name: originalRecipe.recipe_name,
    ingredients: originalRecipe.ingredients,
    instructions: originalRecipe.instructions,
    comments: `Copied from group recipe: ${originalRecipe.comments || ''}`,
    raw_recipe_text: originalRecipe.raw_recipe_text,
    image_url: originalRecipe.image_url,
    upload_method: originalRecipe.upload_method,
    document_urls: originalRecipe.document_urls,
    audio_url: originalRecipe.audio_url,
    submission_status: 'approved', // Personal copies are automatically approved
    group_id: null, // Personal copy shouldn't be associated with a group initially
  };

  const { data, error } = await supabase
    .from('guest_recipes')
    .insert(recipeData)
    .select(`
      *,
      guests(
        first_name,
        last_name,
        printed_name,
        email,
        is_self,
        source
      )
    `)
    .single();

  return { data, error: error?.message || null };
}

/**
 * Create a new recipe and add it to a group
 */
export async function createRecipeInGroup(recipeData: Omit<GuestRecipeInsert, 'user_id' | 'group_id'>, groupId: string) {
  const supabase = createSupabaseClient();
  
  // Get the current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return { data: null, error: 'User not authenticated' };
  }

  const fullRecipeData: GuestRecipeInsert = {
    ...recipeData,
    user_id: user.id,
    group_id: groupId,
  };

  const { data, error } = await supabase
    .from('guest_recipes')
    .insert(fullRecipeData)
    .select(`
      *,
      guests(
        first_name,
        last_name,
        printed_name,
        email,
        is_self,
        source
      )
    `)
    .single();

  return { data, error: error?.message || null };
}

/**
 * Get user's personal recipes that can be added to a group
 */
export async function getUserRecipesForGroup(): Promise<{ data: RecipeWithGuest[] | null; error: string | null }> {
  const supabase = createSupabaseClient();
  
  // Get the current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return { data: null, error: 'User not authenticated' };
  }

  const { data, error } = await supabase
    .from('guest_recipes')
    .select(`
      *,
      guests(
        first_name,
        last_name,
        printed_name,
        email,
        is_self,
        source
      )
    `)
    .eq('user_id', user.id)
    .is('group_id', null) // Only recipes not already in a group
    .order('created_at', { ascending: false });

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as RecipeWithGuest[], error: null };
}

/**
 * Add a recipe to group's shared cookbook with retry logic and auto-creation
 */
export async function addRecipeToGroupCookbook(recipeId: string, groupId: string, note?: string) {
  const supabase = createSupabaseClient();
  
  // Get the current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return { data: null, error: 'User not authenticated' };
  }

  // Helper function to find or create group cookbook
  async function findOrCreateGroupCookbook(): Promise<{ data: any; error: string | null }> {
    // First, try to find the group's cookbook
    const { data: cookbook, error: cookbookError } = await supabase
      .from('cookbooks')
      .select('id, name')
      .eq('group_id', groupId)
      .eq('is_group_cookbook', true)
      .maybeSingle();

    if (cookbookError) {
      return { data: null, error: `Database error finding group cookbook: ${cookbookError.message}` };
    }

    if (cookbook) {
      return { data: cookbook, error: null };
    }

    // If no cookbook found, create it
    console.log(`No cookbook found for group ${groupId}, creating one...`);
    
    // Get group info for cookbook creation
    const { data: group, error: groupError } = await supabase
      .from('groups')
      .select('name, created_by')
      .eq('id', groupId)
      .single();

    if (groupError) {
      return { data: null, error: 'Could not find group information' };
    }

    // Create the missing group cookbook
    const { data: newCookbook, error: createError } = await supabase
      .from('cookbooks')
      .insert({
        name: `${group.name} Cookbook`,
        user_id: group.created_by,
        is_group_cookbook: true,
        group_id: groupId
      })
      .select('id, name')
      .single();

    if (createError) {
      return { data: null, error: `Failed to create group cookbook: ${createError.message}` };
    }

    return { data: newCookbook, error: null };
  }

  // Get or create the cookbook
  const { data: cookbook, error: cookbookLookupError } = await findOrCreateGroupCookbook();
  
  if (cookbookLookupError || !cookbook) {
    return { data: null, error: cookbookLookupError || 'Failed to find or create group cookbook' };
  }

  // Check if recipe is already in the cookbook
  const { data: existingEntry } = await supabase
    .from('cookbook_recipes')
    .select('id')
    .eq('cookbook_id', cookbook.id)
    .eq('recipe_id', recipeId)
    .maybeSingle();

  if (existingEntry) {
    return { data: null, error: 'Recipe is already in the group cookbook' };
  }

  // Get next display order
  const { count, error: countError } = await supabase
    .from('cookbook_recipes')
    .select('*', { count: 'exact', head: true })
    .eq('cookbook_id', cookbook.id);

  if (countError) {
    return { data: null, error: countError.message };
  }

  // Add recipe to cookbook
  const { data, error } = await supabase
    .from('cookbook_recipes')
    .insert({
      cookbook_id: cookbook.id,
      recipe_id: recipeId,
      user_id: user.id,
      note,
      display_order: (count || 0) + 1,
    })
    .select()
    .single();

  return { data, error: error?.message || null };
}

/**
 * Remove a recipe from group's shared cookbook
 */
export async function removeRecipeFromGroupCookbook(recipeId: string, groupId: string) {
  const supabase = createSupabaseClient();
  
  // Get the current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return { data: null, error: 'User not authenticated' };
  }

  // First, get the group's cookbook
  const { data: cookbook, error: cookbookError } = await supabase
    .from('cookbooks')
    .select('id')
    .eq('group_id', groupId)
    .eq('is_group_cookbook', true)
    .single();

  if (cookbookError) {
    return { data: null, error: 'Could not find group cookbook' };
  }

  // Remove recipe from cookbook
  const { error } = await supabase
    .from('cookbook_recipes')
    .delete()
    .eq('cookbook_id', cookbook.id)
    .eq('recipe_id', recipeId);

  return { data: null, error: error?.message || null };
}

/**
 * Search recipes within a group
 */
export async function searchGroupRecipes(groupId: string, searchQuery: string): Promise<{ data: RecipeWithGuest[] | null; error: string | null }> {
  const supabase = createSupabaseClient();
  
  // Get the current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return { data: null, error: 'User not authenticated' };
  }

  const { data, error } = await supabase
    .from('guest_recipes')
    .select(`
      *,
      guests(
        first_name,
        last_name,
        printed_name,
        email,
        is_self,
        source
      )
    `)
    .eq('group_id', groupId)
    .or(`recipe_name.ilike.%${searchQuery}%, ingredients.ilike.%${searchQuery}%, instructions.ilike.%${searchQuery}%`)
    .order('created_at', { ascending: false });

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as RecipeWithGuest[], error: null };
}