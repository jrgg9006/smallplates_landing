import { createSupabaseClient } from '@/lib/supabase/client';
import type {
  Cookbook,
  CookbookInsert,
  CookbookUpdate,
  CookbookRecipe,
  CookbookRecipeInsert,
  CookbookRecipeUpdate,
  RecipeInCookbook,
} from '@/lib/types/database';

/**
 * Get or create default cookbook for the current user
 */
export async function getOrCreateDefaultCookbook() {
  const supabase = createSupabaseClient();
  
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return { data: null, error: 'User not authenticated' };
  }

  try {
    // Try to get existing default cookbook
    const { data: existingCookbook, error: fetchError } = await supabase
      .from('cookbooks')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_default', true)
      .single();

    if (existingCookbook && !fetchError) {
      return { data: existingCookbook, error: null };
    }

    // If no default cookbook exists, create one
    const newCookbook: CookbookInsert = {
      user_id: user.id,
      name: 'My Cookbook',
      is_default: true,
    };

    const { data: createdCookbook, error: createError } = await supabase
      .from('cookbooks')
      .insert(newCookbook)
      .select()
      .single();

    if (createError) {
      console.error('Failed to create default cookbook:', createError);
      // Return a more descriptive error message
      const errorMessage = createError.message || 'Failed to create default cookbook';
      return { data: null, error: errorMessage };
    }

    return { data: createdCookbook, error: null };
  } catch (err) {
    console.error('Unexpected error in getOrCreateDefaultCookbook:', err);
    return { data: null, error: 'An unexpected error occurred' };
  }
}

/**
 * Get all cookbooks for the current user (now returns Groups since we renamed Groups to Cookbooks in UI)
 */
export async function getAllCookbooks() {
  const supabase = createSupabaseClient();
  
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return { data: null, error: 'User not authenticated' };
  }

  console.log('🔍 Loading Groups (renamed to Cookbooks) for user:', user.email);

  try {
    // Get all groups where the user is a member (these are displayed as "Cookbooks" in UI)
    const { data: userGroups, error: groupsError } = await supabase
      .from('group_members')
      .select(`
        groups!inner(
          id,
          name,
          description,
          created_at,
          updated_at,
          visibility,
          created_by
        )
      `)
      .eq('profile_id', user.id);

    if (groupsError) {
      console.error('Error fetching user groups:', groupsError);
      return { data: null, error: 'Failed to load cookbooks' };
    }

    console.log('Raw groups data:', userGroups);

    // Flatten and transform groups to look like cookbooks
    const allCookbooks: any[] = [];
    
    (userGroups || []).forEach(item => {
      let group;
      
      // Handle potential array structure
      if (Array.isArray(item)) {
        group = item[0]?.groups;
      } else {
        group = item?.groups;
      }
      
      if (group && group.id && group.name) {
        // Transform group to cookbook-like object for consistency
        allCookbooks.push({
          id: group.id,
          name: group.name,
          description: group.description,
          created_at: group.created_at,
          updated_at: group.updated_at,
          is_default: false, // Groups are never default
          is_group_cookbook: true, // Mark as group cookbook for compatibility
          group_id: group.id, // Store original group ID
          user_id: group.created_by, // Store creator
        });
      }
    });

    console.log('Transformed groups (as cookbooks):', allCookbooks.map(cb => ({ id: cb.id, name: cb.name })));

    // Sort by creation date (newest first)
    allCookbooks.sort((a, b) => {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return { data: allCookbooks, error: null };
  } catch (err) {
    console.error('Error in getAllCookbooks (Groups):', err);
    return { data: null, error: 'Failed to load cookbooks' };
  }
}

/**
 * Get a specific cookbook by ID
 */
export async function getCookbookById(cookbookId: string) {
  const supabase = createSupabaseClient();
  
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return { data: null, error: 'User not authenticated' };
  }

  const { data, error } = await supabase
    .from('cookbooks')
    .select('*')
    .eq('id', cookbookId)
    .eq('user_id', user.id)
    .single();

  return { data, error: error?.message || null };
}

/**
 * Create a new cookbook
 */
export async function createCookbook(name: string, description?: string) {
  const supabase = createSupabaseClient();
  
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return { data: null, error: 'User not authenticated' };
  }

  try {
    const newCookbook: CookbookInsert = {
      user_id: user.id,
      name,
      description: description || null,
      is_default: false,
    };

    const { data, error } = await supabase
      .from('cookbooks')
      .insert(newCookbook)
      .select()
      .single();

    if (error) {
      console.error('Failed to create cookbook:', error);
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (err) {
    console.error('Unexpected error in createCookbook:', err);
    return { data: null, error: 'An unexpected error occurred' };
  }
}

/**
 * Update a cookbook
 */
export async function updateCookbook(cookbookId: string, updates: CookbookUpdate) {
  const supabase = createSupabaseClient();
  
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return { data: null, error: 'User not authenticated' };
  }

  // First check what type of cookbook this is
  const { data: cookbook } = await supabase
    .from('cookbooks')
    .select('is_group_cookbook, user_id')
    .eq('id', cookbookId)
    .single();

  // If setting as default, unset other default cookbooks first (only for personal cookbooks)
  if (updates.is_default === true && !cookbook?.is_group_cookbook) {
    const { error: unsetError } = await supabase
      .from('cookbooks')
      .update({ is_default: false })
      .eq('user_id', user.id)
      .eq('is_default', true);

    if (unsetError) {
      console.error('Failed to unset other default cookbooks:', unsetError);
      return { data: null, error: 'Failed to update cookbook' };
    }
  }

  // For group cookbooks, don't filter by user_id (let RLS handle permissions)
  // For personal cookbooks, only allow the owner to update
  let query = supabase
    .from('cookbooks')
    .update(updates)
    .eq('id', cookbookId);

  if (!cookbook?.is_group_cookbook) {
    query = query.eq('user_id', user.id);
  }

  const { data, error } = await query.select().single();

  return { data, error: error?.message || null };
}

/**
 * Delete a cookbook (only for personal cookbooks)
 */
export async function deleteCookbook(cookbookId: string) {
  const supabase = createSupabaseClient();
  
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return { data: null, error: 'User not authenticated' };
  }

  // Get cookbook info first
  const { data: cookbook, error: cookbookError } = await supabase
    .from('cookbooks')
    .select('is_default, is_group_cookbook, user_id')
    .eq('id', cookbookId)
    .single();

  if (cookbookError || !cookbook) {
    return { data: null, error: 'Cookbook not found' };
  }

  // Cannot delete group cookbooks - they should use exitSharedCookbook instead
  if (cookbook.is_group_cookbook) {
    return { data: null, error: 'Cannot delete shared cookbooks. Use exit functionality instead.' };
  }

  // Can only delete own cookbooks
  if (cookbook.user_id !== user.id) {
    return { data: null, error: 'You can only delete your own cookbooks' };
  }

  // Check if it's the default cookbook - allow deletion but warn user
  if (cookbook.is_default) {
    console.log('Deleting default cookbook - a new one will be created automatically');
  }

  // Delete the cookbook (cascade should handle related records)
  const { error } = await supabase
    .from('cookbooks')
    .delete()
    .eq('id', cookbookId)
    .eq('user_id', user.id);

  if (error) {
    return { data: null, error: error.message };
  }

  // If we deleted the default cookbook, ensure user has a new default
  if (cookbook.is_default) {
    const { error: defaultError } = await getOrCreateDefaultCookbook();
    if (defaultError) {
      console.warn('Failed to create new default cookbook after deletion:', defaultError);
    }
  }

  return { data: { success: true }, error: null };
}

/**
 * Exit a shared cookbook (remove user from group that owns the cookbook)
 */
export async function exitSharedCookbook(cookbookId: string) {
  const supabase = createSupabaseClient();
  
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return { data: null, error: 'User not authenticated' };
  }

  // Get cookbook info to find the associated group
  const { data: cookbook, error: cookbookError } = await supabase
    .from('cookbooks')
    .select('group_id, is_group_cookbook')
    .eq('id', cookbookId)
    .single();

  if (cookbookError || !cookbook) {
    return { data: null, error: 'Cookbook not found' };
  }

  if (!cookbook.is_group_cookbook || !cookbook.group_id) {
    return { data: null, error: 'This is not a shared cookbook' };
  }

  // Remove user from the group (which effectively removes access to the cookbook)
  const { error: removeError } = await supabase
    .from('group_members')
    .delete()
    .eq('group_id', cookbook.group_id)
    .eq('profile_id', user.id);

  if (removeError) {
    return { data: null, error: removeError.message };
  }

  return { data: { success: true }, error: null };
}

/**
 * Add a recipe to a cookbook
 */
export async function addRecipeToCookbook(cookbookId: string, recipeId: string, note?: string) {
  const supabase = createSupabaseClient();
  
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return { data: null, error: 'User not authenticated' };
  }

  console.log('🔍 Adding recipe to group (cookbook):', { cookbookId, recipeId, user: user.email });

  try {
    // Since we changed to show Groups as "Cookbooks", cookbookId is actually a groupId
    // Check if this group exists and user is a member
    const { data: groupMember, error: groupCheckError } = await supabase
      .from('group_members')
      .select(`
        groups!inner(
          id,
          name
        )
      `)
      .eq('group_id', cookbookId)
      .eq('profile_id', user.id)
      .single();

    if (groupCheckError || !groupMember) {
      console.error('Group check failed:', groupCheckError);
      return { data: null, error: 'Cookbook not found or access denied' };
    }

    console.log('Group found:', groupMember.groups);

    // Verify the recipe exists and user has access to it
    let recipeQuery = supabase
      .from('guest_recipes')
      .select('id')
      .eq('id', recipeId);

    // For personal cookbooks, only allow user's own recipes
    // For group cookbooks, allow recipes user has access to (RLS will handle this)
    if (!cookbook.is_group_cookbook) {
      recipeQuery = recipeQuery.eq('user_id', user.id);
    }

    const { data: recipe, error: recipeError } = await recipeQuery.single();

    if (recipeError || !recipe) {
      return { data: null, error: 'Recipe not found or access denied' };
    }

    // Check if recipe is already in cookbook
    const { data: existing } = await supabase
      .from('cookbook_recipes')
      .select('id')
      .eq('cookbook_id', cookbookId)
      .eq('recipe_id', recipeId)
      .maybeSingle();

    if (existing) {
      return { data: null, error: 'Recipe is already in this cookbook' };
    }

    // Get the current max display_order for this cookbook
    const { data: maxOrderData } = await supabase
      .from('cookbook_recipes')
      .select('display_order')
      .eq('cookbook_id', cookbookId)
      .order('display_order', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Handle the case where cookbook is empty (maxOrderData will be null)
    const nextDisplayOrder = maxOrderData?.display_order != null 
      ? (maxOrderData.display_order + 1) 
      : 0;

    const cookbookRecipe: CookbookRecipeInsert = {
      cookbook_id: cookbookId,
      recipe_id: recipeId,
      user_id: user.id,
      note: note || null,
      display_order: nextDisplayOrder,
    };

    const { data, error } = await supabase
      .from('cookbook_recipes')
      .insert(cookbookRecipe)
      .select()
      .single();

    if (error) {
      console.error('Failed to add recipe to cookbook:', error);
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (err) {
    console.error('Unexpected error in addRecipeToCookbook:', err);
    return { data: null, error: 'An unexpected error occurred' };
  }
}

/**
 * Remove a recipe from a cookbook
 */
export async function removeRecipeFromCookbook(cookbookId: string, recipeId: string) {
  const supabase = createSupabaseClient();
  
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return { data: null, error: 'User not authenticated' };
  }

  const { error } = await supabase
    .from('cookbook_recipes')
    .delete()
    .eq('cookbook_id', cookbookId)
    .eq('recipe_id', recipeId)
    .eq('user_id', user.id);

  return { data: null, error: error?.message || null };
}

/**
 * Get all recipes in a cookbook
 */
export async function getCookbookRecipes(cookbookId: string) {
  const supabase = createSupabaseClient();
  
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return { data: null, error: 'User not authenticated' };
  }

  // First check if this is a group cookbook
  const { data: cookbook, error: cookbookError } = await supabase
    .from('cookbooks')
    .select('is_group_cookbook, user_id, group_id')
    .eq('id', cookbookId)
    .single();

  if (cookbookError) {
    return { data: null, error: cookbookError.message };
  }

  console.log('Cookbook info:', cookbook);

  // Get cookbook recipes first
  let cookbookQuery = supabase
    .from('cookbook_recipes')
    .select('*')
    .eq('cookbook_id', cookbookId);

  // For personal cookbooks, only show recipes added by the cookbook owner
  // For group cookbooks, show all recipes added by any group member
  if (!cookbook.is_group_cookbook) {
    cookbookQuery = cookbookQuery.eq('user_id', cookbook.user_id);
  }

  const { data: cookbookRecipes, error: cookbookRecipesError } = await cookbookQuery
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: false });

  if (cookbookRecipesError) {
    console.error('Error fetching cookbook recipes:', cookbookRecipesError);
    return { data: null, error: cookbookRecipesError.message };
  }

  if (!cookbookRecipes || cookbookRecipes.length === 0) {
    return { data: [], error: null };
  }

  // Get the recipe IDs
  const recipeIds = cookbookRecipes.map(cr => cr.recipe_id);

  // Now get the full recipe details separately
  const { data: recipes, error: recipesError } = await supabase
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
    .in('id', recipeIds);

  if (recipesError) {
    console.error('Error fetching recipe details:', recipesError);
    return { data: null, error: recipesError.message };
  }

  // Create a map of recipe_id to cookbook_recipes info for easier lookup
  const cookbookRecipeMap = cookbookRecipes.reduce((acc: any, cr: any) => {
    acc[cr.recipe_id] = cr;
    return acc;
  }, {});

  // Get unique user IDs from cookbook_recipes to fetch user profiles
  const userIds = [...new Set(cookbookRecipes.map((item: any) => item.user_id))];
  
  // Fetch user profiles for the "Added By" information
  let userProfiles: any = {};
  if (userIds.length > 0 && cookbook.is_group_cookbook) {
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
      console.log('Fetched user profiles:', userProfiles);
    }
  }

  // Transform the data to match RecipeInCookbook type
  const transformedRecipes: RecipeInCookbook[] = (recipes || []).map((recipe: any) => {
    const cookbookRecipe = cookbookRecipeMap[recipe.id];
    let addedByUser = null;
    
    // For group cookbooks, show who added the recipe
    if (cookbook.is_group_cookbook && cookbookRecipe?.user_id) {
      if (cookbookRecipe.user_id === user.id) {
        // Current user added this recipe
        addedByUser = {
          id: user.id,
          full_name: 'You',
          email: user.email,
          is_current_user: true
        };
      } else {
        // Someone else added this recipe
        addedByUser = userProfiles[cookbookRecipe.user_id] || null;
      }
    }
    
    console.log('Recipe user_id:', cookbookRecipe?.user_id, 'Current user:', user.id, 'Added by user:', addedByUser);
    
    return {
      ...recipe,
      guests: recipe.guests,
      cookbook_recipes: {
        id: cookbookRecipe?.id,
        user_id: cookbookRecipe?.user_id,
        note: cookbookRecipe?.note,
        display_order: cookbookRecipe?.display_order,
        created_at: cookbookRecipe?.created_at,
        updated_at: cookbookRecipe?.updated_at,
      },
      added_by_user: addedByUser,
    };
  });

  // Sort by display_order to maintain cookbook order
  transformedRecipes.sort((a, b) => {
    const aOrder = a.cookbook_recipes?.display_order || 999;
    const bOrder = b.cookbook_recipes?.display_order || 999;
    if (aOrder !== bOrder) {
      return aOrder - bOrder;
    }
    // If same order, sort by created_at
    const aDate = new Date(a.cookbook_recipes?.created_at || a.created_at).getTime();
    const bDate = new Date(b.cookbook_recipes?.created_at || b.created_at).getTime();
    return bDate - aDate;
  });

  return { data: transformedRecipes, cookbook, error: null };
}

/**
 * Update note for a recipe in a cookbook
 */
export async function updateCookbookRecipeNote(
  cookbookId: string,
  recipeId: string,
  note: string | null
) {
  const supabase = createSupabaseClient();
  
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return { data: null, error: 'User not authenticated' };
  }

  // Check if this is a group cookbook - if so, don't filter by user_id
  const { data: cookbook } = await supabase
    .from('cookbooks')
    .select('is_group_cookbook')
    .eq('id', cookbookId)
    .single();

  let query = supabase
    .from('cookbook_recipes')
    .update({ note })
    .eq('cookbook_id', cookbookId)
    .eq('recipe_id', recipeId);

  // For personal cookbooks, only allow the cookbook owner to edit notes
  // For group cookbooks, any group member can edit notes (RLS handles access control)
  if (!cookbook?.is_group_cookbook) {
    query = query.eq('user_id', user.id);
  }

  const { data, error } = await query.select().single();

  return { data, error: error?.message || null };
}

/**
 * Update display order for a recipe in a cookbook
 */
export async function updateCookbookRecipeOrder(
  cookbookId: string,
  recipeId: string,
  displayOrder: number
) {
  const supabase = createSupabaseClient();
  
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return { data: null, error: 'User not authenticated' };
  }

  // Check if this is a group cookbook - if so, don't filter by user_id
  const { data: cookbook } = await supabase
    .from('cookbooks')
    .select('is_group_cookbook')
    .eq('id', cookbookId)
    .single();

  let query = supabase
    .from('cookbook_recipes')
    .update({ display_order: displayOrder })
    .eq('cookbook_id', cookbookId)
    .eq('recipe_id', recipeId);

  // For personal cookbooks, only allow the cookbook owner to reorder
  // For group cookbooks, any group member can reorder (RLS handles access control)
  if (!cookbook?.is_group_cookbook) {
    query = query.eq('user_id', user.id);
  }

  const { data, error } = await query.select().single();

  return { data, error: error?.message || null };
}

