# Small Plates — Landing Page Implementation Guide

## Overview

This guide contains all the redesigned components for the Small Plates wedding landing page, following the Margot Cole brand voice and the new narrative flow.

---

## Files Created

### Core Components (Fase 1)

| File | Status | Description |
|------|--------|-------------|
| `components/landing/Hero.tsx` | **REPLACE** | New hero with acquisition line + wedding context |
| `components/landing/TheProblem.tsx` | **NEW** | Cultural enemy section (forgettable gifts) |
| `components/landing/TheSolution.tsx` | **NEW** | What is Small Plates |
| `components/landing/EmotionalClose.tsx` | **NEW** | "Still at the table" closing |

### Support Components (Fase 2)

| File | Status | Description |
|------|--------|-------------|
| `components/landing/HowItWorks.tsx` | **REPLACE** | Redesigned 3-step process |
| `components/landing/BooksPrinted.tsx` | **REPLACE** | Updated proof section |
| `components/landing/ForGiftGivers.tsx` | **NEW** | Section for organizers/bridesmaids |

### Polish Components (Fase 3)

| File | Status | Description |
|------|--------|-------------|
| `components/landing/FAQ.tsx` | **REPLACE** | Wedding-context questions |
| `components/landing/Footer.tsx` | **REPLACE** | Updated with brand line |

### Main Page

| File | Status | Description |
|------|--------|-------------|
| `app/(public)/page.tsx` | **REPLACE** | New narrative flow |

---

## Components to DELETE

Remove these files from your project:

```
components/landing/TextSection.tsx      → Replaced by TheSolution
components/landing/WellWhatIf.tsx       → Replaced by TheProblem
components/landing/FoodPerfect.tsx      → Doesn't fit new narrative
components/landing/WhatsIncluded.tsx    → Already hidden, remove
components/landing/ShareBanner.tsx      → Evaluate, likely remove
components/landing/MemorableExperience.tsx → Replaced by EmotionalClose
```

---

## New Narrative Flow

```
1. Banner (keep existing)
2. Hero ← REPLACED
3. TheProblem ← NEW
4. TheSolution ← NEW
5. HowItWorks ← REPLACED
6. BooksPrinted ← REPLACED (Proof)
7. ForGiftGivers ← NEW
8. EmotionalClose ← NEW
9. FAQ ← REPLACED
10. Footer ← REPLACED
```

---

## Color Palette (CSS Variables Suggestion)

Add to your global CSS or Tailwind config:

```css
:root {
  --color-honey: #D4A854;
  --color-honey-dark: #c49b4a;
  --color-warm-white: #FAF7F2;
  --color-soft-charcoal: #2D2D2D;
  --color-sand: #E8E0D5;
  --color-terracotta: #C4856C;
  --color-warm-gray: #9A9590;
}
```

Or in Tailwind config:

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        honey: '#D4A854',
        'warm-white': '#FAF7F2',
        'soft-charcoal': '#2D2D2D',
        sand: '#E8E0D5',
        terracotta: '#C4856C',
        'warm-gray': '#9A9590',
      }
    }
  }
}
```

---

## Images Needed

### Hero Section
- `images/landing/hero-wedding-kitchen.jpg`
  - Direction: Couple cooking together, golden hour light, warm tones
  - AI Prompt: "Editorial lifestyle photography, couple cooking together in warm kitchen, golden hour light through window, hands preparing food, shallow depth of field, Kinfolk magazine aesthetic, warm color grading --ar 16:9"

### The Solution Section
- `images/landing/book-in-kitchen.jpg`
  - Direction: The book open on a kitchen counter, lived-in feel
  - AI Prompt: "Hardcover cookbook open on marble kitchen counter, natural window light, warm tones, recipe page visible with handwriting, coffee cup nearby, lived-in kitchen, editorial still life, Kinfolk magazine style --ar 4:5"

### How It Works Section
- `images/landing/how-it-works/step-1-invite.png`
- `images/landing/how-it-works/step-2-recipes.png`
- `images/landing/how-it-works/step-3-book.png`
  - Direction: Clean illustrations or photos showing each step
  - Can reuse existing images if they fit the new style

---

## Typography

Ensure these fonts are loaded:

- **Serif (Headlines):** Minion Pro or similar (Playfair Display as fallback)
- **Sans-serif (Body):** Inter

```css
/* In your CSS */
.font-serif {
  font-family: 'Minion Pro', 'Playfair Display', Georgia, serif;
}

.font-sans {
  font-family: 'Inter', system-ui, sans-serif;
}
```

---

## Copy Reference

### Headlines (for quick reference)

| Section | Headline |
|---------|----------|
| Hero | "Recipes from the people who love you." |
| The Problem | "Wedding gifts have a problem." |
| The Solution | "A cookbook made by everyone who showed up." |
| How It Works | "Here's how it happens." |
| Proof | "Real recipes. Real people. Real books." |
| Gift Givers | "Giving this as a gift?" |
| Emotional Close | "Ten years from now..." |
| FAQ | "Questions?" |

### CTAs

| Context | CTA Text |
|---------|----------|
| Primary (for bride) | "Start Your Book" |
| Secondary (for organizer) | "Start a Book for Someone" |
| Navigation | "See how it works" |

### Brand Lines

| Line | Usage |
|------|-------|
| Acquisition | "Recipes from the people who love you." |
| Brand | "Still at the table." |

---

## Testing Checklist

Before launch, verify:

- [ ] All images load correctly
- [ ] CTAs link to correct onboarding flow
- [ ] Mobile responsive on all sections
- [ ] Scroll behavior works for "See how it works"
- [ ] FAQ accordion functions properly
- [ ] Book preview modal still works
- [ ] Recipe modal in Proof section works
- [ ] Form validation in any forms
- [ ] Analytics events fire correctly
- [ ] Page loads under 3 seconds
- [ ] No console errors

---

## Margot Test — Final Check

Before shipping, ask for each section:

> "Would Margot say this with a knowing smile?"

If she'd roll her eyes → rewrite.
If she'd cringe → kill it.
If she'd nod and say "this is different" → ship it.

---

*Implementation Guide — Small Plates Wedding Landing Page*
*Version 1.0*