import { createSupabaseAdminClient } from './admin';

/**
 * Get all recipes for a specific guest (admin version)
 * Uses service role to bypass RLS - admin can see ALL recipes
 */
export async function getRecipesByGuestAdmin(guestId: string) {
  const supabase = createSupabaseAdminClient();
  
  const { data, error } = await supabase
    .from('guest_recipes')
    .select('*')
    .eq('guest_id', guestId)
    .order('created_at', { ascending: false });
  
  return { data: data || [], error: error?.message || null };
}

/**
 * Get all recipes in the system (admin version)
 * Includes guest and user information
 */
export async function getAllRecipesAdmin() {
  const supabase = createSupabaseAdminClient();
  
  const { data, error } = await supabase
    .from('guest_recipes')
    .select(`
      *,
      guests (
        id,
        first_name,
        last_name,
        email,
        user_id
      ),
      profiles (
        id,
        full_name,
        email
      )
    `)
    .order('created_at', { ascending: false });
  
  return { data: data || [], error: error?.message || null };
}

/**
 * Get recipe statistics for admin dashboard
 */
export async function getRecipeStatsAdmin() {
  const supabase = createSupabaseAdminClient();
  
  // Get total recipe counts by status
  const { data: statusStats, error: statusError } = await supabase
    .from('guest_recipes')
    .select('submission_status')
    .then(({ data, error }) => {
      if (error) return { data: null, error };
      
      const stats = data?.reduce((acc, recipe) => {
        const status = recipe.submission_status || 'unknown';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};
      
      return { data: stats, error: null };
    });
  
  // Get total recipe count
  const { count: totalRecipes, error: countError } = await supabase
    .from('guest_recipes')
    .select('*', { count: 'exact', head: true });
  
  // Get recipes submitted today
  const today = new Date().toISOString().split('T')[0];
  const { count: todayRecipes, error: todayError } = await supabase
    .from('guest_recipes')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', `${today}T00:00:00.000Z`)
    .lte('created_at', `${today}T23:59:59.999Z`);
  
  return {
    data: {
      total: totalRecipes || 0,
      today: todayRecipes || 0,
      byStatus: statusStats || {}
    },
    error: statusError || countError?.message || todayError?.message || null
  };
}

/**
 * Search recipes by name, ingredients, or guest name (admin version)
 */
export async function searchRecipesAdmin(searchTerm: string) {
  const supabase = createSupabaseAdminClient();
  
  const { data, error } = await supabase
    .from('guest_recipes')
    .select(`
      *,
      guests (
        first_name,
        last_name,
        email
      )
    `)
    .or(`recipe_name.ilike.%${searchTerm}%,ingredients.ilike.%${searchTerm}%,instructions.ilike.%${searchTerm}%`)
    .order('created_at', { ascending: false });
  
  return { data: data || [], error: error?.message || null };
}