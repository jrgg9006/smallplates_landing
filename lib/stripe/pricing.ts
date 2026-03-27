/**
 * Pricing constants and calculators.
 * Shared between client and server — no Stripe SDK dependency.
 */

export const BASE_BOOK_PRICE = 169;
export const ADDITIONAL_BOOK_PRICE = 119;

export type ShippingCountry = 'US' | 'MX';

/**
 * Calculate shipping cost based on total books and country.
 * Tiers: 1 book, 2-3 books, 4-6 books. For 7+, multiply 4-6 rate by ceil(totalBooks/6).
 */
export function calculateShipping(totalBooks: number, country: ShippingCountry): number {
  const rates: Record<ShippingCountry, [number, number, number]> = {
    US: [15, 20, 28],
    MX: [35, 45, 60],
  };

  const [rate1, rate2to3, rate4to6] = rates[country];

  if (totalBooks <= 0) return 0;
  if (totalBooks === 1) return rate1;
  if (totalBooks <= 3) return rate2to3;
  if (totalBooks <= 6) return rate4to6;

  // 7+ books: multiply the 4-6 rate by ceil(totalBooks/6)
  return rate4to6 * Math.ceil(totalBooks / 6);
}

export function calculateSubtotal(totalBooks: number): number {
  if (totalBooks <= 0) return 0;
  return BASE_BOOK_PRICE + Math.max(0, totalBooks - 1) * ADDITIONAL_BOOK_PRICE;
}

export function calculateTotal(totalBooks: number, country: ShippingCountry): number {
  return calculateSubtotal(totalBooks) + calculateShipping(totalBooks, country);
}
