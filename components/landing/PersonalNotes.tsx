"use client";

import { motion, type Variants } from "framer-motion";

// Real notes, verbatim — do NOT edit the wording. The note itself is the hero
// here: each card renders the note the way it appears in the book (writer →
// recipe → the message), not a photo of the recipe (those live higher up).
const notes = [
  {
    id: 1,
    recipe: "Grandma Mati's Paella",
    from: "Dad",
    text: "...I hope this recipe always reminds you of the importance of staying close — and what better place than around the kitchen. Keep family legacies alive for your children and grandchildren. With all my love.",
  },
  {
    id: 2,
    recipe: "Ice Cold Beers",
    from: "Jake & Tina",
    text: "Some of my best conversations with Michael have been over a cold beer. No rush, no agenda — just time to catch up and laugh. This is less of a recipe and more of a reminder: always make time for the people you love.",
  },
  {
    id: 3,
    recipe: "Spanish Tortilla",
    from: "Uncle Roberto",
    text: "For any moment. May it give you the same memories together that it's given me.",
  },
  {
    id: 4,
    recipe: "Date & Walnut Pie",
    from: "Cousin Maria",
    text: "...My cousin started selling them and honestly built a little empire because they're that good. I started making them for the people I love most every Christmas. Now it's yours.",
  },
  {
    id: 5,
    recipe: "Imperfect Pancakes",
    from: "Pilar & Mark",
    text: "...May your life together be full of quiet mornings, long breakfasts, and small rituals that become big memories.",
  },
  {
    id: 6,
    recipe: "Pesto Pasta",
    from: "Aunt Linda",
    text: "I learned this recipe in a cooking class the year we lived in Boston. I've made it for countless dinners since — it's delicious and easy. I hope you love it as much as we do!",
  },
];

const containerVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

export default function PersonalNotes() {
  return (
    <section
      className="bg-white py-16 md:py-24"
      aria-label="Personal notes from recipe contributors"
    >
      <div className="mx-auto max-w-7xl px-6 md:px-8">
        {/* Header */}
        <motion.div
          className="max-w-2xl mx-auto text-center mb-14 md:mb-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <p className="type-eyebrow mb-5">Real notes, word for word</p>
          <h2 className="type-heading mb-4">
            A recipe tells you how.
            <span className="block">
              What they write tells you <span className="italic text-brand-honey">who</span>.
            </span>
          </h2>
          <div className="flex justify-center mb-5">
            <div className="w-16 h-px bg-[#D4D0C8]" />
          </div>
          <p className="type-body-small text-brand-charcoal/70">
            Notes that bring the people who shared them to your table.
          </p>
        </motion.div>

        {/* The notes themselves — typeset like a page from the book */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 items-start"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
        >
          {/* 6 on desktop (two rows), first 3 on mobile — cards 4-6 hidden until md. */}
          {notes.map((note, i) => (
            <motion.figure
              key={note.id}
              variants={cardVariants}
              className={`h-full rounded-sm border border-brand-sand bg-white p-6 shadow-[0_16px_44px_-18px_rgba(45,45,45,0.22)] md:p-7 ${
                i >= 3 ? "hidden md:block" : ""
              }`}
            >
              {/* Who wrote it */}
              <figcaption className="type-eyebrow text-[13px] text-brand-charcoal/40">
                {note.from}
              </figcaption>

              {/* Recipe it belongs to */}
              <h3 className="type-subheading mt-2 text-xl md:text-2xl">{note.recipe}</h3>

              {/* Book-style hairline */}
              <div className="mt-4 mb-5 h-px w-10 bg-brand-honey/40" />

              {/* The note, verbatim */}
              <blockquote className="type-accent whitespace-pre-line text-base leading-relaxed text-brand-charcoal/75 md:text-lg">
                {note.text}
              </blockquote>
            </motion.figure>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
