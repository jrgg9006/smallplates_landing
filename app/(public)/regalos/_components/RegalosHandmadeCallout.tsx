"use client";

import { motion } from "framer-motion";

export default function RegalosHandmadeCallout() {
  return (
    <motion.div
      className="mt-16 md:mt-24 grid grid-cols-1 lg:grid-cols-2 rounded-lg overflow-hidden"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.7, ease: "easeOut" }}
    >
      {/* Left Panel — Stitch Pattern Visual */}
      <div className="relative bg-brand-charcoal min-h-[280px] lg:min-h-[400px] flex items-center justify-center overflow-hidden">
        {/* Decorative stitch pattern */}
        <div className="flex flex-col items-center gap-0">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center">
              {/* Horizontal stitch line */}
              <div className="relative flex items-center">
                <div className="w-20 h-px bg-brand-honey/40" />
                <div className="absolute left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-brand-honey/50" />
              </div>
              {/* Vertical connector (except last) */}
              {i < 6 && (
                <div className="w-px h-2.5 bg-brand-honey/25" />
              )}
            </div>
          ))}
        </div>

        {/* Label */}
        <p className="absolute bottom-6 left-0 right-0 text-center font-serif italic text-white/20 text-sm tracking-wide">
          único
        </p>

        {/* Photo placeholder note */}
        <p className="absolute bottom-3 right-4 text-[10px] uppercase tracking-wider text-white/10">
          Foto: encuadernación de cerca
        </p>
      </div>

      {/* Right Panel — Text */}
      <div className="bg-brand-cream p-8 md:p-12 lg:p-16 flex flex-col justify-center">
        {/* Eyebrow */}
        <p className="type-eyebrow mb-4">
          Único
        </p>

        <h3 className="type-subheading mb-6">
          Cada libro es único.
        </h3>

        <div className="space-y-4">
          <p className="type-body-small text-brand-charcoal/80">
            Recetas distintas. Gente distinta. Historias distintas. Cada libro que hacemos existe una sola vez &mdash; porque la gente que vive adentro nunca es la misma dos veces.
          </p>

          <p className="type-body-small text-brand-charcoal/80">
            Sin plantillas. Sin contenido genérico. Cada libro se diseña, se acomoda y se imprime desde cero &mdash; alrededor de las recetas reales que la gente mandó.
          </p>
        </div>

        {/* Pull quote */}
        <blockquote className="mt-8 border-l-2 border-brand-honey pl-5">
          <p className="type-accent text-base md:text-lg text-brand-charcoal/70 leading-relaxed">
            &ldquo;No hay dos libros iguales &mdash; porque no hay dos parejas con la misma gente. Ese es el punto.&rdquo;
          </p>
        </blockquote>
      </div>
    </motion.div>
  );
}
