/**
 * Feature flags for the application
 * Enable/disable features without code changes
 */
export const FEATURES = {
  // Payment & Profile Creation
  ENABLE_PAYMENT_FLOW: false, // Set to true when ready to accept payments
  
  // Waitlist mode (temporary)
  WAITLIST_MODE: true,
} as const;

export const ROUTES = {
  AFTER_ONBOARDING: FEATURES.WAITLIST_MODE ? '/' : '/profile/groups',
} as const;

