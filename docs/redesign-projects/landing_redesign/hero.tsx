"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
// import BookPreviewModal from "./BookPreview/BookPreviewModal"; // TODO: Fix import path

/**
 * HERO SECTION — Small Plates Wedding Landing Page
 * 
 * Voice: Margot Cole
 * Purpose: Hook + context de bodas + CTA primario
 * 
 * Copy rationale:
 * - Headline: Acquisition line "Recipes from the people who love you."
 *   Explains the product in 7 words. Warm without being cheesy.
 *   Margot would say this with a knowing smile.
 * 
 * - Subhead: Anchors wedding context + differentiates (not a keepsake)
 *   "A wedding cookbook made by your guests" = clarity
 *   "Not a keepsake—a kitchen book" = Margot's edge
 * 
 * - CTA: "Start Your Book" — active, personal, no pressure
 * 
 * - Secondary: "See how it works" — for those who need more before committing
 */

export default function Hero() {
  const router = useRouter();
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  const handleStartBook = () => {
    router.push("/onboarding");
  };

  const scrollToHowItWorks = () => {
    const section = document.getElementById("how-it-works");
    if (section) {
      section.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section
      aria-labelledby="hero-title"
      className="relative min-h-[600px] md:min-h-[700px] lg:min-h-[800px] flex items-center"
    >
      {/* Background image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/landing/hero-wedding-kitchen.jpg"
          alt="Couple cooking together in warm kitchen light"
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        {/* Warm overlay — maintains brand warmth while ensuring text legibility */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/30 to-black/20"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 w-full px-6 md:px-12 lg:px-16 pt-28 md:pt-32 pb-16 md:pb-24">
        <div className="max-w-3xl">
          
          {/* Headline — The Acquisition Line */}
          <motion.h1
            id="hero-title"
            className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-medium tracking-tight text-white leading-[1.1]"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          >
            Recipes from the people who love you.
          </motion.h1>

          {/* Subhead — Context + Differentiation */}
          <motion.p
            className="font-sans mt-6 text-lg sm:text-xl md:text-2xl font-light text-white/90 max-w-xl leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }}
          >
            A wedding cookbook made by your guests.
            <span className="block mt-1 text-white/80">
              Not a keepsake—a kitchen book.
            </span>
          </motion.p>

          {/* CTAs */}
          <motion.div
            className="mt-10 flex flex-col sm:flex-row items-start sm:items-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8, ease: "easeOut" }}
          >
            {/* Primary CTA */}
            <button
              type="button"
              onClick={handleStartBook}
              className="inline-flex items-center justify-center rounded-full bg-[#D4A854] hover:bg-[#c49b4a] text-white px-8 py-4 text-lg font-medium shadow-lg transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#D4A854]"
              data-cta="hero-primary"
            >
              Start Your Book
            </button>

            {/* Secondary CTA */}
            <button
              type="button"
              onClick={scrollToHowItWorks}
              className="text-white/90 hover:text-white text-lg font-light underline underline-offset-4 decoration-white/50 hover:decoration-white transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-transparent rounded px-2 py-1"
            >
              See how it works
            </button>
          </motion.div>

          {/* Optional: Preview link — kept subtle, for those who want to explore */}
          <motion.button
            type="button"
            onClick={() => setIsPreviewModalOpen(true)}
            className="mt-4 text-sm text-white/60 hover:text-white/90 transition-colors duration-200 focus:outline-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1.2, ease: "easeOut" }}
          >
            Preview a sample book →
          </motion.button>
        </div>
      </div>

      {/* Book Preview Modal */}
      {/* <BookPreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
      /> */}
    </section>
  );
}