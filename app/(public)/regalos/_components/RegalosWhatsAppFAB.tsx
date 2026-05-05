"use client";

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { trackEvent } from "@/lib/analytics";
import { buildWhatsAppLink, WHATSAPP_MESSAGES } from "./whatsapp";

const WA_URL = buildWhatsAppLink(WHATSAPP_MESSAGES.fab);
const SESSION_KEY = "sp_wa_bubble_seen_regalos";

function WhatsAppIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className="shrink-0"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  );
}

export default function RegalosWhatsAppFAB() {
  const [showBubble, setShowBubble] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY)) return;

    const show = setTimeout(() => {
      setShowBubble(true);
      sessionStorage.setItem(SESSION_KEY, "1");
    }, 3000);

    return () => clearTimeout(show);
  }, []);

  useEffect(() => {
    if (!showBubble) return;
    const hide = setTimeout(() => setShowBubble(false), 5000);
    return () => clearTimeout(hide);
  }, [showBubble]);

  return (
    <>
      <AnimatePresence>
        {showBubble && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-20 right-6 z-50"
            style={{ filter: "drop-shadow(0 4px 12px rgba(45,45,45,0.13))" }}
          >
            <div className="relative bg-white rounded-xl px-3.5 py-2.5 max-w-[190px]">
              <button
                onClick={() => setShowBubble(false)}
                aria-label="Cerrar"
                className="absolute top-2 right-2 text-brand-warm-gray hover:text-brand-charcoal transition-colors"
              >
                <svg width="8" height="8" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                  <path d="M9 1L1 9M1 1L9 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
              <p className="text-[12px] font-normal leading-[1.4] text-brand-charcoal pr-3">
                ¿Dudas? Estamos aquí.
              </p>
              {/* Tail pointing toward the FAB below */}
              <div className="absolute -bottom-[7px] right-7 w-3.5 h-3.5 bg-white rotate-45" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.a
        href={WA_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Escríbenos por WhatsApp"
        onClick={() => trackEvent("start_book_click", { cta_location: "regalos_fab" })}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1], delay: 0.5 }}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-full bg-brand-charcoal px-4 py-3 text-white shadow-[0_4px_20px_rgba(45,45,45,0.18)] hover:bg-brand-charcoal-deep transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-honey focus-visible:ring-offset-2"
      >
        <span className="relative flex h-2 w-2 shrink-0">
          <span
            className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-honey opacity-60"
            style={{ animationDuration: "2s" }}
          />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-honey" />
        </span>
        <WhatsAppIcon size={18} />
        <span className="hidden md:inline text-[11px] font-medium tracking-[0.1em] uppercase leading-none">
          Escríbenos
        </span>
      </motion.a>
    </>
  );
}
