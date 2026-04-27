import { NextRequest, NextResponse } from 'next/server';
import { stripe, BASE_BOOK_PRICE, ADDITIONAL_BOOK_PRICE } from '@/lib/stripe/client';

interface CreateCheckoutBody {
  bookQuantity: number;
  userType: 'couple' | 'gift_giver';
  giftDate: string | null;
  giftDateUndecided: boolean;
  bookCloseDate: string | null;
  email: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?)?$/;
const VALID_USER_TYPES = ['couple', 'gift_giver'] as const;

export async function POST(request: NextRequest) {
  let body: CreateCheckoutBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { bookQuantity, userType, giftDate, giftDateUndecided, bookCloseDate, email } = body;

  if (!email || typeof email !== 'string' || !EMAIL_RE.test(email.trim())) {
    return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
  }
  if (!Number.isInteger(bookQuantity) || bookQuantity < 1 || bookQuantity > 10) {
    return NextResponse.json({ error: 'Invalid bookQuantity (must be integer 1-10)' }, { status: 400 });
  }
  if (!VALID_USER_TYPES.includes(userType)) {
    return NextResponse.json({ error: 'Invalid userType' }, { status: 400 });
  }
  if (
    !giftDateUndecided &&
    (!bookCloseDate ||
      typeof bookCloseDate !== 'string' ||
      !ISO_DATE_RE.test(bookCloseDate) ||
      Number.isNaN(Date.parse(bookCloseDate)))
  ) {
    return NextResponse.json({ error: 'Invalid bookCloseDate (must be ISO format)' }, { status: 400 });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!siteUrl) {
    console.error('create-checkout-session: NEXT_PUBLIC_SITE_URL is not set');
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
  }

  // Reason: Our pricing is non-linear ($169 base + $129 per additional). We express
  // that to Stripe as two line_items instead of one with a linear unit_amount.
  const lineItems: Array<{
    price_data: {
      currency: string;
      product_data: { name: string };
      unit_amount: number;
    };
    quantity: number;
  }> = [
    {
      price_data: {
        currency: 'usd',
        product_data: { name: 'Small Plates Cookbook' },
        unit_amount: BASE_BOOK_PRICE * 100,
      },
      quantity: 1,
    },
  ];
  if (bookQuantity > 1) {
    lineItems.push({
      price_data: {
        currency: 'usd',
        product_data: { name: 'Additional Cookbook Copy' },
        unit_amount: ADDITIONAL_BOOK_PRICE * 100,
      },
      quantity: bookQuantity - 1,
    });
  }

  // Reason: Stripe does NOT automatically propagate Checkout Session metadata to the
  // underlying PaymentIntent. We copy the same metadata to `payment_intent_data.metadata`
  // so the payment_intent.succeeded webhook handler can early-return on
  // `metadata.type === 'initial_purchase'` and let checkout.session.completed own
  // this flow.
  const sharedMetadata = {
    type: 'initial_purchase',
    email: email.trim().toLowerCase(),
    bookQuantity: String(bookQuantity),
    userType,
    giftDate: giftDate ?? '',
    giftDateUndecided: String(giftDateUndecided),
    bookCloseDate: bookCloseDate ?? '',
  };

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: lineItems,
      customer_email: email.trim(),
      allow_promotion_codes: true,
      metadata: sharedMetadata,
      // Reason: receipt_email guarantees Stripe sends the automatic receipt in
      // test and live modes regardless of the Dashboard toggle. The Dashboard
      // docs state this parameter overrides the global setting.
      payment_intent_data: {
        receipt_email: email.trim().toLowerCase(),
        metadata: sharedMetadata,
      },
      success_url: `${siteUrl}/check-your-email?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/onboarding?cancelled=true`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error('create-checkout-session: stripe.checkout.sessions.create failed', err);
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
  }
}
