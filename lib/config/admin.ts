/**
 * Admin Configuration
 * Centralized list of admin emails
 */

export const ADMIN_EMAILS = [
  'team@smallplatesandcompany.com',
  // Add more admin emails here as needed
];

// Reason: Founders who can create comped (free) books from the admin panel
export const COMPED_EMAILS = [
  'team@smallplatesandcompany.com',
  'jrgg90@gmail.com',
  'anakaren.orozcov@gmail.com',
];

/**
 * Check if an email is an admin
 */
export function isAdminEmail(email?: string | null): boolean {
  return email ? ADMIN_EMAILS.includes(email) : false;
}

/**
 * Check if an email can create comped (free) books
 */
export function canCreateCompedBooks(email?: string | null): boolean {
  return email ? COMPED_EMAILS.includes(email) : false;
}

