"use client";

import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { trackEvent } from "@/lib/analytics";
import { isFreeTierEnabled } from "@/lib/feature-flags";

/**
 * THE SOLUTION — "The recipe, the photo, the note. Together on one page."
 *
 * Centered, airy layout (Remento / Storyworth pattern): a calm headline and
 * subtext up top, then real book spreads drifting full-width below. The wedge
 * made visible instead of described. The product argues for itself.
 *
 * Voice: Margot. Emotion welded to the product, never a standalone sermon.
 */
const BASE = "/images/books_printed";

// Real spreads (~1.6:1). Each already shows the contributor, note, recipe and
// dish, so alt text just mirrors that for screen readers.
const SPREADS: { src: string; alt: string }[] = [
  { src: `${BASE}/recipe_modal_9.png`, alt: "Three Milk Cake, a recipe shared by Patricia García" },
  { src: `${BASE}/recipe_modal_1.png`, alt: "Chili, a recipe shared by Karla Acosta" },
  { src: `${BASE}/recipe_modal_6.png`, alt: "Salmon with Olives, a recipe shared by Verónica Zorrilla" },
  { src: `${BASE}/recipe_modal_3.png`, alt: "Birthday Carrot Cake, a recipe shared by Gabriela Ramírez" },
  { src: `${BASE}/recipe_modal_11.png`, alt: "Banana Bread, a recipe shared by Isabel Balcázar" },
  { src: `${BASE}/recipe_modal_8.png`, alt: "The Best Salmon Tacos, a recipe shared by Barbs and Albert" },
  { src: `${BASE}/recipe_modal_4.png`, alt: "Easy, Delicious Turkey, a recipe shared by Ale Velasco" },
  { src: `${BASE}/recipe_modal_5.png`, alt: "Matcha Pound Cake, a recipe shared by Ber and Pat" },
];

function Spread({
  src,
  alt,
  ariaHidden,
}: {
  src: string;
  alt: string;
  ariaHidden?: boolean;
}) {
  return (
    <Image
      src={src}
      alt={ariaHidden ? "" : alt}
      aria-hidden={ariaHidden}
      width={1280}
      height={800}
      sizes="(max-width: 768px) 80vw, 560px"
      className="h-[230px] w-auto shrink-0 rounded-xl border border-brand-sand/60 bg-white shadow-[0_18px_50px_-20px_rgba(45,45,45,0.4)] sm:h-[290px] lg:h-[350px]"
    />
  );
}

export default function TheSolution() {
  const router = useRouter();
  const reduced = useReducedMotion();

  const handleStartBook = () => {
    trackEvent("start_book_click", { cta_location: "solution_primary" });
    router.push(isFreeTierEnabled() ? "/onboarding/welcome" : "/onboarding");
  };

  // Duplicated so the horizontal track can loop seamlessly (translate -50%).
  const track = [...SPREADS, ...SPREADS];

  return (
    <section
      className="overflow-hidden bg-brand-warm-white py-16 md:py-24"
      aria-labelledby="solution-heading"
    >
      {/* Centered text — airy, so the eye can settle */}
      <motion.div
        className="mx-auto max-w-3xl px-6 text-center"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.7, ease: "easeOut" }}
      >
        <p className="type-eyebrow mb-5">This is Small Plates</p>

        <h2 id="solution-heading" className="type-heading">
          The recipe, the photo, the note. Together on one page.
        </h2>

        <p className="type-body mx-auto mt-6 max-w-2xl">
          Each recipe comes with a photo we make of the dish, and a note from
          the person who sent it. The people who love them never quite leave the
          kitchen.
        </p>

        <div className="mt-9 flex justify-center">
          <button
            type="button"
            onClick={handleStartBook}
            className="btn btn-lg btn-honey"
            data-cta="solution-primary"
          >
            Start their book for free
          </button>
        </div>
      </motion.div>

      {/* Real spreads drifting full-width below — the product argues for itself */}
      <div className="relative mt-14 overflow-hidden md:mt-16">
        {/* Edge fades so spreads ease in and out instead of cutting hard */}
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-brand-warm-white to-transparent md:w-28" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-brand-warm-white to-transparent md:w-28" />

        {reduced ? (
          <div className="flex gap-6 overflow-x-auto px-6 pb-2">
            {SPREADS.map((s, i) => (
              <Spread key={i} src={s.src} alt={s.alt} />
            ))}
          </div>
        ) : (
          <motion.div
            className="flex w-max gap-6"
            animate={{ x: ["0%", "-50%"] }}
            transition={{ ease: "linear", duration: 55, repeat: Infinity }}
          >
            {track.map((s, i) => (
              <Spread
                key={i}
                src={s.src}
                alt={s.alt}
                ariaHidden={i >= SPREADS.length}
              />
            ))}
          </motion.div>
        )}
      </div>
    </section>
  );
}
