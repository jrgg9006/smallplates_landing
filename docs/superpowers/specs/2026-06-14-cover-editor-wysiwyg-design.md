# Cover Editor (WYSIWYG) — Step 1 Redesign

**Date:** 2026-06-14
**Status:** Approved design, ready for implementation plan
**Area:** `components/profile/groups/review/` (Book Review flow, Step 1)

---

## Problem

Step 1 of the Book Review flow (`PrintDetailsStep`) asks the owner for a "title"
and a "cover photo". Two things are broken:

1. **The photo is mislabeled as the cover.** The label says "COVER PHOTO", but the
   uploaded photo does **not** go on the cover — the cover is a food illustration
   (paella) + text on a `#f0ece3` background. The photo goes on the **interior
   first spread (pages 3–4)**. Users believe their face will be printed on the
   front. It won't.

2. **The owner cannot see or control how the cover will look.** There is no
   preview. They type a name into a plain input and have no idea what the printed
   cover looks like.

3. **The cover eyebrow is hardcoded and couple-specific.** The line
   `RECIPES FROM THE PEOPLE WHO LOVE` is baked into both the preview renderer and
   the InDesign template. Now that books are not weddings-only, a birthday cover
   reads `RECIPES FROM THE PEOPLE WHO LOVE / Richi's Birthday!` — broken.

## Goal

Turn Step 1 into a **WYSIWYG cover editor**: the owner edits the cover text in
fields and sees the **real cover update live**, with the interior photo presented
as the clearly-separate thing it actually is.

---

## Current technical reality (what exists today)

- **`groups.print_couple_name`** — the editable cover name. Already flows to the
  printed book: `app/api/v1/admin/books/[groupId]/package/route.ts` reads it and
  feeds InDesign.
- **`groups.couple_image_url` + `couple_image_position_x/y`** — the photo. Goes to
  the **interior** spread, not the cover.
- **`app/api/v1/admin/pdf-delivery/preview-cover/route.tsx`** — a Satori
  (`next/og`) route that renders a faithful cover with the real fonts (Minion Pro
  Display), the gold ampersand image, the paella, and the logo. The eyebrow string
  is **hardcoded** at line 149. Font auto-shrinks by name length via
  `titleFontSize()`.
- **InDesign cover template** (`scripts/indesign/generate-cover.jsx`, label
  `SUBHEAD`) — eyebrow text is fixed in the template.
- **`BookReviewFlow.tsx`** — owns Step state, `printCoupleName`, `coupleImageUrl`,
  the per-step `STEP_TITLES`, and the `isCoupleOccasion` flag.

---

## Design

### Decision summary (approved)

| # | Decision | Choice |
|---|----------|--------|
| 1 | Screen structure | **A** — cover hero on top, interior-photo block clearly separated below. One step, one scroll. |
| 2 | Hero block | Fields left, live cover right (desktop). **Sticky** cover. Cover large. Focus-link glow. |
| 3 | Interior photo | **A** — live mini interior-spread preview. Photo centered, **no recrop in v1**. |
| 4 | Char limits | Eyebrow ~40, name ~40. Counter invisible until near limit. Hard-stop at max. |
| 5 | Eyebrow → print | **A** — end-to-end. New DB column → preview → package JSON → new InDesign script version. |
| 6 | Defaults / copy | Eyebrow prefill `RECIPES FROM THE PEOPLE WHO LOVE`. Header `Design your cover`. (Details below.) |

### Layout

**Desktop**
```
┌───────────────────────────────────────────────┐
│  Design your cover                  ← Back     │
│  This is your real cover. Edit it and watch    │
│  it change.                                     │
│ ┌──────────────────┐   ┌───────────────────┐   │
│ │ The line above   │   │                   │   │
│ │ [____________]   │   │   LIVE COVER      │   │
│ │                  │   │   (sticky)        │   │
│ │ The name         │   │   ~320–380px      │   │
│ │ [____________]   │   │                   │   │
│ │ tip / counter    │   │                   │   │
│ └──────────────────┘   └───────────────────┘   │
│ ───────────── (visual divider) ─────────────   │
│  A photo for inside the book                    │
│  This photo goes inside the book — on the       │
│  first page, not the cover.                     │
│ ┌─────────────────────────────────────────┐    │
│ │   INTERIOR SPREAD (live)                 │    │
│ │   [ photo page ] [ name + subtitle page ]│    │
│ └─────────────────────────────────────────┘    │
└───────────────────────────────────────────────┘
```

**Mobile**: single column. Cover at top → fields → divider → interior block. The
cover is **sticky on desktop only** (right column `position: sticky`). On mobile
the cover sits at the top, non-sticky: the cover fields are immediately below it
so it stays visible while editing cover text; it scrolls away when the user
reaches the interior-photo block (which has its own live preview). Mobile
sticky-shrink-to-thumbnail is explicitly **out of scope for v1** — it was the
complexity we agreed to skip.

### Live cover renderer (HTML/CSS replica)

The live cover is a **client-side HTML/CSS replica** of the Satori cover, not a
server refetch — so it updates instantly on every keystroke with no round-trip.

To guarantee the replica and the Satori/print renders never drift, **extract the
shared layout logic** (`titleFontSize()` buckets + the `&`-split into `part1`/
`part2`) into `lib/cover/layout.ts`. Both `LiveCover` (browser) and
`preview-cover/route.tsx` (Satori) import the same functions.

Replica fidelity (mirror the Satori values, scaled to the component width):
- Aspect ratio 900:1125 (4:5), background `#f0ece3`.
- Paella illustration (`/images/email-pdf/paella_transparent_sm.png`) positioned
  as in Satori.
- Eyebrow: Minion Pro Display, uppercase, letter-spacing `0.24em`, color
  `#8a8c8e`, centered.
- Name: Minion Pro Display, color `#4b4b4a`, auto-shrink via shared
  `titleFontSize()`. When the name contains `&`, render the gold ampersand image
  (`/images/email-pdf/ampestrand_gold_transparent.png`) between the two parts.
- Logo footer (`/images/SmallPlates_logo_horizontal.png`) at `opacity: 0.6`.

**Fonts:** the live replica needs `@font-face` for `MinionPro-Display` (and
`MinionPro-Regular`) pointing at the existing `/public/fonts/*.otf`. This is a
**documented exception** to the "use `type-*` classes" rule: the cover/interior
replicas intentionally use the raw print fonts to match the printed book — they
are not marketing copy. (Same exception class as functional/admin UI in
`CLAUDE.md`.)

**Focus-link glow:** `LiveCover` receives a `focusedField: 'eyebrow' | 'name' |
null` prop. Focusing a field applies a soft glow/outline to the matching cover
zone so the field↔cover mapping is obvious.

### Interior spread renderer (HTML/CSS replica of pages 3–4)

A second HTML replica of the open-book spread (matches the reference: left page =
photo, right page = name + subtitle):
- Left page: the uploaded `couple_image_url`, centered (`object-position: center
  50%`, using the existing default — recrop is v1-out-of-scope). If no photo yet,
  the **upload dropzone renders in the photo's place** so the owner sees exactly
  where it lands.
- Right page: the name (with gold `&` when present) + `A Small Plates Cookbook`
  in italic below.
- Because it is a visibly **open book** (two pages), it cannot be confused with
  the front cover.

### Character limits + feedback

- Eyebrow input: `maxLength = 40`.
- Name input: `maxLength = 40` (the point where `titleFontSize()` hits its 48px
  floor; beyond it the Satori render overflows).
- Feedback is "invisible until it matters":
  - No counter while there is comfortable room.
  - The live cover **shrinks the font as they type** — the natural feedback.
  - A subtle gray counter (`36/40`) appears only within the last ~8 characters.
  - Hard-stop at the max via `maxLength` (no red error, no scolding).

### Defaults, placeholders, labels, copy

- **Eyebrow prefill (on load):** `RECIPES FROM THE PEOPLE WHO LOVE` for everyone
  (works for couples and people; editable). Stored in
  `DEFAULT_COVER_LINE` in `lib/cover/layout.ts`.
- **Name prefill:** existing `print_couple_name || couple_display_name || name`
  (unchanged).
- **Placeholders (empty state):**
  - Eyebrow: `RECIPES FROM THE PEOPLE WHO LOVE`
  - Name (couple): `Rocío & Víctor`
  - Name (non-couple): `Richi` (a simple name — not a long title, which would
    break the eyebrow→name sentence).
- **Field labels (in the cover's visual order):** `The line above`, then
  `The name`.
- **Step header** (in `BookReviewFlow.STEP_TITLES[1]`): `Design your cover`
  (replaces the occasion-branched "Add the couple's name and photo" / "Add your
  book's title and a photo").
- **Intro line:** `This is your real cover. Edit it and watch it change.`
- **Interior block copy:** title `A photo for inside the book`, helper
  `This photo goes inside the book — on the first page, not the cover.`

> Brand voice: all copy stays dry/direct/warm-not-performed. No banned words
> (cherish, treasure, memories, special, etc.). No guest numbers.

---

## Data model

New column on `groups`:

```sql
ALTER TABLE groups
  ADD COLUMN print_cover_line text;
-- null = fall back to DEFAULT_COVER_LINE ("RECIPES FROM THE PEOPLE WHO LOVE")
```

Run manually (per project rule: deliver SQL block, user runs it; no destructive
`apply_migration`). Then update `lib/types/database.ts` (`groups` Row/Insert/
Update + the convenience `Group*` types).

No RLS change needed — `groups` policies already cover member writes via the
existing `print-details` endpoint.

---

## API changes

**`PATCH /api/v1/groups/[groupId]/print-details`**
- Accept optional `print_cover_line` (string). Trim. Save alongside
  `print_couple_name`. Empty/absent → leave as-is or set null (falls back to
  default at render). `print_couple_name` stays required (unchanged contract).

**`GET /api/v1/admin/pdf-delivery/preview-cover` (Satori)**
- `select` now includes `print_cover_line`.
- Eyebrow = `group.print_cover_line || DEFAULT_COVER_LINE` (replaces the
  hardcoded string at line 149).
- Import `titleFontSize` / split helpers from `lib/cover/layout.ts` (same source
  as `LiveCover`).
- Cover cache-bust key in `BookPreviewPanel` must include the cover line too (it
  currently keys on the title only).

---

## Print pipeline (end-to-end for the eyebrow)

**`app/api/v1/admin/books/[groupId]/package/route.ts`**
- Add `print_cover_line` to the `select`.
- Add `cover_line: group.print_cover_line || DEFAULT_COVER_LINE` to the packaged
  book JSON.

**InDesign**
- Per the script-versioning rule, create a **new version** of the active cover
  script (replicate the full file, then change the `SUBHEAD` step to set
  `subhead.contents` from `data.cover_line` instead of relying on the fixed
  template text).
- ⚠️ **Confirm with Ricardo which cover script is the live one**
  (`generate-cover.jsx` vs `generate-cover2.jsx`) before versioning.

---

## Components

New / changed under `components/profile/groups/review/`:

- `cover/LiveCover.tsx` — HTML replica of the cover. Props: `coverLine`, `name`,
  `focusedField`. Uses `lib/cover/layout.ts`.
- `cover/InteriorSpread.tsx` — HTML replica of pages 3–4. Props: `name`,
  `imageUrl`, `occasion`/subtitle, upload + remove handlers, `uploading`.
- `cover/CoverFieldInput.tsx` — labeled input with `maxLength`, near-limit gray
  counter, optional tip slot, and focus/blur callbacks for the glow.
- `PrintDetailsStep.tsx` — **rewritten** as the orchestrator: owns `name`,
  `coverLine`, `imageUrl` state + the three API calls (image upload/delete,
  print-details PATCH now sends `print_cover_line`). Composes the two field
  inputs + `LiveCover` + `InteriorSpread`. Keep **< 300 lines** by leaning on the
  sub-components.

`lib/cover/layout.ts` (new) — `DEFAULT_COVER_LINE`, `titleFontSize()`,
`splitCoupleName()` (the `&` split). Shared by `LiveCover` and the Satori route.

`BookReviewFlow.tsx`:
- Add `printCoverLine` state (`group.print_cover_line || DEFAULT_COVER_LINE`).
- Pass `coverLine` + `onCoverLineChange` to `PrintDetailsStep`.
- Change `STEP_TITLES[1]` to `Design your cover` (drop the occasion branch for
  step 1).
- Pass `occasion` (or a derived subtitle) through for the interior spread.

---

## Out of scope (v1)

- Photo recrop / reposition slider (`couple_image_position_y` stays at default).
- Mobile sticky-shrink-to-thumbnail.
- Editing the `A Small Plates Cookbook` subtitle or any back-cover text.
- Changing the paella illustration / cover art.

---

## Testing & verification

- `npx tsc --noEmit` after the TypeScript changes.
- Visual check via **Ricardo's screenshot** (no Playwright/headless — per project
  preference): live cover updates on typing; eyebrow editable; counter appears
  only near limit; interior spread shows photo landing inside an open book.
- Satori `preview-cover` still renders correctly with `print_cover_line` set and
  null (fallback).
- `package/route.ts` JSON includes `cover_line`.
- New InDesign script renders the edited eyebrow on the printed cover.
