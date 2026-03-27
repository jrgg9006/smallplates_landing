import { NextRequest, NextResponse } from 'next/server';
import {
  stripe,
  BASE_BOOK_PRICE,
  ADDITIONAL_BOOK_PRICE,
  calculateShipping,
  ShippingCountry,
} from '@/lib/stripe/client';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

interface CreateCheckoutBody {
  email: string;
  bookQuantity: number;
  shippingCountry?: ShippingCountry;
  userType: 'couple' | 'gift_giver';
  purchaseIntentId?: string;
  existingUserId?: string;
  buyerName?: string;
  // Reason: Gift giver flow sends purchase intent data directly instead of a pre-created ID
  purchaseIntentData?: {
    coupleFirstName?: string;
    partnerFirstName?: string;
    relationship?: string;
    giftDate?: string | null;
    giftDateUndecided?: boolean;
    bookCloseDate?: string | null;
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateCheckoutBody = await request.json();
    const { email, bookQuantity, shippingCountry, userType, existingUserId, buyerName, purchaseIntentData } = body;
    let { purchaseIntentId } = body;

    if (!email || !bookQuantity) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Reason: Create purchase intent server-side with admin client to bypass RLS
    if (!purchaseIntentId && purchaseIntentData) {
      const supabaseAdmin = createSupabaseAdminClient();
      const { data: pi, error: piError } = await supabaseAdmin
        .from('purchase_intents')
        .insert({
          email,
          selected_tier: 'the-book',
          user_type: userType,
          couple_first_name: purchaseIntentData.coupleFirstName || null,
          partner_first_name: purchaseIntentData.partnerFirstName || null,
          gift_giver_name: buyerName || null,
          relationship: purchaseIntentData.relationship || null,
          gift_date: purchaseIntentData.giftDate || null,
          gift_date_undecided: purchaseIntentData.giftDateUndecided || false,
          book_close_date: purchaseIntentData.bookCloseDate || null,
          shipping_destination: shippingCountry || 'US',
          couple_last_name: null,
          partner_last_name: null,
          wedding_date: null,
          wedding_date_undecided: false,
          planning_stage: null,
          guest_count: null,
          timeline: null,
        })
        .select('id')
        .single();

      if (piError || !pi?.id) {
        console.error('Error creating purchase intent:', piError);
        return NextResponse.json({ error: 'Failed to save order details' }, { status: 500 });
      }
      purchaseIntentId = pi.id;
    }

    if (!purchaseIntentId) {
      return NextResponse.json({ error: 'Missing purchase intent' }, { status: 400 });
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
      purchaseIntentId,
      ...(existingUserId ? { existingUserId } : {}),
      ...(buyerName ? { buyerName } : {}),
    };

    // Reason: When shippingCountry is provided (couple flow), use single fixed shipping option.
    // When not provided (gift giver flow), let Stripe collect the address and show both options.
    const shippingConfig = shippingCountry
      ? {
          shipping_options: [
            {
              shipping_rate_data: {
                type: 'fixed_amount' as const,
                fixed_amount: {
                  amount: calculateShipping(bookQuantity, shippingCountry) * 100,
                  currency: 'usd',
                },
                display_name: `Shipping to ${shippingCountry === 'US' ? 'United States' : 'Mexico'}`,
              },
            },
          ],
        }
      : {
          shipping_options: [
            {
              shipping_rate_data: {
                type: 'fixed_amount' as const,
                fixed_amount: {
                  amount: calculateShipping(bookQuantity, 'US') * 100,
                  currency: 'usd',
                },
                display_name: 'Ship to United States',
              },
            },
            {
              shipping_rate_data: {
                type: 'fixed_amount' as const,
                fixed_amount: {
                  amount: calculateShipping(bookQuantity, 'MX') * 100,
                  currency: 'usd',
                },
                display_name: 'Ship to Mexico',
              },
            },
          ],
        };

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: email,
      line_items: lineItems,
      ...shippingConfig,
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
