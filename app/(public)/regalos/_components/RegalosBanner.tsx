"use client";

import Image from "next/image";
import { trackEvent } from "@/lib/analytics";
import { buildWhatsAppLink, WHATSAPP_MESSAGES } from "./whatsapp";

export default function RegalosBanner() {
  return (
    <div className="absolute top-0 left-0 right-0 z-50">
      {/* Announcement bar */}
      <div className="py-2.5 text-center border-b border-white/20">
        <span className="font-sans text-[11px] font-medium tracking-[0.15em] uppercase text-white">
          ENVÍOS GRATIS A TODO MÉXICO.
        </span>
      </div>

      <header role="banner" aria-label="Top banner">
        <div className="mx-auto max-w-7xl px-6 md:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Image
              src="/images/SmallPlates_logo_horizontal.png"
              alt="Small Plates & Company"
              width={200}
              height={40}
              priority
              className="brightness-0 invert"
            />
          </div>

          {/* WhatsApp CTA */}
          <a
            href={buildWhatsAppLink(WHATSAPP_MESSAGES.banner)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackEvent("start_book_click", { cta_location: "regalos_banner" })}
            className="inline-flex items-center justify-center rounded-full px-5 py-2 text-sm font-semibold border border-white/60 text-white hover:bg-white/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2"
            data-cta="regalos-banner"
          >
            <span className="sm:hidden">WhatsApp</span>
            <span className="hidden sm:inline">Hablemos por WhatsApp</span>
          </a>
        </div>
      </header>
    </div>
  );
}
