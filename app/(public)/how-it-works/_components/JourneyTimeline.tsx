"use client";

import { useRef, type ReactNode } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import JourneyStep, { type JourneyStepData } from "./JourneyStep";

// Timeline con una línea de progreso "que te sigue": un riel claro estático y,
// encima, un riel honey que se llena de arriba hacia abajo según el scroll
// (estilo Remento). Solo visible en desktop, donde el riel vive a la izquierda.
export default function JourneyTimeline({
  steps,
  visuals,
}: {
  steps: JourneyStepData[];
  visuals: ReactNode[];
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.35", "end 0.65"],
  });
  const scaleY = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <div ref={ref} className="relative">
      {/* riel claro estático */}
      <div
        className="absolute left-0 top-1.5 bottom-1.5 hidden w-[2px] rounded-full bg-brand-charcoal/12 lg:block"
        aria-hidden
      />
      {/* riel de progreso que sigue el scroll */}
      <motion.div
        className="absolute left-0 top-1.5 bottom-1.5 hidden w-[2px] origin-top rounded-full bg-brand-honey lg:block"
        style={{ scaleY }}
        aria-hidden
      />

      <div className="space-y-20 md:space-y-28">
        {steps.map((step, i) => (
          <JourneyStep key={step.number} step={step} index={i} visual={visuals[i]} />
        ))}
      </div>
    </div>
  );
}
