/**
 * Gumroad Payment Integration
 * Placeholder implementation for generating Gumroad payment links
 */

export interface GumroadMetadata {
  email: string;
  userType: "couple" | "gift_giver";
  coupleNames?: {
    brideFirstName?: string;
    brideLastName?: string;
    partnerFirstName?: string;
    partnerLastName?: string;
  };
  giftGiverName?: string;
  weddingDate?: string;
  guestCount?: string;
  planningStage?: string;
  timeline?: string;
  relationship?: string;
  // Reason: When set, webhook should add book to existing user instead of creating new account
  existingUserId?: string;
}

/**
 * Generate Gumroad payment link for a product tier
 * 
 * @param productTierId - The ID of the selected product tier
 * @param metadata - Additional metadata to pass to Gumroad
 * @returns Gumroad payment URL (placeholder for now)
 */
export function generateGumroadLink(
  productTierId: string,
  metadata: GumroadMetadata
): string {
  // Map product tier IDs to Gumroad product IDs
  // TODO: Replace with actual Gumroad product IDs once products are created
  const gumroadProductIds: Record<string, string> = {
    "the-book": "the-book-placeholder",
    "family-collection": "family-collection-placeholder",
    "kitchen-table": "kitchen-table-placeholder",
  };

  const productId = gumroadProductIds[productTierId] || "default-product";

  // Encode metadata as URL parameters
  const params = new URLSearchParams();
  params.append("email", metadata.email);
  params.append("user_type", metadata.userType);
  
  if (metadata.coupleNames) {
    if (metadata.coupleNames.brideFirstName) {
      params.append("bride_first_name", metadata.coupleNames.brideFirstName);
    }
    if (metadata.coupleNames.brideLastName) {
      params.append("bride_last_name", metadata.coupleNames.brideLastName);
    }
    if (metadata.coupleNames.partnerFirstName) {
      params.append("partner_first_name", metadata.coupleNames.partnerFirstName);
    }
    if (metadata.coupleNames.partnerLastName) {
      params.append("partner_last_name", metadata.coupleNames.partnerLastName);
    }
  }

  if (metadata.giftGiverName) {
    params.append("gift_giver_name", metadata.giftGiverName);
  }
  if (metadata.weddingDate) {
    params.append("wedding_date", metadata.weddingDate);
  }
  if (metadata.guestCount) {
    params.append("guest_count", metadata.guestCount);
  }
  if (metadata.planningStage) {
    params.append("planning_stage", metadata.planningStage);
  }
  if (metadata.timeline) {
    params.append("timeline", metadata.timeline);
  }
  if (metadata.relationship) {
    params.append("relationship", metadata.relationship);
  }
  if (metadata.existingUserId) {
    params.append("existing_user_id", metadata.existingUserId);
  }

  // Generate Gumroad link
  // Format: https://gumroad.com/l/{product-id}?{params}
  const baseUrl = "https://gumroad.com/l";
  return `${baseUrl}/${productId}?${params.toString()}`;
}

/**
 * Extract metadata from Gumroad callback/webhook
 * (To be implemented when webhook is set up)
 */
export function parseGumroadMetadata(params: URLSearchParams): GumroadMetadata | null {
  // TODO: Implement when webhook is ready
  return null;
}
