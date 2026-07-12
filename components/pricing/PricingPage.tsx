"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { calculateSubtotal, pricePerCopy } from "@/lib/stripe/pricing";
import { trackStartBookClick } from "@/lib/analytics";
import { isFreeTierEnabled } from "@/lib/feature-flags";
import PricingFaq from "./PricingFaq";

/**
 * PRICING PAGE: the price and its justification in one visual field.
 *
 * Design: one invitation-style card. Per-person price + stepper on the left,
 * the itemized service ("What's included") on the right, stacked on mobile.
 * The buyer's anchor is a $39 store cookbook; the list is the answer.
 */

// Reason: mirror the checkout cap (QuantityStep MAX_COPIES) so the stepper
// never previews a quantity the close flow can't actually order.
const MAX_COPIES = 10;

// Reason: the editing/photos/design work happens after payment and is
// invisible at the moment of price shock; naming it next to the number is
// the point of this layout. Keep in sync with OrderCart and HandmadeCallout.
const included = [
  {
    lead: "Every recipe, cleaned up.",
    rest: "Typos out, measurements consistent, instructions that actually work in a kitchen.",
  },
  {
    lead: "A full-color photo for every dish,",
    rest: "made for the book.",
  },
  {
    lead: "Invite everyone.",
    rest: "50 recipes included; each one after that adds $1.",
  },
  {
    lead: "Designed page by page.",
    rest: "Hardcover, full color, 8 × 10 in.",
  },
  {
    lead: "Printed and shipped.",
    rest: "At your door 3 to 4 weeks after you close.",
  },
];

function CornerFlourish({ className }: { className: string }) {
  return (
    <div className={`absolute w-10 h-10 opacity-[0.08] ${className}`}>
      <svg viewBox="0 0 48 48" className="w-full h-full text-brand-honey">
        <path d="M6 6C6 6 24 2 42 6" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        <path d="M6 6C6 6 2 24 6 42" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      </svg>
    </div>
  );
}

export default function PricingPage() {
  const router = useRouter();

  // Reason: default to 1 copy, the honest single price. The stepper reveals
  // the group drop (169 → 129 → 113 …) instead of preloading a group price.
  const [qty, setQty] = useState(1);

  const handleStartBook = () => {
    trackStartBookClick("pricing_card_primary");
    router.push(isFreeTierEnabled() ? "/onboarding/welcome" : "/onboarding");
  };

  const handleContact = () => {
    window.location.href = "mailto:team@smallplatesandcompany.com";
  };

  return (
    <main className="min-h-screen bg-[hsl(var(--brand-warm-white))]">
      {/* Header */}
      <section className="pt-32 pb-6 md:pt-44 md:pb-10">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <motion.h1
            className="type-heading font-normal"
            style={{ letterSpacing: "-0.02em" }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            Here&rsquo;s what it costs.
          </motion.h1>
          <motion.p
            className="mt-4 type-body-small text-[hsl(var(--brand-warm-gray-light))]"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            And everything that&rsquo;s included.
          </motion.p>
        </div>
      </section>

      {/* Pricing card */}
      <section className="pb-14 md:pb-16">
        <div className="mx-auto max-w-4xl px-6">
          <motion.div
            className="relative bg-white rounded-2xl shadow-xl border border-brand-honey/20 overflow-hidden"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
          >
            <CornerFlourish className="top-4 left-4" />
            <CornerFlourish className="top-4 right-4 -scale-x-100" />
            <CornerFlourish className="bottom-4 left-4 -scale-y-100" />
            <CornerFlourish className="bottom-4 right-4 scale-[-1]" />

            <div className="px-8 py-10 md:px-12 md:py-12">
              <p className="mb-10 text-center font-sans text-xs font-medium uppercase tracking-[0.15em] text-brand-honey">
                Free to start · Pay only when it&rsquo;s ready to print
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-12 md:items-center">
                {/* Left: price + stepper */}
                <div className="text-center">
                  <p
                    className="font-serif text-6xl md:text-7xl text-brand-charcoal tabular-nums"
                    aria-live="polite"
                  >
                    ${pricePerCopy(qty)}
                  </p>
                  <p className="mt-2 type-caption">per person</p>

                  <div className="mt-7 flex items-center justify-center gap-4">
                    <button
                      type="button"
                      onClick={() => setQty((q) => Math.max(1, q - 1))}
                      disabled={qty <= 1}
                      aria-label="Fewer copies"
                      className="flex h-9 w-9 items-center justify-center rounded-full border-[1.5px] border-brand-charcoal/15 text-brand-charcoal transition-colors hover:border-brand-honey disabled:opacity-25 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-honey"
                    >
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M5 12h14" /></svg>
                    </button>
                    <span className="min-w-[5.5rem] text-center font-serif text-lg tabular-nums text-brand-charcoal">
                      {qty === 1 ? "1 copy" : `${qty} copies`}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQty((q) => Math.min(MAX_COPIES, q + 1))}
                      disabled={qty >= MAX_COPIES}
                      aria-label="More copies"
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-honey text-white transition-colors hover:bg-brand-honey-dark disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-honey"
                    >
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
                    </button>
                  </div>

                  <p className="mt-4 text-sm text-[hsl(var(--brand-warm-gray-light))] tabular-nums">
                    ${calculateSubtotal(qty)} total · shipping included
                    {qty >= 6 && <span className="ml-2 text-brand-honey">best price</span>}
                  </p>

                  <p className="mt-5 type-body-small text-[15px] max-w-[260px] mx-auto">
                    Everyone who chips in gets a copy. More people, less each.
                  </p>
                </div>

                {/* Right: what's included */}
                <div>
                  <p className="type-eyebrow mb-5">What&rsquo;s included</p>
                  <ul className="space-y-4">
                    {included.map((item) => (
                      <li key={item.lead} className="flex gap-3">
                        <span
                          className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-brand-honey"
                          aria-hidden="true"
                        />
                        <p className="type-body-small text-[15px]">
                          <span className="font-medium text-brand-charcoal">{item.lead}</span>{" "}
                          {item.rest}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* CTA strip */}
            <div className="bg-[#FDFCFA] border-t border-brand-sand px-8 py-8 md:px-12 text-center">
              <button
                onClick={handleStartBook}
                className="inline-flex items-center justify-center rounded-full bg-brand-honey hover:bg-brand-honey-dark text-white px-10 py-4 text-lg font-medium shadow-lg transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-honey"
              >
                Start the Book
              </button>
              <div className="mt-5">
                <button
                  onClick={handleContact}
                  className="text-[hsl(var(--brand-warm-gray-light))] text-sm hover:text-brand-honey transition-colors duration-200"
                >
                  Need something different? Let&apos;s figure it out →
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* The human check: the claim competitors can't make, its own beat */}
      <section className="pb-16 md:pb-24">
        <div className="mx-auto max-w-3xl px-6">
          <motion.p
            className="type-accent text-center text-lg md:text-xl text-brand-charcoal/75"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
          >
            And before anything goes to print, a real person has read every
            recipe. Every time.
          </motion.p>
        </div>
      </section>

      <PricingFaq />
    </main>
  );
}
