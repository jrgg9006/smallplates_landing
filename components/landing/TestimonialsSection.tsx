"use client";

import Image from "next/image";
import { motion } from "framer-motion";

type Testimonial = {
  id: number;
  quote: string;
  author: string;
  descriptor: string;
  photo?: string; // add path like "/images/testimonials/sarah-k.jpg" when available
};

const EASE_OUT_SPRING: [number, number, number, number] = [0.22, 1, 0.36, 1];

// Heroicons solid star (viewBox 0 0 24 24)
const STAR_PATH =
  "M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z";

function StarRow() {
  return (
    <div
      className="flex items-center gap-[3px] mb-4"
      role="img"
      aria-label="5 out of 5 stars"
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} width="12" height="12" viewBox="0 0 24 24" className="fill-brand-honey" aria-hidden="true">
          <path d={STAR_PATH} />
        </svg>
      ))}
    </div>
  );
}

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: EASE_OUT_SPRING },
  },
};

const testimonials: Testimonial[] = [
  {
    id: 1,
    quote:
      "We had 74 guests submit a recipe. I didn't chase a single one. The book arrived and my sister opened it on the front step.",
    author: "Sarah K.",
    descriptor: "Sister of the bride — Austin, TX",
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
  },
];

function TestimonialCard({ t }: { t: Testimonial }) {
  const hasPhoto = Boolean(t.photo);

  return (
    <motion.article
      variants={cardVariants}
      className="
        flex-shrink-0 w-[272px] snap-start
        md:w-[300px]
        xl:w-auto xl:flex-shrink
        bg-brand-charcoal rounded-2xl overflow-hidden flex flex-col min-h-[300px]
      "
    >
      {/* Photo top zone — only for cards with a photo (2u layout handled in next pass) */}
      {hasPhoto && (
        <div className="relative h-[188px] w-full flex-shrink-0 overflow-hidden">
          <Image
            src={t.photo!}
            alt=""
            fill
            className="object-cover object-center grayscale"
            sizes="(max-width: 768px) 272px, (max-width: 1024px) 300px, 25vw"
          />
          <div className="absolute inset-0 bg-black/25" />
        </div>
      )}

      {/* ── Body ── */}
      <div className="flex flex-col flex-1 px-6 pt-6 pb-6">
        <StarRow />

        <blockquote className="type-body-small text-white/80 flex-1">
          {t.quote}
        </blockquote>

        <footer className="mt-5 pt-4 border-t border-white/[0.07]">
          <p className="type-eyebrow text-white/85">{t.author}</p>
          <p className="type-caption text-white/40 mt-1.5">{t.descriptor}</p>
        </footer>
      </div>
    </motion.article>
  );
}

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
          <h2
            id="testimonials-heading"
            className="type-heading"
          >
            What happens after the book arrives.
          </h2>
        </motion.div>

        {/* ── Cards ──
            Mobile/tablet: horizontal scroll with snap.
            lg+: 3-column grid.
            xl+: 4-column grid.
            2xl+: 5-column grid (all cards in one row). */}
        <div className="overflow-x-auto -mx-6 px-6 md:-mx-8 md:px-8 xl:overflow-x-visible xl:mx-0 xl:px-0 no-scrollbar">
          <motion.div
            className="
              flex gap-4 md:gap-5 w-max
              xl:grid xl:grid-cols-5 xl:w-auto
            "
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
