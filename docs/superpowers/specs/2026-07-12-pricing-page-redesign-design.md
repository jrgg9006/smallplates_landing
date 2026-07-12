# Pricing Page Redesign — Design Spec

**Date:** 2026-07-12 · **Branch:** `feature/pricing-page-redesign` · **Status:** approved (Ricardo, 2026-07-12) · implemented

## Context

Inspired by Tribute.co's pricing page: they justify price with itemized labor bullets adjacent to the price, objection-killing FAQs, and social proof at the point of sale. Our current `/pricing` leads with the volume table (mechanics) and buries the value justification ("What the price actually covers") below the fold. The buyer's mental anchor is a $39 store cookbook; the answer to "why $169?" must live in the same visual field as the number.

## Decisions (agreed with Ricardo)

1. **Numbers frozen.** Design/copy only. The current $169 cascade in `lib/stripe/pricing.ts` is untouched. The $199 curve from the growth plan is a separate future project.
2. **Scope: `/pricing` page only.** `PricingBlock` on the main landing is NOT touched.
3. **Hero number: per-person price, default 1 copy ($169).** Stepper [−]/[+] makes the price drop live (169 → 129 → 113 → 103 → 95 → 89 floor).
4. **Layout: two-column card on desktop** (price + stepper left, "What's included" list right), stacked on mobile. CTA at card bottom.
5. **FAQs: yes, 7 questions**, flat text with hairlines (no accordion).
6. **Repurchase rule (Option B, confirmed):** every order prices by its own quantity using the same cascade; nothing accumulates across orders. "El descuento es por caja, no por cliente." This is already what checkout does (both `create-checkout-extras-dashboard-session` and `create-checkout-copy-order-session` restart the cascade). No checkout code changes.
7. **Public FAQ is currently lying** (`app/(public)/faq/_components/faq-data.ts` says "later copies $129 + $14 shipping"): fix it to the cascade-restart rule as part of this project.

## Page structure (top to bottom)

1. **Header** — H1 + subline confronting the price question directly.
2. **Card** — two-column (desktop) / stacked (mobile). Keeps invitation look (honey border, corner flourishes), wider than today.
3. **Human line** — its own beat between card and FAQs.
4. **FAQs** — 7 questions. Absorbs the old "A few things to know."

**Removed:** the 6-row copy table (replaced by stepper), the 3-act "What the price actually covers" section (content moves into the card list), spec tags row, "A few things to know."

## Copy (final, Small Plates voice: no banned words, no em dashes)

### Header
- H1 (`type-heading`): **Here's what it costs.**
- Subline (`type-body-small`): **And everything that's included.**

### Card

Eyebrow (top, centered): `FREE TO START · PAY ONLY WHEN IT'S READY TO PRINT`

**Left column:**
- Hero: **$169** + `per person` beneath
- Stepper: `[−]  1 copy  [+]` (range 1–10, mirrors checkout `MAX_COPIES`)
- Total line: `$169 total · shipping included` (always per-person × copies, from `calculateSubtotal`)
- `best price` tag appears at 6+ (as today)
- Microcopy: **Everyone who chips in gets a copy. More people, less each.**

**Right column — "What's included":**
1. **Every recipe, cleaned up.** Typos out, measurements consistent, instructions that actually work in a kitchen.
2. **A full-color photo for every dish**, made for the book.
3. **Invite everyone.** 50 recipes included; each one after that adds $1.
4. **Designed page by page.** Hardcover, full color, 8 × 10 in.
5. **Printed and shipped.** At your door 3 to 4 weeks after you close.

**CTA strip (card bottom):** button `Start the Book` (routes via `isFreeTierEnabled()` → `/onboarding/welcome`, keeps `trackStartBookClick('pricing_card_primary')`), secondary link `Need something different? Let's figure it out →` (mailto).

### Human line (between card and FAQs, `type-accent`)
> And before anything goes to print, a real person has read every recipe. Every time.

### FAQs (7)

1. **When do I pay?** Not now. Starting a book is free: invite people, collect recipes, take your time. You pay once, when you close the book and send it to print.
2. **Who pays, me or everyone?** One card pays at checkout. The price is per person, so splitting is easy: everyone sends you their share, everyone gets their copy.
3. **What if we don't collect enough recipes?** A book needs 25 recipes to go to print. Most groups pass that in the first week. 50 recipes are included; after that, each one adds $1 to your total.
4. **Can I see the recipes before it prints?** The text, yes. You see every recipe as it comes in, including the cleaned-up version. The photos are made after you order, by hand, so those arrive with the book.
5. **How long does it take?** Most books are at your door 3 to 4 weeks after you close the collection.
6. **Can we order more copies later?** Yes, anytime. Later orders work exactly like the first one: one copy is $169 and the price per copy drops the more you print together, down to $89 each from 6. Separate orders don't combine, so the cheapest copies are the ones the group orders together.
7. **Is any of this public?** No. Only people with your invite link can see or add anything. The book exists in exactly as many copies as you print.

Copy accuracy constraints honored: recipe text cleaning is visible at upload; photos are made post-payment (manual) and arrive with the book; no preview of the final book design; no reminder promises.

## Public FAQ fix (`app/(public)/faq/_components/faq-data.ts`)

- `extra-copies` answer (~line 106): replace "$129 plus $14 shipping" with the cascade-restart rule (same wording as pricing FAQ #6, adapted).
- Shipping answer (~line 324): remove "Single copies ordered later ship for $14"; shipping is included in every order's cascade.

## Technical notes

**Files touched:**
- `components/pricing/PricingPage.tsx` — rewrite. To stay under 300 lines, extract into `components/pricing/`: `PricingFaq.tsx` (data + section) and, if needed, `IncludedList.tsx`. All numbers via `pricePerCopy` / `calculateSubtotal`.
- `app/(public)/faq/_components/faq-data.ts` — the two answers above.
- `lib/stripe/pricing.ts` — comments only: the "post-close flat $129" comments are stale and caused real confusion; update them to describe the cascade-restart reality. If `ADDITIONAL_BOOK_PRICE` / `EXTRA_COPIES_SHIPPING_COST` prove unused at implementation time (only hit today is a re-export in `lib/stripe/client.ts`), remove both constants and the re-export.

**Not touched:** checkout routes, Stripe logic, `PricingBlock`, OrderCart, HandmadeCallout (verify their service wording still matches the card's included-list claims; they describe the same service in the purchase flow).

**Conventions:** `type-*` typography classes for all marketing text; brand tokens for colors; framer-motion entrances as today; no new dependencies.

**Verification:** `npx tsc --noEmit` + `npm run lint` at the end; visual check via Ricardo's screenshot (no headless browser setup).

## Out of scope (noted for later)

- $199 curve implementation (growth plan).
- Occasion landing pages (`/for/[occasion]`) — separate hypothesis, revisit after the Meta test.
- Reprint mini-curve or any pricing number changes.
- Whether to add social proof near the price (we have no review volume yet; revisit post-launch).
