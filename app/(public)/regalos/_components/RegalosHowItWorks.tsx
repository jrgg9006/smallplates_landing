"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion, useInView } from "framer-motion";
import { trackEvent } from "@/lib/analytics";
import { buildWhatsAppLink, WHATSAPP_MESSAGES } from "./whatsapp";

const easeOut: [number, number, number, number] = [0.23, 1, 0.32, 1];

const steps = [
  {
    number: "01",
    title: "Nosotros le ayudamos a empezar.",
    description:
      "Hablamos por WhatsApp. Le damos acceso a la plataforma y le damos un link para que invite a la familia y a los amigos para enviar sus recetas.",
    image: "/images/HowitWorks_images/collect_iphone_mockup.png",
    imageAlt: "Invitación compartida por teléfono",
    imageClass: "object-cover",
    imageBg: "bg-brand-sand",
  },
  {
    number: "02",
    title: "Cada quien manda su receta.",
    description:
      "En cinco minutos, desde el celular. La receta, una foto si quiere, una nota corta para los novios. Nosotros nos encargamos de revisarlas, ordenarlas y diseñarlas.",
    image: "/images/HowitWorks_images/sucess_iphone_mockup.png",
    imageAlt: "Invitado mandando su receta",
    imageClass: "object-cover",
    imageBg: "bg-brand-sand",
  },
  {
    number: "03",
    title: "Llega a su casa.",
    description:
      "Un libro de tapa dura, a todo color, con todas las recetas reunidas en un solo lugar. Listo para regalarse el día de la boda — o cuando usted decida.",
    image: "/images/HowitWorks_images/book_in_hand_whitebackgound.png",
    imageAlt: "El libro de cocina terminado",
    imageClass: "object-cover",
    imageBg: "bg-brand-cream",
  },
] as const;

type Step = (typeof steps)[number];

function StepCard({ step, index }: { step: Step; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0 });

  return (
    <div>
      <motion.div
        ref={ref}
        className={`relative aspect-[4/5] rounded-xl overflow-hidden ${step.imageBg}`}
        initial={{ clipPath: "inset(0 0 100% 0)" }}
        animate={{ clipPath: isInView ? "inset(0 0 0% 0)" : "inset(0 0 100% 0)" }}
        transition={{ duration: 0.75, delay: index * 0.12, ease: easeOut }}
      >
        <Image
          src={step.image}
          alt={step.imageAlt}
          fill
          className={step.imageClass}
          sizes="(max-width: 768px) 100vw, 33vw"
          priority={index === 0}
        />
      </motion.div>

      <motion.div
        className="mt-6"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: isInView ? 1 : 0, y: isInView ? 0 : 8 }}
        transition={{ duration: 0.45, delay: index * 0.12 + 0.3, ease: easeOut }}
      >
        <p className="type-eyebrow mb-3">{step.number}</p>
        <h3 className="type-subheading mb-2">{step.title}</h3>
        <p className="type-body-small">{step.description}</p>
      </motion.div>
    </div>
  );
}

export default function RegalosHowItWorks() {
  return (
    <section
      id="how-it-works"
      className="bg-brand-warm-white-warm py-20 md:py-28"
      aria-labelledby="how-it-works-heading"
    >
      <div className="mx-auto max-w-6xl px-6 md:px-10">

        <motion.div
          className="text-center mb-14 md:mb-20"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5, ease: easeOut }}
        >
          <h2 id="how-it-works-heading" className="type-heading">
            Cómo funciona.
          </h2>
          <p className="mt-4 type-body text-brand-charcoal/60">
            Tres pasos. Lo demás lo hacemos nosotros.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-6 lg:gap-10 md:items-start">
          {steps.map((step, i) => (
            <StepCard key={step.number} step={step} index={i} />
          ))}
        </div>

        {/* Closing italic line */}
        <motion.p
          className="type-accent text-center mt-14 md:mt-20 text-brand-charcoal/70"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5, ease: easeOut }}
        >
          Sin formularios largos. Sin instalar nada.
        </motion.p>

        {/* WhatsApp CTA */}
        <div className="mt-14 md:mt-20 flex justify-center">
          <a
            href={buildWhatsAppLink(WHATSAPP_MESSAGES.howItWorks)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() =>
              trackEvent("start_book_click", { cta_location: "regalos_howitworks_primary" })
            }
            className="btn btn-lg btn-honey"
            data-cta="regalos-howitworks"
          >
            Hablemos por WhatsApp
          </a>
        </div>

      </div>
    </section>
  );
}
