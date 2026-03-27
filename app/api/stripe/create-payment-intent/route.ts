import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/client';
import { calculateTotal, calculateSubtotal, calculateShipping, ShippingCountry } from '@/lib/stripe/pricing';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      bookQuantity,
      shippingCountry,
      userType,
      giftDate,
      giftDateUndecided,
      bookCloseDate,
    } = body;

    if (!bookQuantity || bookQuantity < 1 || bookQuantity > 10) {
      return NextResponse.json({ error: 'Invalid book quantity' }, { status: 400 });
    }

    // Reason: Gift flow uses flat $15 shipping (no country selector).
    // Couple flow still uses country-based shipping via calculateTotal.
    const total = shippingCountry
      ? calculateTotal(bookQuantity, shippingCountry as ShippingCountry)
      : calculateSubtotal(bookQuantity) + calculateShipping(bookQuantity, 'US');

    const metadata: Record<string, string> = {
      bookQuantity: String(bookQuantity),
      shippingCountry: shippingCountry || 'US',
      userType: userType || 'couple',
    };

    if (giftDate) metadata.giftDate = giftDate;
    if (giftDateUndecided) metadata.giftDateUndecided = 'true';
    if (bookCloseDate) metadata.bookCloseDate = bookCloseDate;

    const paymentIntent = await stripe.paymentIntents.create({
      amount: total * 100,
      currency: 'usd',
      automatic_payment_methods: { enabled: true },
      metadata,
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (err) {
    console.error('Error creating payment intent:', err);
    return NextResponse.json(
      { error: 'Failed to create payment intent' },
      { status: 500 }
    );
  }
}
