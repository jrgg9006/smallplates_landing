"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";
import { trackEvent } from "@/lib/analytics";
import { isFreeTierEnabled } from "@/lib/feature-flags";
import { BASE_BOOK_PRICE } from "@/lib/stripe/pricing";

/**
 * PRICING BLOCK — the commercial "what you get + price" beat both Storyworth
 * and Remento lean on, adapted to our free-tier model. Product-page layout:
 * an image gallery on the left, the offer on the right.
 *
 * Our risk-reversal is stronger than their money-back guarantee: we charge
 * nothing until the book is ready, so there is nothing to refund. That free-tier
 * framing is the hero of this section.
 */

// Placeholder gallery — swap for real product photography later.
const GALLERY = [
  { src: "/images/books_printed/recipe_modal_9.png", alt: "A recipe spread inside the book" },
  { src: "/images/books_printed/recipe_modal_1.png", alt: "A recipe with its photo" },
  { src: "/images/books_printed/recipe_modal_3.png", alt: "A recipe and a note from a guest" },
  { src: "/images/books_printed/recipe_modal_6.png", alt: "A full-color dish inside the book" },
  { src: "/images/books_printed/recipe_modal_8.png", alt: "A recipe page" },
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
    trackEvent("start_book_click", { cta_location: "pricing_block_primary" });
    router.push(isFreeTierEnabled() ? "/onboarding/welcome" : "/onboarding");
  };

  return (
    <section
      className="overflow-hidden bg-brand-warm-white py-16 md:py-24"
      aria-labelledby="pricing-heading"
    >
      <div className="mx-auto max-w-7xl px-6 md:px-10 lg:px-16">
        <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
          {/* Gallery — vertical thumbnail rail + main image */}
          <motion.div
            className="self-start"
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
              </div>
            </div>
          </motion.div>

          {/* Offer */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
          >
            <p className="type-eyebrow mb-4">The book</p>

            <h2 id="pricing-heading" className="type-subheading md:text-4xl">
              Free to start. Pay when it&rsquo;s ready.
            </h2>

            {/* Price — compact, sits right under the title */}
            <div className="mt-3 flex items-baseline gap-2.5">
              <span className="font-sans text-xl font-semibold text-brand-charcoal">
                ${BASE_BOOK_PRICE}
              </span>
              <span className="type-caption">per book, shipping included</span>
            </div>

            <p className="type-body-small mt-5 max-w-md text-sm text-brand-charcoal/70 md:text-[15px]">
              No card up front. You only pay once the book is printed and on its
              way, so there&rsquo;s nothing to risk.
            </p>

            {/* What's included — single list */}
            <p className="type-eyebrow mb-4 mt-8">Every book includes</p>
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
