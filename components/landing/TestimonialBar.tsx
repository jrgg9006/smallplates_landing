"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";

/**
 * Lightweight trust bar that sits directly under the Hero — the first proof a
 * visitor sees. Three real customer messages (Spanish originals, translated to
 * English), each doing a distinct job:
 *  - the bride / receiver  → "it's beautiful, the receiver breaks down"
 *  - the organizer         → "even putting it together is emotional" (kills the
 *                             "is it worth the effort / will people join?" fear)
 *  - the anniversary gift  → proves it works beyond weddings (multi-occasion)
 *
 * Real screenshots (WhatsApp) live deeper down in TestimonialsSection. Names /
 * roles below are editable — confirm the organizer's name when available.
 */
type BarQuote = {
  quote: string;
  name: string;
  role: string;
};

const QUOTES: BarQuote[] = [
  {
    quote: "When we opened the book, I cried.",
    name: "Sophie",
    role: "the bride",
  },
  {
    quote: "I cried while putting everyone's recipes in.",
    name: "Katia",
    role: "the organizer",
  },
  {
    quote: "One of the most meaningful things we've done since our wedding.",
    name: "Donald C.",
    role: "anniversary gift",
  },
];

// Heroicons solid star — same path used by TestimonialCard for visual consistency.
const STAR_PATH =
  "M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z";

function Stars() {
  return (
    <div
      className="flex items-center gap-[2px]"
      role="img"
      aria-label="5 out of 5 stars"
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          width="10"
          height="10"
          viewBox="0 0 24 24"
          className="fill-brand-honey"
          aria-hidden="true"
        >
          <path d={STAR_PATH} />
        </svg>
      ))}
    </div>
  );
}

export default function TestimonialBar() {
  const reduced = useReducedMotion();

  return (
    <section
      aria-label="What people say"
      className="bg-brand-warm-white border-b border-brand-sand/60"
    >
      <div className="mx-auto max-w-6xl px-6 py-9 md:py-11">
        <div className="grid grid-cols-1 gap-y-10 md:grid-cols-3 md:gap-x-10 md:gap-y-0">
          {QUOTES.map((t, i) => (
            <motion.figure
              key={i}
              initial={{ opacity: 0, y: reduced ? 0 : 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{
                duration: reduced ? 0.15 : 0.55,
                delay: reduced ? 0 : i * 0.12,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="flex h-full flex-col items-center gap-5 px-4 text-center"
            >
              <Stars />
              {/* flex-1 centers the quote vertically so stars align at the top
                  and attributions at the bottom across all three columns */}
              <div className="flex flex-1 items-center">
                <blockquote className="type-accent text-2xl md:text-[1.75rem] max-w-[20rem] text-balance leading-snug">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>
              </div>
              <figcaption className="text-base">
                <span className="font-serif italic text-brand-charcoal">
                  {t.name}
                </span>
                <span className="font-serif italic text-[hsl(var(--brand-warm-gray))]">
                  , {t.role}
                </span>
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  );
}
