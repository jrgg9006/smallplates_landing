"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

export default function AboutUs() {
  return (
    <>
      {/* Top Banner with Centered Logo */}
      <header
        role="banner"
        aria-label="Top banner"
        className="w-full bg-white border-b border-gray-200"
      >
        <div className="mx-auto max-w-7xl px-6 md:px-8 h-20 flex items-center justify-center">
          <Link href="/" className="flex-shrink-0">
            <Image
              src="/images/SmallPlates_logo_horizontal.png"
              alt="Small Plates & Company"
              width={180}
              height={36}
              priority
              className="hover:opacity-70 transition-opacity duration-300"
            />
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="min-h-screen bg-white">
        {/* Hero Section */}
        <section className="pt-20 pb-16 md:pt-32 md:pb-24">
          <div className="mx-auto max-w-5xl px-6 md:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="text-center"
            >
              <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl font-medium tracking-tight text-[#2D2D2D] mb-8">
                We believe
              </h1>
              <div className="w-24 h-px bg-[#D4A854] mx-auto mb-8"></div>
              <h2 className="font-serif text-2xl md:text-3xl text-[#2D2D2D]/70 font-light italic">
                wedding gifts should matter.
              </h2>
            </motion.div>
          </div>
        </section>

        {/* Content Section */}
        <section className="pb-24 md:pb-32">
          <div className="mx-auto max-w-3xl px-6 md:px-8">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.3 }}
              className="space-y-8"
            >
              <p className="text-[#2D2D2D] text-lg md:text-xl leading-relaxed font-light first-letter:text-6xl first-letter:font-serif first-letter:float-left first-letter:mr-3 first-letter:mt-1">
                Wedding registries are broken. Another blender gathering dust. Another set of towels that gets returned. Another gift that says nothing about the giver or the life being celebrated.
              </p>
              
              <p className="text-[#2D2D2D] text-lg md:text-xl leading-relaxed font-light">
                We believe food is how families really connect. Not in dining rooms with good china, but in kitchens on Tuesday nights. A recipe isn&apos;t just instructions—it&apos;s presence. It&apos;s your grandmother&apos;s hands guiding yours. It&apos;s love you can taste.
              </p>
              
              <p className="text-[#2D2D2D] text-lg md:text-xl leading-relaxed font-light">
                That&apos;s why we created wedding cookbooks. Not keepsakes that sit on shelves, but kitchen books that get stained and dog-eared. Every page holds a name, a story, a piece of someone who was there. It&apos;s the kind of gift that matters—not because it&apos;s expensive, but because it&apos;s real.
              </p>
              
              <p className="text-[#2D2D2D] text-lg md:text-xl leading-relaxed font-light">
                Because the best wedding gift isn&apos;t something from a store. It&apos;s something from the heart, bound between covers, meant to be opened every time they&apos;re hungry and wondering what to make for dinner.
              </p>
            </motion.div>

            {/* Brand Line Closing */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.6 }}
              className="mt-16 text-center"
            >
              <div className="w-16 h-px bg-[#D4A854] mx-auto mb-8"></div>
              <p className="font-serif text-2xl md:text-3xl text-[#D4A854] italic">
                Still at the table.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Editorial-style bottom spacing */}
        <div className="h-24 md:h-32"></div>
      </main>
    </>
  );
}