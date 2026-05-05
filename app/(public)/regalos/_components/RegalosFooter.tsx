"use client";

import Image from "next/image";
import Link from "next/link";
import { buildWhatsAppLink, WHATSAPP_MESSAGES } from "./whatsapp";

export default function RegalosFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-brand-warm-white-warm py-12 md:py-16">
      <div className="mx-auto max-w-3xl px-6 md:px-8 text-center">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <Image
            src="/images/SmallPlates_logo_horizontal.png"
            alt="Small Plates"
            width={160}
            height={36}
          />
        </div>

        {/* Tagline (brand line) */}
        <p className="type-accent text-brand-charcoal/80 mb-8">
          Sigue en la mesa.
        </p>

        {/* WhatsApp CTA */}
        <a
          href={buildWhatsAppLink(WHATSAPP_MESSAGES.footer)}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-sm btn-honey inline-block mb-10"
          data-cta="regalos-footer"
        >
          Hablemos por WhatsApp →
        </a>

        {/* Legal */}
        <p className="type-caption text-brand-charcoal/40">
          {currentYear} Small Plates & Co. ·{" "}
          <Link href="/privacy" className="hover:text-brand-honey transition-colors">
            Privacy Policy
          </Link>{" "}
          ·{" "}
          <Link href="/terms" className="hover:text-brand-honey transition-colors">
            Terms
          </Link>
        </p>
      </div>
    </footer>
  );
}
