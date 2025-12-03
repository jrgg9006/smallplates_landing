import { createClient } from '@supabase/supabase-js';

/**
 * Admin service client - bypasses ALL RLS policies
 * Used for master admin dashboard operations
 * Requires SUPABASE_SERVICE_ROLE_KEY in environment
 */
export function createSupabaseAdminClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for admin operations');
  }

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
}