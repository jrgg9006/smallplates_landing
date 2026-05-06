"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { trackEvent } from "@/lib/analytics";

interface FromTheBookCTASectionProps {
  bookId?: string;
}

export default function FromTheBookCTASection({ bookId }: FromTheBookCTASectionProps) {
  const router = useRouter();

  const handleStart = () => {
    trackEvent("from_book_cta_click", {
      book_id: bookId,
      cta_location: "final_cta",
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
      aria-labelledby="from-the-book-final-cta-heading"
      className="bg-brand-warm-white-warm py-20 md:py-28"
    >
      <div className="mx-auto max-w-3xl px-6 md:px-10 text-center">
        <motion.h2
          id="from-the-book-final-cta-heading"
          className="type-heading text-brand-charcoal"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
        >
          One book. Everyone who came.
        </motion.h2>

        <motion.div
          className="mt-10"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, delay: 0.15, ease: [0.23, 1, 0.32, 1] }}
        >
          <button
            type="button"
            onClick={handleStart}
            className="btn btn-lg btn-honey"
            data-cta="from-the-book-final-cta"
          >
            Start your book
          </button>
        </motion.div>
      </div>
    </section>
  );
}
