# Occasion-aware book generator (InDesign v17)

**Date:** 2026-06-14
**Status:** Approved design → implementation
**Branch context:** `feature/cover-editor-wysiwyg`

## Problem

The printed book is designed wedding-first. Small Plates now serves any occasion
(weddings, bridal showers, anniversaries, birthdays, graduations, other). Two
template pages still assume a couple and a wedding:

- **Page 3 (title page):** expects `couple_first_name & partner_first_name` with a
  golden ampersand. Non-couple occasions have a single name (or a book title), so
  the two-name layout and ampersand are wrong.
- **Page 11 (letter):** the body copy is entirely about "the wedding". It does not
  make sense for a birthday, graduation, etc.

**Recipes and every other page stay exactly as they are.** Out of scope.

## Goal

A new `generate-book_v17.jsx` that adapts **only** those two pages based on data,
leaving weddings/bridal showers byte-for-byte identical to v16.

## Decisions (locked)

1. **Page 11 message granularity:** two buckets only. Wedding/bridal (and legacy
   no-occasion) keep the current letter; **everything else shares one neutral
   message** that never names the occasion.
2. **Page 3 driver:** presence of `partner_first_name`, NOT occasion. If a partner
   name exists → two names + golden ampersand (covers weddings, bridal showers,
   anniversaries, and any future couple occasion). If not → single name / book
   title, no ampersand.
3. **Page 11 driver:** occasion bucket, mirroring the convention already used across
   the codebase (`lib/email/invitation-templates.ts`, `BookReviewFlow.tsx`):
   `isWedding = !occasion || occasion === 'wedding' || occasion === 'bridal_shower'`.
4. **Logic location:** in the `.jsx` (Option A). The only `fetch-book.js` change is
   exposing `occasion` in the JSON.
5. **Page 11 styling:** two pre-styled letter frames live on page 11 of the template
   (`{{INTRO_WEDDING}}` and `{{INTRO_GENERIC}}`), each fully hand-styled in InDesign
   (including the bold closing line). The script **deletes the frame that does not
   apply** rather than rewriting text — this preserves all paragraph/character
   styling. The neutral copy therefore lives in the template, not in the `.jsx`.

## Architecture / data flow

```
groups.occasion ──▶ fetch-book.js ──▶ book.<names>.json (couple.occasion)
                                            │
                          generate-book_v17.jsx reads occasion + partner_first_name
                                            │
                    ┌───────────────────────┴───────────────────────┐
              page 3 {{TITLE_NAME}}                         page 11 {{INTRO_MESSAGE}}
        partner? two names+& : single name        isWedding? wedding letter : neutral letter
```

The page-3 name is already resolved: `couple.couple_display_name` =
`print_couple_name || couple_display_name || "first & partner"`, so the book title
set in the cover editor is already available — no new field needed.

## Changes

### 1. `scripts/indesign/fetch-book.js` (minimal)
- Add `occasion` to the group `.select(...)`.
- Add `occasion: group.occasion || null` to the `couple` block of the output JSON.

### 2. InDesign master template (manual, done by Ricardo)
- Page 3: add script label `{{TITLE_NAME}}` to the title text frame.
- Page 11: keep the current letter frame, label it `{{INTRO_WEDDING}}`. Duplicate it
  in place, replace its text with the neutral copy (section 4), re-apply the same
  paragraph styling (bold closing line), and label the duplicate `{{INTRO_GENERIC}}`.
  The two frames overlap; only one survives generation.
- Without these labels v17 leaves the page(s) as-is (no crash), matching the existing
  `{{QR_REPURCHASE}}` "skip if not found" pattern.

### 3. `scripts/indesign/generate-book_v17.jsx` (new, copy of v16 + logic)
- Header/version bumped to v1.15.0 / v17 with a changelog entry.
- New `CONFIG` entries: `titleNameLabel: "{{TITLE_NAME}}"`,
  `introWeddingLabel: "{{INTRO_WEDDING}}"`, `introGenericLabel: "{{INTRO_GENERIC}}"`.
- Two new functions, called from `main()` right after `personalizeFixedPages`:
  - **`applyTitleName(doc, bookData)` (page 3):** if `partner_first_name` is
    empty/whitespace, set the `{{TITLE_NAME}}` frame contents to
    `couple_display_name` (clears the styled ampersand naturally). If a partner
    exists, do nothing (v16 placeholder replacement already handles it).
  - **`applyIntroMessage(doc, bookData)` (page 11):** compute `isWedding`; delete the
    frame that does not apply (`{{INTRO_GENERIC}}` for weddings, `{{INTRO_WEDDING}}`
    otherwise). For weddings this leaves the wedding letter untouched, so output is
    identical to v16.
- All other steps (recipes, fillers, contributors, QR, couple image, TOC, overflow)
  unchanged.

### 4. Page-11 neutral copy (approved draft)

> Not by our hands — by theirs. The people in these pages showed up for you. Not
> just on the day — here, in this book. They chose a recipe, wrote a note, and gave
> you something from their kitchen to make it yours.
>
> Some of these recipes have been in families for generations. Others were invented
> last Tuesday. It doesn't matter. What matters is that every page has a name, and
> every name is someone who wanted to be part of your kitchen.
>
> This isn't a book to display. It's a book to use. Stain it. Fold the corners. Cook
> something on a Wednesday night because a recipe reminded you of someone — and then
> call them.
>
> **The day ends. This book is what stays.**

Wedding bucket = the exact current page-11 text, verbatim.

## Brand-voice check

Neutral copy uses none of the banned words (cherish, treasure, memories, special,
unique, loved ones, celebrate, journey, curated, perfect, amazing). Closing line
echoes the `/about` device ("The day ends. The people stay."). Final wording may be
refined with the small-plates-brand-editor before shipping.

## Out of scope

- Recipe pages, fillers, contributors, special thanks, QR codes, couple image, TOC.
- Per-occasion (birthday/graduation/anniversary) tailored messages — explicitly
  rejected in favor of one neutral message.
- Any UI/web change. This is print-pipeline only.

## Risks / notes

- `anniversary` is treated as a couple on page 3 (has two names) but gets the neutral
  message on page 11 — intentional per decisions 2 & 3.
- If the InDesign labels are missing, v17 must no-op gracefully (mirror the existing
  `{{QR_REPURCHASE}}` "skip if frame not found" pattern), never crash.
- v16 stays untouched as the rollback path.
```
