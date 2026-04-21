# Phase 1.2 Token Migration — Follow-ups

**Created:** April 2026, after Phase 1.2 closure at commit `b001437`.

**Branch at creation:** `pivot/stripe-checkout-hosted`.

## What this doc is

Phase 1.2 migrated ~990+ hardcoded hex literals to existing brand tokens across 14 commits (Lotes A + B + C + closure). This doc lists everything the final recon found remaining in the codebase, grouped by **nature of the work pending** rather than by file location.

Use this doc when:
- Starting a new cleanup session and wanting to know what's left.
- Considering whether to add a new token tier or collapse usage to existing ones.
- Wondering why a specific hex still exists as literal in the codebase.

## Phase 1.2 commit history (reference)

| Lote | Commits | Scope |
|------|---------|-------|
| A | `76836ca`, `f2a71c0`, `0522e90`, `756ac08` | Charcoal + Honey + Honey-dark realign & drift |
| B | `8cb6dc3`, `983b67d`, `8a6a126` (reverted), `19fe16c`, `a411422` | Sand realign + Sand migration + Terracotta + two-warm-white revert |
| C | `12a4ef2`, `ed2cdcd`, `284fbeb`, `f65dc4f` | Warm-gray rename + 3 warm-gray token migrations |
| Closure | `b001437` | 2 missed literals (warm-white, olive) → existing tokens |

Total: ~990+ hex literals migrated. All pushed to `pivot/stripe-checkout-hosted`.

---

## Section A — Deferred migrations to existing tokens

These are hex literals that map cleanly to tokens that already exist in the system. They were scoped out of Phase 1.2 lotes but could be picked up as a future lightweight lote without any design decisions.

### A.1 — Cream (`#F5F1EB`) — 7 hits

Maps to existing token `brand.cream` (canonical `#F5F1EB`).

| File | Hits |
|------|------|
| `components/landing/TheBook/SpecsGrid.tsx` | multiple |
| `components/landing/TheBook/HandmadeCallout.tsx` | multiple |
| `components/landing/TheBook/DetailStrip.tsx` | multiple |
| `components/landing/TheBook.tsx:193` | 1 |

All used as card/section background. Lote D candidate — pure mechanical migration, zero design decisions.

### A.2 — Sand drift (`#E5DDD5`) — 4 hits

Close to `brand.sand` canonical `#E8E0D5` (ΔR=3, ΔG=3, ΔB=0 — sub-perceptual drift).

| File | Lines |
|------|-------|
| `components/landing/BookPreview/Book.css` | 178, 351, 414, 453 |

All used as border colors inside the faux-book-interior CSS. Could collapse to `hsl(var(--brand-sand))` with zero visual change — BUT note that Book.css as a whole uses Tailwind cool-gray palette for a deliberate faux-interior aesthetic (see Section E). Decision needed: migrate these 4 to warm sand, or preserve Book.css as an off-brand-system file in full.

### A.3 — Honey-dark drift (`#B8923A`) — 1 hit

Close to `brand.honey-dark` canonical `#C49B4A` (drift of ~12 points in R channel, smaller in G/B).

| File | Line | Context |
|------|------|---------|
| `components/onboarding/WelcomeStep.tsx` | (recon didn't pin exact line) | hover state on a honey-darker element |

Single occurrence — either migrate to the token or leave as literal. Worth context inspection before deciding (check sibling colors in the component).

---

## Section B — Lote C warm-gray UNKNOWN (7 hits, 3 unique)

These surfaced during Lote C recon as hex values that don't map to any existing warm-gray token. They were explicitly deferred from Lote C scope pending a design decision on tier expansion.

### B.1 — `#5A5550` × 4

| File | Line |
|------|------|
| `app/check-your-email/ResendButton.tsx` | 79 |
| `app/(auth)/onboarding/page.tsx` | 196, 227, 252 |

Semantic role: disabled states + info-box copy. The consistency (4 hits in coherent contexts) suggests intentional tier, not accidental drift.

**Tentative name if tokenized:** `brand.warm-gray-darker` (darker than `brand.warm-gray-dark` which is canonical `#6B6966`).

### B.2 — `#C8C3BC` × 2

| File | Line |
|------|------|
| `app/welcome/page.tsx` | 238 |
| `components/profile/groups/CoupleNamesModal.tsx` | 360 |

Semantic role: ultra-quiet fine-print captions. Lighter than `brand.warm-gray-light` (`#9A9590`).

**Tentative name if tokenized:** `brand.warm-gray-lightest`.

### B.3 — `#B0ADA8` × 1

| File | Line |
|------|------|
| `components/profile/groups/PostCloseFlow.tsx` | 163 |

Single hit, sits between `warm-gray-light` and `#C8C3BC`. Used as strike-through color for an old price in the post-close flow. Likely one-off — probably stays as literal unless a broader semantic tier emerges.

### Decision pending for Section B

Three options for the warm-gray UNKNOWN family:

1. **Expand the system** with `warm-gray-darker` + `warm-gray-lightest`. Covers 6 of 7 hits cleanly. `#B0ADA8` stays literal or collapses to nearest new tier.
2. **Collapse to nearest existing token.** Loses tonal intent — `#5A5550` disabled states probably don't want to render as `warm-gray-dark` (they'd appear lighter than intended).
3. **Leave as literal indefinitely.** Keeps the system compact but the hex literals are unprotected from future drift.

---

## Section C — Structural gaps revealed by Phase 1.2 recon

These are patterns that Phase 1.2 recon surfaced as systemic — not one-off drifts, but authoring patterns that suggest the current token system is sub-dimensioned in certain areas.

### C.1 — Charcoal-hover tier (`#1A1A1A` × 6)

Consistent pattern across landing: `hover:bg-[#1A1A1A]` on buttons with `bg-brand-charcoal` base.

| File | Context |
|------|---------|
| `components/landing/ForGiftGivers.tsx:198` | CTA hover |
| `components/landing/TheBook.tsx:61` | CTA hover |
| `app/(auth)/onboarding/page.tsx:275` | button hover |
| (+ 3 others) | same pattern |

Six identical usages of a darker-than-charcoal hover with no token. Cleanest new-token opportunity from Phase 1.2.

**Tentative name:** `brand.charcoal-hover` or `brand.charcoal-900`.

**Effort:** add token definition + migrate 6 call sites. Low.

### C.2 — Warm near-white / cream accent cluster (~42 hits, ~18 uniques)

The largest cluster of orphans by volume. Two sub-families visible:

**Sub-cluster C.2.a — Pure warm off-whites (between warm-white and cream):**

| Hex | Count | Example files |
|-----|-------|---------------|
| `#F5F3EF` | 9 | order-flow page bg (`copy/[bookId]/**`, `PostCloseFlow`) |
| `#F5F5F4` | 7 | scattered |
| `#FAF8F4` | 6 | `welcome` + callback pages inline-style bg |
| `#FDFBF7` | 2 | `Book.css` |
| `#F5F1EA` | 2 | onboarding disabled-state bg (1-byte drift of cream `#F5F1EB`) |
| + ~10 one-offs | 1 each | `#FDFCFA`, `#FDFBF8`, `#FDF9F0`, `#FBF7F0`, `#F5F5F0`, `#F5F3F0`, `#EDE8E0`, `#E8E6E1` |

**Sub-cluster C.2.b — Peachy creams (distinct chromatic family, not off-white):**

| Hex | Count | Example files |
|-----|-------|---------------|
| `#FFF8EC` | 4 | `ImportGuestsModal` peachy cream |
| `#FFF8F0` | 3 | `AddRecipeModal` hover cream |
| + 3 one-offs | 1 each | `#FFF8DC`, `#FFF0E6`, `#FFE8D9`, `#FDF2F8` |

### Diagnosis

The 18 unique values across 42 hits suggest accumulated drift from multiple authoring sessions, not an intentional system. But the **two sub-clusters are chromatically distinct** — C.2.a are warm-neutral off-whites, C.2.b are peach-tinted. Collapsing both to a single "off-white accent" token would lose the peachy differentiation.

### Decision pending for C.2

Four options, each with different scope:

1. **Add one tier — warm off-white accent** (e.g., `brand.warm-white-accent` around `#F5F3EF`). Covers C.2.a well, forces C.2.b to either collapse or stay literal.
2. **Add two tiers** — off-white accent + peach cream. Covers both sub-clusters. Larger system.
3. **Deep-audit each hit first** — many of these may be unintentional drift from specific designers or libraries; collapsing them to canonical warm-white (#FAF9F7) or cream (#F5F1EB) may produce zero visual regression if tested.
4. **Leave as literal for now.** These are all low-contrast surfaces; drift is not visually breaking.

Option 3 is the most informative before committing to Options 1 or 2.

### C.3 — Semantic tokens absent (~10 hits, 7 unique)

The brand system has no success / error / warning tokens. Current codebase reaches for Tailwind or improvised hex:

| Hex | Count | Role | Files |
|-----|-------|------|-------|
| `#3D9970` | 2 | success green | `CoupleNamesModal` (live status dot + text) |
| `#14532D` | 1 | dark green text | `PostCloseFlow` shipping note |
| `#557A50` | 2 | green pill | tips category |
| `#F5EDD8` + `#7A5C10` | 1 + 1 | warning pill (bg + text pair) | `PostCloseFlow` strike-through price |
| `#F44336` | 1 | error red | `use-cases/mcp-server/**` (vendored boilerplate, may not be production) |

### Decision pending for C.3

Semantic tokens are a system-design conversation, not a migration:

- What semantic statuses does the product need? (success, error, warning, info?)
- Should the palette match `brand.olive` for success? Introduce a new brand-green?
- Error red — warm (terracotta-adjacent) or true signaling red?

This work is **bigger than a Lote**. Deserves its own brief before any migration.

### C.4 — Warm-gray one-offs "between tiers" (~5 hits)

Hex values that sit between existing warm-gray tokens, each with 1 usage:

| Hex | File | Nearest token | Role |
|-----|------|---------------|------|
| `#B5A89A` | `RecipeCardGrid` action-btn text | between border-button and `warm-gray-light` | action text |
| `#5A5855` | `PostCloseFlow` pill text | between `warm-gray-dark` and black | pill text |
| `#4A4A4A` | `SuccessStep` recipe name emphasis | between charcoal and `#1A1A1A` hover | emphasis |
| `#6F6F6F` | `FeatureCard` body text | cool-neutral, not warm — see Section E | body |

All 1-off. Likely candidates for per-case decision: collapse to nearest warm-gray, promote charcoal for `#4A4A4A`, leave `#6F6F6F` as cool-neutral literal.

---

## Section D — Product / design decisions pending

### D.1 — OnboardingBadge cool-navy palette

Coherent 3-color palette, off the warm-brand register entirely:

| Hex | Count | Role |
|-----|-------|------|
| `#5A5A7A` | 2 | ring + borderColor |
| `#464665` | 2 | backgroundColor + number color |
| `#6B6B8A` | 1 | border on inner avatar |

All inside `components/onboarding/OnboardingBadge.tsx` (5 hits, coherent mini-palette).

**The question is not technical but product:** should the onboarding badge live outside the brand system to distinguish itself visually, or should it be brought in with a dedicated `brand.badge-*` namespace? Recon suggests the distinctiveness is intentional.

**Until decided:** leave as literal. Document here so no future Lote tries to migrate it thinking it's drift.

---

## Section E — Deliberately preserved as literal (no action, ever)

These hex values will stay as literals permanently. Documented here so future recons don't re-flag them.

### E.1 — Warm-white accent `#FAF7F2` (61 hits)

The two-tone warm-white system is intentional:

- `--brand-warm-white` / `--brand-background` = `#FAF9F7` (airy; body/shadcn defaults)
- Warm-white accent = `#FAF7F2` (intentional large-surface fill, 61 hits)

The two-tone contrast is a Kinfolk editorial rhythm. Commit `8a6a126` that collapsed both into one was reverted (`19fe16c`) — the single-tone result felt too beige/heavy.

**Rule:** `#FAF7F2` stays literal. Never tokenize.

### E.2 — Gradient units in `TheBook.tsx` (9 hits)

Decorative `linear-gradient()` and `repeating-linear-gradient()` stops used for book-cover aesthetic:

| Hex | Use |
|-----|-----|
| `#FAF8F5` × 2 | `TheBook.tsx:138` repeating-linear-gradient stop |
| `#F0ECE6` × 2 | same |
| `#E8E0D8` | `TheBook.tsx:124` linear-gradient (first stop) |
| `#D8D0C8` | same (middle stop) |
| `#C8C0B8` | same (last stop) |
| `#FEFEFE` | `ForGiftGivers.tsx:59` white→white gradient middle stop |
| `#FFFFFF` × 3 | pure white gradient stops |

**Rule:** gradient stops are design units, not atomic colors. Preserve. Same pattern as `BookClosedStatus` radial gradient preserved in Lote B.

### E.3 — Book.css faux-book-interior palette (~18 hits)

`components/landing/BookPreview/Book.css` uses Tailwind cool-gray palette for a deliberate faux-interior aesthetic:

`#1F2937`, `#374151`, `#4B5563`, `#6B7280` (Tailwind gray-500 through -800) + `#E5DDD5` (sand drift, see A.2) + `#FDFBF7` (warm off-white, see C.2).

The cool grays are intentional — mimics printed book page interior. Different tonal family from the brand warm system.

**Rule:** Book.css is an off-brand-system file. Don't try to unify its palette with the brand tokens. The sand drift hits (A.2) are an open question; everything else in the file is by design.

### E.4 — CustomizeCollectorModal theme-picker swatches (10 hits)

Decorative theme-identifier color pairs in a data array:

| Theme | Hexes |
|-------|-------|
| Playful | `#EC4899`, `#FDF2F8` |
| Modern | `#2563EB`, `#EFF6FF` |
| Elegant | `#1F2937`, `#F9FAFB` |
| Warm & Cozy | `#8B4513`, `#FFF8DC` |
| Classic | `#000000`, `#FFFFFF` |

**Rule:** these are deliberately-diverse primitives used to visually distinguish themes in a picker. Not semantic app colors. Preserve as literal.

### E.5 — Google OAuth logo SVG fills (4 hits)

`components/auth/LoginModal.tsx`:

`#4285F4` (blue), `#34A853` (green), `#FBBC05` (yellow), `#EA4335` (red).

**Rule:** Google brand assets. Must remain literal.

### E.6 — Markdown prose in code strings

`lib/tiktok-agent/system-prompt.ts` — hex values inside prose not rendered by the agent (e.g., `#2D2D2D`, `#D4A854` as part of a brand colors list).

**Rule:** durable exclusion. Literal hex in prose strings inside code is not production render output.

### E.7 — Email templates

`lib/postmark.ts`, `lib/email/**`, `scripts/email/**` — email clients don't resolve CSS variables, so all color values in email-bound code must stay as literal hex.

**Rule:** permanent durable exclusion from any token migration.

### E.8 — ExtendScript / satori / next-og routes

- `scripts/indesign/**` — InDesign ExtendScript can't resolve CSS vars.
- `app/api/v1/admin/showcase/preview/` — satori / next-og rendering doesn't resolve CSS vars.

**Rule:** permanent durable exclusion.

---

## Closing notes

### Durable rules learned during Phase 1.2

1. **`globals.css` has a dual role.** It defines CSS vars AND contains `@apply` utility classes that consume tokens. Two Lote-C commits (`.btn-tertiary` in C.0, `.type-caption` in C.2) rescued internal consumers that initial recon missed. Each lote recon must sweep `globals.css` full-file, not just its definition section. Closing baseline: utility-class hex-in-bracket inventory is empty.

2. **Token fantasma pattern.** Tokens can exist in `tailwind.config.ts` + `globals.css` with zero consumers. Phase 1.2 revealed two: `brand.warm-gray-light` (had 87 hex consumers hardcoded before C.1 migration) and `brand.olive` (had 1 hex consumer hardcoded before the closure commit). When considering whether to add a new token, check first if the desired token already exists unused.

3. **Pre-migration recon must classify semantically, not just chromatically.** Lote C was the first batch where tokens were close in value (L=41%, L=52%, L=58%). Chromatic distance alone was insufficient to map drift — semantic usage of each token had to be inspected before migration could proceed.

4. **Naming ordering by lightness prevents future confusion.** `brand.light-gray` was renamed to `brand.warm-gray-dark` in C.0 because "light" was actually the darkest. The current family is ordered `warm-gray-dark` → `warm-gray` → `warm-gray-light`, self-explanatory.

5. **Gradient units are preserved as literal.** `linear-gradient(...)` and `radial-gradient(...)` stops are design units, not atomic colors. Never migrate gradient stops to tokens unless the entire gradient is being redesigned.

### What's NOT covered by this doc

- Anything outside Phase 1.2 scope (e.g., token system refresh for other product surfaces, responsive typography, spacing tokens).
- Decisions that require product input (OnboardingBadge, semantic tokens).
- Book.css as a whole — it's an intentional off-system file.
