# Landing Multi-Product v1 — Design Spec

**Date:** 2026-08-07
**Branch:** `feature/landing-multi-product`
**Status:** Approved in brainstorming session; pending founder review of this document.

---

## 1. Context and goal

Small Plates moves from one product (wedding cookbooks) to a platform: cookbooks split into two formats (Gift and Cookbook Club) plus a new second object (Framed Tiles). Same platform, same onboarding engine, same dish-generation technology underneath.

Business logic: one product, two audiences (gift buyer, club founder). Tiles capture small groups (2 to 6 people) without cannibalizing the cookbook, which targets groups of 8+. Tile pricing lands around $99 per tile per person (final price TBD).

**Goal of this change:** adapt the main landing page with the minimum set of changes needed to (a) position Small Plates as a multi-product platform under one concept, and (b) test demand for Club and Tiles with real traffic. This is a business-case test, not a redesign.

Source documents (founder's, on Desktop, not yet in repo): `brand-platform-club.md`, `design-brief.md`, `product-design.md`.

## 2. Decisions already made (conversation log)

- Gift and Club are two doors into the same product. No conversion path between them.
- Pricing unchanged: same cascade (from $169, volume discount), founder pays at close. The `product-design.md` line "every member pays for their own copy" is aspirational, not v1.
- The club closes like any book today. Open editions are a future infrastructure change.
- Vocabulary swap on club path only: organizer/guests → founders/members. Happens in onboarding, not on this landing (except inside club-facing copy).
- At launch, both Club onboarding and the Tiles flow will be real (no waitlists). Their CTAs point to real flows. See §8 for sequencing.
- Structure: **early router** (3 doors after hero), doors are **same-page anchors**, **pricing lives with each product** (no comparison table).
- Tiles section sits late in the page (flagship-first). The router card gives tiles first-scroll visibility, so no trade-off.

## 3. Research basis

9 brands verified live (Storyworth, Framebridge, Our Place, Blueland, Ghia, Material Kitchen, Artifact Uprising, Papier, Hedley & Bennett). Findings that shaped this design:

1. **Idea-led heroes always name the object** in the same line ("Non-Toxic Cookware, By Design"). Never abstract concept alone.
2. **Nobody puts the manifesto at the top.** Belief is one line up top; development lives mid/low page.
3. **A selector right under the hero is the norm** (5 of 9), even among idea-led brands.
4. **Price anchors, not price tables.** "From $X" or nothing.
5. Structural analog is Storyworth only (collaborative flow product, flagship-first, gift/for-me tabs in How It Works). Catalog brands (Artifact Uprising, Papier) are the wrong model: they sell SKUs, we explain a category.
6. Anti-pattern with a name: Hedley & Bennett (discount-led homepage, brand story in footer). Do not drift toward shop signals: mega-menus, discount badges, product tabs.

**Deliberate deviation:** PricingBlock keeps the full cascade on the homepage. None of the 9 brands shows this much pricing detail. Kept because price transparency is part of our conversion; recorded here as a decision, not an oversight.

## 4. Page structure (new order)

```
Banner                      (unchanged)
Hero                        (copy: idea + object in one line)
ProductRouter    ← NEW      (3 doors)
TestimonialBar              (unchanged)
TheSolution                 (light copy pass: multi-occasion, no wedding-only assumptions)
HowItWorks                  (gains gift/club toggle)
TheClub          ← NEW      (id="club")
CookbookSpecialist          (unchanged)
PricingBlock                (unchanged + eyebrow scoping it to THE COOKBOOK)
BooksPrinted                (unchanged)
PersonalNotes               (unchanged)
TestimonialsSection         (unchanged)
TheBook                     (unchanged)
TheTiles         ← NEW      (id="tiles")
EmotionalClose              (unchanged)
FAQ                         (+ club and tiles entries)
NewsletterSignup / Footer   (unchanged)
```

3 new components (ProductRouter, TheClub, TheTiles), 4 modified (Hero, HowItWorks, PricingBlock, FAQ), rest untouched. Page file: `app/(public)/page.tsx`. Components: `components/landing/`.

## 5. Component specs

### 5.1 Hero (modified)

Copy only; no structural change. The headline states the idea AND names the object (per research finding 1). It can no longer assume wedding or gift-only. Primary CTA unchanged: cookbook onboarding (`/onboarding/welcome`), because gift remains the flagship.

### 5.2 ProductRouter (new)

Three cards directly under the hero. Each card is concrete, no poetry: **object + who it's for + price anchor + action.**

| Card | Who | Anchor price | Target |
|---|---|---|---|
| A gift cookbook | for someone you love | from $169 | scroll to `#how-it-works` (toggle preset: gift) |
| A club cookbook | for your group, no occasion needed | from $169 | scroll to `#club` |
| Framed tiles | for your kitchen wall, groups of 2 to 6 | from ~$99 per tile | scroll to `#tiles` |

Group-size logic (2-6 vs 8+) appears as a fact inside the cards, never as an entry question. Cards use existing type system (`type-subheading`, `type-body-small`, `type-caption`).

### 5.3 TheSolution (no change)

On inspection during implementation, this section required no changes. The existing copy already works for gift, club, and tiles without wedding-only or gift-only assumptions.

### 5.4 HowItWorks (modified)

Gains a two-state toggle: **As a gift / As a club** (Storyworth pattern). Same steps skeleton; per-state changes: vocabulary (guests vs members), the surprise beat (recipient sees nothing vs no surprise), and the closing step. Default state: gift. One component, local state, no routing.

### 5.5 TheClub (new, `id="club"`)

One section, not a mini-landing. Content beats (from `product-design.md`, condensed):

1. What it is: a group writes its own cookbook. Members, not guests. No honoree, no secret.
2. 3-4 concrete beats: the club has a name; every club sets its own rules; the signature is the credential; it prints in hardcover.
3. CTA: **Start a club** → club onboarding path.

**Open copy item:** the club authorship line (the club equivalent of "Recipes from the people who love her"). To be written during implementation, founder approves.

This is the highest-risk copy on the page (no proven pattern exists for explaining a self-made cookbook club in one scroll). Expect iteration.

### 5.6 PricingBlock (modified, minimal)

Content unchanged. Add/adjust eyebrow (`type-eyebrow`) so the section reads as cookbook pricing specifically (serves both gift and club, which share the cascade). No tile pricing here.

### 5.7 TheTiles (new, `id="tiles"`)

The "second object", Storyworth-style late placement. Content:

1. Product image (framed tiles on a kitchen wall).
2. What it is: each person sends one recipe, each dish becomes art, it arrives framed, ready to hang on a nail.
3. Who it's for: groups of 2 to 6.
4. Price anchor: **from $99 per tile** (single source: confirm final number before launch).
5. CTA: **Start your tiles** → tiles flow.

Note: the two source docs contradict each other (one tile per dish vs all dishes in one piece). The landing copy must stay agnostic on this until the founder resolves it; describe the outcome (framed, on your wall, made by your group) without committing to the layout.

### 5.8 FAQ (modified)

Add entries for: what is a cookbook club / how is it different from a gift book; what are the tiles / how many people / price; do tiles and books work the same way.

## 6. Copy rules (all new copy)

- Brand voice per `brand/voice.md`: banned vocabulary, no em dashes, no guest counts, no "showed up".
- Multi-occasion always; never wedding-only assumptions.
- Type system: `type-*` utilities only (see CLAUDE.md table).
- Logged-out CTAs → `/onboarding/welcome` derivatives, never old `/onboarding`.

## 7. Measurement (defined before launch, not after)

- Click-through per router door (3 events).
- CTA clicks: Start a club, Start your tiles.
- Baseline guard: conversion of the current gift flow (CompleteRegistration) must not drop; the router spends paid traffic on unproven flows and that cost must be visible.
- Events follow the existing GA4/Meta taxonomy (see funnel tracking, PR #36).

## 8. Dependencies and sequencing

Club onboarding and the Tiles flow are separate projects with their own specs (not designed here). The landing can be built now; it ships when those flows are live, or earlier with the club/tiles sections behind a flag. Timing decision belongs to the implementation plan.

**Important: Environment variable deployment behavior.** Next.js inlines NEXT_PUBLIC_* environment variables at build time. Toggling NEXT_PUBLIC_SHOW_CLUB or NEXT_PUBLIC_SHOW_TILES in the Vercel dashboard requires a new deployment to take effect. The changes will not go live on the next request against an existing deployment; restarting the server is not sufficient. Locally, changing .env.local requires restarting the dev server.

## 9. Out of scope (v1)

- Dedicated `/club` and `/tiles` landing pages (phase 2, for ads).
- Nav/header changes.
- Pricing comparison tables.
- Onboarding, dashboard, checkout changes (separate specs).
- Any change to the other landings (regalos, regalos-usa): explicitly excluded per standing rule.

## 10. Open items

1. Club authorship line (copy, founder approves).
2. Final tile price (before launch).
3. Tiles: one-tile-per-dish vs one composed piece (source docs contradict; blocks tiles copy detail, not the section itself).
4. Ship-behind-flag vs ship-when-flows-ready (implementation plan).
5. `public/images/tiles/tiles_kitchen_wall.jpg` does not exist. The tiles section needs a real product image before visual review.
6. The tiles CTA currently tracks the click and does nothing else, pending the tiles flow.
7. Hero, club, and tiles copy are working drafts pending founder approval.
