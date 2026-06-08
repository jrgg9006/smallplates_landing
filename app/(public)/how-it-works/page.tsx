"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import Banner from "@/components/landing/Banner";
import WhatsAppFAB from "@/components/landing/WhatsAppFAB";
import JourneyTimeline from "./_components/JourneyTimeline";
import { type JourneyStepData } from "./_components/JourneyStep";

const easeOut: [number, number, number, number] = [0.23, 1, 0.32, 1];

const steps: JourneyStepData[] = [
  {
    number: "01",
    title: "Start your book. Free.",
    description:
      "Set it up in two minutes — a wedding, an anniversary, a birthday, a regular Tuesday. Nothing to pay to begin.",
  },
  {
    number: "02",
    title: "Gather the recipes. Three ways.",
    description:
      "You add them yourself, share a link, or invite a few people to collect alongside you. Your people don't need an app or an account — they type it or snap a photo in five minutes.",
  },
  {
    number: "03",
    title: "We chase the stragglers. You don't.",
    description:
      "Reminders go out until the recipes are in. You never have to nag anyone.",
  },
  {
    number: "04",
    title: "Every recipe becomes a page.",
    description:
      "We make a photo for each recipe and design the page. The messy text message becomes something that belongs on a shelf.",
    cta: { label: "See a recipe page", href: "#the-magic" },
  },
  {
    number: "05",
    title: "We print it. It ships to your door.",
    description:
      "A full-color hardcover, about four weeks start to finish. You only pay when it's ready.",
    cta: { label: "See inside a book", href: "/from-the-book" },
  },
];

function StepImage({
  src,
  alt,
  bg = "bg-brand-sand",
}: {
  src: string;
  alt: string;
  bg?: string;
}) {
  return (
    <div className={`relative aspect-[4/3] w-full overflow-hidden rounded-2xl ${bg}`}>
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover"
        sizes="(max-width: 1024px) 100vw, 50vw"
      />
    </div>
  );
}

export default function HowItWorksPage() {
  const router = useRouter();
  const { user } = useAuth();
  const handleStart = () => router.push(user ? "/profile/groups" : "/onboarding");

  // Visuals alineados 1:1 con `steps`. Pasos 3 (recordatorio) y el "antes" del
  // wedge se renderizan como UI on-brand en markup — no requieren assets nuevos.
  const visuals = [
    <StepImage
      key="s1"
      src="/images/how_it_works_profilesection/add_a_recipe.png"
      alt="Setting up a new book"
      bg="bg-brand-cream"
    />,
    <div key="s2" className="space-y-5">
      <StepImage
        src="/images/HowitWorks_images/collect_iphone_mockup.png"
        alt="Collecting recipes on a phone"
      />
      <div className="flex flex-wrap gap-3">
        {["You add them", "Share a link", "Invite people"].map((c) => (
          <span
            key={c}
            className="type-caption rounded-full border border-brand-sand bg-brand-white px-4 py-2 text-brand-charcoal/80"
          >
            {c}
          </span>
        ))}
      </div>
    </div>,
    <div key="s3" className="rounded-2xl bg-brand-warm-white-warm p-6 md:p-8">
      <div className="space-y-3">
        {[
          "Reminder sent to 3 guests",
          "Reminder sent to 1 guest",
          "Everyone's in",
        ].map((t, i) => (
          <div
            key={t}
            className={`flex items-center gap-3 rounded-xl bg-brand-white px-4 py-3 ${
              i === 2 ? "ring-1 ring-brand-honey" : ""
            }`}
          >
            <span className="h-2.5 w-2.5 flex-shrink-0 rounded-full bg-brand-honey" />
            <span className="type-body-small text-brand-charcoal/80">{t}</span>
          </div>
        ))}
      </div>
    </div>,
    <StepImage
      key="s4"
      src="/images/how_it_works_profilesection/recipe_example_banana.png"
      alt="A designed recipe page"
      bg="bg-brand-cream"
    />,
    <StepImage
      key="s5"
      src="/images/HowitWorks_images/book_in_hand_whitebackgound.png"
      alt="The finished hardcover cookbook"
      bg="bg-brand-cream"
    />,
  ];

  return (
    <>
      {/* Banner real del sitio (con login), sin el strip de shipping */}
      <Banner theme="light" showShippingStrip={false} />

      <main className="bg-brand-white">
        {/* 1. Hero */}
        <section className="px-4 pt-32 pb-12 md:px-6 md:pt-44 md:pb-16">
          <motion.div
            className="mx-auto max-w-5xl text-center"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: easeOut }}
          >
            <h1 className="type-heading">How it works.</h1>
            <p className="type-body mt-5 text-brand-charcoal/70">
              Everyone who shows up sends a recipe. We turn them into a hardcover.
              Here&rsquo;s the whole thing, step by step.
            </p>
          </motion.div>
        </section>

        {/* 2. Timeline de 5 pasos (tarjeta) */}
        <section className="px-2 py-6 md:px-3 md:py-8">
          <div className="mx-auto max-w-7xl rounded-[2rem] bg-brand-warm-white-warm px-5 py-16 md:px-10 md:py-24">
            <JourneyTimeline steps={steps} visuals={visuals} />
          </div>
        </section>

        {/* 3. El wedge / la magia (tarjeta) */}
        <section className="px-2 py-6 md:px-3 md:py-8">
          <div
            id="the-magic"
            className="mx-auto max-w-7xl rounded-[2rem] bg-brand-cream px-5 py-16 md:px-10 md:py-24"
          >
            <div className="mx-auto max-w-2xl text-center">
              <p className="type-eyebrow text-brand-honey">THE MAGIC</p>
              <h2 className="type-subheading mt-4">We make it look good. But how?</h2>
              <p className="type-body-small mt-4 text-brand-charcoal/70">
                You send the real stuff — a text, a photo, a voice note. We make it a book.
              </p>
            </div>

            <div className="mt-14 grid grid-cols-1 items-center gap-8 md:grid-cols-2">
              {/* Antes: mensaje crudo (markup, sin asset) */}
              <div>
                <p className="type-caption mb-3 text-center text-brand-charcoal/50">
                  What they send
                </p>
                <div className="rounded-2xl bg-brand-white p-6">
                  <div className="max-w-[85%] rounded-2xl rounded-bl-sm bg-brand-warm-white-warm px-4 py-3 shadow-sm">
                    <p className="type-body-small text-brand-charcoal/80">
                      grandma&rsquo;s banana bread — 3 very ripe bananas, 1 cup sugar,
                      1½ cups flour, melt some butter, 350 for about an hour. she never
                      measured anything
                    </p>
                  </div>
                </div>
              </div>

              {/* Después: página diseñada */}
              <div>
                <p className="type-caption mb-3 text-center text-brand-charcoal/50">
                  What we make
                </p>
                <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl bg-brand-white shadow-md">
                  <Image
                    src="/images/how_it_works_profilesection/recipe_example_banana.png"
                    alt="The same recipe, designed as a book page"
                    fill
                    className="object-contain"
                    sizes="(max-width: 768px) 100vw, 400px"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4. Objeción #1 */}
        <section className="px-4 py-16 md:px-6 md:py-24">
          <motion.div
            className="mx-auto max-w-3xl text-center"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, ease: easeOut }}
          >
            <h2 className="type-subheading">But what if people don&rsquo;t send anything?</h2>
            <p className="type-body mt-5 text-brand-charcoal/70">
              We send the reminders, so you&rsquo;re not the one texting everyone twice.
              And you can always add recipes yourself. Most books fill up faster than
              people expect.
            </p>
          </motion.div>
        </section>

        {/* 5. Lo que recibes (tarjeta) */}
        <section className="px-2 py-6 md:px-3 md:py-8">
          <div className="mx-auto max-w-7xl rounded-[2rem] bg-brand-sand px-5 py-16 text-center md:px-10 md:py-24">
            <h2 className="type-subheading">What shows up at your door</h2>
            <p className="type-body-small mx-auto mt-4 max-w-xl text-brand-charcoal/70">
              A full-color hardcover, around 80 pages. It lives in the kitchen. It gets
              stained. That&rsquo;s the point.
            </p>
            <div className="relative mx-auto mt-12 aspect-[16/10] max-w-4xl overflow-hidden rounded-2xl bg-brand-white shadow-md">
              <Image
                src="/images/HowitWorks_images/book_in_hand_whitebackgound.png"
                alt="The finished hardcover cookbook"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 896px"
              />
            </div>
          </div>
        </section>

        {/* 6. Ancla de precio */}
        <section className="px-4 py-16 md:px-6 md:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <p className="type-subheading">
              Free to start. You only pay when the book is ready.
            </p>
            <p className="type-body-small mt-4 text-brand-charcoal/70">
              Build the whole thing for free. Pay for the book when you order it —
              backed by our guarantee.
            </p>
            <Link
              href="/#pricing-heading"
              className="type-body-small mt-5 inline-flex items-center gap-1 text-brand-charcoal underline underline-offset-4 transition-colors hover:text-brand-honey"
            >
              See pricing <span aria-hidden>→</span>
            </Link>
          </div>
        </section>

        {/* 7. CTA de cierre (tarjeta oscura) */}
        <section className="px-2 pb-16 md:px-3 md:pb-24">
          <div className="mx-auto max-w-7xl rounded-[2rem] bg-brand-charcoal px-5 py-16 text-center md:px-10 md:py-20">
            <h2 className="type-subheading text-brand-warm-white-warm">
              Ready to start your book?
            </h2>
            <div className="mt-8">
              <Button
                onClick={handleStart}
                className="rounded-full bg-brand-honey px-10 py-6 text-lg text-brand-white hover:bg-brand-honey-dark"
              >
                Start your book
              </Button>
            </div>
            <Link
              href="/"
              className="type-caption mt-8 inline-block text-brand-warm-white-warm/60 transition-colors hover:text-brand-warm-white-warm"
            >
              ← Back to home
            </Link>
          </div>
        </section>
      </main>

      <WhatsAppFAB />
    </>
  );
}
