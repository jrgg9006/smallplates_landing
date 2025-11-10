"use client";

import { motion } from "framer-motion";
import { EditorialStickyScroll } from "@/components/ui/editorial-sticky-scroll";

export default function PlayModeSelection() {
  const playModeContent = [
    {
      number: "01",
      title: "For Yourself",
      description: "Create your book by yourself collecting recipes from all your friends and family.",
      additionalText: "Perfect for personal milestones, family heritage, or when you want full creative control over your cookbook's narrative.",
      image: "/images/play_mode/For_yourself.jpg",
      alt: "Single fork on ceramic plate representing individual cookbook creation"
    },
    {
      number: "02",
      title: "For a Group",
      description: "Bring your favorite people together and share your favorite recipes. All get a copy of this book.",
      additionalText: "Ideal for clubs, communities, or friend groups who want to create something meaningful together.",
      image: "/images/play_mode/For_a_group.jpg",
      alt: "Two forks on ceramic plate representing group cookbook creation"
    }
  ];

  return (
    <section className="bg-white pt-16 pb-8 md:pt-20 md:pb-12 relative">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
      
      <div className="mx-auto max-w-7xl px-6 md:px-8">
        {/* Section Header */}
        <motion.div 
          className="text-center mb-12 lg:mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-medium text-gray-900 leading-tight mb-3">
            Make it your own way
          </h2>
          <p className="text-base md:text-lg text-gray-600 font-light leading-relaxed max-w-xl mx-auto">
            Whether you want to create solo or bring people together, we&apos;ve made it simple and meaningful
          </p>
        </motion.div>

        {/* Sticky Scroll Content */}
        <div className="mt-8">
          <EditorialStickyScroll content={playModeContent} />
        </div>
      </div>
    </section>
  );
}