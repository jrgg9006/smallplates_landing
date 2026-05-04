"use client";

import { motion } from "framer-motion";

const specs = [
  {
    heading: "Tapa dura, acabado mate.",
    description:
      "Tapa dura premium con acabado mate suave. Limpia, elegante, y hecha para verse bien en cualquier encimera o repisa.",
    icon: (
      <svg
        viewBox="0 0 30 30"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-7 h-7"
      >
        <rect x="5" y="3" width="20" height="25" rx="1.5" />
        <line x1="5" y1="3" x2="5" y2="28" strokeWidth="2.5" />
        <line x1="10" y1="10" x2="20" y2="10" />
        <line x1="10" y1="14" x2="17" y2="14" />
      </svg>
    ),
  },
  {
    heading: "A todo color, en cada página.",
    description:
      "Diseño profesional, con fotografía hecha a medida para cada receta. La comida de su gente, presentada como se merece.",
    icon: (
      <svg
        viewBox="0 0 30 30"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-7 h-7"
      >
        <circle cx="15" cy="12" r="7" />
        <circle cx="15" cy="12" r="2.5" />
        <rect x="8" y="20" width="14" height="5" rx="1" />
        <line x1="12" y1="22.5" x2="18" y2="22.5" />
      </svg>
    ),
  },
  {
    heading: "Hasta 50 recetas.",
    description:
      "Cada una con una nota personal de quien la mandó. Su receta. Sus palabras. Su página en el libro.",
    icon: (
      <svg
        viewBox="0 0 30 30"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-7 h-7"
      >
        <rect x="3" y="2" width="17" height="22" rx="1" />
        <rect x="10" y="6" width="17" height="22" rx="1" />
        <line x1="14" y1="13" x2="23" y2="13" />
        <line x1="14" y1="17" x2="21" y2="17" />
        <line x1="14" y1="21" x2="19" y2="21" />
      </svg>
    ),
  },
  {
    heading: "8 × 10 pulgadas.",
    description:
      "Tamaño carta. Grande para cocinar con él cómodamente. De los libros que se quedan abiertos sobre la encimera — no escondidos en una repisa.",
    icon: (
      <svg
        viewBox="0 0 30 30"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-7 h-7"
      >
        <rect x="3" y="5" width="24" height="17" rx="1" />
        <line x1="3" y1="14" x2="27" y2="14" />
        <circle cx="15" cy="10" r="3" />
        <line x1="15" y1="22" x2="15" y2="26" />
        <line x1="11" y1="26" x2="19" y2="26" />
      </svg>
    ),
  },
  {
    heading: "Encuadernación reforzada.",
    description:
      "Encuadernación con pegamento Poliuretano Reactivo (PUR) — la más fuerte que existe. Hecha para quedarse abierta sobre la encimera mientras cocina.",
    icon: (
      <svg
        viewBox="0 0 30 30"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-7 h-7"
      >
        <path d="M7 27V5a2 2 0 012-2h12a2 2 0 012 2v22" />
        <line x1="3" y1="27" x2="27" y2="27" />
        <path d="M11 9l4 3 4-3" />
        <line x1="15" y1="12" x2="15" y2="21" />
      </svg>
    ),
  },
  {
    heading: "Hecha para la encimera.",
    description:
      "Laminado mate. Páginas gruesas. Una tapa dura hecha para aguantar la cocina de verdad — manchada y abierta un martes en la noche.",
    icon: (
      <svg
        viewBox="0 0 30 30"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-7 h-7"
      >
        {/* Counter/surface */}
        <line x1="2" y1="27" x2="28" y2="27" />
        {/* Open book on counter */}
        <path d="M6 22l9-3 9 3" />
        <path d="M6 22V12l9-3v13" />
        <path d="M24 22V12l-9-3v13" />
        {/* Steam lines */}
        <path d="M12 6c0-2 2-3 2-5" strokeWidth="1" />
        <path d="M18 6c0-2 2-3 2-5" strokeWidth="1" />
      </svg>
    ),
  },
];

export default function RegalosSpecsGrid() {
  return (
    <div className="mt-16 md:mt-24">
      {/* Reason: gap-px + bg-brand-sand creates 1px divider lines between cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-brand-sand rounded-lg overflow-hidden">
        {specs.map((spec, index) => (
          <motion.div
            key={spec.heading}
            className="bg-brand-warm-white-warm p-8 md:p-10 lg:p-12 transition-colors duration-300 hover:bg-brand-cream"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5, delay: index * 0.05 }}
          >
            <div className="text-brand-honey mb-5">{spec.icon}</div>
            <h3 className="type-subheading text-lg md:text-xl mb-3">
              {spec.heading}
            </h3>
            <p className="type-body-small text-[15px]">
              {spec.description}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
