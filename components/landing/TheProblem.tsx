"use client";

import { motion } from "framer-motion";

const VIEWPORT = { once: true, margin: "-80px" } as const;

export default function TheProblem() {
  return (
    <section
      className="bg-brand-warm-white-warm py-24 md:py-32 lg:py-40"
      aria-labelledby="belief-heading"
    >
      <div className="mx-auto max-w-3xl px-6 md:px-8 text-center">

        <motion.div
          className="w-10 h-0.5 bg-brand-honey mb-8 mx-auto"
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={VIEWPORT}
          style={{ transformOrigin: "center" }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />

        <motion.h2
          id="belief-heading"
          className="type-heading leading-[1.27]"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={VIEWPORT}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          {/* Reason: intentional 4-line stack for vertical rhythm and personality,
              keeping the break stable across widths instead of letting it wrap */}
          The people
          <br />
          who love you
          <br />
          should <span className="italic text-brand-honey">stay</span>
          <br />
          in your life.
        </motion.h2>

        <motion.p
          className="type-body mt-8 mx-auto max-w-xl"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={VIEWPORT}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
        >
          Not just on the big days. In the ordinary ones too.
        </motion.p>

        <motion.p
          className="type-accent mt-8 text-xl md:text-2xl"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={VIEWPORT}
          transition={{ duration: 0.7, delay: 0.45, ease: "easeOut" }}
        >
          That&rsquo;s what a kitchen is for.
        </motion.p>

      </div>
    </section>
  );
}
