"use client";

import Image from "next/image";
import { motion } from "framer-motion";

export default function FoodPerfect() {
  return (
    <section className="bg-white py-16 md:py-24">
      <div className="mx-auto max-w-5xl px-6 md:px-8">
        <motion.div 
          className="flex justify-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <div className="relative w-full max-w-lg aspect-[4/5] rounded-2xl overflow-hidden shadow-xl">
            <Image
              src="/images/landing/food-perfect-1.jpg"
              alt="Food gathering moment"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 672px"
              priority={false}
            />
            
            {/* Text Overlay */}
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
              <div className="text-center text-white px-6">
                <h2 className="font-serif text-2xl md:text-3xl lg:text-4xl font-medium leading-tight drop-shadow-lg">
                  Food isn&apos;t suppose to be perfect.
                  <br />
                  This book shouldn&apos;t be either.
                </h2>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}