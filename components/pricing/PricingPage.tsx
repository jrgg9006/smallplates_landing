"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { BASE_BOOK_PRICE, ADDITIONAL_BOOK_PRICE } from "@/lib/stripe/pricing";
import { trackEvent } from "@/lib/analytics";

/**
 * PRICING PAGE — Single product, editorial layout.
 *
 * Design: A centered "invitation-style" card as the visual centerpiece,
 * with the two price points side by side (equal weight, different context).
 * Decorative flourishes match ForGiftGivers section language.
 * Features listed with honey accent dots.
 */

export default function PricingPage() {
  const router = useRouter();

  const handleStartBook = () => {
    trackEvent('start_book_click', { cta_location: 'pricing_card_primary' });
    router.push("/onboarding");
  };

  const handleContact = () => {
    window.location.href = "mailto:team@smallplatesandcompany.com";
  };

  return (
    <main className="min-h-screen bg-[#FAF9F7]">
      {/* Header */}
      <section className="pt-24 pb-6 md:pt-32 md:pb-10">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <motion.h1
            className="type-heading font-normal"
            style={{ letterSpacing: "-0.02em" }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            One book. Everything included.
          </motion.h1>
          <motion.p
            className="mt-4 type-body-small text-[hsl(var(--brand-warm-gray-light))]"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            No tiers. No packages. Just the book.
          </motion.p>
        </div>
      </section>

      {/* Pricing Card — the centerpiece */}
      <section className="pb-16 md:pb-20">
        <div className="mx-auto max-w-2xl px-6">
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
              {/* Two prices side by side */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-0 sm:divide-x sm:divide-brand-sand mb-10">
                {/* First book */}
                <div className="text-center sm:pr-8">
                  <p className="font-sans text-xs font-medium tracking-[0.15em] text-[hsl(var(--brand-warm-gray-light))] uppercase mb-3">
                    Your first book
                  </p>
                  <div className="flex items-baseline justify-center">
                    <span className="font-serif text-3xl md:text-4xl text-brand-charcoal/50">$</span>
                    <span className="font-serif text-6xl md:text-7xl text-brand-charcoal leading-none">
                      {BASE_BOOK_PRICE}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-[hsl(var(--brand-warm-gray-light))]">shipping included</p>
                </div>

                {/* Additional copies */}
                <div className="text-center sm:pl-8">
                  <p className="font-sans text-xs font-medium tracking-[0.15em] text-[hsl(var(--brand-warm-gray-light))] uppercase mb-3">
                    Each additional copy
                  </p>
                  <div className="flex items-baseline justify-center">
                    <span className="font-serif text-3xl md:text-4xl text-brand-charcoal/50">$</span>
                    <span className="font-serif text-6xl md:text-7xl text-brand-charcoal leading-none">
                      {ADDITIONAL_BOOK_PRICE}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-[hsl(var(--brand-warm-gray-light))]">same book, same quality</p>
                </div>
              </div>

              {/* Context note */}
              <p className="text-center font-serif italic text-[hsl(var(--brand-warm-gray-light))] text-base mb-10">
                Most people order 2–3. One for the couple, one for each family.
              </p>

              {/* Honey rule */}
              <div className="flex items-center gap-4 mb-10">
                <div className="flex-1 h-px bg-brand-sand" />
                <div className="w-1.5 h-1.5 rounded-full bg-brand-honey" />
                <div className="flex-1 h-px bg-brand-sand" />
              </div>

              {/* What's included */}
              <h2 className="text-center font-serif text-lg text-brand-charcoal mb-6">
                Every book includes
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 max-w-lg mx-auto mb-3">
                {[
                  "50 recipes included",
                  "Premium hardcover, 8 × 10 in",
                  "Professionally designed",
                  "Full color throughout",
                  "Personal notes from every guest",
                  "Full platform access",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-2.5">
                    <span className="mt-2 w-1.5 h-1.5 rounded-full bg-brand-honey flex-shrink-0" />
                    <span className="text-[15px] text-[#6B6966] font-light leading-relaxed">
                      {item}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-center text-sm text-brand-honey mt-5">
                Need more than 50 recipes? Additional available.
              </p>
            </div>

            {/* CTA strip at bottom of card */}
            <div className="bg-[#FDFCFA] border-t border-brand-sand px-8 py-8 md:px-12 text-center">
              <p className="font-serif italic text-brand-charcoal text-lg mb-5">
                Bride cries. You win.
              </p>
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
                <span className="font-medium text-brand-charcoal">What&apos;s included:</span> 50
                recipes, professional design, recipe images, quality printing, and full
                access to the platform.
              </p>
              <div className="h-px bg-brand-sand" />
              <p>
                <span className="font-medium text-brand-charcoal">What&apos;s not included:</span> Stress.
                We handle the reminders, the design, the production. You just invite people.
              </p>
            </div>
          </motion.div>
        </div>
      </section>
    </main>
  );
}
