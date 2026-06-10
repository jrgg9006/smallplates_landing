"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";
import { trackStartBookClick } from "@/lib/analytics";
import { isFreeTierEnabled } from "@/lib/feature-flags";
import { pricePerCopy } from "@/lib/stripe/pricing";

/**
 * PRICING BLOCK — the commercial "what you get + price" beat both Storyworth
 * and Remento lean on, adapted to our free-tier model. Product-page layout:
 * an image gallery on the left, the offer on the right.
 *
 * Our risk-reversal is stronger than their money-back guarantee: we charge
 * nothing until the book is ready, so there is nothing to refund. That free-tier
 * framing is the hero of this section.
 */

const GALLERY = [
  { src: "/images/PricingBlock/pricingblock_7.jpg", alt: "Handing over the finished book" },
  { src: "/images/PricingBlock/pricingblock_4.jpg", alt: "The hardcover cookbook, cover up" },
  { src: "/images/PricingBlock/pricingblock_3.jpg", alt: "Reading the book at the table" },
  { src: "/images/PricingBlock/pricingblock_1.jpg", alt: "Showing a recipe from the book" },
  { src: "/images/PricingBlock/pricingblock_5.jpg", alt: "A dessert recipe spread inside the book" },
  { src: "/images/PricingBlock/pricingblock_2.jpg", alt: "A plate of food beside its recipe" },
  { src: "/images/PricingBlock/pricingblock_6.jpg", alt: "A recipe spread for Oreo truffles" },
];

const INCLUDES = [
  "50 recipes included",
  "A photo we make for every recipe",
  "A note from every person who sends one",
  "Premium hardcover, 8 × 10 in, full color",
  "Designed and printed by us",
  "Full platform access, no app to download",
];

const iconClass = "h-[18px] w-[18px]";

const TRUST = [
  {
    label: "Free U.S. shipping",
    icon: (
      <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 6h11v9H3zM14 9h4l3 3v3h-7z" />
        <circle cx="7" cy="18" r="1.6" />
        <circle cx="17.5" cy="18" r="1.6" />
      </svg>
    ),
  },
  {
    label: "Secure checkout",
    icon: (
      <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="5" y="10.5" width="14" height="9" rx="1.5" />
        <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
      </svg>
    ),
  },
  {
    label: "People, not bots",
    icon: (
      <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4 5h16v11H9l-5 4z" />
      </svg>
    ),
  },
];

export default function PricingBlock() {
  const router = useRouter();
  const [active, setActive] = useState(0);

  const handleStartBook = () => {
    trackStartBookClick("pricing_block_primary");
    router.push(isFreeTierEnabled() ? "/onboarding/welcome" : "/onboarding");
  };

  const showPrev = () =>
    setActive((a) => (a - 1 + GALLERY.length) % GALLERY.length);
  const showNext = () => setActive((a) => (a + 1) % GALLERY.length);

  return (
    <section
      className="overflow-hidden bg-brand-warm-white py-16 md:py-24"
      aria-labelledby="pricing-heading"
    >
      <div className="mx-auto max-w-7xl px-6 md:px-10 lg:px-16">
        <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-x-14 lg:gap-y-0">
          {/* Offer — top (heading + price + risk-reversal). On mobile this sits
              above the gallery; on desktop it's the top of the right column. */}
          <motion.div
            className="lg:col-start-2 lg:row-start-1"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
          >
            <p className="type-eyebrow mb-4">The book</p>

            <h2 id="pricing-heading" className="type-subheading md:text-4xl">
              Free to start. Pay when it&rsquo;s ready.
            </h2>

            {/* Price — per-person range. It's a group gift, so the cost splits
                across everyone who chips in; the full curve lives on /pricing. */}
            <div className="mt-3 flex items-baseline gap-2.5">
              <span className="font-sans text-xl font-semibold text-brand-charcoal tabular-nums">
                ${pricePerCopy(6)}&ndash;${pricePerCopy(1)}
              </span>
              <span className="type-caption">per person, shipping included</span>
            </div>

            <p className="type-body-small mt-5 max-w-md text-sm text-brand-charcoal/70 md:text-[15px]">
              No card up front. You only pay once the book is printed and on its
              way, so there&rsquo;s nothing to risk.
            </p>
          </motion.div>

          {/* Gallery — vertical thumbnail rail + main image */}
          <motion.div
            className="self-start lg:col-start-1 lg:row-start-1 lg:row-span-2"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <div className="flex w-full items-start gap-3 md:gap-4">
              {/* Thumbnail rail */}
              <div className="flex w-14 flex-shrink-0 flex-col gap-2.5 md:w-16">
                {GALLERY.map((img, i) => (
                  <button
                    key={img.src}
                    type="button"
                    onClick={() => setActive(i)}
                    aria-label={`View ${img.alt}`}
                    aria-pressed={i === active}
                    className={`relative aspect-[4/5] overflow-hidden rounded-md bg-brand-sand transition-all duration-200 ${
                      i === active
                        ? "ring-2 ring-brand-honey ring-offset-1 ring-offset-brand-warm-white"
                        : "opacity-60 hover:opacity-100"
                    }`}
                  >
                    <Image
                      src={img.src}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  </button>
                ))}
              </div>

              {/* Main image */}
              <div className="relative aspect-[3/4] flex-1 overflow-hidden rounded-2xl bg-brand-sand shadow-[0_30px_70px_-30px_rgba(45,45,45,0.45)]">
                {GALLERY.map((img, i) => (
                  <Image
                    key={img.src}
                    src={img.src}
                    alt={img.alt}
                    fill
                    className={`object-cover transition-opacity duration-500 ${
                      i === active ? "opacity-100" : "opacity-0"
                    }`}
                    sizes="(max-width: 1024px) 100vw, 40vw"
                    priority={i === 0}
                  />
                ))}

                {/* Nav arrows */}
                <button
                  type="button"
                  onClick={showPrev}
                  aria-label="Previous image"
                  className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/70 text-brand-charcoal shadow-sm backdrop-blur-sm transition hover:bg-white"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M15 18l-6-6 6-6" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={showNext}
                  aria-label="Next image"
                  className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/70 text-brand-charcoal shadow-sm backdrop-blur-sm transition hover:bg-white"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </button>
              </div>
            </div>
          </motion.div>

          {/* Offer — bottom (what's included + CTA + trust). On mobile this sits
              below the gallery; on desktop it's the bottom of the right column. */}
          <motion.div
            className="lg:col-start-2 lg:row-start-2"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.15, ease: "easeOut" }}
          >
            {/* What's included — single list. mt only on desktop: on mobile the
                grid gap handles separation from the gallery above. */}
            <p className="type-eyebrow mb-4 lg:mt-8">Every book includes</p>
            <ul className="space-y-2.5">
              {INCLUDES.map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <svg
                    className="mt-[3px] h-3.5 w-3.5 flex-shrink-0 text-brand-honey"
                    viewBox="0 0 16 16"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M3.5 8.5l3 3 6-7"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span className="type-body-small text-sm md:text-[15px]">{item}</span>
                </li>
              ))}
            </ul>

            {/* CTA */}
            <div className="mt-9">
              <button
                type="button"
                onClick={handleStartBook}
                className="btn btn-lg btn-honey"
                data-cta="pricing-block-primary"
              >
                Start their book for free
              </button>
              <p className="type-caption mt-4">
                Ready about 3&ndash;4 weeks after recipes close.
              </p>
            </div>

            {/* Trust strip */}
            <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-2.5 border-t border-brand-sand pt-5 sm:grid-cols-3">
              {TRUST.map((item) => (
                <div key={item.label} className="flex items-center gap-2.5">
                  <span className="flex-shrink-0 text-brand-charcoal/70">
                    {item.icon}
                  </span>
                  <span className="font-sans text-sm text-brand-charcoal/80">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
