/**
 * WhatsApp link builder for /from-the-book landing.
 *
 * Reason: scanner del QR del libro físico ya vio el producto y entra con
 * intención. Mensaje pre-cargado distinto al genérico para que en el inbox
 * de WhatsApp se distinga este origen.
 */

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '526142256589';

export const WHATSAPP_MESSAGES = {
  fromTheBook: 'Hi — I just saw a Small Plates book at a wedding. How do I make one?',
} as const;

export function buildWhatsAppLink(message: string): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
