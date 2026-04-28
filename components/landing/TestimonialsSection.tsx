"use client";

import { motion } from "framer-motion";
import { TestimonialCard, type Testimonial } from "@/components/landing/TestimonialCard";

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1 },
  },
};

// Cards 1 (Sarah K.) and 5 (David R.) are 2u — photo placeholders until real shots arrive
const testimonials: Testimonial[] = [
  {
    id: 1,
    quote:
      "We had 74 guests submit a recipe. I didn't chase a single one. The book arrived and my sister opened it on the front step.",
    author: "Sarah K.",
    descriptor: "Sister of the bride — Austin, TX",
    photo: "/images/notes_section/grandmas_tatis.jpg",
  },
  {
    id: 2,
    quote:
      "I gave it as a gift. Six months later he texted me a photo of pasta stains on page 34. Best review I've ever gotten.",
    author: "Marcus T.",
    descriptor: "Gift-giver — Brooklyn, NY",
  },
  {
    id: 3,
    quote:
      "The book came out better than I expected. Which is saying something because I expected a lot.",
    author: "Ana L.",
    descriptor: "Mother of the bride — Miami, FL",
  },
  {
    id: 4,
    quote:
      "Guests who said they don't cook submitted the best notes. One wrote three paragraphs about frozen pizza. It's in the book. It's everyone's favorite page.",
    author: "Jamie & Chris",
    descriptor: "Married November 2024",
  },
  {
    id: 5,
    quote:
      "We put it on the registry. 47 people contributed. The book had 80 recipes. My wife uses it every week.",
    author: "David R.",
    descriptor: "Groom — Chicago, IL",
    photo: "/images/notes_section/grandmas_tatis.jpg",
  },
];

export default function TestimonialsSection() {
  return (
    <section
      className="bg-[#FAF7F2] pt-10 md:pt-14 pb-20 md:pb-28"
      aria-labelledby="testimonials-heading"
    >
      <div className="mx-auto max-w-7xl px-6 md:px-8">

        {/* ── Header ── */}
        <motion.div
          className="mb-12 md:mb-14"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <p className="type-eyebrow mb-4">PEOPLE WHO GOT THE BOOK</p>
          <h2 id="testimonials-heading" className="type-heading">
            What happens after the book arrives.
          </h2>
        </motion.div>

        {/* ── Track ──
            Mobile: native horizontal scroll with snap.
            Desktop: same scroll, arrows added in next pass. */}
        <div className="overflow-x-auto -mx-6 px-6 md:-mx-8 md:px-8 no-scrollbar snap-x snap-mandatory md:snap-none">
          <motion.div
            className="flex gap-4 md:gap-5 w-max"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
          >
            {testimonials.map((t) => (
              <TestimonialCard key={t.id} t={t} />
            ))}
          </motion.div>
        </div>

      </div>
    </section>
  );
}
