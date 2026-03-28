import { NextResponse } from "next/server";
import { createSupabaseRoute } from "@/lib/supabase/route";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * OAuth callback handler for Supabase authentication
 *
 * This route handles the OAuth callback after successful authentication
 * with providers like Google. It exchanges the code for a session.
 */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") || "/";
  const origin = requestUrl.origin;

  if (code) {
    const supabase = await createSupabaseRoute();

    // Exchange code for session
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("Error exchanging code for session:", error.message);
      // Reason: Send to recovery page so expired magic link users can request a fresh one
      return NextResponse.redirect(`${origin}/recover-setup`);
    }

    // Reason: After successful auth, check if user has a paid order without completed setup.
    // If so, redirect them to complete-setup instead of the dashboard.
    // But skip this for users who already have groups (they're existing users).
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const supabaseAdmin = createSupabaseAdminClient();

      // Reason: Users with existing groups already completed setup — don't redirect them
      const { count: groupCount } = await supabaseAdmin
        .from('group_members')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('role', 'owner');

      if (!groupCount || groupCount === 0) {
        const { data: incompleteOrder } = await supabaseAdmin
          .from('orders')
          .select('stripe_payment_intent, user_type')
          .eq('user_id', user.id)
          .eq('status', 'paid')
          .is('couple_name', null)
          .limit(1)
          .single();

        if (incompleteOrder?.stripe_payment_intent) {
          const setupUrl = `/complete-setup?pi=${incompleteOrder.stripe_payment_intent}&type=${incompleteOrder.user_type || 'gift_giver'}`;
          return NextResponse.redirect(`${origin}${setupUrl}`);
        }
      }
    }
  }

  // Redirect to specified page or home page after successful authentication
  return NextResponse.redirect(`${origin}${next}`);
}
