# Claude Code Prompt — Small Plates Close Flow (Upsell + Shipping + Payment + Confirmation)

## Context
Small Plates & Co. is a Next.js 14 / TypeScript / Tailwind / Supabase app. We sell collaborative wedding recipe books. A user (organizer) collects recipes from guests and then "closes" the book to send it to print.

**This task:** Build the complete close-the-book flow that triggers after the user clicks the existing "Close the Book" button. This is a NEW multi-step flow inserted between the existing "Close" button and the existing confirmation/closed-book page.

---

## What already exists — DO NOT touch

- The existing close button and whatever triggers it (keep the trigger, just intercept it to start this new flow)
- The existing post-close confirmation page (the page that shows "THIS COOKBOOK HAS BEEN CLOSED", book title, recipes, copies, SHIPS TO address) — we will MODIFY this page but not rebuild it from scratch (see Step 4 below)
- All Stripe checkout infrastructure for the original purchase
- All Supabase schema for books, recipes, orders
- All auth flows
- All existing design system tokens (colors, fonts, spacing)

---

## Design System — use these exactly, do not deviate

```
Background:    #F5F3EF  (warm cream)
Charcoal:      #2D2D2D  (primary text, dark buttons)
Honey:         #D4A854  (accent, active states, CTAs secondary)
Honey bg:      #F5EDD8  (light honey for pills, banners)
Honey dark:    #7A5C10  (text on honey bg)
Muted text:    #8A8780
Mid text:      #5A5855
Border:        rgba(45,45,45,0.12)
White:         #FFFFFF

Font serif:    Minion Pro (or --font-serif CSS var) — headlines, emotional moments
Font sans:     Inter (or --font-sans CSS var) — all body, labels, buttons

Buttons:       pill shape (border-radius: 9999px), full width on mobile
               Dark: bg #2D2D2D, text #FAF7F2
               Ghost: no bg, no border, color muted, centered, text underline on hover

Inputs:        border-radius: 10px, border: 1px solid var(--border),
               padding: 13px 16px, font-size: 15px
               focus: border-color #D4A854

Step indicator (top of each screen, desktop):
  - Filled honey circle with white checkmark = completed step
  - Honey outline circle with honey number = current step
  - Gray outline circle with gray number = future step
  - Connected by 1px lines, honey-filled for completed segments
```

---

## Business Logic — Critical, read carefully

### Pricing
- Original book: $169 — already paid at time of original purchase, weeks ago
- Extra copies: $119 each — new charge, processed in this flow only if qty > 0
- Shipping on original book: $15 flat (already included in original $169+$15 order)
- Shipping on extra copies: **FREE** — they ship in the same box, no additional shipping charge ever
- Maximum extra copies: 5 (so max total books = 6)

### Payment logic
- If user selects 0 extra copies → NO new Stripe charge. Skip payment step entirely. Flow goes: Upsell → Shipping → Confirmation
- If user selects 1+ extra copies → New Stripe PaymentIntent for (qty × $119) only. Flow goes: Upsell → Shipping → Payment → Confirmation
- The payment for extras is a completely separate Stripe transaction from the original order. Do NOT modify the original PaymentIntent.
- The Stripe charge amount = qty × 119 (in cents: qty × 11900). No shipping added.

### Shipping address
- Always collect shipping address in this flow (both paths need it — even if 0 extras, we need to know where to send the original book if not already collected)
- Check: if the book record already has a shipping address, pre-fill the form
- All copies (original + extras) ship to the same single address — never ask for multiple addresses
- Store the address on the book record in Supabase

### Book state
- Only mark the book as `closed` in Supabase AFTER the entire flow completes successfully (after payment if extras, after shipping confirmation if no extras)
- During the flow, book is in a `pending_close` state — do not lock recipe collection until confirmed
- If user abandons mid-flow, book remains in current state, they can re-enter the flow

---

## The Flow — 3 new screens + 1 modified screen

### SCREEN A: Upsell (`/close/extras` or modal step)

**Layout:** Centered, max-width 560px, background #F5F3EF. Desktop-first, fully responsive to mobile.

**Top:** Step indicator showing current position in flow (e.g., step 1 of 3 or step 1 of 2 depending on path — simplify: just show step dots, not numbers in labels on this screen)

**Back button:** Top left, arrow ← , returns to review page (does NOT close the book)

**Content order (top to bottom):**

1. **Hint pills row** — centered, displayed BEFORE the headline:
   ```
   [ Her mom ]  [ His parents ]  [ The couple themselves ]  [ A second copy to gift ]
   ```
   Style: white bg, rgba(45,45,45,0.12) border, 20px border-radius, 6px 14px padding, 13px font, color #5A5855.
   These are decorative/suggestive — not interactive checkboxes, just visual anchors.

2. **Headline** (serif, 34px, font-weight 400, centered, color #2D2D2D):
   ```
   Before we print —
   who else gets one?
   ```

3. **Subheadline** (15px, muted, centered, line-height 1.6):
   ```
   This book is going to live in a kitchen for years.
   Some people should have their own.
   ```

4. **Price block** (centered):
   - Label: "EACH ADDITIONAL COPY" — 11px, uppercase, letter-spacing 0.08em, muted
   - Price: "$" small serif muted + "119" large serif 56px charcoal
   - Below price: "same book, same quality" + a small pill badge: "ships free" (honey-bg background, honey-dark text, 11px, 10px border-radius)

5. **Stepper** (centered):
   - Minus button: 50px circle, transparent bg, 1.5px rgba(45,45,45,0.12) border, charcoal color, 24px font. Disabled (opacity 0.25) when qty = 0
   - Quantity number: serif 40px, min-width 52px, centered
   - Plus button: 50px circle, honey bg (#D4A854), white color, no border. Max 5.
   - Below stepper: dynamic italic message in honey color (#D4A854), 14px:
     - 0: (empty / non-visible)
     - 1: "One extra. Her mom would want one."
     - 2: "Two extras. One for each family."
     - 3: "Three extras. Everyone that matters."
     - 4: "Four copies. Generous. They'll feel it."
     - 5: "Five extras. Every kitchen covered."

6. **Totals block** (only visible when qty > 0):
   Border-top, then rows:
   - "Original book" / "Already paid · $169" (muted, 13px)
   - "{N} extra copies" / "${N×119}"
   - "Shipping" / "Free — ships with your book" (green #14532D)
   - **Grand total row** (bold, 15px): "Due today" / "${N×119}"

7. **Primary CTA button** (dark pill, full width):
   - qty = 0: "Continue →"
   - qty > 0: "Add {N} {copy/copies} — ${N×119} →"
   - Advances to Screen B (Shipping)

8. **Ghost link** (only visible when qty > 0, below CTA):
   ```
   Continue without extra copies
   ```
   Neutral tone — no guilt framing. Also advances to Screen B.

9. **Caption** below ghost link (12px, muted, centered):
   - qty = 0: "$15 flat shipping to US, Mexico & Europe."
   - qty > 0: "All {N+1} copies ship to the same address. Shipping is free on extras."

---

### SCREEN B: Shipping Address (`/close/shipping`)

**Layout:** Same as Screen A — centered, 560px, cream bg.

**Back button:** Returns to Screen A (Upsell)

**Step indicator:** Progressed (step 1 done, step 2 active)

**Headline** (serif, 34px):
- If qty = 0: "Where should we send it?"
- If qty > 0: "Where should we send them?"

**Subheadline** (15px, muted):
```
We'll email you tracking details when it ships.
```

**Context bar** (white card, 10px border-radius, 0.5px border, padding 14px 18px, flex row):
- Left side:
  - If qty = 0: Bold "1 copy" + muted "Original book · $169 already paid · $15 shipping"
  - If qty > 0: Bold "{N+1} copies" + muted "Original + {N} extra · ${N×119} due · free shipping on extras"
- Right: 📦 emoji, opacity 0.5

**Form fields** (in order):
1. Recipient name — placeholder "Who should receive the book?"
2. Street address — placeholder "1234 Main Street"
3. Apt / Suite — optional label suffix, placeholder "Optional"
4. City / State / ZIP — row layout (City flex:1, State max-width 88px, ZIP max-width 100px)
5. Phone (optional) — placeholder "+1 (555) 123-4567"

Pre-fill any fields from existing book/user data if available.

**CTA button** (dark pill, full width):
```
Send it to print →
```

**Caption** (12px, muted, centered, margin-top 12px):
```
We'll email you tracking details when it ships.
```

**On submit:**
- Validate required fields (name, street, city, state, zip)
- Save address to Supabase book record
- If qty = 0 → mark book as `closed` in Supabase → navigate to Screen D (Confirmation)
- If qty > 0 → navigate to Screen C (Payment)

---

### SCREEN C: Payment (`/close/payment`) — **Only rendered when qty > 0**

**Layout:** Centered, max-width 500px, cream bg.

**Back button:** Returns to Screen B (Shipping)

**Step indicator:** Step 3 active (final step in path A)

**Headline** (serif, 30px):
```
One last thing.
```

**Subheadline** (14px, muted):
- qty = 1: "Payment for your extra copy."
- qty > 1: "Payment for your extra copies."

**Order recap card** (cream bg #F5F3EF, 10px border-radius, 0.5px border, padding 14px 18px):
- "{N} extra {copy/copies}" / "${N×119}"
- "Shipping on extras" / "Free" (color #14532D)
- Divider
- **"Total due today"** / **"${N×119}"** (font-weight 500)
- Italic note below divider (12px, muted):
  ```
  Your book ($169 + $15 shipping) was already paid.
  ```

**Stripe Embedded Checkout** — use the existing Stripe implementation pattern in the codebase. Create a new PaymentIntent server-side for amount = qty × 11900 cents. Do NOT reuse or modify the original order's PaymentIntent.

The Stripe payment form fields render below the recap card.

**After Stripe fields:**
- Primary CTA: "Purchase for ${N×119} →" (this is the Stripe submit button)
- Ghost link below: "← Back to shipping"
- Stripe badge row (centered, 12px):
  ```
  🔒 Secure checkout powered by [Stripe logo / text in #635BFF]
  ```

**On successful payment:**
- Mark book as `closed` in Supabase with copies count updated
- Store the new Stripe PaymentIntent ID on the book record
- Navigate to Screen D (Confirmation)

---

### SCREEN D: Confirmation — MODIFY EXISTING PAGE

This is the existing closed-book page. Keep its structure intact. Make only these two targeted changes:

**Change 1 — Replace the eyebrow text:**
- Current: `"THIS COOKBOOK HAS BEEN CLOSED"` in honey uppercase
- New: Keep same style (honey, uppercase, small, letter-spacing) but change text to:
  ```
  YOUR BOOK IS CLOSED.
  ```

**Change 2 — Add estimated timeline section below the SHIPS TO block:**

After the existing SHIPS TO address block, add a horizontal divider and then a new "What happens next" section:

```
WHAT HAPPENS NEXT
```
(Same label style as "SHIPS TO" — honey, uppercase, 11-12px, letter-spacing)

Then a vertical timeline of 3 steps, each with:
- A small circle icon: honey-filled checkmark for completed, gray arrow for upcoming
- Step title (14px, font-weight 500, charcoal)
- Step description (13px, muted)
- Estimated date in muted italic (calculate from today's date dynamically)

Steps:
1. ✓ **Book closed** — "Recipes locked and ready for design." — today's date
2. → **Design & layout** — "We'll lay out every recipe and send you a preview." — "Estimated: {today + 5 business days}"
3. → **Printing & shipping** — "Your book ships and arrives at your door." — "Estimated arrival: {today + 21 calendar days}"

Style the timeline as a white card with subtle border, matching the existing card style on the page. Each step is a row with left icon, right content. Last step has no bottom border.

**Do NOT change:**
- The book title display
- The "Closed [date]" subtitle
- PRINTED AS section
- RECIPES count
- COPIES count
- BOOK PHOTO section
- SHIPS TO address block
- The footer ("We'll email you updates..." / "Questions? team@...")
- The overall page layout, nav, or any other element

---

## Routing & Navigation

Create a new route group or use a multi-step state machine within the existing dashboard. Suggested approach: a single page `/dashboard/[bookId]/close` with internal step state (useReducer or Zustand slice), rendering the correct screen based on step.

Steps enum:
```typescript
type CloseStep = 'extras' | 'shipping' | 'payment' | 'done'
```

Step transitions:
```
extras → shipping (always)
shipping → payment (if qty > 0)
shipping → done (if qty === 0, after saving address + marking closed)
payment → done (after successful Stripe payment + marking closed)
```

The browser back button on each step should go to the previous step, NOT to the browser's history back. Use `router.push` with step param or internal state, not `router.back()`.

---

## Supabase Changes Required

Add or confirm these fields on the books table:

```sql
-- Run only if these columns don't already exist
ALTER TABLE books ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'open';
-- status values: 'open' | 'pending_close' | 'closed'

ALTER TABLE books ADD COLUMN IF NOT EXISTS extra_copies INTEGER DEFAULT 0;
ALTER TABLE books ADD COLUMN IF NOT EXISTS extra_copies_payment_intent_id TEXT;
ALTER TABLE books ADD COLUMN IF NOT EXISTS closed_at TIMESTAMPTZ;

-- shipping_address may already exist — confirm before adding
ALTER TABLE books ADD COLUMN IF NOT EXISTS shipping_address JSONB;
-- structure: { name, street, apt, city, state, zip, phone }
```

**IMPORTANT:** Before running any migration, show it to the user and wait for explicit confirmation. Do not execute Supabase SQL automatically.

---

## Stripe Server Action Required

Create a new server action (or API route) `createExtraCopiesPaymentIntent`:

```typescript
// Input
{ bookId: string, qty: number } // qty 1-5

// Logic
// 1. Verify book belongs to authenticated user
// 2. Verify book is in 'pending_close' state
// 3. Verify qty is between 1 and 5
// 4. amount = qty * 11900 (cents)
// 5. Create Stripe PaymentIntent with:
//    metadata: { bookId, type: 'extra_copies', qty }
//    description: `Small Plates — ${qty} extra ${qty===1?'copy':'copies'} for book ${bookId}`
// 6. Return { clientSecret }
```

---

## Component File Structure

```
app/
  dashboard/
    [bookId]/
      close/
        page.tsx          ← orchestrator, manages step state
        CloseLayout.tsx   ← shared wrapper (bg, step indicator, back button)
        StepExtras.tsx    ← Screen A
        StepShipping.tsx  ← Screen B
        StepPayment.tsx   ← Screen C
        useCloseFlow.ts   ← state machine hook (step, qty, address, setters)
  
  (existing)
  dashboard/
    [bookId]/
      closed/
        page.tsx          ← MODIFY ONLY: eyebrow text + add timeline section
```

---

## Style Notes for Claude Code

- Use Tailwind utility classes consistent with the existing codebase
- For serif font: use whatever CSS class or font variable is already used for serif headings in the existing dashboard (check existing closed page or onboarding for the pattern)
- Pill buttons already exist in the codebase — find and reuse the existing pattern rather than creating new ones
- The step indicator component may already exist from the original checkout flow — check before building new
- The hint pills on the upsell screen are display-only (no onClick needed)
- All screens must be fully responsive — on mobile: full width, same content order, same copy, buttons still full width

---

## Copy — Final, Do Not Change

### Screen A (Upsell)
- Hint pills: "Her mom" / "His parents" / "The couple themselves" / "A second copy to gift"
- Headline: "Before we print — / who else gets one?"
- Sub: "This book is going to live in a kitchen for years. / Some people should have their own."
- Price label: "EACH ADDITIONAL COPY"
- Price qualifier: "same book, same quality"
- Ships free badge: "ships free"
- Dynamic qty messages: [see list above]
- Shipping free line: "Free — ships with your book"
- Primary CTA (qty=0): "Continue →"
- Primary CTA (qty>0): "Add {N} {copy/copies} — ${N×119} →"
- Ghost skip: "Continue without extra copies"

### Screen B (Shipping)
- Headline (singular): "Where should we send it?"
- Headline (plural): "Where should we send them?"
- Sub: "We'll email you tracking details when it ships."
- CTA: "Send it to print →"

### Screen C (Payment)
- Headline: "One last thing."
- Sub (singular): "Payment for your extra copy."
- Sub (plural): "Payment for your extra copies."
- Recap note: "Your book ($169 + $15 shipping) was already paid."
- Stripe badge: "Secure checkout powered by Stripe"

### Screen D (Confirmation — changes only)
- Eyebrow: "YOUR BOOK IS CLOSED."
- Timeline section label: "WHAT HAPPENS NEXT"
- Step 1: "Book closed" / "Recipes locked and ready for design."
- Step 2: "Design & layout" / "We'll lay out every recipe and send you a preview."
- Step 3: "Printing & shipping" / "Your book ships and arrives at your door."

---

## What NOT to do

- Do not touch any existing recipe collection, dashboard, or guest invitation flows
- Do not modify the original Stripe checkout or PaymentIntent
- Do not add animations or transitions beyond simple opacity fades
- Do not add confetti, sounds, or modal overlays — screens are full pages
- Do not use the words: cherish, treasure, memories, special, unique, celebrate, journey, curated, perfect, amazing
- Do not show a loading spinner on the upsell screen — it should be instant
- Do not add social sharing buttons on the confirmation screen
- Do not ask for Supabase migrations to run automatically — always show the SQL and wait for user confirmation

---

## Before Starting

1. Read the existing `app/dashboard/[bookId]/close` or equivalent route to understand current close button behavior
2. Read the existing closed-book confirmation page to understand its current structure
3. Read the existing Stripe checkout implementation to understand the PaymentIntent creation pattern
4. Read the existing step indicator component if one exists
5. Show a brief plan (files to create, files to modify, SQL to run) and wait for confirmation before writing any code