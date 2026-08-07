"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { trackEvent } from "@/lib/analytics";

/**
 * PRODUCT ROUTER — three doors under the hero. Sorts intent early without
 * making the visitor leave the page: every card scrolls to the section that
 * explains that product.
 */

// Reason: HowItWorks listens for this to reset its gift/club toggle to gift
// when the visitor arrives via the gift door, even if they had switched the
// toggle to club earlier on the page. Module-level constant keeps both sides
// in sync without lifting state.
export const RESET_HOW_IT_WORKS_TO_GIFT_EVENT = "sp:reset-how-it-works-to-gift";

type Door = {
  key: string;
  title: string;
  who: string;
  price: string;
  target: string;
  image: string;
  imageAlt: string;
};

// Reason: every card shows the object, because the whole argument of the brand
// is that we make physical things. The tiles image is a cookbook placeholder
// until a real photo of a framed set exists.
const GIFT_DOOR: Door = {
  key: "gift",
  title: "A gift cookbook",
  who: "For someone you love, for any occasion.",
  price: "From $169",
  target: "how-it-works",
  image: "/images/PricingBlock/pricingblock_7.jpg",
  imageAlt: "Handing over the finished hardcover cookbook",
};

const CLUB_DOOR: Door = {
  key: "club",
  title: "A club cookbook",
  who: "For your group. No occasion needed.",
  price: "From $169",
  target: "club",
  image: "/images/PricingBlock/pricingblock_3.jpg",
  imageAlt: "Reading the cookbook at the table",
};

const TILES_DOOR: Door = {
  key: "tiles",
  title: "Framed tiles",
  who: "For your kitchen wall. Groups of two to six.",
  price: "From $99 per tile",
  target: "tiles",
  image: "/images/PricingBlock/pricingblock_4.jpg",
  imageAlt: "The hardcover cookbook, cover up",
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
    // Reason: a visitor who switched HowItWorks to "As a club" and then picks
    // the gift door should land on gift steps, not whatever they left toggled.
    if (door.key === "gift") {
      window.dispatchEvent(new CustomEvent(RESET_HOW_IT_WORKS_TO_GIFT_EVENT));
    }
    // Reason: respect prefers-reduced-motion instead of always smooth-scrolling.
    const prefersReducedMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.getElementById(door.target)?.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
  };

  // Reason: two doors use two columns, three use three. A dynamically built
  // class like `md:grid-cols-${n}` is invisible to Tailwind's build-time
  // scanner, so the column count is a literal-class lookup instead.
  const gridColsClass = doors.length === 2 ? "md:grid-cols-2" : "md:grid-cols-3";

  return (
    <section
      id="shop"
      className="bg-brand-warm-white-warm py-14 md:py-20"
      aria-labelledby="router-heading"
    >
      <div className="mx-auto max-w-6xl px-6 md:px-10">
        <h2 id="router-heading" className="type-eyebrow mb-8 text-center">
          What you can make
        </h2>

        <div className={`grid grid-cols-1 gap-5 ${gridColsClass}`}>
          {doors.map((door, i) => (
            <motion.button
              key={door.key}
              type="button"
              onClick={() => handleClick(door)}
              data-cta={`router-${door.key}`}
              className="group overflow-hidden rounded-xl border border-brand-charcoal/10 bg-white text-left transition-colors hover:border-brand-charcoal/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-honey"
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.45, delay: i * 0.08, ease: [0.23, 1, 0.32, 1] }}
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-brand-sand">
                <Image
                  src={door.image}
                  alt={door.imageAlt}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
              </div>

              <div className="p-6">
                <h3 className="type-subheading mb-2">{door.title}</h3>
                <p className="type-body-small mb-5">{door.who}</p>
                <p className="type-caption">{door.price}</p>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </section>
  );
}
