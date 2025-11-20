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

  // Get recipes through the join table with added_by information
  const { data: groupRecipes, error: groupRecipesError } = await supabase
    .from('group_recipes')
    .select('recipe_id, added_by, added_at')
    .eq('group_id', groupId);

  if (groupRecipesError) {
    return { data: null, error: groupRecipesError.message };
  }

  if (!groupRecipes || groupRecipes.length === 0) {
    return { data: [], error: null };
  }

  const recipeIds = groupRecipes.map(gr => gr.recipe_id);

  // Get full recipe details
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
    .in('id', recipeIds)
    .order('created_at', { ascending: false });

  if (error) {
    return { data: null, error: error.message };
  }

  // Get unique user IDs from group_recipes to fetch user profiles for "Added by"
  const userIds = [...new Set(groupRecipes.map(gr => gr.added_by))];
  
  // Fetch user profiles for the "Added By" information
  let userProfiles: any = {};
  if (userIds.length > 0) {
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .in('id', userIds);
    
    if (profilesError) {
      console.error('Error fetching profiles for Added By:', profilesError);
    }
    
    if (!profilesError && profiles) {
      userProfiles = profiles.reduce((acc: any, profile: any) => {
        acc[profile.id] = profile;
        return acc;
      }, {});
    }
  }

  // Create a map of recipe_id to group_recipes info
  const groupRecipeMap = groupRecipes.reduce((acc: any, gr: any) => {
    acc[gr.recipe_id] = gr;
    return acc;
  }, {});

  // Transform the data to include added_by information
  const recipes = (data || []).map((recipe: any) => {
    const groupRecipeInfo = groupRecipeMap[recipe.id];
    let addedByUser = null;
    
    if (groupRecipeInfo?.added_by) {
      if (groupRecipeInfo.added_by === user.id) {
        // Current user added this recipe
        addedByUser = {
          id: user.id,
          full_name: 'You',
          email: user.email,
          is_current_user: true
        };
      } else {
        // Someone else added this recipe
        addedByUser = userProfiles[groupRecipeInfo.added_by] || null;
      }
    }
    
    return {
      ...recipe,
      added_by_user: addedByUser,
      added_at: groupRecipeInfo?.added_at || recipe.created_at
    };
  });

  return { data: recipes as RecipeWithGuest[], error: null };
}

/**
 * Add an existing recipe to a group (now supports multiple groups)
 */
export async function addRecipeToGroup(groupId: string, recipeId: string, note?: string) {
  const supabase = createSupabaseClient();
  
  // Get the current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return { data: null, error: 'User not authenticated' };
  }

  // Check if recipe is already in this group
  const { data: existing } = await supabase
    .from('group_recipes')
    .select('*')
    .eq('group_id', groupId)
    .eq('recipe_id', recipeId)
    .single();

  if (existing) {
    return { data: null, error: 'Recipe is already in this group' };
  }

  // Add recipe to group using the join table
  const { data: groupRecipe, error: insertError } = await supabase
    .from('group_recipes')
    .insert({
      group_id: groupId,
      recipe_id: recipeId,
      added_by: user.id,
      note
    })
    .select()
    .single();

  if (insertError) {
    return { data: null, error: insertError.message };
  }

  // Return the recipe with its details
  const { data: recipe, error: recipeError } = await supabase
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
    .eq('id', recipeId)
    .single();

  return { data: recipe, error: recipeError?.message || null };
}

/**
 * Remove a recipe from a group (recipe can remain in other groups)
 */
export async function removeRecipeFromGroup(recipeId: string, groupId: string) {
  const supabase = createSupabaseClient();
  
  // Get the current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return { data: null, error: 'User not authenticated' };
  }

  // Remove from the join table
  const { error } = await supabase
    .from('group_recipes')
    .delete()
    .eq('recipe_id', recipeId)
    .eq('group_id', groupId);

  return { data: null, error: error?.message || null };
}

/**
 * Copy a group recipe to user's personal collection (create a duplicate)
 * Preserves original chef attribution and tracks discovery source
 */
export async function copyRecipeToPersonal(recipeId: string, sourceUserId?: string) {
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

  // Check if recipe is already in user's personal collection
  const { data: existingRecipe } = await supabase
    .from('guest_recipes')
    .select('id')
    .eq('user_id', user.id)
    .eq('recipe_name', originalRecipe.recipe_name)
    .eq('guest_id', selfGuest.id)
    .maybeSingle();

  if (existingRecipe) {
    return { data: null, error: 'This recipe is already in your collection' };
  }

  // Get original chef information
  const { data: originalGuest } = await supabase
    .from('guests')
    .select('first_name, last_name, printed_name')
    .eq('id', originalRecipe.guest_id)
    .single();

  // Get source user information if provided
  let sourceUserName = 'someone';
  if (sourceUserId) {
    const { data: sourceUser } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', sourceUserId)
      .single();
    
    if (sourceUser) {
      sourceUserName = sourceUser.full_name || sourceUser.email || 'someone';
    }
  }

  // Create enhanced discovery tag with both source and original chef information
  const originalComments = originalRecipe.comments || '';
  let originalChefName = 'Unknown Chef';
  if (originalGuest) {
    originalChefName = originalGuest.printed_name || 
      `${originalGuest.first_name} ${originalGuest.last_name || ''}`.trim();
  }
  
  const discoveryTag = sourceUserId 
    ? `[DISCOVERED_FROM_GROUP:${sourceUserName}] [ORIGINAL_CHEF:${originalChefName}]`
    : `[DISCOVERED_FROM_GROUP] [ORIGINAL_CHEF:${originalChefName}]`;
  
  const newComments = originalComments.includes('[DISCOVERED_FROM_GROUP') 
    ? originalComments 
    : `${discoveryTag} ${originalComments}`.trim();

  // Create a copy using user's self guest record (for RLS compliance) but with original chef info in comments
  const recipeData: GuestRecipeInsert = {
    guest_id: selfGuest.id, // Use current user's guest record for RLS compliance
    user_id: user.id, // Current user owns this copy
    recipe_name: originalRecipe.recipe_name,
    ingredients: originalRecipe.ingredients,
    instructions: originalRecipe.instructions,
    comments: newComments,
    raw_recipe_text: originalRecipe.raw_recipe_text,
    image_url: originalRecipe.image_url,
    upload_method: originalRecipe.upload_method,
    document_urls: originalRecipe.document_urls,
    audio_url: originalRecipe.audio_url,
    submission_status: 'approved', // Personal copies are automatically approved
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
export async function createRecipeInGroup(recipeData: Omit<GuestRecipeInsert, 'user_id'>, groupId: string) {
  const supabase = createSupabaseClient();
  
  // Get the current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return { data: null, error: 'User not authenticated' };
  }

  const fullRecipeData: GuestRecipeInsert = {
    ...recipeData,
    user_id: user.id,
  };

  const { data: recipe, error: recipeError } = await supabase
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

  if (recipeError) {
    return { data: null, error: recipeError.message };
  }

  // Add the recipe to the group
  const { error: groupError } = await supabase
    .from('group_recipes')
    .insert({
      group_id: groupId,
      recipe_id: recipe.id,
      added_by: user.id,
    });

  if (groupError) {
    return { data: null, error: groupError.message };
  }

  return { data: recipe, error: null };
}

/**
 * Get user's personal recipes that can be added to a group
 * Now returns all user's recipes since they can be in multiple groups
 */
export async function getUserRecipesForGroup(excludeGroupId?: string): Promise<{ data: RecipeWithGuest[] | null; error: string | null }> {
  const supabase = createSupabaseClient();
  
  // Get the current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return { data: null, error: 'User not authenticated' };
  }

  let query = supabase
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
    .order('created_at', { ascending: false });

  // If excludeGroupId is provided, filter out recipes already in that group
  if (excludeGroupId) {
    const { data: groupRecipes } = await supabase
      .from('group_recipes')
      .select('recipe_id')
      .eq('group_id', excludeGroupId);

    if (groupRecipes && groupRecipes.length > 0) {
      const excludeIds = groupRecipes.map(gr => gr.recipe_id);
      query = query.not('id', 'in', `(${excludeIds.join(',')})`)  ;
    }
  }

  const { data, error } = await query;

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as RecipeWithGuest[], error: null };
}

/**
 * Get all groups that a recipe belongs to
 */
export async function getRecipeGroups(recipeId: string): Promise<{ data: Array<{ group_id: string; group_name: string; added_at: string; added_by_name: string }> | null; error: string | null }> {
  const supabase = createSupabaseClient();
  
  // Get the current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return { data: null, error: 'User not authenticated' };
  }

  const { data, error } = await supabase
    .rpc('get_recipe_groups', { p_recipe_id: recipeId });

  if (error) {
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

/**
 * Check if a recipe is in a specific group
 */
export async function isRecipeInGroup(recipeId: string, groupId: string): Promise<{ data: boolean; error: string | null }> {
  const supabase = createSupabaseClient();

  const { data, error } = await supabase
    .rpc('is_recipe_in_group', { 
      p_recipe_id: recipeId, 
      p_group_id: groupId 
    });

  if (error) {
    return { data: false, error: error.message };
  }

  return { data: data || false, error: null };
}

/**
 * Get recipes that are available to add to a specific group
 * (excludes recipes already in that group)
 */
export async function getAvailableRecipesForGroup(groupId: string): Promise<{ data: RecipeWithGuest[] | null; error: string | null }> {
  const supabase = createSupabaseClient();
  
  // Get the current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return { data: null, error: 'User not authenticated' };
  }

  // Get recipes already in this group
  const { data: groupRecipes } = await supabase
    .from('group_recipes')
    .select('recipe_id')
    .eq('group_id', groupId);

  const excludeIds = groupRecipes?.map(gr => gr.recipe_id) || [];

  let query = supabase
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
    .order('created_at', { ascending: false });

  // Exclude recipes already in this group
  if (excludeIds.length > 0) {
    query = query.not('id', 'in', `(${excludeIds.join(',')})`);
  }

  const { data, error } = await query;

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

  if (error) {
    console.error('Error adding recipe to group cookbook:', error);
    // Check if it was actually inserted despite the error
    const { data: existingEntry } = await supabase
      .from('cookbook_recipes')
      .select('id')
      .eq('cookbook_id', cookbook.id)
      .eq('recipe_id', recipeId)
      .maybeSingle();
    
    if (existingEntry) {
      // Recipe was actually inserted, so treat as success
      console.log('Recipe was successfully inserted despite error message');
      return { data: existingEntry, error: null };
    }
    
    return { data: null, error: error.message };
  }

  return { data, error: null };
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

  // Get recipes in this group through the join table
  const { data: groupRecipes, error: groupRecipesError } = await supabase
    .from('group_recipes')
    .select('recipe_id')
    .eq('group_id', groupId);

  if (groupRecipesError) {
    return { data: null, error: groupRecipesError.message };
  }

  if (!groupRecipes || groupRecipes.length === 0) {
    return { data: [], error: null };
  }

  const recipeIds = groupRecipes.map(gr => gr.recipe_id);

  // Search within those recipes
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
    .in('id', recipeIds)
    .or(`recipe_name.ilike.%${searchQuery}%, ingredients.ilike.%${searchQuery}%, instructions.ilike.%${searchQuery}%`)
    .order('created_at', { ascending: false });

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as RecipeWithGuest[], error: null };
}