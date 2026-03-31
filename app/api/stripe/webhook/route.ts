import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/client';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { sendWelcomeLoginEmail } from '@/lib/postmark';
import Stripe from 'stripe';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    await handlePaymentSucceeded(paymentIntent);
  }

  return NextResponse.json({ received: true });
}

async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  const supabaseAdmin = createSupabaseAdminClient();
  const metadata = paymentIntent.metadata || {};

  const email = metadata.email || '';
  const bookQuantity = parseInt(metadata.bookQuantity || '1', 10);
  const userType = metadata.userType || 'couple';
  const existingUserId = metadata.existingUserId;

  // Idempotency: check if order already exists for this payment intent
  const { data: existingOrder } = await supabaseAdmin
    .from('orders')
    .select('id')
    .eq('stripe_payment_intent', paymentIntent.id)
    .single();

  if (existingOrder) {
    return;
  }

  // Reason: Embedded gift flow collects email at payment but couple names come later.
  // The complete-onboarding endpoint handles user/group/cookbook creation.
  // Webhook only creates a minimal order record as a receipt.
  const isEmbeddedGiftFlow = userType === 'gift_giver' && !existingUserId;

  // Reason: Embedded flow — create order + user account (safety net).
  // Group, cookbook, and welcome email happen in complete-onboarding (step 4).
  if (isEmbeddedGiftFlow) {
    // Reason: Try to get email from metadata. If missing (race condition), re-fetch PI.
    let freshEmail = email;
    if (!freshEmail) {
      try {
        const freshPI = await stripe.paymentIntents.retrieve(paymentIntent.id);
        freshEmail = freshPI.metadata?.email || '';
      } catch {
        // Reason: If re-fetch fails, proceed without email. complete-onboarding will handle it.
      }
    }

    // Create user account if we have an email — so they can always log in
    let userId: string | null = null;
    if (freshEmail) {
      try {
        // Reason: Query profiles table (indexed on email) instead of listUsers() which loads all users
        const { data: existingProfile } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .eq('email', freshEmail)
          .single();

        if (existingProfile) {
          userId = existingProfile.id;
        } else {
          const { data: newUser } = await supabaseAdmin.auth.admin.createUser({
            email: freshEmail,
            email_confirm: true,
            user_metadata: { user_type: userType, source: 'embedded_checkout' },
          });
          if (newUser?.user) {
            userId = newUser.user.id;
            await supabaseAdmin.from('profiles').insert({
              id: userId,
              email: freshEmail,
              user_type: userType as 'couple' | 'gift_giver',
            });
          }
        }
      } catch (err) {
        console.error('Error creating user in webhook:', err);
      }
    }

    const { error: orderError } = await supabaseAdmin.from('orders').insert({
      user_id: userId,
      email: freshEmail || 'pending@checkout.local',
      stripe_payment_intent: paymentIntent.id,
      amount_total: paymentIntent.amount,
      book_quantity: bookQuantity,
      couple_name: null,
      user_type: userType,
      onboarding_data: metadata,
      status: 'paid',
    });

    if (orderError) {
      console.error('Error creating order for embedded flow:', orderError);
    }

    // Reason: Send welcome email so user can recover if they close browser before completing step 4.
    // Magic link redirects to /complete-setup where they finish group/cookbook creation.
    if (userId && freshEmail) {
      try {
        // Reason: Redirect directly (skip callback). generateLink uses implicit flow (#access_token),
        // which the callback can't handle. The complete-setup page extracts tokens via setSession().
        const redirectTo = `${process.env.NEXT_PUBLIC_BASE_URL}/complete-setup?pi=${paymentIntent.id}&type=${userType}`;

        const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
          type: 'magiclink',
          email: freshEmail,
          options: { redirectTo },
        });

        if (!linkError && linkData?.properties?.action_link) {
          const buyerName = metadata.buyerName?.split(' ')[0] || '';
          await sendWelcomeLoginEmail({
            to: freshEmail,
            buyerName,
            loginLink: linkData.properties.action_link,
          });
        }
      } catch (err) {
        console.error('Error sending welcome email for embedded flow:', err);
      }
    }

    return;
  }

  // --- Fallback: existing user adding a book, or legacy hosted checkout flow ---

  let userId = existingUserId || null;

  // Create user if not existing
  if (!userId) {
    // Reason: Query profiles table (indexed on email) instead of listUsers() which loads all users
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single();

    if (existingProfile) {
      userId = existingProfile.id;
    } else {
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: {
          user_type: userType,
          source: 'stripe_checkout',
        },
      });

      if (createError) {
        console.error('Error creating user:', createError);
      } else {
        userId = newUser.user.id;

        await supabaseAdmin.from('profiles').insert({
          id: userId,
          email,
          user_type: userType as 'couple' | 'gift_giver',
          full_name: metadata.buyerName || null,
        });
      }
    }
  }

  // Reason: Group and cookbook are created in complete-onboarding (step 4).
  // Webhook only creates the order as a receipt of payment.
  const { error: orderError } = await supabaseAdmin.from('orders').insert({
    user_id: userId,
    email,
    stripe_payment_intent: paymentIntent.id,
    amount_total: paymentIntent.amount,
    book_quantity: bookQuantity,
    couple_name: null,
    user_type: userType,
    onboarding_data: metadata,
    status: 'paid',
  });

  if (orderError) {
    console.error('Error creating order:', orderError);
  }

  // Reason: Generate a magic link via Supabase, then send it through Postmark
  // so the email comes from our domain with our branded template
  if (userId && !existingUserId) {
    try {
      const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'magiclink',
        email,
        options: {
          redirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}/api/v1/auth/callback?next=/profile/groups`,
        },
      });

      if (linkError) {
        console.error('Error generating magic link:', linkError);
      } else if (linkData?.properties?.action_link) {
        const buyerName = metadata.buyerName?.split(' ')[0] || '';

        await sendWelcomeLoginEmail({
          to: email,
          buyerName,
          loginLink: linkData.properties.action_link,
        });
      }
    } catch (err) {
      console.error('Error sending welcome email:', err);
    }
  }
}
