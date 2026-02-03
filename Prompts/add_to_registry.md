# Task: Add "Getting Married?" Registry Interlude Section to Landing Page

## Overview

Create a subtle, minimal interlude section that speaks directly to couples who want to add Small Plates to their wedding registry. This section goes AFTER the `HowItWorks` component and BEFORE the `BooksPrinted` component on the landing page.

This is NOT a major section. It's a small, elegant pause—almost like a whispered aside to couples who might be browsing. It should feel like an editorial footnote, not a new feature announcement.

---

## Files to Create/Modify

### 1. CREATE: `components/landing/RegistryInterlude.tsx`

```tsx
"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export default function RegistryInterlude() {
  return (
    <section 
      className="bg-[#FAF7F2] py-12 md:py-12"
      aria-label="Registry information for couples"
    >
      <div className="mx-auto max-w-7xl px-6 md:px-8">
        
        {/* Subtle divider line */}
        <div className="flex justify-center mb-10 md:mb-12">
          <div className="w-20 h-px bg-[#D4D0C8]" />
        </div>

        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          {/* Headline - Minion Pro Italic */}
          <h2 className="font-serif text-xl md:text-2xl text-[#2D2D2D] italic mb-4">
            Wait — is this your wedding?
          </h2>

          {/* Body text - Inter Regular, Warm Gray */}
          <p className="font-sans text-[15px] md:text-base text-[#8A8780] font-normal leading-relaxed mb-5">
            You can put this on your registry.<br className="hidden sm:inline" />
            Your people fund it. They fill it. You keep it.
          </p>

          {/* CTA Link - Inter Medium, Honey */}
          <Link 
            href="/add-to-registry"
            className="inline-block font-sans text-sm md:text-[15px] font-medium text-[#D4A854] hover:underline hover:underline-offset-4 transition-all duration-200"
          >
            Here&apos;s how →
          </Link>
        </motion.div>

      </div>
    </section>
  );
}
```

---

### 2. MODIFY: `app/(public)/page.tsx`

Add the import and component in the correct position.

**Step A:** Add this import with the other landing component imports at the top of the file:

```tsx
import RegistryInterlude from '@/components/landing/RegistryInterlude'
```

**Step B:** Add the component in the return statement, between `HowItWorks` and `BooksPrinted`:

```tsx
return (
  <>
    <Banner />
    <main className="min-h-screen">
      <Hero />
      <TheProblem />
      <TheSolution />
      <HowItWorks />
      <RegistryInterlude />   {/* <-- ADD THIS LINE HERE */}
      <BooksPrinted />
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

### 3. CREATE: `app/(public)/add-to-registry/page.tsx`

This is the destination page when users click "Here's how →". Create a simple, informative page.

```tsx
"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";

export default function AddToRegistryPage() {
  return (
    <div className="min-h-screen bg-[#FAF7F2]">
      {/* Simple Header */}
      <header className="py-6 px-6 md:px-8">
        <div className="mx-auto max-w-3xl">
          <Link 
            href="/"
            className="inline-flex items-center gap-2 text-[#8A8780] hover:text-[#2D2D2D] transition-colors text-sm font-sans"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>
        </div>
      </header>

      <main className="pb-24">
        <div className="mx-auto max-w-3xl px-6 md:px-8">
          
          {/* Page Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="text-center pt-8 pb-16 md:pt-12 md:pb-20"
          >
            <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl text-[#2D2D2D] mb-4">
              Add Small Plates to your registry.
            </h1>
            <p className="font-sans text-lg md:text-xl text-[#8A8780] font-light">
              You want this. You just don&apos;t want to buy it yourself.<br className="hidden md:inline" />
              We get it. Here&apos;s how to let your people make it happen.
            </p>
          </motion.div>

          {/* Divider */}
          <div className="flex justify-center mb-16">
            <div className="w-16 h-px bg-[#D4D0C8]" />
          </div>

          {/* How It Works */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
            className="mb-20"
          >
            <h2 className="font-serif text-2xl md:text-3xl text-[#2D2D2D] mb-8 text-center">
              How it works
            </h2>
            
            <div className="space-y-6">
              {[
                {
                  number: "1",
                  title: "Add Small Plates to your registry",
                  description: "Zola, The Knot, or any registry that allows custom gifts or cash funds."
                },
                {
                  number: "2", 
                  title: "Your guests contribute toward it",
                  description: "Either one person buys it, or a group chips in together."
                },
                {
                  number: "3",
                  title: "Once it's funded, we reach out",
                  description: "We'll set everything up and start collecting recipes from your guests."
                },
                {
                  number: "4",
                  title: "Your book arrives after the wedding",
                  description: "Filled with recipes from everyone who showed up."
                }
              ].map((step, index) => (
                <div 
                  key={index}
                  className="flex gap-4 md:gap-6 items-start"
                >
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[#D4A854]/10 text-[#D4A854] font-sans text-sm font-medium flex items-center justify-center">
                    {step.number}
                  </span>
                  <div>
                    <h3 className="font-sans text-base md:text-lg font-medium text-[#2D2D2D] mb-1">
                      {step.title}
                    </h3>
                    <p className="font-sans text-sm md:text-base text-[#8A8780] font-normal">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Divider */}
          <div className="flex justify-center mb-16">
            <div className="w-16 h-px bg-[#D4D0C8]" />
          </div>

          {/* Registry-Specific Instructions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
            className="space-y-12 mb-20"
          >
            {/* Zola */}
            <div>
              <h3 className="font-serif text-xl md:text-2xl text-[#2D2D2D] mb-4">
                Adding to Zola
              </h3>
              <ol className="font-sans text-[15px] md:text-base text-[#6B6966] space-y-2 list-decimal list-inside">
                <li>Go to your Zola registry</li>
                <li>Click <span className="text-[#2D2D2D]">&quot;Add a gift&quot;</span> → <span className="text-[#2D2D2D]">&quot;Cash fund or custom&quot;</span></li>
                <li>Name it <span className="text-[#2D2D2D]">&quot;Small Plates Cookbook&quot;</span></li>
                <li>Set the amount ($149, $279, or $449 depending on your collection)</li>
                <li>Add our link: <span className="text-[#D4A854]">smallplates.co</span></li>
                <li>Done. Your guests will see it on your registry.</li>
              </ol>
            </div>

            {/* The Knot */}
            <div>
              <h3 className="font-serif text-xl md:text-2xl text-[#2D2D2D] mb-4">
                Adding to The Knot
              </h3>
              <ol className="font-sans text-[15px] md:text-base text-[#6B6966] space-y-2 list-decimal list-inside">
                <li>Go to your The Knot registry</li>
                <li>Click <span className="text-[#2D2D2D]">&quot;Add Gift&quot;</span> → <span className="text-[#2D2D2D]">&quot;Add Cash Fund&quot;</span></li>
                <li>Name it <span className="text-[#2D2D2D]">&quot;Small Plates Cookbook&quot;</span></li>
                <li>Set your goal amount ($149, $279, or $449)</li>
                <li>In the description, add: <span className="text-[#D4A854]">smallplates.co</span></li>
                <li>Save. Your guests can now contribute.</li>
              </ol>
            </div>

            {/* Other Registries */}
            <div>
              <h3 className="font-serif text-xl md:text-2xl text-[#2D2D2D] mb-4">
                Other registries
              </h3>
              <p className="font-sans text-[15px] md:text-base text-[#6B6966] leading-relaxed">
                Most registries let you add custom gifts or cash funds. 
                Look for <span className="text-[#2D2D2D]">&quot;Add custom gift&quot;</span> or <span className="text-[#2D2D2D]">&quot;Add experience.&quot;</span>
                <br /><br />
                Set the amount and link to <span className="text-[#D4A854]">smallplates.co</span>.
                <br /><br />
                Questions? <Link href="/contact" className="text-[#D4A854] hover:underline">We&apos;re here</Link>.
              </p>
            </div>
          </motion.div>

          {/* Divider */}
          <div className="flex justify-center mb-16">
            <div className="w-16 h-px bg-[#D4D0C8]" />
          </div>

          {/* Bottom CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
            className="text-center"
          >
            <h3 className="font-serif text-xl md:text-2xl text-[#2D2D2D] mb-3">
              Ready to get started?
            </h3>
            <p className="font-sans text-[15px] md:text-base text-[#8A8780] mb-6">
              Once your registry gift is funded, come back here and we&apos;ll set up your book.
            </p>
            <Link 
              href="/onboarding"
              className="inline-block bg-[#D4A854] hover:bg-[#c49b4a] text-white font-sans text-sm md:text-base font-semibold px-8 py-3 rounded-full transition-colors duration-200"
            >
              Start your book
            </Link>
          </motion.div>

        </div>
      </main>
    </div>
  );
}
```

---

## Design Specifications

### RegistryInterlude Component

| Element | Specification |
|---------|---------------|
| **Background** | `#FAF7F2` (Warm White) — same as surrounding sections |
| **Vertical Padding** | `48px` top and bottom (desktop), `48px` (mobile) via `py-12` |
| **Total Height** | ~180-200px (desktop), ~160-180px (mobile) |

#### Divider Line

| Property | Value |
|----------|-------|
| Width | `80px` |
| Height | `1px` |
| Color | `#D4D0C8` (decorative line color from brand) |
| Margin bottom | `40-48px` |

#### Headline: "Wait — is this your wedding?"

| Property | Value |
|----------|-------|
| Font | `font-serif` (Minion Pro) |
| Style | `italic` |
| Size | `24px` desktop / `20px` mobile |
| Color | `#2D2D2D` (Soft Charcoal) |
| Margin bottom | `16px` |

#### Body Text

| Property | Value |
|----------|-------|
| Font | `font-sans` (Inter) |
| Weight | `400` (Regular) |
| Size | `15px` desktop / `14px` mobile |
| Line height | `1.6` |
| Color | `#8A8780` (Warm Gray) |
| Margin bottom | `20px` |

#### CTA Link: "Here's how →"

| Property | Value |
|----------|-------|
| Font | `font-sans` (Inter) |
| Weight | `500` (Medium) |
| Size | `14px` desktop / `14px` mobile |
| Color | `#D4A854` (Honey) |
| Hover | Underline appears |
| No underline by default | ✓ |

---

## Brand Color Reference

| Color Name | Hex Code | Usage |
|------------|----------|-------|
| **Warm White** | `#FAF7F2` | Background |
| **Soft Charcoal** | `#2D2D2D` | Headlines, primary text |
| **Warm Gray** | `#8A8780` | Body text, secondary text |
| **Light Gray** | `#6B6966` | Tertiary text |
| **Honey** | `#D4A854` | CTAs, links, accents |
| **Decorative Line** | `#D4D0C8` | Dividers, subtle borders |

---

## Brand Context

This section should feel like an **editorial aside**—a subtle note for couples who are browsing, not a major announcement. Key brand principles to follow:

1. **Cool on the outside, emotional on the inside** — The italic headline is intimate, like a whispered question
2. **Direct, not blunt** — "Here's how →" is confident and clear
3. **Warm, with edge** — The copy is caring but not soft
4. **Visual restraint** — No images, no buttons, just text. The absence of decoration makes it feel intentional

The section should be **noticeably smaller** than other sections (TheProblem is ~400px, this is ~180px). It should feel like a pause, not a stop.

### The Margot Test

> "Would our 28-year-old New York woman, champagne in hand on a rooftop, say this?"

If she'd roll her eyes → rewrite.
If she'd say it with a knowing smile → ship it.

---

## Visual Reference: Page Flow

```
════════════════════════════════════════════════════════════════

                        [HERE'S HOW IT HAPPENS]
                         01        02        03
                        📱        📱        📱
                     You invite. They send. We make the book.

════════════════════════════════════════════════════════════════

                              ────────

                    Wait — is this your wedding?

              You can put this on your registry.
            Your people fund it. They fill it. You keep it.

                          Here's how →

════════════════════════════════════════════════════════════════

              Real recipes. Real people. Real books.
                 Every page has a name. Every name has a story.

                    [Carrusel de recetas]

════════════════════════════════════════════════════════════════
```

---

## Testing Checklist

After implementation, verify:

- [ ] Section appears between HowItWorks and BooksPrinted
- [ ] Divider line is centered and subtle
- [ ] Headline renders in italic serif
- [ ] Body text is in Warm Gray (`#8A8780`), not Charcoal
- [ ] Link is Honey colored (`#D4A854`), no underline until hover
- [ ] Click "Here's how →" navigates to `/add-to-registry`
- [ ] `/add-to-registry` page loads with all content
- [ ] Mobile responsive (text sizes adjust, line breaks work)
- [ ] Animation triggers on scroll into view
- [ ] No console errors
- [ ] Section height is noticeably smaller than other major sections

---

## Important Notes

- Do NOT add any images to the RegistryInterlude section
- Do NOT use a button component for the CTA — use a simple Link styled as text
- The `<br className="hidden sm:inline" />` in the body text creates the line break only on larger screens
- The Framer Motion animation should be subtle (16px y movement, 0.5s duration)
- If the `font-serif` class doesn't render Minion Pro, it will fall back to Georgia which is acceptable
- Ensure the section blends seamlessly with the sections above and below (same background color)