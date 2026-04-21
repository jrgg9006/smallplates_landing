# Visual Identity
## Small Plates & Co. — The Tactical Toolkit

For the full brand system — belief, enemy, audience, voice — see `essence.md` and `foundation.md`.

---

# Color Palette

## Philosophy

The wedding industry is drowning in blush pink, sage green, rose gold, and safe neutrals. Small Plates stands apart. The palette is built on warmth with sophistication — colors that feel like candlelight dinners and honey in the sun. Not cold. Not corporate. Not predictable.

---

## Primary Palette

| Role | Name | Hex | RGB | Usage |
|------|------|-----|-----|-------|
| **Primary Accent** | Honey | #D4A854 | 212, 168, 84 | CTAs, buttons, highlights, moments of energy |
| **Primary Neutral** | Warm White (two-tone, see below) | #FAF9F7 / #FAF7F2 | 250, 249, 247 / 250, 247, 242 | Body + canvas; two deliberate tones |
| **Primary Dark** | Soft Charcoal | #2D2D2D | 45, 45, 45 | Primary text, logo |

## Secondary Palette

| Role | Name | Hex | RGB | Usage |
|------|------|-----|-----|-------|
| **Warm Accent** | Terracotta | #C4856C | 196, 133, 108 | Secondary accent, warmth |
| **Cool Accent** | Olive | #6B7B5E | 107, 123, 94 | Organic feel, secondary moments |
| **Soft Neutral** | Sand | #E8E0D5 | 232, 224, 213 | Subtle backgrounds, cards |

## Warm-White (Two-Tone System)

Small Plates uses two warm-whites deliberately — the contrast between them is the intended editorial rhythm.

| Role | Value | Where it lives |
|------|-------|----------------|
| Body / default surfaces | `#FAF9F7` (airy, L~98%) | Token `--brand-warm-white` (aliases `--brand-background`). Also powers shadcn `--background`, `--popover`, default `Card`, body of every page. |
| Accent / large cozy sections | `#FAF7F2` (warm, L~96%) | Literal hex in ~59 components: landing large sections, `/collect/[token]` funnel pages (desktop), onboarding sidebar, text on dark CTA buttons. |

**Why not a single token:** we tried collapsing to one value during Phase 1.2 (commit 8a6a126, reverted). The single-tone app lost the airy-vs-warm rhythm and felt beige/heavy. The contrast is doing real work visually — airy body frames cozy accent sections.

**If re-evaluating in the future:**
- To converge on airy: migrate the ~59 `#FAF7F2` hardcodes to `brand.warm-white` and accept the lighter-accent look.
- To converge on warm: realign `--brand-background` to `#FAF7F2` (see reverted commit 8a6a126 for precedent).
- To tokenize cleanly: add a second token like `--brand-warm-accent: #FAF7F2` and migrate the 59 hardcodes to it.

## Extended Neutrals

| Name | Hex | Usage |
|------|-----|-------|
| Cream | #F5F1EB | Alternative light background |
| Warm Gray | #9A9590 | Secondary text, captions |
| Deep Charcoal | #1A1A1A | Headlines when more contrast needed |

## Color Rules

**Do:**
- Use Honey sparingly — it's the spice, not the main dish
- Let Warm White breathe — generous whitespace is part of the identity
- Use Soft Charcoal for most text — softer than pure black
- Let photography bring additional color naturally

**Don't:**
- Don't use pure black (#000000) — always Soft Charcoal or Deep Charcoal
- Don't use pure white (#FFFFFF) — always Warm White or Cream
- Don't introduce pinks, blues, or purples — they break the warmth
- Don't use Honey for large background areas — overwhelming

## The Ratio Rule

Warmth dominates. Honey is the spice, not the dish. Secondary colors (Terracotta, Olive) appear rarely, in small doses. Measure by gut, not by pixel.

---

# Typography

## Primary Type System

### Serif — Minion Pro

**Usage:** Headlines, titles, emotional moments, the book itself

Why it works: Classic editorial feel. Highly readable at various sizes. Sophisticated without being stuffy. Works beautifully in print.

**Weights:** Regular (body in book) / Semibold (headlines) / Italic (emphasis, quotes)

---

### Sans-Serif — Inter

**Usage:** Body text (digital), UI elements, functional copy, captions

Why it works: Extremely legible on screens. Modern but not cold. Pairs perfectly with Minion Pro. Versatile weight range.

**Weights:** Regular (body) / Medium (emphasis) / Semibold (buttons, labels) / Bold (sparingly)

---

### Script — To Be Selected

**Usage:** "& Co." in logo, special moments, signature feel

Direction: Elegant but not overly formal. Should feel like beautiful handwriting from someone with good taste — not calligraphy, not childish. Used sparingly for maximum impact.

Candidates: Burgues Script, Carolyna Pro Black, Playlist Script, Andora Modern Script

---

## Type Hierarchy

| Level | Font | Weight | Size (Desktop) | Size (Mobile) | Use Case |
|-------|------|--------|----------------|---------------|----------|
| H1 | Minion Pro | Semibold | 48-64px | 32-40px | Page heroes, major headlines |
| H2 | Minion Pro | Semibold | 36-42px | 28-32px | Section headers |
| H3 | Minion Pro | Regular | 24-30px | 20-24px | Subsection headers |
| Body | Inter | Regular | 16-18px | 16px | Paragraphs, descriptions |
| Small | Inter | Regular | 14px | 14px | Captions, labels |
| Button | Inter | Semibold | 14-16px | 14px | CTAs, buttons |
| Accent | Script | — | Variable | Variable | "& Co.", special moments |

## Typography Rules

**Do:**
- Mix Minion Pro and Inter intentionally — serif for emotion, sans for function
- Use generous line height (1.5-1.7 for body text)
- Let headlines breathe with ample spacing
- Use italic Minion Pro for quotes and emphasis

**Don't:**
- Don't use all caps for long text (okay for short labels)
- Don't use script for body text — ever
- Don't mix more than these three typefaces
- Don't use thin/light weights — they feel weak

---

# Logo

## Finalized Logotype

Horizontal logotype: "Small Plates" in Minion Pro serif + "& Co." in Inter bold, smaller.

The "&" is the symbol of connection. "Small Plates" = the food, the recipes, the book. "& Co." = the people, the presence, the connection.

## Logo Color Applications

| Version | Background | "Small Plates" | "&" | "Co." |
|---------|------------|----------------|-----|-------|
| Primary | Warm White | Soft Charcoal | Honey | Soft Charcoal |
| Inverted | Soft Charcoal | Warm White | Honey | Warm White |
| Mono Light | Warm White | Soft Charcoal | Soft Charcoal | Soft Charcoal |
| Mono Dark | Soft Charcoal | Warm White | Warm White | Warm White |

## Clear Space

Minimum clear space around logo = height of "S" in "Small." No other elements should enter this space.

## Minimum Sizes

| Application | Minimum Width |
|-------------|---------------|
| Digital | 120px |
| Print | 1 inch / 25mm |

## Logo Don'ts

- Don't stretch or distort
- Don't change the typefaces
- Don't rearrange elements
- Don't add effects (shadows, gradients, outlines)
- Don't place on busy backgrounds without container
- Don't use colors outside the palette

---

# What we don't show

The visual system is defined as much by what it rejects as by what it uses. These prohibitions are canonical — no exceptions without founder approval.

## Never in our imagery

- **No faces of couples, guests, or family.** The presence of people comes through their handwriting, recipes, and contributions — not their portraits. This is the hardest rule because it's the easiest to break. Hold it.
- **No stock wedding imagery.** No bride-and-groom embraces, no confetti throws, no ring close-ups, no champagne toasts, no bouquet tosses, no first-dance silhouettes. The wedding industry exhausted these. We don't renew them.
- **No styled-keepsake book photography.** The book is not a precious object on a pristine shelf. It's a used object on a kitchen counter. If a photo makes the book look like it should be wrapped in tissue paper, rewrite the photo.
- **No cheesy emotional setups.** No hand-holding through lace. No candles dramatically lit. No tears in soft focus. Our emotion is earned through specificity, not staging.

## Always in our imagery

- **The book in use, not on display.** Open. Stained. On a counter. Next to flour. Next to a cutting board. Next to last night's half-finished glass of wine.
- **Kitchens that look real.** Not designer kitchens. Not magazine kitchens. Someone's kitchen on a Wednesday.
- **After the wedding, not during it.** Our visual territory is the afterward — Tuesday breakfast, Saturday dinner, a Sunday someone reaches for a recipe from an aunt they haven't seen in two years.
- **The traces of people, not the people.** Handwriting. A note. A page dog-eared. A recipe splattered with the ingredient it describes. Presence through evidence.

## The quiet test

Before any image ships, ask: *if this image could have been used by any wedding brand, we failed.* Every visual should only make sense because Small Plates exists.

---

# Applications

## Website

**Hero Section:**
- Real photography or strong text-as-image
- Minion Pro headline in Soft Charcoal
- Honey CTA button
- Generous Warm White space

**Body:**
- Inter for readability
- Cards with subtle Sand backgrounds
- Minimal UI, maximum breathing room

## Social Media

### Instagram Feed

Three categories of content, rotating:

- **The afterward.** The book in use, days/weeks/months after the wedding. Kitchen counters, stained pages, a recipe from someone you haven't talked to in six months. This is the territory the industry doesn't show.
- **Traces of people.** Handwritten recipes, guest notes, a page dog-eared by someone. Presence through evidence. No faces.
- **Honest texts.** Quotes, observations, lines that name what the wedding industry avoids saying. Text-as-image. Minion Pro on Warm White. Single line, breathing room.

**The feed rule:** Every three posts, one must make an organizer stop scrolling and think *"that's exactly me."* The rest supports that one.

**Never:** uniform warm filter, overly-produced styling, wedding-day content, generic couple shots.

**Instagram Stories / TikTok:**
- Rawest, most real, most unedited content
- Backstage with zero production

## Packaging / The Book

**Book Cover:**
- Cloth or premium matte material
- Minimal: couple's names, Small Plates & Co. logo
- Debossed or foil stamp in Honey or blind emboss
- Should feel like an object you use, not hide

**Book Interior:**
- Generous margins
- Minion Pro for recipe titles and names
- Inter for instructions
- Names prominently featured — this is about people
- Space for each recipe to breathe

**Shipping Box:**
- Kraft or warm-toned material
- Logo in Soft Charcoal
- Honey interior or tissue paper

## Email

**Marketing Emails:**
- Warm White background
- Minion Pro for headlines, Inter for body
- Honey CTA button
- Single clear message per email

**Transactional Emails:**
- Cleaner, more functional
- Still warm, never cold
- Honey accents for status and progress

## Organizer Dashboard & Communications

**Dashboard:**
- Clean, functional layout — no decorative elements
- Progress indicators in Honey (progress bars, completion percentages)
- Inter for all functional text — recipe counts, dates, status labels
- Calm spacing — generous padding between sections
- Warm White background with Sand cards for recipe previews
- Soft Charcoal for primary text, Warm Gray for secondary info

**Organizer Emails:**
- Same warmth as other emails but more structured
- Data-forward: recipe counts, completion status, next steps
- Inter for body text (operational context, not emotional)
- Honey accents for progress indicators and CTA buttons
- No decorative flourishes — respect her time

---

# Technical Reference

## Aspect Ratios by Platform

| Platform | Ratio | Pixel Dimensions |
|----------|-------|------------------|
| Website hero | 16:9 or 2.39:1 | 2400 x 1350 or 2400 x 1000 |
| Instagram feed | 4:5 | 1080 x 1350 |
| Instagram square | 1:1 | 1080 x 1080 |
| Instagram stories | 9:16 | 1080 x 1920 |
| Pinterest | 2:3 | 1000 x 1500 |
| Print (book) | 8.5 x 11 | 2550 x 3300 @ 300dpi |

## File Delivery Specs

| Type | Format | Color Space | Resolution |
|------|--------|-------------|------------|
| Master | TIFF 16-bit or PSD | Adobe RGB or ProPhoto RGB | Native camera resolution |
| Web/Social | JPEG 85-92% | sRGB | 2400px long edge (hero), 1200px (secondary) |

---

# What this doc covers — and what it doesn't

This doc is the tactical toolkit for what is canonical today: color, typography, logo, book mechanics, photography prohibitions, and application rules. It is complete for those categories.

What it doesn't yet cover:

- **The hero shot.** The single recurring composition of the book that becomes Small Plates' visual signature. Still in discovery.
- **The world kit.** The three recurring visual framings that, repeated, become unmistakable. Still in discovery.
- **The aspirational visual references.** The 3–5 concrete references that define the visual territory we live in. Previous references (Kinfolk, Phaidon, Ottolenghi, Artifact Uprising) have been deprecated as no longer aligned with the brand. New references are being discovered through an ongoing process.
- **The aesthetic reference phrase.** The short phrase (e.g., "X with the dry humor of Y") that synthesizes the visual world in under 10 words.

These additions will come in v1.2+ after a structured reference-mining and pattern-recognition process led by the founders.

---

*v1.1 · April 2026 · Changes from v1.0: (1) fixed broken cross-reference to archived `creative-direction.md` — now points to `essence.md` and `foundation.md`; (2) removed "Color Ratios by Application" table (prescription without operational use) — replaced with a brief ratio rule; (3) added new "What we don't show" section canonizing visual prohibitions (no faces, no stock wedding imagery, no styled-keepsake shots, no cheesy setups) and positive mandates (the book in use, real kitchens, the afterward, traces of people); (4) rewrote "Instagram Feed" section to align with canonical enemy "Everyone leaves"; (5) added "What this doc covers — and what it doesn't" section documenting the pending pieces (hero shot, world kit, aspirational references, aesthetic reference phrase) and the deprecation of previous aspirational references (Kinfolk, Phaidon, Ottolenghi, Artifact Uprising). Operational identity remains canonical; aspirational visual world is in discovery.*