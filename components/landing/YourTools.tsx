"use client";

import Image from "next/image";
import { motion } from "framer-motion";

/**
 * YOUR TOOLS — 3-card feature section for the MOH
 * Shows: Captains, Email/SMS invites, Dashboard
 * Layout inspired by The Knot's planning cards
 */

const cards = [
  {
    label: "Team up",
    title: "Captains",
    description:
      "Add friends to help. They invite guests from their side, and everyone splits the cost. You don\u2019t do this alone.",
  },
  {
    label: "Collect recipes",
    title: "Emails & SMS",
    description:
      "Share a link or send emails in one click. Import your guest list from Zola or The Knot, hit send, and you\u2019re done.",
  },
  {
    label: "Stay in control",
    title: "Dashboard",
    description:
      "See who\u2019s submitted, who hasn\u2019t, and how the book is coming along. All from your phone.",
  },
];

export default function YourTools() {
  return (
    <section className="bg-[#FAF7F2] py-16 md:py-24" aria-labelledby="your-tools-heading">
      <div className="mx-auto max-w-7xl px-6 md:px-8">
        {/* Section header */}
        <motion.div
          className="text-center mb-12 md:mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <h2
            id="your-tools-heading"
            className="type-heading"
          >
            Everything you need to pull this off.
          </h2>
          <p className="mt-4 type-body text-brand-charcoal/50">
            Without losing your mind.
          </p>
        </motion.div>

        {/* 3-card grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {cards.map((card, i) => (
            <motion.div
              key={card.title}
              className="bg-white rounded-2xl border border-[#E8E0D5] overflow-hidden flex flex-col"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.1, ease: "easeOut" }}
            >
              <div className="p-8 md:p-10 lg:p-12 text-center">
                <p className="type-eyebrow mb-3">
                  {card.label}
                </p>
                <h3 className="type-subheading mb-4">
                  {card.title}
                </h3>
                <p className="type-body-small text-brand-charcoal/60">
                  {card.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Zola / The Knot strip — hidden for now
        <motion.div
          className="mt-12 md:mt-16 text-center"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <div className="flex items-center justify-center gap-16 mb-8 mt-24 opacity-50">
              <Image
                src="/images/guest_modal/knot_logo.png"
                alt="The Knot"
                width={100}
                height={32}
                className="h-7 w-auto"
              />
              <Image
                src="/images/guest_modal/Zola_Logo.svg"
                alt="Zola"
                width={80}
                height={32}
                className="h-7 w-auto"
              />
          </div>
          <p className="font-serif text-xl md:text-2xl font-normal text-brand-charcoal">
            Bring the guest list from The Knot or Zola
          </p>
          <p className="mt-2 font-sans font-light text-base text-brand-charcoal/50 max-w-md mx-auto">
            The guest list is already built. Get it from the couple, import it, and invite everyone&mdash;even the people you&apos;ve never met.
          </p>
        </motion.div>
        */}
      </div>
    </section>
  );
}
