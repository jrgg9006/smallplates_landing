name: "SmallPlates Landing Page - Next.js 14 App Router Implementation"
description: |

## Purpose
Build a conversion-focused landing page for SmallPlates & Company using Next.js 14 (App Router), React, and Tailwind CSS. The page showcases a cookbook creation service with clean design, strong accessibility, and optimal performance.

## Core Principles
1. **Context is King**: Use existing examples and documentation
2. **Validation Loops**: Build, accessibility, and performance checks
3. **Information Dense**: Follow patterns from examples and docs
4. **Progressive Success**: Initialize → Build → Validate → Optimize
5. **Global rules**: Follow all rules in CLAUDE.md

---

## Goal
Create a production-ready landing page that converts visitors into customers by clearly communicating the SmallPlates value proposition: creating keepsake cookbooks from loved ones' recipes.

## Why
- **Business value**: Primary conversion point for SmallPlates customers
- **Integration**: Foundation for future product pages and flows
- **Problems solved**: Provides clear understanding of product, builds emotional connection, drives sign-ups

## What
A single-page Next.js application with:
- Clean white banner with centered logo
- Hero section with heading, subheading, CTA, and background image
- Product showcase with book mockup and benefits
- Recipe Collector Tool explainer with 3-step flow
- Mobile-first responsive design (375px → 1440px)
- SEO optimization with metadata
- WCAG 2.1 Level AA accessibility compliance
- Core Web Vitals optimization (LCP ≤ 2.5s, CLS minimal)

### Success Criteria
- [ ] All components render correctly across breakpoints (375px, 768px, 1440px)
- [ ] Build completes without errors (`npm run build`)
- [ ] TypeScript type checking passes
- [ ] Accessibility audit passes (headings, alt text, focus, contrast)
- [ ] Core Web Vitals targets met (LCP ≤ 2.5s, CLS < 0.1)
- [ ] All copy matches spec exactly
- [ ] SEO metadata properly configured

## All Needed Context

### Documentation & References
```yaml
# MUST READ - Include these in your context window
- url: https://nextjs.org/docs/app
  why: App Router patterns, file-based routing, layout system
  critical: Use app/ directory, not pages/

- url: https://nextjs.org/docs/app/api-reference/functions/generate-metadata
  why: Metadata API for SEO (replaces <head> tags)
  critical: Use export const metadata, not <head> in layout

- url: https://nextjs.org/docs/app/api-reference/components/image
  why: next/image optimization, preventing CLS
  critical: Always specify width/height or fill with container aspect ratio

- url: https://tailwindcss.com/docs/installation/using-postcss
  why: Tailwind setup with Next.js

- url: https://www.w3.org/WAI/standards-guidelines/wcag/
  why: Accessibility compliance (Level AA target)
  critical: Color contrast ≥4.5:1, keyboard nav, semantic HTML

- file: examples/hero.tsx
  why: Hero section pattern with responsive grid and image
  critical: Use aspect-ratio, aria-labelledby, data-cta attributes

- file: examples/section-header.tsx
  why: Banner/header pattern with centered logo
  critical: role="banner", proper ARIA labels

- file: examples/cta-button.tsx
  why: Accessible button with focus ring
  critical: focus-visible:ring-2 pattern, data-cta tracking

- file: examples/product-showcase.tsx
  why: Two-column layout with image and benefits

- file: examples/collector-tool.tsx
  why: Three-card grid pattern with icon slots

- file: examples/layout.tsx
  why: Layout structure (needs conversion to Next.js Metadata API)
  critical: Shows required metadata, but must use Next.js 14 pattern

- file: docs/landing/landing.md
  why: Landing page best practices and UX principles

- file: docs/landing/seo.md
  why: SEO requirements and metadata specifications

- file: INITIAL.md
  why: Complete feature specification and copy
  critical: Use exact copy strings from lines 13-18
```

### Current Codebase Tree
```bash
.
├── INITIAL.md              # Feature specification
├── CLAUDE.md               # Development rules
├── examples/               # Component examples (reference only)
│   ├── section-header.tsx
│   ├── hero.tsx
│   ├── cta-button.tsx
│   ├── product-showcase.tsx
│   ├── collector-tool.tsx
│   └── layout.tsx
├── docs/landing/           # Best practices docs
│   ├── landing.md
│   └── seo.md
├── PRPs/
└── use-cases/              # Unrelated projects
```

### Desired Codebase Tree (Post-Implementation)
```bash
.
├── app/
│   ├── layout.tsx          # Root layout with Metadata API
│   ├── page.tsx            # Main landing page
│   ├── favicon.ico         # Site favicon
│   ├── robots.txt          # SEO robots file
│   └── sitemap.xml         # SEO sitemap
├── components/
│   ├── Banner.tsx          # Top logo banner
│   ├── Hero.tsx            # Hero section
│   ├── ProductShowcase.tsx # Product section
│   ├── CollectorTool.tsx   # Collector explainer
│   └── CTAButton.tsx       # Reusable CTA button
├── public/
│   └── images/
│       ├── logo.svg        # Company logo
│       ├── hero-bg.jpg     # Hero background (placeholder OK)
│       └── book-mockup.jpg # Product mockup (placeholder OK)
├── .env.example            # Environment template
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.js
├── next.config.js
└── README.md               # Setup and usage docs
```

### Known Gotchas & Library Quirks
```typescript
// CRITICAL: Next.js 14 App Router uses Metadata API, NOT <head> tags
// ❌ WRONG (examples/layout.tsx pattern):
export default function Layout({ children }) {
  return <html><head><title>...</title></head>...</html>
}

// ✅ CORRECT (Next.js 14 pattern):
import type { Metadata } from 'next'
export const metadata: Metadata = {
  title: 'Small Plates & Company',
  description: '...'
}

// CRITICAL: next/image requires dimensions to prevent CLS
// ❌ WRONG:
<img src="/images/hero-bg.jpg" />

// ✅ CORRECT:
import Image from 'next/image'
<Image src="/images/hero-bg.jpg" width={1200} height={800} alt="..." />

// OR with fill + container aspect ratio:
<div className="relative aspect-[4/3]">
  <Image src="..." fill className="object-cover" alt="..." />
</div>

// CRITICAL: Tailwind custom values must be in config
// Need to ensure max-w-7xl is available (it is by default)

// CRITICAL: TypeScript strict mode catches prop type issues
// Always define prop interfaces for components

// CRITICAL: WCAG requires minimum 4.5:1 contrast ratio
// Test with browser DevTools accessibility checker

// CRITICAL: Copy must match INITIAL.md exactly (lines 13-18)
const COPY = {
  heroH1: "The people behind every recipe.",
  subhero: "A cookbook experience made with your loved ones' recipes.",
  cta: "Let's do it",
  benefits: ["High quality", "Hardcover", "Premium print", "Keepsake"],
  steps: [
    "Share a link to invite contributors",
    "Guests add their favorite recipes in minutes",
    "You approve and we format them beautifully"
  ]
}
```

## Implementation Blueprint

### Data Models and Structure
```typescript
// No complex data models needed for static landing page
// Component prop types:

interface CTAButtonProps {
  label?: string;
  "data-cta"?: string;
  className?: string;
  onClick?: () => void;
}

interface CollectorStep {
  title: string;
  text: string;
}

// Metadata structure (Next.js 14):
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Small Plates & Company — The People Behind Every Recipe',
  description: 'A cookbook experience made with your loved ones\' recipes — high-quality hardcover books that bring memories to life.',
  openGraph: {
    title: 'Small Plates & Company',
    description: 'A cookbook experience made with your loved ones\' recipes.',
    type: 'website',
    url: 'https://smallplates.co/',
    images: ['/images/og-cover.jpg']
  }
}
```

### Task List (In Order)

```yaml
Task 1: Initialize Next.js Project
COMMAND: npx create-next-app@latest . --typescript --tailwind --app --no-src-dir --import-alias "@/*"
  - Accept prompts: TypeScript (Yes), ESLint (Yes), Tailwind (Yes), App Router (Yes)
  - VERIFY: package.json created with next@14+, tailwindcss, typescript
  - VERIFY: app/ directory exists, not pages/

Task 2: Configure Tailwind CSS
MODIFY tailwind.config.ts:
  - KEEP default configuration (max-w-7xl already available)
  - ADD custom font family if needed (or use system fonts)
  - VERIFY: content paths include './app/**/*.{js,ts,jsx,tsx}'

Task 3: Create Project Structure
CREATE directories:
  - components/
  - public/images/

ADD placeholder images:
  - public/images/logo.svg (use simple SVG placeholder)
  - public/images/hero-bg.jpg (use placeholder service or gradient)
  - public/images/book-mockup.jpg (use placeholder)

Task 4: Migrate Banner Component
CREATE components/Banner.tsx:
  - COPY pattern from examples/section-header.tsx
  - MODIFY to use proper imports (import * as React is optional in Next.js)
  - KEEP accessibility attributes (role="banner", aria-label)
  - UPDATE image path to use next/image if needed

Task 5: Migrate CTA Button Component
CREATE components/CTAButton.tsx:
  - COPY from examples/cta-button.tsx
  - ADD proper TypeScript interface
  - KEEP accessibility (aria-label, focus-visible ring)
  - KEEP data-cta attribute for analytics

Task 6: Migrate Hero Component
CREATE components/Hero.tsx:
  - COPY structure from examples/hero.tsx
  - REPLACE background image with next/Image or keep background-image style
  - ENSURE responsive grid (grid-cols-1 md:grid-cols-2)
  - KEEP aria-labelledby pattern
  - USE exact copy from INITIAL.md

Task 7: Migrate Product Showcase Component
CREATE components/ProductShowcase.tsx:
  - COPY from examples/product-showcase.tsx
  - CONVERT img to next/Image with proper dimensions
  - KEEP semantic HTML (figure, ul)
  - USE benefits list from INITIAL.md

Task 8: Migrate Collector Tool Component
CREATE components/CollectorTool.tsx:
  - COPY from examples/collector-tool.tsx
  - USE steps copy from INITIAL.md
  - KEEP three-card grid pattern
  - MAINTAIN icon slot divs (can be enhanced later)

Task 9: Create Root Layout with Metadata API
CREATE app/layout.tsx:
  - PATTERN: Use Next.js 14 Metadata API (NOT <head> tags like examples/layout.tsx)
  - EXPORT metadata object with title, description, openGraph
  - ADD html lang="en", body with antialiased class
  - REFERENCE docs/landing/seo.md for exact metadata values

EXAMPLE:
```typescript
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Small Plates & Company — The People Behind Every Recipe',
  description: 'A cookbook experience made with your loved ones\' recipes — high-quality hardcover books that bring memories to life.',
  openGraph: {
    title: 'Small Plates & Company',
    description: 'A cookbook experience made with your loved ones\' recipes.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased bg-white text-gray-900">
        {children}
      </body>
    </html>
  )
}
```

Task 10: Create Main Page
CREATE app/page.tsx:
  - IMPORT all components (Banner, Hero, ProductShowcase, CollectorTool)
  - ASSEMBLE in correct order per INITIAL.md
  - WRAP in semantic <main> tag
  - ADD second CTA at bottom (per docs/landing/landing.md)

EXAMPLE:
```typescript
import Banner from '@/components/Banner'
import Hero from '@/components/Hero'
import ProductShowcase from '@/components/ProductShowcase'
import CollectorTool from '@/components/CollectorTool'
import CTAButton from '@/components/CTAButton'

export default function Home() {
  return (
    <>
      <Banner />
      <main className="min-h-screen">
        <Hero />
        <ProductShowcase />
        <CollectorTool />

        {/* Repeat CTA at bottom per best practices */}
        <section className="bg-white">
          <div className="mx-auto max-w-7xl px-6 md:px-8 py-12 text-center">
            <CTAButton data-cta="footer-primary" />
          </div>
        </section>
      </main>
    </>
  )
}
```

Task 11: Add SEO Files
CREATE app/robots.txt:
```
User-agent: *
Allow: /
Sitemap: https://smallplates.co/sitemap.xml
```

CREATE app/sitemap.xml:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://smallplates.co/</loc>
    <lastmod>2024-01-01</lastmod>
    <priority>1.0</priority>
  </url>
</urlset>
```

Task 12: Create Environment Template
CREATE .env.example:
```
# Next.js
NEXT_PUBLIC_SITE_URL=https://smallplates.co

# Optional Analytics
# NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

Task 13: Update README
UPDATE README.md:
  - ADD project description
  - ADD setup instructions (npm install, npm run dev)
  - ADD build instructions (npm run build, npm start)
  - ADD environment variables info
  - REFERENCE docs/landing/ for best practices
```

### Integration Points
```yaml
TAILWIND CONFIG:
  - Default configuration sufficient
  - Ensure app/**/*.{ts,tsx} in content paths
  - System fonts acceptable for v1

NEXT.JS CONFIG:
  - Default config sufficient
  - Add image domains if using external images later

TYPESCRIPT:
  - Strict mode recommended
  - Define interfaces for all component props

IMAGES:
  - Use placeholders for v1 (hero-bg.jpg, book-mockup.jpg, logo.svg)
  - Can use https://placehold.co/ or create simple gradients
  - Production images added later

ENVIRONMENT:
  - NEXT_PUBLIC_SITE_URL for canonical URLs
  - Optional analytics IDs for v1.1
```

## Validation Loop

### Level 1: Build & Type Checking
```bash
# Install dependencies
npm install

# Type check
npx tsc --noEmit
# Expected: No errors

# Build project
npm run build
# Expected:
# ✓ Compiled successfully
# ✓ Generating static pages
# ✓ Finalizing page optimization

# If build fails:
# - Check imports/exports
# - Verify component prop types
# - Check Tailwind class names
```

### Level 2: Development Server Test
```bash
# Start dev server
npm run dev

# Open http://localhost:3000
# VERIFY:
# - Banner renders with logo
# - Hero section displays with correct copy
# - Product showcase shows mockup and benefits
# - Collector tool shows 3 steps
# - Bottom CTA button appears
# - No console errors

# Test responsive breakpoints in DevTools:
# - 375px (mobile)
# - 768px (tablet)
# - 1440px (desktop)

# Expected: Layout adapts correctly at each breakpoint
```

### Level 3: Accessibility Audit
```bash
# Manual checklist (use browser DevTools Accessibility panel):

- [ ] All images have alt text or aria-hidden="true"
- [ ] Heading hierarchy is correct (h1 → h2 → h3, no skips)
- [ ] All interactive elements have visible focus indicators
- [ ] Color contrast meets 4.5:1 minimum
- [ ] All buttons have accessible labels
- [ ] Semantic HTML used (header, main, section, figure)
- [ ] ARIA labels present where needed (aria-labelledby)
- [ ] Keyboard navigation works (Tab through all interactive elements)

# Check with:
# 1. Browser DevTools > Lighthouse > Accessibility (score ≥95)
# 2. Browser DevTools > Elements > Accessibility tree
# 3. Manual keyboard navigation test
```

### Level 4: Performance Validation
```bash
# Run Lighthouse audit (DevTools > Lighthouse)
# Test in incognito mode, throttle to "Slow 4G"

TARGET METRICS:
- LCP (Largest Contentful Paint): ≤ 2.5s
- CLS (Cumulative Layout Shift): < 0.1
- FID (First Input Delay): < 100ms
- Performance score: ≥ 90

# Common issues to fix:
# - Images without dimensions → Add width/height to next/Image
# - Missing priority on hero image → Add priority prop
# - Blocking resources → Ensure proper Next.js optimization

# If metrics fail:
# 1. Check next/image implementation
# 2. Verify aspect ratios defined
# 3. Add priority to above-fold images
# 4. Check for layout shifts in DevTools
```

### Level 5: Copy Verification
```bash
# Manually verify all copy matches INITIAL.md exactly:

CHECKLIST:
- [ ] Hero H1: "The people behind every recipe."
- [ ] Subhero: "A cookbook experience made with your loved ones' recipes."
- [ ] Primary CTA: "Let's do it"
- [ ] Product benefits: "High quality", "Hardcover", "Premium print", "Keepsake"
- [ ] Collector step 1: "Share a link to invite contributors"
- [ ] Collector step 2: "Guests add their favorite recipes in minutes"
- [ ] Collector step 3: "You approve and we format them beautifully"
```

## Final Validation Checklist
- [ ] Build completes: `npm run build` (no errors)
- [ ] Type check passes: `npx tsc --noEmit`
- [ ] Responsive at 375px, 768px, 1440px
- [ ] All copy matches INITIAL.md specification
- [ ] Accessibility score ≥95 (Lighthouse)
- [ ] Performance score ≥90 (Lighthouse)
- [ ] LCP ≤ 2.5s, CLS < 0.1
- [ ] All images have alt text
- [ ] Focus indicators visible on all interactive elements
- [ ] Metadata includes title, description, OpenGraph
- [ ] robots.txt and sitemap.xml present
- [ ] README.md updated with setup instructions

---

## Anti-Patterns to Avoid
- ❌ Don't use <head> tags in layout - use Metadata API
- ❌ Don't use <img> - use next/image for optimization
- ❌ Don't skip image dimensions - causes CLS
- ❌ Don't deviate from copy in INITIAL.md
- ❌ Don't forget ARIA labels and semantic HTML
- ❌ Don't ignore keyboard focus styling
- ❌ Don't use pages/ directory - use app/ (App Router)
- ❌ Don't hardcode URLs - use environment variables
- ❌ Don't skip responsive testing at all breakpoints
- ❌ Don't commit .env files - use .env.example

## Confidence Score: 8.5/10

High confidence due to:
- ✅ Complete component examples provided in /examples/
- ✅ Clear documentation in /docs/landing/
- ✅ Detailed specification in INITIAL.md
- ✅ Standard Next.js + Tailwind stack (well-documented)
- ✅ Clear validation gates and acceptance criteria
- ✅ No complex backend or API integration required

Minor uncertainties:
- ⚠️ Need to ensure proper Next.js 14 Metadata API usage (different from example pattern)
- ⚠️ Image optimization details (dimensions, aspect ratios)
- ⚠️ First-time Next.js project initialization edge cases

The comprehensive context, clear examples, and validation gates provide strong foundation for one-pass implementation success.
