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
      return { data: null, error: createError.message };
    }

    return { data: createdCookbook, error: null };
  } catch (err) {
    console.error('Unexpected error in getOrCreateDefaultCookbook:', err);
    return { data: null, error: 'An unexpected error occurred' };
  }
}

/**
 * Get all cookbooks for the current user
 */
export async function getAllCookbooks() {
  const supabase = createSupabaseClient();
  
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return { data: null, error: 'User not authenticated' };
  }

  const { data, error } = await supabase
    .from('cookbooks')
    .select('*')
    .eq('user_id', user.id)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false });

  return { data, error: error?.message || null };
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

  // If setting as default, unset other default cookbooks first
  if (updates.is_default === true) {
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

  const { data, error } = await supabase
    .from('cookbooks')
    .update(updates)
    .eq('id', cookbookId)
    .eq('user_id', user.id)
    .select()
    .single();

  return { data, error: error?.message || null };
}

/**
 * Delete a cookbook
 */
export async function deleteCookbook(cookbookId: string) {
  const supabase = createSupabaseClient();
  
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return { data: null, error: 'User not authenticated' };
  }

  // Check if it's the default cookbook
  const { data: cookbook } = await supabase
    .from('cookbooks')
    .select('is_default')
    .eq('id', cookbookId)
    .eq('user_id', user.id)
    .single();

  if (cookbook?.is_default) {
    return { data: null, error: 'Cannot delete the default cookbook' };
  }

  const { error } = await supabase
    .from('cookbooks')
    .delete()
    .eq('id', cookbookId)
    .eq('user_id', user.id);

  return { data: null, error: error?.message || null };
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

  try {
    // Verify the recipe belongs to the user
    const { data: recipe, error: recipeError } = await supabase
      .from('guest_recipes')
      .select('id')
      .eq('id', recipeId)
      .eq('user_id', user.id)
      .single();

    if (recipeError || !recipe) {
      return { data: null, error: 'Recipe not found or access denied' };
    }

    // Check if recipe is already in cookbook
    const { data: existing } = await supabase
      .from('cookbook_recipes')
      .select('id')
      .eq('cookbook_id', cookbookId)
      .eq('recipe_id', recipeId)
      .single();

    if (existing) {
      return { data: null, error: 'Recipe is already in this cookbook' };
    }

    // Get the current max display_order to append new recipe at the end
    const { data: maxOrderData } = await supabase
      .from('cookbook_recipes')
      .select('display_order')
      .eq('cookbook_id', cookbookId)
      .eq('user_id', user.id)
      .order('display_order', { ascending: false })
      .limit(1)
      .single();

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

  const { data, error } = await supabase
    .from('cookbook_recipes')
    .select(`
      *,
      guest_recipes (
        *,
        guests (
          first_name,
          last_name,
          printed_name,
          email,
          is_self
        )
      )
    `)
    .eq('cookbook_id', cookbookId)
    .eq('user_id', user.id)
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) {
    return { data: null, error: error.message };
  }

  // Transform the data to match RecipeInCookbook type
  const recipes: RecipeInCookbook[] = (data || []).map((item: any) => ({
    ...item.guest_recipes,
    guests: item.guest_recipes.guests,
    cookbook_recipes: {
      id: item.id,
      note: item.note,
      display_order: item.display_order,
      created_at: item.created_at,
      updated_at: item.updated_at,
    },
  }));

  return { data: recipes, error: null };
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

  const { data, error } = await supabase
    .from('cookbook_recipes')
    .update({ note })
    .eq('cookbook_id', cookbookId)
    .eq('recipe_id', recipeId)
    .eq('user_id', user.id)
    .select()
    .single();

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

  const { data, error } = await supabase
    .from('cookbook_recipes')
    .update({ display_order: displayOrder })
    .eq('cookbook_id', cookbookId)
    .eq('recipe_id', recipeId)
    .eq('user_id', user.id)
    .select()
    .single();

  return { data, error: error?.message || null };
}

