"use client";

import { motion } from "framer-motion";
import { trackEvent } from "@/lib/analytics";

/**
 * PRODUCT ROUTER — three doors under the hero. Sorts intent early without
 * making the visitor leave the page: every card scrolls to the section that
 * explains that product.
 */

type Door = {
  key: string;
  title: string;
  who: string;
  price: string;
  target: string;
};

const GIFT_DOOR: Door = {
  key: "gift",
  title: "A gift cookbook",
  who: "For someone you love, for any occasion.",
  price: "From $169",
  target: "how-it-works",
};

const CLUB_DOOR: Door = {
  key: "club",
  title: "A club cookbook",
  who: "For your group. No occasion needed.",
  price: "From $169",
  target: "club",
};

const TILES_DOOR: Door = {
  key: "tiles",
  title: "Framed tiles",
  who: "For your kitchen wall. Groups of two to six.",
  price: "From $99 per tile",
  target: "tiles",
};

export default function ProductRouter({
  showClub = false,
  showTiles = false,
}: {
  showClub?: boolean;
  showTiles?: boolean;
}) {
  const doors: Door[] = [
    GIFT_DOOR,
    ...(showClub ? [CLUB_DOOR] : []),
    ...(showTiles ? [TILES_DOOR] : []),
  ];

  // Reason: with only the gift door there is nothing to route between, so the
  // section would just repeat the hero.
  if (doors.length < 2) return null;

  const handleClick = (door: Door) => {
    trackEvent("product_door_click", { door: door.key });
    document.getElementById(door.target)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section
      className="bg-brand-warm-white-warm py-14 md:py-20"
      aria-labelledby="router-heading"
    >
      <div className="mx-auto max-w-6xl px-6 md:px-10">
        <h2 id="router-heading" className="type-eyebrow mb-8 text-center">
          What you can make
        </h2>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {doors.map((door, i) => (
            <motion.button
              key={door.key}
              type="button"
              onClick={() => handleClick(door)}
              data-cta={`router-${door.key}`}
              className="rounded-xl border border-brand-charcoal/10 bg-white p-7 text-left transition-colors hover:border-brand-charcoal/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-honey"
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.45, delay: i * 0.08, ease: [0.23, 1, 0.32, 1] }}
            >
              <h3 className="type-subheading mb-2">{door.title}</h3>
              <p className="type-body-small mb-6">{door.who}</p>
              <p className="type-caption">{door.price}</p>
            </motion.button>
          ))}
        </div>
      </div>
    </section>
  );
}
