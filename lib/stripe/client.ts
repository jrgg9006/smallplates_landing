import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is required');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2026-02-25.clover',
  typescript: true,
});

// Re-export pricing functions for server-side use
export {
  BASE_BOOK_PRICE,
  ADDITIONAL_BOOK_PRICE,
  calculateShipping,
  calculateSubtotal,
  calculateTotal,
} from './pricing';
export type { ShippingCountry } from './pricing';
