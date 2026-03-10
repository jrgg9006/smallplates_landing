# Agent Prompt: Create `GuestListStrip` Component

## Context

We have a Next.js 14 + TypeScript + Tailwind landing page at `app/(public)/page.tsx`.

The current section order is:
1. `<Hero />`
2. `<TheProblem />`
3. `<TheSolution />`
4. `<HowItWorks />` ← insert new component AFTER this one
5. **`<GuestListStrip />`** ← NEW component goes here
6. `<BooksPrinted />`
7. `<ForGiftGivers />`
...

---

## Task

Create a new React component: `components/landing/GuestListStrip.tsx`

Then import and place it in `app/(public)/page.tsx` immediately after `<HowItWorks />`.

---

## Component Spec

### Purpose
A horizontal strip that tells the organizer (the person buying the book) that they can import their guest list from The Knot or Zola in one click — reinforcing that Step 01 ("You invite") is even easier than it looks.

### Visual Design

**Layout:** Full-width section. Centered content. No card, no shadow, no box. It should breathe.

**Background:** `#FAF7F2` (Warm White — our brand color)

**Borders:** 
- `border-top: 1px solid rgba(45,45,45,0.07)`
- `border-bottom: 1px solid rgba(45,45,45,0.07)`

**Padding:** `py-10 px-6 md:px-8`

---

### Internal Layout (top to bottom, centered)

#### 1. Platform Badges
Two small pill-shaped badges side by side, separated by a `·` dot.

Each badge:
- Background: `white`
- Border: `1px solid rgba(45,45,45,0.12)`
- Border radius: `9999px` (fully rounded)
- Padding: `4px 14px`
- Text: uppercase, letter-spacing wide, `font-sans font-semibold`, `text-[11px]`, color `rgba(45,45,45,0.4)`

Badge labels: `THE KNOT` and `ZOLA`

Separator dot between them: `·`, color `rgba(45,45,45,0.2)`

#### 2. Headline
```
Already on The Knot or Zola?
```
- Font: `font-serif`
- Size: `text-xl md:text-2xl`
- Weight: `font-normal`  
- Color: `text-[#2D2D2D]`
- Margin top: `mt-4`

#### 3. Subtext
```
Import your guest list. Emails go out in one click.
```
- Font: `font-sans font-light`
- Size: `text-base`
- Color: `text-[#2D2D2D]/50`
- Margin top: `mt-2`

**No CTA button.** This is a reassurance moment, not an action prompt.

---

### Animation
Use `framer-motion` (already installed). Wrap the inner content in a `motion.div`:

```tsx
initial={{ opacity: 0, y: 16 }}
whileInView={{ opacity: 1, y: 0 }}
viewport={{ once: true, margin: "-60px" }}
transition={{ duration: 0.5, ease: "easeOut" }}
```

---

## Full Component Code

```tsx
"use client";

import { motion } from "framer-motion";

export default function GuestListStrip() {
  return (
    <section
      className="w-full bg-[#FAF7F2] py-10 px-6 md:px-8 text-center"
      style={{
        borderTop: "1px solid rgba(45,45,45,0.07)",
        borderBottom: "1px solid rgba(45,45,45,0.07)",
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="flex flex-col items-center gap-4"
      >
        {/* Platform Badges */}
        <div className="flex items-center gap-3">
          <div
            className="px-[14px] py-1 rounded-full bg-white border font-sans font-semibold text-[11px] tracking-widest uppercase"
            style={{
              borderColor: "rgba(45,45,45,0.12)",
              color: "rgba(45,45,45,0.4)",
            }}
          >
            The Knot
          </div>
          <span style={{ color: "rgba(45,45,45,0.2)" }} className="text-base">·</span>
          <div
            className="px-[14px] py-1 rounded-full bg-white border font-sans font-semibold text-[11px] tracking-widest uppercase"
            style={{
              borderColor: "rgba(45,45,45,0.12)",
              color: "rgba(45,45,45,0.4)",
            }}
          >
            Zola
          </div>
        </div>

        {/* Headline */}
        <p className="font-serif text-xl md:text-2xl font-normal text-[#2D2D2D]">
          Already on The Knot or Zola?
        </p>

        {/* Subtext */}
        <p className="font-sans font-light text-base text-[#2D2D2D]/50">
          Import your guest list. Emails go out in one click.
        </p>
      </motion.div>
    </section>
  );
}
```

---

## Integration: `app/(public)/page.tsx`

Add the import:
```tsx
import GuestListStrip from '@/components/landing/GuestListStrip'
```

Place it in the JSX immediately after `<HowItWorks />`:
```tsx
<HowItWorks />
<GuestListStrip />
<BooksPrinted />
```

---

## Definition of Done

- [ ] File created at `components/landing/GuestListStrip.tsx`
- [ ] Component renders with `#FAF7F2` background and correct borders
- [ ] Two pill badges for "THE KNOT" and "ZOLA" appear centered with separator dot
- [ ] Headline and subtext use correct fonts, sizes, and colors from brand palette
- [ ] `framer-motion` entrance animation on scroll
- [ ] No TypeScript errors
- [ ] Component is imported and placed after `<HowItWorks />` in `app/(public)/page.tsx`
- [ ] No other files modified