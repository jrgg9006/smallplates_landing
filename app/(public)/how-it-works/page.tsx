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
import CookbookSpecialist from "@/components/landing/CookbookSpecialist";
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
    title: "Just take a picture of the recipe.",
    description:
      "No retyping, no forms. Snap the handwritten card, coffee stains and all, and we turn it into clean text and a designed page. Or type it, if you'd rather.",
  },
  {
    number: "03",
    title: "Send reminders in one click.",
    description:
      "See who's sent a recipe and who hasn't. Nudge everyone still missing with one click. No texting people one by one.",
  },
  {
    number: "04",
    title: "Add captains to help you collect recipes.",
    description:
      "Invite as many people as you want. Each captain gets the same dashboard, and gathers recipes right alongside you. The work never sits on one person.",
  },
];

export default function HowItWorksPage() {
  const router = useRouter();
  const { user } = useAuth();
  // Reason: nunca mandar al onboarding viejo (/onboarding). Logged-out → nuevo flow.
  const handleStart = () => router.push(user ? "/profile/groups" : "/onboarding/welcome");

  // Visuals alineados 1:1 con `steps`.
  const visuals = [
    // Paso 1 — el modal "Collect Recipes" real, en HTML, + toast "Link copied"
    // (causa → efecto, mismo lenguaje que el email del paso 3).
    <div key="s1" className="relative mx-auto w-full max-w-sm pb-5">
      <div className="relative rounded-2xl bg-brand-white p-6 text-center shadow-md ring-1 ring-brand-sand/60 md:p-8">
        <span className="absolute right-4 top-3 text-brand-charcoal/35" aria-hidden>
          &times;
        </span>
        <h4 className="type-subheading">Collect Recipes</h4>
        <p className="type-body-small mt-3 text-brand-charcoal/80">
          Send this link to everyone who should be in the book.
        </p>
        <p className="type-caption mt-2 text-brand-charcoal/50">
          They submit a recipe. We design and print the book. That&rsquo;s it.
        </p>
        <div className="mt-6 rounded-full bg-brand-charcoal py-3">
          <span className="type-body-small text-brand-white">Copy Link</span>
        </div>
        <div className="mt-2.5 rounded-full border border-brand-sand py-3">
          <span className="type-body-small text-brand-charcoal/80">Customize message</span>
        </div>
        <p className="type-caption mt-5 text-brand-charcoal/55 underline underline-offset-2">
          Preview what guests will see
        </p>
      </div>
      <div className="absolute -bottom-1 right-3 flex items-center gap-1.5 rounded-full bg-brand-white px-4 py-2 shadow-lg ring-1 ring-brand-sand">
        <span className="text-[11px] text-brand-honey" aria-hidden>
          &#10003;
        </span>
        <span className="type-caption text-brand-charcoal">Link copied</span>
      </div>
    </div>,
    // Paso 2 — foto real de receta manuscrita + iPhone (CSS) encima con la misma
    // receta ya tipeada en el layout del collection journey. El match caligrafía →
    // texto limpio es el producto. Tipografías raw (text-[7px] etc.): miniatura de UI.
    <div key="s2" className="relative mx-auto max-w-md pb-16 md:mx-0">
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl bg-brand-sand">
        <Image
          src="/images/howitworks_page/Karla_Machado_FRANGO_COM_MANDIOCA.jpeg"
          alt="A handwritten recipe for frango com mandioca, in an old spiral notebook"
          fill
          className="object-cover"
          sizes="(max-width: 1024px) 100vw, 40vw"
        />
      </div>
      {/* iPhone con proporciones reales (~9:19), pantalla completa del journey */}
      <div className="absolute -bottom-12 -right-3 w-52 rotate-[3deg] md:-right-8 md:w-60">
        <div className="flex aspect-[9/18] flex-col overflow-hidden rounded-[2.4rem] border-[7px] border-brand-charcoal bg-brand-white shadow-xl">
          <div className="flex justify-center pt-2.5">
            <div className="h-4 w-20 rounded-full bg-brand-charcoal" />
          </div>
          {/* Pantalla = review step real del collection journey (SummaryStep) */}
          <div className="flex flex-1 flex-col pb-4 pt-2.5">
            <p className="border-b border-brand-sand/60 pb-2 text-center text-[9px] font-medium tracking-wide text-brand-charcoal">
              Small Plates <span className="text-brand-charcoal/50">&amp; Co.</span>
            </p>

            <div className="flex flex-1 flex-col px-4 pt-2.5">
              <div className="flex items-center justify-between">
                <p className="text-[8px] text-brand-charcoal">Review your recipe</p>
                <span className="rounded-full border border-brand-sand px-2 py-0.5 text-[7px] text-brand-charcoal/70">
                  &#9998; Edit
                </span>
              </div>

              <p className="mt-3 text-[7px] uppercase tracking-[0.15em] text-brand-warm-gray">
                Karla Machado
              </p>
              <p className="mt-1 font-serif text-[15px] font-medium leading-snug text-brand-charcoal">
                Frango c/ mandioca
              </p>

              <p className="mt-3 border-t border-brand-sand/60 pt-2 text-[7px] uppercase tracking-[0.15em] text-brand-charcoal/60">
                Ingredients
              </p>
              <p className="mt-1 font-serif text-[8px] leading-relaxed text-brand-charcoal/90">
                mandioca cozida ½ kilo até derreter, amassada e misturada c/
                manteiga
                <br />
                forrar o pirex
              </p>

              <p className="mt-2.5 text-[7px] uppercase tracking-[0.15em] text-brand-charcoal/60">
                Instructions
              </p>
              <p className="mt-1 font-serif text-[8px] leading-relaxed text-brand-charcoal/90">
                1. cozinhar o peito de frango, desfiar e dourar c/ cebola ralada,
                manteiga, sal, molho de tomate
                <br />
                2. joga o molho por cima da massa
                <br />
                3. diluir um copo de requeijão com leite
                <br />
                4. cobre tudo e um pouco de queijo parmesão
                <br />
                5. põe pra assar em forno pré-aquecido
              </p>

              <div className="mt-auto flex items-center gap-2 pt-3">
                <span className="rounded-full border border-brand-sand px-3 py-1.5 text-[8px] text-brand-charcoal/70">
                  Back
                </span>
                <span className="flex-1 rounded-full bg-brand-honey py-1.5 text-center text-[8px] font-medium text-brand-white">
                  Add my creation
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    // Paso 3 — dashboard de quién mandó / quién falta + el recordatorio que sale
    // (causa: botón "Send reminder" → efecto: tarjetita del email, sin honey).
    <div key="s3" className="relative pb-12">
      <div className="rounded-2xl bg-brand-warm-white-warm p-6 md:p-8">
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
      </div>
      {/* Mini ventana de email — el header oscuro replica el "New Email" del producto real.
          El "To:" nombra a los Pending del dashboard: el sistema ya sabe quién falta. */}
      <div className="absolute -bottom-2 right-3 w-72 rotate-2 md:right-6 md:w-80">
        <div className="overflow-hidden rounded-xl bg-brand-white shadow-lg ring-1 ring-brand-sand">
          <div className="bg-brand-charcoal px-4 py-2 text-center">
            <span className="type-caption text-brand-warm-white-warm/90">New Email</span>
          </div>
          <div className="p-4">
            <p className="type-caption text-brand-charcoal/45">
              From: <span className="text-brand-charcoal/75">You</span>
            </p>
            <p className="type-caption mt-0.5 text-brand-charcoal/45">
              To: <span className="text-brand-charcoal/75">John, Carlos</span>
            </p>
            <p className="type-caption mt-1 border-t border-brand-sand pt-1 font-medium leading-snug text-brand-charcoal">
              Reminder: your recipe for Ana &amp; Rich&rsquo;s book
            </p>
            <p className="type-caption mt-1.5 italic leading-snug text-brand-charcoal/60">
              &ldquo;The page is still open. It only takes five minutes.&rdquo;
            </p>
          </div>
        </div>
        <p className="type-caption mt-1.5 pr-1 text-right text-brand-charcoal/50">
          Sent with one tap
        </p>
      </div>
    </div>,
    // Paso 4 — dashboard de captains, fiel al producto real:
    // estado "Waiting to join" + botón dashed de invitar (sin honey, ya gastado en el paso 3).
    <div key="s4" className="rounded-2xl bg-brand-warm-white-warm p-6 md:p-8">
      <p className="type-body-small mb-5 font-medium text-brand-charcoal">Captains</p>
      <div className="space-y-2.5">
        {[
          { n: "You", tag: "Organizer" },
          { n: "Sofía", tag: "Captain" },
          { n: "Marcos", tag: "Captain" },
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
        <div className="flex items-center gap-3 rounded-xl bg-brand-white/60 px-4 py-3">
          <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-brand-sand/60 type-caption text-brand-charcoal/50">
            L
          </span>
          <span className="type-body-small text-brand-charcoal/50">Lucía</span>
          <span className="ml-auto type-caption italic text-brand-charcoal/40">
            Waiting to join
          </span>
        </div>
      </div>
      <div className="mt-4 rounded-xl border border-dashed border-brand-charcoal/25 px-4 py-3 text-center">
        <span className="type-caption text-brand-charcoal/60">+ Invite captain</span>
      </div>
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

  // Badge de tech del paso 2, debajo del copy (mismo estilo que los chips del paso 1).
  const stepTwoTech = (
    <div className="mt-6">
      <span className="type-caption inline-block rounded-full border border-brand-sand bg-brand-white px-4 py-2 text-brand-charcoal/80">
        Image-to-text technology
      </span>
    </div>
  );

  // Tarjeta opcional (sin número, no es un paso del riel) entre el paso 1 y 2.
  // El preview replica el invite mobile real (app/(platform)/event-invite):
  // eyebrow INVITE, foto cuadrada, serif, HOSTED BY / WHEN / WHERE, botón honey.
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

          {/* Mini invite, fiel al template real. Tipografías raw: miniatura de UI. */}
          <div className="mx-auto w-full max-w-[280px]">
            <div className="rounded-2xl bg-brand-white px-6 pb-6 pt-4 shadow-md ring-1 ring-brand-sand/60">
              <p className="text-[8px] uppercase tracking-[0.25em] text-brand-warm-gray">
                Small Plates &amp; Co.{" "}
                <span className="font-bold text-brand-charcoal">Invite</span>
              </p>
              <div className="relative mx-auto mt-5 h-28 w-28 overflow-hidden rounded-lg shadow-md">
                <Image
                  src="/images/howitworks_page/invite_photo.png"
                  alt="The couple, on their digital invite"
                  fill
                  className="object-cover"
                  sizes="112px"
                />
              </div>
              <p className="mt-4 text-center font-serif text-[21px] font-medium leading-tight text-brand-charcoal">
                Ana &amp; Rich
              </p>
              <p className="mt-4 text-center text-[7px] uppercase tracking-[0.2em] text-brand-warm-gray">
                Hosted by
              </p>
              <p className="mt-1 text-center text-[9px] font-medium uppercase tracking-[0.15em] text-brand-charcoal">
                Sofía Martínez
              </p>
              <div className="my-4 h-px bg-brand-charcoal/15" />
              <p className="text-center text-[7px] uppercase tracking-[0.2em] text-brand-warm-gray">
                When
              </p>
              <p className="mt-1 text-center text-[9px] font-medium uppercase tracking-wide text-brand-charcoal">
                Saturday, Oct 12 · 4 PM
              </p>
              <p className="mt-3 text-center text-[7px] uppercase tracking-[0.2em] text-brand-warm-gray">
                Where
              </p>
              <p className="mt-1 text-center text-[9px] font-medium uppercase tracking-wide text-brand-charcoal">
                Sofia&#39;s House
                <br />
                Napa, CA
              </p>
              <div className="mt-5 rounded-full bg-brand-honey py-2 text-center text-[9px] font-medium text-brand-white shadow-md">
                Share a Recipe &rarr;
              </div>
            </div>
            <p className="type-caption mt-2 pr-1 text-right text-brand-charcoal/50">
              The ask travels with the invite
            </p>
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
              The people who love you do.
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
              {/* Invites en pausa (feature deshabilitada). Reactivar: quitar `false &&`. */}
              {false && optionalInvite}
              <JourneyStep step={steps[1]} index={1} visual={visuals[1]} extra={stepTwoTech} />
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
              <h2 className="type-heading mt-4">We make a real, professional cookbook.</h2>
              <p className="type-body-small mt-4 text-brand-charcoal/70">
                You send words: a text, a photo of grandma&rsquo;s card. We design
                the page and create the photo of the dish, made for that exact
                recipe. Nobody has to cook anything for the camera.
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
              <div className="relative mx-auto aspect-[16/10] w-full max-w-5xl overflow-hidden rounded-2xl bg-brand-white shadow-md">
                <Image
                  src="/images/how_it_works_profilesection/SmallPlates_Creamy_Orzo.png"
                  alt="A Creamy Orzo Bake, designed as a finished book page"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 1024px"
                />

                {/* Pins anotando de qué campo salió cada parte (solo desktop;
                    posiciones en % atadas a esta imagen — ajustables con top/left) */}
                <div className="pointer-events-none absolute inset-0 hidden md:block">
                  {[
                    { label: "Title", top: 7, left: 12 },
                    { label: "Note", top: 15, left: 30 },
                    { label: "Ingredients", top: 45, left: 6 },
                    { label: "Instructions", top: 35, left: 36
                     },
                    { label: "Photo — made by us", top: 48, left: 76 },
                  ].map((pin, i) => (
                    <motion.div
                      key={pin.label}
                      className="absolute flex items-center gap-1.5 rounded-full border border-brand-sand bg-brand-white/95 px-3 py-1.5 shadow-md backdrop-blur-sm"
                      style={{ top: `${pin.top}%`, left: `${pin.left}%` }}
                      initial={{ opacity: 0, scale: 0.9, y: 8 }}
                      whileInView={{ opacity: 1, scale: 1, y: 0 }}
                      viewport={{ once: true, margin: "-80px" }}
                      transition={{ duration: 0.45, delay: 0.2 + i * 0.09, ease: easeOut }}
                    >
                      <span className="relative flex h-2 w-2 flex-shrink-0">
                        <span
                          className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-honey opacity-60 motion-reduce:hidden"
                          style={{ animationDelay: `${i * 0.35}s` }}
                        />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-honey" />
                      </span>
                      <span className="type-caption whitespace-nowrap text-brand-charcoal">
                        {pin.label}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Cookbook Specialist — la persona real que revisa el libro antes de
            imprimir. Reusa el componente que ya vive arriba de pricing. */}
        <CookbookSpecialist />

        {/* 5. Cierre: ancla de precio + CTA en una sola tarjeta oscura */}
        <section className="px-2 pb-16 pt-6 md:px-3 md:pb-24 md:pt-8">
          <div className="mx-auto max-w-7xl rounded-[2rem] bg-brand-charcoal px-5 py-16 text-center md:px-10 md:py-20">
            <h2 className="type-heading text-brand-warm-white-warm">
              Free to start.
              <br />
              You pay when the book is ready.
            </h2>
            <p className="type-body mt-5 text-brand-warm-white-warm/70">
              Build the whole thing for free. Pay when you order.
            </p>
            <div className="mt-9">
              <Button
                onClick={handleStart}
                className="rounded-full bg-brand-honey px-10 py-6 text-lg text-brand-white hover:bg-brand-honey-dark"
              >
                Start your book
              </Button>
            </div>
            <div className="mt-7">
              <Link
                href="/pricing"
                className="type-body-small inline-flex items-center gap-1 text-brand-warm-white-warm/60 underline underline-offset-4 transition-colors hover:text-brand-warm-white-warm"
              >
                See pricing <span aria-hidden>→</span>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
      <WhatsAppFAB />
    </>
  );
}
