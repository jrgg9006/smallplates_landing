import { createSupabaseClient } from '@/lib/supabase/client';

export interface IncompleteOrder {
  stripe_payment_intent: string;
  user_type: string;
}

/**
 * Fetch orders that were paid but never completed setup (couple_name is NULL).
 * Uses browser client with RLS — only returns the authenticated user's orders.
 */
export async function getIncompleteOrders(): Promise<{ data: IncompleteOrder[]; error: string | null }> {
  const supabase = createSupabaseClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return { data: [], error: 'User not authenticated' };
  }

  // Reason: couple_name is NULL when the user paid but didn't finish PostPaymentSetup.
  // Same detection logic as app/api/stripe/resend-setup-link/route.ts:28-36
  // Exclude extra_copy and copy_order since those don't need onboarding setup.
  const { data, error } = await supabase
    .from('orders')
    .select('stripe_payment_intent, user_type')
    .eq('user_id', user.id)
    .eq('status', 'paid')
    .is('couple_name', null)
    .not('order_type', 'in', '("extra_copy","copy_order")');

  if (error) {
    return { data: [], error: error.message };
  }

  return { data: (data || []) as IncompleteOrder[], error: null };
}
