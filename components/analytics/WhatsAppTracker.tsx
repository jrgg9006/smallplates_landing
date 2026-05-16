"use client";

import { useEffect } from "react";

type Landing = "regalos" | "regalos-usa";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
  }
}

export default function WhatsAppTracker({ landing }: { landing: Landing }) {
  useEffect(() => {
    const handler = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const link = target?.closest?.(
        "a[href^='https://wa.me/']",
      ) as HTMLAnchorElement | null;
      if (!link) return;
      // Reason: transport_type 'beacon' ensures the event reaches GA4 even if
      // the click navigates the current tab away (some CTAs lack target=_blank).
      window.gtag?.("event", "whatsapp_clicked", {
        landing,
        transport_type: "beacon",
      });
      window.fbq?.("track", "Contact", { landing });
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [landing]);

  return null;
}
