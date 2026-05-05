/**
 * WhatsApp link builder for /regalos landing.
 *
 * Reason: Every CTA on /regalos opens a WhatsApp conversation with a
 * pre-filled message. The message varies by section so Ana Karen can
 * identify which part of the page hooked the lead.
 *
 * The phone number comes from NEXT_PUBLIC_WHATSAPP_NUMBER, the same env
 * var already used by components/landing/Footer.tsx.
 */

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '526142256589';

export const WHATSAPP_MESSAGES = {
  banner: 'Hola, vi su página y quisiera saber más sobre el libro.',
  hero: 'Hola, vi su página y quisiera saber más sobre el libro.',
  solution: 'Hola, me interesa saber cómo funciona el libro de recetas.',
  howItWorks: 'Hola, ya vi cómo funciona y me gustaría saber más.',
  personalNotes: 'Hola, me interesa el libro de recetas para los novios.',
  theBook: 'Hola, me gustaría ver más detalles del libro.',
  emotionalClose: 'Hola, me decidí. Quiero hacer un libro de recetas para los novios.',
  footer: 'Hola, vi su página y quisiera saber más sobre el libro.',
} as const;

export type WhatsAppMessageKey = keyof typeof WHATSAPP_MESSAGES;

export function buildWhatsAppLink(message: string): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
