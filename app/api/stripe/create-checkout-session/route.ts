import { NextRequest, NextResponse } from 'next/server';
import {
  stripe,
  BASE_BOOK_PRICE,
  ADDITIONAL_BOOK_PRICE,
  ShippingCountry,
} from '@/lib/stripe/client';

interface CreateCheckoutBody {
  email: string;
  bookQuantity: number;
  shippingCountry?: ShippingCountry;
  userType: 'couple' | 'gift_giver';
  existingUserId?: string;
  buyerName?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateCheckoutBody = await request.json();
    const { email, bookQuantity, shippingCountry, userType, existingUserId, buyerName } = body;

    if (!email || !bookQuantity) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (bookQuantity < 1 || bookQuantity > 10) {
      return NextResponse.json({ error: 'Invalid book quantity' }, { status: 400 });
    }

    if (shippingCountry && !['US', 'MX'].includes(shippingCountry)) {
      return NextResponse.json({ error: 'Invalid shipping country' }, { status: 400 });
    }

    // Build line items
    const lineItems: Array<{
      price_data: {
        currency: string;
        product_data: { name: string; description?: string };
        unit_amount: number;
      };
      quantity: number;
    }> = [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'The Book',
            description: 'Premium Hardcover Recipe Book (8x10)',
          },
          unit_amount: BASE_BOOK_PRICE * 100,
        },
        quantity: 1,
      },
    ];

    // Add additional copies if any
    if (bookQuantity > 1) {
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Additional Copy',
            description: 'Classic Hardcover Recipe Book (6x9)',
          },
          unit_amount: ADDITIONAL_BOOK_PRICE * 100,
        },
        quantity: bookQuantity - 1,
      });
    }

    const sessionMetadata = {
      email,
      bookQuantity: String(bookQuantity),
      shippingCountry: shippingCountry || '',
      userType,
      ...(existingUserId ? { existingUserId } : {}),
      ...(buyerName ? { buyerName } : {}),
    };

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: email,
      line_items: lineItems,
      allow_promotion_codes: true,
      metadata: sessionMetadata,
      // Reason: Webhook listens for payment_intent.succeeded and reads PI metadata,
      // so we must forward session metadata to the underlying PaymentIntent
      payment_intent_data: {
        metadata: sessionMetadata,
      },
      success_url: `${request.nextUrl.origin}/order-confirmation?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${request.nextUrl.origin}/onboarding-gift?cancelled=true`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error('Error creating checkout session:', err);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
