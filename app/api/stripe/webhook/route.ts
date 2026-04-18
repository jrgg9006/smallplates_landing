import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/client';
import {
  runPostPaymentSetup,
  runPostPaymentSetupFromSession,
  runExtraCopiesSetupFromSession,
  runDashboardExtrasSetupFromSession,
  runCopyOrderSetupFromSession,
  emitPostPaymentAutoLogin,
} from '@/lib/stripe/post-payment-setup';
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
  } else if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const metadataType = session.metadata?.type;

    if (metadataType === 'initial_purchase') {
      await handleCheckoutSessionCompleted(session);
    } else if (metadataType === 'extra_copies_purchase') {
      await handleExtraCopiesPurchase(session);
    } else if (metadataType === 'dashboard_extras_purchase') {
      await handleDashboardExtrasPurchase(session);
    } else if (metadataType === 'copy_order_purchase') {
      await handleCopyOrderPurchase(session);
    }
    // Reason: Ignore unknown types silently — future flows may add their own.
  }

  return NextResponse.json({ received: true });
}

async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  const metadata = paymentIntent.metadata || {};

  // Reason: Checkout-hosted flows (initial_purchase, extra_copies_purchase,
  // dashboard_extras_purchase, copy_order_purchase) are processed via their
  // checkout.session.completed handlers. We must not double-process them here.
  if (
    metadata.type === 'initial_purchase' ||
    metadata.type === 'extra_copies_purchase' ||
    metadata.type === 'dashboard_extras_purchase' ||
    metadata.type === 'copy_order_purchase'
  ) {
    return;
  }

  // Reason: Legacy Flow B extra_copies path still uses a client-side PATCH to
  // /extra-copies-payment to record the order; the webhook must stay out of its way
  // until that endpoint is retired in Phase 9 cleanup.
  if (metadata.type === 'extra_copies') {
    return;
  }

  const email = metadata.email?.trim().toLowerCase() || '';
  const buyerName = metadata.buyerName?.trim() || '';

  if (!email) {
    console.error('webhook: payment_intent.succeeded has no email in metadata', paymentIntent.id);
    return;
  }

  // Reason: Run the idempotent DB setup. If post-payment-login ran first, this is a
  // no-op (every mutation is gated by existence checks).
  const setup = await runPostPaymentSetup({ paymentIntent, email, buyerName });

  // Reason: Only emit the magic-link email when WE created the order. Otherwise
  // post-payment-login already handled it and generating another token here would
  // invalidate the one it already returned to the browser.
  if (setup.orderCreated) {
    await emitPostPaymentAutoLogin({
      email,
      buyerName,
      wasExisting: setup.wasExisting,
    });
  }

  // Reason: Promo code redemption tracking — Stripe doesn't auto-track redemptions for
  // manual PI flows. Deactivate the promo code if it hit max_redemptions.
  if (metadata.promotion_code_id) {
    try {
      const promoCode = await stripe.promotionCodes.retrieve(metadata.promotion_code_id);
      if (
        promoCode.max_redemptions &&
        promoCode.times_redeemed + 1 >= promoCode.max_redemptions
      ) {
        await stripe.promotionCodes.update(metadata.promotion_code_id, { active: false });
      }
    } catch (err) {
      console.error('webhook: promo code redemption update failed', err);
    }
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const metadata = session.metadata || {};

  // Reason: Only process initial_purchase sessions. Future flow types
  // (extra_copies, copy_order via Checkout) will have their own handlers.
  if (metadata.type !== 'initial_purchase') {
    return;
  }

  const setup = await runPostPaymentSetupFromSession({ session });

  // Reason: Send welcome email with magic link only if WE created the order row.
  // On retries where the row already exists, skip to avoid re-sending.
  if (setup.orderCreated) {
    const email =
      (session.customer_details?.email ?? session.customer_email ?? '')
        .trim()
        .toLowerCase();
    const buyerName = session.customer_details?.name?.trim() || '';

    await emitPostPaymentAutoLogin({
      email,
      buyerName,
      wasExisting: setup.wasExisting,
    });
  }
}

async function handleExtraCopiesPurchase(session: Stripe.Checkout.Session) {
  // Reason: Records the extra_copy order. No email is sent from this flow —
  // the buyer already has a session and the dashboard's BookClosedStatus view
  // reflects the new order once the dashboard refreshes after return.
  const result = await runExtraCopiesSetupFromSession({ session });
  if (!result.orderCreated) {
    console.warn(
      'handleExtraCopiesPurchase: order was not created (likely idempotency hit)',
      { sessionId: session.id }
    );
  }
}

async function handleDashboardExtrasPurchase(session: Stripe.Checkout.Session) {
  // Reason: Dashboard "Get more copies" flow — the user provides shipping
  // inline in our UI, it's persisted only as a JSONB snapshot in the order.
  // No email sent; the dashboard reflects the new order on refresh.
  const result = await runDashboardExtrasSetupFromSession({ session });
  if (!result.orderCreated) {
    console.warn(
      'handleDashboardExtrasPurchase: order was not created (likely idempotency hit)',
      { sessionId: session.id }
    );
  }
}

async function handleCopyOrderPurchase(session: Stripe.Checkout.Session) {
  // Reason: Public copy-order flow — third-party buyer without account.
  // Order is created with user_id=NULL. Shipping is a JSONB snapshot only.
  const result = await runCopyOrderSetupFromSession({ session });
  if (!result.orderCreated) {
    console.warn(
      'handleCopyOrderPurchase: order was not created (likely idempotency hit)',
      { sessionId: session.id }
    );
  }
}
