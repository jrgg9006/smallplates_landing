"use client";

import React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { trackEvent } from "@/lib/analytics";

export default function Hero() {
  const router = useRouter();

  const handleGetStarted = () => {
    trackEvent('start_book_click', { cta_location: 'hero_primary' });
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
          src="/images/profile/Hero_Profile_2400.jpg"
          alt="Couple cooking together in warm kitchen light"
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        {/* Warm overlay — maintains brand warmth while ensuring text legibility */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#2D2D2D]/60 via-[#2D2D2D]/35 to-[#2D2D2D]/10"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 w-full px-6 md:px-12 lg:px-16 pt-28 md:pt-32 pb-16 md:pb-24">
        <div className="max-w-3xl">
          <motion.h1 
            id="hero-title" 
            className="type-display text-white leading-[1.1]"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          >
            A cookbook made by your wedding guests.
          </motion.h1>
          <motion.p
            className="type-body mt-6 sm:text-xl md:text-2xl text-white/90 max-w-2xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }}
          >
            You set it up. We handle the rest.
          </motion.p>
          <motion.div
            className="mt-10 flex flex-col sm:flex-row items-start sm:items-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8, ease: "easeOut" }}
          >
            {/* Primary CTA */}
            <button
              type="button"
              onClick={handleGetStarted}
              className="btn btn-lg btn-honey"
              data-cta="hero-primary"
            >
              Start the Book
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

        </div>
      </div>

    </section>
  );
}
