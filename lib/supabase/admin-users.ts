import { createSupabaseAdminClient } from './admin';

/**
 * Get all users with their activity stats (admin version)
 * Uses service role to bypass RLS - admin can see ALL users
 *
 * Returns each profile enriched with:
 *   - guest_count, recipe_count, groups_owned_count
 *   - last_activity (most recent recipe submitted)
 *   - last_sign_in_at (from auth.users)
 *   - is_test_account (from profiles)
 *   - has_paid (from orders.status='paid')
 */
export async function getAllUsersAdmin() {
  const supabase = createSupabaseAdminClient();

  // Get all profiles
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (profilesError) {
    return { data: [], error: profilesError.message };
  }

  // Reason: fetch auth users once instead of N+1, then build a map for O(1) lookup of last_sign_in_at
  const authMap = new Map<string, string | null>();
  try {
    const { data: authData } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
    for (const u of authData?.users || []) {
      authMap.set(u.id, u.last_sign_in_at || null);
    }
  } catch (e) {
    // If auth listing fails we still return profiles without last_sign_in_at instead of erroring out
    console.error('Failed to list auth users for admin panel:', e);
  }

  // Reason: fetch all paid orders once and group by user_id / email so we can flag has_paid in O(1)
  const paidUserIds = new Set<string>();
  const paidEmails = new Set<string>();
  const { data: paidOrders } = await supabase
    .from('orders')
    .select('user_id, email')
    .eq('status', 'paid');
  for (const o of paidOrders || []) {
    if (o.user_id) paidUserIds.add(o.user_id);
    if (o.email) paidEmails.add(o.email.toLowerCase());
  }

  // For each user, get their activity stats
  const usersWithStats = await Promise.all(
    (profiles || []).map(async (profile) => {
      // Get guest count
      const { count: guestCount } = await supabase
        .from('guests')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', profile.id)
        .eq('is_archived', false);

      // Get recipe count
      const { count: recipeCount } = await supabase
        .from('guest_recipes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', profile.id);

      // Get groups owned count
      const { count: groupsOwnedCount } = await supabase
        .from('groups')
        .select('*', { count: 'exact', head: true })
        .eq('created_by', profile.id);

      // Get groups where user is a member but NOT owner (captain/admin memberships)
      const { count: groupsMemberCount } = await supabase
        .from('group_members')
        .select('*', { count: 'exact', head: true })
        .eq('profile_id', profile.id)
        .neq('role', 'owner');

      // Get last activity
      const { data: lastRecipe } = await supabase
        .from('guest_recipes')
        .select('created_at')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const hasPaid =
        paidUserIds.has(profile.id) ||
        (profile.email ? paidEmails.has(profile.email.toLowerCase()) : false);

      return {
        ...profile,
        guest_count: guestCount || 0,
        recipe_count: recipeCount || 0,
        groups_owned_count: groupsOwnedCount || 0,
        groups_member_count: groupsMemberCount || 0,
        last_activity: lastRecipe?.created_at || null,
        last_sign_in_at: authMap.get(profile.id) ?? null,
        has_paid: hasPaid,
      };
    })
  );

  return { data: usersWithStats, error: null };
}

/**
 * Get specific user with all their guests and stats (admin version)
 */
export async function getUserWithGuestsAdmin(userId: string) {
  const supabase = createSupabaseAdminClient();
  
  // Get user profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (profileError) {
    return { profile: null, guests: [], error: profileError.message };
  }

  // Get user's guests with recipe counts
  const { data: guests, error: guestsError } = await supabase
    .from('guests')
    .select('*')
    .eq('user_id', userId)
    .eq('is_archived', false)
    .order('created_at', { ascending: false });

  if (guestsError) {
    return { profile, guests: [], error: guestsError.message };
  }

  // Add recipe count to each guest
  const guestsWithCounts = await Promise.all(
    (guests || []).map(async (guest) => {
      const { count: recipeCount } = await supabase
        .from('guest_recipes')
        .select('*', { count: 'exact', head: true })
        .eq('guest_id', guest.id);

      return {
        ...guest,
        recipes_received: recipeCount || 0
      };
    })
  );

  return { 
    profile, 
    guests: guestsWithCounts, 
    error: null 
  };
}

/**
 * Get user statistics for admin dashboard
 */
export async function getUserStatsAdmin() {
  const supabase = createSupabaseAdminClient();
  
  // Get total user count
  const { count: totalUsers, error: usersError } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true });

  // Get users created today
  const today = new Date().toISOString().split('T')[0];
  const { count: todayUsers, error: todayUsersError } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', `${today}T00:00:00.000Z`)
    .lte('created_at', `${today}T23:59:59.999Z`);

  // Get users created this week
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const { count: weekUsers, error: weekUsersError } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', weekAgo.toISOString());

  // Get total guest count
  const { count: totalGuests, error: guestsError } = await supabase
    .from('guests')
    .select('*', { count: 'exact', head: true })
    .eq('is_archived', false);

  return {
    data: {
      totalUsers: totalUsers || 0,
      todayUsers: todayUsers || 0,
      weekUsers: weekUsers || 0,
      totalGuests: totalGuests || 0
    },
    error: usersError?.message || todayUsersError?.message || weekUsersError?.message || guestsError?.message || null
  };
}

/**
 * Search users by name or email (admin version)
 */
export async function searchUsersAdmin(searchTerm: string) {
  const supabase = createSupabaseAdminClient();
  
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .or(`full_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
    .order('created_at', { ascending: false });
  
  return { data: data || [], error: error?.message || null };
}