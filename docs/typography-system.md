# Typography System — Small Plates & Co.

**Created:** April 2026, as part of Phase 1.3 of the design-tokens migration.
**Status:** Source of truth. Any typography decision in code must comply with this doc.
**Companion docs:** `docs/working-method.md` (process), `docs/token-migration-followups.md` (Phase 1.2 color leftovers + structural gaps including some typography-adjacent items).

---

## Purpose

Before Phase 1.3, Small Plates had no typography token system. Three parallel ways of sizing text coexisted in the codebase:

1. Tailwind default utilities (`text-sm`, `text-lg`, `text-3xl`) — the dominant pattern, 2000+ hits.
2. A modern `type-*` utility set in `globals.css` (8 classes, ~12 heading adoptions).
3. A legacy `text-*` / `cookbook-*` / `logo-*` utility set in `globals.css` (16 classes, marked "do not use in new landing page code").

Plus 199 arbitrary-value font sizes (`text-[15px]`, `text-[0.72rem]`), 63 arbitrary letter-spacings, 23 arbitrary line-heights, and 26 inline `style={{ fontFamily }}` overrides.

The result was not drift. It was the absence of a system — every developer improvised their own scale decisions.

This doc defines the closed system that replaces all three parallel paths. After Phase 1.3 completes, **typography in the Small Plates codebase uses exactly 8 tokens**. No more.

---

## Core principles

### 1. Eight tokens, no more, no less

The entire product — landing, onboarding, dashboard, collect flow, admin, emails — uses 8 tokens for typography. Any visual need that doesn't fit one of the 8 indicates a design problem, not a system gap.

### 2. Tokens are indivisible for the "hard" dimensions

Within a token, the following are sealed and cannot be overridden:

- Font size
- Line height
- Letter spacing
- Font family

If you need a different size/line-height/tracking/family, you need a different token — not an override.

### 3. Three dimensions are modifiable on top of tokens

On top of any token, you can apply:

- **Weight** — Tailwind utilities like `font-medium`, `font-semibold`, `font-bold`
- **Italic** — Tailwind `italic` / `not-italic`
- **Color** — brand color tokens from Phase 1.2 (`text-brand-charcoal`, `text-brand-warm-gray`, etc.) plus opacity modifiers (`/70`, `/80`)

Plus common text transforms (`uppercase`, `lowercase`, `capitalize`) and decoration (`underline`, `no-underline`) which don't affect the token's typographic identity.

### 4. No arbitrary values

Arbitrary font-size (`text-[15px]`), line-height (`leading-[1.6]`), letter-spacing (`tracking-[0.15em]`), font-weight (`font-[500]`), and inline `style={{ fontSize }}` etc. are prohibited outside of the token definitions themselves.

The only legitimate place for an arbitrary value is inside the definition of a token in `tailwind.config.ts` or `globals.css`.

### 5. Every token has a clear semantic role

Tokens are named by what they communicate, not by their size. `text-body` is "the primary paragraph text of the interface." `text-caption` is "metadata and labels under the primary content." When you write code, you choose based on role, not dimension.

---

## The 8 tokens

| Token | Role | Size (mobile → desktop) | Weight default | Line-height | Letter-spacing | Family |
|-------|------|-------------------------|----------------|-------------|----------------|--------|
| `text-display` | Hero titulars, landing covers | 38px → 56px | medium | tight (1.1) | tight (-0.02em) | serif (Minion Pro) |
| `text-heading` | Section titles | 28px → 36px | medium | tight (1.15) | default | serif |
| `text-subheading` | Card / modal titles, subsection headers | 20px → 24px | medium | tight (1.2) | default | serif |
| `text-body` | Primary body copy (paragraphs, descriptions) | 16px | light | relaxed (1.65) | default | sans (Inter) |
| `text-body-small` | Secondary body copy (helper text, info boxes) | 14px | light | relaxed (1.6) | default | sans |
| `text-caption` | Metadata, timestamps, small labels | 13px | normal | normal (1.5) | default | sans |
| `text-eyebrow` | Kickers above headings, ALL CAPS labels | 11px | medium | normal (1.4) | wide (0.15em) | sans, uppercase |
| `text-action` | Button labels, CTAs, navigation | 15px | medium | none (1.0) | default | sans |

### Per-token semantic definitions

#### `text-display`

The most prominent typographic element on a page. Used exactly once per screen (or not at all). Responsive.

**Use for:**
- Landing hero headlines ("Recipes from the people who love you")
- Book cover previews
- Section-break overlays in editorial layouts
- ForGiftGivers hero
- Major feature page headlines

**Do not use for:**
- Modal titles (use `text-subheading`)
- Section titles below the hero (use `text-heading`)
- Repeated headings in a list or grid

#### `text-heading`

Second tier. Section titles on a page — the kind that appear multiple times as the page scrolls.

**Use for:**
- "How it Works" section title
- "What's included" section title
- Dashboard page titles (`Groups`, `Recipes`, `Book`)
- Admin page titles

**Do not use for:**
- Card titles inside a grid (use `text-subheading`)
- The one top-level page banner (use `text-display`)

#### `text-subheading`

Third tier. Titles of contained elements — cards, modals, subsections, sidebars.

**Use for:**
- Recipe card titles
- Group card titles
- Modal titles (AddRecipeModal, CoupleNamesModal, etc.)
- Feature card titles inside a grid
- Subsection headers within a larger section

**Do not use for:**
- Body copy that happens to be short
- Metadata (use `text-caption`)

#### `text-body`

The primary unit of prose in the product. Paragraphs, descriptions, explanatory copy that the user actively reads.

**Use for:**
- Landing page paragraph copy
- Product descriptions
- Onboarding step explanations
- Modal body copy
- Email template body (rendered in browser)
- Recipe descriptions

**Do not use for:**
- Helper text under inputs (use `text-body-small`)
- Dates, counts, metadata (use `text-caption`)

#### `text-body-small`

Secondary prose. Supporting copy that the user reads but that isn't the primary content.

**Use for:**
- Helper text under form inputs
- Info boxes, tips, alerts
- Secondary descriptions
- "Last updated" copy when it's a full sentence
- Disclaimer paragraphs

**Do not use for:**
- Primary paragraphs (use `text-body`)
- Labels and short metadata (use `text-caption`)

#### `text-caption`

Small text. Metadata, short labels, timestamps. Information the user references but doesn't read as prose.

**Use for:**
- Dates ("Updated 2 hours ago", "Joined March 2025")
- Counts ("12 recipes", "3 contributors")
- Short labels ("Sent", "Pending", "Draft")
- Contributor attribution on recipe cards
- Footnotes and fine print
- Form field labels (for short ones)

**Do not use for:**
- Prose that forms sentences (use `text-body-small`)
- Labels that should read as editorial kickers (use `text-eyebrow`)

#### `text-eyebrow`

Editorial kicker. Small ALL CAPS label that appears above a heading. Usually brand color (honey). Italic not recommended for this token.

**Use for:**
- Section categorizers above headings ("FEATURED", "NEW", "RECENT")
- Editorial labels on landing ("THE PRODUCT", "HOW IT WORKS")
- Status markers above card titles

**Do not use for:**
- Normal-case metadata (use `text-caption`)
- Any running prose

#### `text-action`

Interactive text. The text inside buttons, links that behave as buttons, CTAs, and navigation items.

**Use for:**
- All button labels (`.btn-primary`, `.btn-secondary`, `.btn-tertiary`)
- Navigation items in headers and sidebars
- Link CTAs that stand alone (not inline links inside prose)
- Tab labels
- Pill labels when they're clickable

**Do not use for:**
- Inline links inside paragraphs (they inherit `text-body` size; underline is the signal)
- Button icons without text

---

## Modifiers and their use

### Weight override

Default weights per token are listed above. To emphasize within a token, use Tailwind weight utilities:

```tsx
Normal body text with emphasized phrase in it.
```

Permitted overrides: `font-normal` (400), `font-medium` (500), `font-semibold` (600), `font-bold` (700).

Not permitted: `font-thin` (100), `font-extralight` (200), `font-light` (300 — already the body default), `font-extrabold` (800), `font-black` (900). These weights are not part of the typographic voice of Small Plates.

### Italic

```tsx
A paragraph in italics.
A caption in italics.
```

Italic is a semantic signal — used for titles of works, foreign phrases, emphasis different from bold (softer). Editorial convention.

### Color

Brand color tokens from Phase 1.2 are applied on top:

```tsx
Default heading color
Muted caption
FEATURED
```

Opacity modifiers work normally:

```tsx
Slightly subdued body
```

### Transforms and decoration

```tsx
All caps heading
Inline link
```

`uppercase`, `lowercase`, `capitalize`, `underline`, `no-underline`, `line-through` — all Tailwind defaults. Use when semantically appropriate.

---

## Prohibited patterns

The following are explicitly outside the system. Any instance in code is a bug.

### Arbitrary font sizes

```tsx
// ❌ Prohibited
...
...
...

// ✅ Correct
...           // 15px
...         // 38px → 56px responsive
...    // ≈ 0.8125rem = 13px
```

### Arbitrary line-heights

```tsx
// ❌ Prohibited
...
...

// ✅ Correct
...              // line-height is part of the token
...
```

Tokens carry their own line-heights. Overriding with `leading-*` is not allowed.

### Arbitrary letter-spacings

```tsx
// ❌ Prohibited (except inside the definition of text-eyebrow itself)
...

// ✅ Correct
...    // tracking is part of the eyebrow token
```

### Arbitrary font-weights

```tsx
// ❌ Prohibited
...

// ✅ Correct
...
```

### Inline style font properties

```tsx
// ❌ Prohibited
...
...

// ✅ Correct
...
...         // tight tracking already in token
```

Exception: emails rendered outside the browser (`lib/email/**`, `lib/postmark.ts`) still use literal inline styles because CSS variables don't resolve there. Same rule as Phase 1.2 color. Applied via rendering helpers that read the token values at build time.

### Standalone Tailwind size utilities

```tsx
// ❌ Prohibited after Phase 1.3 migration completes
...
...

// ✅ Correct
...
...
```

`text-xs`, `text-sm`, `text-base`, `text-lg`, `text-xl`, `text-2xl`, `text-3xl`, `text-4xl`, `text-5xl`, `text-6xl`, `text-7xl` — all standalone Tailwind size utilities are replaced by the 8 tokens. Post-migration, their occurrence in code is a regression.

---

## Font families

### Current state (post-Phase 1.3)

- `font-serif` — Minion Pro (via Typekit) with fallbacks to Georgia, Times New Roman, serif. Used by `text-display`, `text-heading`, `text-subheading`.
- `font-sans` — Inter (via `next/font/google`) with fallbacks to system fonts. Used by `text-body`, `text-body-small`, `text-caption`, `text-eyebrow`, `text-action`.
- `font-mono` — preserved for code snippets and technical output. Not part of the main typographic voice.

### Removed (dead code, eliminated in Phase 1.3)

- `font-serif-display` — Minion Pro display optical size. Declared in `tailwind.config.ts` but 0 usages. Removed.
- `font-serif-caption` — Minion Pro caption optical size. 0 usages. Removed.
- `font-serif-subhead` — Minion Pro subhead optical size. 0 usages. Removed.
- `font-dm-sans` — DM Sans. Loaded via `next/font/google` but 0 usages. Removed (font loader also removed from `app/layout.tsx`).

If Minion Pro optical sizes are ever wanted in the future, they can be re-added with clear justification and at least 5 planned usages before the family is re-declared.

### Inline `fontFamily` constants

Some files (currently `CoupleNamesModal`, `welcome/page`, `onboarding/page`, `ProductSelectionStep`) use local constants or inline strings to set `fontFamily`. These should be investigated during Phase 1.3 migration — in most cases they're workarounds for cascade issues that can be resolved by correct token usage.

---

## Migration policy — Layers of sensitivity

Not all parts of the codebase get migrated identically. Three layers based on visual sensitivity:

### L1 — Core (pixel-perfect migration)

Surfaces where a single-pixel change has business consequence. Migration here is pixel-perfect: if the new token doesn't reproduce the current visual exactly, the token is calibrated before migration (or an exception is documented). Smoke test is mandatory per commit. Any visual change requires explicit approval from Ricardo before the commit stays.

**L1 paths:**

- `app/(auth)/onboarding/**` — onboarding flow
- `components/onboarding/**` — onboarding components
- `app/(platform)/profile/**` — dashboard
- `components/profile/**` — dashboard components (groups, guests, recipes, etc.)
- `app/(public)/collect/**` — guest recipe collection funnel
- `components/collect/**` — collection flow components (if present)

### L2 — Peripheral (tolerant migration)

Surfaces where minor visual changes (a pixel up or down, a weight shift) are acceptable and generally improve consistency. Smoke test is lighter. If a change is noticed and disliked, it gets logged as a follow-up, but it doesn't block the commit.

**L2 paths:**

- `app/copy/**` — copy order flow
- `components/pricing/**` — pricing page
- `app/welcome/**` — welcome page
- `components/landing/**` — landing page and sections
- `components/tips/**` — editorial tips section (has its own rem-based micro-scale; will need attention)
- `app/(admin)/**` — admin panel
- `components/recipe-journey/**` — recipe creation modals
- All other non-L1 paths in `components/`, `app/`, etc.

### L3 — Legacy (identify and handle)

Pages and components that are residue from past pivots, deleted features, or abandoned experiments. Before migration, Ricardo + agent identify L3 paths. Each is either:

- **Deleted** (if truly dead code, nothing references it).
- **Migrated mechanically** (if it's kept for reference but nobody looks at it — zero visual validation needed).
- **Reclassified to L2** (if it turns out something still uses it).

L3 is handled **first** in the migration sequence. This clears out noise before real migration work begins, and often reveals that many arbitrary-value typography hits were in dead code all along.

---

## Implementation sequence

Phase 1.3 rolls out in five sub-phases, each its own atomic work unit.

### Phase 1.3.0 — This doc

You're reading it. Committed as source of truth before any code changes.

### Phase 1.3.1 — Token implementation

Add the 8 tokens to `tailwind.config.ts` via `theme.extend.fontSize`, `theme.extend.lineHeight`, `theme.extend.letterSpacing`. Refactor the existing `type-*` utilities in `globals.css` to consume the new tokens instead of hardcoding values.

Remove dead-code font families (`font-serif-display`, `font-serif-caption`, `font-serif-subhead`, `font-dm-sans`) and the DM Sans loader from `app/layout.tsx`.

No user-facing code migrated yet. The scaffolding is ready.

### Phase 1.3.2 — Legacy identification and cleanup (L3)

Ricardo walks through the codebase with the agent and flags L3 paths. Dead code is deleted. Questionable code is kept with a mechanical migration if unavoidable.

Output: L3 is empty or explicitly documented.

### Phase 1.3.3 — L2 migration (peripheral)

Lote-by-lote migration of L2 paths. Each lote is a single commit covering a coherent area (e.g., "migrate landing components," "migrate admin pages," "migrate tips to new rem-based subset if preserved"). Smoke test on each lote, tolerant to minor visual shifts.

### Phase 1.3.4 — L1 migration (core)

Same approach as L2 but pixel-perfect. Each L1 lote has a visual validation step. If any token can't reproduce the current visual, the token is adjusted (and a note is added to this doc) or an exception is documented in `docs/token-migration-followups.md`.

### Phase 1.3.5 — Cleanup and follow-ups

- Remove legacy `text-*`, `cookbook-*`, `logo-*`, `text-heading*`, `text-body-light` utilities from `globals.css`.
- Resolve any inline `fontFamily` usages that were investigated during migration.
- Update `docs/token-migration-followups.md` with anything deferred from Phase 1.3.
- Verify post-migration that no standalone Tailwind size utilities (`text-sm`, `text-xl`, etc.) remain in code outside `globals.css` token definitions.

---

## How Claude Code and Claude Design should use this system

When generating typography-related code:

1. **Always start with one of the 8 tokens.** Never write arbitrary sizes.
2. **If the visual need doesn't fit any token, stop and ask.** The answer is not to invent a new size — the answer is to clarify which token fits the role, or to flag the design.
3. **Apply modifiers (weight, italic, color) only when the default doesn't carry the intent.** Don't override gratuitously.
4. **When in doubt between two tokens, choose the smaller one.** Editorial systems err small; Small Plates is editorial.
5. **Respect the layer of the surface being modified.** L1 surfaces don't accept "close enough." L2 surfaces do.

When generating component code:

- Buttons use `text-action`. Always. No exceptions.
- Card titles use `text-subheading`.
- Card body copy uses `text-body-small`.
- Card metadata uses `text-caption`.
- Modal titles use `text-subheading` (same as cards — they're peer elements).
- Modal body uses `text-body`.
- Landing hero uses `text-display`. The kicker above it (if any) uses `text-eyebrow`.

---

## Exceptions and edge cases

### Emails

Email clients don't resolve CSS variables. Emails require literal values. Phase 1.3 maintains this exception — email templates in `lib/email/**`, `lib/postmark.ts`, `scripts/email/**` use literal font sizes, weights, line heights, but their values are pinned to the token values in this doc (manual sync).

### `next/og` / satori routes

Same reason as emails. Any image-generation route that doesn't render in browser uses literal values pinned to tokens.

### InDesign / ExtendScript

`scripts/indesign/**` generates print PDFs. It has its own typographic system aligned with Mixam and print production requirements. Not governed by this doc.

### The tips editorial micro-scale

`components/tips/**` currently uses a self-contained rem-based scale (19 unique rem values across 27 hits). This is an intentional editorial mini-system, separate from the main app typography.

**Decision deferred:** in Phase 1.3.3, evaluate whether tips should:
- (a) migrate to the main 8-token system,
- (b) keep its own micro-scale but as a documented exception in a separate doc,
- (c) collapse to a subset of the 8 tokens that happens to cover tips' needs.

Until then, tips is left as-is and treated as a special L2 case.

### Internal Markdown rendering (`@tailwindcss/typography`)

The `@tailwindcss/typography` plugin (used via `prose` classes) has its own typographic scale independent of the 8 tokens. It's used for rendered Markdown content (legal, terms, blog-style content). Phase 1.3 does not override the prose plugin scale — it's treated as a third-party subsystem.

---

## Review cadence

This doc is reviewed:

- **Every 3 months** during normal operation. Is the system still serving? Any token unused? Any recurring pattern where devs want to break the rules?
- **Before any major feature launch** that introduces new visual patterns (e.g., a new admin subsystem, a new landing section with unusual hierarchy).
- **When two or more team members independently propose breaking the system** — if that happens, the system likely has a gap.

Changes to this doc require a commit with a clear justification and are tagged with `docs(tokens):` in the commit message.