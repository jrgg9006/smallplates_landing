"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

const notes = [
  {
    id: 1,
    text: "Dear Sarah and James — this is a recipe that Grandma Mati gave us many years ago. She typed it up from what her cousin told her, and the original is barely legible now. I hope this recipe always reminds you of the importance of staying close — and what better place than around the kitchen. Keep family legacies alive for your children and grandchildren. With all my love.",
    recipe: "Grandma Mati's Paella",
    from: "Dad",
    image: "/images/notes_section/grandmas_tatis.jpg",
  },
  {
    id: 2,
    text: "Some of my best conversations with Michael have been over a cold beer. No rush, no agenda — just time to catch up and laugh. This is less of a recipe and more of a reminder: always make time for the people you love.",
    recipe: "Ice Cold Beers",
    from: "Jake & Tina",
    image: "/images/notes_section/ice_beers.jpg",
  },
  {
    id: 3,
    text: "For any moment. May it give you the same memories together that it's given me.",
    recipe: "Spanish Tortilla",
    from: "Uncle Roberto",
    image: "/images/notes_section/spanish_tortilla.jpg",
  },
  {
    id: 4,
    text: "This is my grandmother's recipe — super easy, and it was THE dessert at every family gathering. My cousin started selling them and honestly built a little empire because they're that good. I started making them for the people I love most every Christmas. Now it's yours.",
    recipe: "Date & Walnut Pie",
    from: "Cousin Maria",
    image: "/images/notes_section/date_pie_updated1.jpg",
  },
  {
    id: 5,
    text: "May your life together be full of quiet mornings, long breakfasts, and small rituals that become big memories. And when something doesn't turn out perfect, remember that love — like this recipe — always gets better when you make it together.",
    recipe: "Imperfect Pancakes",
    from: "Pilar & Mark",
    image: "/images/notes_section/something_not_perfect.jpg",
  },
  {
    id: 6,
    text: "I learned this recipe in a cooking class the year we lived in Boston. I've made it for countless dinners since — it's delicious and easy. I hope you love it as much as we do!",
    recipe: "Pesto Pasta",
    from: "Aunt Linda",
    image: "/images/notes_section/Pesto_Pasta.jpg",
  },
];

export default function PersonalNotes() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const nextNote = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % notes.length);
  }, []);

  const goToNote = (index: number) => {
    setCurrentIndex(index);
  };

  // Auto-rotate every 8 seconds, pause on hover
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      nextNote();
    }, 10000);

    return () => clearInterval(interval);
  }, [isPaused, nextNote]);

  const currentNote = notes[currentIndex];

  return (
    <section
      className="bg-white py-16 md:py-24 overflow-hidden"
      aria-label="Personal notes from recipe contributors"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="mx-auto max-w-7xl px-6 md:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left side - Image that extends beyond the frame */}
          <div className="relative h-[340px] md:h-[460px] lg:h-[580px] order-2 lg:order-1">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentNote.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="absolute inset-0 top-4 lg:top-12 left-0 lg:-left-[34rem] xl:-left-[42rem] 2xl:-left-[52rem]"
              >
                <div
                  className="relative w-full h-full lg:w-[calc(100%+12rem)] xl:w-[calc(100%+18rem)] 2xl:w-[calc(100%+24rem)]"
                  style={{
                    transform: "rotate(-5deg)",
                    transformOrigin: "center center",
                  }}
                >
                  <Image
                    src={currentNote.image}
                    alt={`${currentNote.recipe} recipe pages`}
                    fill
                    className="object-contain object-center drop-shadow-2xl"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    priority
                  />
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Right side - Text content */}
          <div className="order-1 lg:order-2 lg:pl-8 relative z-10">
            {/* Headline */}
            <motion.h2
              className="font-serif text-2xl md:text-3xl lg:text-4xl text-[#2D2D2D] text-center lg:text-left mb-6"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              Not just recipes. It&apos;s what they write.
            </motion.h2>

            {/* Subtle divider */}
            <div className="flex justify-center lg:justify-start mb-10 md:mb-12">
              <div className="w-16 h-px bg-[#D4D0C8]" />
            </div>

            {/* Note container - fixed height for consistency */}
            <div className="min-h-[200px] md:min-h-[180px] flex flex-col justify-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentNote.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="text-center lg:text-left"
                >
                  {/* The note text */}
                  <blockquote className="font-serif text-lg md:text-xl lg:text-[22px] text-[#2D2D2D] italic leading-relaxed mb-8">
                    &ldquo;{currentNote.text}&rdquo;
                  </blockquote>

                  {/* Recipe name and contributor */}
                  <div className="space-y-1">
                    <p className="font-sans text-[15px] md:text-base font-medium text-[#8A8780]">
                      — {currentNote.recipe}
                    </p>
                    <p className="font-sans text-sm text-[#8A8780]/70">
                      from {currentNote.from}
                    </p>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Navigation dots */}
            <div className="flex justify-center lg:justify-start gap-2 mt-8">
              {notes.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToNote(index)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    index === currentIndex
                      ? "bg-[#D4A854] w-6"
                      : "bg-[#D4D0C8] hover:bg-[#D4A854]/50"
                  }`}
                  aria-label={`Go to note ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
