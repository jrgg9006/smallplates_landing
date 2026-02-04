# Task: Create "Personal Notes" Section for Landing Page

## Overview

Create a new section that showcases the personal notes that guests write alongside their recipes. This is the emotional core of the product — it communicates that Small Plates books aren't just recipes, they're messages of love from the people who matter most.

**Position:** After `BooksPrinted` and BEFORE `ForGiftGivers`

**Feeling:** Intimate, emotional, like reading a personal letter. "Wow, that's beautiful."

---

## Files to Create/Modify

### 1. CREATE: `components/landing/PersonalNotes.tsx`

```tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

const notes = [
  {
    id: 1,
    text: "Dear Sarah and James — this is a recipe that Grandma Tati gave us many years ago. She typed it up from what her cousin told her, and the original is barely legible now. I hope this recipe always reminds you of the importance of staying close — and what better place than around the kitchen. Keep family legacies alive for your children and grandchildren. With all my love.",
    recipe: "Grandma Tati's Paella",
    from: "Dad",
  },
  {
    id: 2,
    text: "Some of my best conversations with Michael have been over a cold beer. No rush, no agenda — just time to catch up and laugh. This is less of a recipe and more of a reminder: always make time for the people you love.",
    recipe: "Ice Cold Beers",
    from: "Jake & Tina",
  },
  {
    id: 3,
    text: "For any moment. May it give you the same memories together that it's given me.",
    recipe: "Spanish Tortilla",
    from: "Uncle Roberto",
  },
  {
    id: 4,
    text: "This is my grandmother's recipe — super easy, and it was THE dessert at every family gathering. My cousin started selling them and honestly built a little empire because they're that good. I started making them for the people I love most every Christmas. Now it's yours.",
    recipe: "Date & Walnut Pie",
    from: "Cousin Maria",
  },
  {
    id: 5,
    text: "May your life together be full of quiet mornings, long breakfasts, and small rituals that become big memories. And when something doesn't turn out perfect, remember that love — like this recipe — always gets better when you make it together.",
    recipe: "Imperfect Pancakes",
    from: "Pilar & Mark",
  },
  {
    id: 6,
    text: "I learned this recipe in a cooking class the year we lived in Boston. I've made it for countless dinners since — it's delicious and easy. I hope you love it as much as we do!",
    recipe: "Pesto Pasta",
    from: "Aunt Linda",
  },
];

export default function PersonalNotes() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const nextNote = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % notes.length);
  }, []);

  const goToNote = (index: number) => {
    setCurrentIndex(index);
  };

  // Auto-rotate every 8 seconds, pause on hover
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      nextNote();
    }, 8000);

    return () => clearInterval(interval);
  }, [isPaused, nextNote]);

  const currentNote = notes[currentIndex];

  return (
    <section
      className="bg-white py-16 md:py-24"
      aria-label="Personal notes from recipe contributors"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="mx-auto max-w-3xl px-6 md:px-8">
        {/* Headline */}
        <motion.h2
          className="font-serif text-2xl md:text-3xl lg:text-4xl text-[#2D2D2D] text-center mb-6"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          It's what they write.
        </motion.h2>

        {/* Subtle divider */}
        <div className="flex justify-center mb-10 md:mb-12">
          <div className="w-16 h-px bg-[#D4D0C8]" />
        </div>

        {/* Note container - fixed height for consistency */}
        <div className="min-h-[280px] md:min-h-[240px] flex flex-col justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentNote.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="text-center"
            >
              {/* The note text */}
              <blockquote className="font-serif text-lg md:text-xl lg:text-[22px] text-[#2D2D2D] italic leading-relaxed mb-8">
                "{currentNote.text}"
              </blockquote>

              {/* Recipe name and contributor */}
              <div className="space-y-1">
                <p className="font-sans text-[15px] md:text-base font-medium text-[#8A8780]">
                  — {currentNote.recipe}
                </p>
                <p className="font-sans text-sm text-[#8A8780]/70">
                  from {currentNote.from}
                </p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation dots */}
        <div className="flex justify-center gap-2 mt-8">
          {notes.map((_, index) => (
            <button
              key={index}
              onClick={() => goToNote(index)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === currentIndex
                  ? "bg-[#D4A854] w-6"
                  : "bg-[#D4D0C8] hover:bg-[#D4A854]/50"
              }`}
              aria-label={`Go to note ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
```

---

### 2. MODIFY: `app/(public)/page.tsx`

**Step A:** Add the import at the top with other landing component imports:

```tsx
import PersonalNotes from '@/components/landing/PersonalNotes'
```

**Step B:** Add the component between `BooksPrinted` and `ForGiftGivers`:

```tsx
return (
  <>
    <Banner />
    <main className="min-h-screen">
      <Hero />
      <TheProblem />
      <TheSolution />
      <HowItWorks />
      <RegistryInterlude />
      <BooksPrinted />
      <PersonalNotes />      {/* <-- ADD THIS LINE HERE */}
      <ForGiftGivers />
      <EmotionalClose />
      <FAQ />
      {/* ... rest of the code ... */}
    </main>
    <Footer />
  </>
)
```

---

## Design Specifications

### Section Container

| Property | Value |
|----------|-------|
| Background | `bg-white` (#FFFFFF) |
| Padding | `py-16 md:py-24` (64px / 96px) |
| Max width | `max-w-3xl` (768px) — keeps lines readable |
| Total height | ~350-400px (flexible based on note length) |

### Headline: "It's what they write."

| Property | Value |
|----------|-------|
| Font | `font-serif` (Minion Pro) |
| Weight | Regular (not italic, not bold) |
| Size | `text-2xl md:text-3xl lg:text-4xl` (24px / 30px / 36px) |
| Color | `#2D2D2D` (Soft Charcoal) |
| Alignment | Center |
| Margin bottom | `mb-6` |

### Divider Line

| Property | Value |
|----------|-------|
| Width | `64px` (w-16) |
| Height | `1px` |
| Color | `#D4D0C8` |
| Margin bottom | `mb-10 md:mb-12` |

### Note Text (Blockquote)

| Property | Value |
|----------|-------|
| Font | `font-serif` (Minion Pro) |
| Style | `italic` |
| Size | `text-lg md:text-xl lg:text-[22px]` (18px / 20px / 22px) |
| Color | `#2D2D2D` |
| Line height | `leading-relaxed` (1.625) |
| Alignment | Center |
| Wrapped in quotes | Yes — `"..."` |

### Recipe Name

| Property | Value |
|----------|-------|
| Font | `font-sans` (Inter) |
| Weight | `font-medium` (500) |
| Size | `text-[15px] md:text-base` (15px / 16px) |
| Color | `#8A8780` (Warm Gray) |
| Format | `— Recipe Name` (with em dash) |

### Contributor Name

| Property | Value |
|----------|-------|
| Font | `font-sans` (Inter) |
| Weight | Regular (400) |
| Size | `text-sm` (14px) |
| Color | `#8A8780` at 70% opacity |
| Format | `from Name` |

### Navigation Dots

| Property | Value |
|----------|-------|
| Size (inactive) | `w-2 h-2` (8px circle) |
| Size (active) | `w-6 h-2` (24px pill) |
| Color (inactive) | `#D4D0C8` |
| Color (active) | `#D4A854` (Honey) |
| Hover (inactive) | `#D4A854` at 50% opacity |
| Gap between dots | `gap-2` (8px) |
| Transition | `duration-300` |

---

## Animation Specifications

### Auto-Rotate

| Property | Value |
|----------|-------|
| Interval | 8 seconds |
| Pause on hover | Yes |
| Resume on mouse leave | Yes |

### Fade Transition (Between Notes)

| Property | Value |
|----------|-------|
| Type | Fade + slight vertical movement |
| Duration | 0.5 seconds |
| Easing | `easeOut` |
| Enter | `opacity: 0, y: 10` → `opacity: 1, y: 0` |
| Exit | `opacity: 1, y: 0` → `opacity: 0, y: -10` |
| Mode | `wait` (exit completes before enter) |

### Initial Load Animation (Headline)

| Property | Value |
|----------|-------|
| Duration | 0.6 seconds |
| Trigger | When section enters viewport |
| Once | Yes (doesn't repeat) |

---

## Content: The 6 Notes

```javascript
const notes = [
  {
    id: 1,
    text: "Dear Sarah and James — this is a recipe that Grandma Tati gave us many years ago. She typed it up from what her cousin told her, and the original is barely legible now. I hope this recipe always reminds you of the importance of staying close — and what better place than around the kitchen. Keep family legacies alive for your children and grandchildren. With all my love.",
    recipe: "Grandma Tati's Paella",
    from: "Dad",
  },
  {
    id: 2,
    text: "Some of my best conversations with Michael have been over a cold beer. No rush, no agenda — just time to catch up and laugh. This is less of a recipe and more of a reminder: always make time for the people you love.",
    recipe: "Ice Cold Beers",
    from: "Jake & Tina",
  },
  {
    id: 3,
    text: "For any moment. May it give you the same memories together that it's given me.",
    recipe: "Spanish Tortilla",
    from: "Uncle Roberto",
  },
  {
    id: 4,
    text: "This is my grandmother's recipe — super easy, and it was THE dessert at every family gathering. My cousin started selling them and honestly built a little empire because they're that good. I started making them for the people I love most every Christmas. Now it's yours.",
    recipe: "Date & Walnut Pie",
    from: "Cousin Maria",
  },
  {
    id: 5,
    text: "May your life together be full of quiet mornings, long breakfasts, and small rituals that become big memories. And when something doesn't turn out perfect, remember that love — like this recipe — always gets better when you make it together.",
    recipe: "Imperfect Pancakes",
    from: "Pilar & Mark",
  },
  {
    id: 6,
    text: "I learned this recipe in a cooking class the year we lived in Boston. I've made it for countless dinners since — it's delicious and easy. I hope you love it as much as we do!",
    recipe: "Pesto Pasta",
    from: "Aunt Linda",
  },
];
```

---

## Visual Context: Page Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        BEIGE (#FAF7F2)                          │
│  Real recipes. Real people. Real books.                         │
│  [Recipe carousel with images]                                  │
│                        BooksPrinted                             │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                          WHITE                                  │
│                                                                 │
│                    It's what they write.                        │
│                                                                 │
│                    ────────────────────                         │
│                                                                 │
│         "Dear Sarah and James — this is a recipe that           │
│          Grandma Tati gave us many years ago..."                │
│                                                                 │
│                    — Grandma Tati's Paella                      │
│                         from Dad                                │
│                                                                 │
│                      ━━━  ○  ○  ○  ○  ○                         │
│                                                                 │
│                       PersonalNotes                             │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                        SAND (#E8E0D5)                           │
│  We've got you.                                                 │
│  [Card with steps and pricing]                                  │
│                       ForGiftGivers                             │
└─────────────────────────────────────────────────────────────────┘
```

The white background between two warm-colored sections creates a "pause" — like opening an envelope and finding a letter inside.

---

## Brand Context

This section embodies **Vivid Presence** — the core brand idea. The notes prove that when you open this book, you're not just reading recipes. You're WITH the people who wrote them.

**Voice:** The headline "It's what they write." is Margot Cole — direct, intriguing, lets the content do the work.

**Typography:** Serif italic for the notes signals these are other people's voices, not the brand speaking. It feels like reading a handwritten letter.

**Pacing:** 8-second auto-rotate is slow enough to read, but keeps movement. Pause on hover respects the reader.

---

## Testing Checklist

After implementation, verify:

- [ ] Section appears between BooksPrinted and ForGiftGivers
- [ ] Background is white, creating contrast with sections above/below
- [ ] Headline renders in serif (not italic)
- [ ] Notes render in serif italic with quotation marks
- [ ] Recipe name has em dash prefix
- [ ] Contributor name is smaller and lighter
- [ ] Auto-rotate works at 8-second interval
- [ ] Auto-rotate pauses on hover
- [ ] Dots are clickable and update current note
- [ ] Active dot is Honey colored and pill-shaped
- [ ] Fade transition is smooth between notes
- [ ] Mobile responsive (text sizes adjust)
- [ ] Min-height prevents layout shift between short and long notes
- [ ] No console errors

---

## Important Notes

- The quotes `"..."` around the note text are part of the design — they signal it's a quote
- The em dash `—` before recipe name is intentional (not hyphen)
- AnimatePresence with `mode="wait"` ensures clean transitions
- The `min-h-[280px]` on desktop prevents layout jumping when shorter notes appear
- Pause on hover is subtle UX that respects readers who want more time