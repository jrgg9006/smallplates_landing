# Pricing Page — Implementation Guide

## Files to create

### 1. Component
Copy `pricingpageimplementation.tsx` to:
```
app/components/pricing/PricingPage.tsx
```
(or wherever you keep your components)

### 2. Route
Copy `pricing-page-route.tsx` to:
```
app/pricing/page.tsx
```

## Add link to Footer

In your Footer component, add a link to `/pricing` under the PRODUCT section:

```tsx
// In your Footer component, PRODUCT section:
<a href="/pricing" className="...">Pricing</a>
```

Based on your current footer structure:
```
PRODUCT
- How It Works
- Get Started
- Book Specifications
- Pricing  ← ADD THIS
```

## Dependencies

The component uses:
- `framer-motion` (you already have this based on EmotionalClose.tsx)
- `next/navigation` (standard Next.js)
- Tailwind CSS (already configured)

No new dependencies needed.

## Routes referenced

The component links to:
- `/onboarding` — "Start the book" buttons
- `/contact` — "Let's figure it out" link

Make sure these routes exist or adjust as needed.

## Colors used (all from your existing palette)

| Variable | Hex | Usage |
|----------|-----|-------|
| Background | `#FAF9F7` | Page background |
| White | `#FFFFFF` | Card backgrounds |
| Charcoal | `#2D2D2D` | Primary text |
| Warm Gray | `#8A8780` | Secondary text |
| Light Gray | `#6B6966` | Fine print text |
| Honey | `#D4A854` | CTAs, popular border, accents |
| Honey Hover | `#C49A4A` | Button hover state |
| Honey Light | `#FBF6EC` | Popular tag background |
| Border | `#F0EDE8` | Card borders, dividers |
| Sand | `#F5F3EF` | Fine print section background |

## Mobile behavior

- Cards stack vertically on mobile
- All cards have equal treatment (no reordering)
- Tier 2's "Most popular" tag stays centered

## Optional enhancements

### 1. Add header/nav
The component is just the main content. Add your standard header:

```tsx
import Header from "@/components/Header";
import PricingPage from "@/components/pricing/PricingPage";

export default function Pricing() {
  return (
    <>
      <Header />
      <PricingPage />
    </>
  );
}
```

### 2. Add footer
Same pattern — add your Footer component after PricingPage.

### 3. Scroll animations
Currently uses simple fade-in on load. For scroll-triggered animations, 
you can add `whileInView` to the motion components.

## Testing checklist

- [ ] Page loads at `/pricing`
- [ ] All three tiers display correctly
- [ ] "Most popular" tag shows on Family Collection
- [ ] Hover states work on cards and buttons
- [ ] "Start the book" buttons navigate to `/onboarding`
- [ ] "Let's figure it out" navigates to `/contact`
- [ ] Responsive: looks good on mobile, tablet, desktop
- [ ] Footer link works from main landing page

## Copy verification

Make sure these match your current offering:

| Tier | Contents | Price |
|------|----------|-------|
| The Book | 1 Premium (8×10) | $149 |
| The Family Collection | 1 Premium + 2 Classic (6×9) | $279 |
| The Kitchen Table | 1 Premium + 5 Classic (6×9) | $449 |

If any pricing or contents change, update the `tiers` array in PricingPage.tsx.