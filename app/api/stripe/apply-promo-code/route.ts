import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/client';
import { calculateSubtotal, calculateShipping } from '@/lib/stripe/pricing';
import Stripe from 'stripe';

interface ApplyPromoBody {
  paymentIntentId: string;
  clientSecret: string;
  promoCode: string;
  bookQuantity: number;
  userType: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: ApplyPromoBody = await request.json();
    const { paymentIntentId, clientSecret, promoCode, bookQuantity, userType } = body;

    if (!paymentIntentId || !clientSecret || bookQuantity == null) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Reason: Verify caller owns this PI by checking the client secret
    const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (pi.client_secret !== clientSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Reason: Only allow promo changes before payment is confirmed
    if (!['requires_payment_method', 'requires_confirmation'].includes(pi.status)) {
      return NextResponse.json({ error: 'Payment already in progress' }, { status: 400 });
    }

    const subtotal = calculateSubtotal(bookQuantity);
    const shipping = calculateShipping(bookQuantity, 'US');
    const originalTotal = subtotal + shipping;

    // Reason: Empty promoCode = remove discount, restore original amount
    if (!promoCode.trim()) {
      await stripe.paymentIntents.update(paymentIntentId, {
        amount: originalTotal * 100,
        metadata: {
          discount_code: '',
          discount_amount: '',
          promotion_code_id: '',
          coupon_id: '',
        },
      });

      return NextResponse.json({
        success: true,
        removed: true,
        newTotal: originalTotal,
        subtotal,
        shipping,
      });
    }

    // Validate the promotion code against Stripe
    const promoCodes = await stripe.promotionCodes.list({
      code: promoCode.trim(),
      active: true,
      limit: 1,
      expand: ['data.promotion.coupon'],
    });

    if (!promoCodes.data.length) {
      return NextResponse.json({ error: 'Invalid promotion code' }, { status: 400 });
    }

    const promotionCode = promoCodes.data[0];

    if (!promotionCode.active) {
      return NextResponse.json({ error: 'This promotion code is no longer active' }, { status: 400 });
    }

    if (promotionCode.expires_at && promotionCode.expires_at * 1000 < Date.now()) {
      return NextResponse.json({ error: 'This promotion code has expired' }, { status: 400 });
    }

    if (
      promotionCode.max_redemptions &&
      promotionCode.times_redeemed >= promotionCode.max_redemptions
    ) {
      return NextResponse.json({ error: 'This promotion code has been fully redeemed' }, { status: 400 });
    }

    // Reason: coupon lives under promotion.coupon, expanded via the list call
    const coupon = promotionCode.promotion.coupon as Stripe.Coupon;
    if (!coupon) {
      return NextResponse.json({ error: 'This promotion code has no associated discount' }, { status: 400 });
    }

    // Reason: Discount applies to subtotal only (book prices), not shipping
    let discountDollars = 0;
    if (coupon.percent_off) {
      discountDollars = Math.round(subtotal * coupon.percent_off / 100);
    } else if (coupon.amount_off) {
      // Reason: Stripe stores amount_off in cents
      discountDollars = Math.min(Math.round(coupon.amount_off / 100), subtotal);
    }

    if (discountDollars <= 0) {
      return NextResponse.json({ error: 'This promotion code does not apply to this order' }, { status: 400 });
    }

    const newTotal = Math.max(subtotal - discountDollars + shipping, 1);

    await stripe.paymentIntents.update(paymentIntentId, {
      amount: newTotal * 100,
      metadata: {
        discount_code: promoCode.trim().toUpperCase(),
        discount_amount: String(discountDollars * 100),
        promotion_code_id: promotionCode.id,
        coupon_id: coupon.id,
      },
    });

    return NextResponse.json({
      success: true,
      discountCode: promoCode.trim().toUpperCase(),
      discountAmount: discountDollars,
      discountPercent: coupon.percent_off || null,
      newTotal,
      subtotal,
      shipping,
    });
  } catch (err) {
    console.error('Error applying promo code:', err);
    return NextResponse.json(
      { error: 'Failed to apply promotion code' },
      { status: 500 }
    );
  }
}
