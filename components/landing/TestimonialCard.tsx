"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";

export type Testimonial = {
  id: number;
  quote: string;
  author: string;
  descriptor: string;
  photo?: string;
};

const EASE_OUT_SPRING: [number, number, number, number] = [0.22, 1, 0.36, 1];

// Heroicons solid star (viewBox 0 0 24 24)
const STAR_PATH =
  "M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z";

function StarRow() {
  return (
    <div
      className="flex items-center gap-[3px] mb-4"
      role="img"
      aria-label="5 out of 5 stars"
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} width="12" height="12" viewBox="0 0 24 24" className="fill-brand-honey" aria-hidden="true">
          <path d={STAR_PATH} />
        </svg>
      ))}
    </div>
  );
}

// Shared content block — used by both card variants
function CardBody({ t }: { t: Testimonial }) {
  return (
    <div className="flex flex-col flex-1 px-6 py-6">
      <StarRow />
      <blockquote className="type-caption text-white/80 flex-1 leading-relaxed">
        {t.quote}
      </blockquote>
      <footer className="mt-5 pt-4 border-t border-white/[0.07]">
        <p className="type-eyebrow text-white/85">{t.author}</p>
        <p className="type-caption text-white/40 mt-1.5">{t.descriptor}</p>
      </footer>
    </div>
  );
}

export function TestimonialCard({ t }: { t: Testimonial }) {
  const reduced = useReducedMotion();

  const cardVariants = {
    hidden: { opacity: 0, y: reduced ? 0 : 28 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: reduced ? 0.15 : 0.65, ease: EASE_OUT_SPRING },
    },
  };

  if (t.photo) {
    // 2u — "open book": text left, photo right on desktop; photo top, text bottom on mobile
    return (
      <motion.article
        variants={cardVariants}
        className="
          flex-shrink-0 snap-start md:snap-align-none
          bg-brand-charcoal rounded-2xl overflow-hidden
          flex flex-col md:flex-row
          w-[85vw] md:w-[596px] md:h-[480px]
        "
      >
        {/* Photo — top on mobile (first in DOM), right on desktop (order-last) */}
        <div className="md:order-last relative h-[180px] md:h-full w-full md:w-1/2 flex-shrink-0 overflow-hidden">
          <Image
            src={t.photo}
            alt=""
            fill
            className="object-cover object-center"
            sizes="(max-width: 768px) 85vw, 298px"
          />
          {/* Vignette so the card edge reads as charcoal, not raw photo */}
          <div className="absolute inset-0 bg-black/20" />
        </div>

        {/* Text — bottom on mobile, left on desktop (order-first) */}
        <div className="md:order-first flex flex-col md:w-1/2 md:flex-shrink-0">
          <CardBody t={t} />
        </div>
      </motion.article>
    );
  }

  // 1u — text-only
  return (
    <motion.article
      variants={cardVariants}
      className="
        flex-shrink-0 snap-start md:snap-align-none
        bg-brand-charcoal rounded-2xl overflow-hidden
        flex flex-col
        w-[85vw] md:w-[288px] md:h-[480px]
      "
    >
      <CardBody t={t} />
    </motion.article>
  );
}
