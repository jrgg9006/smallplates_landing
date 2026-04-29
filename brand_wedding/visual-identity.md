# Visual Identity

# Color Palette

## Philosophy

The palette is built on warmth with sophistication — colors that feel like candlelight dinners and honey in the sun. Not cold. Not corporate. Not predictable.

---

## Primary Palette


| Role                | Name          | Hex     | Usage                                        |
| ------------------- | ------------- | ------- | -------------------------------------------- |
| **Primary Accent**  | Honey         | #D4A854 | CTAs, buttons, highlights, moments of energy |
| **Primary Neutral** | Warm White    | #FAF9F7 | Body, canvas, default surfaces               |
| **Primary Dark**    | Soft Charcoal | #2D2D2D | Primary text, logo                           |


## The Two-Tone Warm White System

Small Plates uses two warm whites in deliberate counterpoint — never interchangeably. They are the same family, separated by 2% saturation. The contrast is perceptually subtle and structurally significant: it provides layering without requiring borders or shadows, preserving editorial restraint.

| Token | Hex | Role |
|-------|-----|------|
| **Airy** | `#FAF9F7` | Lighter, more spacious. The "respirable" white. |
| **Warm** | `#FAF7F2` | Deeper, more enveloping. The "kitchen-warm" white. |

### The Canvas-vs-Layer Rule

The roles invert by register:

**In brand register** (landing pages, marketing, editorial, showcase email):
- **Warm is canvas.** Default for full-width section backgrounds, hero sections, the body of editorial pages. The warmer tone creates the enveloping atmosphere — kitchen-warm, candle-warm, dinner-table-warm.
- **Airy is layer.** Used sparingly when a section needs to feel lighter or more spacious — to create contrast against the predominantly Warm canvas.

**In product register** (organizer dashboard, submission flow, transactional surfaces):
- **Airy is canvas.** Default for body, page background, full-width app surfaces. The airier tone creates breathing room — workflow-clear, focus-supportive, friction-free.
- **Warm is layer.** Used for elements that lift from the canvas: callouts, info banners, selected states, hover states, input field backgrounds, modal backgrounds, sheet backgrounds.

### Hard rules

- **Never** use Warm as a body or page background in product register.
- **Never** use Airy as a section background in brand register.
- **Never** use literal hex (`#FAF9F7` or `#FAF7F2`) in code. Always reference the named token (`bg-brand-warm-white-airy` or `bg-brand-warm-white-warm`).
- The 2% saturation difference is the entire point. Do not "consolidate to one warm white for simplicity" — the two-tone IS the system.

### Why this exists

Editorial publications (Kinfolk, Apartamento, Cherry Bombe) use subtle tonal counterpoint to create visual rhythm between sections without leaning on harsh dividers or shadows. Small Plates inherits this technique. The Canvas-vs-Layer Rule is how the technique becomes operational at scale — every developer, every AI output, every future component knows which warm white belongs where, without having to ask.


## Secondary Palette


| Role             | Name       | Hex     | Usage                           |
| ---------------- | ---------- | ------- | ------------------------------- |
| **Warm Accent**  | Terracotta | #C4856C | Secondary accent, warmth        |
| **Cool Accent**  | Olive      | #6B7B5E | Organic feel, secondary moments |
| **Soft Neutral** | Sand       | #E8E0D5 | Subtle backgrounds, cards       |


## Extended Neutrals


| Name          | Hex     | Usage                               |
| ------------- | ------- | ----------------------------------- |
| Cream         | #F5F1EB | Alternative light background        |
| Warm Gray     | #9A9590 | Secondary text, captions            |
| Deep Charcoal | #1A1A1A | Headlines when more contrast needed |


## Color Rules

**Do:**

- Use Honey sparingly — it's the spice, not the main dish
- Let Warm White breathe — generous whitespace is part of the identity
- Use Soft Charcoal for most text — softer than pure black
- Let photography bring additional color naturally

**Don't:**

- Don't use pure black (#000000) — always Soft Charcoal or Deep Charcoal
- Don't introduce pinks, blues, or purples — they break the warmth
- Don't use Honey for large background areas — overwhelming

## The Ratio Rule

Warmth dominates. Honey is the spice, not the dish. Secondary colors (Terracotta, Olive) appear rarely, in small doses. Measure by gut, not by pixel.

---

# Typography

## Primary Type System

### Serif — Minion Pro

**Usage:** Headlines, titles, emotional moments, the book itself.

Classic editorial feel. Highly readable at various sizes. Sophisticated without being stuffy. Works beautifully in print.

### Sans-Serif — Inter

**Usage:** Body text, UI elements, functional copy, captions.

Extremely legible on screens. Modern but not cold. Pairs perfectly with Minion Pro.

## Typography Rules

**Do:**

- Mix Minion Pro and Inter intentionally — serif for emotion, sans for function
- Use generous line height for body text
- Let headlines breathe with ample spacing
- Use italic Minion Pro for quotes and emphasis

**Don't:**

- Don't use all caps for long text (okay for short labels)
- Don't use script for body text — ever
- Don't mix more than these three typefaces
- Don't use thin/light weights — they feel weak

---

*v1.3 · April 2026 · Reduced to principles only. Removed application-specific prescriptions (social media, packaging, email, dashboard), photography mandates ("Always / Never in our imagery"), technical reference (aspect ratios, file specs), and pixel-level type hierarchy. The brand book gives direction; execution belongs to the team.*

