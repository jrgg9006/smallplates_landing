---
name: Small Plates & Co.
description: Guests contribute recipes. We design and print the hardcover cookbook. The couple gets the book.
colors:
  honey: "#D4A854"
  warm-white-airy: "#FAF9F7"
  warm-white-warm: "#FAF7F2"
  soft-charcoal: "#2D2D2D"
  deep-charcoal: "#1A1A1A"
  cream: "#F5F1EB"
  sand: "#E8E0D5"
  olive: "#6B7B5E"
  terracotta: "#C4856C"
  warm-gray: "#9A9590"
  honey-dark: "#C49C4A"
  border-button: "#D4D0C8"
  decorative-line: "#D4D0C8"
typography:
  display:
    fontFamily: "Minion Pro Display, Minion Pro, Georgia, serif"
    fontSize: "clamp(2.25rem, 1.75rem + 2.5vw, 4.5rem)"
    fontWeight: 500
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  heading:
    fontFamily: "Minion Pro, Georgia, serif"
    fontSize: "clamp(1.875rem, 1.5rem + 1.875vw, 3rem)"
    fontWeight: 500
    lineHeight: 1.15
    letterSpacing: "-0.01em"
  subheading:
    fontFamily: "Minion Pro Subhead, Minion Pro, Georgia, serif"
    fontSize: "clamp(1.5rem, 1.375rem + 0.625vw, 1.875rem)"
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: "0"
  accent:
    fontFamily: "Minion Pro, Georgia, serif"
    fontSize: "clamp(1.125rem, 0.9rem + 1.125vw, 1.5rem)"
    fontWeight: 400
    lineHeight: 1.65
    letterSpacing: "0"
  body:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "1rem"
    fontWeight: 300
    lineHeight: 1.65
    letterSpacing: "0"
  body-small:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 300
    lineHeight: 1.6
    letterSpacing: "0"
  eyebrow:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.15em"
  caption:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "0"
rounded:
  sm: "8px"
  md: "10px"
  lg: "12px"
  xl: "16px"
  full: "9999px"
spacing:
  "1": "4px"
  "2": "8px"
  "3": "16px"
  "4": "24px"
  "5": "32px"
  "6": "48px"
  "7": "64px"
components:
  button-honey:
    backgroundColor: "{colors.honey}"
    textColor: "#FFFFFF"
    rounded: "{rounded.full}"
    padding: "16px 32px"
  button-honey-hover:
    backgroundColor: "{colors.honey-dark}"
  button-dark:
    backgroundColor: "{colors.soft-charcoal}"
    textColor: "#FFFFFF"
    rounded: "{rounded.full}"
    padding: "16px 32px"
  button-dark-hover:
    backgroundColor: "{colors.deep-charcoal}"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.soft-charcoal}"
    rounded: "{rounded.full}"
    padding: "16px 32px"
  button-outline-hover:
    textColor: "{colors.honey}"
  button-subtle:
    backgroundColor: "transparent"
    textColor: "{colors.warm-gray}"
    rounded: "{rounded.full}"
    padding: "12px 20px"
  recipe-card:
    backgroundColor: "#FFFFFF"
    rounded: "{rounded.lg}"
    padding: "32px 24px"
  input-field:
    backgroundColor: "#FFFFFF"
    textColor: "{colors.soft-charcoal}"
    rounded: "{rounded.lg}"
    padding: "12px 16px"
---

# Design System: Small Plates & Co.

## 1. Overview

**Creative North Star: "Still at the Table"**

The visual world is the afterward — the Wednesday two years in, when she opens the book for the risotto and finds her grandmother's handwriting on the page. Domestic tables, kitchen counters, mid-meal scenes, hands doing things, books open next to plates that have something on them. Never wedding settings. Never the day-of. The brand exists in the time when the people who came are still here, still showing up.

The work the system does: turn "they love you" into something the recipient can hold. Eighty contributions are harder to dismiss than a card or a feeling. The book is the proof. Every visual choice serves that — the photograph that shows real use, the type that earns its weight, the warm white that asks you to spend time on the page.

The system is editorial without being precious. Premium materials, deliberate restraint, but never mistaken for a wellness retreat or a luxury brochure. Things are allowed to look used. Pages get stained. Counters have crumbs. The serif belongs in a cookbook, not in a logo concept board. If a surface looks like it was art-directed within an inch of its life, it has lost the brand.

This system explicitly rejects the wedding industry visual cluster (The Knot, Zola, Brides.com, Minted, script calligraphy, golden-hour photography, "your perfect day" copy); the cookbook-as-tool template (vinst.me, createmycookbook.com, AI-as-hero framing); generic SaaS/AI aesthetics (purple gradients, glassmorphism, Lottie as decoration); and luxury-brand cosplay (overstated whitespace, monochrome high-fashion mood, surfaces too pristine to belong to anyone).

**Key Characteristics:**
- Flat surfaces with tonal warmth. Depth through two-tone warm whites, not shadows.
- Serif at scale, sans in function. Never swapped.
- Honey earns every appearance through scarcity.
- Editorial restraint, not minimalism. Whitespace is purposeful, never cold or aspirational.
- The book gets stained. The brand permits and prefers visible use.
- "Still" is present tense. The brand is not about remembering a day; it is about continuing to live with what it made.
- Premium does not mean precious. The brand can be funny. Specific is funnier than abstract anyway.

## 2. Colors: The Still Life Palette

A warm, editorially disciplined palette. Honey is singular. Warm White is dual. Charcoal is the primary voice. Secondary colors (Terracotta, Olive) appear rarely, like a spice used once in a meal.

### Primary

- **Honey** (#D4A854): The sole accent. CTAs, active states, progress indicators, the eyebrow type color. Earns each use through rarity. Never as a background on large areas. Never as body text conveying critical information: Honey on Warm White Airy fails WCAG AA at approximately 2.1:1.

- **Warm White Airy** (#FAF9F7, token: `--brand-warm-white-airy`): The more spacious of the two warm whites. Product register canvas (default body, page background, full-width app surfaces). Brand register layer (contrast sections, breathing-room moments against the predominantly Warm canvas). See The Canvas-vs-Layer Rule.

- **Warm White Warm** (#FAF7F2, token: `--brand-warm-white-warm`): The more enveloping of the two warm whites. Brand register canvas (hero, editorial sections, marketing page body). Product register layer (callouts, selected states, modals, input backgrounds, sheet backgrounds). See The Canvas-vs-Layer Rule.

- **Soft Charcoal** (#2D2D2D): Primary text color across all surfaces. Logo. Canonical body text pair with Warm White Airy achieves approximately 14:1 contrast (WCAG AA and AAA). Softer than pure black; never #000.

### Secondary

- **Terracotta** (#C4856C): Secondary warm accent. Destructive/error states in the product register. Rare decorative moments in editorial layouts. Never paired with Honey on the same surface.

- **Olive** (#6B7B5E): Cool secondary accent. Tags, category indicators, decorative accents in photography-adjacent layouts. Appears less frequently than Terracotta.

### Neutral

- **Deep Charcoal** (#1A1A1A): Elevated emphasis only. The btn-dark hover state. Headers requiring maximum contrast. Use over Soft Charcoal only when the design calls for heightened weight.

- **Sand** (#E8E0D5): Borders, dividers, input borders at rest, card borders. The system's default border color. Warm, not grey.

- **Cream** (#F5F1EB): Alternative light section backgrounds. Book preview container background. Sits between Sand and Warm White Warm; distinct from the two-tone warm white system.

- **Warm Gray** (#9A9590): Secondary text, captions, contributor attributions, helper text, metadata. Never primary copy.

- **Decorative Line** (#D4D0C8): Dividers, recipe card accent lines, atmospheric separators. Conceptually distinct from the button border token even when sharing the same value: one is interactive (hover/focus states apply), one is atmospheric.

### Named Rules

**The Honey Rule.** Honey is the spice, not the dish. It appears on at most 10% of any given surface. Its value is its rarity. An interface saturated with Honey has spent the spice. When in doubt: less. Eyebrow uses count toward the 10% Honey budget; if a surface has many eyebrows, the surface is over-spent.

**The Canvas-vs-Layer Rule.** The system uses two warm whites whose roles invert by register. In brand register: Warm White Warm (`--brand-warm-white-warm`, #FAF7F2) is canvas; Warm White Airy (`--brand-warm-white-airy`, #FAF9F7) is layer. In product register: Warm White Airy is canvas; Warm White Warm is layer. Never use Warm White Warm as a body or page background in product register. Never use Warm White Airy as a section background in brand register. Never use literal hex — always the named token.

**The Two-Tone Saturation Rule.** The 2% saturation difference is the entire point. Do not consolidate. Two warm whites that look almost the same create depth without borders, without shadows, without harshness. One warm white is editorial uniformity. The system depends on both existing.

## 3. Typography: The Minion–Inter Pairing

**Display / Heading / Accent Font:** Minion Pro (Adobe Fonts; four optical sizes: Display, Standard, Subhead, Caption). Fallback stack: Georgia, Times New Roman, serif.

**Body / UI Font:** Inter (loaded via `next/font/google`). Fallback stack: -apple-system, BlinkMacSystemFont, sans-serif.

**Character:** Minion Pro is a classical editorial serif — the kind that belongs in cookbooks, art books, and Kinfolk spreads, not on a startup landing page. Inter is the opposite: maximally legible, screen-native, modern without coldness. The pairing works because it mirrors the product: a warm physical artifact delivered through a frictionless interface. Serif for feeling, sans for function. Never swapped.

### Hierarchy

- **Display** (medium 500, clamp 36px to 72px, line-height 1.1, tracking -0.02em): Hero headlines only. Landing page H1s. Optical size: Minion Pro Display. Tight tracking emphasizes mass.

- **Heading** (medium 500, clamp 30px to 48px, line-height 1.15, tracking -0.01em): Section H2s on marketing surfaces. Emotional section openers. Standard Minion Pro optical size.

- **Subheading** (medium 500, clamp 24px to 30px, line-height 1.2, tracking 0): Sub-section H3s, card titles, modal titles. Optical size: Minion Pro Subhead.

- **Accent** (regular 400 italic, clamp 18px to 24px, line-height 1.65): Taglines, pull-quotes, poetic lines, emotional one-liners below hero headings. Minion Pro italic. The most specifically editorial role; use sparingly and only when the content earns it.

- **Body** (light 300, 16px fixed, line-height 1.65): Main paragraphs, product descriptions, landing page prose. Inter at light weight. Maximum line length: 65–75 characters.

- **Body-Small** (light 300, 14px fixed, line-height 1.6): Secondary descriptions, FAQ answers, card supporting text, form helper text.

- **Eyebrow** (medium 500, 11px fixed, tracking 0.15em, ALL CAPS, Honey colored): Uppercase kickers above headings. "THE BOOK." "THIS IS SMALL PLATES." Always Honey. This is the single sanctioned use of Honey for a type color.

- **Caption** (regular 400, 12px fixed, line-height 1.5, Warm Gray): Attributions, timestamps, photo credits, metadata. Always Warm Gray, never Soft Charcoal — reduced size requires reduced color weight to maintain hierarchy.

## 4. Elevation

This system is flat by default. The primary depth mechanism is tonal counterpoint between the two warm whites (Canvas-vs-Layer Rule), not shadows. Sections separate through alternating Warm and Airy surfaces, not through dividers or box shadows.

Shadows appear only on three surface types: recipe cards (ambient at rest), interactive cards and book previews (diffuse lift on hover), and modals/sheets (full separation). All shadows use Soft Charcoal at low opacity; never neutral black.

### Shadow Vocabulary

- **Ambient at rest** (`box-shadow: 0 1px 3px rgba(45,45,45,0.06)`): Recipe cards at rest, inner book preview card. Barely perceptible. Signals a distinct surface without lifting it. If you cannot see it, it is working.

- **Hover lift** (`box-shadow: 0 4px 20px rgba(45,45,45,0.10)` paired with `transform: translateY(-2px)`): Interactive cards on hover. Lifts without drama. The translateY makes the depth readable without requiring a larger shadow.

- **Floating surface** (`box-shadow: 0 25px 50px rgba(0,0,0,0.25)`): Modals, bottom sheets, dropdowns. Full visual separation from the page. Reserved for elements that genuinely read as above the surface.

### Named Rules

**The Flat-by-Default Rule.** Surfaces are flat at rest. The two warm whites provide all ambient depth. Shadows are state responses, not decorative permanence. If a surface has a shadow purely to look elevated at rest, remove it.

## 5. Components

**The Used-Object Rule.** Every photograph, every layout, every component should look like it could exist in someone's actual life. If it would only exist in a styled photograph, it is wrong. Stains, crumbs, fingerprints, slightly off-center crops, hands mid-motion, plates with something missing — these are features. The book exists in homes; the brand should never feel like it doesn't.

### Buttons

Pill-shaped by default (full radius, 9999px). Four variants. The pill is the system's personality: direct, confident, non-precious. The `btn-form` modifier (8px radius) exists for onboarding and checkout contexts where pill reads as casual and a form-aligned shape serves better.

- **Honey (Primary CTA):** Honey fill (#D4A854), white text. Hover: #C49C4A (desaturated, not simply darkened). One Honey button per view, maximum.
- **Dark (Secondary Action):** Soft Charcoal fill (#2D2D2D), white text. Hover: Deep Charcoal (#1A1A1A). For primary actions that are not purchase/submit, or when hierarchy needs a strong non-Honey anchor.
- **Outline (Tertiary):** Transparent fill, Soft Charcoal text, border-button (#D4D0C8) stroke. Hover: border and text shift to Honey. Signals option without demanding attention.
- **Subtle (Inline/Minimal):** Transparent fill, Warm Gray text, border-button stroke. Self-sizing (px-5 py-3, 14px). For tertiary actions adjacent to primary ones. No hover color shift.
- **Disabled (all variants):** Opacity 0.4. Cursor: not-allowed. No color change.

Sizes: Large (px-8 py-4, 18px) for landing CTAs; Medium (px-8 py-3, 16px) for primary flow actions; Small (px-6 py-3, 14px) for modals and toolbars.

### Recipe Cards

White surface (#FFFFFF) on the warm-white canvas. Rounded corners (12px). Ambient shadow at rest; hover lift (-2px translateY, wider shadow).

Internal layout: centered column. Serif italic title (Minion Pro italic, 18px, Soft Charcoal). Decorative divider line (24px wide, 1px tall, Decorative Line color). Sans contributor attribution (13px, Warm Gray). Action buttons (edit/delete) on group-hover overlay: opacity 0 by default, fades to 1 on parent hover.

### Inputs / Fields

White fill, Sand border (1px). Rounded corners (12px). Inter 15px, Soft Charcoal. Placeholder in Warm Gray.

Focus state: border shifts to Honey. No glow, no shadow ring, no fill change. The border shift is sufficient. Error state: border shifts to Terracotta. Label above field: Inter medium 14px, Soft Charcoal.

Touch target: minimum 44px height on mobile, no exceptions. Forms must survive autofill, paste-from-notes, and paste-from-voice. Labels and helper text must work in both ES and EN.

### Navigation

Logo: Minion Pro standard weight, approximately 18px, Soft Charcoal. "& Co." suffix in Warm Gray, 13px. Horizontal bar on desktop; sheet on mobile.

Nav links: Inter regular, base size, Soft Charcoal. Active state: Honey underline or Honey text. Hover: Honey text.

Primary nav CTA: btn-honey or btn-dark depending on the surface. Never btn-outline in the nav — it vanishes.

### Book Preview (Signature Component)

The product artifact shown in its natural habitat: open on a surface, not floating in isolation.

Cream container (#F5F1EB), rounded XL (16px). Inner book card: white (#FFFFFF), rounded corners (12px), shadow-lg. Serif title (Minion Pro, 28px, Soft Charcoal). Subtitle in Warm Gray sans. Progress line in Warm Gray sans; contributor count in Honey medium.

The Honey count is the emotional payload of this component. Design decisions around the book preview should always center that number.

### Modals and Sheets

Background: Warm White Warm (#FAF7F2) — the layer token in product register. Backdrop: Soft Charcoal at 50% opacity. Rounded XL (16px). Shadow-2xl. Max-width 512px.

Modal title: Minion Pro semibold, 24px. Subtitle/supporting copy: Inter 14px, Warm Gray. Bottom sheet (mobile): slides in from bottom via cubic-bezier(0.4, 0, 0.2, 1) ease-out.

## 6. Do's and Don'ts

**The Cut-the-Last-Sentence Rule.** If you're not sure, cut the last sentence. That's where the explanation hides.

**The Book-In-Use Rule.** Photograph the book stained, open, on counters. Never pristine.

**The Behavioral-Not-Demographic Rule.** Never address the organizer by role; address her by behavior.

### Do

- **Do use Honey sparingly, always earned.** It anchors CTAs, active states, the eyebrow kicker, and progress highlights. Nowhere else.

- **Do choose the warm white token by register.** Brand surfaces: `--brand-warm-white-warm` as canvas. Product surfaces: `--brand-warm-white-airy` as canvas. Never swap. Never use hex literals.

- **Do let specifics carry the emotion.** "32 of 45 guests have submitted" is emotional. "A meaningful experience" is not. Numbers, names, and observable actions do what adjectives cannot.

- **Do photograph the book in use.** Stained pages, open on a kitchen counter, next to a glass, mid-meal. Real surfaces. Real light. Real use.

- **Do address the organizer by behavior.** The one who opens the group chat, sends the link, follows up. Not: the MOH, the bridesmaid, the sister, the mom. Behavioral targeting expands the audience; role targeting collapses it.

- **Do pair Minion Pro with Inter only.** Serif for headings and emotional moments. Sans for body and UI. Never swapped. Never a third typeface.

- **Do cap body text at 65–75 characters per line.** Generous line height (1.65) and a contained measure make prose editorial, not exhausting.

### Don't

- **Don't use banned vocabulary.** In any context: copy, UI labels, email subject lines, alt text, tooltips. The banned list is absolute: cherish · treasure · memories · special · unique · loved ones · celebrate · journey · curated · perfect · amazing · so blessed · yummy · heartfelt keepsake · meaningful · timeless.

- **Don't reach for the easy word.** Always ask: is this the word, or is this the easy word?

**We say / We don't say:**

| We say | We don't say |
|---|---|
| the people | loved ones |
| everyone who showed up | your nearest and dearest |
| the book lives in the kitchen | a timeless keepsake |
| who came | who gathered to celebrate |
| the afterward | forever / always |
| 80 guests, one book | a collaborative, curated experience |
| she pulled it off | she created something special |
| at the table | cherish / treasure |
| Wednesday | your special day |
| the people in her life | her loved ones |

- **Don't produce anything that could appear on these surfaces:**
  - **vinst.me** — cookbook-as-AI-tool pattern: AI is the value driver, the user inputs into a tool. Wrong inversion. Small Plates is the inverse: the guests make the cookbook.
  - **createmycookbook.com** — cookbook-as-template pattern: DIY framing, multi-vertical dilution, spiral-bound institutional signal.
  - **The Knot, Zola, Brides.com, Minted, Paperless Post** — the wedding industry aesthetic cluster: script calligraphy, golden-hour photography, orchestrated candid, mason jars, fairy lights, "her and him" framing, "your perfect day" copy.
  - **Playfair Display + script calligraphy** — the wedding typeface pairing. Banned across the system at every size and weight. If Minion Pro is unavailable, fall to Georgia.
  - **Light-and-airy photography** — overexposed whites, golden hour, couples mid-joy, drone venue shots, first-look reveals. The inverse of Wednesday at the kitchen counter.
  - **Generic SaaS / AI tool aesthetic** — purple gradients, glassmorphism, "Boost your X" value props, stock illustrations of people on laptops, Lottie animations as decoration, hero-metric dashboards (big number + small label + gradient accent).

- **Don't use Honey for body text or critical information.** It fails WCAG AA on Warm White at approximately 2.1:1. Color is never the sole signal for UI state — always paired with text, icon, or shape.

- **Don't use pure black (#000000) anywhere.** Soft Charcoal (#2D2D2D) is the darkest text color. Deep Charcoal (#1A1A1A) for elevated emphasis only.

- **Don't introduce new colors.** No pinks, blues, or purples. No cool-tinted grays. Every color outside the palette is a vote against the warmth the system has built.

- **Don't apply side-stripe borders** (border-left or border-right larger than 1px as a colored accent on cards, list items, or callouts). Rewrite with full borders, background tints, leading icons, or nothing.

- **Don't use gradient text** (background-clip: text with a gradient fill). Use a single solid color. Emphasis through weight or size.
