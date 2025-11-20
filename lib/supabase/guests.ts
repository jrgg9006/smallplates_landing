import { createSupabaseClient } from '@/lib/supabase/client';
import type {
  Guest,
  GuestInsert,
  GuestUpdate,
  GuestWithRecipes,
  GuestFormData,
  GuestStatistics,
  GuestSearchFilters,
  GuestWithMeta,
  GuestSource,
} from '@/lib/types/database';
const isMissingGuestRecipeSourceError = (error: { message?: string } | null) =>
  !!error?.message &&
  error.message.includes('guest_recipes') &&
  error.message.includes('source');


type GuestWithRecipeRelation = Guest & {
  guest_recipes?: {
    created_at: string;
    source?: GuestSource | null;
  }[];
};

function mapGuestsWithLatestRecipe(
  guests: GuestWithRecipeRelation[] | null | undefined,
  options: { sortByLatest?: boolean } = {}
): GuestWithMeta[] {
  const processed =
    guests?.map((guest) => {
      const { guest_recipes, ...guestData } = guest;
      let latestRecipeDate: number | null = null;
      let latestRecipeSource: GuestSource | null = null;

      if (guest_recipes?.length) {
        for (const recipe of guest_recipes) {
          const recipeTime = new Date(recipe.created_at).getTime();
          if (latestRecipeDate === null || recipeTime > latestRecipeDate) {
            latestRecipeDate = recipeTime;
            latestRecipeSource = recipe.source ?? null;
          }
        }
      }

      return {
        ...guestData,
        latest_recipe_date: latestRecipeDate,
        latest_recipe_source: latestRecipeSource,
      };
    }) || [];

  if (options.sortByLatest) {
    processed.sort((a, b) => {
      const aHasRecipes = a.latest_recipe_date !== null;
      const bHasRecipes = b.latest_recipe_date !== null;

      if (aHasRecipes === bHasRecipes) {
        if (aHasRecipes) {
          return (b.latest_recipe_date || 0) - (a.latest_recipe_date || 0);
        }
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }

      return aHasRecipes ? -1 : 1;
    });
  }

  return processed.map(({ latest_recipe_date, ...guestData }) => guestData) as GuestWithMeta[];
}

/**
 * Add a new guest to the database
 */
export async function addGuest(formData: GuestFormData) {
  const supabase = createSupabaseClient();
  
  // Get the current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return { data: null, error: 'User not authenticated' };
  }

  const guestData: GuestInsert = {
    user_id: user.id,
    first_name: formData.first_name,
    last_name: formData.last_name || '', // Provide empty string if no last name
    printed_name: formData.printed_name,
    email: formData.email || 'NO_EMAIL_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9), // Generate unique placeholder for no email
    phone: formData.phone,
    significant_other_name: formData.significant_other_name,
    number_of_recipes: formData.number_of_recipes || 1,
    notes: formData.notes,
    tags: formData.tags,
  };

  const { data, error } = await supabase
    .from('guests')
    .insert(guestData)
    .select()
    .single();

  return { data, error: error?.message || null };
}

/**
 * Get all guests for the current user, ordered by recipe submission date
 * Guests with recipes appear first (by most recent recipe date), then guests without recipes (by creation date)
 */
export async function getGuests(includeArchived = false): Promise<{ data: GuestWithMeta[] | null; error: string | null }> {
  const supabase = createSupabaseClient();
  
  // Get the current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return { data: null, error: 'User not authenticated' };
  }
  
  // Get guests with their recipes using a left join, filtered by user_id
  const buildQuery = (selectClause: string) => {
    let query = supabase
      .from('guests')
      .select(selectClause)
      .eq('user_id', user.id);

    if (!includeArchived) {
      query = query.eq('is_archived', false);
    }

    return query;
  };

  const selectWithSource = `
    *,
    guest_recipes (
      created_at,
      source
    )
  `;

  const selectWithoutSource = `
    *,
    guest_recipes (
      created_at
    )
  `;

  let { data, error } = await buildQuery(selectWithSource);

  if (error && isMissingGuestRecipeSourceError(error)) {
    ({ data, error } = await buildQuery(selectWithoutSource));
  }

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: mapGuestsWithLatestRecipe(data, { sortByLatest: true }), error: null };
}

/**
 * Get a single guest by ID
 */
export async function getGuestById(guestId: string) {
  const supabase = createSupabaseClient();
  
  const { data, error } = await supabase
    .from('guests')
    .select('*')
    .eq('id', guestId)
    .single();

  return { data, error: error?.message || null };
}

/**
 * Get guest with their recipes
 */
export async function getGuestWithRecipes(guestId: string): Promise<{ data: GuestWithRecipes | null; error: string | null }> {
  const supabase = createSupabaseClient();
  
  const { data, error } = await supabase
    .from('guests')
    .select(`
      *,
      guest_recipes (*)
    `)
    .eq('id', guestId)
    .single();

  return { data, error: error?.message || null };
}

/**
 * Update a guest
 */
export async function updateGuest(guestId: string, updates: GuestUpdate) {
  const supabase = createSupabaseClient();
  
  const { data, error } = await supabase
    .from('guests')
    .update(updates)
    .eq('id', guestId)
    .select()
    .single();

  return { data, error: error?.message || null };
}

/**
 * Archive a guest (soft delete)
 */
export async function archiveGuest(guestId: string) {
  return updateGuest(guestId, { is_archived: true });
}

/**
 * Restore an archived guest
 */
export async function restoreGuest(guestId: string) {
  return updateGuest(guestId, { is_archived: false });
}

/**
 * Delete a guest permanently (use with caution)
 */
export async function deleteGuest(guestId: string) {
  const supabase = createSupabaseClient();
  
  const { error } = await supabase
    .from('guests')
    .delete()
    .eq('id', guestId);

  return { data: null, error: error?.message || null };
}

/**
 * Search guests using the database function with custom ordering
 * Applies the same ordering as getGuests: recipes first (by latest recipe date), then by creation date
 */
export async function searchGuests(filters: GuestSearchFilters): Promise<{ data: GuestWithMeta[] | null; error: string | null }> {
  const supabase = createSupabaseClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { data: null, error: 'User not authenticated' };
  }

  // First get the search results
  const { data, error } = await supabase.rpc('search_guests', {
    user_uuid: user.id,
    search_query: filters.search_query || null,
    status_filter: filters.status || null,
    include_archived: filters.include_archived || false,
  });

  if (error || !data) {
    return { data: data as GuestWithMeta[] | null, error: error?.message || null };
  }

  // Now get the recipe data for each guest to apply proper sorting
  const guestIds = data.map((guest: any) => guest.id);
  
  if (guestIds.length === 0) {
    return { data: data as GuestWithMeta[] | null, error: null };
  }

  // Get recipe data for all guests in the search results
  let { data: recipesData, error: recipesError } = await supabase
    .from('guest_recipes')
    .select('guest_id, created_at, source')
    .in('guest_id', guestIds);

  if (recipesError && isMissingGuestRecipeSourceError(recipesError)) {
    ({ data: recipesData, error: recipesError } = await supabase
      .from('guest_recipes')
      .select('guest_id, created_at')
      .in('guest_id', guestIds));
  }

  if (recipesError) {
    // If recipes query fails, return original data without custom sorting
    return { data: data as GuestWithMeta[] | null, error: null };
  }

  // Create a map of guest_id to latest recipe date
  const recipeMap = new Map<string, { latestDate: number; source: GuestSource | null }>();
  if (recipesData) {
    for (const recipe of recipesData) {
      const recipeTime = new Date(recipe.created_at).getTime();
      const currentLatest = recipeMap.get(recipe.guest_id);
      if (!currentLatest || recipeTime > currentLatest.latestDate) {
        recipeMap.set(recipe.guest_id, {
          latestDate: recipeTime,
          source: recipe.source ?? null,
        });
      }
    }
  }

  // Sort the search results with the same logic as getGuests
  const sortedData = data.sort((a: any, b: any) => {
    const aLatestRecipe = recipeMap.get(a.id)?.latestDate || null;
    const bLatestRecipe = recipeMap.get(b.id)?.latestDate || null;
    const aHasRecipes = aLatestRecipe !== null;
    const bHasRecipes = bLatestRecipe !== null;
    
    // If both have recipes or both don't have recipes
    if (aHasRecipes === bHasRecipes) {
      if (aHasRecipes) {
        // Both have recipes - sort by latest recipe date (newest first)
        return (bLatestRecipe || 0) - (aLatestRecipe || 0);
      } else {
        // Both don't have recipes - sort by creation date (newest first)
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    }
    
    // One has recipes, one doesn't - recipes first
    return aHasRecipes ? -1 : 1;
  });

  const enrichedData = sortedData.map((guest: any) => ({
    ...guest,
    latest_recipe_source: recipeMap.get(guest.id)?.source || null,
  }));

  return { data: enrichedData as GuestWithMeta[], error: null };
}

/**
 * Get guest statistics using the database function
 */
export async function getGuestStatistics(): Promise<{ data: GuestStatistics | null; error: string | null }> {
  const supabase = createSupabaseClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { data: null, error: 'User not authenticated' };
  }

  const { data, error } = await supabase.rpc('get_guest_statistics', {
    user_uuid: user.id,
  });

  return { data, error: error?.message || null };
}

/**
 * Batch update guest status (e.g., mark multiple as invited)
 */
export async function batchUpdateGuestStatus(guestIds: string[], status: Guest['status']) {
  const supabase = createSupabaseClient();
  
  const { data, error } = await supabase
    .from('guests')
    .update({ status, date_message_sent: status === 'reached_out' ? new Date().toISOString() : undefined })
    .in('id', guestIds)
    .select();

  return { data, error: error?.message || null };
}

/**
 * Get guests by status
 */
export async function getGuestsByStatus(status: Guest['status'], includeArchived = false): Promise<{ data: GuestWithMeta[] | null; error: string | null }> {
  const supabase = createSupabaseClient();
  
  // Get the current user - CRITICAL SECURITY FIX
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return { data: null, error: 'User not authenticated' };
  }
  
  const buildQuery = (selectClause: string) => {
    let query = supabase
      .from('guests')
      .select(selectClause)
      .eq('user_id', user.id)
      .eq('status', status)
      .order('last_name', { ascending: true });

    if (!includeArchived) {
      query = query.eq('is_archived', false);
    }

    return query;
  };

  const selectWithSource = `
    *,
    guest_recipes (
      created_at,
      source
    )
  `;

  const selectWithoutSource = `
    *,
    guest_recipes (
      created_at
    )
  `;

  let { data, error } = await buildQuery(selectWithSource);

  if (error && isMissingGuestRecipeSourceError(error)) {
    ({ data, error } = await buildQuery(selectWithoutSource));
  }

  if (error) {
    return { data: null, error: error?.message || null };
  }

  return { data: mapGuestsWithLatestRecipe(data), error: null };
}

/**
 * Check if a guest email already exists for the current user
 */
export async function checkGuestExists(email: string): Promise<boolean> {
  // Create a fresh client to avoid any caching issues
  const supabase = createSupabaseClient();
  
  // Add a small delay to ensure auth state is stable
  await new Promise(resolve => setTimeout(resolve, 50));
  
  // Get the current user with a fresh session
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    console.error('checkGuestExists: No user authenticated', userError);
    return false; // If no user is authenticated, return false
  }
  
  console.log('checkGuestExists: Checking email', email, 'for user', user.id);
  console.log('checkGuestExists: User email:', user.email);
  console.log('checkGuestExists: Timestamp:', new Date().toISOString());
  
  try {
    // Simple, direct query for the current user only
    const { data, error } = await supabase
      .from('guests')
      .select('id, user_id, email, first_name, last_name')
      .eq('user_id', user.id) // Filter by current user
      .eq('email', email)
      .eq('is_archived', false);
    
    if (error) {
      console.error('checkGuestExists: Error querying guests for current user', error);
      return false;
    }
    
    console.log('checkGuestExists: Query results:', data);
    console.log('checkGuestExists: Number of matching guests:', data?.length || 0);
    
    if (data && data.length > 0) {
      // Log details about matching guests
      data.forEach((guest, index) => {
        console.log(`checkGuestExists: Match ${index + 1}:`, {
          id: guest.id,
          user_id: guest.user_id,
          email: guest.email,
          name: `${guest.first_name} ${guest.last_name}`,
          matches_current_user: guest.user_id === user.id
        });
      });
      return true;
    }
    
    console.log('checkGuestExists: No matching guests found for current user');
    return false;
    
  } catch (error) {
    console.error('checkGuestExists: Unexpected error:', error);
    return false;
  }
}