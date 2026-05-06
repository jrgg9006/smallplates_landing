/**
 * Pricing constants and calculators.
 * Shared between client and server — no Stripe SDK dependency.
 */

export const BASE_BOOK_PRICE = 169;
export const ADDITIONAL_BOOK_PRICE = 129;

/**
 * Flat shipping cost applied to every extra_copy order placed from
 * the dashboard (post-close "Get more copies" flow). Different from
 * the upsell-during-close flow where shipping is included in the
 * main book's package.
 */
export const EXTRA_COPIES_SHIPPING_COST = 14;

export function calculateSubtotal(totalBooks: number): number {
  if (totalBooks <= 0) return 0;
  return BASE_BOOK_PRICE + Math.max(0, totalBooks - 1) * ADDITIONAL_BOOK_PRICE;
}

/**
 * Discount auto-applied for traffic that comes from the QR code printed in
 * the back of the physical book (utm_source=book).
 *
 * IMPORTANT: This must match the BOOK15 coupon configured in Stripe Dashboard.
 * If you change the percent here, update the coupon in Stripe too — and vice
 * versa. The code path that applies the coupon server-side lives in
 * `app/api/stripe/create-checkout-session/route.ts` (FROM_BOOK_COUPON_ID).
 */
export const FROM_BOOK_DISCOUNT_PERCENT = 15;

/**
 * Returns the discount amount in dollars given a subtotal and a percent-off.
 * Reason: Stripe rounds half-up at the cent level. We mirror that to keep the
 * order summary identical to what Stripe Checkout will show.
 */
export function calculateDiscount(subtotal: number, percentOff: number): number {
  if (subtotal <= 0 || percentOff <= 0) return 0;
  return Math.round(subtotal * percentOff) / 100;
}
