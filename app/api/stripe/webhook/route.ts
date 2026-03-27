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
  const shippingCountry = metadata.shippingCountry || 'US';
  const userType = metadata.userType || 'couple';
  const purchaseIntentId = metadata.purchaseIntentId;
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
  const isEmbeddedGiftFlow = userType === 'gift_giver' && !purchaseIntentId && !existingUserId;

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
      stripe_session_id: paymentIntent.id,
      stripe_payment_intent: paymentIntent.id,
      amount_total: paymentIntent.amount,
      book_quantity: bookQuantity,
      shipping_country: shippingCountry,
      couple_name: null,
      user_type: userType,
      purchase_intent_id: null,
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

  // --- Existing flow: couple or gift_giver with purchaseIntentId (hosted checkout) ---

  // Fetch purchase_intent data for onboarding info
  let purchaseIntentData: Record<string, unknown> | null = null;
  if (purchaseIntentId) {
    const { data } = await supabaseAdmin
      .from('purchase_intents')
      .select('*')
      .eq('id', purchaseIntentId)
      .single();
    purchaseIntentData = data;
  }

  let userId = existingUserId || null;

  // Create user if not existing
  if (!userId) {
    // Check if user already exists by email
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

        // Create profile for new user
        await supabaseAdmin.from('profiles').insert({
          id: userId,
          email,
          user_type: userType as 'couple' | 'gift_giver',
          full_name: metadata.buyerName || (purchaseIntentData as Record<string, string> | null)?.gift_giver_name || null,
        });
      }
    }
  }

  // Create group for the couple
  if (userId && purchaseIntentData) {
    const pid = purchaseIntentData as Record<string, unknown>;
    const coupleName = pid.couple_first_name && pid.partner_first_name
      ? `${pid.couple_first_name} & ${pid.partner_first_name}`
      : 'New Book';

    const { data: group, error: groupError } = await supabaseAdmin
      .from('groups')
      .insert({
        name: coupleName,
        description: `A wedding recipe book for ${coupleName}`,
        created_by: userId,
        couple_first_name: pid.couple_first_name as string || null,
        couple_last_name: pid.couple_last_name as string || null,
        partner_first_name: pid.partner_first_name as string || null,
        partner_last_name: pid.partner_last_name as string || null,
        wedding_date: pid.wedding_date as string || null,
        wedding_date_undecided: (pid.wedding_date_undecided as boolean) || false,
        relationship_to_couple: pid.relationship as string || null,
        gift_date: pid.gift_date as string || null,
        gift_date_undecided: (pid.gift_date_undecided as boolean) || false,
        book_close_date: pid.book_close_date as string || null,
      })
      .select('id')
      .single();

    if (groupError) {
      console.error('Error creating group:', groupError);
    } else if (group) {
      await supabaseAdmin.from('group_members').insert({
        group_id: group.id,
        profile_id: userId,
        role: 'owner',
        relationship_to_couple: pid.relationship as string || null,
      });

      await supabaseAdmin.from('cookbooks').insert({
        user_id: userId,
        name: coupleName as string,
        description: `Recipe book for ${coupleName}`,
        is_group_cookbook: true,
        group_id: group.id,
      });
    }
  }

  // Insert order record
  const { error: orderError } = await supabaseAdmin.from('orders').insert({
    user_id: userId,
    email,
    stripe_session_id: paymentIntent.id,
    stripe_payment_intent: paymentIntent.id,
    amount_total: paymentIntent.amount,
    book_quantity: bookQuantity,
    shipping_country: shippingCountry,
    couple_name: purchaseIntentData
      ? `${(purchaseIntentData as Record<string, string>).couple_first_name || ''} & ${(purchaseIntentData as Record<string, string>).partner_first_name || ''}`
      : null,
    user_type: userType,
    purchase_intent_id: purchaseIntentId || null,
    onboarding_data: purchaseIntentData || null,
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
        const buyerName = metadata.buyerName?.split(' ')[0] ||
          (purchaseIntentData as Record<string, string> | null)?.gift_giver_name || '';

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

  // Update purchase_intent status
  if (purchaseIntentId) {
    await supabaseAdmin
      .from('purchase_intents')
      .update({ status: 'paid' })
      .eq('id', purchaseIntentId);
  }
}
