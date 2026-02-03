"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import RegistryHowToModal from "./RegistryHowToModal";

export default function RegistryInterlude() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <section
      className="bg-white pt-2 pb-10 md:pt-4 md:pb-12"
      aria-label="Registry information for couples"
    >
      <div className="mx-auto max-w-2xl px-6 md:px-8">

        <motion.div
          className="text-center border border-[#E8E0D5] rounded-2xl py-8 px-6 md:py-10 md:px-10"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          {/* Headline - Minion Pro Italic */}
          <h2 className="font-serif text-xl md:text-2xl text-[#2D2D2D] italic mb-3">
            Wait — is this your wedding?
          </h2>

          {/* Body text */}
          <p className="font-sans text-[15px] md:text-base text-[#8A8780] font-light leading-relaxed mb-6">
            You can put this on your registry.<br className="hidden sm:inline" />
            Your people fund it. They fill it. You keep it.
          </p>

          {/* CTA Button - Outline style */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-block font-sans text-sm font-medium text-[#D4A854] border border-[#D4A854] rounded-full px-6 py-2.5 hover:bg-[#D4A854] hover:text-white transition-all duration-200"
          >
            Add to Registry
          </button>
        </motion.div>

      </div>

      <RegistryHowToModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </section>
  );
}
