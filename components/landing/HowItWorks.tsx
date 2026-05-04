"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion, useInView } from "framer-motion";

const easeOut: [number, number, number, number] = [0.23, 1, 0.32, 1];

const steps = [
  {
    number: "01",
    title: "You invite.",
    description: "Add your guests. Share one link.",
    image: "/images/HowitWorks_images/collect_iphone_mockup.png",
    imageAlt: "Invitation shared via phone",
    imageClass: "object-cover",
    imageBg: "bg-brand-sand",
  },
  {
    number: "02",
    title: "They send recipes.",
    description: "Their favorites. Their stories. We send the reminders.",
    image: "/images/HowitWorks_images/sucess_iphone_mockup.png",
    imageAlt: "Guest submitting a recipe",
    imageClass: "object-cover",
    imageBg: "bg-brand-sand",
  },
  {
    number: "03",
    title: "We make the book.",
    description: "Designed. Printed. Hardcover. Delivered.",
    caption: "Start to delivery, around four weeks.",
    image: "/images/HowitWorks_images/book_in_hand_whitebackgound.png",
    imageAlt: "The finished hardcover cookbook",
    imageClass: "object-cover",
    imageBg: "bg-brand-cream",
  },
] as const;

type Step = (typeof steps)[number];

function StepCard({ step, index }: { step: Step; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0 });
  const hasCaption = "caption" in step;

  return (
    <div>
      <motion.div
        ref={ref}
        className={`relative aspect-[4/5] rounded-xl overflow-hidden ${step.imageBg}`}
        initial={{ clipPath: "inset(0 0 100% 0)" }}
        animate={{ clipPath: isInView ? "inset(0 0 0% 0)" : "inset(0 0 100% 0)" }}
        transition={{ duration: 0.75, delay: index * 0.12, ease: easeOut }}
      >
        <Image
          src={step.image}
          alt={step.imageAlt}
          fill
          className={step.imageClass}
          sizes="(max-width: 768px) 100vw, 33vw"
          priority={index === 0}
        />
      </motion.div>

      <motion.div
        className="mt-6"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: isInView ? 1 : 0, y: isInView ? 0 : 8 }}
        transition={{ duration: 0.45, delay: index * 0.12 + 0.3, ease: easeOut }}
      >
        <p className="type-eyebrow mb-3">{step.number}</p>
        <h3 className="type-subheading mb-2">{step.title}</h3>
        <p className="type-body-small">{step.description}</p>
        {hasCaption && (
          <p className="type-caption mt-4">{step.caption}</p>
        )}
      </motion.div>
    </div>
  );
}

export default function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="bg-brand-warm-white-warm py-20 md:py-28"
      aria-labelledby="how-it-works-heading"
    >
      <div className="mx-auto max-w-6xl px-6 md:px-10">

        <motion.div
          className="text-center mb-14 md:mb-20"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5, ease: easeOut }}
        >
          <h2 id="how-it-works-heading" className="type-heading">
            Here&apos;s how it happens.
          </h2>
          <p className="mt-4 type-body text-brand-charcoal/60">
            Three steps. Easier than you think.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-6 lg:gap-10 md:items-start">
          {steps.map((step, i) => (
            <StepCard key={step.number} step={step} index={i} />
          ))}
        </div>

      </div>
    </section>
  );
}
