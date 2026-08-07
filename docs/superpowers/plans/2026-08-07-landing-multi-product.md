# Landing Multi-Product v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the main landing page into a multi-product page (gift cookbook, club cookbook, framed tiles) with the minimum change surface, gated behind environment flags so it can ship before the club and tiles flows exist.

**Architecture:** Three new presentational sections in `components/landing/` plus a toggle inside the existing `HowItWorks`. Two new environment flags control whether the club and tiles sections (and their router cards) render at all. All new sections are same-page anchor targets; no new routes, no API changes, no database changes.

**Tech Stack:** Next.js 15 App Router, TypeScript strict, Tailwind, framer-motion, Jest + @testing-library/react.

**Spec:** `docs/superpowers/specs/2026-08-07-landing-multi-product-design.md`

## Global Constraints

- Branch: `feature/landing-multi-product`. Never commit to `main`.
- Typography: use `type-*` utility classes only (`type-display`, `type-heading`, `type-subheading`, `type-accent`, `type-body`, `type-body-small`, `type-eyebrow`, `type-caption`). Never raw `font-serif` / `text-xl` / `text-base` for headings or body copy.
- Brand voice (`brand/voice.md`): banned words are *cherish, treasure, memories, special, unique, loved ones, celebrate, journey, curated, perfect, amazing, magical, timeless, forever, blessed, dreamy, heartwarming, unforgettable, heartfelt, keepsake, meaningful, yummy*. No em dashes (`—`) anywhere in copy. No specific guest numbers. Never "showed up".
- Copy must work for any occasion. Never assume wedding, never "the couple" alone.
- Logged-out CTAs point at `/onboarding/welcome` (via `isFreeTierEnabled()`), never bare `/onboarding`.
- Do not touch the other landings (`regalos`, `regalos-usa`) or any component outside `components/landing/` and `app/(public)/page.tsx`.
- No new dependencies.
- Brand colors are existing Tailwind tokens: `bg-brand-warm-white-warm`, `bg-brand-sand`, `bg-brand-cream`, `text-brand-charcoal`. Buttons use existing classes: `btn btn-lg btn-honey`, `btn btn-lg btn-dark`.
- Run `npx tsc --noEmit` at the end of each task, not after every edit.
- Visual verification is a screenshot from the founder. Do not set up Playwright or any headless browser.

---

### Task 1: Feature flags for club and tiles

**Files:**
- Modify: `lib/feature-flags.ts`
- Test: `__tests__/lib/feature-flags.test.ts` (existing file, extend it)

**Interfaces:**
- Consumes: nothing.
- Produces: `isClubEnabled(): boolean` and `isTilesEnabled(): boolean`, both exported from `@/lib/feature-flags`. Both return `true` only when their env var is exactly the string `'true'`. Tasks 3, 4, 5 and 6 consume them.

Note: `__tests__/lib/feature-flags.test.ts` already exists and covers `isFreeTierEnabled` in this exact shape. Extending it is following the established pattern for this module.

- [ ] **Step 1: Write the failing tests**

Append inside the existing `describe('feature flags', ...)` block in `__tests__/lib/feature-flags.test.ts`, and add the two new imports to line 1 so it reads:

```ts
import { isFreeTierEnabled, isClubEnabled, isTilesEnabled } from '@/lib/feature-flags';
```

Then append these blocks after the existing `it(...)` for undefined:

```ts
  describe('isClubEnabled', () => {
    const original = process.env.NEXT_PUBLIC_SHOW_CLUB;
    afterEach(() => {
      process.env.NEXT_PUBLIC_SHOW_CLUB = original;
    });

    it('returns true when NEXT_PUBLIC_SHOW_CLUB is "true"', () => {
      process.env.NEXT_PUBLIC_SHOW_CLUB = 'true';
      expect(isClubEnabled()).toBe(true);
    });

    it('returns false when NEXT_PUBLIC_SHOW_CLUB is undefined', () => {
      delete process.env.NEXT_PUBLIC_SHOW_CLUB;
      expect(isClubEnabled()).toBe(false);
    });
  });

  describe('isTilesEnabled', () => {
    const original = process.env.NEXT_PUBLIC_SHOW_TILES;
    afterEach(() => {
      process.env.NEXT_PUBLIC_SHOW_TILES = original;
    });

    it('returns true when NEXT_PUBLIC_SHOW_TILES is "true"', () => {
      process.env.NEXT_PUBLIC_SHOW_TILES = 'true';
      expect(isTilesEnabled()).toBe(true);
    });

    it('returns false when NEXT_PUBLIC_SHOW_TILES is undefined', () => {
      delete process.env.NEXT_PUBLIC_SHOW_TILES;
      expect(isTilesEnabled()).toBe(false);
    });
  });
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx jest __tests__/lib/feature-flags.test.ts`
Expected: FAIL. TypeScript/Jest reports `isClubEnabled is not a function` (or an import error for the missing exports).

- [ ] **Step 3: Write the implementation**

Append to `lib/feature-flags.ts`:

```ts
// Reason: the club and tiles sections of the landing point at flows that do not
// exist yet. These flags let the page ship with those sections dark, and turn
// them on per environment without a deploy.
export function isClubEnabled(): boolean {
  return process.env.NEXT_PUBLIC_SHOW_CLUB === 'true';
}

export function isTilesEnabled(): boolean {
  return process.env.NEXT_PUBLIC_SHOW_TILES === 'true';
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx jest __tests__/lib/feature-flags.test.ts`
Expected: PASS, 7 tests.

- [ ] **Step 5: Type check and commit**

```bash
npx tsc --noEmit
git add lib/feature-flags.ts __tests__/lib/feature-flags.test.ts
git commit -m "feat(landing): add club and tiles feature flags"
```

---

### Task 2: HowItWorks gift/club toggle

**Files:**
- Modify: `components/landing/HowItWorks.tsx`
- Test: `__tests__/landing/how-it-works.test.tsx` (create)

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: `HowItWorks` keeps its default export and its `id="how-it-works"` section id. It gains an optional prop `showClubToggle?: boolean` (default `false`); when false the component renders exactly as it does today, with no toggle and the gift steps. Task 6 passes `showClubToggle={isClubEnabled()}`.

This is the only component in the plan with real logic, and the only one with tests.

- [ ] **Step 1: Write the failing test**

Create `__tests__/landing/how-it-works.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HowItWorks from '@/components/landing/HowItWorks';

// Reason: framer-motion needs layout APIs jsdom lacks, and its animation props
// are not valid DOM attributes. Strip them and render a plain element; the
// toggle logic is what we test, not the animation.
jest.mock('framer-motion', () => {
  const React = require('react');
  const ANIMATION_PROPS = [
    'initial', 'animate', 'whileInView', 'whileHover', 'whileTap',
    'viewport', 'transition', 'exit', 'variants', 'layout',
  ];
  const strip = (props: Record<string, unknown>) => {
    const clean: Record<string, unknown> = {};
    for (const key of Object.keys(props)) {
      if (!ANIMATION_PROPS.includes(key)) clean[key] = props[key];
    }
    return clean;
  };
  return {
    motion: new Proxy(
      {},
      {
        get: (_target, tag: string) =>
          React.forwardRef((props: Record<string, unknown>, ref: unknown) =>
            React.createElement(tag, { ...strip(props), ref })
          ),
      }
    ),
    useInView: () => true,
  };
});

describe('HowItWorks', () => {
  it('renders no toggle when showClubToggle is false', () => {
    render(<HowItWorks showClubToggle={false} />);
    expect(screen.queryByRole('tab', { name: /as a gift/i })).not.toBeInTheDocument();
  });

  it('shows the gift steps by default when the toggle is on', () => {
    render(<HowItWorks showClubToggle />);
    expect(screen.getByRole('tab', { name: /as a gift/i })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText(/they send a recipe/i)).toBeInTheDocument();
  });

  it('swaps to club copy when the club tab is clicked', async () => {
    const user = userEvent.setup();
    render(<HowItWorks showClubToggle />);
    await user.click(screen.getByRole('tab', { name: /as a club/i }));
    expect(screen.getByRole('tab', { name: /as a club/i })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText(/everyone gets a copy/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx jest __tests__/landing/how-it-works.test.tsx`
Expected: FAIL. `HowItWorks` does not accept props and no element with role `tab` exists.

- [ ] **Step 3: Implement the toggle**

In `components/landing/HowItWorks.tsx`:

1. Add `useState` to the existing `import { useRef } from "react";` so it reads `import { useRef, useState } from "react";`.

2. Rename the existing `steps` const to `GIFT_STEPS` (keep every field and value exactly as they are today) and add the club variant below it. Keep `as const` on both.

```tsx
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
```

3. Widen the `Step` type so it accepts either variant:

```tsx
type Step = (typeof GIFT_STEPS)[number] | (typeof CLUB_STEPS)[number];
```

4. Change the component signature and add state:

```tsx
export default function HowItWorks({ showClubToggle = false }: { showClubToggle?: boolean }) {
  const [mode, setMode] = useState<"gift" | "club">("gift");
  const steps = showClubToggle && mode === "club" ? CLUB_STEPS : GIFT_STEPS;
```

5. Insert the toggle immediately after the closing `</motion.div>` of the heading block and before the `<div className="grid grid-cols-1 md:grid-cols-3 ...">`:

```tsx
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
```

6. Change the grid's `key` so React remounts the cards on mode change (otherwise the reveal animation does not replay):

```tsx
          {steps.map((step, i) => (
            <StepCard key={`${mode}-${step.number}`} step={step} index={i} />
          ))}
```

Leave the heading copy, the `Learn More` link, and `StepCard` untouched.

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx jest __tests__/landing/how-it-works.test.tsx`
Expected: PASS, 3 tests.

- [ ] **Step 5: Type check and commit**

```bash
npx tsc --noEmit
git add components/landing/HowItWorks.tsx __tests__/landing/how-it-works.test.tsx
git commit -m "feat(landing): add gift/club toggle to HowItWorks"
```

---

### Task 3: TheClub section

**Files:**
- Create: `components/landing/TheClub.tsx`

**Interfaces:**
- Consumes: `isFreeTierEnabled` and `trackStartBookClick` from existing modules.
- Produces: default export `TheClub`, rendering `<section id="club">`. Task 5 anchors to `#club`; Task 6 renders it behind `isClubEnabled()`.

Copy note: the club authorship line is an open item in the spec (§10). The line used below is a working draft; the founder approves or replaces it before merge.

- [ ] **Step 1: Create the component**

Create `components/landing/TheClub.tsx`:

```tsx
"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { trackStartBookClick } from "@/lib/analytics";
import { isFreeTierEnabled } from "@/lib/feature-flags";

/**
 * THE CLUB — the second door into the cookbook. A group writes its own book
 * instead of making one for somebody else. Members, not guests. No surprise.
 */

const BEATS = [
  {
    title: "It has a name.",
    body: "Named after the people in it, never a date. The Ramírez Cookbook Club. The Sunday Club.",
  },
  {
    title: "It has rules.",
    body: "Every club sets its own: what to send, what not to. The rules are half the fun, and they take the pressure off a blank page.",
  },
  {
    title: "The signature is the credential.",
    body: "Everyone signs their recipe, printed exactly as it came in. That is how you know who was at the table.",
  },
  {
    title: "Everyone gets a copy.",
    body: "One hardcover per member, so the same book sits in every one of their kitchens.",
  },
];

export default function TheClub() {
  const router = useRouter();

  const handleStartClub = () => {
    trackStartBookClick("club_section");
    router.push(isFreeTierEnabled() ? "/onboarding/welcome" : "/onboarding");
  };

  return (
    <section
      id="club"
      className="bg-brand-cream py-20 md:py-28"
      aria-labelledby="club-heading"
    >
      <div className="mx-auto max-w-5xl px-6 md:px-10">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
        >
          <p className="type-eyebrow mb-5">The Cookbook Club</p>

          <h2 id="club-heading" className="type-heading">
            A group writes its own cookbook.
          </h2>

          <p className="type-body mx-auto mt-6 max-w-2xl">
            No occasion, nobody to surprise. Friends, a family, the people who
            would all be at the same table if they could. Most cookbook clubs
            cook from someone else&rsquo;s book. This one writes its own.
          </p>
        </motion.div>

        <div className="mt-14 grid grid-cols-1 gap-8 sm:grid-cols-2">
          {BEATS.map((beat, i) => (
            <motion.div
              key={beat.title}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.45, delay: i * 0.08, ease: [0.23, 1, 0.32, 1] }}
            >
              <h3 className="type-subheading mb-2">{beat.title}</h3>
              <p className="type-body-small">{beat.body}</p>
            </motion.div>
          ))}
        </div>

        <div className="mt-14 text-center">
          <button
            type="button"
            onClick={handleStartClub}
            className="btn btn-lg btn-honey"
            data-cta="club-primary"
          >
            Start a club for free
          </button>
          <p className="type-caption mt-4">
            Free to start. You pay when it goes to print.
          </p>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/landing/TheClub.tsx
git commit -m "feat(landing): add TheClub section"
```

---

### Task 4: TheTiles section

**Files:**
- Create: `components/landing/TheTiles.tsx`

**Interfaces:**
- Consumes: `trackStartBookClick` from `@/lib/analytics`.
- Produces: default export `TheTiles`, rendering `<section id="tiles">`. Task 5 anchors to `#tiles`; Task 6 renders it behind `isTilesEnabled()`.

Two constraints from the spec, both load-bearing:
- The tile price is not final (§10). It appears in exactly one place in this file, the `TILE_PRICE_FROM` constant, so it is a one-line change later.
- The source documents contradict each other on format (one framed tile per dish, vs one composed piece holding every dish). The copy below deliberately describes the outcome without committing to either. Do not "clarify" it.

The tiles flow does not exist yet. The CTA calls `onStartTiles` if provided; Task 6 passes a handler that scrolls to the newsletter signup so the click is never a dead end while the flow is being built.

- [ ] **Step 1: Create the component**

Create `components/landing/TheTiles.tsx`:

```tsx
"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { trackStartBookClick } from "@/lib/analytics";

/**
 * THE TILES — the second object. Same engine as the book (a group sends
 * recipes, we make the image of every dish), sized for small groups and made
 * for a wall instead of a counter.
 *
 * Reason: price is not final and the format (one tile per dish vs one composed
 * piece) is still open, so the copy describes the outcome, not the layout.
 */

const TILE_PRICE_FROM = 99;

const FACTS = [
  "Two to six people, one recipe each",
  "We make the image of every dish",
  "Arrives framed, ready to hang on a nail",
];

export default function TheTiles({ onStartTiles }: { onStartTiles?: () => void }) {
  const handleClick = () => {
    trackStartBookClick("tiles_section");
    onStartTiles?.();
  };

  return (
    <section
      id="tiles"
      className="bg-brand-warm-white-warm py-20 md:py-28"
      aria-labelledby="tiles-heading"
    >
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-6 md:grid-cols-2 md:px-10">
        <motion.div
          className="relative aspect-[4/5] overflow-hidden rounded-xl bg-brand-sand"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
        >
          <Image
            src="/images/tiles/tiles_kitchen_wall.jpg"
            alt="Framed dishes hanging on a kitchen wall"
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.23, 1, 0.32, 1] }}
        >
          <p className="type-eyebrow mb-5">Framed Tiles</p>

          <h2 id="tiles-heading" className="type-heading">
            The same idea, for your wall.
          </h2>

          <p className="type-body mt-6">
            For a smaller group. Everyone sends the dish they are known for, we
            make the image of each one, and it comes back framed. It hangs in
            the kitchen, next to the calendar.
          </p>

          <ul className="mt-8 space-y-3">
            {FACTS.map((fact) => (
              <li key={fact} className="type-body-small flex items-start gap-3">
                <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-honey" />
                {fact}
              </li>
            ))}
          </ul>

          <div className="mt-10">
            <button
              type="button"
              onClick={handleClick}
              className="btn btn-lg btn-dark"
              data-cta="tiles-primary"
            >
              Start your tiles
            </button>
            <p className="type-caption mt-4">From ${TILE_PRICE_FROM} per tile.</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Add the placeholder image**

The image path `/images/tiles/tiles_kitchen_wall.jpg` does not exist yet. Create the directory and note the gap:

```bash
mkdir -p public/images/tiles
```

Do NOT invent or generate an image. Report to the founder that `public/images/tiles/tiles_kitchen_wall.jpg` is required before this section can be reviewed visually, and that the section will render with a broken image until then.

- [ ] **Step 3: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add components/landing/TheTiles.tsx
git commit -m "feat(landing): add TheTiles section"
```

---

### Task 5: ProductRouter

**Files:**
- Create: `components/landing/ProductRouter.tsx`

**Interfaces:**
- Consumes: `#how-it-works` (existing), `#club` (Task 3), `#tiles` (Task 4).
- Produces: default export `ProductRouter`, accepting `{ showClub?: boolean; showTiles?: boolean }`, both defaulting to `false`. The gift card always renders. Task 6 passes the flag values.

Each card is object + who it is for + price anchor + action, per spec §5.2. Cards scroll to their anchor; they never navigate.

- [ ] **Step 1: Create the component**

Create `components/landing/ProductRouter.tsx`:

```tsx
"use client";

import { motion } from "framer-motion";
import { trackEvent } from "@/lib/analytics";

/**
 * PRODUCT ROUTER — three doors under the hero. Sorts intent early without
 * making the visitor leave the page: every card scrolls to the section that
 * explains that product.
 */

type Door = {
  key: string;
  title: string;
  who: string;
  price: string;
  target: string;
};

const GIFT_DOOR: Door = {
  key: "gift",
  title: "A gift cookbook",
  who: "For someone you love, for any occasion.",
  price: "From $169",
  target: "how-it-works",
};

const CLUB_DOOR: Door = {
  key: "club",
  title: "A club cookbook",
  who: "For your group. No occasion needed.",
  price: "From $169",
  target: "club",
};

const TILES_DOOR: Door = {
  key: "tiles",
  title: "Framed tiles",
  who: "For your kitchen wall. Groups of two to six.",
  price: "From $99 per tile",
  target: "tiles",
};

export default function ProductRouter({
  showClub = false,
  showTiles = false,
}: {
  showClub?: boolean;
  showTiles?: boolean;
}) {
  const doors: Door[] = [
    GIFT_DOOR,
    ...(showClub ? [CLUB_DOOR] : []),
    ...(showTiles ? [TILES_DOOR] : []),
  ];

  // Reason: with only the gift door there is nothing to route between, so the
  // section would just repeat the hero.
  if (doors.length < 2) return null;

  const handleClick = (door: Door) => {
    trackEvent("product_door_click", { door: door.key });
    document.getElementById(door.target)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section
      className="bg-brand-warm-white-warm py-14 md:py-20"
      aria-labelledby="router-heading"
    >
      <div className="mx-auto max-w-6xl px-6 md:px-10">
        <h2 id="router-heading" className="type-eyebrow mb-8 text-center">
          What you can make
        </h2>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {doors.map((door, i) => (
            <motion.button
              key={door.key}
              type="button"
              onClick={() => handleClick(door)}
              data-cta={`router-${door.key}`}
              className="rounded-xl border border-brand-charcoal/10 bg-white p-7 text-left transition-colors hover:border-brand-charcoal/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-honey"
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.45, delay: i * 0.08, ease: [0.23, 1, 0.32, 1] }}
            >
              <h3 className="type-subheading mb-2">{door.title}</h3>
              <p className="type-body-small mb-6">{door.who}</p>
              <p className="type-caption">{door.price}</p>
            </motion.button>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Register the analytics event**

`trackEvent` only persists names in the allowlist. In `lib/analytics.ts`, add `'product_door_click'` to the `EXTRA_PERSISTED` array, with a reason comment matching the style of its neighbors:

```ts
  // Reason: fired from the landing ProductRouter when a visitor picks a door
  // (gift, club, tiles). This is the primary signal for whether the club and
  // tiles products draw real interest.
  'product_door_click',
```

- [ ] **Step 3: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add components/landing/ProductRouter.tsx lib/analytics.ts
git commit -m "feat(landing): add ProductRouter with three product doors"
```

---

### Task 6: Wire the page, hero copy, pricing eyebrow, FAQ

**Files:**
- Modify: `app/(public)/page.tsx`
- Modify: `components/landing/Hero.tsx` (copy only, lines ~54 and ~62)
- Modify: `components/landing/PricingBlock.tsx:101` (eyebrow only)
- Modify: `components/landing/FAQ.tsx` (add three entries to the `faqs` array)

**Interfaces:**
- Consumes: everything produced by Tasks 1 through 5.
- Produces: the finished page.

Note on `TheSolution`: the spec listed it as needing a copy pass. On inspection its copy ("We make the photo of every dish", "Each recipe comes with a photo we make of the dish, and a note from the person who sent it") carries no wedding-only or gift-only assumption. Leave it untouched. This deviation from spec §5.3 is deliberate and is recorded in Task 7.

- [ ] **Step 1: Update the Hero copy**

In `components/landing/Hero.tsx`, replace the `<motion.h1>` text (currently `A cookbook made by everyone who loves them.`) with:

```
Cookbooks written by the people who love you.
```

And replace the `<motion.p>` subhead (currently `A gift for weddings, anniversaries, birthdays, showers, graduations. You set it up. We handle the rest.`) with:

```
Everyone sends one recipe. It comes back as a hardcover in your kitchen. You set it up, we handle the rest.
```

Leave both CTAs, the image, and every animation exactly as they are.

- [ ] **Step 2: Scope the PricingBlock eyebrow**

In `components/landing/PricingBlock.tsx:101`, change:

```tsx
            <p className="type-eyebrow mb-4">The book</p>
```

to:

```tsx
            <p className="type-eyebrow mb-4">The cookbook</p>
```

Reason: with tiles on the page, "The book" no longer identifies which product this price belongs to. Do not change any other copy or number in this file.

- [ ] **Step 3: Add the FAQ entries**

In `components/landing/FAQ.tsx`, append these three objects to the end of the `faqs` array, after the "Where do you ship?" entry:

```tsx
    {
      question: "What is a cookbook club?",
      answer: "A group that writes its own book instead of making one for someone else. No occasion, no surprise, and everyone in it gets a copy. You name it, set your rules, and everyone sends a recipe."
    },
    {
      question: "What are the framed tiles?",
      answer: "The same idea, made for a wall. A group of two to six people each send one recipe, we make the image of every dish, and it arrives framed and ready to hang. From $99 per tile."
    },
    {
      question: "Do the tiles work the same way as the book?",
      answer: "Yes. Same link, same five minutes to send a recipe, same photos we make of every dish. The book is for bigger groups and lives on the counter. The tiles are for smaller ones and live on the wall."
    },
```

- [ ] **Step 4: Wire the page**

Rewrite `app/(public)/page.tsx` so the imports and the render tree read as follows. Keep every existing comment about hidden components exactly as it is.

Add these imports alongside the existing ones:

```tsx
import ProductRouter from '@/components/landing/ProductRouter'
import TheClub from '@/components/landing/TheClub'
import TheTiles from '@/components/landing/TheTiles'
import { isClubEnabled, isTilesEnabled } from '@/lib/feature-flags'
```

Inside the component body, before the `return`:

```tsx
  const showClub = isClubEnabled()
  const showTiles = isTilesEnabled()
```

Then the render tree:

```tsx
      <Banner />
      <main className="min-h-screen">
        <Hero />
        <ProductRouter showClub={showClub} showTiles={showTiles} />
        <TestimonialBar />
        {/* <TheProblem /> — hidden from flow; see import note */}
        <TheSolution />
        <HowItWorks showClubToggle={showClub} />
        {showClub && <TheClub />}
        {/* <YourTools /> — removed from flow; see import note */}
        {/* <RegistryInterlude /> — hidden from flow; see import note */}
        <CookbookSpecialist />
        <PricingBlock />
        <BooksPrinted />
        <PersonalNotes />
        <TestimonialsSection />
        <TheBook />
        {showTiles && <TheTiles />}
        <EmotionalClose />
        <FAQ />
        <NewsletterSignup />
      </main>
      <Footer />
      <WhatsAppFAB />
```

Note: `TheTiles` is rendered without `onStartTiles`, so its CTA tracks the click and does nothing else. That is intentional for now and is listed in Task 7 as a founder decision.

- [ ] **Step 5: Verify everything compiles and tests still pass**

```bash
npx tsc --noEmit
npx jest __tests__/lib/feature-flags.test.ts __tests__/landing/how-it-works.test.tsx
```

Expected: no type errors; 10 tests pass.

- [ ] **Step 6: Verify the flags-off path renders the old page**

```bash
npm run dev
```

With `NEXT_PUBLIC_SHOW_CLUB` and `NEXT_PUBLIC_SHOW_TILES` unset, load `http://localhost:3000`. Expected: the page looks exactly like production today except for the new hero copy and the "The cookbook" eyebrow. No router (it returns null with one door), no club section, no tiles section, no toggle in HowItWorks.

- [ ] **Step 7: Commit**

```bash
git add app/\(public\)/page.tsx components/landing/Hero.tsx components/landing/PricingBlock.tsx components/landing/FAQ.tsx
git commit -m "feat(landing): wire multi-product page behind club and tiles flags"
```

---

### Task 7: Update the spec and hand off for review

**Files:**
- Modify: `docs/superpowers/specs/2026-08-07-landing-multi-product-design.md`

- [ ] **Step 1: Record the deviations in the spec**

In §5.3, replace the TheSolution section body with a note that on inspection the section needed no change, and remove `TheSolution` from the modified-components count in §4 (5 modified becomes 4: Hero, HowItWorks, PricingBlock, FAQ).

In §10, add the items that surfaced during implementation:

```markdown
5. `public/images/tiles/tiles_kitchen_wall.jpg` does not exist. The tiles section needs a real product image before visual review.
6. The tiles CTA currently tracks the click and does nothing else, pending the tiles flow.
7. Hero, club, and tiles copy are working drafts pending founder approval.
```

- [ ] **Step 2: Commit**

```bash
git add docs/superpowers/specs/2026-08-07-landing-multi-product-design.md
git commit -m "docs: record implementation deviations in landing spec"
```

- [ ] **Step 3: Hand off**

Report to the founder:
1. The branch is ready and the flags are off by default, so `main` behavior is unchanged apart from hero copy and one eyebrow.
2. Ask for a screenshot of `http://localhost:3000` with `NEXT_PUBLIC_SHOW_CLUB=true` and `NEXT_PUBLIC_SHOW_TILES=true` in `.env.local`, since visual verification is his screenshot, not a headless browser.
3. Flag the three copy blocks that need his approval: the hero headline, the club section, the tiles section.
4. Flag the missing tiles image.
