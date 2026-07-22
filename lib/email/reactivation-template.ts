/**
 * Email HTML template — "Reactivation".
 *
 * Sent to someone who created an account, went through onboarding, and then never
 * did anything (0 recipes, 0 guests, never came back). A short note from Ana that
 * reminds them why they started and points them back to their book. Plain-letter
 * format, text-only, one CTA to the dashboard.
 */

import { buildPlainLetterHTML } from './plain-letter-template';

interface ReactivationEmailParams {
  organizerName: string;   // First name preferred, falls back to "there"
  bookLink: string;        // Link to their books dashboard
  unsubscribeUrl: string;  // /unsubscribe-profile page URL
}

export function buildReactivationSubject(): string {
  return 'The book you started';
}

export function buildReactivationHTML({
  organizerName,
  bookLink,
  unsubscribeUrl,
}: ReactivationEmailParams): string {
  return buildPlainLetterHTML({
    preheader:
      "Your book is right where you left it. Pick one person to ask first, and the rest usually follows.",
    bodyParagraphs: [
      `Hey ${organizerName},`,
      'You started a book here a little while ago.',
      "Worth remembering why it's a good idea: everyone you ask adds one recipe they actually cook, and it turns into a book that lives in your kitchen and gets used. You don't do it alone, and it doesn't take long.",
      'Your book is right where you left it. Pick one person to ask first. The rest usually follows.',
    ],
    button: { label: 'Open your book', url: bookLink },
    closingParagraphs: ["No rush. It'll be here when you're ready."],
    footerReason: "You're getting this because you started a book with us.",
    unsubscribeUrl,
  });
}
