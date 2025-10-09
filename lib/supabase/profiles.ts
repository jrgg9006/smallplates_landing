import { createSupabaseClient } from '@/lib/supabase/client';
import type { Profile, ProfileUpdate } from '@/lib/types/database';

/**
 * Get the current user's profile
 */
export async function getCurrentProfile(): Promise<{ data: Profile | null; error: string | null }> {
  const supabase = createSupabaseClient();
  
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return { data: null, error: 'User not authenticated' };
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return { data, error: error?.message || null };
}

/**
 * Update the current user's profile
 */
export async function updateProfile(updates: ProfileUpdate) {
  const supabase = createSupabaseClient();
  
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return { data: null, error: 'User not authenticated' };
  }

  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user.id)
    .select()
    .single();

  return { data, error: error?.message || null };
}

/**
 * Check if the user has completed their profile
 */
export async function isProfileComplete(): Promise<boolean> {
  const { data: profile } = await getCurrentProfile();
  
  if (!profile) return false;
  
  // Check if required fields are filled
  return !!(profile.full_name);
}

/**
 * Get profile by user ID (for admin use cases)
 */
export async function getProfileById(userId: string) {
  const supabase = createSupabaseClient();
  
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  return { data, error: error?.message || null };
}