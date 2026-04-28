# Design System Recon — April 22, 2026

**Purpose:** Baseline inventory of typography, spacing, radius, shadows, 
and shadcn integration at the start of Phase 2 design system cleanup.

**Context:** Ran during preparation for Claude Design setup. The recon 
revealed unintentional drift in radius, shadows, spacing, and shadcn 
integration that was not visible during Phase 1 (color migration). This 
drift is the scope of Phase 2 — see `docs/token-migration-followups.md`, 
section "Phase 2 scope — Design system cleanup".

**Method:** The recon was non-invasive — only reads and greps, no file 
modifications. Commands used were variants of:
- `grep -rhoE "py-[0-9]+" app/ components/ | sort | uniq -c | sort -rn`
- `grep -rhoE "rounded-[a-z0-9-]+" app/ components/ | sort | uniq -c | sort -rn`
- `grep -rhoE "shadow-[a-z0-9-]+" app/ components/ | sort | uniq -c | sort -rn`
- Direct reads of `tailwind.config.ts`, `app/globals.css`, `app/layout.tsx`, 
  and `components/ui/*.tsx`.

**Status:** Reference document. Do not edit. When Phase 2 sub-items 
(radius, shadows, spacing, shadcn) are addressed in their own sessions, 
they may run deeper category-specific recons building on this baseline.

---

## Typography

### tailwind.config.ts — theme.extend.fontFamily

| Alias | Stack |
|---|---|
| font-serif | minion-pro, Georgia, Times New Roman, serif |
| font-serif-display | minion-pro-display, minion-pro, Georgia, serif |
| font-serif-caption | minion-pro-caption, minion-pro, Georgia, serif |
| font-serif-subhead | minion-pro-subhead, minion-pro, Georgia, serif |
| font-sans | var(--font-inter), -apple-system, sans-serif |
| font-dm-sans | var(--font-dm-sans), -apple-system, sans-serif |

### theme.fontSize — fully custom (not using Tailwind defaults)

| Token | Size | line-height | letter-spacing |
|---|---|---|---|
| display | clamp(2.25rem → 4.5rem) | 1.1 | -0.02em |
| heading | clamp(1.875rem → 3rem) | 1.15 | -0.01em |
| subheading | clamp(1.5rem → 1.875rem) | 1.2 | 0 |
| body | 1rem (fixed) | 1.65 | 0 |
| body-lead | clamp(1.125rem → 1.5rem) | 1.65 | 0 |
| body-small | 0.875rem (fixed) | 1.6 | 0 |
| caption | 0.75rem (fixed) | 1.5 | 0 |
| eyebrow | 0.6875rem (fixed) | 1.4 | 0.15em |
| action | 0.9375rem (fixed) | 1.0 | 0 |
| modal-title | 1.5rem (fixed) | 2rem | 0 |
| form-label | 0.875rem (fixed) | 1.5 | 0 |
| form-label-muted | 0.875rem (fixed) | 1.5 | 0 |
| secondary-sm | 0.75rem (fixed) | 1.4 | 0 |

`theme.fontWeight`, `theme.letterSpacing`, `theme.lineHeight`: no 
custom keys in tailwind.config.ts. Letter-spacing and line-height 
are embedded inside fontSize.

### app/globals.css

- No @font-face, no @import url(fonts.googleapis…)
- CSS typography variables:
  - `--font-serif: 'Minion Pro', 'Georgia', 'Times New Roman', serif`
  - `--font-sans: var(--font-inter), -apple-system, BlinkMacSystemFont, sans-serif`
- Base rules on body: `@apply bg-background text-foreground` — no 
  explicit font-family in CSS base (inherited from html via next/font variables)
- No base rules for h1-h6

### app/layout.tsx — next/font/google

| Font | Weights loaded | CSS variable |
|---|---|---|
| Inter | 300, 400, 500, 600 | --font-inter |
| DM_Sans | 300, 400, 500 | --font-dm-sans |

Both applied on `<html className={${dmSans.variable} ${inter.variable}}>`.

Minion Pro loaded via Adobe Fonts CDN: 
`<link rel="stylesheet" href="https://use.typekit.net/fvk8ngw.css" />` 
in `<head>`, not via next/font. The 4 optical variants (display, caption, 
subhead, base) resolve as font-family strings directly in the config.

**Interpretation:** Typography is doctrinally mature. Minion Pro with 4 
optical variants paired with Inter + DM Sans, editorial scale with 
eyebrow/caption/display tokens. Not in Phase 2 scope.

---

## Spacing

### tailwind.config.ts — theme.spacing

Does not exist. Uses Tailwind defaults (4px base scale).

### app/globals.css — --space-* variables

| Variable | Value |
|---|---|
| --space-1 | 0.25rem (4px) |
| --space-2 | 0.5rem (8px) |
| --space-3 | 1rem (16px) |
| --space-4 | 1.5rem (24px) |
| --space-5 | 2rem (32px) |
| --space-6 | 3rem (48px) |
| --space-7 | 4rem (64px) |

**Status:** Defined but not consumed via CSS variable — components use 
Tailwind classes directly. Dead code.

### Vertical padding rhythm — entire codebase (py-*)

| Class | Occurrences | Dominant context |
|---|---|---|
| py-3 | 243 | Buttons, inputs, badges |
| py-2 | 230 | Small UI elements |
| py-1 | 115 | Micro-UI |
| py-4 | 110 | Table rows, list items |
| py-8 | 40 | Internal cards |
| py-12 | 31 | Medium sections |
| py-6 | 29 | Modals, section headers |
| py-16 | 21 | Landing subsections |
| py-24 | 10 | Primary landing sections |
| py-32 | 2 | Hero / anchor sections |

### Landing rhythm — top-level sections only

| Class | Occurrences in landing |
|---|---|
| py-16 | 14 |
| py-24 | 10 |
| py-32 | 2 |
| py-28 | 2 |
| py-20 | 2 |
| py-40 | 1 |

**Predominant pattern:** py-16 and py-24 for landing sections. No single 
universal class — there is gradation and some noise 
(py-20, py-28, py-40 as outliers).

### Most-used horizontal padding

px-4 (286), px-6 (220), px-3 (159), px-8 (102) — standard UI pattern, 
nothing brand-specific.

---

## Radius

### tailwind.config.ts — theme.extend.borderRadius

Three values, all derived from `--radius`:

| Alias | Value |
|---|---|
| rounded-lg | var(--radius) |
| rounded-md | calc(var(--radius) - 2px) |
| rounded-sm | calc(var(--radius) - 4px) |

### app/globals.css

`--radius: 0.75rem  /* 12px — defined in :root */`

Resolved values:
- rounded-lg = 12px
- rounded-md = 10px
- rounded-sm = 8px

### Top 5 rounded-* classes by frequency

| Class | Occurrences | Resolved value |
|---|---|---|
| rounded-lg | 339 | 12px (shadcn token) |
| rounded-full | 293 | 9999px (buttons, pills, avatars) |
| rounded-xl | 151 | 16px (Tailwind default — NOT mapped in config) |
| rounded-md | 128 | 10px (shadcn token) |
| rounded-2xl | 30 | 24px (modals, large cards) |

**Total radius class occurrences:** ~940 (rough total of top 5).

**Note on rounded-xl:** This class is not mapped in tailwind.config.ts, 
so it resolves to the Tailwind v3 default (0.75rem = 12px in some 
versions, varying by config). Its 151 occurrences are consumption of 
default rather than design system intent.

---

## Shadows

### tailwind.config.ts — theme.boxShadow

Does not exist. Uses Tailwind defaults.

### app/globals.css

No `--shadow-*` variables. No loose `box-shadow` rules outside @apply.

### Top 5 shadow-* classes by frequency

| Class | Occurrences | Typical use |
|---|---|---|
| shadow-lg | 87 | Cards, modals, dropdowns |
| shadow-sm | 47 | Inputs, secondary UI elements |
| shadow-2xl | 21 | Primary modals |
| shadow-xl | 12 | Panels, sheets |
| shadow-md | 12 | Medium cards |

**Total shadow class occurrences:** ~180 (top 5).

### Arbitrary shadow values (inline, non-tokenized)

| Value | Occurrences | Context |
|---|---|---|
| shadow-[0_4px_24px_rgba(45,45,45,0.12)] | 2 | Cards on hover |
| shadow-[0_4px_20px_rgba(45,45,45,0.1)] | 2 | Recipe cards hover |
| shadow-[0_1px_3px_rgba(45,45,45,0.06)] | 2 | Recipe cards base |
| shadow-[0_20px_60px_rgba(0,0,0,0.15)] | 1 | Book preview |
| shadow-[0_1px_4px_rgba(0,0,0,0.08)] | 1 | — |
| shadow-[0_12px_30px_-10px_rgba(45,45,45,0.12)] | 1 | — |
| shadow-[0_0_0_3px_hsla(var(--brand-honey),0.08)] | 1 | Focus ring honey |

**Pattern:** Most custom shadows use `rgba(45,45,45,…)` which is 
`--brand-charcoal` (#2D2D2D) un-tokenized. Consistent intent 
(charcoal-tinted shadows) but implemented as arbitrary values rather 
than tokens.

---

## Shadcn components

Project uses shadcn/ui. Components in `components/ui/`:

button.tsx · card.tsx · carousel.tsx · dialog.tsx · dropdown-menu.tsx 
· input.tsx · label.tsx · select.tsx · sheet.tsx · tabs.tsx 
· editorial-sticky-scroll.tsx · LegalMarkdown.tsx
(+ custom wrappers: AddButton, AddGroupDropdown, ImageActionCard, etc.)

### Core customizations

**button.tsx** — shadcn default, unmodified:
- Base: rounded-md (10px), text-sm, h-9 px-4 py-2
- Brand buttons use `.btn-primary` / `.btn-secondary` from globals.css 
  instead of `<Button>` — rounded-full, px-6 py-3, text-sm

**card.tsx** — shadcn default, unmodified:
- rounded-xl (Tailwind default 16px), shadow (Tailwind default), 
  p-6 in header/content/footer

**dialog.tsx** — shadcn default, unmodified:
- DialogContent: max-w-lg, p-6, sm:rounded-lg (12px)
- DialogTitle: text-lg font-semibold leading-none tracking-tight — 
  does NOT use `text-modal-title` (the custom token from Phase 1.3.3)
- DialogOverlay: bg-black/80 — does NOT use `--brand-charcoal`

---

## Summary interpretation

**Firm doctrine (Phase 2 does not touch):**
- Typography system (Minion Pro + Inter + DM Sans, editorial scale)
- Color system (Phase 1 closed)

**Drift to address in Phase 2:**
- Radius: 10px vs 12px distinction is accidental. rounded-xl (151 uses) 
  consumed as Tailwind default, not as design intent. rounded-full 
  inherited rather than chosen.
- Shadows: Tailwind default shadows (shadow-lg, shadow-2xl, etc.) 
  contradict the brand's charcoal-tinted shadow pattern. Custom shadows 
  exist but are inline and un-tokenized.
- Spacing: landing rhythm has noise (py-20, py-28, py-40 outside the 
  py-16/py-24/py-32 primary scale). `--space-*` CSS variables are dead 
  code.
- Shadcn integration: brand tokens exist but are not wired through 
  shadcn primitives. Brand CSS classes in globals.css parallel shadcn 
  instead of extending it.
