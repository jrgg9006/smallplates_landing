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
    group_id: formData.group_id,
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
export async function getGuests(groupId?: string, includeArchived = false): Promise<{ data: Guest[] | null; error: string | null }> {
  const supabase = createSupabaseClient();
  
  // Get the current user (still needed for authentication check)
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return { data: null, error: 'User not authenticated' };
  }
  
  // Get guests with their recipes using a left join
  let query = supabase
    .from('guests')
    .select(`
      *,
      guest_recipes (
        created_at
      )
    `);

  // IMPORTANT: When searching by groupId, don't filter by user_id
  // because guests can be created by different users through collection links
  // When NOT searching by groupId, filter by user_id to get all user's guests
  if (groupId) {
    // Search by group_id only (includes guests created by any user via collection links)
    query = query.eq('group_id', groupId);
  } else {
    // No groupId provided, so get all guests for the current user
    query = query.eq('user_id', user.id);
  }

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

  // Filter by group_id if provided
  let filteredData = data;
  if (filters.group_id) {
    filteredData = data.filter((guest: any) => guest.group_id === filters.group_id);
  }

  // Now get the recipe data for each guest to apply proper sorting
  const guestIds = filteredData.map((guest: any) => guest.id);
  
  if (guestIds.length === 0) {
    return { data: filteredData, error: null };
  }

  // Get recipe data for all guests in the search results
  const { data: recipesData, error: recipesError } = await supabase
    .from('guest_recipes')
    .select('guest_id, created_at')
    .in('guest_id', guestIds);

  if (recipesError) {
    // If recipes query fails, return filtered data without custom sorting
    return { data: filteredData, error: null };
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
  const sortedData = filteredData.sort((a: any, b: any) => {
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
 * Get guest statistics using the database function or calculated from filtered guests
 */
export async function getGuestStatistics(groupId?: string): Promise<{ data: GuestStatistics | null; error: string | null }> {
  const supabase = createSupabaseClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { data: null, error: 'User not authenticated' };
  }

  if (groupId) {
    // Calculate statistics for a specific group by fetching guests
    const { data: guests, error } = await getGuests(groupId, false);
    
    if (error || !guests) {
      return { data: null, error };
    }
    
    // Calculate statistics
    const stats: GuestStatistics = {
      total_guests: guests.length,
      active_guests: guests.filter(g => !g.is_archived).length,
      archived_guests: guests.filter(g => g.is_archived).length,
      pending_invitations: guests.filter(g => g.status === 'pending').length,
      invites_sent: guests.filter(g => g.status === 'reached_out').length,
      recipes_received: guests.reduce((sum, g) => sum + (g.recipes_received || 0), 0),
      total_expected_recipes: guests.reduce((sum, g) => sum + (g.number_of_recipes || 1), 0),
      completion_rate: 0, // Will calculate below
    };
    
    // Calculate completion rate
    if (stats.total_expected_recipes > 0) {
      stats.completion_rate = (stats.recipes_received / stats.total_expected_recipes) * 100;
    }
    
    return { data: stats, error: null };
  } else {
    // Use the database function for all guests
    const { data, error } = await supabase.rpc('get_guest_statistics', {
      user_uuid: user.id,
    });

    return { data, error: error?.message || null };
  }
}

/**
 * Get all guests for a specific group
 */
export async function getGuestsByGroup(groupId: string, includeArchived = false): Promise<{ data: Guest[] | null; error: string | null }> {
  if (!groupId) {
    return { data: null, error: 'Group ID is required' };
  }
  
  return getGuests(groupId, includeArchived);
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
export async function getGuestsByStatus(status: Guest['status'], groupId?: string, includeArchived = false) {
  const supabase = createSupabaseClient();
  
  // Get the current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return { data: null, error: 'User not authenticated' };
  }
  
  let query = supabase
    .from('guests')
    .select('*')
    .eq('user_id', user.id)  // Filter by user_id
    .eq('status', status)
    .order('last_name', { ascending: true });

  // Filter by group_id if provided
  if (groupId) {
    query = query.eq('group_id', groupId);
  }

  if (!includeArchived) {
    query = query.eq('is_archived', false);
  }

  const { data, error } = await query;

  return { data, error: error?.message || null };
}

/**
 * Check if a guest email already exists for the current user
 * If groupId is provided, only checks within that specific group
 * If groupId is not provided, checks across all groups (for backwards compatibility)
 */
export async function checkGuestExists(email: string, groupId?: string | null): Promise<boolean> {
  const supabase = createSupabaseClient();
  
  // Get the current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return false;
  }
  
  let query = supabase
    .from('guests')
    .select('id')
    .eq('user_id', user.id)
    .eq('email', email)
    .eq('is_archived', false);
  
  // If groupId is provided, only check within that group
  if (groupId) {
    query = query.eq('group_id', groupId);
  }
  
  // Use maybeSingle() instead of single() to handle multiple results gracefully
  const { data } = await query.maybeSingle();

  return !!data;
}

// ============================================
// INVITATION EMAIL FUNCTIONS
// ============================================

/**
 * Get all guests that are currently in the invitation sequence
 * Returns guests with status 'invited' and a valid email
 */
export async function getGuestsForInvitationEmails(): Promise<{ 
  data: Array<Guest & { 
    group: {
      id: string;
      couple_first_name: string | null;
      partner_first_name: string | null;
      couple_image_url: string | null;
      created_by: string;
    };
    collection_link_token: string | null;
  }> | null; 
  error: string | null 
}> {
  const supabase = createSupabaseClient();
  
  // Get guests with status 'invited', their group info, and the profile's collection_link_token
  const { data, error } = await supabase
    .from('guests')
    .select(`
      *,
      group:groups!inner (
        id,
        couple_first_name,
        partner_first_name,
        couple_image_url,
        created_by,
        profile:profiles!created_by (
          collection_link_token
        )
      )
    `)
    .eq('status', 'invited')
    .not('email', 'is', null)
    .not('email', 'like', 'NO_EMAIL_%');

  if (error) {
    return { data: null, error: error.message };
  }

  // Flatten the data structure
  const flattenedData = data?.map(guest => {
    const { group, ...guestData } = guest;
    return {
      ...guestData,
      group: {
        id: group.id,
        couple_first_name: group.couple_first_name,
        partner_first_name: group.partner_first_name,
        couple_image_url: group.couple_image_url,
        created_by: group.created_by,
      },
      collection_link_token: group.profile?.collection_link_token || null,
    };
  }) || [];

  return { data: flattenedData, error: null };
}

/**
 * Update guest after sending an invitation email
 */
export async function updateGuestInvitationStatus(
  guestId: string, 
  emailsSentCount: number
): Promise<{ error: string | null }> {
  const supabase = createSupabaseClient();
  
  const { error } = await supabase
    .from('guests')
    .update({
      emails_sent_count: emailsSentCount,
      last_email_sent_at: new Date().toISOString(),
    })
    .eq('id', guestId);

  return { error: error?.message || null };
}

/**
 * Mark guest invitation as completed (all emails sent, no response)
 */
export async function markGuestInvitationCompleted(
  guestId: string
): Promise<{ error: string | null }> {
  const supabase = createSupabaseClient();
  
  const { error } = await supabase
    .from('guests')
    .update({
      status: 'completed',
    })
    .eq('id', guestId);

  return { error: error?.message || null };
}

/**
 * Start invitation sequence for a guest
 */
export async function startGuestInvitation(
  guestId: string
): Promise<{ data: Guest | null; error: string | null }> {
  const supabase = createSupabaseClient();
  
  const { data, error } = await supabase
    .from('guests')
    .update({
      status: 'invited',
      invitation_started_at: new Date().toISOString(),
      emails_sent_count: 0,
      invitation_paused_at: null,
    })
    .eq('id', guestId)
    .select()
    .single();

  return { data, error: error?.message || null };
}

/**
 * Pause invitation sequence for a guest
 */
export async function pauseGuestInvitation(
  guestId: string
): Promise<{ data: Guest | null; error: string | null }> {
  const supabase = createSupabaseClient();
  
  const { data, error } = await supabase
    .from('guests')
    .update({
      status: 'paused',
      invitation_paused_at: new Date().toISOString(),
    })
    .eq('id', guestId)
    .select()
    .single();

  return { data, error: error?.message || null };
}

/**
 * Resume invitation sequence for a guest
 */
export async function resumeGuestInvitation(
  guestId: string
): Promise<{ data: Guest | null; error: string | null }> {
  const supabase = createSupabaseClient();
  
  const { data, error } = await supabase
    .from('guests')
    .update({
      status: 'invited',
      invitation_paused_at: null,
    })
    .eq('id', guestId)
    .select()
    .single();

  return { data, error: error?.message || null };
}

/**
 * Retry invitation sequence for a guest (start from email 1)
 */
export async function retryGuestInvitation(
  guestId: string
): Promise<{ data: Guest | null; error: string | null }> {
  const supabase = createSupabaseClient();
  
  const { data, error } = await supabase
    .from('guests')
    .update({
      status: 'invited',
      invitation_started_at: new Date().toISOString(),
      emails_sent_count: 0,
      invitation_paused_at: null,
      last_email_sent_at: null,
    })
    .eq('id', guestId)
    .select()
    .single();

  return { data, error: error?.message || null };
}

/**
 * Manually mark a guest as submitted (e.g., received recipe via WhatsApp)
 */
export async function markGuestAsSubmitted(
  guestId: string
): Promise<{ data: Guest | null; error: string | null }> {
  const supabase = createSupabaseClient();
  
  const { data, error } = await supabase
    .from('guests')
    .update({
      status: 'submitted',
    })
    .eq('id', guestId)
    .select()
    .single();

  return { data, error: error?.message || null };
}