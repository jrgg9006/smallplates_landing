"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { RESET_HOW_IT_WORKS_TO_COOKBOOK_EVENT } from "@/components/landing/ProductRouter";

const easeOut: [number, number, number, number] = [0.23, 1, 0.32, 1];

const COOKBOOK_STEPS = [
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

// Reason: steps 01 and 02 are the same mechanic for both products, so only the
// group size and the finished object change. The images are cookbook photos
// standing in until real tile photography exists.
const TILES_STEPS = [
  {
    number: "01",
    title: "You invite.",
    description: "Share a link with your group, two to six people. Whatever reaches them. The ask for a recipe comes built in.",
    image: "/images/HowitWorks_images/collect_iphone_mockup.png",
    imageAlt: "Invitation shared via phone",
    imageClass: "object-cover",
    imageBg: "bg-brand-sand",
  },
  {
    number: "02",
    title: "They send a recipe.",
    description: "They type it out or snap a photo. Five minutes, no app, no account. One dish each, the one they are known for.",
    image: "/images/HowitWorks_images/sucess_iphone_mockup.png",
    imageAlt: "Guest submitting a recipe",
    imageClass: "object-cover",
    imageBg: "bg-brand-sand",
  },
  {
    number: "03",
    title: "We make the tiles.",
    description: "We make an image of every dish, then print and frame them. They arrive ready to hang on a nail.",
    image: "/images/HowitWorks_images/book_in_hand_whitebackgound.png",
    imageAlt: "The finished framed tiles",
    imageClass: "object-cover",
    imageBg: "bg-brand-cream",
  },
] as const;

type Step = (typeof COOKBOOK_STEPS)[number] | (typeof TILES_STEPS)[number];

const TOGGLE_TABS = [
  { key: "cookbook", label: "Cookbook" },
  { key: "tiles", label: "Kitchen Tiles" },
] as const;

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

export default function HowItWorks({ showTilesToggle = false }: { showTilesToggle?: boolean }) {
  const [mode, setMode] = useState<"cookbook" | "tiles">("cookbook");
  const steps = showTilesToggle && mode === "tiles" ? TILES_STEPS : COOKBOOK_STEPS;
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    // Reason: no-op unless the toggle exists — nothing to reset otherwise, and
    // this also keeps the listener from ever mounting in the flags-off path.
    if (!showTilesToggle) return;
    const resetToCookbook = () => setMode("cookbook");
    window.addEventListener(RESET_HOW_IT_WORKS_TO_COOKBOOK_EVENT, resetToCookbook);
    return () => window.removeEventListener(RESET_HOW_IT_WORKS_TO_COOKBOOK_EVENT, resetToCookbook);
  }, [showTilesToggle]);

  const handleTabKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    index: number
  ) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const direction = event.key === "ArrowRight" ? 1 : -1;
    const nextIndex = (index + direction + TOGGLE_TABS.length) % TOGGLE_TABS.length;
    setMode(TOGGLE_TABS[nextIndex].key);
    tabRefs.current[nextIndex]?.focus();
  };

  const panelProps = showTilesToggle
    ? {
        role: "tabpanel" as const,
        id: "how-it-works-panel",
        "aria-labelledby": `how-it-works-tab-${mode}`,
      }
    : {};

  return (
    <section
      id="how-it-works"
      className="bg-brand-warm-white py-20 md:py-28"
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
            Send one link. Everyone&rsquo;s in.
          </h2>
          <p className="mt-4 type-body text-brand-charcoal/60">
            They each send a recipe. We turn it into something that lives in
            your kitchen. Three steps, that&rsquo;s it.
          </p>
        </motion.div>

        {showTilesToggle && (
          <div
            role="tablist"
            aria-label="How it works, by product"
            className="mb-12 flex justify-center gap-2"
          >
            {TOGGLE_TABS.map((tab, index) => (
              <button
                key={tab.key}
                ref={(el) => {
                  tabRefs.current[index] = el;
                }}
                type="button"
                role="tab"
                id={`how-it-works-tab-${tab.key}`}
                aria-controls="how-it-works-panel"
                aria-selected={mode === tab.key}
                tabIndex={mode === tab.key ? 0 : -1}
                onClick={() => setMode(tab.key)}
                onKeyDown={(event) => handleTabKeyDown(event, index)}
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

        <div
          className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-6 lg:gap-10 md:items-start"
          {...panelProps}
        >
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
