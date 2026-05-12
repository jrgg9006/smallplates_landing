"use client";

import { motion } from "framer-motion";

const VIEWPORT = { once: true, margin: "-80px" } as const;

const observations = [
  "Las cenas largas. Los caldos de domingo.",
  "El olor que llegaba a la puerta antes que la persona.",
  "Esa forma de querer no termina cuando se casan. Solo cambia de cocina.",
];

export default function RegalosUSATheProblem() {
  return (
    <section
      className="bg-brand-warm-white-warm py-20 md:py-28 lg:py-32"
      aria-labelledby="problem-heading"
    >
      <div className="mx-auto max-w-3xl px-6 md:px-8 text-center md:text-left">

        <motion.div
          className="w-8 h-0.5 bg-brand-honey mb-6 mx-auto md:mx-0"
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={VIEWPORT}
          style={{ transformOrigin: "left" }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />

        <motion.h2
          id="problem-heading"
          className="type-heading"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={VIEWPORT}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          Su cocina nunca fue solo una cocina.
        </motion.h2>

        <div className="mt-8 md:mt-10 space-y-4">
          {observations.map((line, i) => (
            <motion.p
              key={line}
              className="type-statement"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={VIEWPORT}
              transition={{ duration: 0.6, delay: 0.15 + i * 0.15, ease: "easeOut" }}
            >
              {line}
            </motion.p>
          ))}
        </div>

        <div className="mt-12 md:mt-16">
          <motion.p
            className="type-accent-large"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={VIEWPORT}
            transition={{ duration: 0.7, delay: 0.4, ease: "easeOut" }}
          >
            Que su nueva cocina tampoco lo sea.
          </motion.p>
        </div>

      </div>
    </section>
  );
}
