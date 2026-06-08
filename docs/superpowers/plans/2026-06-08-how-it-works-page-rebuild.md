# How It Works Page Rebuild — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reconstruir `/how-it-works` como un recorrido secuencial de 5 pasos estilo Remento (timeline vertical, voz Margot, sistema `type-*`), y enlazarla desde el `HowItWorks` del landing.

**Architecture:** Una page client-component (`app/(public)/how-it-works/page.tsx`) que orquesta secciones inline (hero, timeline, wedge, objeción, resultado, pricing, CTA) + un componente reutilizable `JourneyStep` para cada paso del timeline. Animaciones con `framer-motion`, igual que el resto del landing. Sin dependencias nuevas. Los 2 assets que faltaban (recordatorio del paso 3, "antes" del wedge) se renderizan como UI on-brand en markup, no como imágenes.

**Tech Stack:** Next.js 14 App Router, TypeScript strict, Tailwind (tokens de marca + clases `type-*`), framer-motion, next/image, shadcn `Button`.

**Spec:** `docs/superpowers/specs/2026-06-08-how-it-works-page-rebuild-design.md`

**Notas de verificación:** Esta es una página de marketing visual; no hay tests unitarios. La verificación es: `npx tsc --noEmit` (una sola vez, al final — regla del proyecto) + revisión visual en el dev server. NO correr `npm run build` para esto.

---

## File Structure

- **Create:** `app/(public)/how-it-works/_components/JourneyStep.tsx` — un paso del timeline (dot en el riel + texto a la izquierda + visual a la derecha + reveal animado). Exporta el tipo `JourneyStepData`.
- **Modify (replace):** `app/(public)/how-it-works/page.tsx` — reconstrucción completa. Reemplaza la versión actual (570 líneas, rota/fuera de marca).
- **Modify:** `components/landing/HowItWorks.tsx` — añade el link de entrada "See the whole thing, step by step →" debajo de los 3 step cards.

---

## Task 1: Componente `JourneyStep`

**Files:**
- Create: `app/(public)/how-it-works/_components/JourneyStep.tsx`

- [ ] **Step 1: Crear el componente**

Crear `app/(public)/how-it-works/_components/JourneyStep.tsx` con exactamente este contenido:

```tsx
"use client";

import { useRef, type ReactNode } from "react";
import { motion, useInView } from "framer-motion";

const easeOut: [number, number, number, number] = [0.23, 1, 0.32, 1];

export interface JourneyStepData {
  number: string; // "01"
  title: string;
  description: string;
  cta?: { label: string; href: string };
}

export default function JourneyStep({
  step,
  index,
  visual,
}: {
  step: JourneyStepData;
  index: number;
  visual: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <div ref={ref} className="relative lg:pl-16">
      {/* dot sobre el riel del timeline (solo desktop) */}
      <div
        className="absolute left-0 top-1.5 hidden h-3.5 w-3.5 -translate-x-1/2 rounded-full bg-brand-honey ring-4 ring-brand-warm-white-warm lg:block"
        aria-hidden
      />

      <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-2 lg:gap-14">
        {/* texto (siempre a la izquierda, pegado al riel) */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: isInView ? 1 : 0, y: isInView ? 0 : 16 }}
          transition={{ duration: 0.5, delay: index * 0.05, ease: easeOut }}
        >
          <p className="type-eyebrow text-brand-honey">STEP {step.number}</p>
          <h3 className="type-heading mt-3">{step.title}</h3>
          <p className="type-body-small mt-4 text-brand-charcoal/70">{step.description}</p>
          {step.cta && (
            <a
              href={step.cta.href}
              className="type-body-small mt-5 inline-flex items-center gap-1 text-brand-charcoal underline underline-offset-4 transition-colors hover:text-brand-honey"
            >
              {step.cta.label} <span aria-hidden>→</span>
            </a>
          )}
        </motion.div>

        {/* visual (siempre a la derecha) */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: isInView ? 1 : 0, y: isInView ? 0 : 24 }}
          transition={{ duration: 0.6, delay: index * 0.05 + 0.1, ease: easeOut }}
        >
          {visual}
        </motion.div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verificar import/typecheck rápido del archivo**

Run: `npx tsc --noEmit --pretty 2>&1 | grep -i "JourneyStep" || echo "no JourneyStep type errors"`
Expected: `no JourneyStep type errors`

- [ ] **Step 3: Commit**

```bash
git add "app/(public)/how-it-works/_components/JourneyStep.tsx"
git commit -m "feat(how-it-works): add JourneyStep timeline component"
```

---

## Task 2: Reconstruir `page.tsx`

**Files:**
- Modify (replace whole file): `app/(public)/how-it-works/page.tsx`

- [ ] **Step 1: Reemplazar el contenido completo del archivo**

Reemplazar TODO `app/(public)/how-it-works/page.tsx` con este contenido:

```tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import WhatsAppFAB from "@/components/landing/WhatsAppFAB";
import JourneyStep, { type JourneyStepData } from "./_components/JourneyStep";

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
            className="type-caption rounded-full border border-brand-sand bg-brand-warm-white-warm px-4 py-2 text-brand-charcoal/80"
          >
            {c}
          </span>
        ))}
      </div>
    </div>,
    <div key="s3" className="rounded-2xl bg-brand-cream p-6 md:p-8">
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
      bg="bg-brand-white"
    />,
  ];

  return (
    <>
      {/* Header con logo centrado */}
      <header
        role="banner"
        aria-label="Top banner"
        className="w-full border-b border-brand-sand bg-brand-warm-white-warm"
      >
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-center px-6 md:px-8">
          <Link href="/" className="flex-shrink-0">
            <Image
              src="/images/SmallPlates_logo_horizontal.png"
              alt="Small Plates & Company"
              width={180}
              height={36}
              priority
              className="transition-opacity duration-300 hover:opacity-70"
            />
          </Link>
        </div>
      </header>

      <main className="bg-brand-warm-white-warm">
        {/* 1. Hero */}
        <section className="px-6 pt-20 pb-16 md:px-10 md:pt-28 md:pb-20">
          <motion.div
            className="mx-auto max-w-3xl text-center"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: easeOut }}
          >
            <h1 className="type-display">How it works.</h1>
            <p className="type-body mt-6 text-brand-charcoal/70">
              Everyone who shows up sends a recipe. We turn them into a hardcover.
              Here&rsquo;s the whole thing, step by step.
            </p>
          </motion.div>
        </section>

        {/* 2. Timeline de 5 pasos */}
        <section className="px-6 pb-24 md:px-10 md:pb-32">
          <div className="relative mx-auto max-w-5xl">
            <div
              className="absolute left-0 top-2 bottom-2 hidden w-px bg-brand-charcoal/15 lg:block"
              aria-hidden
            />
            <div className="space-y-20 md:space-y-28">
              {steps.map((step, i) => (
                <JourneyStep key={step.number} step={step} index={i} visual={visuals[i]} />
              ))}
            </div>
          </div>
        </section>

        {/* 3. El wedge / la magia */}
        <section id="the-magic" className="bg-brand-cream px-6 py-24 md:px-10 md:py-32">
          <div className="mx-auto max-w-5xl">
            <div className="mx-auto max-w-2xl text-center">
              <p className="type-eyebrow text-brand-honey">THE MAGIC</p>
              <h2 className="type-heading mt-4">We make it look good. But how?</h2>
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
                <div className="rounded-2xl bg-brand-warm-white-warm p-6">
                  <div className="max-w-[85%] rounded-2xl rounded-bl-sm bg-brand-white px-4 py-3 shadow-sm">
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
        <section className="px-6 py-24 md:px-10 md:py-32">
          <motion.div
            className="mx-auto max-w-2xl text-center"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, ease: easeOut }}
          >
            <h2 className="type-heading">But what if people don&rsquo;t send anything?</h2>
            <p className="type-body mt-5 text-brand-charcoal/70">
              We send the reminders, so you&rsquo;re not the one texting everyone twice.
              And you can always add recipes yourself. Most books fill up faster than
              people expect.
            </p>
          </motion.div>
        </section>

        {/* 5. Lo que recibes */}
        <section className="bg-brand-sand px-6 py-24 md:px-10 md:py-32">
          <div className="mx-auto max-w-5xl text-center">
            <h2 className="type-heading">What shows up at your door</h2>
            <p className="type-body-small mx-auto mt-4 max-w-xl text-brand-charcoal/70">
              A full-color hardcover, around 80 pages. It lives in the kitchen. It gets
              stained. That&rsquo;s the point.
            </p>
            <div className="relative mx-auto mt-12 aspect-[16/10] max-w-3xl overflow-hidden rounded-2xl bg-brand-white shadow-md">
              <Image
                src="/images/HowitWorks_images/book_in_hand_whitebackgound.png"
                alt="The finished hardcover cookbook"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 768px"
              />
            </div>
          </div>
        </section>

        {/* 6. Ancla de precio */}
        <section className="px-6 py-20 md:px-10 md:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <p className="type-subheading">
              Free to start. You only pay when the book is ready.
            </p>
            <p className="type-body-small mt-4 text-brand-charcoal/70">
              Build the whole thing for free. Pay for the book when you order it —
              backed by our guarantee.
            </p>
            <Link
              href="/#pricing"
              className="type-body-small mt-5 inline-flex items-center gap-1 text-brand-charcoal underline underline-offset-4 transition-colors hover:text-brand-honey"
            >
              See pricing <span aria-hidden>→</span>
            </Link>
          </div>
        </section>

        {/* 7. CTA de cierre */}
        <section className="bg-brand-charcoal px-6 py-20 md:px-10 md:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="type-heading text-brand-warm-white-warm">
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
```

- [ ] **Step 2: Confirmar que no quedaron imports rotos**

Run: `grep -n "import" "app/(public)/how-it-works/page.tsx"`
Expected: imports de `Image`, `Link`, `useRouter`, `motion`, `useAuth`, `Button`, `WhatsAppFAB`, `JourneyStep` — y NINGÚN import de `Carousel`, `lucide-react`, `MessageSquare`, etc. (los de la versión vieja).

- [ ] **Step 3: Confirmar que el archivo está bajo control de tamaño**

Run: `wc -l "app/(public)/how-it-works/page.tsx"`
Expected: < 300 líneas.

- [ ] **Step 4: Commit**

```bash
git add "app/(public)/how-it-works/page.tsx"
git commit -m "feat(how-it-works): rebuild page as 5-step Remento-style journey"
```

---

## Task 3: Link de entrada en el `HowItWorks` del landing

**Files:**
- Modify: `components/landing/HowItWorks.tsx`

- [ ] **Step 1: Añadir el import de `Link`**

En `components/landing/HowItWorks.tsx`, debajo de la línea `import Image from "next/image";` (línea 4), añadir:

```tsx
import Link from "next/link";
```

- [ ] **Step 2: Añadir el link debajo del grid de los 3 pasos**

En el mismo archivo, localizar el cierre del grid de pasos:

```tsx
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-6 lg:gap-10 md:items-start">
          {steps.map((step, i) => (
            <StepCard key={step.number} step={step} index={i} />
          ))}
        </div>

      </div>
```

Reemplazarlo por (añade el bloque del link entre el `</div>` del grid y el `</div>` del contenedor):

```tsx
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-6 lg:gap-10 md:items-start">
          {steps.map((step, i) => (
            <StepCard key={step.number} step={step} index={i} />
          ))}
        </div>

        <div className="mt-12 text-center md:mt-16">
          <Link
            href="/how-it-works"
            className="type-body-small inline-flex items-center gap-1 text-brand-charcoal underline underline-offset-4 transition-colors hover:text-brand-honey"
          >
            See the whole thing, step by step <span aria-hidden>→</span>
          </Link>
        </div>

      </div>
```

- [ ] **Step 3: Commit**

```bash
git add components/landing/HowItWorks.tsx
git commit -m "feat(landing): link HowItWorks section to /how-it-works detail page"
```

---

## Task 4: Verificación final

**Files:** ninguno (verificación)

- [ ] **Step 1: Typecheck completo (una sola vez, por regla del proyecto)**

Run: `npx tsc --noEmit`
Expected: sin errores. Si hay errores, corregirlos antes de seguir.

- [ ] **Step 2: Lint de los archivos tocados**

Run: `npm run lint 2>&1 | tail -20`
Expected: sin errores nuevos en `how-it-works/page.tsx`, `JourneyStep.tsx`, `components/landing/HowItWorks.tsx`.

- [ ] **Step 3: Revisión visual en el dev server**

Run: `npm run dev` (en background) y abrir:
- `http://localhost:3000/how-it-works` → confirmar: hero, 5 pasos con dots en el riel (desktop), chips en paso 2, card de recordatorio en paso 3, wedge antes/después, objeción, libro, pricing, CTA. **Cero cuadros grises / imágenes rotas.** Revisar consola sin errores.
- `http://localhost:3000/` → bajar al `HowItWorks` y confirmar el link "See the whole thing, step by step →" navega a `/how-it-works`.
- Revisar en mobile (responsive): el riel/dots se ocultan, todo apila bien.

- [ ] **Step 4 (si todo pasa): no se requiere commit adicional.** Los commits de las tareas 1-3 ya cubren el trabajo.

---

## Pendientes fuera de scope (registrar, NO implementar)
- Reemplazar el card de recordatorio (paso 3) y el "antes" del wedge por assets reales cuando existan.
- Pasar todo el copy provisional por la skill `brand-guidelines` / voz Margot antes de publicar.
- A futuro: toggle "As a gift / For myself", video del founder, sección "still have questions".
