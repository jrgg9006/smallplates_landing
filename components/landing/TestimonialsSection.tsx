"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useRef, useState, useEffect, useCallback } from "react";
import { TestimonialCard, type Testimonial } from "@/components/landing/TestimonialCard";

// One scroll step = 1u card + gap (288 + 20 = 308px)
const UNIT = 308;

// 2u cards carry a photo; screenshot cards show the real WhatsApp messages
// (Spanish) with the translation as the quote.
const testimonials: Testimonial[] = [
  {
    id: 1,
    quote:
      "This is the most thoughtful gift my partner and I have ever received. The book is beautiful and of great quality, but most of all, it made us feel so appreciated by everyone who sent a recipe. The Small Plates team was amazing, thank you!",
    author: "Bárbara A.",
    descriptor: "Bride",
    photo: "/testimonials/Barbara_testimonial.jpg",
  },
  {
    id: 2,
    quote:
      "When we opened the book I cried so much haha… The people we love most giving us a little piece of themselves, of their kitchens, of their stories — what an enormous privilege!! For us this book isn't just recipes, it's having everyone with us in this new chapter, in the most beautiful, everyday way there is.",
    author: "Sophie",
    descriptor: "Couple — the day the book arrived",
    photo: "/testimonials/whatsapp_sophie.jpg",
    screenshot: true,
    note: "Translated from Spanish",
  },
  {
    id: 3,
    quote:
      "We did this as an anniversary gift and it was one of the most meaningful things we've done since our wedding. Small Plates and Company gives your family and friends a chance to bring their favorite recipes into your home and you get the meals that matter to the people you love. Highly recommend for anyone looking for a thoughtful gift they'll use all the time.",
    author: "Donald C.",
    descriptor: "Groom",
  },
  {
    id: 4,
    quote:
      "“Recipe's done! 🥰 What a lovely gift!!!”\n“Mine's in! I loved this gift!”\n“Done! What an incredible gift”\n“Done! ❤️”",
    author: "The group chat",
    descriptor: "Guests, the week recipes were due",
    photo: "/testimonials/whatsapp_cadena.jpg",
    screenshot: true,
    note: "Translated from Spanish",
  },
  {
    id: 5,
    quote:
      "AMAZING GIFT!",
    author: "Victor B. & Rocío",
    descriptor: "Couple",
    photo: "/testimonials/victor_testimonial.jpg",
  },
  {
    id: 6,
    quote:
      "“It's divine! They're going to love it”\n“It's incredible!!! Thank you”\n“No woooow it's incredible!!! 😍”\n“Thank you for organizing this 🙏”",
    author: "The group chat",
    descriptor: "Guests, seeing the book for the first time",
    photo: "/testimonials/whatsapp_reacciones.jpg",
    screenshot: true,
    note: "Translated from Spanish",
  },
  {
    id: 7,
    quote:
      "I loved it! and I'd definitely do this for other people too. It feels like such a thoughtful, meaningful gift.",
    author: "Mariana",
    descriptor: "Guest - Contributor",
  },
  {
    id: 8,
    quote:
      "I loved it. It's so easy to create the recipes, and the final result is incredible.",
    author: "Maria Cristina",
    descriptor: "Guest - Contributor",
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
  const reduced = useReducedMotion();

  const containerVariants = {
    hidden: {},
    visible: {
      transition: { staggerChildren: reduced ? 0 : 0.1 },
    },
  };

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
      className="bg-brand-warm-white-warm pt-20 md:pt-28 pb-32 md:pb-40"
      aria-labelledby="testimonials-heading"
    >
      <div className="mx-auto max-w-7xl px-6 md:px-8">

        {/* ── Header + arrows ── */}
        <motion.div
          className="flex items-end justify-between mb-12 md:mb-14"
          initial={{ opacity: 0, y: reduced ? 0 : 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: reduced ? 0.2 : 0.6, ease: "easeOut" }}
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
