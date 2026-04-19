import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/client';
import {
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

  if (event.type === 'checkout.session.completed') {
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
