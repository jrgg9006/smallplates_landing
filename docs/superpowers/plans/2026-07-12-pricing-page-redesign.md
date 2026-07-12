# Pricing Page Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild `/pricing` so the price and its justification share one visual field (per-person hero + stepper left, itemized service right), add 7 objection FAQs, and fix the public FAQ that promises a repurchase price the checkout no longer charges.

**Architecture:** One client component rewrite (`PricingPage.tsx`, two-column card) plus one new sibling component (`PricingFaq.tsx`) to stay under the 300-line file limit. Two copy-only edits (`faq-data.ts`) and one dead-code cleanup (`pricing.ts` / `client.ts`). No checkout, Stripe, or pricing-number changes.

**Tech Stack:** Next.js 14 App Router, TypeScript strict, Tailwind + brand tokens, framer-motion (already used on the page).

**Spec:** `docs/superpowers/specs/2026-07-12-pricing-page-redesign-design.md` (approved by Ricardo)

## Global Constraints

- Branch: `feature/pricing-page-redesign`. Commit after each task.
- All marketing text uses `type-*` utility classes (`type-heading`, `type-body-small`, `type-eyebrow`, `type-accent`, `type-caption`); raw Tailwind font utilities only where the current page already uses them (hero number, FAQ question labels).
- Copy rules: NO em dashes anywhere. NO banned words (cherish, treasure, memories, special, unique, loved ones, celebrate, journey, curated, perfect, amazing, magical, timeless, forever, keepsake, heartfelt, meaningful). Middots (·) are fine.
- All displayed prices come from `pricePerCopy()` / `calculateSubtotal()` in `@/lib/stripe/pricing` (except FAQ prose, which states $169/$89/$1/25/50 as literals, matching pricing.ts values).
- Do NOT touch: `components/landing/PricingBlock.tsx`, any checkout route, Stripe logic, pricing numbers.
- No new dependencies. No console.logs. Files under 300 lines.
- Verification is `npx tsc --noEmit` + `npm run lint` (no component-test infra exists; do not add react-testing-library). Final visual check = Ricardo's screenshot.

---

### Task 1: Fix the public FAQ (it promises a price checkout no longer charges)

**Files:**
- Modify: `app/(public)/faq/_components/faq-data.ts:104-111` (extra-copies) and `:320-326` (shipping-cost)

**Interfaces:**
- Consumes: nothing.
- Produces: nothing other tasks rely on. `FaqItem` shape (`{ id, question, answer: string[] }`) is unchanged.

- [ ] **Step 1: Replace the stale extra-copies answer**

In `app/(public)/faq/_components/faq-data.ts`, replace:

```ts
      {
        id: "extra-copies",
        question: "Can I order more copies after the book is printed?",
        answer: [
          "Yes. Single copies later are $129 plus $14 shipping.",
          "It's cheaper to order them with the main print run, where copies drop to as low as $89 each.",
        ],
      },
```

with:

```ts
      {
        id: "extra-copies",
        question: "Can I order more copies after the book is printed?",
        answer: [
          "Yes, anytime. Later orders work exactly like the first one: one copy is $169 and the price per copy drops the more you print together, down to $89 each from 6.",
          "Separate orders don't combine, so the cheapest copies are the ones the group orders together, before the book closes.",
        ],
      },
```

- [ ] **Step 2: Replace the stale shipping answer**

In the same file, replace:

```ts
        answer: [
          "Included for the main order, shipped to one address. Single copies ordered later ship for $14.",
        ],
```

with:

```ts
        answer: [
          "Included, always. Every order ships to one address, and the price you see covers it.",
        ],
```

- [ ] **Step 3: Verify no stale numbers remain**

Run: `grep -n "129\|\$14" "app/(public)/faq/_components/faq-data.ts"`
Expected: line ~71 still shows "$129 each for 2 copies" (correct: that describes the cascade). NO hits for "plus $14" or "ship for $14".

Run: `npx tsc --noEmit`
Expected: clean (no output).

- [ ] **Step 4: Commit**

```bash
git add "app/(public)/faq/_components/faq-data.ts"
git commit -m "fix(faq): repurchase answers match the per-order cascade checkout actually charges"
```

---

### Task 2: Remove dead pricing constants and stale comments

**Files:**
- Modify: `lib/stripe/pricing.ts:8-14` (ADDITIONAL_BOOK_PRICE block), `:43-49` (EXTRA_COPIES_SHIPPING_COST block), `:15-26` (PER_PERSON_PRICE docblock)
- Modify: `lib/stripe/client.ts:12-17` (re-export)

**Interfaces:**
- Consumes: nothing.
- Produces: `pricing.ts` keeps exporting `BASE_BOOK_PRICE`, `MIN_RECIPES_TO_PRINT`, `pricePerCopy`, `calculateSubtotal`, `calculateExtrasAmount`. `ADDITIONAL_BOOK_PRICE` and `EXTRA_COPIES_SHIPPING_COST` cease to exist.

- [ ] **Step 1: Confirm the constants are dead**

Run: `grep -rn "ADDITIONAL_BOOK_PRICE\|EXTRA_COPIES_SHIPPING_COST" --include="*.ts" --include="*.tsx" . | grep -v node_modules | grep -v .next`
Expected: exactly 3 hits — the two definitions in `lib/stripe/pricing.ts` and the re-export in `lib/stripe/client.ts`. If ANY other hit appears, STOP and report instead of deleting.

- [ ] **Step 2: Delete both constants and their docblocks from `lib/stripe/pricing.ts`**

Delete this block (lines ~8-14):

```ts
/**
 * Flat per-copy price for the LEGACY upfront model and the post-close "extra
 * copies" flows (dashboard + public /copy link). Those are standalone, late,
 * separately-shipped copies — not the primary group order, so they keep a flat
 * price. The primary group order uses the declining schedule below.
 */
export const ADDITIONAL_BOOK_PRICE = 129;
```

and this block (lines ~43-49):

```ts
/**
 * Flat shipping cost applied to every extra_copy order placed from
 * the dashboard (post-close "Get more copies" flow). Different from
 * the upsell-during-close flow where shipping is included in the
 * main book's package.
 */
export const EXTRA_COPIES_SHIPPING_COST = 14;
```

- [ ] **Step 3: Document the per-order rule where the cascade is defined**

In `lib/stripe/pricing.ts`, in the docblock above `PER_PERSON_PRICE`, after the sentence ending "every copy beyond 6 is $89.", add:

```ts
 *
 * The cascade applies PER ORDER and restarts on every order, including
 * post-close reorders (dashboard extras and the public /copy link): nothing
 * accumulates across orders. Shipping is included in every order.
```

- [ ] **Step 4: Update the re-export in `lib/stripe/client.ts`**

Replace:

```ts
// Re-export pricing functions for server-side use
export {
  BASE_BOOK_PRICE,
  ADDITIONAL_BOOK_PRICE,
  calculateSubtotal,
} from './pricing';
```

with:

```ts
// Re-export pricing functions for server-side use
export {
  BASE_BOOK_PRICE,
  calculateSubtotal,
} from './pricing';
```

- [ ] **Step 5: Verify**

Run: `npx tsc --noEmit`
Expected: clean. (If anything imported the deleted constants, this catches it.)

- [ ] **Step 6: Commit**

```bash
git add lib/stripe/pricing.ts lib/stripe/client.ts
git commit -m "chore(pricing): remove dead flat-price constants; document per-order cascade rule"
```

---

### Task 3: Create the PricingFaq component

**Files:**
- Create: `components/pricing/PricingFaq.tsx`

**Interfaces:**
- Consumes: framer-motion (already a dependency), `type-*` classes from `app/globals.css`.
- Produces: `export default function PricingFaq(): JSX.Element` — no props. Task 4 renders `<PricingFaq />`.

- [ ] **Step 1: Create `components/pricing/PricingFaq.tsx` with exactly this content**

```tsx
"use client";

import { motion } from "framer-motion";

// Reason: these answer the objections people have at the moment they see the
// price. Copy constraints: no banned words, no em dashes, and never promise a
// preview of the finished book design or collection reminders.
const faqs = [
  {
    q: "When do I pay?",
    a: "Not now. Starting a book is free: invite people, collect recipes, take your time. You pay once, when you close the book and send it to print.",
  },
  {
    q: "Who pays, me or everyone?",
    a: "One card pays at checkout. The price is per person, so splitting is easy: everyone sends you their share, everyone gets their copy.",
  },
  {
    q: "What if we don't collect enough recipes?",
    a: "A book needs 25 recipes to go to print. Most groups pass that in the first week. 50 recipes are included; after that, each one adds $1 to your total.",
  },
  {
    q: "Can I see the recipes before it prints?",
    a: "The text, yes. You see every recipe as it comes in, including the cleaned-up version. The photos are made after you order, by hand, so those arrive with the book.",
  },
  {
    q: "How long does it take?",
    a: "Most books are at your door 3 to 4 weeks after you close the collection.",
  },
  {
    q: "Can we order more copies later?",
    a: "Yes, anytime. Later orders work exactly like the first one: one copy is $169 and the price per copy drops the more you print together, down to $89 each from 6. Separate orders don't combine, so the cheapest copies are the ones the group orders together.",
  },
  {
    q: "Is any of this public?",
    a: "No. Only people with your invite link can see or add anything. The book exists in exactly as many copies as you print.",
  },
];

export default function PricingFaq() {
  return (
    <section className="pb-24 md:pb-32">
      <div className="mx-auto max-w-2xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="font-serif text-xl text-brand-charcoal mb-8">
            A few questions, answered
          </h2>
          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <div key={faq.q}>
                {index > 0 && <div className="mb-6 h-px bg-brand-sand" />}
                <p className="font-sans text-[15px] font-medium text-brand-charcoal mb-2">
                  {faq.q}
                </p>
                <p className="type-body-small text-[15px]">{faq.a}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: clean. (Component is not yet rendered anywhere; that happens in Task 4.)

- [ ] **Step 3: Commit**

```bash
git add components/pricing/PricingFaq.tsx
git commit -m "feat(pricing): objection FAQs section for the pricing page"
```

---

### Task 4: Rewrite PricingPage with the two-column card

**Files:**
- Modify: `components/pricing/PricingPage.tsx` (full rewrite, replace entire file)

**Interfaces:**
- Consumes: `pricePerCopy(totalBooks: number): number` and `calculateSubtotal(totalBooks: number): number` from `@/lib/stripe/pricing`; `trackStartBookClick(source: string)` from `@/lib/analytics`; `isFreeTierEnabled(): boolean` from `@/lib/feature-flags`; `PricingFaq` from Task 3.
- Produces: `export default function PricingPage()` — same default export the route `app/(public)/pricing` already imports; no route changes needed.

- [ ] **Step 1: Replace the entire content of `components/pricing/PricingPage.tsx` with:**

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { calculateSubtotal, pricePerCopy } from "@/lib/stripe/pricing";
import { trackStartBookClick } from "@/lib/analytics";
import { isFreeTierEnabled } from "@/lib/feature-flags";
import PricingFaq from "./PricingFaq";

/**
 * PRICING PAGE: the price and its justification in one visual field.
 *
 * Design: one invitation-style card. Per-person price + stepper on the left,
 * the itemized service ("What's included") on the right, stacked on mobile.
 * The buyer's anchor is a $39 store cookbook; the list is the answer.
 */

// Reason: mirror the checkout cap (QuantityStep MAX_COPIES) so the stepper
// never previews a quantity the close flow can't actually order.
const MAX_COPIES = 10;

// Reason: the editing/photos/design work happens after payment and is
// invisible at the moment of price shock; naming it next to the number is
// the point of this layout. Keep in sync with OrderCart and HandmadeCallout.
const included = [
  {
    lead: "Every recipe, cleaned up.",
    rest: "Typos out, measurements consistent, instructions that actually work in a kitchen.",
  },
  {
    lead: "A full-color photo for every dish,",
    rest: "made for the book.",
  },
  {
    lead: "Invite everyone.",
    rest: "50 recipes included; each one after that adds $1.",
  },
  {
    lead: "Designed page by page.",
    rest: "Hardcover, full color, 8 × 10 in.",
  },
  {
    lead: "Printed and shipped.",
    rest: "At your door 3 to 4 weeks after you close.",
  },
];

function CornerFlourish({ className }: { className: string }) {
  return (
    <div className={`absolute w-10 h-10 opacity-[0.08] ${className}`}>
      <svg viewBox="0 0 48 48" className="w-full h-full text-brand-honey">
        <path d="M6 6C6 6 24 2 42 6" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        <path d="M6 6C6 6 2 24 6 42" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      </svg>
    </div>
  );
}

export default function PricingPage() {
  const router = useRouter();

  // Reason: default to 1 copy, the honest single price. The stepper reveals
  // the group drop (169 → 129 → 113 …) instead of preloading a group price.
  const [qty, setQty] = useState(1);

  const handleStartBook = () => {
    trackStartBookClick("pricing_card_primary");
    router.push(isFreeTierEnabled() ? "/onboarding/welcome" : "/onboarding");
  };

  const handleContact = () => {
    window.location.href = "mailto:team@smallplatesandcompany.com";
  };

  return (
    <main className="min-h-screen bg-[hsl(var(--brand-warm-white))]">
      {/* Header */}
      <section className="pt-32 pb-6 md:pt-44 md:pb-10">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <motion.h1
            className="type-heading font-normal"
            style={{ letterSpacing: "-0.02em" }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            Here&rsquo;s what it costs.
          </motion.h1>
          <motion.p
            className="mt-4 type-body-small text-[hsl(var(--brand-warm-gray-light))]"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            And everything that&rsquo;s included.
          </motion.p>
        </div>
      </section>

      {/* Pricing card */}
      <section className="pb-14 md:pb-16">
        <div className="mx-auto max-w-4xl px-6">
          <motion.div
            className="relative bg-white rounded-2xl shadow-xl border border-brand-honey/20 overflow-hidden"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
          >
            <CornerFlourish className="top-4 left-4" />
            <CornerFlourish className="top-4 right-4 -scale-x-100" />
            <CornerFlourish className="bottom-4 left-4 -scale-y-100" />
            <CornerFlourish className="bottom-4 right-4 scale-[-1]" />

            <div className="px-8 py-10 md:px-12 md:py-12">
              <p className="mb-10 text-center font-sans text-xs font-medium uppercase tracking-[0.15em] text-brand-honey">
                Free to start · Pay only when it&rsquo;s ready to print
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-12 md:items-center">
                {/* Left: price + stepper */}
                <div className="text-center">
                  <p
                    className="font-serif text-6xl md:text-7xl text-brand-charcoal tabular-nums"
                    aria-live="polite"
                  >
                    ${pricePerCopy(qty)}
                  </p>
                  <p className="mt-2 type-caption">per person</p>

                  <div className="mt-7 flex items-center justify-center gap-4">
                    <button
                      type="button"
                      onClick={() => setQty((q) => Math.max(1, q - 1))}
                      disabled={qty <= 1}
                      aria-label="Fewer copies"
                      className="flex h-9 w-9 items-center justify-center rounded-full border-[1.5px] border-brand-charcoal/15 text-brand-charcoal transition-colors hover:border-brand-honey disabled:opacity-25 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-honey"
                    >
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M5 12h14" /></svg>
                    </button>
                    <span className="min-w-[5.5rem] text-center font-serif text-lg tabular-nums text-brand-charcoal">
                      {qty === 1 ? "1 copy" : `${qty} copies`}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQty((q) => Math.min(MAX_COPIES, q + 1))}
                      disabled={qty >= MAX_COPIES}
                      aria-label="More copies"
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-honey text-white transition-colors hover:bg-brand-honey-dark disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-honey"
                    >
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
                    </button>
                  </div>

                  <p className="mt-4 text-sm text-[hsl(var(--brand-warm-gray-light))] tabular-nums">
                    ${calculateSubtotal(qty)} total · shipping included
                    {qty >= 6 && <span className="ml-2 text-brand-honey">best price</span>}
                  </p>

                  <p className="mt-5 type-body-small text-[15px] max-w-[260px] mx-auto">
                    Everyone who chips in gets a copy. More people, less each.
                  </p>
                </div>

                {/* Right: what's included */}
                <div>
                  <p className="type-eyebrow mb-5">What&rsquo;s included</p>
                  <ul className="space-y-4">
                    {included.map((item) => (
                      <li key={item.lead} className="flex gap-3">
                        <span
                          className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-brand-honey"
                          aria-hidden="true"
                        />
                        <p className="type-body-small text-[15px]">
                          <span className="font-medium text-brand-charcoal">{item.lead}</span>{" "}
                          {item.rest}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* CTA strip */}
            <div className="bg-[#FDFCFA] border-t border-brand-sand px-8 py-8 md:px-12 text-center">
              <button
                onClick={handleStartBook}
                className="inline-flex items-center justify-center rounded-full bg-brand-honey hover:bg-brand-honey-dark text-white px-10 py-4 text-lg font-medium shadow-lg transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-honey"
              >
                Start the Book
              </button>
              <div className="mt-5">
                <button
                  onClick={handleContact}
                  className="text-[hsl(var(--brand-warm-gray-light))] text-sm hover:text-brand-honey transition-colors duration-200"
                >
                  Need something different? Let&apos;s figure it out →
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* The human check: the claim competitors can't make, its own beat */}
      <section className="pb-16 md:pb-24">
        <div className="mx-auto max-w-3xl px-6">
          <motion.p
            className="type-accent text-center text-lg md:text-xl text-brand-charcoal/75"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
          >
            And before anything goes to print, a real person has read every
            recipe. Every time.
          </motion.p>
        </div>
      </section>

      <PricingFaq />
    </main>
  );
}
```

- [ ] **Step 2: Verify types and lint**

Run: `npx tsc --noEmit`
Expected: clean.

Run: `npm run lint`
Expected: no new errors (warnings pre-existing elsewhere are fine).

- [ ] **Step 3: Verify copy rules mechanically**

Run: `grep -n "—" components/pricing/PricingPage.tsx components/pricing/PricingFaq.tsx`
Expected: no hits in string literals (the arrow → inside code comments is fine; em dash — must not appear at all).

Run: `grep -inE "cherish|treasure|memories|special|unique|loved ones|celebrate|journey|curated|perfect|amazing|magical|timeless|forever|keepsake|heartfelt|meaningful" components/pricing/PricingPage.tsx components/pricing/PricingFaq.tsx`
Expected: no hits.

- [ ] **Step 4: Commit**

```bash
git add components/pricing/PricingPage.tsx
git commit -m "feat(pricing): two-column card puts the price and its justification in one visual field"
```

---

### Task 5: Final verification and visual sign-off

**Files:**
- Read-only: `components/profile/groups/review/OrderCart.tsx` (or wherever OrderCart lives; find with `grep -rl "OrderCart" components`), `HandmadeCallout` component.

**Interfaces:**
- Consumes: everything above.
- Produces: verification evidence for Ricardo.

- [ ] **Step 1: Sync check with the other two service descriptions**

Run: `grep -rln "HandmadeCallout\|OrderCart" components app | grep -v node_modules`
Read the service claims in both components and confirm the card's included-list makes no claim they contradict (cleaning at upload, photos post-payment, human read pre-print, 3-4 weeks). If a contradiction exists, report it to Ricardo; do NOT edit those files in this branch without his OK.

- [ ] **Step 2: Full type + lint pass**

Run: `npx tsc --noEmit && npm run lint`
Expected: both clean.

- [ ] **Step 3: Visual check**

Run: `npm run dev`
Ask Ricardo for screenshots of `http://localhost:3000/pricing` (desktop AND mobile width). Do not set up Playwright or headless browsers. Confirm: stepper drops the hero price live, two columns on desktop, stacked on mobile, `best price` appears at 6 copies.

- [ ] **Step 4: Update the design doc status**

In `docs/superpowers/specs/2026-07-12-pricing-page-redesign-design.md`, change `**Status:** pending Ricardo's approval` to `**Status:** approved (Ricardo, 2026-07-12) · implemented`.

```bash
git add docs/superpowers/specs/2026-07-12-pricing-page-redesign-design.md
git commit -m "docs(pricing): mark spec implemented"
```
