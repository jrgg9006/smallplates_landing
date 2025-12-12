"use client";

import Image from "next/image";
import { motion } from "framer-motion";

/**
 * HOW IT WORKS SECTION — Small Plates Wedding Landing Page
 * 
 * Voice: Margot Cole
 * Purpose: Remove friction. Show how simple this is.
 * 
 * Copy rationale:
 * - "Here's how it happens." — Not "Here's how it works."
 *   "Happens" feels more natural, less mechanical. Margot explains
 *   things like she's telling a friend, not reading a manual.
 * 
 * - "Simpler than you think." — Acknowledges the fear (is this complicated?)
 *   and dismisses it immediately. No drama.
 * 
 * - Step 1: "You invite." — Two words. That's it.
 *   "Share a link... We'll remind them—you don't have to chase anyone."
 *   Margot knows the real fear: that you'll have to nag people. She addresses it.
 * 
 * - Step 2: "They send recipes." — Active voice. Clear.
 *   "Their favorites. Their stories. Takes 5 minutes."
 *   Notice: no exclamation marks. Margot states facts.
 * 
 * - Step 3: "We make the book." — The handoff. You're done.
 *   "Designed. Printed. Hardcover. Delivered."
 *   Four words. All you need to know.
 * 
 * Design rationale:
 * - Clean 3-column grid on desktop, vertical on mobile
 * - Each step has visual + text
 * - White background for clarity
 */

export default function HowItWorks() {
  const steps = [
    {
      number: "01",
      title: "You invite.",
      description: "Share a link with your guests. We'll remind them—you don't have to chase anyone.",
      image: "/images/landing/how-it-works/step-1-invite.png",
      imageAlt: "Invitation being shared via phone"
    },
    {
      number: "02",
      title: "They send recipes.",
      description: "Their favorites. Their stories. Takes 5 minutes.",
      image: "/images/landing/how-it-works/step-2-recipes.png",
      imageAlt: "Person submitting a recipe with a photo"
    },
    {
      number: "03",
      title: "We make the book.",
      description: "Designed. Printed. Hardcover. Delivered.",
      image: "/images/landing/how-it-works/step-3-book.png",
      imageAlt: "Finished hardcover cookbook"
    }
  ];

  return (
    <section 
      id="how-it-works"
      className="bg-white py-16 md:py-24"
      aria-labelledby="how-it-works-heading"
    >
      <div className="mx-auto max-w-7xl px-6 md:px-8">
        
        {/* Section Header */}
        <motion.div
          className="text-center mb-16 md:mb-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <h2
            id="how-it-works-heading"
            className="font-serif text-3xl sm:text-4xl md:text-5xl font-medium text-[#2D2D2D]"
          >
            Here's how it happens.
          </h2>
          <p className="mt-4 font-sans text-lg md:text-xl text-[#2D2D2D]/60">
            Simpler than you think.
          </p>
        </motion.div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              className="text-center"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: index * 0.15, ease: "easeOut" }}
            >
              {/* Step Number */}
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#FAF7F2] text-[#D4A854] font-serif text-lg font-medium mb-6">
                {step.number}
              </div>

              {/* Image */}
              <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-[#FAF7F2] mb-6">
                <Image
                  src={step.image}
                  alt={step.imageAlt}
                  fill
                  className="object-contain p-4"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
              </div>

              {/* Title */}
              <h3 className="font-serif text-2xl md:text-3xl font-medium text-[#2D2D2D] mb-3">
                {step.title}
              </h3>

              {/* Description */}
              <p className="font-sans text-base md:text-lg text-[#2D2D2D]/70 max-w-xs mx-auto">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Optional: Connector line on desktop */}
        <div className="hidden md:block absolute top-1/2 left-0 right-0 h-px bg-[#E8E0D5] -z-10" />

      </div>
    </section>
  );
}