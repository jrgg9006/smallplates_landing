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

## The 13 tokens

| Token | Role | Size (mobile → desktop) | Weight default | Line-height | Letter-spacing | Family |
|-------|------|-------------------------|----------------|-------------|----------------|--------|
| `text-display` | Hero titulars, landing covers | 36px → 72px | medium | tight (1.1) | tight (-0.02em) | serif (Minion Pro) |
| `text-heading` | Section titles | 30px → 48px | medium | tight (1.15) | default | serif |
| `text-subheading` | Card / modal titles, subsection headers | 24px → 30px | medium | tight (1.2) | default | serif |
| `text-body` | Primary body copy (paragraphs, descriptions) | 16px | light | relaxed (1.65) | default | sans (Inter) |
| `text-body-lead` | Lead prose editorial (follows a heading) | 18px → 24px | light | relaxed (1.65) | default | sans |
| `text-body-small` | Secondary body copy (helper text, info boxes) | 14px | light | relaxed (1.6) | default | sans |
| `text-caption` | Metadata, timestamps, small labels | 12px | normal | normal (1.5) | default | sans |
| `text-eyebrow` | Kickers above headings, ALL CAPS labels | 11px | medium | normal (1.4) | wide (0.15em) | sans, uppercase |
| `text-action` | Button labels, CTAs, navigation | 15px | medium | none (1.0) | default | sans |
| `text-modal-title` | Modal dialog / sheet titles | 24px | semibold | tight (1.2) | default | serif |
| `text-form-label` | Form input labels (primary — more legible) | 14px | medium | normal (1.5) | default | sans |
| `text-form-label-muted` | Form input labels (secondary — softer) | 14px | medium | normal (1.5) | default | sans |
| `text-helper` | Helper text below inputs, char counters, notes | 12px | normal | normal (1.4) | default | sans |

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

#### `text-body-lead`

**Role:** Lead prose that immediately follows a heading. The paragraph that carries the reader from "what this is" (heading) to "what it means" (body). Editorially weightier than `text-body` — still light weight, but larger and more prominent.

**Use for:**
- Hero subtitles immediately below a heading
- Section intro prose that sets the emotional or narrative tone
- Pull-quotes and editorial asides where size signals importance
- Italic accent prose when used as a lead-in (combined with `.italic` modifier)

**Do not use for:**
- UI body copy inside modals or forms (use `text-body`)
- Body copy in long paragraphs of content (use `text-body`)
- Captions or helper text (use `text-caption` or `text-body-small`)

**Why it exists:** The original 8-token system routed `.type-body` and `.type-accent` utilities to `text-body` (16px). In practice, these utilities are consumed by landing editorial prose that needs a larger base (18px mobile, up to 24px desktop). `text-body-lead` names this role explicitly rather than treating editorial prose as a `text-body` override.

**Fluid behavior:** Uses `clamp(1.125rem, 0.9rem + 1.125vw, 1.5rem)` — 18px on narrow mobile, scales to 24px on desktop ≥ ~1200px viewport.

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

#### `text-modal-title`

**Role:** Titles of modal dialogs and sheet overlays. The first text the user reads when a modal opens — it establishes the modal's purpose.

**Use for:**
- `<DialogTitle>` content in shadcn dialogs
- `<SheetTitle>` content in slide-over sheets
- Main heading inside any modal/popover overlay

**Do not use for:**
- Page-level headings (use `text-heading` or `text-display`)
- Section titles within the modal body (use `text-subheading` if large enough, else body weight)
- Standalone headings outside modal context

**Why it exists:** 20+ platform modals (`AddRecipeModal`, `CreateCookbookModal`, `CreateGroupModal`, `EditCookbookNameModal`, `EditGroupModal`, `EditRecipeModal`, `AddNoteModal`, `AddGuestModal`, `AddFriendToGroupModal`, `BulkAddToCookbookModal`, `CloseBookModal`, `ReviewRecipesModal`, `RemoveRecipeFromGroupModal`, `CustomizeCollectorModal`, `DeleteGuestModal`, `DeleteRecipeModal`, `SendMessageModal`, `GroupNavigationSheet`, `GuestNavigationSheet`, `ImportGuestsModal`, `ShareCollectionModal`, `GuestDetailsModal`) all repeat the verbatim `font-serif text-2xl font-semibold` pattern. Consolidating into one token reduces duplication and makes future tuning a single-file change.

**Value:** `1.5rem` = 24px fixed. Serif family with semibold weight is applied by the utility chain (token encodes size + line-height + letter-spacing only).

#### `text-form-label`

**Role:** Primary label for form inputs. The darker, more legible variant.

**Use for:**
- Labels above text inputs, selects, checkboxes in modal forms
- Form field labels in the onboarding flow where maximum legibility matters
- Any `<label>` element tied to an input where the user benefits from clear reading

**Do not use for:**
- Headings (use modal-title or subheading)
- Body text (use body or body-small)
- Non-input labels like section dividers (consider `text-caption` or an eyebrow)

**Why it exists:** 60+ form labels in dashboard and key onboarding modals (`AddRecipeModal`, `GuestDetailsModal`, `FirstRecipeModal`, onboarding step labels) use `text-sm font-medium text-gray-700` verbatim. Consolidation.

**Value:** `0.875rem` = 14px fixed. Sans-serif with medium weight and `text-gray-700` color are applied by the consumer's utility chain. The token encodes size + line-height.

#### `text-form-label-muted`

**Role:** Secondary label for form inputs. Same size and weight as `text-form-label`, but with softer `text-gray-600` color for contexts where labels shouldn't compete with content.

**Use for:**
- Form field labels in visually dense modals where label prominence would distract
- Labels in secondary or optional fields
- Currently: the default label style in most modal forms (AddNoteModal, DeleteRecipeModal, most of the 40+ labels using `text-gray-600`)

**Do not use for:** anything that isn't a form label.

**Why it exists:** the platform has two label conventions (`text-gray-600` in ~40 places, `text-gray-700` in ~60 places). Two tokens with identical size/weight but different default colors let consumers migrate to whichever they currently use without visual shift. A future consolidation pass can decide to collapse into one; for now, preserve both.

**Value:** `0.875rem` = 14px fixed (identical to `text-form-label`). Sans-serif with medium weight and `text-gray-600` color are applied by the consumer's utility chain.

**Relationship to `text-form-label`:** identical size/weight/family, different default color. A consumer that uses `text-gray-700` picks `text-form-label`; one that uses `text-gray-600` picks `text-form-label-muted`. If the team decides later that one color is the standard, this token can be deprecated and consumers migrated to the survivor.

#### `text-helper`

**Role:** Helper text, char counters, small hints, optional field indicators — the "quieter" text adjacent to primary content.

**Use for:**
- Helper / hint text displayed below a form input
- Character counters (e.g., "142 / 500 characters")
- Small notes or disclaimers near interactive elements
- "(optional)" indicators beside label text

**Do not use for:**
- Body copy (use `text-body` or `text-body-small`)
- Error messages (use dedicated error pattern — typically `text-sm text-red-600`, NOT `text-helper`)
- Metadata or timestamps (use `text-caption` — similar size but different semantic role)

**Why it exists:** 50+ instances of `text-xs text-gray-500` across modal forms, dashboard helpers, and form validators. Unified, consistent pattern.

**Value:** `0.75rem` = 12px fixed (same size as `text-caption`). Sans-serif with normal weight and `text-gray-500` color are applied by the consumer.

**Relationship to `text-caption`:** same size (12px), but different semantic role. `text-caption` is for metadata, attributions, timestamps that are read as "info about the content." `text-helper` is for guidance on an interactive action. Both render visually the same, but the naming distinguishes intent. This distinction matters for Claude Design and future tooling that may treat them differently.

---

## Documented exceptions

The following elements are classified pixel-perfect — they define the editorial character of the landing page and must not be migrated or modified without explicit Ricardo review. They may use `.type-*` utilities with hand-authored responsive size overrides; this is deliberate, not a system violation.

Any Phase 1.3+ migration that touches `components/landing/**` must consult this table first and skip listed lines.

| # | File | Line | Element | Current treatment | Role |
|---|------|------|---------|-------------------|------|
| 1 | `components/landing/Hero.tsx` | 46 | `<motion.h1>` "Recipes from the people who love you." | `type-display text-white leading-[1.1]` | Primary hero headline |
| 2 | `components/landing/Hero.tsx` | 55 | `<motion.p>` "A wedding cookbook made by everyone who showed up..." | `type-body mt-6 sm:text-xl md:text-2xl text-white/90 max-w-2xl` | Hero subtitle prose |
| 3 | `components/landing/TheProblem.tsx` | 80 | `<motion.p>` "You know her. The gift should too." | `type-accent text-2xl sm:text-3xl md:text-4xl leading-snug` | Problem conclusion accent |

**Rule for agents:**

Before modifying any file in `components/landing/**`, check this table. If the line you're about to modify matches one listed here, skip it. Report that you skipped an exception rather than silently leaving it unchanged.

**Rule for ongoing development:**

New code in `components/landing/**` should still use the 13 tokens. This exceptions table is for the 3 elements listed above, not a license to author new responsive size overrides.

**Not pixel-perfect (L2 — deltas acceptable):**

- `components/landing/EmotionalClose.tsx` — editorial paragraphs. Tolerable if sizes shift by small amounts during migration.
- `components/landing/HandmadeCallout.tsx` — pull-quote. Tolerable.
- `components/landing/RegistryInterlude.tsx` — accent + prose. Tolerable.
- `components/landing/PersonalNotes.tsx` — rotating blockquote. Tolerable.
- `components/landing/BookDetailsModal.tsx` — modal prose. Tolerable.
- `app/(public)/about/page.tsx` — editorial accents. Tolerable.
- All other landing components not in the exceptions table.

---

## Calibration notes

The values in the tokens table above reflect calibration against codebase state as of April 2026, verified via a pre-flight typography recon before Phase 1.3.1 implementation.

Two values differ from the initial design draft:

- `text-subheading` mobile was originally proposed at 20px. Recon revealed that modal titles in 6+ L1 files (`AddRecipeModal`, `AddGuestModal`, `CreateCookbookModal`, `CloseBookModal`, `ShareCollectionModal`, `ReviewRecipesModal`) universally use `text-2xl = 24px`. Lowering to 20px would have shrunk all modal titles by 4px, a visible regression in surfaces Ricardo flagged as high-sensitivity. Calibrated up to 24px mobile / 28px desktop.
- `text-caption` was originally proposed at 13px. Recon showed helper/error patterns in L1 dominantly use `text-xs = 12px` (10+ hits of `text-xs text-gray-500`). Calibrated down to 12px to preserve those surfaces.

These calibrations are intentional and reflect the principle that the system should encode the codebase's intentional patterns, not impose externally-derived ideals. Where L1 already has a coherent pattern, the token conforms to it.

### The 9th token — `text-body-lead`

Phase 1.3.1.b (commit `1af24f9`) refactored the 8 `.type-*` utilities to consume the initially-planned 8 tokens. Visual smoke on landing revealed a regression: the `.type-body` and `.type-accent` utilities were routed to `text-body` (16px), which is correct for UI compact prose but shrunk landing hero subtitles from 18→20px to 16px — a visible disruption of editorial character. Commit `8582955` reverted the refactor.

Root cause: the 8-token system had no tier for "editorial lead prose" in the 18-24px range. The doc assumed `text-body` would serve both UI body and editorial lead prose. In practice, these are separate roles with different size requirements.

Resolution: added `text-body-lead` as the 9th token. `.type-body` and `.type-accent` base now route to `text-body-lead`, preserving landing editorial weight. Components that need compact UI body (modals, forms, dashboards) consume `text-body` (16px) directly.

The 5 landing hero elements that drove the regression are additionally captured in the "Documented exceptions" section above — not because they need `text-body-lead`, but because their current responsive overrides are pixel-perfect calibrated to the editorial character of the landing, and any token migration should not touch them.

### Recalibration of text-display, text-heading, text-subheading

After the 9th-token amendment, a pre-flight consumers audit of `.type-heading`, `.type-subheading`, and `.type-display` surfaced that the utilities' current rendering values are higher than the originally proposed tokens:

- `.type-display` renders `text-4xl sm:text-5xl md:text-6xl lg:text-7xl` = 36→48→60→72px. Original token proposed 38→56px.
- `.type-heading` renders `text-3xl sm:text-4xl md:text-5xl` = 30→36→48px. Original token proposed 28→36px.
- `.type-subheading` renders `text-2xl md:text-3xl` = 24→30px. Original token proposed 24→28px.

The audit also confirmed zero consumers in L1 paths (dashboard, collect, onboarding, modals, email, admin). All 26 consumers across the 3 utilities live in landing (21) or public pages — contact, pricing, check-your-email (5).

Ricardo's decision: recalibrate the 3 tokens upward to encode the codebase's actual rendering values. The token system is a formalization of the codebase's intentional patterns, not an external design imposition.

Updated values:
- `text-display`: 36→72px (was 38→56). Clamp: `clamp(2.25rem, 1.75rem + 2.5vw, 4.5rem)`.
- `text-heading`: 30→48px (was 28→36). Clamp: `clamp(1.875rem, 1.5rem + 1.875vw, 3rem)`.
- `text-subheading`: 24→30px (was 24→28). Clamp: `clamp(1.5rem, 1.375rem + 0.625vw, 1.875rem)`.

Consequence for Documented exceptions: the 5 elements previously listed are reduced to 3. Elements 3 and 5 (`TheProblem.tsx:38` and `TheSolution.tsx:65`), which use plain `.type-heading` without overrides, are now fully preserved by the recalibrated token and no longer need explicit protection. Elements 1, 2, 4 remain exceptions because they carry hand-authored responsive overrides beyond what any token encodes.

Consequence for non-landing consumers: 5 public-page titles (check-your-email success/error, contact, pricing, ContactForm confirmation) will render at the recalibrated sizes. Per Ricardo's decision, these are acceptable — public-page titles benefit from editorial weight rather than being compromised by a system tuned to smaller surfaces.

### Platform tokens — Phase 1.3.3

Phase 1.3.1 built the typography system against landing + about surfaces. A Phase 1.3.3 audit revealed that the platform surfaces (dashboard, onboarding, 23 modal files) had 0 consumers of `.type-*` utilities — the entire platform bypassed the system and relied on raw Tailwind utilities with highly repetitive patterns.

Four tokens were added to close this gap for the three most-repeated patterns:

- `text-modal-title` (24px) — consolidates ~20 modal titles that repeated `font-serif text-2xl font-semibold` verbatim.
- `text-form-label` (14px, gray-700 default) and `text-form-label-muted` (14px, gray-600 default) — consolidates 100+ form labels. Two tokens preserve zero visual delta during migration; a future consolidation pass can collapse them.
- `text-helper` (12px) — consolidates 50+ helper-text patterns.

These 4 tokens are additive. They do not change any existing token's value. Migration of consumers happens in subsequent commits (not this one).

Tokens NOT yet added (deferred to future sessions):
- Recipe card title serif italic pattern (~3-5 consumers) — too narrow for consolidation yet.
- Recipe title large (`font-serif text-3xl lg:text-4xl` in RecipeDetailsModal, ReviewRecipeCard) — needs design decision on whether to consolidate with `text-heading` or remain distinct.
- Serif eyebrow pattern (`font-serif uppercase tracking-[0.2em]`) — variant of the existing sans eyebrow. Decision needed on whether to create a serif variant.
- Onboarding's arbitrary `text-[Npx]` values — requires a dedicated pass to resolve each to a canonical token.
- `CoupleNamesModal.tsx` inline styles and arbitrary values — requires dedicated refactor pass.

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
...    // 0.75rem = 12px
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
6. **Respect Documented exceptions.** Before modifying any file in `components/landing/**`, check the Documented exceptions table. If the line matches an entry, skip it and report the skip. Do not attempt to migrate hero elements without explicit Ricardo review.

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

---

## Lessons learned (Phase 1.3.1 — April 2026)

This section captures key philosophy lessons from the Phase 1.3.1 session that attempted to migrate `.type-*` utilities to consume typography tokens. Three attempts were made; all were reverted or rejected. The pattern of errors reveals principles that future sessions must respect.

### Principle 1 — The page must not change visually as a side effect of system adoption

The purpose of a typography system is to give the codebase a shared vocabulary for consistent decisions going forward. It is not to "fix" the existing page. If system adoption causes the existing page to render differently, the system is wrong, not the page.

Ricardo's explicit statement: *"la página casi no debe de cambiar."*

Future sessions must treat any visible shift on landing, about, dashboard, collect, or onboarding surfaces as a regression requiring revert or token recalibration — not as an acceptable cost of "better organization."

### Principle 2 — The system describes the codebase, not prescribes it

Token values must be derived from measuring what the codebase actually renders today. External design ideals (Kinfolk, Aesop, Everlane) are inspiration for semantic roles, not prescriptive for pixel values.

The recalibration cycle in this session (commits `447a684` + `1eb8f71`) moved `text-display` from 38→56px to 36→72px, `text-heading` from 28→36px to 30→48px, and `text-subheading` from 24→28px to 24→30px — not because the new values are right in an abstract sense, but because they match what the utilities currently produce.

### Principle 3 — Aggressive consolidation (8-10px deltas) is rejected

The third refactor attempt tried to route `.type-body` from its current rendering (18→20px via `text-lg md:text-xl`) to `text-body-lead` (18→24px). Ricardo rejected the desktop +4px shift as making landing prose feel too heavy.

Similarly, routing `.type-body-small` from 16→18px to a flat 14px (−2 to −4px reduction) produced text that was "demasiado pequeño" on landing body copy.

The rule: a token change that shifts consumers by more than approximately 2px is a material visual change, not an adjustment. It requires evidence-based per-surface smoke testing and is usually not worth the theoretical organizational benefit.

### Principle 4 — Pre-flight measurement is mandatory

Before proposing any token value, the session must first:

1. Identify all consumers of the utilities that will route to the token.
2. Measure the rendered size each consumer produces.
3. Choose token values that preserve those renderings (zero or near-zero delta).
4. Only then propose the token to Ricardo.

The first two Phase 1.3.1 attempts skipped this step. Values were proposed first, then consumers audited. This order is the error. Audit first, propose second.

### Principle 5 — Legacy cleanup precedes consolidation

This session surfaced ~6 landing components that are legacy (not rendered on the live site): `FoodPerfect.tsx`, `Guarantee.tsx`, `PlayModeSelection.tsx`, `MemorableExperience.tsx`, `WhatsIncluded.tsx`, `WellWhatIf.tsx`. These components distorted the consumers audit — they appeared as candidates for token migration despite being invisible to users.

Future sessions must first clean (delete or deprecate) dead code before proposing consolidation. A system designed against a codebase that contains ghost code will misweight its decisions.

### Operational guidance for future sessions

When migrating `.type-*` utilities or any other typography surface:

1. **Start with a consumer audit.** Grep all usages. Categorize by surface (landing, dashboard, collect, modal, etc.). Note consumers with inline overrides separately from those that rely on the utility's base.

2. **Map current rendered sizes per consumer.** For each consumer, record what pixel value it renders at each breakpoint. This is the source of truth for token calibration.

3. **Propose token values that preserve current renderings with near-zero delta.** If a proposed token shifts consumers by more than ~2px, either calibrate the token or add the consumer as a Documented exception.

4. **Smoke test before commit.** The person (not the agent alone) must verify the rendered page against pre-refactor state. A 20-point visual checklist against localhost is cheap compared to a shipped regression.

5. **When in doubt, don't migrate.** A token in `tailwind.config.ts` available for future use is better than a migration that ships a visual change Ricardo rejects.

6. **Respect "casi no debe cambiar" as an absolute rule.** Small deltas on L2 surfaces are acceptable only if Ricardo explicitly approves them in the context of specific surfaces, not as a blanket policy.

Changes to this doc require a commit with a clear justification and are tagged with `docs(tokens):` in the commit message.