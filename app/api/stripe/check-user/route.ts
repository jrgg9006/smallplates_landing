import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ exists: false });
    }

    const supabaseAdmin = createSupabaseAdminClient();

    // Reason: Query profiles table directly — indexed on email, no pagination issues
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name')
      .eq('email', email.trim().toLowerCase())
      .single();

    if (!profile) {
      return NextResponse.json({ exists: false });
    }

    // Reason: Check if user already has groups — if so, they completed onboarding and should go to dashboard
    const { count } = await supabaseAdmin
      .from('group_members')
      .select('group_id', { count: 'exact', head: true })
      .eq('profile_id', profile.id)
      .eq('role', 'owner');

    // Reason: Check for paid orders where couple_name is NULL — user paid but didn't finish setup
    const { data: incompleteOrder } = await supabaseAdmin
      .from('orders')
      .select('stripe_payment_intent, user_type')
      .eq('user_id', profile.id)
      .eq('status', 'paid')
      .is('couple_name', null)
      .limit(1)
      .single();

    return NextResponse.json({
      exists: true,
      fullName: profile.full_name,
      hasGroups: (count ?? 0) > 0,
      hasIncompleteOrder: !!incompleteOrder,
    });
  } catch {
    return NextResponse.json({ exists: false });
  }
}
