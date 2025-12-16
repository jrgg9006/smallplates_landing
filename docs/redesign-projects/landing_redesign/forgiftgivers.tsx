"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

/**
 * FOR GIFT GIVERS SECTION — Small Plates Wedding Landing Page
 * 
 * Voice: Margot Cole (in "organizer mode")
 * Purpose: Capture the secondary audience — bridesmaids, sisters, friends who want to give this as a gift.
 * 
 * Copy rationale:
 * - "Giving this as a gift?" — Direct question. If yes, this section is for you.
 *   No need to over-explain who this is for.
 * 
 * - "You're about to give the best wedding gift anyone's ever received."
 *   Bold claim, but Margot says it with confidence, not arrogance.
 *   She knows this is true because she's seen it.
 * 
 * - "Here's the deal:" — Margot being practical. She's in planning mode now.
 *   Four steps, simple, no jargon.
 * 
 * - "Bride cries. You win." — This is peak Margot. Dry, funny, true.
 *   She's not being cynical—she's acknowledging that yes, you want credit,
 *   and yes, you'll get it.
 * 
 * - Pricing: Contextualizing the cost as a group gift makes it accessible.
 *   "$15-25 per person" feels like nothing for something this meaningful.
 * 
 * Design rationale:
 * - Sand background (#E8E0D5) — visually distinct, warm
 * - Slight card-like feel — this is a "special offer" without being salesy
 * - Different CTA: "Start a Book for Someone" (third-person)
 */

export default function ForGiftGivers() {
  const router = useRouter();

  const handleStartGift = () => {
    router.push("/onboarding?intent=gift");
  };

  return (
    <section 
      className="bg-[#E8E0D5] py-16 md:py-24"
      aria-labelledby="gift-givers-heading"
    >
      <div className="mx-auto max-w-4xl px-6 md:px-8">
        
        <motion.div
          className="bg-white rounded-2xl shadow-lg p-8 md:p-12 lg:p-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          {/* Headline */}
          <h2
            id="gift-givers-heading"
            className="font-serif text-3xl sm:text-4xl md:text-5xl font-medium text-[#2D2D2D] text-center"
          >
            Giving this as a gift?
          </h2>

          {/* Subhead */}
          <p className="mt-6 font-sans text-lg md:text-xl text-[#2D2D2D]/80 text-center max-w-2xl mx-auto">
            You're about to give the best wedding gift anyone's ever received.
          </p>

          {/* The Process */}
          <div className="mt-10 md:mt-12">
            <p className="font-sans text-base font-medium text-[#2D2D2D]/60 uppercase tracking-wider mb-6">
              Here's the deal:
            </p>
            
            <ol className="space-y-4">
              {[
                "You start the book.",
                "You invite the guests.",
                "They send recipes (we remind them, don't worry).",
                "We print it. Bride cries. You win."
              ].map((step, index) => (
                <motion.li
                  key={index}
                  className="flex items-start gap-4"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                >
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[#D4A854]/20 text-[#D4A854] font-medium flex items-center justify-center text-sm">
                    {index + 1}
                  </span>
                  <span className="font-sans text-lg text-[#2D2D2D]/80 pt-1">
                    {step}
                  </span>
                </motion.li>
              ))}
            </ol>
          </div>

          {/* Reassurance */}
          <motion.p
            className="mt-10 font-sans text-base text-[#2D2D2D]/60 text-center"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            No design skills needed. We handle the hard part.
          </motion.p>

          {/* Pricing Context */}
          <motion.div
            className="mt-8 pt-8 border-t border-[#E8E0D5]"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <p className="font-sans text-center text-[#2D2D2D]/70">
              <span className="block text-lg">One gift from the group.</span>
              <span className="block mt-2 text-base text-[#2D2D2D]/60">
                Split among bridesmaids or family, it's less than most registry items—
                <span className="block">and infinitely more meaningful.</span>
              </span>
            </p>
            <p className="mt-4 font-serif text-xl text-[#2D2D2D] text-center">
              Books start at $120.
            </p>
          </motion.div>

          {/* CTA */}
          <motion.div
            className="mt-10 text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <button
              type="button"
              onClick={handleStartGift}
              className="inline-flex items-center justify-center rounded-full bg-[#2D2D2D] hover:bg-[#1a1a1a] text-white px-10 py-4 text-lg font-medium shadow-lg transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#2D2D2D]"
              data-cta="gift-givers-primary"
            >
              Start a Book for Someone
            </button>
          </motion.div>

        </motion.div>
      </div>
    </section>
  );
}