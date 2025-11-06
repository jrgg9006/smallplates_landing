"use client";

import React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import CTAButton from "./CTAButton";

export default function Hero() {
  const router = useRouter();

  const handleGetStarted = () => {
    router.push("/onboarding");
  };

  return (
    <section
      aria-labelledby="hero-title"
      className="relative min-h-[600px] md:min-h-[700px] flex items-center"
    >
      {/* Background image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/landing/landing_hero_image2.jpg"
          alt=""
          fill
          className="object-cover"
          priority
          aria-hidden="true"
        />
        {/* Optional overlay for better text contrast */}
        <div className="absolute inset-0 bg-black/10"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 w-full px-6 md:px-12 lg:px-16 py-16 md:py-24">
        <div className="max-w-2xl">
          <motion.h1 
            id="hero-title" 
            className="font-serif text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-medium tracking-tight text-white drop-shadow-lg"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          >
            The&nbsp;People&nbsp;behind<br />
            every&nbsp;Recipe
          </motion.h1>
          <motion.p 
            className="font-sans mt-4 text-xl sm:text-2xl md:text-3xl font-normal text-white/90 max-w-prose drop-shadow"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }}
          >
            Invite your favorite people to share their unique recipes — we turn them into a printed cookbook.
          </motion.p>
          <motion.div 
            className="mt-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8, ease: "easeOut" }}
          >
            <CTAButton data-cta="hero-primary" onClick={handleGetStarted} />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
