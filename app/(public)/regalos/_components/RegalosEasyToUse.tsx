"use client";

import Image from "next/image";
import { motion } from "framer-motion";

const easeOut: [number, number, number, number] = [0.23, 1, 0.32, 1];

const pillars = [
  {
    image: "/images/regalo-usa-landing/sube_recetas_con_smartphone.png",
    imageAlt: "Tomando una foto a una receta escrita a mano con el celular",
    title: "Tómale una foto.",
    body:
      "Si la receta ya está escrita — en una libreta, en una tarjeta vieja, en una servilleta. La cámara del teléfono hace el resto.",
  },
  {
    image: "/images/regalo-usa-landing/sube_recetas_escribiendo_2.png",
    imageAlt: "Escribiendo una receta directamente en el teléfono",
    title: "O escríbela en el teléfono.",
    body:
      "Si solo la tienes en la cabeza. Sin app, sin instalar nada. Te llega un link por WhatsApp y se escribe ahí mismo.",
  },
] as const;

type Pillar = (typeof pillars)[number];

function PillarCard({ pillar, index }: { pillar: Pillar; index: number }) {
  return (
    <div>
      <motion.div
        className="relative aspect-[4/5] rounded-xl overflow-hidden bg-brand-sand"
        initial={{ clipPath: "inset(0 0 100% 0)" }}
        whileInView={{ clipPath: "inset(0 0 0% 0)" }}
        viewport={{ once: true, amount: 0 }}
        transition={{ duration: 0.75, delay: index * 0.12, ease: easeOut }}
      >
        <Image
          src={pillar.image}
          alt={pillar.imageAlt}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
          priority={index === 0}
          unoptimized
        />
      </motion.div>

      <motion.div
        className="mt-6"
        initial={{ opacity: 0, y: 8 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0 }}
        transition={{ duration: 0.45, delay: index * 0.12 + 0.3, ease: easeOut }}
      >
        <h3 className="type-subheading mb-2">{pillar.title}</h3>
        <p className="type-body-small">{pillar.body}</p>
      </motion.div>
    </div>
  );
}

export default function RegalosEasyToUse() {
  return (
    <section
      className="bg-brand-cream py-20 md:py-28"
      aria-labelledby="easy-to-use-heading"
    >
      <div className="mx-auto max-w-6xl px-6 md:px-10">

        <motion.div
          className="text-center mb-14 md:mb-20"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5, ease: easeOut }}
        >
          <h2 id="easy-to-use-heading" className="type-heading">
            Cero tecnología. En serio.
          </h2>
          <p className="mt-4 type-body text-brand-charcoal/60">
            Subir una receta toma cinco minutos. Dos formas, las dos fáciles.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-12 lg:gap-16 md:items-start max-w-4xl mx-auto">
          {pillars.map((pillar, i) => (
            <PillarCard key={pillar.title} pillar={pillar} index={i} />
          ))}
        </div>

        <motion.p
          className="type-accent text-center mt-14 md:mt-20 text-brand-charcoal/70"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5, ease: easeOut }}
        >
          Si te atoras, te contestamos por WhatsApp.
        </motion.p>

      </div>
    </section>
  );
}
