"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { trackStartBookClick } from "@/lib/analytics";
import { isFreeTierEnabled } from "@/lib/feature-flags";

/**
 * THE CLUB — the second door into the cookbook. A group writes its own book
 * instead of making one for somebody else. Members, not guests. No surprise.
 */

const BEATS = [
  {
    title: "It has a name.",
    body: "Named after the people in it, never a date. The Ramírez Cookbook Club. The Sunday Club.",
  },
  {
    title: "It has rules.",
    body: "Every club sets its own: what to send, what not to. The rules are half the fun, and they take the pressure off a blank page.",
  },
  {
    title: "The signature is the credential.",
    body: "Everyone signs their recipe, printed exactly as it came in. That is how you know who was at the table.",
  },
  {
    title: "Everyone gets a copy.",
    body: "One hardcover per member, so the same book sits in every one of their kitchens.",
  },
];

export default function TheClub() {
  const router = useRouter();

  const handleStartClub = () => {
    trackStartBookClick("club_section");
    router.push(isFreeTierEnabled() ? "/onboarding/welcome" : "/onboarding");
  };

  return (
    <section
      id="club"
      className="bg-brand-cream py-20 md:py-28"
      aria-labelledby="club-heading"
    >
      <div className="mx-auto max-w-5xl px-6 md:px-10">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
        >
          <p className="type-eyebrow mb-5">The Cookbook Club</p>

          <h2 id="club-heading" className="type-heading">
            A group writes its own cookbook.
          </h2>

          <p className="type-body mx-auto mt-6 max-w-2xl">
            No occasion, nobody to surprise. Friends, a family, the people who
            would all be at the same table if they could. Most cookbook clubs
            cook from someone else&rsquo;s book. This one writes its own.
          </p>
        </motion.div>

        <div className="mt-14 grid grid-cols-1 gap-8 sm:grid-cols-2">
          {BEATS.map((beat, i) => (
            <motion.div
              key={beat.title}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.45, delay: i * 0.08, ease: [0.23, 1, 0.32, 1] }}
            >
              <h3 className="type-subheading mb-2">{beat.title}</h3>
              <p className="type-body-small">{beat.body}</p>
            </motion.div>
          ))}
        </div>

        <div className="mt-14 text-center">
          <button
            type="button"
            onClick={handleStartClub}
            className="btn btn-lg btn-honey"
            data-cta="club-primary"
          >
            Start a club for free
          </button>
          <p className="type-caption mt-4">
            Free to start. You pay when it goes to print.
          </p>
        </div>
      </div>
    </section>
  );
}
