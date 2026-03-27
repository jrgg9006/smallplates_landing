"use client";

import { motion } from "framer-motion";

export default function HandmadeCallout() {
  return (
    <motion.div
      className="mt-16 md:mt-24 grid grid-cols-1 lg:grid-cols-2 rounded-lg overflow-hidden"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.7, ease: "easeOut" }}
    >
      {/* Left Panel — Stitch Pattern Visual */}
      <div className="relative bg-[#2D2D2D] min-h-[280px] lg:min-h-[400px] flex items-center justify-center overflow-hidden">
        {/* Decorative stitch pattern */}
        <div className="flex flex-col items-center gap-0">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center">
              {/* Horizontal stitch line */}
              <div className="relative flex items-center">
                <div className="w-20 h-px bg-[#D4A854]/40" />
                <div className="absolute left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#D4A854]/50" />
              </div>
              {/* Vertical connector (except last) */}
              {i < 6 && (
                <div className="w-px h-2.5 bg-[#D4A854]/25" />
              )}
            </div>
          ))}
        </div>

        {/* Label */}
        <p className="absolute bottom-6 left-0 right-0 text-center font-serif italic text-white/20 text-sm tracking-wide">
          one of a kind
        </p>

        {/* Photo placeholder note */}
        <p className="absolute bottom-3 right-4 text-[10px] uppercase tracking-wider text-white/10">
          Photo: binding close-up
        </p>
      </div>

      {/* Right Panel — Text */}
      <div className="bg-[#F5F1EB] p-8 md:p-12 lg:p-16 flex flex-col justify-center">
        {/* Eyebrow */}
        <p className="type-eyebrow mb-4">
          One of one
        </p>

        <h3 className="type-subheading mb-6">
          Every book is one of a kind.
        </h3>

        <div className="space-y-4">
          <p className="type-body-small text-[#2D2D2D]/80">
            Different recipes. Different people. Different stories. Every book we produce exists exactly once &mdash; because the people inside it are never the same twice.
          </p>

          <p className="type-body-small text-[#2D2D2D]/80">
            No templates. No stock content. Your book is designed, laid out, and printed from scratch &mdash; built around the real recipes your people actually sent in.
          </p>
        </div>

        {/* Pull quote */}
        <blockquote className="mt-8 border-l-2 border-[#D4A854] pl-5">
          <p className="type-accent text-base md:text-lg text-[#2D2D2D]/70 leading-relaxed">
            &ldquo;No two books are the same &mdash; because no two couples&apos; people are the same. That&apos;s the whole point.&rdquo;
          </p>
        </blockquote>
      </div>
    </motion.div>
  );
}
