"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

/**
 * THE SOLUTION SECTION — Small Plates Wedding Landing Page
 * 
 * Voice: Margot Cole
 * Purpose: Present Small Plates as the answer. Explain what it is without being a feature dump.
 * 
 * Copy rationale:
 * - "A cookbook made by everyone who showed up." — This is the core.
 *   "Everyone who showed up" has weight. Margot knows that presence matters.
 * 
 * - "Every guest contributes... Every recipe becomes... Every page is..."
 *   The rhythm builds. It's not a list of features—it's a story of transformation.
 * 
 * - "It's not a gift you display. It's a gift you use."
 *   Margot's differentiation. She doesn't say "unlike other gifts." She just
 *   states what this IS and trusts you to understand what it's NOT.
 * 
 * - "stained, dog-eared, and opened on random Tuesday nights"
 *   This is very Margot. She doesn't pretend things stay perfect. The best
 *   things are used, worn, lived in.
 * 
 * Design rationale:
 * - Split layout: text left, image right
 * - White background for contrast with previous section
 * - Image: the book in a real kitchen, being used
 */

export default function TheSolution() {
  const router = useRouter();

  const handleStartBook = () => {
    router.push("/onboarding");
  };

  return (
    <section 
      className="bg-white py-16 md:py-24 lg:py-32"
      aria-labelledby="solution-heading"
    >
      <div className="mx-auto max-w-7xl px-6 md:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          
          {/* Text Content */}
          <motion.div
            className="order-2 lg:order-1"
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            {/* Eyebrow */}
            <p className="font-sans text-sm font-medium tracking-widest text-[#D4A854] uppercase mb-4">
              This is Small Plates
            </p>

            {/* Headline */}
            <h2
              id="solution-heading"
              className="font-serif text-3xl sm:text-4xl md:text-5xl font-medium text-[#2D2D2D] leading-tight"
            >
              A cookbook made by everyone who showed up.
            </h2>

            {/* Body copy */}
            <div className="mt-8 space-y-6">
              <p className="font-sans font-light text-lg md:text-xl text-[#2D2D2D]/80 leading-relaxed">
                Every guest contributes a recipe.
                <span className="block">Every recipe becomes a page.</span>
                <span className="block">Every page is a reason to cook together.</span>
              </p>

              <p className="font-sans font-light text-lg md:text-xl text-[#2D2D2D]/80 leading-relaxed">
                It's not a gift you display.
                <span className="block">It's a gift you use—stained, dog-eared,</span>
                <span className="block">and opened on random Tuesday nights for years.</span>
              </p>
            </div>

            {/* CTA */}
            <motion.div
              className="mt-10"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <button
                type="button"
                onClick={handleStartBook}
                className="inline-flex items-center justify-center rounded-full bg-[#D4A854] hover:bg-[#c49b4a] text-white px-8 py-4 text-lg font-medium shadow-lg transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#D4A854]"
                data-cta="solution-primary"
              >
                Start Your Book
              </button>
            </motion.div>
          </motion.div>

          {/* Image */}
          <motion.div
            className="order-1 lg:order-2"
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
          >
            <div className="relative aspect-[4/5] rounded-2xl overflow-hidden shadow-2xl">
              {/* TODO: Replace with /images/landing/book-in-kitchen.jpg when available */}
              <Image
                src="/images/landing/food_perfect.jpg"
                alt="Small Plates cookbook open on a kitchen counter, with coffee and fresh ingredients nearby"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
            
            {/* Caption — adds authenticity */}
            <p className="mt-4 text-center text-sm text-[#9A9590] font-sans">
              The Martinez-Chen book. 47 recipes. 47 people.
            </p>
          </motion.div>

        </div>
      </div>
    </section>
  );
}