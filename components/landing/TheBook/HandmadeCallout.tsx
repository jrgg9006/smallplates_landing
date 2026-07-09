"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";

// Reason: the service half of TheBook. The review/photo/design work happens
// after the buyer pays and is invisible by design — this panel names all of
// it explicitly. Both halves carry content: claim on charcoal, checklist on
// cream. No decorative filler.
const services = [
  "Every single recipe reviewed before printing",
  "A full-color photo created for every dish, based on the recipe itself",
  "Typos fixed, measurements standardized",
  "Every page designed, one by one",
];

export default function HandmadeCallout() {
  return (
    <motion.div
      className="mt-16 md:mt-24 grid grid-cols-1 lg:grid-cols-2 rounded-lg overflow-hidden"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.7, ease: "easeOut" }}
    >
      {/* Left Panel — the claim */}
      <div className="bg-brand-charcoal p-10 md:p-14 lg:p-16 flex flex-col justify-center lg:min-h-[400px]">
        <h3 className="font-serif text-3xl md:text-4xl leading-snug text-brand-warm-white-warm">
          Your only job is inviting people.
        </h3>
        <p className="mt-5 font-serif italic text-xl md:text-2xl text-brand-honey">
          We handle everything else.
        </p>
      </div>

      {/* Right Panel — the checklist */}
      <div className="bg-brand-cream p-8 md:p-12 lg:p-14 flex flex-col justify-center">
        <p className="type-eyebrow mb-6">The service</p>
        <ul className="space-y-4">
          {services.map((item) => (
            <li key={item} className="flex items-start gap-3">
              <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-brand-honey">
                <Check className="h-3 w-3 text-white" strokeWidth={3} />
              </span>
              <span className="type-body-small text-brand-charcoal/80">
                {item}
              </span>
            </li>
          ))}
        </ul>

        {/* Reason: the human check happens after payment, not on upload — this
            line states it with the correct timing and gets its own beat. */}
        <div className="mt-6 border-t border-brand-sand pt-5">
          <p className="type-accent text-base md:text-lg text-brand-charcoal/75">
            And before it prints, a real person reads every page. Every time.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
