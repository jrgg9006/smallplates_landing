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
    email: formData.email || '', // Provide empty string if no email
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
 * Get all guests for the current user
 */
export async function getGuests(includeArchived = false): Promise<{ data: Guest[] | null; error: string | null }> {
  const supabase = createSupabaseClient();
  
  let query = supabase
    .from('guests')
    .select('*')
    .order('created_at', { ascending: false });

  if (!includeArchived) {
    query = query.eq('is_archived', false);
  }

  const { data, error } = await query;

  return { data, error: error?.message || null };
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
 * Search guests using the database function
 */
export async function searchGuests(filters: GuestSearchFilters) {
  const supabase = createSupabaseClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { data: null, error: 'User not authenticated' };
  }

  const { data, error } = await supabase.rpc('search_guests', {
    user_uuid: user.id,
    search_query: filters.search_query || null,
    status_filter: filters.status || null,
    include_archived: filters.include_archived || false,
  });

  return { data, error: error?.message || null };
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
  const supabase = createSupabaseClient();
  
  const { data } = await supabase
    .from('guests')
    .select('id')
    .eq('email', email)
    .eq('is_archived', false)
    .single();

  return !!data;
}