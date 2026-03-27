import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { sendWelcomeLoginEmail } from '@/lib/postmark';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const supabaseAdmin = createSupabaseAdminClient();

    // Reason: Find user by email to confirm they exist before generating a link
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', normalizedEmail)
      .single();

    if (!profile) {
      // Reason: Return success even if no user found to prevent email enumeration
      return NextResponse.json({ sent: true });
    }

    // Reason: Check for incomplete order (paid but no couple_name = didn't finish step 4)
    const { data: incompleteOrder } = await supabaseAdmin
      .from('orders')
      .select('stripe_payment_intent, user_type')
      .eq('user_id', profile.id)
      .eq('status', 'paid')
      .is('couple_name', null)
      .limit(1)
      .single();

    // Reason: Redirect directly (skip callback). generateLink uses implicit flow (#access_token),
    // which the callback can't handle. The destination page extracts tokens via setSession().
    const redirectTo = incompleteOrder?.stripe_payment_intent
      ? `${process.env.NEXT_PUBLIC_BASE_URL}/complete-setup?pi=${incompleteOrder.stripe_payment_intent}&type=${incompleteOrder.user_type || 'gift_giver'}`
      : `${process.env.NEXT_PUBLIC_BASE_URL}/profile/groups`;

    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: normalizedEmail,
      options: { redirectTo },
    });

    if (linkError || !linkData?.properties?.action_link) {
      console.error('Error generating magic link:', linkError);
      return NextResponse.json({ error: 'Could not generate login link' }, { status: 500 });
    }

    const buyerName = '';
    await sendWelcomeLoginEmail({
      to: normalizedEmail,
      buyerName,
      loginLink: linkData.properties.action_link,
    });

    return NextResponse.json({ sent: true });
  } catch (err) {
    console.error('Error in resend-setup-link:', err);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
