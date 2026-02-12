/**
 * Product Tier Definitions
 * Centralized data for product tiers used across pricing page and onboarding
 */

export interface ProductTier {
  id: string;
  name: string;
  price: number;
  popular: boolean;
  features: string[];
  tagline: string;
}

export const productTiers: ProductTier[] = [
  {
    id: "the-book",
    name: "The Book",
    price: 169,
    popular: false,
    features: [
      "1 Premium Hardcover (8×10)",
      "Up to 72 recipes",
      "Professional design",
      "Full color throughout",
    ],
    tagline: "The gift. For the couple.",
  },
  {
    id: "family-collection",
    name: "The Family Collection",
    price: 279,
    popular: true,
    features: [
      "1 Premium Hardcover (8×10)",
      "2 Classic Hardcovers (6×9)",
      "Same recipes, same design",
      "Three books total",
    ],
    tagline: "One for them. One for each family.",
  },
  {
    id: "kitchen-table",
    name: "The Kitchen Table",
    price: 449,
    popular: false,
    features: [
      "1 Premium Hardcover (8×10)",
      "5 Classic Hardcovers (6×9)",
      "Same recipes, same design",
      "Six books total",
    ],
    tagline: "For the friends who made it happen.",
  },
];

/**
 * Get product tier by ID
 */
export function getProductTierById(id: string): ProductTier | undefined {
  return productTiers.find((tier) => tier.id === id);
}
