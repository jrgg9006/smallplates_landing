"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useRef, useState, useEffect, useCallback } from "react";
import { RegalosTestimonialCard, type Testimonial } from "./RegalosTestimonialCard";

// One scroll step = 1u card + gap (288 + 20 = 308px)
const UNIT = 308;

const testimonials: Testimonial[] = [
  {
    id: 1,
    quote:
      "Este es el regalo más único que mi pareja y yo hemos recibido. El libro es precioso y de gran calidad, pero sobre todo, nos hizo sentir muy queridos por toda la gente que mandó una receta. El equipo de Small Plates fue increíble, ¡gracias!",
    author: "Bárbara A.",
    descriptor: "Novia",
    photo: "/testimonials/Barbara_testimonial.jpg",
  },
  {
    id: 2,
    quote:
      "Lo hicimos como regalo de aniversario y fue una de las cosas más significativas que hemos hecho desde la boda. Small Plates le da a tu familia y a tus amigos la oportunidad de traer sus recetas favoritas a tu casa — y tú te quedas con las comidas que importan para la gente que quieres. Súper recomendado para quien busque un regalo detallista que se use todo el tiempo.",
    author: "Donald C.",
    descriptor: "Novio",
  },
  {
    id: 3,
    quote: "¡QUÉ GRAN REGALO!",
    author: "Víctor B. y Rocío",
    descriptor: "Pareja",
    photo: "/testimonials/victor_testimonial.jpg",
  },
  {
    id: 4,
    quote:
      "¡Me encantó! Y definitivamente lo haría para otras personas también. Se siente como un regalo muy detallista y con significado.",
    author: "Mariana",
    descriptor: "Invitada — Mandó receta",
  },
  {
    id: 5,
    quote: "Me encantó. Es muy fácil crear las recetas, y el resultado final es increíble.",
    author: "Maria Cristina",
    descriptor: "Invitada — Mandó receta",
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

export default function RegalosTestimonialsSection() {
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
    syncArrows();
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
            <h2 id="testimonials-heading" className="type-heading">
              Lo que dicen quienes ya lo regalaron.
            </h2>
            <p className="type-body-small text-brand-charcoal/60 mt-3">
              Parejas que recibieron el libro. Familiares que mandaron una receta.
            </p>
          </div>

          {/* Navigation arrows — desktop only */}
          <div className="hidden md:flex items-center gap-2 pb-1 flex-shrink-0">
            <button
              onClick={() => scroll(-1)}
              disabled={prevDisabled}
              aria-label="Anterior"
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
              aria-label="Siguiente"
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
              <RegalosTestimonialCard key={t.id} t={t} />
            ))}
          </motion.div>
        </div>

      </div>
    </section>
  );
}
