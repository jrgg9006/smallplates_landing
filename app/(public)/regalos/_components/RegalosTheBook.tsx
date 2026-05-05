"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import RegalosSpecsGrid from "./RegalosSpecsGrid";
import RegalosHandmadeCallout from "./RegalosHandmadeCallout";
import RegalosDetailStrip from "./RegalosDetailStrip";
import { trackEvent } from "@/lib/analytics";
import { buildWhatsAppLink, WHATSAPP_MESSAGES } from "./whatsapp";

const specTags = [
  "Tapa dura",
  "A todo color",
  "8 × 10 pulgadas",
  "Acabado mate",
];

export default function RegalosTheBook() {
  const [isBookHovered, setIsBookHovered] = useState(false);

  return (
    <section
      className="bg-brand-warm-white-warm py-16 md:py-24"
      aria-labelledby="the-book-heading"
    >
      <div className="mx-auto max-w-7xl px-6 md:px-8">
        {/* Part 1: Headline + Subtitle */}
        <motion.div
          className="text-center mb-12 md:mb-16"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          <h2
            id="the-book-heading"
            className="type-heading font-normal text-brand-charcoal"
            style={{ letterSpacing: "-0.02em" }}
          >
            Lo que llega a su casa.
          </h2>
          <p className="mt-5 type-body-small text-[hsl(var(--brand-warm-gray-light))] max-w-[520px] mx-auto">
            Cada libro es de tapa dura y a todo color. Porque lo que vive adentro merece quedarse para siempre.
          </p>
        </motion.div>

        {/* Part 2: Book Hero — centered flex layout */}
        <div className="flex justify-center py-10 md:py-16">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20 max-w-[960px] w-full">
            {/* 3D Book */}
            <motion.div
              className="flex-shrink-0"
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.7, ease: "easeOut" }}
            >
              <div
                style={{ perspective: "1200px" }}
                onMouseEnter={() => setIsBookHovered(true)}
                onMouseLeave={() => setIsBookHovered(false)}
              >
                <div
                  className="relative w-[240px] h-[300px] sm:w-[320px] sm:h-[400px]"
                  style={{
                    transformStyle: "preserve-3d",
                    transform: isBookHovered
                      ? "rotateY(-5deg)"
                      : "rotateY(-12deg)",
                    transition: "transform 0.6s cubic-bezier(0.23, 1, 0.32, 1)",
                  }}
                >
                  {/* Front cover */}
                  <div
                    className="absolute inset-0 overflow-hidden"
                    style={{
                      backfaceVisibility: "hidden",
                      borderRadius: "1px 4px 4px 1px",
                      boxShadow:
                        "6px 6px 24px rgba(0,0,0,0.12), 2px 2px 8px rgba(0,0,0,0.08)",
                    }}
                  >
                    <Image
                      src="/images/TheBookSection/book-cover-front-thebooksection.jpg"
                      alt="Libro de cocina de bodas Small Plates — portada tapa dura"
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 240px, 640px"
                      priority
                    />
                  </div>

                  {/* Spine */}
                  <div
                    className="absolute top-0 left-0 h-full"
                    style={{
                      width: "24px",
                      background:
                        "linear-gradient(180deg, #e8e0d8 0%, #d8d0c8 50%, #c8c0b8 100%)",
                      transform: "rotateY(90deg) translateZ(0px) translateX(-12px)",
                      transformOrigin: "left center",
                      boxShadow: "inset -1px 0 3px rgba(0,0,0,0.1)",
                    }}
                  />

                  {/* Page edges */}
                  <div
                    className="absolute top-1 h-[calc(100%-8px)]"
                    style={{
                      width: "16px",
                      right: "-2px",
                      background:
                        "repeating-linear-gradient(180deg, #faf8f5 0px, #faf8f5 1px, #f0ece6 1px, #f0ece6 2px)",
                      borderRadius: "0 2px 2px 0",
                      boxShadow: "2px 0 4px rgba(0,0,0,0.04)",
                      transform: "translateZ(-2px)",
                    }}
                  />

                  {/* Shadow below */}
                  <div
                    className="absolute -bottom-4"
                    style={{
                      left: "10%",
                      right: "5%",
                      height: "20px",
                      background:
                        "radial-gradient(ellipse, rgba(0,0,0,0.08) 0%, transparent 70%)",
                      filter: "blur(4px)",
                    }}
                  />
                </div>
              </div>
            </motion.div>

            {/* Intro Text */}
            <motion.div
              className="flex-1 max-w-[480px] text-center lg:text-left"
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.7, delay: 0.15, ease: "easeOut" }}
            >
              <p className="type-eyebrow mb-4">
                El libro
              </p>

              <h3 className="type-subheading font-normal mb-6">
                Un libro de verdad. Hecho para durar.
              </h3>

              <div className="space-y-4">
                <p className="type-body-small text-[hsl(var(--brand-warm-gray-light))]">
                  Cada libro de Small Plates es un recetario de tapa dura diseñado profesionalmente e impreso a todo color.
                  Sin plantillas. Sin atajos.
                </p>
                <p className="type-body-small text-[hsl(var(--brand-warm-gray-light))]">
                  Cada libro es distinto, porque la gente de cada pareja es distinta.
                </p>
              </div>

              {/* Spec tags */}
              <div className="flex flex-wrap justify-center lg:justify-start gap-2 mt-6">
                {specTags.map((tag) => (
                  <span
                    key={tag}
                    className="font-sans text-xs bg-brand-cream border border-brand-sand text-brand-charcoal/60 px-3.5 py-1.5 rounded-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Part 3: Specs Grid */}
        <RegalosSpecsGrid />

        {/* Part 4: Handmade Callout */}
        <RegalosHandmadeCallout />

        {/* Part 5: Detail Strip */}
        <RegalosDetailStrip />

        {/* Part 6: Closing + CTA */}
        <motion.div
          className="mt-16 md:mt-24 text-center max-w-xl mx-auto"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          <p className="font-serif text-2xl md:text-3xl font-medium text-brand-charcoal leading-snug">
            Diseñado por nosotros. Impreso para ellos.
          </p>
          <p className="mt-3 font-serif text-2xl md:text-3xl font-medium text-brand-charcoal leading-snug">
            Hecho para{" "}
            <span className="italic text-brand-honey">usarse.</span>
          </p>

          <div className="mt-10">
            <a
              href={buildWhatsAppLink(WHATSAPP_MESSAGES.theBook)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() =>
                trackEvent("start_book_click", { cta_location: "regalos_thebook_primary" })
              }
              className="btn btn-lg btn-honey"
              data-cta="regalos-thebook"
            >
              Hablemos por WhatsApp
            </a>
          </div>

        </motion.div>
      </div>
    </section>
  );
}
