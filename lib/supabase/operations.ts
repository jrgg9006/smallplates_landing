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
  guestId?: string;
  needsReview?: boolean;
  hideArchived?: boolean;
  notifyOptIn?: boolean;
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
        source,
        notify_opt_in
      ),
      profiles!guest_recipes_user_id_fkey (
        id,
        email,
        full_name
      ),
      recipe_production_status (*),
      group_recipes (
        group_id,
        added_by,
        added_at,
        removed_at,
        groups (
          id,
          name
        )
      ),
      midjourney_prompts (
        generated_prompt,
        agent_metadata
      ),
      recipe_print_ready (
        recipe_name_clean,
        ingredients_clean,
        instructions_clean,
        detected_language,
        cleaning_version
      )
    `)
    .order('created_at', { ascending: false });

  // Apply filters
  if (filters?.userId) {
    query = query.eq('user_id', filters.userId);
  }

  if (filters?.guestId) {
    query = query.eq('guest_id', filters.guestId);
  }

  const { data: recipes, error } = await query;

  if (error) {
    return { data: null, error: error.message };
  }

  if (!recipes) {
    return { data: [], error: null };
  }

  // console.log removed for production
  
  // Transform and filter results
  const transformedRecipes = recipes.map((recipe: any) => {
    // Handle production status - could be array or single object depending on Supabase version
    const productionStatus = Array.isArray(recipe.recipe_production_status) 
      ? recipe.recipe_production_status[0] || null
      : recipe.recipe_production_status || null;
    
    // Calculate status based on image_generated, needs_review, and recipe_print_ready
    // Text Finalized and Image Placed are now automated, so we only track Image Generated
    // Opción C: cleaned text (recipe_print_ready) is required for ready_to_print status
    const imageGenerated = productionStatus?.image_generated || false;
    const needsReview = productionStatus?.needs_review || false;
    
    // Handle recipe_print_ready - could be array or single object depending on Supabase version
    const printReady = Array.isArray(recipe.recipe_print_ready)
      ? recipe.recipe_print_ready[0] || null
      : recipe.recipe_print_ready || null;
    
    // Check if recipe has cleaned text (recipe_print_ready exists and has content)
    const hasCleanedText = printReady && (
      (printReady.ingredients_clean && printReady.ingredients_clean.trim() !== '') ||
      (printReady.instructions_clean && printReady.instructions_clean.trim() !== '')
    );
    
    let status: 'no_action' | 'in_progress' | 'ready_to_print';
    if (!imageGenerated) {
      status = 'no_action';
    } else if (imageGenerated && (!hasCleanedText || needsReview)) {
      // In progress if: image generated but missing cleaned text OR needs review
      status = 'in_progress';
    } else {
      // Ready to print if: image generated AND has cleaned text AND doesn't need review
      status = 'ready_to_print';
    }

    // Get group info - filter out removed entries (removed_at IS NULL means active)
    // A recipe is archived if it has NO active group associations
    const groupRecipes = recipe.group_recipes || [];
    const activeGroupRecipes = Array.isArray(groupRecipes) 
      ? groupRecipes.filter((gr: any) => !gr.removed_at)
      : (!groupRecipes.removed_at ? [groupRecipes] : []);
    
    const hasActiveGroupAssociation = activeGroupRecipes.length > 0;
    const groupRecipe = activeGroupRecipes[0];
    const group = hasActiveGroupAssociation && groupRecipe?.groups ? groupRecipe.groups : null;
    
    // Handle midjourney_prompts - could be array or single object depending on Supabase version
    const midjourneyPrompt = Array.isArray(recipe.midjourney_prompts)
      ? recipe.midjourney_prompts[0] || null
      : recipe.midjourney_prompts || null;
    
    // Debug log for recipes without groups
    if (!group && recipe.id) {
      // console.log removed for production
    }

    return {
      ...recipe,
      production_status: productionStatus,
      calculated_status: status,
      group: group ? {
        id: group.id,
        name: group.name,
      } : null,
      midjourney_prompts: midjourneyPrompt,
      recipe_print_ready: printReady,
    };
  });

  // Apply client-side filters
  let filtered = transformedRecipes;

  if (filters?.status) {
    filtered = filtered.filter((r: any) => r.calculated_status === filters.status);
  }

  if (filters?.cookbookId) {
    if (filters.cookbookId === 'not_in_cookbook') {
      const archivedRecipes = transformedRecipes.filter((r: any) => !r.group);
      // console.log removed for production
      filtered = filtered.filter((r: any) => !r.group);
    } else {
      filtered = filtered.filter((r: any) => r.group?.id === filters.cookbookId);
    }
  }

  if (filters?.needsReview !== undefined) {
    filtered = filtered.filter((r: any) => 
      filters.needsReview 
        ? (r.production_status?.needs_review === true)
        : (r.production_status?.needs_review !== true)
    );
  }

  // Filter based on archived status
  // hideArchived = true means we DON'T want to see archived recipes (only show active ones)
  if (filters?.hideArchived === true) {
    filtered = filtered.filter((r: any) => r.group !== null);
  }

  // Filter by guest notify_opt_in
  if (filters?.notifyOptIn === true) {
    filtered = filtered.filter((r: any) => r.guests?.notify_opt_in === true);
  }

  return { data: filtered, error: null };
}

/**
 * Update production status for a recipe (admin version)
 * Auto-sets production_completed_at when image is generated and doesn't need review
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

  // Set production_completed_at when image is generated and doesn't need review
  const imageGenerated = updates.image_generated ?? existing?.image_generated ?? false;
  const needsReview = updates.needs_review ?? existing?.needs_review ?? false;

  if (imageGenerated && !needsReview) {
    // Image is generated and doesn't need review - set completion timestamp if not already set
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
      text_finalized_in_indesign: false, // No longer used, but keep for backward compatibility
      image_generated: updates.image_generated ?? false,
      image_placed_in_indesign: false, // No longer used, but keep for backward compatibility
      operations_notes: updates.operations_notes ?? null,
      production_completed_at: finalUpdates.production_completed_at || null,
      needs_review: updates.needs_review ?? false,
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
  
  // Get all recipes with production status and recipe_print_ready to check for cleaned text
  const { data: recipes, error } = await supabase
    .from('guest_recipes')
    .select(`
      id,
      recipe_production_status (
        image_generated,
        needs_review
      ),
      recipe_print_ready (
        ingredients_clean,
        instructions_clean
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
    
    // Handle recipe_print_ready - could be array or single object
    const printReady = Array.isArray(recipe.recipe_print_ready)
      ? recipe.recipe_print_ready[0]
      : recipe.recipe_print_ready;
    
    if (!status) {
      // No production status = needs action
      recipesNeedingAction++;
      return;
    }

    const imageGenerated = status.image_generated || false;
    const needsReview = status.needs_review || false;
    
    // Check if recipe has cleaned text
    const hasCleanedText = printReady && (
      (printReady.ingredients_clean && printReady.ingredients_clean.trim() !== '') ||
      (printReady.instructions_clean && printReady.instructions_clean.trim() !== '')
    );

    if (!imageGenerated) {
      recipesNeedingAction++;
    } else if (imageGenerated && hasCleanedText && !needsReview) {
      recipesReadyToPrint++;
    } else {
      // Image generated but missing cleaned text OR needs review = in progress = needs action
      recipesNeedingAction++;
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

