"use client";

import { motion } from "framer-motion";

/**
 * THE PROBLEM SECTION — Small Plates Wedding Landing Page
 * 
 * Voice: Margot Cole
 * Purpose: Establish tension — the cultural enemy (forgettable wedding gifts)
 * 
 * Copy rationale:
 * - "Another blender. Another towel set." — Margot's dry observation.
 *   She doesn't need to say "wedding gifts suck!" She just lists what
 *   everyone knows and lets you feel it.
 * 
 * - "Not because people don't care." — This is important. Margot doesn't
 *   judge the gift-givers. She understands the system is broken, not the people.
 * 
 * - "What if the gift wasn't a thing?" — The pivot. Simple question.
 *   Margot doesn't over-explain. She trusts you to get it.
 * 
 * Design rationale:
 * - Warm White background (#FAF7F2) — breathing room
 * - Centered text — this is a moment of pause and reflection
 * - No images — let the words land
 * - Generous spacing — Margot doesn't crowd you
 */

export default function TheProblem() {
  return (
    <section 
      className="bg-[#FAF7F2] py-20 md:py-28 lg:py-36"
      aria-labelledby="problem-heading"
    >
      <div className="mx-auto max-w-3xl px-6 md:px-8 text-center">
        
        {/* Main statement */}
        <motion.h2
          id="problem-heading"
          className="type-heading"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          Wedding gifts have a problem.
        </motion.h2>

        {/* The observation */}
        <motion.div
          className="mt-10 md:mt-12 space-y-6"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
        >
          <p className="type-body">
            Another blender. Another towel set. Another thing
            <span className="block">that ends up in a closet or returned.</span>
          </p>
          
          <p className="type-body">
            A gift that says &ldquo;I was there&rdquo; isn&apos;t the same
            <span className="block">as a gift that says &ldquo;I know you.&rdquo;</span>
          </p>
        </motion.div>

        {/* Visual break */}
        <motion.div
          className="my-8 md:my-10 flex justify-center"
          initial={{ opacity: 0, scaleX: 0 }}
          whileInView={{ opacity: 1, scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <div className="w-16 h-px bg-[#2D2D2D]/20"></div>
        </motion.div>

        {/* The pivot — the question that opens the door */}
        <motion.p
          className="type-accent text-2xl sm:text-3xl md:text-4xl leading-snug"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.5, ease: "easeOut" }}
        >
          <span className="block mt-2">You know her. The gift should too.</span>
        </motion.p>

      </div>
    </section>
  );
}