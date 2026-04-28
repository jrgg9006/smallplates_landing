# Task: Build Testimonials Section for Landing

## Context

We're adding a new section to the landing page on the current working branch
(`pivot/stripe-checkout-hosted`). It's a testimonials section featuring 5
real customer quotes from couples who received their wedding recipe book.

Three things make this section non-trivial:

1. **Mixed media.** Some testimonials have a photo, others don't. BOTH variants
   must look intentional — no awkward blank space or fallback placeholders.
2. **Editorial dark aesthetic.** Cards are charcoal/dark — a deliberate
   visual break from the warm-white default of the rest of the landing.
   This section should feel like a "moment" in the page rhythm.
3. **Stagger entrance animation.** Cards fade-and-rise in sequence when the
   section enters the viewport. Subtle, editorial — not flashy.

The aesthetic reference is the Momentous "Your Achievement Is Our Job"
section: vertical cards in a horizontal row with photos in B&W, editorial
header with discrete navigation, dark cards on light page.

---

## Phase 1 — Reconnaissance (READ-ONLY, do not modify anything yet)

Before writing any code, investigate and report back:

1. **Existing landing page structure.**
   - Where is the landing route? (`app/page.tsx` or similar)
   - List the current sections in order. I want to know what's there now
     so we can decide placement.
   - What's the section pattern? (Server component? Client? How is content
     sourced — hardcoded, MDX, content collection?)

2. **Design tokens currently defined.**
   - Open `app/globals.css` and list ALL `--brand-*` CSS variables and any
     other relevant design tokens (colors, spacing, typography).
   - Specifically check: do we have tokens for charcoal, charcoal-deep
     (darker than charcoal), warm-white, warm-white-accent, sand, cream,
     warm-gray-500/600, terracotta?
   - In `tailwind.config.ts`, list custom colors mapped to these tokens.

3. **Animation library availability.**
   - Is `framer-motion` already installed? Check `package.json`.
   - Is there an existing pattern for scroll-triggered or in-view
     animations elsewhere in the landing? If yes, show me one example file.

4. **Existing component patterns.**
   - Where do other landing sections live? (`components/landing/*` or
     similar)
   - Show me the structure of one existing landing section component as
     a reference for naming/style conventions.

5. **Image handling pattern.**
   - How are landing images served today? `next/image`? Public folder?
     Cloudinary?

**Stop here and report findings before proceeding.** Do not write any
component code yet. I want to make decisions about token strategy, file
placement, and animation library based on what you find.

---

## Phase 2 — Specification (will execute after recon report)

The following is the spec to implement AFTER recon is complete and we've
discussed any ambiguity from your report.

### Section structure

Component file: `components/landing/TestimonialsSection.tsx` (adjust path
to match the convention you find in recon).

Server component if possible. The animation requires `'use client'` for
the cards subcomponent — extract that into its own client component
(`TestimonialsCarousel.tsx`) to keep the section shell server-rendered.

### Data shape

```ts