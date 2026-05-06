"use client";

import React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { trackEvent } from "@/lib/analytics";

interface FromTheBookHeroProps {
  bookId?: string;
}

export default function FromTheBookHero({ bookId }: FromTheBookHeroProps) {
  const router = useRouter();

  const handleStart = () => {
    trackEvent("from_book_cta_click", {
      book_id: bookId,
      cta_location: "hero_primary",
    });
    const params = new URLSearchParams({
      utm_source: "book",
      utm_medium: "qr",
      utm_campaign: "from_the_book",
      ...(bookId ? { b: bookId } : {}),
    });
    router.push(`/onboarding?${params.toString()}`);
  };

  return (
    <section
      aria-labelledby="from-the-book-hero-title"
      className="relative min-h-[600px] md:min-h-[700px] lg:min-h-[800px] flex items-center"
    >
      {/* Background image — same as main landing for visual consistency */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/profile/Hero_Profile_2400.jpg"
          alt="Couple cooking together in warm kitchen light"
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#2D2D2D]/60 via-[#2D2D2D]/35 to-[#2D2D2D]/10" />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full px-6 md:px-12 lg:px-16 pt-40 md:pt-48 lg:pt-56 pb-20 md:pb-28">
        <div className="max-w-3xl">
          <motion.h1
            id="from-the-book-hero-title"
            className="type-display text-white leading-[1.1]"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          >
            You saw it open at a wedding.
            <br />
            Here&apos;s how one gets made.
          </motion.h1>

          <motion.p
            className="type-body mt-6 sm:text-xl md:text-2xl text-white/90 max-w-2xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }}
          >
            A cookbook written by everyone who comes to the wedding. One recipe each. Ready to live in a kitchen.
          </motion.p>

          <motion.div
            className="mt-10 flex flex-col sm:flex-row items-start sm:items-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8, ease: "easeOut" }}
          >
            <button
              type="button"
              onClick={handleStart}
              className="btn btn-lg btn-honey"
              data-cta="from-the-book-hero-primary"
            >
              Start your book
            </button>

            <span className="text-white/90 text-lg font-light px-2 py-1">
              15% off at checkout — only through this link.
            </span>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
