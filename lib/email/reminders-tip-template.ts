/**
 * Email HTML template — "Reminders tool tip".
 *
 * A founder tip from Ana, sent to the organizer of an active book who has never
 * used the Send Reminders tool. Goal: make them aware the tool exists so they stop
 * chasing guests one by one and collect more recipes. Uses the plain-letter format
 * (looks written, not designed): logo top-left, plain copy, a clean screenshot, one
 * button straight to the tool.
 */

import { buildPlainLetterHTML } from './plain-letter-template';

// Reason: hosted absolute URL — emails can't reach relative paths. The PNG lives in
// public/images/email/. Drop in the real screenshot at this path and it renders.
export const REMINDERS_TOOL_SCREENSHOT_URL =
  'https://smallplatesandcompany.com/images/email/reminders-tool.png';

interface RemindersTipEmailParams {
  organizerName: string;   // First name preferred, falls back to "there"
  toolLink: string;        // Deep link to the Send Reminders tool
  unsubscribeUrl: string;  // /unsubscribe-profile page URL
  screenshotUrl?: string;  // Override the default screenshot (e.g. for local preview)
}

export function buildRemindersTipSubject(): string {
  return 'Send reminders in one click';
}

export function buildRemindersTipHTML({
  organizerName,
  toolLink,
  unsubscribeUrl,
  screenshotUrl = REMINDERS_TOOL_SCREENSHOT_URL,
}: RemindersTipEmailParams): string {
  return buildPlainLetterHTML({
    preheader:
      "There's a tool in your dashboard that emails the people who haven't sent a recipe yet, with your name on it.",
    bodyParagraphs: [
      `Hey ${organizerName},`,
      'Quick founder tip.',
      "There's a tool in your dashboard that does the chasing for you. You pick who hasn't sent a recipe yet, and it emails them the link with your name on it. About a minute.",
    ],
    image: {
      url: screenshotUrl,
      alt: 'The Send Reminders tool in your dashboard',
      href: toolLink,
    },
    button: { label: 'Open Send Reminders', url: toolLink },
    closingParagraphs: ["Most people don't know it's there. Now you do."],
    footerReason: "You're getting this because you're organizing a book.",
    unsubscribeUrl,
  });
}
