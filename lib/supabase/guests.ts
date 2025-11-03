import { createSupabaseClient } from '@/lib/supabase/client';
import type {
  Guest,
  GuestInsert,
  GuestUpdate,
  GuestWithRecipes,
  GuestFormData,
  GuestStatistics,
  GuestSearchFilters,
} from '@/lib/types/database';

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
export async function getGuests(includeArchived = false): Promise<{ data: Guest[] | null; error: string | null }> {
  const supabase = createSupabaseClient();
  
  // Get the current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return { data: null, error: 'User not authenticated' };
  }
  
  // Get guests with their recipes using a left join, filtered by user_id
  let query = supabase
    .from('guests')
    .select(`
      *,
      guest_recipes (
        created_at
      )
    `)
    .eq('user_id', user.id);

  if (!includeArchived) {
    query = query.eq('is_archived', false);
  }

  const { data, error } = await query;

  if (error) {
    return { data: null, error: error.message };
  }

  // Process the data to apply custom sorting
  const processedData = data?.map(guest => {
    // Remove the nested guest_recipes from the main object
    const { guest_recipes, ...guestData } = guest;
    return {
      ...guestData,
      latest_recipe_date: guest_recipes && guest_recipes.length > 0 
        ? Math.max(...guest_recipes.map((r: any) => new Date(r.created_at).getTime()))
        : null
    };
  }) || [];

  // Sort with custom logic: recipes first (by latest recipe date), then by creation date
  const sortedData = processedData.sort((a, b) => {
    const aHasRecipes = a.latest_recipe_date !== null;
    const bHasRecipes = b.latest_recipe_date !== null;
    
    // If both have recipes or both don't have recipes
    if (aHasRecipes === bHasRecipes) {
      if (aHasRecipes) {
        // Both have recipes - sort by latest recipe date (newest first)
        return (b.latest_recipe_date || 0) - (a.latest_recipe_date || 0);
      } else {
        // Both don't have recipes - sort by creation date (newest first)
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    }
    
    // One has recipes, one doesn't - recipes first
    return aHasRecipes ? -1 : 1;
  });

  // Remove the temporary latest_recipe_date field
  const finalData = sortedData.map(guest => {
    const { latest_recipe_date, ...finalGuest } = guest;
    return finalGuest;
  });

  return { data: finalData, error: null };
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
export async function searchGuests(filters: GuestSearchFilters) {
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
    return { data, error: error?.message || null };
  }

  // Now get the recipe data for each guest to apply proper sorting
  const guestIds = data.map((guest: any) => guest.id);
  
  if (guestIds.length === 0) {
    return { data, error: null };
  }

  // Get recipe data for all guests in the search results
  const { data: recipesData, error: recipesError } = await supabase
    .from('guest_recipes')
    .select('guest_id, created_at')
    .in('guest_id', guestIds);

  if (recipesError) {
    // If recipes query fails, return original data without custom sorting
    return { data, error: null };
  }

  // Create a map of guest_id to latest recipe date
  const recipeMap = new Map<string, number>();
  if (recipesData) {
    for (const recipe of recipesData) {
      const recipeTime = new Date(recipe.created_at).getTime();
      const currentLatest = recipeMap.get(recipe.guest_id) || 0;
      if (recipeTime > currentLatest) {
        recipeMap.set(recipe.guest_id, recipeTime);
      }
    }
  }

  // Sort the search results with the same logic as getGuests
  const sortedData = data.sort((a: any, b: any) => {
    const aLatestRecipe = recipeMap.get(a.id) || null;
    const bLatestRecipe = recipeMap.get(b.id) || null;
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

  return { data: sortedData, error: null };
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
export async function getGuestsByStatus(status: Guest['status'], includeArchived = false) {
  const supabase = createSupabaseClient();
  
  let query = supabase
    .from('guests')
    .select('*')
    .eq('status', status)
    .order('last_name', { ascending: true });

  if (!includeArchived) {
    query = query.eq('is_archived', false);
  }

  const { data, error } = await query;

  return { data, error: error?.message || null };
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