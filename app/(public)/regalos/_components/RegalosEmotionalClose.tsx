"use client";

import { motion } from "framer-motion";
import { trackEvent } from "@/lib/analytics";
import { buildWhatsAppLink, WHATSAPP_MESSAGES } from "./whatsapp";

export default function RegalosEmotionalClose() {
  return (
    <section
      className="bg-brand-charcoal py-24 md:py-32 lg:py-40"
      aria-labelledby="emotional-close-heading"
    >
      <div className="mx-auto max-w-3xl px-6 md:px-8 text-center">

        {/* The Vision — What this becomes */}
        <motion.div
          className="space-y-6 md:space-y-8"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <p
            id="emotional-close-heading"
            className="type-accent text-2xl sm:text-3xl md:text-4xl text-white/90 leading-relaxed font-light"
          >
            Dentro de diez años,
            <span className="block">va a abrir este libro un martes cualquiera.</span>
          </p>

          <p className="type-accent text-2xl sm:text-3xl md:text-4xl text-white/80 leading-relaxed font-light">
            Va a ver un nombre.
            <span className="block">Va a recordar una cara.</span>
            <span className="block">Va a cocinar algo que sabe a estar querido.</span>
          </p>
        </motion.div>

        {/* Visual break */}
        <motion.div
          className="my-12 md:my-16 flex justify-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="w-12 h-px bg-white/20"></div>
        </motion.div>

        {/* The Reframe */}
        <motion.p
          className="type-accent text-xl sm:text-2xl md:text-3xl text-white/70 leading-relaxed font-light"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.4, ease: "easeOut" }}
        >
          Eso es lo que les está regalando.
          <span className="block mt-2">No un regalo.</span>
          <span className="block">Una cocina llena de gente.</span>
        </motion.p>

        {/* The Brand Line */}
        <motion.p
          className="mt-16 md:mt-20 type-heading text-brand-honey italic"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
        >
          Sigue en la mesa.
        </motion.p>

        {/* Final CTA */}
        <motion.div
          className="mt-12 md:mt-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.8, ease: "easeOut" }}
        >
          <a
            href={buildWhatsAppLink(WHATSAPP_MESSAGES.emotionalClose)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackEvent('start_book_click', { cta_location: 'regalos_emotional_close_primary' })}
            className="btn btn-lg btn-honey"
            data-cta="regalos-emotional-close"
          >
            Hablemos por WhatsApp
          </a>
        </motion.div>

      </div>
    </section>
  );
}
