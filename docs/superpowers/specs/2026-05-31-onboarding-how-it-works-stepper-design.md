# How It Works — Onboarding Stepper

**Date:** 2026-05-31
**Page:** `/onboarding/welcome`
**Status:** Approved design, ready for implementation plan

## Goal

Replace the empty right panel of the welcome ("How it works") page with an editorial,
illustrated 4-step explainer — inspired by Storyworth's stepper but deliberately
**not** a copy. No connecting "path", no step numbers, no per-step titles. Just an
illustration + one short paragraph per step, alternating sides.

Brand fit: editorial and restrained ("cool on the outside"), the drawings carry the
personality. Avoids the generic dashed-path / SaaS-list look.

## Visual design (locked)

- 4 steps stacked vertically.
- Each step = **SVG illustration + one short paragraph**, as a tight pair (`gap: 16px`).
- The pair **alternates side** per step: odd steps illustration-left / text-right,
  even steps illustration-right / text-left (text right-aligned on those).
- **No** step numbers, **no** titles/subtitles, **no** dividing lines, **no** connecting path.
- Illustration ~84px square. Paragraph in serif (`font-serif`), ~14.5px, charcoal.
- Vertical gap between steps ~26px. Background: warm white (page bg, no card).
- Static (no entrance animation) for now. Optional subtle fade-in can be added later.

## Layout & responsive behavior

Reuse the existing `OnboardingShell` on the welcome page. **Do not modify the shell**
(it is shared by every onboarding step).

- **Desktop (`lg+`):** left column = "How it works" + intro paragraph + Continue
  (already there). Right panel (`rightContent`) = the stepper.
- **Mobile / tablet (`< lg`):** the shell's right panel is `hidden lg:block`, so it does
  not render below `lg`. To keep mobile correct, the stepper is also rendered inside the
  left-column `children` with `lg:hidden`, appearing between the intro and the Continue
  button, full width.

Net: title → intro → stepper → Continue on mobile; two columns on desktop. Mobile is a
first-class requirement, not an afterthought.

## Component

New reusable component: `components/onboarding/HowItWorksStepper.tsx`.

- Renders the 4-step list from a local data array (each item: `{ image, alt, text }`).
- Accepts an optional `className` so the same component can be mounted twice:
  - as `rightContent={<HowItWorksStepper />}` (desktop), and
  - as `<HowItWorksStepper className="lg:hidden mt-8" />` inside `children` (mobile).
- Self-contained, under 300 lines, no new dependencies.
- Uses `next/image` for the SVGs.

## Content

Step copy (brand voice, no forbidden words — adjustable):

1. Set up your project and invite your people.
2. We make an image for every recipe and give the book its style.
3. Review everything and place your order.
4. Your hardcover cookbook arrives at your door.

Also: **remove the second intro line** on the left ("You share a link. They send a
recipe. We design, print, and ship the book.") — the stepper now covers it, so it would
duplicate.

## Assets

Four SVGs in `public/images/onboarding/`:

- `drawing_champaign_glasses.svg` — already exists.
- `drawing_step_2.svg`, `drawing_step_3.svg`, `drawing_step_4.svg` — to be provided by Ricardo.

Until the real SVGs land, missing illustrations render as a dashed placeholder box so the
structure is testable. Swapping in final art = dropping files into that folder; no code
change beyond the filename mapping.

## Out of scope

- Entrance/scroll animations.
- Changes to other onboarding steps or to `OnboardingShell`.
- Final illustration artwork (provided separately).

## Open items

- Final SVG art for steps 2–4 (Ricardo).
- Final wording per step (current copy is a working draft).
