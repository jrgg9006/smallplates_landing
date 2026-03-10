"use client";

import Image from "next/image";
import { motion } from "framer-motion";

export default function GuestListStrip() {
  return (
    <section
      className="w-full bg-[#FAF7F2] py-16 md:py-20 mb-16 md:mb-24 px-6 md:px-8 text-center"
      style={{
        borderTop: "1px solid rgba(45,45,45,0.07)",
        borderBottom: "1px solid rgba(45,45,45,0.07)",
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="flex flex-col items-center gap-4"
      >
        {/* Platform Badges */}
        <div className="flex items-center gap-4">
          <div
            className="flex items-center justify-center px-4 py-2 rounded-full bg-white border"
            style={{ borderColor: "rgba(45,45,45,0.12)" }}
          >
            <Image
              src="/images/guest_modal/knot_logo.png"
              alt="The Knot"
              width={80}
              height={24}
              className="h-6 w-auto"
            />
          </div>
          <span style={{ color: "rgba(45,45,45,0.2)" }} className="text-base">·</span>
          <div
            className="flex items-center justify-center px-4 py-2 rounded-full bg-white border"
            style={{ borderColor: "rgba(45,45,45,0.12)" }}
          >
            <Image
              src="/images/guest_modal/Zola_Logo.svg"
              alt="Zola"
              width={60}
              height={24}
              className="h-6 w-auto"
            />
          </div>
        </div>

        {/* Headline */}
        <p className="font-serif text-xl md:text-2xl font-normal text-[#2D2D2D]">
          Already on The Knot or Zola?
        </p>

        {/* Subtext */}
        <p className="font-sans font-light text-base text-[#2D2D2D]/50">
          Import your guest list. Send emails requesting recipes in one click.
        </p>
      </motion.div>
    </section>
  );
}
