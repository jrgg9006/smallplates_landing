"use client";

import { useRef, type ReactNode } from "react";
import { motion, useInView } from "framer-motion";

const easeOut: [number, number, number, number] = [0.23, 1, 0.32, 1];

export interface JourneyStepData {
  number: string; // "01"
  title: string;
  description: string;
  cta?: { label: string; href: string };
}

export default function JourneyStep({
  step,
  index,
  visual,
}: {
  step: JourneyStepData;
  index: number;
  visual: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <div ref={ref} className="relative lg:pl-16">
      {/* dot sobre el riel del timeline (solo desktop) */}
      <div
        className="absolute left-0 top-1.5 hidden h-3.5 w-3.5 -translate-x-1/2 rounded-full bg-brand-honey ring-4 ring-brand-warm-white-warm lg:block"
        aria-hidden
      />

      <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-2 lg:gap-14">
        {/* texto (siempre a la izquierda, pegado al riel) */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: isInView ? 1 : 0, y: isInView ? 0 : 16 }}
          transition={{ duration: 0.5, delay: index * 0.05, ease: easeOut }}
        >
          <p className="type-eyebrow text-brand-honey">STEP {step.number}</p>
          <h3 className="type-subheading mt-3">{step.title}</h3>
          <p className="type-body-small mt-4 text-brand-charcoal/70">{step.description}</p>
          {step.cta && (
            <a
              href={step.cta.href}
              className="type-body-small mt-5 inline-flex items-center gap-1 text-brand-charcoal underline underline-offset-4 transition-colors hover:text-brand-honey"
            >
              {step.cta.label} <span aria-hidden>→</span>
            </a>
          )}
        </motion.div>

        {/* visual (siempre a la derecha) */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: isInView ? 1 : 0, y: isInView ? 0 : 24 }}
          transition={{ duration: 0.6, delay: index * 0.05 + 0.1, ease: easeOut }}
        >
          {visual}
        </motion.div>
      </div>
    </div>
  );
}
