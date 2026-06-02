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
              <h1 className="type-display mb-8">
                We believe
              </h1>
              <div className="w-24 h-px bg-brand-honey mx-auto mb-8"></div>
              <h2 className="type-accent text-2xl md:text-3xl text-brand-charcoal/70 font-light">
                the people you love shouldn&apos;t disappear from your life.
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
              <p className="type-body text-brand-charcoal first-letter:text-6xl first-letter:font-serif first-letter:float-left first-letter:mr-3 first-letter:mt-1">
                But they do. Not in some dramatic way. They just drift. You stop texting back, the group chat goes quiet, a year turns into three. The people who were everything slowly become people you used to know.
              </p>

              <p className="type-body text-brand-charcoal">
                The big days are never the problem. Everyone shows up for those: the wedding, the birthday, the anniversary. A whole room, all there for you. Then it ends, and everyone scatters back into their own lives.
              </p>

              <p className="type-body text-brand-charcoal">
                That&apos;s why we created Small Plates &amp; Co. We think food is how people really stay close. It&apos;s how we say I love you without saying it. How we say I&apos;m sorry. How we say I miss you.
              </p>

              <p className="type-body text-brand-charcoal">
                So we make a cookbook written by the people who showed up: their recipes, their notes, their handwriting. You open it on a Tuesday, and they&apos;re back in the kitchen with you. The day ends. The people stay.
              </p>
            </motion.div>

            {/* Brand Line Closing */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.6 }}
              className="mt-16 text-center"
            >
              <div className="w-16 h-px bg-brand-honey mx-auto mb-8"></div>
              <p className="type-accent text-2xl md:text-3xl text-brand-honey">
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