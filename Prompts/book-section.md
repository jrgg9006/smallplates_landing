# Implementation Prompt: "The Book" Section — Small Plates Landing Page

---

## Overview

You are adding a new section called **"The Book"** to the Small Plates & Co. landing page. This section showcases the physical product — a hardcover, handmade, full-color wedding cookbook.

**Placement:** This section goes **after** the "Not just recipes. It's what they write" section (grandma's emotional note) and **before** the "We've got you" section.

**Purpose:** Bridge the emotional story with product confidence. Visitors are emotionally sold by this point — now they need to visualize exactly what shows up at their door.

---

## CRITICAL: Font & Color Consistency

**DO NOT use hardcoded font families or colors from this prototype.** Instead:

1. **Inspect the existing landing page** to identify which CSS classes, Tailwind utilities, or font variables are already used for:
   - **Section headlines** (e.g., "Wedding gifts have a problem." / "A cookbook made by everyone who showed up.") — Use that same font/size/weight for `"What shows up at your door."`
   - **Section body text** (e.g., the paragraph under "Wedding gifts have a problem.") — Use that same font/size/color for all body copy in this section
   - **Card headings** (e.g., step titles in "How it works") — Use for the spec card `h3` elements
   - **Small labels / uppercase text** (e.g., step numbers "01", "02", "03") — Use for the `HANDMADE` and `THE BOOK` labels
   - **CTA buttons** (e.g., "Give this Gift", "Start a Book for Them") — Use the exact same button styles
   - **Background colors** — Match the existing page background, card backgrounds, divider colors

2. **The prototype uses these as reference only** (these are the brand guidelines, but your codebase may have slightly different implementations):
   - Serif font: `Cormorant Garamond` (prototype) → In production, use whatever serif the landing page already uses for headlines
   - Sans-serif font: `DM Sans` (prototype) → In production, use whatever sans-serif the page uses for body text
   - Honey: `#D4A854` — accent/brand color
   - Warm White: `#FAF7F2` — page background
   - Cream: `#F5F1EB` — card/section backgrounds
   - Sand: `#E8E0D5` — borders/dividers
   - Charcoal: `#2D2D2D` — primary text
   - Deep Charcoal: `#1A1A1A` — headline text
   - Warm Gray: `#9A9590` — secondary/muted text

3. **Check existing Tailwind config or CSS variables** — the project likely has these colors defined as custom values already. Use the existing tokens.

---

## Section Structure (5 Parts)

The section has 5 distinct parts, in this order:

```
┌─────────────────────────────────────────────────┐
│                                                 │
│         1. HEADLINE + SUBTITLE                  │
│         "What shows up at your door."           │
│                                                 │
├─────────────────────────────────────────────────┤
│                                                 │
│         2. BOOK HERO                            │
│         [3D Book Cover]  [Intro Text + Tags]    │
│                                                 │
├────────┬────────┬────────┬──────────────────────┤
│        │        │        │                      │
│  SPEC  │  SPEC  │  SPEC  │   3. SPECS GRID      │
│  CARD  │  CARD  │  CARD  │   (3x2 grid)         │
│   01   │   02   │   03   │                      │
├────────┼────────┼────────┤                      │
│  SPEC  │  SPEC  │  SPEC  │                      │
│  CARD  │  CARD  │  CARD  │                      │
│   04   │   05   │   06   │                      │
├────────┴────────┴────────┴──────────────────────┤
│                                                 │
│  [Stitch Visual]  │  4. HANDMADE CALLOUT        │
│   Left (dark bg)  │  Right (cream bg + text)    │
│                                                 │
├────────┬────────┬────────┬──────────────────────┤
│ Detail │ Detail │ Detail │ Detail │              │
│ FINISH │ PAPER  │ COLOR  │  SIZE  │ 5. DETAILS  │
├────────┴────────┴────────┴────────┴─────────────┤
│                                                 │
│         6. CLOSING + CTA                        │
│         "Designed by us. Bound by hand..."      │
│         [Give this Gift]                        │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## Part 1: Headline + Subtitle

```
Headline: "What shows up at your door."
Subtitle: "Every book is hardcover, full color, and handmade. Because what's inside deserves to be held in something real."
```

- Headline uses the **same font, size, and weight** as other section headlines on the page
- Subtitle uses the **same muted/gray body font** as other section subtitles
- Centered, with max-width ~520px on the subtitle
- Bottom margin ~64px before the next element

---

## Part 2: Book Hero (Cover + Intro Text)

**Layout:** Side-by-side on desktop (flex row, gap ~80px), stacked on mobile (column).

### Left: 3D Book Cover Mockup

A CSS-only 3D book effect showing the real cover image. The cover image is: `/images/book-cover-front-thebooksection.png` (you'll need to add this to the public images directory).

**3D Book CSS approach:**
- Container with `perspective: 1200px`
- Book wrapper: `width: 320px; height: 400px; transform-style: preserve-3d; transform: rotateY(-12deg)`
- Front face: the cover image via `<img>`, with `border-radius: 1px 4px 4px 1px`, box-shadow for depth
- Spine: a pseudo-element or div, `width: 24px`, gradient from darker to lighter (simulates book spine), positioned with `rotateY(90deg) translateZ(0px) translateX(-12px)`
- Pages edge: `width: 16px`, repeating gradient to simulate page edges on the right side
- Shadow: a blurred ellipse below the book
- **Hover effect:** `transform: rotateY(-5deg)` with smooth transition
- On mobile: reduce to `width: 240px; height: 300px`

### Right: Intro Text

```
Label:    "THE BOOK" (uppercase, small, letter-spaced, honey/accent color)
Heading:  "A real book. Made by hand. Made to last."
Para 1:   "Every Small Plates book is a hardcover cookbook — professionally designed, printed in full color, and bound by hand in our workshop. No templates. No shortcuts."
Para 2:   "Each book is unique, because every couple's people are unique."
```

Below the paragraphs, a row of **spec tags** (small pills/badges):

```
[Hardcover] [Full color] [Handmade] [8 × 10 in] [Matte finish]
```

Tag styling: `font-size: 12px; background: cream; border: 1px solid sand; padding: 7px 14px; border-radius: 2px`

---

## Part 3: Specs Grid (3×2)

**Layout:** CSS Grid, `grid-template-columns: repeat(3, 1fr)`, with 1px gap and sand-colored background (to create thin divider lines between cards). Cards have white/warm-white background.

**Responsive:**
- Desktop: 3 columns
- Tablet (< 900px): 2 columns
- Mobile (< 600px): 1 column

Each card has: **Icon → Heading → Description**

Card padding: `48px 36px`
Hover effect: background transitions to cream

### Card 1: Hardcover
**Icon SVG (30×30 viewBox):**
```html
<svg viewBox="0 0 30 30" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">
  <rect x="5" y="3" width="20" height="25" rx="1.5" />
  <line x1="5" y1="3" x2="5" y2="28" stroke-width="2.5" />
  <line x1="10" y1="10" x2="20" y2="10" />
  <line x1="10" y1="14" x2="17" y2="14" />
</svg>
```
**Heading:** "Hardcover, matte finish."
**Description:** "Premium hardcover with a smooth matte finish. Clean, elegant, and made to look beautiful on any counter or bookshelf."

### Card 2: Full Color
**Icon SVG:**
```html
<svg viewBox="0 0 30 30" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="15" cy="12" r="7" />
  <circle cx="15" cy="12" r="2.5" />
  <rect x="8" y="20" width="14" height="5" rx="1" />
  <line x1="12" y1="22.5" x2="18" y2="22.5" />
</svg>
```
**Heading:** "Full color, every page."
**Description:** "Professionally designed with AI-generated photography for every recipe. Your people's food, presented the way it deserves."

### Card 3: Recipes
**Icon SVG:**
```html
<svg viewBox="0 0 30 30" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">
  <rect x="3" y="2" width="17" height="22" rx="1" />
  <rect x="10" y="6" width="17" height="22" rx="1" />
  <line x1="14" y1="13" x2="23" y2="13" />
  <line x1="14" y1="17" x2="21" y2="17" />
  <line x1="14" y1="21" x2="19" y2="21" />
</svg>
```
**Heading:** "Up to 50 recipes."
**Description:** "Each with a personal note from the person who sent it. Their recipe. Their words. Their page in the book."

### Card 4: Size
**Icon SVG:**
```html
<svg viewBox="0 0 30 30" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">
  <rect x="3" y="5" width="24" height="17" rx="1" />
  <line x1="3" y1="14" x2="27" y2="14" />
  <circle cx="15" cy="10" r="3" />
  <line x1="15" y1="22" x2="15" y2="26" />
  <line x1="11" y1="26" x2="19" y2="26" />
</svg>
```
**Heading:** "8 × 10 inches."
**Description:** "Letter size. Big enough to cook from comfortably. The kind of book you leave open on the counter — not tucked away on a shelf."

### Card 5: Binding
**Icon SVG:**
```html
<svg viewBox="0 0 30 30" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M7 27V5a2 2 0 012-2h12a2 2 0 012 2v22" />
  <line x1="3" y1="27" x2="27" y2="27" />
  <path d="M11 9l4 3 4-3" />
  <line x1="15" y1="12" x2="15" y2="21" />
</svg>
```
**Heading:** "Sewn and glued binding."
**Description:** "Not stapled. Not cheap. Made the way books were meant to be made — to stay open on the counter while you cook."

### Card 6: Dust Jacket
**Icon SVG:**
```html
<svg viewBox="0 0 30 30" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">
  <rect x="6" y="2" width="18" height="24" rx="1" />
  <rect x="8" y="4" width="14" height="9" rx="0.5" />
  <line x1="8" y1="17" x2="22" y2="17" />
  <line x1="8" y1="20" x2="18" y2="20" />
  <line x1="8" y1="23" x2="15" y2="23" />
</svg>
```
**Heading:** "Custom dust jacket."
**Description:** "With the couple's names. A cover image chosen from their recipes. Removable, so the book lives beautifully both ways."

---

## Part 4: Handmade Callout

**Layout:** 2-column grid, no gap. Left = dark visual, Right = text on cream background.

**Responsive:** Stacks to single column on mobile (< 960px).

### Left Panel (Dark Background)
- Background: charcoal (#2D2D2D)
- Contains an abstract representation of hand-stitching (decorative only)
- This is a placeholder — eventually will be replaced with a real close-up photo of the binding process
- Small note in bottom-right corner: "Photo: binding close-up" (very faint, 10px, uppercase)

**Stitch pattern CSS approach:**
- Stack of horizontal lines (honey color, 80px wide, 0.4 opacity) with small dots at center
- Between each line, a small vertical thread connector (1px wide, 10px tall, honey, 0.25 opacity)
- Label below: "sewn by hand" in italic serif, very faint white

### Right Panel (Text)
```
Label:    "HANDMADE" (uppercase, small, letter-spaced, honey color)
Heading:  "Every book is sewn and bound by hand."
Para 1:   "Because every book is different — different recipes, different people, different size — each one is assembled individually in our workshop. Sewn, glued, pressed, and inspected by hand."
Para 2:   "No assembly line. No mass production. The same way bookbinders have worked for generations."
```

**Important — the artisanal note (styled as a pull quote):**
```
"Handmade means no two books are identical. Small variations in the binding are a sign of craft, not a flaw — they're proof that a person, not a machine, made your book."
```
This note has a left border in honey color (2px), with left padding ~20px. It uses the serif font in italic.

---

## Part 5: Detail Strip (4 items)

**Layout:** `grid-template-columns: repeat(4, 1fr)`, gap 16px
**Responsive:** 2 columns on tablet and mobile

Each item: square visual (aspect-ratio: 1) + text below.

### Item 1: The Finish
- **Visual:** Subtle gradient simulating matte surface (light cream tones with a light reflection overlay)
- **Label inside:** "Matte surface" (very faint, small uppercase)
- **Title:** "The finish."
- **Description:** "Smooth matte hardcover. Elegant, durable, designed to age beautifully."

### Item 2: The Paper
- **Visual:** Abstract page representation (small rectangle block + horizontal lines at different widths simulating text)
- **Title:** "The paper."
- **Description:** "150 gsm couché. Thick, smooth, built to hold vivid color and survive the kitchen."

### Item 3: The Color
- **Visual:** 2×2 grid of color swatches (Terracotta #C4856C, Honey #D4A854, Olive #6B7B5E, Charcoal #2D2D2D)
- **Title:** "The color."
- **Description:** "Full color throughout. Every recipe, every photo, every page — vivid and rich."

### Item 4: The Size
- **Visual:** Outlined rectangle with 8/10 aspect ratio, "8 × 10" label centered, dimension labels on edges
- **Title:** "The size."
- **Description:** "Letter format. Big enough to read while cooking. A statement on any shelf."

---

## Part 6: Closing + CTA

**Centered, max-width ~600px**

```
Line 1:  "Designed by us. Bound by hand. Printed for them."
Line 2:  "Made to be _used_."  (where "used" is in italic + honey/accent color)
```

**CTA Button:** "Give this Gift" — use the **exact same button component/styles** as the existing CTAs on the page.

**Below button:** "Full book specifications →" as a subtle text link (small, muted gray, underline on hover).

---

## Animations

Apply a **fade-up** entrance animation to elements as they enter the viewport:

```css
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(24px); }
  to { opacity: 1; transform: translateY(0); }
}
```

- Use intersection observer or your existing animation library to trigger on scroll
- Stagger the 6 spec cards (50ms delay between each)
- Each section part animates independently

If the project uses Framer Motion or a similar library, use that instead of raw CSS animations.

---

## Responsive Breakpoints Summary

| Element | Desktop (>960px) | Tablet (600-960px) | Mobile (<600px) |
|---------|-------------------|---------------------|-----------------|
| Book Hero | Side-by-side (row) | Stacked (column) | Stacked (column) |
| Specs Grid | 3 columns | 2 columns | 1 column |
| Handmade Callout | 2 columns | 1 column (stacked) | 1 column (stacked) |
| Detail Strip | 4 columns | 2 columns | 2 columns |
| Book 3D mockup | 320×400px | 320×400px | 240×300px |
| Section padding | 0 40px | 0 40px | 0 24px |

---

## Image Assets Needed

Place in `/public/images/` (or wherever the project stores static images):

1. **`book-cover-front-thebooksection.png`** — The real book cover (Rocío & Victor design). This file will be provided separately.

---

## Reference HTML

The complete working prototype is available as `the-book-section-v3.html`. Open it in a browser to see exactly how each element should look, feel, and animate.

Key things to match from the prototype:
- The 3D book rotation effect and hover interaction
- The 1px grid divider pattern on the specs grid (sand-colored background with white cards creates thin lines)
- The handmade callout's split layout (dark left, cream right)
- The spec card hover effect (background transitions to cream)
- The stitch pattern visual in the handmade section
- The pull-quote styling with left honey border

**The prototype is the visual spec. Match it as closely as possible while using the existing project's design system (fonts, colors, components, utilities).**

---

## Checklist Before Shipping

- [ ] Section headline font matches other section headlines on the page
- [ ] Body text font matches other body text on the page
- [ ] CTA button is the same component used elsewhere
- [ ] Colors come from project's CSS variables / Tailwind config, not hardcoded
- [ ] Cover image loads and displays correctly in the 3D book
- [ ] Hover on book rotates smoothly
- [ ] All 6 spec cards display with icons
- [ ] Handmade callout displays correctly (split layout)
- [ ] Artisanal note has honey left border
- [ ] Detail strip shows 4 items
- [ ] Closing line "used" is in italic + accent color
- [ ] Responsive: tested at 1200px, 768px, 375px widths
- [ ] Spec grid collapses: 3 → 2 → 1 columns
- [ ] Book hero stacks vertically on mobile
- [ ] Fade-up animations trigger on scroll
- [ ] Section is placed after grandma's note, before "We've got you"