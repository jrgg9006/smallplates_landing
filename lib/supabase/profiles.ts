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

/**
 * Update personal information (name, phone)
 */
export async function updatePersonalInfo(updates: { full_name?: string; phone_number?: string | null }) {
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
 * Update user email (requires email verification)
 */
export async function updateEmail(newEmail: string, currentPassword: string) {
  const supabase = createSupabaseClient();
  
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return { data: null, error: 'User not authenticated' };
  }

  // Verify current password first
  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email: user.email!,
    password: currentPassword
  });

  if (verifyError) {
    return { data: null, error: 'Current password is incorrect' };
  }

  // Update email via Supabase Auth (triggers verification email)
  const { data, error } = await supabase.auth.updateUser({
    email: newEmail
  });

  if (error) {
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

/**
 * Update user password
 */
export async function updatePassword(currentPassword: string, newPassword: string) {
  const supabase = createSupabaseClient();
  
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return { data: null, error: 'User not authenticated' };
  }

  // Verify current password first
  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email: user.email!,
    password: currentPassword
  });

  if (verifyError) {
    return { data: null, error: 'Current password is incorrect' };
  }

  // Update password
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword
  });

  if (error) {
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

/**
 * Delete user account (irreversible)
 */
export async function deleteAccount(currentPassword: string) {
  const supabase = createSupabaseClient();
  
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return { data: null, error: 'User not authenticated' };
  }

  // Verify current password first
  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email: user.email!,
    password: currentPassword
  });

  if (verifyError) {
    return { data: null, error: 'Current password is incorrect' };
  }

  // Note: This function requires admin privileges on Supabase
  // For now, we'll mark the profile as deleted and let admin handle the actual deletion
  const { data, error } = await supabase
    .from('profiles')
    .update({ 
      email: `deleted_${Date.now()}@deleted.local`,
      full_name: 'Deleted User',
      phone_number: null,
      collection_enabled: false
    })
    .eq('id', user.id)
    .select()
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  // Sign out the user
  await supabase.auth.signOut();

  return { data, error: null };
}

// Note: updateShareMessage and resetShareMessage functions have been removed.
// Share messages are now stored in group_members table, not profiles.
// Use updateGroupShareMessage and resetGroupShareMessage from lib/supabase/groups.ts instead.