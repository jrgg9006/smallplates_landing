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

export type ShippingCountry = 'US' | 'MX';

/**
 * Shipping is included in the book price. Function is kept so callers still type-check;
 * it always returns 0. Remove callers when convenient.
 */
export function calculateShipping(_totalBooks: number, _country: ShippingCountry): number {
  return 0;
}

export function calculateSubtotal(totalBooks: number): number {
  if (totalBooks <= 0) return 0;
  return BASE_BOOK_PRICE + Math.max(0, totalBooks - 1) * ADDITIONAL_BOOK_PRICE;
}

export function calculateTotal(totalBooks: number, country: ShippingCountry): number {
  return calculateSubtotal(totalBooks) + calculateShipping(totalBooks, country);
}
