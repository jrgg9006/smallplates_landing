/**
 * WhatsApp link builder for /regalos-usa landing (mamá hispana en EE.UU.).
 *
 * Reason: Every CTA on /regalos-usa opens a WhatsApp conversation with a
 * pre-filled message. Each message is tagged with [USA] so Ana Karen can
 * distinguish leads from this audience vs the /regalos (México) audience
 * the moment the conversation opens.
 *
 * The phone number comes from NEXT_PUBLIC_WHATSAPP_NUMBER, the same env
 * var already used by /regalos and components/landing/Footer.tsx.
 */

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '526142256589';

export const WHATSAPP_MESSAGES = {
  banner: '[USA] Hola, vi su página y quisiera saber más sobre el libro.',
  hero: '[USA] Hola, vi su página y quisiera saber más sobre el libro.',
  solution: '[USA] Hola, me interesa saber cómo funciona el libro de recetas.',
  howItWorks: '[USA] Hola, ya vi cómo funciona y me gustaría saber más.',
  personalNotes: '[USA] Hola, me interesa el libro de recetas para los novios.',
  theBook: '[USA] Hola, me gustaría ver más detalles del libro.',
  emotionalClose: '[USA] Hola, me decidí. Quiero hacer un libro de recetas para los novios.',
  footer: '[USA] Hola, vi su página y quisiera saber más sobre el libro.',
  fab: '[USA] Hola, tengo una pregunta sobre el libro de recetas.',
} as const;

export type WhatsAppMessageKey = keyof typeof WHATSAPP_MESSAGES;

export function buildWhatsAppLink(message: string): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
