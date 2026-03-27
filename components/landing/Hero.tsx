"use client";

import React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function Hero() {
  const router = useRouter();

  const handleGetStarted = () => {
    router.push("/onboarding-gift");
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
        <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/30 to-black/20"></div>
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
            Recipes from the people who love you.
          </motion.h1>
          <motion.p
            className="type-body mt-6 sm:text-xl md:text-2xl text-white/90 max-w-2xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }}
          >
            A wedding cookbook made by everyone who showed up.
            <span className="block mt-1 text-white/80">
              You set it up. We handle the rest.
            </span>
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
              className="inline-flex items-center justify-center rounded-full bg-[#D4A854] hover:bg-[#c49b4a] text-white px-8 py-4 text-lg font-medium shadow-lg transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#D4A854]"
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

          {/* Scroll link to The Book section */}
          <motion.button
            type="button"
            onClick={() => {
              document.getElementById("the-book-heading")?.scrollIntoView({ behavior: "smooth" });
            }}
            className="mt-4 text-sm text-white/60 hover:text-white/90 transition-colors duration-200 focus:outline-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1.2, ease: "easeOut" }}
          >
            See the book &rarr;
          </motion.button>
        </div>
      </div>

    </section>
  );
}
