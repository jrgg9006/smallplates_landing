import { createSupabaseClient } from '@/lib/supabase/client';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import type {
  RecipeProductionStatus,
  RecipeProductionStatusInsert,
  RecipeProductionStatusUpdate,
} from '@/lib/types/database';

/**
 * Get production status for a specific recipe
 */
export async function getRecipeProductionStatus(recipeId: string) {
  const supabase = createSupabaseClient();
  
  const { data, error } = await supabase
    .from('recipe_production_status')
    .select('*')
    .eq('recipe_id', recipeId)
    .maybeSingle();

  return { data, error: error?.message || null };
}

/**
 * Get all recipes with their production status (admin version)
 * Uses admin client to bypass RLS - admin can see ALL recipes
 * Includes recipe details, guest info, user info, and cookbook info
 */
export async function getAllRecipesWithProductionStatusAdmin(filters?: {
  status?: 'no_action' | 'in_progress' | 'ready_to_print';
  cookbookId?: string | 'not_in_cookbook';
  userId?: string;
  needsReview?: boolean;
}) {
  const supabase = createSupabaseAdminClient();
  
  // Base query - get all recipes with LEFT JOIN to production status
  let query = supabase
    .from('guest_recipes')
    .select(`
      *,
      guests (
        id,
        first_name,
        last_name,
        printed_name,
        email,
        is_self,
        source
      ),
      profiles!guest_recipes_user_id_fkey (
        id,
        email,
        full_name
      ),
      recipe_production_status (*),
      cookbook_recipes (
        id,
        cookbook_id,
        cookbooks (
          id,
          name
        )
      )
    `)
    .order('created_at', { ascending: false });

  // Apply filters
  if (filters?.userId) {
    query = query.eq('user_id', filters.userId);
  }

  const { data: recipes, error } = await query;

  if (error) {
    return { data: null, error: error.message };
  }

  if (!recipes) {
    return { data: [], error: null };
  }

  // Transform and filter results
  const transformedRecipes = recipes.map((recipe: any) => {
    // Handle production status - could be array or single object depending on Supabase version
    const productionStatus = Array.isArray(recipe.recipe_production_status) 
      ? recipe.recipe_production_status[0] || null
      : recipe.recipe_production_status || null;
    
    // Calculate status based on checkboxes
    const textFinalized = productionStatus?.text_finalized_in_indesign || false;
    const imageGenerated = productionStatus?.image_generated || false;
    const imagePlaced = productionStatus?.image_placed_in_indesign || false;
    
    let status: 'no_action' | 'in_progress' | 'ready_to_print';
    if (!textFinalized && !imageGenerated && !imagePlaced) {
      status = 'no_action';
    } else if (textFinalized && imageGenerated && imagePlaced) {
      status = 'ready_to_print';
    } else {
      status = 'in_progress';
    }

    // Get cookbook info - recipes can be in multiple cookbooks, but we'll show the first one
    const cookbookRecipes = recipe.cookbook_recipes || [];
    const cookbookRecipe = Array.isArray(cookbookRecipes) ? cookbookRecipes[0] : null;
    const cookbook = cookbookRecipe?.cookbooks || null;

    return {
      ...recipe,
      production_status: productionStatus,
      calculated_status: status,
      cookbook: cookbook ? {
        id: cookbook.id,
        name: cookbook.name,
      } : null,
    };
  });

  // Apply client-side filters
  let filtered = transformedRecipes;

  if (filters?.status) {
    filtered = filtered.filter((r: any) => r.calculated_status === filters.status);
  }

  if (filters?.cookbookId) {
    if (filters.cookbookId === 'not_in_cookbook') {
      filtered = filtered.filter((r: any) => !r.cookbook);
    } else {
      filtered = filtered.filter((r: any) => r.cookbook?.id === filters.cookbookId);
    }
  }

  if (filters?.needsReview !== undefined) {
    filtered = filtered.filter((r: any) => 
      filters.needsReview 
        ? (r.production_status?.needs_review === true)
        : (r.production_status?.needs_review !== true)
    );
  }

  return { data: filtered, error: null };
}

/**
 * Update production status for a recipe (admin version)
 * Auto-sets production_completed_at when all 3 checkboxes become true
 * Auto-clears needs_review if recipe hasn't been edited since completion
 */
export async function updateRecipeProductionStatusAdmin(
  recipeId: string,
  updates: RecipeProductionStatusUpdate
) {
  const supabase = createSupabaseAdminClient();
  
  // First, check if record exists
  const { data: existing } = await supabase
    .from('recipe_production_status')
    .select('*')
    .eq('recipe_id', recipeId)
    .maybeSingle();

  // Get current recipe updated_at to check if it was edited
  const { data: recipe } = await supabase
    .from('guest_recipes')
    .select('updated_at')
    .eq('id', recipeId)
    .single();

  let finalUpdates: RecipeProductionStatusUpdate = { ...updates };

  // If all 3 checkboxes are being set to true, set production_completed_at
  const textFinalized = updates.text_finalized_in_indesign ?? existing?.text_finalized_in_indesign ?? false;
  const imageGenerated = updates.image_generated ?? existing?.image_generated ?? false;
  const imagePlaced = updates.image_placed_in_indesign ?? existing?.image_placed_in_indesign ?? false;

  if (textFinalized && imageGenerated && imagePlaced) {
    // All checkboxes are true - set completion timestamp if not already set
    if (!existing?.production_completed_at) {
      finalUpdates.production_completed_at = new Date().toISOString();
    }
    
    // Clear needs_review if recipe hasn't been edited since completion
    if (existing?.production_completed_at && recipe?.updated_at) {
      const completionTime = new Date(existing.production_completed_at).getTime();
      const recipeUpdateTime = new Date(recipe.updated_at).getTime();
      
      if (recipeUpdateTime <= completionTime) {
        finalUpdates.needs_review = false;
      }
    }
  }

  if (existing) {
    // Update existing record
    const { data, error } = await supabase
      .from('recipe_production_status')
      .update(finalUpdates)
      .eq('recipe_id', recipeId)
      .select()
      .single();

    return { data, error: error?.message || null };
  } else {
    // Create new record
    const insertData: RecipeProductionStatusInsert = {
      recipe_id: recipeId,
      text_finalized_in_indesign: textFinalized,
      image_generated: imageGenerated,
      image_placed_in_indesign: imagePlaced,
      operations_notes: updates.operations_notes ?? null,
      production_completed_at: finalUpdates.production_completed_at || null,
      needs_review: false,
    };

    const { data, error } = await supabase
      .from('recipe_production_status')
      .insert(insertData)
      .select()
      .single();

    return { data, error: error?.message || null };
  }
}

/**
 * Mark recipe as reviewed (admin version)
 * Clear needs_review flag and update production_completed_at
 */
export async function markRecipeAsReviewedAdmin(recipeId: string) {
  const supabase = createSupabaseAdminClient();
  
  // Get current recipe updated_at
  const { data: recipe } = await supabase
    .from('guest_recipes')
    .select('updated_at')
    .eq('id', recipeId)
    .single();

  if (!recipe) {
    return { data: null, error: 'Recipe not found' };
  }

  // Update production status
  const { data: existing } = await supabase
    .from('recipe_production_status')
    .select('*')
    .eq('recipe_id', recipeId)
    .maybeSingle();

  if (!existing) {
    return { data: null, error: 'Production status not found' };
  }

  const updates: RecipeProductionStatusUpdate = {
    needs_review: false,
    production_completed_at: recipe.updated_at, // Update to current recipe updated_at
  };

  const { data, error } = await supabase
    .from('recipe_production_status')
    .update(updates)
    .eq('recipe_id', recipeId)
    .select()
    .single();

  return { data, error: error?.message || null };
}

/**
 * Get production statistics (admin version)
 * Uses admin client to bypass RLS
 */
export async function getProductionStatsAdmin() {
  const supabase = createSupabaseAdminClient();
  
  // Get all recipes with production status
  const { data: recipes, error } = await supabase
    .from('guest_recipes')
    .select(`
      id,
      recipe_production_status (
        text_finalized_in_indesign,
        image_generated,
        image_placed_in_indesign
      )
    `);

  if (error) {
    return { data: null, error: error.message };
  }

  if (!recipes) {
    return { data: { recipesNeedingAction: 0, recipesReadyToPrint: 0 }, error: null };
  }

  let recipesNeedingAction = 0;
  let recipesReadyToPrint = 0;

  recipes.forEach((recipe: any) => {
    // Handle production status - could be array or single object
    const status = Array.isArray(recipe.recipe_production_status)
      ? recipe.recipe_production_status[0]
      : recipe.recipe_production_status;
    
    if (!status) {
      // No production status = needs action
      recipesNeedingAction++;
      return;
    }

    const textFinalized = status.text_finalized_in_indesign || false;
    const imageGenerated = status.image_generated || false;
    const imagePlaced = status.image_placed_in_indesign || false;

    if (!textFinalized && !imageGenerated && !imagePlaced) {
      recipesNeedingAction++;
    } else if (textFinalized && imageGenerated && imagePlaced) {
      recipesReadyToPrint++;
    } else {
      recipesNeedingAction++; // In progress still needs action
    }
  });

  return {
    data: {
      recipesNeedingAction,
      recipesReadyToPrint,
    },
    error: null,
  };
}

