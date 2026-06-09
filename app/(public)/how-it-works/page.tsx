"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import Banner from "@/components/landing/Banner";
import Footer from "@/components/landing/Footer";
import WhatsAppFAB from "@/components/landing/WhatsAppFAB";
import JourneyTimeline from "./_components/JourneyTimeline";
import JourneyStep, { type JourneyStepData } from "./_components/JourneyStep";

const easeOut: [number, number, number, number] = [0.23, 1, 0.32, 1];

const steps: JourneyStepData[] = [
  {
    number: "01",
    title: "Gather the recipes. Three ways.",
    description:
      "Pick whichever way fits. No app, no account for your people. They send a recipe in about five minutes, from their phone.",
  },
  {
    number: "02",
    title: "They snap a photo. We do the rest.",
    description:
      "No retyping, no forms. Your people photograph the handwritten recipe (grandma's card, the back of an envelope, coffee stains and all) and we turn it into clean text and a designed page. Or they type it, if they'd rather.",
  },
  {
    number: "03",
    title: "See who's in. Nudge the rest in one tap.",
    description:
      "Import your guest list, and watch the recipes land in one place. See who's sent theirs and who hasn't, then remind everyone still missing with a single tap, or send a nicer personalized email when you want. You stay in control, without texting anyone one by one.",
  },
  {
    number: "04",
    title: "You don't do this alone. Add captains.",
    description:
      "Invite as many people as you want. Each captain gets the same dashboard you do, and gathers recipes right alongside you. The work spreads out, so it never sits on one person.",
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
  // Reason: nunca mandar al onboarding viejo (/onboarding). Logged-out → nuevo flow.
  const handleStart = () => router.push(user ? "/profile/groups" : "/onboarding/welcome");

  // Visuals alineados 1:1 con `steps`.
  // TODO (imágenes reales): paso 1 → mockup de "collect link"; paso 2 → foto real
  // de una receta a mano junto a la página diseñada (hoy: página + snapshot falso).
  const visuals = [
    <StepImage
      key="s1"
      src="/images/HowitWorks_images/collect_iphone_mockup.png"
      alt="Share a link so your people can send recipes"
    />,
    // Paso 2 — antes/después: la página diseñada + un "snapshot" de la receta a mano.
    <div key="s2" className="relative mx-auto max-w-sm md:mx-0">
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl bg-brand-white shadow-md">
        <Image
          src="/images/how_it_works_profilesection/recipe_example_banana.png"
          alt="A handwritten recipe, redesigned as a clean book page"
          fill
          className="object-contain"
          sizes="(max-width: 1024px) 100vw, 40vw"
        />
      </div>
      <div className="absolute -left-3 -top-4 w-32 rotate-[-6deg] rounded-lg bg-brand-cream p-3 shadow-lg ring-1 ring-brand-sand md:w-36">
        <p className="type-caption mb-1 text-brand-charcoal/45">snapshot from a guest</p>
        <p className="type-caption leading-snug text-brand-charcoal/75">
          3 ripe bananas, 1 cup sugar, 1½ cups flour, 350° ~1hr. Abuela
        </p>
      </div>
    </div>,
    // Paso 3 — dashboard de quién mandó / quién falta (markup on-brand).
    <div key="s3" className="rounded-2xl bg-brand-warm-white-warm p-6 md:p-8">
      <div className="mb-5 flex items-center justify-between">
        <span className="type-body-small font-medium text-brand-charcoal">
          12 of 18 recipes in
        </span>
        <span className="rounded-full bg-brand-honey px-4 py-1.5 type-caption text-brand-white">
          Send reminder
        </span>
      </div>
      <div className="space-y-2.5">
        {[
          { n: "María", sent: true },
          { n: "Tía Lupe", sent: true },
          { n: "John", sent: false },
          { n: "Abuela Carmen", sent: true },
          { n: "Carlos", sent: false },
        ].map((g) => (
          <div
            key={g.n}
            className="flex items-center justify-between rounded-xl bg-brand-white px-4 py-3"
          >
            <span className="type-body-small text-brand-charcoal/80">{g.n}</span>
            <span
              className={`type-caption ${
                g.sent ? "text-brand-honey" : "text-brand-charcoal/40"
              }`}
            >
              {g.sent ? "Sent" : "Pending"}
            </span>
          </div>
        ))}
      </div>
    </div>,
    // Paso 4 — dashboard de captains (markup on-brand).
    <div key="s4" className="rounded-2xl bg-brand-warm-white-warm p-6 md:p-8">
      <div className="mb-5 flex items-center justify-between">
        <span className="type-body-small font-medium text-brand-charcoal">Captains</span>
        <span className="rounded-full bg-brand-honey px-4 py-1.5 type-caption text-brand-white">
          + Invite captain
        </span>
      </div>
      <div className="space-y-2.5">
        {[
          { n: "You", tag: "Organizer" },
          { n: "Sofía", tag: "Captain" },
          { n: "Marcos", tag: "Captain" },
          { n: "Lucía", tag: "Captain" },
        ].map((p) => (
          <div
            key={p.n}
            className="flex items-center gap-3 rounded-xl bg-brand-white px-4 py-3"
          >
            <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-brand-sand type-caption text-brand-charcoal/70">
              {p.n[0]}
            </span>
            <span className="type-body-small text-brand-charcoal/80">{p.n}</span>
            <span className="ml-auto type-caption text-brand-charcoal/40">{p.tag}</span>
          </div>
        ))}
      </div>
      <p className="type-caption mt-4 text-brand-charcoal/50">Invite as many as you want.</p>
    </div>,
  ];

  // Las 3 formas del paso 1, debajo del copy (no de la imagen).
  const stepOneWays = (
    <div className="mt-6 flex flex-wrap gap-3">
      {["Add them yourself", "Share a link", "Invite captains"].map((c) => (
        <span
          key={c}
          className="type-caption rounded-full border border-brand-sand bg-brand-white px-4 py-2 text-brand-charcoal/80"
        >
          {c}
        </span>
      ))}
    </div>
  );

  // Tarjeta opcional (sin número, no es un paso del riel) entre el paso 1 y 2.
  // TODO: reemplazar el preview falso por screenshots reales del builder.
  const optionalInvite = (
    <div className="lg:pl-16">
      <div className="overflow-hidden rounded-2xl border border-dashed border-brand-sand bg-brand-white/70">
        <div className="grid grid-cols-1 items-center gap-6 p-6 md:grid-cols-2 md:gap-10 md:p-8">
          <div>
            <p className="type-eyebrow text-brand-warm-gray">OPTIONAL</p>
            <h3 className="type-subheading mt-3">Need an invite? Make a digital one.</h3>
            <p className="type-body-small mt-3 text-brand-charcoal/70">
              Build an invite for the shower, the anniversary, the wedding (photo,
              date, address) with the recipe ask built right in. Most people just
              share a link. This is here if you want it.
            </p>
          </div>

          {/* Preview falso de la invitación */}
          <div className="overflow-hidden rounded-2xl bg-brand-white shadow-sm">
            <div className="aspect-[5/3] bg-brand-sand" />
            <div className="space-y-1 p-5">
              <p className="type-subheading">Ana &amp; Rich</p>
              <p className="type-caption text-brand-charcoal/60">
                Saturday, Oct 12 · 4pm · Napa, CA
              </p>
              <span className="mt-2 inline-block rounded-full bg-brand-cream px-3 py-1 type-caption text-brand-charcoal/70">
                + Send us your recipe
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Banner real del sitio (con login), sin el strip de shipping */}
      <Banner theme="light" showShippingStrip={false} />

      <main className="bg-brand-white">
        {/* 1. Hero — el wedge en grande */}
        <section className="px-4 pt-32 pb-12 md:px-6 md:pt-44 md:pb-16">
          <motion.div
            className="mx-auto max-w-5xl text-center"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: easeOut }}
          >
            <p className="type-eyebrow text-brand-honey">HOW IT WORKS</p>
            <h1 className="type-heading mt-4 [text-wrap:balance]">
              You don&rsquo;t write this book.
              <br className="hidden md:block" />{" "}
              The people who show up do.
            </h1>
            <p className="type-body mt-5 text-brand-charcoal/70">
              From the first &ldquo;send me your recipe&rdquo; to the hardcover on your
              counter. Here&rsquo;s the whole thing.
            </p>
          </motion.div>
        </section>

        {/* 2. Timeline (tarjeta) */}
        <section className="px-2 py-6 md:px-3 md:py-8">
          <div className="mx-auto max-w-7xl rounded-[2rem] bg-brand-warm-white-warm px-5 py-16 md:px-10 md:py-24">
            <JourneyTimeline>
              <JourneyStep step={steps[0]} index={0} visual={visuals[0]} extra={stepOneWays} />
              {optionalInvite}
              <JourneyStep step={steps[1]} index={1} visual={visuals[1]} />
              <JourneyStep step={steps[2]} index={2} visual={visuals[2]} />
              <JourneyStep step={steps[3]} index={3} visual={visuals[3]} />
            </JourneyTimeline>
          </div>
        </section>

        {/* Respiro emocional — tarjeta compacta con CTA (bloque de aire) */}
        <section className="px-2 py-6 md:px-3 md:py-8">
          <motion.div
            className="mx-auto max-w-7xl rounded-[2rem] bg-brand-charcoal px-6 py-12 text-center shadow-xl md:px-10 md:py-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, ease: easeOut }}
          >
            <div className="mx-auto mb-7 h-0.5 w-10 bg-brand-honey" />
            <h2 className="type-heading leading-[1.27] text-brand-warm-white-warm">
              The people who love you
              <br />
              should <span className="italic text-brand-honey">stay</span> in your life.
            </h2>
            <p className="type-body mt-6 text-brand-warm-white-warm/70">
              Not just on the big days. In the ordinary ones too.
            </p>
            <p className="type-accent mt-4 text-brand-warm-white-warm/90">
              That&rsquo;s what a kitchen is for.
            </p>
            <div className="mt-9">
              <Button
                onClick={handleStart}
                className="rounded-full bg-brand-honey px-10 py-6 text-lg text-brand-white hover:bg-brand-honey-dark"
              >
                Start your book
              </Button>
            </div>
          </motion.div>
        </section>

        {/* El wedge / la magia — antes (texto crudo) → después (página diseñada) */}
        <section className="px-2 py-6 md:px-3 md:py-8">
          <div
            id="the-magic"
            className="mx-auto max-w-7xl rounded-[2rem] bg-brand-cream px-5 py-12 md:px-10 md:py-16"
          >
            <div className="mx-auto max-w-2xl text-center">
              <p className="type-eyebrow text-brand-honey">THE MAGIC</p>
              <h2 className="type-heading mt-4">We make a real, professional cookbook. But how?</h2>
              <p className="type-body-small mt-4 text-brand-charcoal/70">
                You send the real stuff: a text, a photo, a voice note. We make it a book.
              </p>
            </div>

            <div className="mx-auto mt-10 max-w-6xl">
              {/* Antes: la receta llenándose como un formulario, dos columnas */}
              <p className="type-caption mb-4 text-center text-brand-charcoal/50">
                What they send
              </p>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {/* Izquierda: title, ingredients, notes apilados */}
                <div className="space-y-4">
                  <div>
                    <p className="type-eyebrow mb-1.5 text-brand-warm-gray">Recipe title</p>
                    <div className="rounded-lg border border-brand-sand bg-brand-white px-4 py-2.5">
                      <p className="type-caption text-brand-charcoal">A Creamy Orzo Bake</p>
                    </div>
                  </div>
                  <div>
                    <p className="type-eyebrow mb-1.5 text-brand-warm-gray">Ingredients</p>
                    <div className="rounded-lg border border-brand-sand bg-brand-white px-4 py-2.5">
                      <p className="type-caption text-brand-charcoal/80">
                        1 lb of orzo, 32 oz of broth (I like chicken), garlic and herb
                        Boursin and parmesan, sun-dried tomatoes, protein of choice
                        (chicken, Italian sausage, or chicken sausage), spinach (more than
                        you&rsquo;d think), as much garlic as you&rsquo;d like, seasonings
                        (oregano, red pepper, salt, pepper)
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="type-eyebrow mb-1.5 text-brand-warm-gray">Notes</p>
                    <div className="rounded-lg border border-brand-sand bg-brand-white px-4 py-2.5">
                      <p className="type-caption text-brand-charcoal/80">
                        I&rsquo;m so grateful to share a signature recipe with you both. I
                        hope it brings you warmth and comfort. Love you guys!
                      </p>
                    </div>
                  </div>
                </div>

                {/* Derecha: steps, ocupa todo el alto */}
                <div className="flex flex-col">
                  <p className="type-eyebrow mb-1.5 text-brand-warm-gray">Steps</p>
                  <div className="flex-1 rounded-lg border border-brand-sand bg-brand-white px-4 py-2.5">
                    <p className="type-caption text-brand-charcoal/80">
                      In an oven-safe dish (Le Creuset for clout), place Boursin in the
                      middle of the dish. Add orzo, sun-dried tomatoes (including its oil),
                      and seasonings around the cheese. Pour in all the broth. Cover and
                      bake at 425&deg;F for about 30 minutes. Cook the protein of your
                      choosing; pan-fried or baking is great. Remove from oven and mix the
                      Boursin into the cooked rice. Add spinach and parmesan to thicken.
                      Simmer on the stovetop to thicken. Bone apple tea!
                      <span className="ml-1 inline-block h-4 w-0.5 animate-pulse bg-brand-honey align-middle" />
                    </p>
                  </div>
                </div>
              </div>

              {/* Después: página diseñada */}
              <p className="type-caption mb-3 mt-10 text-center text-brand-charcoal/50">
                Generated Recipe Page
              </p>
              <div className="relative mx-auto aspect-[16/10] w-full max-w-4xl overflow-hidden rounded-2xl bg-brand-white shadow-md">
                <Image
                  src="/images/how_it_works_profilesection/SmallPlates_Creamy_Orzo.png"
                  alt="A Creamy Orzo Bake, designed as a finished book page"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 896px"
                />
              </div>
            </div>
          </div>
        </section>

        {/* 5. Ancla de precio */}
        <section className="px-4 py-16 md:px-6 md:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <p className="type-subheading">
              Free to start. You only pay when the book is ready.
            </p>
            <p className="type-body-small mt-4 text-brand-charcoal/70">
              Build the whole thing for free. Pay for the book when you order it,
              backed by our guarantee.
            </p>
            <Link
              href="/pricing"
              className="type-body-small mt-5 inline-flex items-center gap-1 text-brand-charcoal underline underline-offset-4 transition-colors hover:text-brand-honey"
            >
              See pricing <span aria-hidden>→</span>
            </Link>
          </div>
        </section>

        {/* 6. CTA de cierre (tarjeta oscura) */}
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

      <Footer />
      <WhatsAppFAB />
    </>
  );
}
