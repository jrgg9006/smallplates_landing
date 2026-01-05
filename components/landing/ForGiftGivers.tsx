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
    router.push("/onboarding-gift");
  };

  return (
    <section 
      className="bg-[#E8E0D5] py-16 md:py-24"
      aria-labelledby="gift-givers-heading"
    >
      <div className="mx-auto max-w-4xl px-6 md:px-8">
        
        <motion.div
          className="bg-white rounded-2xl shadow-xl p-8 md:p-12 lg:p-16 relative overflow-hidden border border-[#D4A854]/20"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #fefefe 50%, #ffffff 100%)'
          }}
        >
          {/* Decorative corner flourishes */}
          <div className="absolute top-4 left-4 w-12 h-12 opacity-10">
            <svg viewBox="0 0 48 48" className="w-full h-full text-[#D4A854]">
              <path d="M12 12C18 6 30 6 36 12M12 36C18 42 30 42 36 36" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
              <circle cx="24" cy="24" r="2" fill="currentColor"/>
            </svg>
          </div>
          
          <div className="absolute top-4 right-4 w-12 h-12 opacity-10 transform rotate-90">
            <svg viewBox="0 0 48 48" className="w-full h-full text-[#D4A854]">
              <path d="M12 12C18 6 30 6 36 12M12 36C18 42 30 42 36 36" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
              <circle cx="24" cy="24" r="2" fill="currentColor"/>
            </svg>
          </div>
          
          <div className="absolute bottom-4 left-4 w-12 h-12 opacity-10 transform rotate-180">
            <svg viewBox="0 0 48 48" className="w-full h-full text-[#D4A854]">
              <path d="M12 12C18 6 30 6 36 12M12 36C18 42 30 42 36 36" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
              <circle cx="24" cy="24" r="2" fill="currentColor"/>
            </svg>
          </div>
          
          <div className="absolute bottom-4 right-4 w-12 h-12 opacity-10 transform rotate-270">
            <svg viewBox="0 0 48 48" className="w-full h-full text-[#D4A854]">
              <path d="M12 12C18 6 30 6 36 12M12 36C18 42 30 42 36 36" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
              <circle cx="24" cy="24" r="2" fill="currentColor"/>
            </svg>
          </div>
          
          {/* Background pattern overlay */}
          <div 
            className="absolute inset-0 opacity-[0.02] pointer-events-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23D4A854' fill-opacity='1'%3E%3Cpath d='M30 30c0-5.5-4.5-10-10-10s-10 4.5-10 10 4.5 10 10 10 10-4.5 10-10zm10 0c0-5.5-4.5-10-10-10s-10 4.5-10 10 4.5 10 10 10 10-4.5 10-10z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              backgroundSize: '60px 60px'
            }}
          />
          
          {/* Content wrapper with relative positioning */}
          <div className="relative z-10">
          {/* Headline with elegant styling */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-4 mb-4">
              <div className="h-px bg-gradient-to-r from-transparent via-[#D4A854] to-transparent w-16"></div>
              <div className="w-2 h-2 rounded-full bg-[#D4A854]"></div>
              <div className="h-px bg-gradient-to-r from-transparent via-[#D4A854] to-transparent w-16"></div>
            </div>
            
            <h2
              id="gift-givers-heading"
              className="font-serif text-3xl sm:text-4xl md:text-5xl font-medium text-[#2D2D2D] relative"
            >
              Giving this as a{' '}
              <span className="relative inline-block">
                <span 
                  className="text-[#D4A854] italic font-light"
                  style={{
                    fontFamily: 'Georgia, serif'
                  }}
                >
                  gift
                </span>
              </span>?
            </h2>
          </div>

          {/* Subhead */}
          <p className="mt-6 font-sans font-light text-lg md:text-xl text-[#2D2D2D]/80 text-center max-w-2xl mx-auto">
            You&apos;re about to give the best wedding gift anyone&apos;s ever received.
          </p>

          {/* The Process */}
          <div className="mt-10 md:mt-12">
            <p className="font-sans text-base font-medium text-[#2D2D2D]/60 uppercase tracking-wider mb-6">
              Here&apos;s the deal:
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
                  <span className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-[#D4A854]/20 to-[#D4A854]/30 text-[#D4A854] font-serif font-medium flex items-center justify-center text-base border border-[#D4A854]/30 shadow-sm">
                    {index + 1}
                  </span>
                  <span className="font-sans font-light text-lg text-[#2D2D2D]/80 pt-1">
                    {step}
                  </span>
                </motion.li>
              ))}
            </ol>
          </div>

          {/* Reassurance */}
          <motion.p
            className="mt-10 font-sans font-light text-base text-[#2D2D2D]/60 text-center"
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
            <p className="font-sans font-light text-center text-[#2D2D2D]/70">
              <span className="block text-lg">One gift from the group.</span>
              <span className="block mt-2 text-base text-[#2D2D2D]/60">
                Split among bridesmaids or family, it&apos;s less than most registry items—
                <span className="block">and infinitely more meaningful.</span>
              </span>
            </p>
            <p className="mt-4 font-serif text-xl text-[#2D2D2D] text-center">
              Books start at $149.
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
          
          </div>
        </motion.div>
      </div>
    </section>
  );
}