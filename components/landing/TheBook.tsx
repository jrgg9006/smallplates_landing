"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";
import SpecsGrid from "@/components/landing/TheBook/SpecsGrid";
import HandmadeCallout from "@/components/landing/TheBook/HandmadeCallout";
import DetailStrip from "@/components/landing/TheBook/DetailStrip";
import { trackEvent } from "@/lib/analytics";
// TODO: Re-enable when full specifications page is built
// import BookDetailsModal from "@/components/landing/BookDetailsModal";

/**
 * THE BOOK SECTION — Small Plates Wedding Landing Page
 *
 * Purpose: Bridge the emotional story (PersonalNotes) with product confidence.
 * Visitors are emotionally sold — now they visualize what shows up at their door.
 *
 * Structure:
 * 1. Headline + subtitle (centered)
 * 2. Book Hero (3D book left + intro text right)
 * 3. Specs Grid (3x2 — imported)
 * 4. Handmade Callout (split panel — imported)
 * 5. Detail Strip (4 items — imported)
 * 6. Closing line + CTA
 */

const specTags = [
  "Hardcover",
  "Full color",
  "8 \u00d7 10 in",
  "Matte finish",
];

export default function TheBook() {
  const router = useRouter();
  const [isBookHovered, setIsBookHovered] = useState(false);

  const handleCTA = () => {
    trackEvent('start_book_click', { cta_location: 'the_book_primary' });
    router.push("/onboarding");
  };

  return (
    <section
      className="bg-[#FAF7F2] py-16 md:py-24"
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
            className="type-heading font-normal text-[#1A1A1A]"
            style={{ letterSpacing: "-0.02em" }}
          >
            What shows up at her door.
          </h2>
          <p className="mt-5 type-body-small text-[#9A9590] max-w-[520px] mx-auto">
            Every book is hardcover and full color. Because what&apos;s
            inside deserves to be held in something real.
          </p>
        </motion.div>

        {/* Part 2: Book Hero — centered flex layout matching reference */}
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
                      alt="Small Plates wedding cookbook — hardcover front"
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
                The Book
              </p>

              <h3 className="type-subheading font-normal mb-6">
                A real book. Made to last.
              </h3>

              <div className="space-y-4">
                <p className="type-body-small text-[#9A9590]">
                  Every Small Plates book is a hardcover cookbook &mdash; professionally
                  designed and printed in full color.
                  No templates. No shortcuts.
                </p>
                <p className="type-body-small text-[#9A9590]">
                  Each book is different, because every couple&apos;s people are different.
                </p>
              </div>

              {/* Spec tags */}
              <div className="flex flex-wrap justify-center lg:justify-start gap-2 mt-6">
                {specTags.map((tag) => (
                  <span
                    key={tag}
                    className="font-sans text-xs bg-[#F5F1EB] border border-[#E8E0D5] text-brand-charcoal/60 px-3.5 py-1.5 rounded-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Part 3: Specs Grid */}
        <SpecsGrid />

        {/* Part 4: Handmade Callout */}
        <HandmadeCallout />

        {/* Part 5: Detail Strip */}
        <DetailStrip />

        {/* Part 6: Closing + CTA */}
        <motion.div
          className="mt-16 md:mt-24 text-center max-w-xl mx-auto"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          <p className="font-serif text-2xl md:text-3xl font-medium text-brand-charcoal leading-snug">
            Designed by us. Printed for them.
          </p>
          <p className="mt-3 font-serif text-2xl md:text-3xl font-medium text-brand-charcoal leading-snug">
            Made to be{" "}
            <span className="italic text-brand-honey">used.</span>
          </p>

          <div className="mt-10">
            <button
              type="button"
              onClick={handleCTA}
              className="inline-flex items-center justify-center rounded-full bg-brand-honey hover:bg-[#c49b4a] text-white px-8 py-4 text-lg font-medium shadow-lg transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-honey"
              data-cta="the-book-primary"
            >
              Start the Book
            </button>
          </div>

          {/* TODO: Link to full specifications page (not yet built) */}
          <span className="mt-4 inline-block type-caption cursor-default">
            Full book specifications &rarr;
          </span>
        </motion.div>
      </div>

    </section>
  );
}
