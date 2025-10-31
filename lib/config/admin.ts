/**
 * Admin Configuration
 * Centralized list of admin emails
 */

export const ADMIN_EMAILS = [
  'team@smallplatesandcompany.com',
  // Add more admin emails here as needed
];

/**
 * Check if an email is an admin
 */
export function isAdminEmail(email?: string | null): boolean {
  return email ? ADMIN_EMAILS.includes(email) : false;
}

