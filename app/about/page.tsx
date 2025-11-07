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
              <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl font-medium tracking-tight text-gray-900 mb-8">
                About Us
              </h1>
              <div className="w-24 h-px bg-gray-300 mx-auto mb-8"></div>
              <h2 className="font-serif text-2xl md:text-3xl text-gray-700 font-light italic">
                Small plates: dishes to share.
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
              <p className="text-gray-700 text-lg md:text-xl leading-relaxed font-light first-letter:text-6xl first-letter:font-serif first-letter:float-left first-letter:mr-3 first-letter:mt-1">
                Small plates are the kind of dishes we order when we're together — plates meant to be passed around, shared, and enjoyed by everyone. Where the food isn't what matters most, but the people, the laughter, the moment, the connection that stays long after the meal.
              </p>
              
              <p className="text-gray-700 text-lg md:text-xl leading-relaxed font-light">
                We believe food is the most human way to connect. Recipes aren't just instructions — they're stories, memories, and gifts passed from one person to another. The things we keep in our homes should matter — they should remind us of who we are and who we love.
              </p>
              
              <p className="text-gray-700 text-lg md:text-xl leading-relaxed font-light">
                That's why we created Small Plates & Co. Not about perfect cooking, but about the people who make life feel full. Every page holds a name, a note, a story — reminders of love and connection. More than recipes, it's memory: bound, beautiful, and meant to live in your kitchen every day.
              </p>
              
              <p className="text-gray-700 text-lg md:text-xl leading-relaxed font-light">
                Because in the end, it's never just about the food. It's about the people, the laughter, the feeling of being together. That's what we want to preserve.
              </p>
            </motion.div>

            {/* Elegant closing */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.6 }}
              className="mt-16 text-center"
            >
              <div className="w-16 h-px bg-gray-300 mx-auto"></div>
            </motion.div>
          </div>
        </section>

        {/* Editorial-style bottom spacing */}
        <div className="h-24 md:h-32"></div>
      </main>
    </>
  );
}