"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { trackEvent } from "@/lib/analytics";
import { buildWhatsAppLink, WHATSAPP_MESSAGES } from "./whatsapp";

const notes = [
  {
    id: 1,
    text: "...Espero que esta receta siempre les recuerde la importancia de mantenerse cerca — y qué mejor lugar que alrededor de la cocina. Mantengan vivas las tradiciones familiares para sus hijos y nietos. Con todo mi cariño.",
    recipe: "Paella de la abuela Mati",
    from: "de Papá",
    image: "/images/notes_section/grandmas_tatis.jpg",
  },
  {
    id: 2,
    text: "Algunas de mis mejores conversaciones con Michael han sido con una cerveza fría en la mano. Sin prisa, sin agenda — solo tiempo para platicar y reírnos. Esto es menos una receta y más un recordatorio: siempre hagan tiempo para la gente que quieren.",
    recipe: "Cervezas bien frías",
    from: "de Jake y Tina",
    image: "/images/notes_section/ice_beers.jpg",
  },
  {
    id: 3,
    text: "Para cualquier momento. Que les dé los mismos recuerdos juntos que me ha dado a mí.",
    recipe: "Tortilla española",
    from: "del tío Roberto",
    image: "/images/notes_section/spanish_tortilla.jpg",
  },
  {
    id: 4,
    text: "...Mi prima empezó a venderlos y honestamente armó un pequeño imperio porque son así de buenos. Empecé a hacerlos para la gente que más quiero cada Navidad. Ahora es de ustedes.",
    recipe: "Pay de dátil y nuez",
    from: "de la prima María",
    image: "/images/notes_section/date_pie_updated1.jpg",
  },
  {
    id: 5,
    text: "...Que su vida juntos esté llena de mañanas tranquilas, desayunos largos y pequeños rituales que se conviertan en grandes recuerdos.",
    recipe: "Hot cakes imperfectos",
    from: "de Pilar y Mark",
    image: "/images/notes_section/something_not_perfect.jpg",
  },
  {
    id: 6,
    text: "Aprendí esta receta en una clase de cocina el año que vivimos en Boston. La he hecho para incontables cenas desde entonces — es deliciosa y fácil. ¡Espero que les encante tanto como a nosotros!",
    recipe: "Pasta al pesto",
    from: "de la tía Linda",
    image: "/images/notes_section/Pesto_Pasta.jpg",
  },
];

export default function RegalosPersonalNotes() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const nextNote = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % notes.length);
  }, []);

  const goToNote = (index: number) => {
    setCurrentIndex(index);
  };

  // Auto-rotate every 10 seconds, pause on hover
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      nextNote();
    }, 10000);

    return () => clearInterval(interval);
  }, [isPaused, nextNote]);

  const currentNote = notes[currentIndex];

  return (
    <section
      className="bg-white py-16 md:py-24 overflow-hidden"
      aria-label="Notas de quienes mandaron una receta"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="mx-auto max-w-7xl px-6 md:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left side - Image that extends beyond the frame */}
          <div className="relative h-[340px] md:h-[460px] lg:h-[580px] order-2 lg:order-1">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentNote.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="absolute inset-0 top-4 lg:top-12 left-0 lg:-left-[34rem] xl:-left-[42rem] 2xl:-left-[52rem]"
              >
                <div
                  className="relative w-full h-full lg:w-[calc(100%+12rem)] xl:w-[calc(100%+18rem)] 2xl:w-[calc(100%+24rem)]"
                  style={{
                    transform: "rotate(-5deg)",
                    transformOrigin: "center center",
                  }}
                >
                  <Image
                    src={currentNote.image}
                    alt={`Páginas de la receta de ${currentNote.recipe}`}
                    fill
                    className="object-contain object-center drop-shadow-2xl"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    priority
                  />
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Right side - Text content */}
          <div className="order-1 lg:order-2 lg:pl-8 relative z-10">
            {/* Headline */}
            <motion.h2
              className="type-subheading text-center lg:text-left mb-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              No solo recetas. Es lo que escriben.
            </motion.h2>

            {/* Subheader */}
            <p className="type-body-small text-brand-charcoal/60 text-center lg:text-left">
              
            </p>

            {/* Secondary line */}
            <p className="type-accent mt-2 text-center lg:text-left text-brand-charcoal/70">
              
            </p>

            {/* Subtle divider */}
            <div className="flex justify-center lg:justify-start mt-6 mb-10 md:mb-12">
              <div className="w-16 h-px bg-[#D4D0C8]" />
            </div>

            {/* Note container - fixed height for consistency */}
            <div className="min-h-[200px] md:min-h-[180px] flex flex-col justify-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentNote.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="text-center lg:text-left"
                >
                  {/* The note text */}
                  <blockquote className="type-accent leading-relaxed mb-8">
                    &ldquo;{currentNote.text}&rdquo;
                  </blockquote>

                  {/* Recipe name and contributor */}
                  <div className="space-y-1">
                    <p className="type-caption text-[15px] md:text-base font-medium">
                      — {currentNote.recipe}
                    </p>
                    <p className="type-caption text-[hsl(var(--brand-warm-gray))]/70">
                      {currentNote.from}
                    </p>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Navigation dots */}
            <div className="flex justify-center lg:justify-start gap-2 mt-8">
              {notes.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToNote(index)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    index === currentIndex
                      ? "bg-brand-honey w-6"
                      : "bg-[#D4D0C8] hover:bg-brand-honey/50"
                  }`}
                  aria-label={`Ir a nota ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Closing line + CTA — full width below the grid */}
        <div className="mt-16 md:mt-20 text-center">
          <p className="type-body-small text-brand-charcoal/60 mb-10">
            Veinte, cuarenta, sesenta personas escribiéndoles algo. Todo en un solo libro.
          </p>
          <div className="flex justify-center">
            <a
              href={buildWhatsAppLink(WHATSAPP_MESSAGES.personalNotes)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() =>
                trackEvent("start_book_click", { cta_location: "regalos_personalnotes_primary" })
              }
              className="btn btn-lg btn-honey"
              data-cta="regalos-personalnotes"
            >
              Hablemos por WhatsApp
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
