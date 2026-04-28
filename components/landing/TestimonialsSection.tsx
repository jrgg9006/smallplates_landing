"use client";

import { motion } from "framer-motion";
import { useRef, useState, useEffect, useCallback } from "react";
import { TestimonialCard, type Testimonial } from "@/components/landing/TestimonialCard";

// One scroll step = 1u card + gap (288 + 20 = 308px)
const UNIT = 308;

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1 },
  },
};

// Cards 1 (Sarah K.) and 5 (David R.) are 2u — photo placeholders until real shots arrive
const testimonials: Testimonial[] = [
  {
    id: 1,
    quote:
      "We had 74 guests submit a recipe. I didn't chase a single one. The book arrived and my sister opened it on the front step.",
    author: "Sarah K.",
    descriptor: "Sister of the bride — Austin, TX",
    photo: "/images/notes_section/grandmas_tatis.jpg",
  },
  {
    id: 2,
    quote:
      "I gave it as a gift. Six months later he texted me a photo of pasta stains on page 34. Best review I've ever gotten.",
    author: "Marcus T.",
    descriptor: "Gift-giver — Brooklyn, NY",
  },
  {
    id: 3,
    quote:
      "The book came out better than I expected. Which is saying something because I expected a lot.",
    author: "Ana L.",
    descriptor: "Mother of the bride — Miami, FL",
  },
  {
    id: 4,
    quote:
      "Guests who said they don't cook submitted the best notes. One wrote three paragraphs about frozen pizza. It's in the book. It's everyone's favorite page.",
    author: "Jamie & Chris",
    descriptor: "Married November 2024",
  },
  {
    id: 5,
    quote:
      "We put it on the registry. 47 people contributed. The book had 80 recipes. My wife uses it every week.",
    author: "David R.",
    descriptor: "Groom — Chicago, IL",
    photo: "/images/notes_section/grandmas_tatis.jpg",
  },
];

function ChevronLeft() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10 12L6 8L10 4" />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 4L10 8L6 12" />
    </svg>
  );
}

export default function TestimonialsSection() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [prevDisabled, setPrevDisabled] = useState(true);
  const [nextDisabled, setNextDisabled] = useState(false);

  const syncArrows = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setPrevDisabled(el.scrollLeft <= 0);
    setNextDisabled(el.scrollLeft >= el.scrollWidth - el.clientWidth - 1);
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    syncArrows(); // initial state
    el.addEventListener("scroll", syncArrows, { passive: true });
    window.addEventListener("resize", syncArrows);
    return () => {
      el.removeEventListener("scroll", syncArrows);
      window.removeEventListener("resize", syncArrows);
    };
  }, [syncArrows]);

  const scroll = useCallback((dir: 1 | -1) => {
    trackRef.current?.scrollBy({ left: dir * UNIT, behavior: "smooth" });
  }, []);

  return (
    <section
      className="bg-[#FAF7F2] pt-10 md:pt-14 pb-20 md:pb-28"
      aria-labelledby="testimonials-heading"
    >
      <div className="mx-auto max-w-7xl px-6 md:px-8">

        {/* ── Header + arrows ── */}
        <motion.div
          className="flex items-end justify-between mb-12 md:mb-14"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <div>
            <p className="type-eyebrow mb-4">PEOPLE WHO GOT THE BOOK</p>
            <h2 id="testimonials-heading" className="type-heading">
              What happens after the book arrives.
            </h2>
          </div>

          {/* Navigation arrows — desktop only */}
          <div className="hidden md:flex items-center gap-2 pb-1 flex-shrink-0">
            <button
              onClick={() => scroll(-1)}
              disabled={prevDisabled}
              aria-label="Previous testimonials"
              className="
                w-10 h-10 rounded-full flex items-center justify-center
                border border-brand-charcoal/20 text-brand-charcoal
                hover:bg-brand-charcoal hover:text-white hover:border-brand-charcoal
                transition-colors duration-200
                disabled:opacity-[35%] disabled:pointer-events-none
              "
            >
              <ChevronLeft />
            </button>
            <button
              onClick={() => scroll(1)}
              disabled={nextDisabled}
              aria-label="Next testimonials"
              className="
                w-10 h-10 rounded-full flex items-center justify-center
                border border-brand-charcoal/20 text-brand-charcoal
                hover:bg-brand-charcoal hover:text-white hover:border-brand-charcoal
                transition-colors duration-200
                disabled:opacity-[35%] disabled:pointer-events-none
              "
            >
              <ChevronRight />
            </button>
          </div>
        </motion.div>

        {/* ── Track ──
            Mobile: native scroll + snap.
            Desktop: same container — arrows call scrollBy(UNIT). */}
        <div
          ref={trackRef}
          className="overflow-x-auto -mx-6 px-6 md:-mx-8 md:px-8 no-scrollbar snap-x snap-mandatory md:snap-none"
        >
          <motion.div
            className="flex gap-4 md:gap-5 w-max"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
          >
            {testimonials.map((t) => (
              <TestimonialCard key={t.id} t={t} />
            ))}
          </motion.div>
        </div>

      </div>
    </section>
  );
}
