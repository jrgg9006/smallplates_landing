"use client";

import { motion } from "framer-motion";

const VIEWPORT = { once: true, margin: "-80px" } as const;

const observations = [
  "Después se guardan.",
  "La vajilla espera la cena que nunca llega.",
  "La licuadora vive en su caja. Las copas, en el fondo de la alacena.",
];

export default function RegalosTheProblem() {
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
          Los regalos de boda se abren una vez.
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
            transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
          >
            Los novios escriben las gracias. Y ya.
          </motion.p>
          <motion.p
            className="type-accent-large mt-2"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={VIEWPORT}
            transition={{ duration: 0.7, delay: 0.6, ease: "easeOut" }}
          >
            Hay una forma de regalar algo que sí van a usar.
          </motion.p>
        </div>

      </div>
    </section>
  );
}
