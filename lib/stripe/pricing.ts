/**
 * Pricing constants and calculators.
 * Shared between client and server — no Stripe SDK dependency.
 */

export const BASE_BOOK_PRICE = 169;

/**
 * Flat per-copy price for the LEGACY upfront model and the post-close "extra
 * copies" flows (dashboard + public /copy link). Those are standalone, late,
 * separately-shipped copies — not the primary group order, so they keep a flat
 * price. The primary group order uses the declining schedule below.
 */
export const ADDITIONAL_BOOK_PRICE = 129;

/**
 * Per-person price for the PRIMARY group order, by number of copies. The product
 * is bought as a group gift: everyone who chips in keeps an identical copy, so we
 * price PER PERSON and the total is simply price × copies.
 *
 * Reason: keeping per-person a whole number means it splits cleanly (no cents)
 * and `total === perPerson × copies` always reconciles — what you see is exactly
 * what each person puts in. Per-person drops as the group grows (lower marginal
 * cost; shipping shared to one address) and flattens at the $89 floor from the
 * 6th copy on — every copy beyond 6 is $89.
 */
const PER_PERSON_PRICE: Record<number, number> = {
  1: 169, 2: 129, 3: 113, 4: 103, 5: 95,
  6: 89, 7: 89, 8: 89, 9: 89, 10: 89,
};

/** Per-person price beyond the published table (defensive; the order flow caps
 *  quantity at 10). The flat floor — every copy past 6 costs this. */
const PER_PERSON_FLOOR = 89;

/**
 * Minimum number of recipes a book must have before it can be closed and sent
 * to print. Gates the quantity + checkout steps of the book-review flow (client
 * side) and is re-validated server-side in create-checkout-book-close-session.
 */
export const MIN_RECIPES_TO_PRINT = 25;

/**
 * Flat shipping cost applied to every extra_copy order placed from
 * the dashboard (post-close "Get more copies" flow). Different from
 * the upsell-during-close flow where shipping is included in the
 * main book's package.
 */
export const EXTRA_COPIES_SHIPPING_COST = 14;

/**
 * Per-person price for `totalBooks` copies — the "per person" number shown next
 * to the total so the group buyer sees exactly their own share (a whole number).
 */
export function pricePerCopy(totalBooks: number): number {
  if (totalBooks <= 0) return 0;
  return PER_PERSON_PRICE[totalBooks] ?? PER_PERSON_FLOOR;
}

/**
 * Total price of the primary group order for `totalBooks` copies. Simply
 * per-person × copies, so the total always reconciles with the per-person number.
 */
export function calculateSubtotal(totalBooks: number): number {
  if (totalBooks <= 0) return 0;
  return pricePerCopy(totalBooks) * totalBooks;
}

/**
 * Amount for everything beyond the base book. We send this to Stripe as a SINGLE
 * "additional copies" line item (the per-copy price varies, so it can't be a
 * quantity × unit_amount line) — keeping what we charge identical to what
 * `calculateSubtotal` displays.
 */
export function calculateExtrasAmount(totalBooks: number): number {
  return Math.max(0, calculateSubtotal(totalBooks) - BASE_BOOK_PRICE);
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
