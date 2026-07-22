"use client";

import { motion } from "framer-motion";
import Image from "next/image";

/**
 * COOKBOOK SPECIALIST — the differentiator beat. Sits directly above PricingBlock
 * so it builds the value of the human review a second before the price appears.
 *
 * The move: competitors sell a generic "design specialist." We own the
 * category-specific "Cookbook Specialist": a real person who reads every recipe.
 * Layout is text-left / image-right, mirroring PricingBlock's image-left layout
 * so the two adjacent sections alternate instead of reading as duplicates.
 */

const PROOF = [
  "Reads every recipe, start to finish",
  "Checks each photo against the dish it belongs to",
  "Reviews the full layout before it goes to print",
];

/**
 * The editorial stamp overlaid on the recipe spread. Built as SVG (not baked
 * into the image) so the text stays crisp, the font is correct, and the color is
 * a single swap. Color is driven by the wrapper's text color (currentColor), so
 * honey ↔ charcoal is one className change on <SpecialistSeal />.
 */
function SpecialistSeal({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 200"
      className={className}
      role="img"
      aria-label="Reviewed by your Cookbook Specialist"
    >
      {/* Slight rotation for a hand-pressed, inked feel */}
      <g transform="rotate(-7 100 100)" fill="none" stroke="currentColor">
        {/* Classic double ring */}
        <circle cx="100" cy="100" r="94" strokeWidth="2.5" />
        <circle cx="100" cy="100" r="85" strokeWidth="1.25" />

        {/* Top curved label */}
        <defs>
          <path id="seal-top-arc" d="M 30 100 A 70 70 0 0 1 170 100" />
        </defs>
        <text
          className="font-sans"
          fill="currentColor"
          stroke="none"
          fontSize="13.5"
          fontWeight={600}
          letterSpacing="1.2"
        >
          <textPath href="#seal-top-arc" startOffset="50%" textAnchor="middle">
            COOKBOOK SPECIALIST
          </textPath>
        </text>

        {/* Center mark: a check reads "reviewed" instantly */}
        <path
          d="M 84 92 l 8 9 l 18 -22"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Straight sub-label (kept horizontal for guaranteed legibility) */}
        <text
          className="font-sans"
          x="100"
          y="132"
          fill="currentColor"
          stroke="none"
          fontSize="12"
          fontWeight={500}
          letterSpacing="3"
          textAnchor="middle"
        >
          REVIEWED
        </text>

        {/* Small diamonds dividing top label from sub-label */}
        <path d="M 30 100 l 3 3 l -3 3 l -3 -3 z" fill="currentColor" stroke="none" />
        <path d="M 170 100 l 3 3 l -3 3 l -3 -3 z" fill="currentColor" stroke="none" />
      </g>
    </svg>
  );
}

export default function CookbookSpecialist() {
  return (
    <section
      className="overflow-hidden bg-brand-warm-white-airy py-16 md:py-24"
      aria-labelledby="cookbook-specialist-heading"
    >
      <div className="mx-auto max-w-7xl px-6 md:px-10 lg:px-16">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-x-14">
          {/* Copy — left on desktop */}
          <motion.div
            className="lg:col-start-1 lg:row-start-1"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <p className="type-eyebrow mb-4">Included with every book</p>

            <h2 id="cookbook-specialist-heading" className="type-subheading md:text-4xl">
              A Cookbook Specialist makes sure your book comes out right.
            </h2>

            <p className="type-body-small mt-5 max-w-md">
              A real person, your Cookbook Specialist, reads every recipe,
              checks that each photo actually looks like the dish, and goes
              through the whole book, page by page.
            </p>

            <ul className="mt-7 space-y-2.5">
              {PROOF.map((item) => (
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
                  <span className="type-body-small">{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Recipe spread + editorial stamp — right on desktop */}
          <motion.div
            className="lg:col-start-2 lg:row-start-1"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
          >
            {/* Relative wrapper (not clipped) so the stamp can overhang the
                corner, half on the photo, half on the section background. */}
            <div className="relative">
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-brand-sand shadow-[0_30px_70px_-30px_rgba(45,45,45,0.45)]">
                <Image
                  src="/images/PricingBlock/pricingblock_5.jpg"
                  alt="A recipe spread inside the finished cookbook"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 45vw"
                />
              </div>

              {/* Stamp sits on a paper medallion so it reads over any photo,
                  overhanging the bottom-right corner. Ink is honey-dark; swap to
                  text-brand-charcoal with one class for more contrast. */}
              <div className="absolute -bottom-7 right-6 rounded-full bg-brand-warm-white p-3.5 shadow-[0_10px_28px_-8px_rgba(45,45,45,0.4)] ring-1 ring-brand-sand/60 md:p-4">
                <SpecialistSeal className="h-24 w-24 text-brand-honey-dark md:h-28 md:w-28" />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
