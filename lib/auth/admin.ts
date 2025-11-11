import { createSupabaseServer } from '@/lib/supabase/server';
import { isAdminEmail } from '@/lib/config/admin';

/**
 * Verifies that the current user has admin access
 * Throws error if user is not authenticated or not an admin
 * Used to protect admin API routes and operations
 */
export async function requireAdminAuth() {
  const supabase = await createSupabaseServer();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error) {
    throw new Error(`Authentication error: ${error.message}`);
  }
  
  if (!user) {
    throw new Error('User not authenticated');
  }
  
  if (!isAdminEmail(user.email)) {
    throw new Error('Admin access required');
  }
  
  return user;
}

/**
 * Client-side admin verification
 * Returns boolean instead of throwing error
 */
export function isCurrentUserAdmin(userEmail: string | null | undefined): boolean {
  return userEmail ? isAdminEmail(userEmail) : false;
}