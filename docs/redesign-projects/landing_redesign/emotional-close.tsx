"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

/**
 * EMOTIONAL CLOSE SECTION — Small Plates Wedding Landing Page
 * 
 * Voice: Margot Cole (her vulnerable side)
 * Purpose: Close with emotion. This is where the "inside" shows.
 * 
 * Copy rationale:
 * This is the Brand Line moment. Everything before was "cool on the outside."
 * Now we reveal the "emotional on the inside."
 * 
 * - "Ten years from now..." — We're not talking about the wedding day.
 *   We're talking about the LIFE. That's the shift.
 * 
 * - "You'll see a name. You'll remember a face."
 *   Simple, concrete, true. Margot doesn't say "you'll cherish the memories."
 *   She says exactly what will happen.
 * 
 * - "You'll cook something that tastes like being loved."
 *   This is poetry. But it's earned poetry because everything before was direct.
 * 
 * - "Not a gift. A kitchen full of people."
 *   The reframe. The gift isn't the object—it's the presence.
 * 
 * - "Still at the table."
 *   The Brand Line. No explanation needed. It lands because we built to it.
 * 
 * Design rationale:
 * - Dark background (Soft Charcoal) — signals a shift in mood
 * - Centered, generous typography — editorial, magazine-like
 * - Maximum whitespace — let every line breathe
 * - This section should feel like turning to the last page of a beautiful book
 */

export default function EmotionalClose() {
  const router = useRouter();

  const handleStartBook = () => {
    router.push("/onboarding");
  };

  return (
    <section 
      className="bg-[#2D2D2D] py-24 md:py-32 lg:py-40"
      aria-labelledby="emotional-close-heading"
    >
      <div className="mx-auto max-w-3xl px-6 md:px-8 text-center">
        
        {/* The Vision — What this becomes */}
        <motion.div
          className="space-y-6 md:space-y-8"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <p 
            id="emotional-close-heading"
            className="font-serif text-2xl sm:text-3xl md:text-4xl text-white/90 leading-relaxed"
          >
            Ten years from now,
            <span className="block">you'll open this book on a random Tuesday.</span>
          </p>

          <p className="font-serif text-2xl sm:text-3xl md:text-4xl text-white/80 leading-relaxed">
            You'll see a name.
            <span className="block">You'll remember a face.</span>
            <span className="block">You'll cook something that tastes like being loved.</span>
          </p>
        </motion.div>

        {/* Visual break */}
        <motion.div
          className="my-12 md:my-16 flex justify-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="w-12 h-px bg-white/20"></div>
        </motion.div>

        {/* The Reframe */}
        <motion.p
          className="font-serif text-xl sm:text-2xl md:text-3xl text-white/70 leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.4, ease: "easeOut" }}
        >
          That's what you're giving them.
          <span className="block mt-2">Not a gift.</span>
          <span className="block">A kitchen full of people.</span>
        </motion.p>

        {/* The Brand Line */}
        <motion.p
          className="mt-16 md:mt-20 font-serif text-3xl sm:text-4xl md:text-5xl text-[#D4A854] font-medium italic"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
        >
          Still at the table.
        </motion.p>

        {/* Final CTA */}
        <motion.div
          className="mt-12 md:mt-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.8, ease: "easeOut" }}
        >
          <button
            type="button"
            onClick={handleStartBook}
            className="inline-flex items-center justify-center rounded-full bg-[#D4A854] hover:bg-[#c49b4a] text-white px-10 py-4 text-lg font-medium shadow-lg transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#2D2D2D] focus-visible:ring-[#D4A854]"
            data-cta="emotional-close-primary"
          >
            Start Your Book
          </button>
        </motion.div>

      </div>
    </section>
  );
}