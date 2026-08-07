"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useInView } from "framer-motion";

const easeOut: [number, number, number, number] = [0.23, 1, 0.32, 1];

const GIFT_STEPS = [
  {
    number: "01",
    title: "You invite.",
    description: "Share a link, an email, or a QR code, or build a simple event invite. Whatever reaches your people. The ask for a recipe comes built in.",
    image: "/images/HowitWorks_images/collect_iphone_mockup.png",
    imageAlt: "Invitation shared via phone",
    imageClass: "object-cover",
    imageBg: "bg-brand-sand",
  },
  {
    number: "02",
    title: "They send a recipe.",
    description: "They type it out or snap a photo. Five minutes, no app, no account. A recipe and a note, in their words.",
    image: "/images/HowitWorks_images/sucess_iphone_mockup.png",
    imageAlt: "Guest submitting a recipe",
    imageClass: "object-cover",
    imageBg: "bg-brand-sand",
  },
  {
    number: "03",
    title: "We make the book.",
    description: "We make an image for every recipe, then design and print the hardcover, shipped to your door. You only pay when it's ready.",
    caption: "Start to delivery, about four weeks.",
    image: "/images/HowitWorks_images/book_in_hand_whitebackgound.png",
    imageAlt: "The finished hardcover cookbook",
    imageClass: "object-cover",
    imageBg: "bg-brand-cream",
  },
] as const;

const CLUB_STEPS = [
  {
    number: "01",
    title: "You start the club.",
    description: "Name it, set your rules, and send the link to your people. Members, not guests: everyone knows who is in.",
    image: "/images/HowitWorks_images/collect_iphone_mockup.png",
    imageAlt: "Invitation shared via phone",
    imageClass: "object-cover",
    imageBg: "bg-brand-sand",
  },
  {
    number: "02",
    title: "Everyone sends a recipe.",
    description: "They type it out or snap a photo, and they sign it. Five minutes, no app, no account. The signature is how you know they were here.",
    image: "/images/HowitWorks_images/sucess_iphone_mockup.png",
    imageAlt: "Member submitting a recipe",
    imageClass: "object-cover",
    imageBg: "bg-brand-sand",
  },
  {
    number: "03",
    title: "Everyone gets a copy.",
    description: "We make an image for every recipe, then design and print the hardcover. It goes out to every member of the club.",
    caption: "Start to delivery, about four weeks.",
    image: "/images/HowitWorks_images/book_in_hand_whitebackgound.png",
    imageAlt: "The finished hardcover cookbook",
    imageClass: "object-cover",
    imageBg: "bg-brand-cream",
  },
] as const;

type Step = (typeof GIFT_STEPS)[number] | (typeof CLUB_STEPS)[number];

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

export default function HowItWorks({ showClubToggle = false }: { showClubToggle?: boolean }) {
  const [mode, setMode] = useState<"gift" | "club">("gift");
  const steps = showClubToggle && mode === "club" ? CLUB_STEPS : GIFT_STEPS;

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
            Send the invite. The recipes come to you.
          </h2>
          <p className="mt-4 type-body text-brand-charcoal/60">
            Then we turn them into a hardcover. Three steps, that&rsquo;s it.
          </p>
        </motion.div>

        {showClubToggle && (
          <div
            role="tablist"
            aria-label="How it works, by book type"
            className="mb-12 flex justify-center gap-2"
          >
            {([
              { key: "gift", label: "As a gift" },
              { key: "club", label: "As a club" },
            ] as const).map((tab) => (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={mode === tab.key}
                onClick={() => setMode(tab.key)}
                className={`type-eyebrow rounded-full px-5 py-2 transition-colors ${
                  mode === tab.key
                    ? "bg-brand-charcoal text-white"
                    : "bg-brand-sand/50 text-brand-charcoal/70 hover:bg-brand-sand"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-6 lg:gap-10 md:items-start">
          {steps.map((step, i) => (
            <StepCard key={`${mode}-${step.number}`} step={step} index={i} />
          ))}
        </div>

        <div className="mt-12 text-center md:mt-16">
          <Link
            href="/how-it-works"
            className="btn btn-lg btn-dark w-full max-w-md px-16 sm:w-auto"
          >
            Learn More
          </Link>
        </div>

      </div>
    </section>
  );
}
