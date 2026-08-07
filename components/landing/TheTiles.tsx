"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { trackStartBookClick } from "@/lib/analytics";

/**
 * THE TILES — the second object. Same engine as the book (a group sends
 * recipes, we make the image of every dish), sized for small groups and made
 * for a wall instead of a counter.
 *
 * Reason: price is not final and the format (one tile per dish vs one composed
 * piece) is still open, so the copy describes the outcome, not the layout.
 */

const TILE_PRICE_FROM = 99;

const FACTS = [
  "Two to six people, one recipe each",
  "We make the image of every dish",
  "Arrives framed, ready to hang on a nail",
];

export default function TheTiles({ onStartTiles }: { onStartTiles?: () => void }) {
  const handleClick = () => {
    trackStartBookClick("tiles_section");
    onStartTiles?.();
  };

  return (
    <section
      id="tiles"
      className="bg-brand-warm-white-warm py-20 md:py-28"
      aria-labelledby="tiles-heading"
    >
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-6 md:grid-cols-2 md:px-10">
        <motion.div
          className="relative aspect-[4/5] overflow-hidden rounded-xl bg-brand-sand"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
        >
          <Image
            src="/images/tiles/tiles_kitchen_wall.jpg"
            alt="Framed dishes hanging on a kitchen wall"
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.23, 1, 0.32, 1] }}
        >
          <p className="type-eyebrow mb-5">Framed Tiles</p>

          <h2 id="tiles-heading" className="type-heading">
            The same idea, for your wall.
          </h2>

          <p className="type-body mt-6">
            For a smaller group. Everyone sends the dish they are known for, we
            make the image of each one, and it comes back framed. It hangs in
            the kitchen, next to the calendar.
          </p>

          <ul className="mt-8 space-y-3">
            {FACTS.map((fact) => (
              <li key={fact} className="type-body-small flex items-start gap-3">
                <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-honey" />
                {fact}
              </li>
            ))}
          </ul>

          <div className="mt-10">
            <button
              type="button"
              onClick={handleClick}
              className="btn btn-lg btn-dark"
              data-cta="tiles-primary"
            >
              Start your tiles
            </button>
            <p className="type-caption mt-4">From ${TILE_PRICE_FROM} per tile.</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
