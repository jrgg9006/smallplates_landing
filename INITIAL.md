## FEATURE:

- Simple, conversion-focused landing page inspired by Zola’s IA and header style.
- Top banner (full-width, white background) with centered logo.
- Hero section with: Heading “The people behind every recipe.” Subheading “A cookbook experience made with your loved ones’ recipes.” Left copy & CTA, right-side background image slot (responsive).
- Primary CTA button: “Let’s do it”.
- Product showcase section: large book mockup/image + short benefits (High quality, Hardcover, Premium print, Keepsake).
- “Recipe Collector Tool” explainer section: 3 short bullets on guest submissions via simple link/form + visual placeholder for flow (Invite → Collect → Approve).
- Clean, white, airy visual system; strong type hierarchy; mobile-first responsive layout.
- Tech (recommended): Next.js (App Router) + React + Tailwind CSS. Optional: shadcn/ui for components, Lucide icons.
- Include SEO basics (title, meta description, open graph), a11y passes (labels, color contrast), and Web-Vitals-friendly build.

Copy to use in v1
- Hero H1: “The people behind every recipe.”
- Subhero: “A cookbook experience made with your loved ones’ recipes.”
- Primary CTA: “Let’s do it”
- Product benefits: “High quality”, “Hardcover”, “Premium print”, “Keepsake”
- Collector steps: “Share a link to invite contributors” → “Guests add their favorite recipes in minutes” → “You approve and we format them beautifully”

## EXAMPLES:

(Place sample components in /examples/ as implementation references—do not ship them to production.)

- examples/section-header.tsx — white banner with centered logo, ARIA label sample.
- examples/hero.tsx — two-column hero with left copy/CTA and right responsive image container (object-cover).
- examples/product-showcase.tsx — centered book mockup, short benefit lines, semantic headings.
- examples/collector-tool.tsx — three small cards showing Invite → Collect → Approve flow with icon slots.
- examples/layout.tsx — minimal Next.js RootLayout with base SEO tags and container spacing.
- examples/cta-button.tsx — accessible CTA with clear focus ring and data-cta attribute.

Reference site for structure only (no copying): https://www.zola.com/

## DOCUMENTATION:

- Next.js (App Router): https://nextjs.org/docs

- Tailwind CSS: https://tailwindcss.com/docs

- WCAG a11y quick wins: https://www.w3.org/WAI/standards-guidelines/wcag/

Internal mini-guides to add under /docs/
- landing.md — concise landing best practices (headline clarity, single primary CTA per fold, scannable content, mobile-first).
- seo.md — title ≤ 60 chars, meta description 140–160 chars, OG/Twitter tags, descriptive alt text, canonical link.

## OTHER CONSIDERATIONS:

Project structure
- Keep it small and obvious:

/app
  /layout.tsx
  /page.tsx
  /favicon.ico
  /robots.txt
  /sitemap.xml
/components
  Banner.tsx
  Hero.tsx
  ProductShowcase.tsx
  CollectorTool.tsx
  CTAButton.tsx
/public/images
  logo.svg
  hero-bg.jpg
  book-mockup.jpg
/docs
  landing.md
  seo.md
/examples
.env.example
README.md

Design & typography
- White background, generous negative space, max-w-7xl container, consistent paddings (px-6 md:px-8).
- Start with system font or one web font (e.g., Inter) to keep performance tight.
- Strict heading hierarchy (h1 → h2 → h3); 1–2 weights max.

Accessibility
- All images need meaningful alt or be explicitly decorative (aria-hidden="true").
- Visible keyboard focus for all interactive elements; adequate color contrast (≥ 4.5:1).

Performance
- Use next/image with explicit sizes and reasonable priority only for the hero image.
- Avoid layout shift: define aspect ratios for hero and mockup containers.
- Defer any non-critical scripts; keep v1 analytics optional.

Copy/CTA discipline
- One primary CTA (“Let’s do it”) in the hero and repeat it near page end; avoid competing actions.

Analytics hooks (optional v1.1)
- Add data-cta="hero-primary" (and similar) to buttons for event mapping.

Common gotchas to avoid
- Missing alt text; duplicate IDs; inconsistent container widths across breakpoints.
- Oversized images without constraints causing CLS.
- External links without rel="noopener noreferrer".
- Forgetting base SEO metadata in layout.tsx.

Acceptance criteria for v1
- Builds locally and renders correctly on 375px, 768px, and 1440px.
- LCP ≤ 2.5s in local/light test; negligible CLS.
- A11y basics pass (headings, alt text, focus).
- All copy strings match exactly as listed above.
- Visuals remain clean, white, and simple, aligned with Zola-style clarity (without copying design).