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
