"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { trackEvent } from "@/lib/analytics";
import everyoneWhoShowedUpImage from "@/public/images/everyone_showedup/everyone_who_showed_up.png";
import { buildWhatsAppLink, WHATSAPP_MESSAGES } from "./whatsapp";

export default function RegalosTheSolution() {
  return (
    <section
      className="bg-white py-16 md:py-24 lg:py-32"
      aria-labelledby="solution-heading"
    >
      <div className="mx-auto max-w-7xl px-6 md:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          {/* Text Content */}
          <motion.div
            className="order-2 lg:order-1"
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            {/* Eyebrow */}
            <p className="type-eyebrow mb-4">
              Esto es Small Plates
            </p>

            {/* Headline */}
            <h2
              id="solution-heading"
              className="type-heading"
            >
              Un libro de cocina, hecho por la gente que los quiere.
            </h2>

            {/* Body copy */}
            <div className="mt-8 space-y-6">
              <p className="type-body">
                Cada persona cercana a los novios manda una receta — la que cocina los domingos, la que aprendió de su mamá, la que le sale mejor.
                <span className="block">Una nota corta. Una historia, si quiere.</span>
              </p>

              <p className="type-body">
                Nosotros las juntamos, las diseñamos y las imprimimos en un libro de tapa dura.
                <span className="block">Una sola copia para los novios. Copias adicionales para quien quiera tenerlo.</span>
              </p>

              <p className="type-accent">
                Ese libro va a vivir en su cocina. No en una caja.
              </p>
            </div>

            {/* CTA */}
            <motion.div
              className="mt-10"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <a
                href={buildWhatsAppLink(WHATSAPP_MESSAGES.solution)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackEvent("start_book_click", { cta_location: "regalos_solution_primary" })}
                className="btn btn-lg btn-honey"
                data-cta="regalos-solution-primary"
              >
                Hablemos por WhatsApp
              </a>
            </motion.div>
          </motion.div>

          {/* Image */}
          <motion.div
            className="order-1 lg:order-2"
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
          >
            <div className="relative aspect-[4/5] rounded-2xl overflow-hidden shadow-2xl bg-gray-200">
              <Image
                src={everyoneWhoShowedUpImage}
                alt="Un libro de cocina hecho por todos los que estuvieron"
                fill
                className="object-cover"
              />
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
