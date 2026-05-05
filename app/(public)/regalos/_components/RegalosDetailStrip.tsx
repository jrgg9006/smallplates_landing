"use client";

import { motion } from "framer-motion";

const details = [
  {
    title: "El acabado.",
    description:
      "Tapa dura mate suave. Elegante, resistente, diseñada para envejecer bien.",
    visual: (
      // Reason: Subtle gradient simulating matte surface with light reflection
      <div className="relative w-full aspect-square rounded-md overflow-hidden bg-gradient-to-br from-brand-cream via-[#EDE8E0] to-brand-sand">
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(135deg, transparent 40%, rgba(255,255,255,0.4) 50%, transparent 60%)",
          }}
        />
        <span className="absolute bottom-3 left-3 text-[10px] uppercase tracking-wider text-brand-charcoal/20 font-sans">
          Superficie mate
        </span>
      </div>
    ),
  },
  {
    title: "El papel.",
    description:
      "Couché de 150 gramos. Grueso, suave, hecho para sostener color vivo y aguantar la cocina.",
    visual: (
      // Reason: Abstract page representation with text-like lines
      <div className="relative w-full aspect-square rounded-md overflow-hidden bg-brand-cream flex items-center justify-center">
        <div className="w-3/5 space-y-2">
          <div className="w-10 h-12 bg-white border border-brand-sand rounded-sm mx-auto shadow-sm" />
          <div className="space-y-1.5 mt-3">
            <div className="h-px bg-brand-charcoal/15 w-full" />
            <div className="h-px bg-brand-charcoal/15 w-4/5" />
            <div className="h-px bg-brand-charcoal/15 w-3/5" />
            <div className="h-px bg-brand-charcoal/15 w-4/5" />
          </div>
        </div>
      </div>
    ),
  },
  {
    title: "El color.",
    description:
      "A todo color, de principio a fin. Cada receta, cada foto, cada página — vivos y ricos.",
    visual: (
      // Reason: 2x2 color swatches showing palette range
      <div className="relative w-full aspect-square rounded-md overflow-hidden bg-brand-cream flex items-center justify-center">
        <div className="grid grid-cols-2 gap-2 w-3/5">
          <div className="aspect-square rounded-sm bg-brand-terracotta" />
          <div className="aspect-square rounded-sm bg-brand-honey" />
          <div className="aspect-square rounded-sm bg-[hsl(var(--brand-olive))]" />
          <div className="aspect-square rounded-sm bg-brand-charcoal" />
        </div>
      </div>
    ),
  },
  {
    title: "El tamaño.",
    description:
      "Tamaño carta. Grande para cocinar con él cómodamente. Imponente en cualquier repisa.",
    visual: (
      // Reason: Outlined rectangle showing 8x10 aspect ratio with dimension labels
      <div className="relative w-full aspect-square rounded-md overflow-hidden bg-brand-cream flex items-center justify-center">
        <div className="relative" style={{ width: "55%", aspectRatio: "8/10" }}>
          <div className="w-full h-full border-2 border-dashed border-brand-charcoal/20 rounded-sm flex items-center justify-center">
            <span className="font-sans text-sm text-brand-charcoal/30 font-medium">
              8 &times; 10
            </span>
          </div>
          {/* Dimension labels */}
          <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[10px] text-brand-charcoal/25 font-sans">
            8&quot;
          </span>
          <span className="absolute top-1/2 -right-5 -translate-y-1/2 text-[10px] text-brand-charcoal/25 font-sans rotate-90">
            10&quot;
          </span>
        </div>
      </div>
    ),
  },
];

export default function RegalosDetailStrip() {
  return (
    <div className="mt-16 md:mt-24 grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
      {details.map((detail, index) => (
        <motion.div
          key={detail.title}
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5, delay: index * 0.08 }}
        >
          {detail.visual}
          <h4 className="type-subheading text-base md:text-lg mt-4 mb-1">
            {detail.title}
          </h4>
          <p className="type-caption text-brand-charcoal/60">
            {detail.description}
          </p>
        </motion.div>
      ))}
    </div>
  );
}
