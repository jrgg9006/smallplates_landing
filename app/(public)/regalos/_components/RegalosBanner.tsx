"use client";

import Image from "next/image";
import Link from "next/link";
import { buildWhatsAppLink, WHATSAPP_MESSAGES } from "./whatsapp";

export default function RegalosBanner() {
  return (
    <header className="bg-white border-b border-brand-sand">
      <div className="mx-auto max-w-7xl px-6 md:px-8 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/regalos" aria-label="Small Plates">
          <Image
            src="/images/SmallPlates_logo_horizontal.png"
            alt="Small Plates"
            width={140}
            height={32}
            priority
          />
        </Link>

        {/* WhatsApp CTA */}
        <a
          href={buildWhatsAppLink(WHATSAPP_MESSAGES.banner)}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-sm btn-honey whitespace-nowrap"
          data-cta="regalos-banner"
        >
          Hablemos por WhatsApp
        </a>
      </div>
    </header>
  );
}
