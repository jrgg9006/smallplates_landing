"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { calculateSubtotal, pricePerCopy } from "@/lib/stripe/pricing";
import { trackStartBookClick } from "@/lib/analytics";
import { isFreeTierEnabled } from "@/lib/feature-flags";

/**
 * PRICING PAGE — Single product, editorial layout.
 *
 * Design: A centered "invitation-style" card as the visual centerpiece,
 * with the two price points side by side (equal weight, different context).
 * Features listed with honey accent dots.
 */

// Reason: mirror the checkout cap (QuantityStep MAX_COPIES) so the selector
// never previews a quantity the close flow can't actually order.
const MAX_COPIES = 10;

// Reason: the price table shows the full volume curve (1–6); 7+ is the flat-$89
// edge case handled by a subordinate stepper, not extra rows.
const TABLE_COPIES = [1, 2, 3, 4, 5, 6];

// Reason: the editing/photos/design work happens after payment and is invisible
// to the buyer — this section names it, in three acts, right below the price.
const serviceSteps = [
  {
    title: "Every recipe, cleaned up.",
    description:
      "Typos out, measurements consistent, instructions that actually work in a kitchen.",
    icon: (
      <svg
        viewBox="0 0 30 30"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-7 h-7"
      >
        <path d="M20 4l6 6-14 14-7 1 1-7z" />
        <path d="M17 7l6 6" />
      </svg>
    ),
  },
  {
    title: "Every recipe, photographed.",
    description:
      "A full-color photo for every dish, made for the book. Nobody has to dig up pictures.",
    icon: (
      <svg
        viewBox="0 0 30 30"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-7 h-7"
      >
        <rect x="3" y="9" width="24" height="16" rx="2" />
        <circle cx="15" cy="17" r="5" />
        <path d="M10 9l2-3h6l2 3" />
      </svg>
    ),
  },
  {
    title: "Designed, printed, shipped.",
    description:
      "Laid out page by page, printed in hardcover, at your door in about three weeks.",
    icon: (
      <svg
        viewBox="0 0 30 30"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-7 h-7"
      >
        <path d="M4 10l11-5 11 5v11l-11 5-11-5z" />
        <path d="M4 10l11 5 11-5" />
        <path d="M15 15v11" />
      </svg>
    ),
  },
];

export default function PricingPage() {
  const router = useRouter();

  // Reason: default to 3 so the card loads with a row already selected, showing
  // a real group price ($113/person · $339 total) instead of the pricier single.
  const [qty, setQty] = useState(3);

  const handleStartBook = () => {
    trackStartBookClick('pricing_card_primary');
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
            One book. Or one for everyone.
          </motion.h1>
          <motion.p
            className="mt-4 type-body-small text-[hsl(var(--brand-warm-gray-light))]"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            Everyone who chips in gets their own copy. The more you print, the less each one costs.
          </motion.p>
        </div>
      </section>

      {/* Pricing Card — the centerpiece */}
      <section className="pb-16 md:pb-20">
        <div className="mx-auto max-w-3xl px-6">
          <motion.div
            className="relative bg-white rounded-2xl shadow-xl border border-brand-honey/20 overflow-hidden"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
          >
            {/* Decorative corner flourishes */}
            <div className="absolute top-4 left-4 w-10 h-10 opacity-[0.08]">
              <svg viewBox="0 0 48 48" className="w-full h-full text-brand-honey">
                <path d="M6 6C6 6 24 2 42 6" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                <path d="M6 6C6 6 2 24 6 42" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
              </svg>
            </div>
            <div className="absolute top-4 right-4 w-10 h-10 opacity-[0.08] -scale-x-100">
              <svg viewBox="0 0 48 48" className="w-full h-full text-brand-honey">
                <path d="M6 6C6 6 24 2 42 6" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                <path d="M6 6C6 6 2 24 6 42" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
              </svg>
            </div>
            <div className="absolute bottom-4 left-4 w-10 h-10 opacity-[0.08] -scale-y-100">
              <svg viewBox="0 0 48 48" className="w-full h-full text-brand-honey">
                <path d="M6 6C6 6 24 2 42 6" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                <path d="M6 6C6 6 2 24 6 42" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
              </svg>
            </div>
            <div className="absolute bottom-4 right-4 w-10 h-10 opacity-[0.08] scale-[-1]">
              <svg viewBox="0 0 48 48" className="w-full h-full text-brand-honey">
                <path d="M6 6C6 6 24 2 42 6" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                <path d="M6 6C6 6 2 24 6 42" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
              </svg>
            </div>

            <div className="px-8 py-10 md:px-12 md:py-14">
              {/* Copy-count selector — a price table that shows the whole volume
                  curve at once, so the per-person drop (our group mechanic) is
                  visible instead of hidden behind a counter. Each row IS the
                  selector. Numbers come from pricing.ts, so the table always
                  matches what checkout charges. */}
              <div className="mb-8">
                <p className="mb-3 text-center font-sans text-xs font-medium uppercase tracking-[0.15em] text-brand-honey">
                  Free to start · Pay only when it&rsquo;s ready to print
                </p>
                <p className="font-serif text-2xl md:text-3xl text-brand-charcoal mb-6 text-center">
                  How many copies?
                </p>

                {/* The table (1–6) — one consolidated list, hairline dividers,
                    each row a single-line radio option. */}
                <div
                  role="radiogroup"
                  aria-label="Number of copies"
                  className="overflow-hidden rounded-xl border border-brand-sand divide-y divide-brand-sand"
                >
                  {TABLE_COPIES.map((n) => {
                    const selected = qty === n;
                    return (
                      <button
                        key={n}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() => setQty(n)}
                        className={`flex w-full items-baseline justify-between gap-3 px-6 py-4 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-honey ${
                          selected ? "bg-brand-honey/10" : "hover:bg-brand-sand/30"
                        }`}
                      >
                        <span className="flex items-baseline gap-2">
                          <span className="font-serif text-base text-brand-charcoal">
                            {n === 1 ? "1 copy" : `${n} copies`}
                          </span>
                          {n === 6 && (
                            <span className="text-[11px] text-brand-honey">best price</span>
                          )}
                        </span>
                        <span className="flex items-baseline gap-2 tabular-nums">
                          <span className="font-serif text-xl text-brand-charcoal">
                            ${pricePerCopy(n)}
                            {n > 1 && (
                              <span className="ml-0.5 font-sans text-[11px] text-[hsl(var(--brand-warm-gray-light))]">
                                /person
                              </span>
                            )}
                          </span>
                          <span className="text-xs text-[hsl(var(--brand-warm-gray-light))]">
                            {n === 1 ? "shipping included" : `· $${calculateSubtotal(n)} total`}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* 7+ — the edge case, kept quiet and subordinate to the table */}
                <div
                  className={`mt-2.5 flex items-center justify-between gap-3 rounded-xl border px-6 py-4 transition-colors ${
                    qty >= 7 ? "border-brand-honey bg-brand-honey/10" : "border-brand-sand"
                  }`}
                >
                  <span className="flex items-baseline gap-2">
                    <span className="font-serif text-base text-brand-charcoal">More than 6?</span>
                    <span className="text-xs tabular-nums text-[hsl(var(--brand-warm-gray-light))]" aria-live="polite">
                      $89 each{qty >= 7 ? ` · $${calculateSubtotal(qty)} total` : ""}
                    </span>
                  </span>
                  <span className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => setQty((q) => Math.max(6, q - 1))}
                      disabled={qty <= 6}
                      aria-label="Fewer copies"
                      className="flex h-8 w-8 items-center justify-center rounded-full border-[1.5px] border-brand-charcoal/15 text-brand-charcoal transition-colors hover:border-brand-honey disabled:opacity-25 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-honey"
                    >
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M5 12h14" /></svg>
                    </button>
                    <span className="min-w-[1.25rem] text-center font-serif text-base tabular-nums text-brand-charcoal">
                      {qty >= 7 ? qty : 7}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQty((q) => Math.min(MAX_COPIES, Math.max(7, q + 1)))}
                      disabled={qty >= MAX_COPIES}
                      aria-label="More copies"
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-honey text-white transition-colors hover:bg-brand-honey-dark disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-honey"
                    >
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
                    </button>
                  </span>
                </div>

                {/* Footer line under the selector */}
                <p className="mt-3 text-center text-xs text-[hsl(var(--brand-warm-gray-light))]">
                  Ships to one address · shipping included
                </p>
              </div>

              {/* Reason: the card stays focused on the price table — the physical
                  specs compress to one quiet tag line (TheBook's specTags style);
                  the service gets its own section below the card. */}
              <div className="flex flex-wrap justify-center gap-2">
                {["Hardcover", "Full color", "8 × 10 in", "50 recipes included"].map(
                  (tag) => (
                    <span
                      key={tag}
                      className="font-sans text-xs bg-brand-cream border border-brand-sand text-brand-charcoal/60 px-3.5 py-1.5 rounded-sm"
                    >
                      {tag}
                    </span>
                  )
                )}
              </div>
              <p className="text-center text-sm text-brand-honey mt-5">
                50 recipes are included. Each one after that is just $1, added to your total when you print.
              </p>
            </div>

            {/* CTA strip at bottom of card */}
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

      {/* The service — what the price actually covers */}
      <section className="pb-20 md:pb-28">
        <div className="mx-auto max-w-4xl px-6">
          <motion.div
            className="text-center mb-12 md:mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
          >
            <p className="type-eyebrow mb-4">What the price actually covers</p>
            <h2
              className="type-heading font-normal"
              style={{ letterSpacing: "-0.02em" }}
            >
              You collect the recipes. We do the rest.
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-12 sm:gap-8 md:gap-12">
            {serviceSteps.map((step, index) => (
              <motion.div
                key={step.title}
                className="text-center"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.5, delay: index * 0.08 }}
              >
                <div className="flex justify-center text-brand-honey mb-5">
                  {step.icon}
                </div>
                <h3 className="type-subheading text-lg mb-3">{step.title}</h3>
                <p className="type-body-small text-[15px] max-w-[260px] mx-auto">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>

          {/* Reason: the human check is the claim competitors can't make — it
              gets its own beat below the three acts, not a crowded fourth column. */}
          <motion.p
            className="type-accent mt-14 md:mt-16 text-center text-lg md:text-xl text-brand-charcoal/75"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            And before anything goes to print, a real person has read every
            recipe. Every time.
          </motion.p>
        </div>
      </section>

      {/* A few things to know — flat text, no card */}
      <section className="pb-24 md:pb-32">
        <div className="mx-auto max-w-2xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <h3 className="font-serif text-xl text-brand-charcoal mb-8">
              A few things to know
            </h3>

            <div className="space-y-6 text-[15px] text-[hsl(var(--brand-warm-gray-light))] leading-relaxed font-light">
              <p>
                <span className="font-medium text-brand-charcoal font-sans">Shipping</span> is
                included in the price.
              </p>
              <div className="h-px bg-brand-sand" />
              <p>
                <span className="font-medium text-brand-charcoal">Timeline:</span> Most
                books are ready 3–4 weeks after recipe collection closes.
              </p>
              <div className="h-px bg-brand-sand" />
              <p>
                <span className="font-medium text-brand-charcoal">What&apos;s not included:</span> Stress.
                We handle the editing, the design, the production. You just invite people.
              </p>
            </div>
          </motion.div>
        </div>
      </section>
    </main>
  );
}
