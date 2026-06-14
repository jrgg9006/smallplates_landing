# Cover Editor (WYSIWYG) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn Step 1 of the Book Review flow into a WYSIWYG cover editor where the owner edits the cover's eyebrow + name in fields and sees the real cover update live, with the photo presented as the interior-spread element it actually is.

**Architecture:** A new shared module (`lib/cover/layout.ts`) holds the single source of truth for cover sizing/splitting so the live HTML preview, the Satori server render, and the InDesign print all agree. The live cover and interior spread are client-side HTML/CSS replicas. A new `groups.print_cover_line` column carries the editable eyebrow end-to-end (UI → preview → package JSON → InDesign).

**Tech Stack:** Next.js 14 App Router, TypeScript strict, Tailwind, Supabase, Jest (pure-logic unit tests), `next/og` (Satori), InDesign `.jsx`.

**Testing note:** This codebase unit-tests pure logic with Jest (e.g. `__tests__/lib/stripe/pricing.test.ts`, `lib/radar/aggregate.test.ts`) and verifies UI visually via screenshots (no Playwright/RTL/jsdom component tests exist — see project rule "verify via user screenshot"). This plan applies strict TDD to Task 1 (pure logic) and verifies the UI tasks with `npx tsc --noEmit`, `npm run build`, and a Ricardo screenshot.

**Spec:** `docs/superpowers/specs/2026-06-14-cover-editor-wysiwyg-design.md`

---

## File structure

| File | Responsibility |
|---|---|
| `lib/cover/layout.ts` *(create)* | Shared constants + `titleFontSize()` + `splitCoupleName()`. Source of truth. |
| `lib/cover/layout.test.ts` *(create)* | Jest unit tests for the shared logic. |
| `app/api/v1/admin/pdf-delivery/preview-cover/route.tsx` *(modify)* | Import shared logic; read `print_cover_line`. |
| `components/profile/groups/BookPreviewPanel.tsx` *(modify)* | Cache-bust key includes cover line. |
| `lib/types/database.ts` *(modify)* | Add `print_cover_line` to `groups` Row/Insert/Update + convenience types. |
| `app/api/v1/groups/[groupId]/print-details/route.ts` *(modify)* | Accept + save `print_cover_line`. |
| `app/globals.css` *(modify)* | `@font-face` for Minion Pro. |
| `components/profile/groups/review/cover/LiveCover.tsx` *(create)* | HTML replica of the cover. |
| `components/profile/groups/review/cover/InteriorSpread.tsx` *(create)* | HTML replica of pages 3–4. |
| `components/profile/groups/review/cover/CoverFieldInput.tsx` *(create)* | Labeled input + near-limit counter + focus callbacks. |
| `components/profile/groups/review/PrintDetailsStep.tsx` *(rewrite)* | Orchestrator composing the above. |
| `components/profile/groups/review/BookReviewFlow.tsx` *(modify)* | `printCoverLine` state, props, header copy. |
| `app/api/v1/admin/books/[groupId]/package/route.ts` *(modify)* | Add `cover_line` to packaged JSON. |
| `scripts/indesign/generate-cover_v*.jsx` *(create)* | New version reading the eyebrow from data. |

---

## Task 1: Shared cover layout module (TDD)

**Files:**
- Create: `lib/cover/layout.ts`
- Test: `lib/cover/layout.test.ts`

- [ ] **Step 1: Write the failing test**

Create `lib/cover/layout.test.ts`:

```ts
import {
  titleFontSize,
  splitCoupleName,
  DEFAULT_COVER_LINE,
} from '@/lib/cover/layout';

describe('cover layout', () => {
  describe('titleFontSize', () => {
    it('returns the largest size for short names', () => {
      expect(titleFontSize(5)).toBe(80);
    });
    it('steps down through the buckets', () => {
      expect(titleFontSize(10)).toBe(72);
      expect(titleFontSize(14)).toBe(70);
      expect(titleFontSize(18)).toBe(68);
      expect(titleFontSize(22)).toBe(66);
      expect(titleFontSize(27)).toBe(64);
      expect(titleFontSize(33)).toBe(56);
    });
    it('floors at 48 for very long names', () => {
      expect(titleFontSize(34)).toBe(48);
      expect(titleFontSize(80)).toBe(48);
    });
  });

  describe('splitCoupleName', () => {
    it('splits on the ampersand and trims', () => {
      const r = splitCoupleName('Olivia & David');
      expect(r.hasAmp).toBe(true);
      expect(r.part1).toBe('Olivia');
      expect(r.part2).toBe('David');
    });
    it('handles a single name with no ampersand', () => {
      const r = splitCoupleName('Richi');
      expect(r.hasAmp).toBe(false);
      expect(r.part1).toBe('Richi');
      expect(r.part2).toBe('');
    });
    it('sizes by the longer part', () => {
      // "Maximiliano" = 11 chars -> bucket <=14 -> 70
      expect(splitCoupleName('Maximiliano & Jo').fontSize).toBe(70);
    });
  });

  it('exposes the default eyebrow line', () => {
    expect(DEFAULT_COVER_LINE).toBe('RECIPES FROM THE PEOPLE WHO LOVE');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest lib/cover/layout.test.ts`
Expected: FAIL — `Cannot find module '@/lib/cover/layout'`.

- [ ] **Step 3: Write minimal implementation**

Create `lib/cover/layout.ts`:

```ts
// Shared cover layout logic — the single source of truth for cover sizing and
// name splitting. Imported by the live HTML cover (LiveCover.tsx), the Satori
// print-preview route, and (via the packaged JSON) the InDesign script, so the
// live preview, the server render, and the printed book never drift.

/** Default eyebrow line when the owner has not set a custom one. */
export const DEFAULT_COVER_LINE = 'RECIPES FROM THE PEOPLE WHO LOVE';

/** Max characters for the editable cover fields. */
export const COVER_LINE_MAX = 40;
export const COVER_NAME_MAX = 40;

/** Canonical cover coordinate space (matches the Satori render). */
export const COVER_W = 900;
export const COVER_H = 1125;

/**
 * Title font size in px for the canonical 900px-wide cover, bucketed by the
 * longest "&"-separated part. Mirrors the Satori render exactly.
 * Reason: 900px wide with ~6px side padding; finer buckets + a 48px floor keep
 * long names from collapsing to a cramped size.
 */
export function titleFontSize(maxPartLen: number): number {
  if (maxPartLen <= 7) return 80;
  if (maxPartLen <= 10) return 72;
  if (maxPartLen <= 14) return 70;
  if (maxPartLen <= 18) return 68;
  if (maxPartLen <= 22) return 66;
  if (maxPartLen <= 27) return 64;
  if (maxPartLen <= 33) return 56;
  return 48;
}

export interface SplitName {
  hasAmp: boolean;
  part1: string;
  part2: string;
  /** Font size for this name on the canonical 900px cover. */
  fontSize: number;
}

/** Split a cover name on the first "&" into the two flanking parts. */
export function splitCoupleName(name: string): SplitName {
  const idx = name.indexOf('&');
  const hasAmp = idx > -1;
  const part1 = hasAmp ? name.slice(0, idx).trim() : name;
  const part2 = hasAmp ? name.slice(idx + 1).trim() : '';
  const fontSize = titleFontSize(Math.max(part1.length, part2.length));
  return { hasAmp, part1, part2, fontSize };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest lib/cover/layout.test.ts`
Expected: PASS (all assertions green).

- [ ] **Step 5: Commit**

```bash
git add lib/cover/layout.ts lib/cover/layout.test.ts
git commit -m "feat(cover): shared cover layout module (sizing + name split)"
```

---

## Task 2: Refactor Satori preview-cover to use the shared module

**Files:**
- Modify: `app/api/v1/admin/pdf-delivery/preview-cover/route.tsx`

- [ ] **Step 1: Import the shared module**

At the top of the file, after the existing imports, add:

```ts
import { titleFontSize, splitCoupleName, DEFAULT_COVER_LINE } from '@/lib/cover/layout';
```

- [ ] **Step 2: Delete the local `titleFontSize`**

Remove the local `function titleFontSize(maxPartLen: number) { ... }` (currently lines ~34–48). The imported one is identical.

- [ ] **Step 3: Use the shared split + default eyebrow**

Replace the inline ampersand split (currently lines ~82–88):

```ts
  const ampIdx = coupleNamePlain.indexOf('&');
  const hasAmp = ampIdx > -1;
  const part1 = hasAmp ? coupleNamePlain.slice(0, ampIdx).trim() : coupleNamePlain;
  const part2 = hasAmp ? coupleNamePlain.slice(ampIdx + 1).trim() : '';

  const fontSize = titleFontSize(Math.max(part1.length, part2.length));
  const ampImgSize = Math.round(fontSize * 1.05);
```

with:

```ts
  const { hasAmp, part1, part2, fontSize } = splitCoupleName(coupleNamePlain);
  const ampImgSize = Math.round(fontSize * 1.05);
```

- [ ] **Step 4: Read `print_cover_line` from the group and use it for the eyebrow**

In the `select` (currently line ~61), add `print_cover_line`:

```ts
      .select('print_couple_name, print_details_confirmed_at, couple_display_name, name, print_cover_line')
```

Add a `coverLine` variable next to `coupleNamePlain`. Near the top where `coupleNamePlain` is declared:

```ts
  let coupleNamePlain = directName || 'Cheese & Wine';
  let coverLine = url.searchParams.get('cover_line') || DEFAULT_COVER_LINE;
```

Inside the `if (group) { ... }` block, after setting `coupleNamePlain`:

```ts
      coverLine = group.print_cover_line || DEFAULT_COVER_LINE;
```

Then replace the hardcoded eyebrow JSX (currently line ~149):

```tsx
            {'RECIPES FROM THE PEOPLE WHO LOVE'}
```

with:

```tsx
            {coverLine.toUpperCase()}
```

- [ ] **Step 5: Verify build + type-check**

Run: `npx tsc --noEmit`
Expected: no errors.
Run: `npm run lint`
Expected: no new errors in this file.

> Note: this task references `groups.print_cover_line`, added in Task 3. If you run `tsc` before Task 3, you will get a type error on the `select`. Run Tasks 2 and 3 together, or do Task 3 first. (They are committed separately but verified together.)

- [ ] **Step 6: Commit**

```bash
git add app/api/v1/admin/pdf-delivery/preview-cover/route.tsx
git commit -m "refactor(cover): preview-cover uses shared layout + editable eyebrow"
```

---

## Task 3: DB column + types

**Files:**
- Modify: `lib/types/database.ts`
- (Manual SQL — Ricardo runs it)

- [ ] **Step 1: Deliver the SQL for Ricardo to run manually**

Per project rule (no destructive `apply_migration`; deliver SQL block), give Ricardo:

```sql
ALTER TABLE groups
  ADD COLUMN IF NOT EXISTS print_cover_line text;
COMMENT ON COLUMN groups.print_cover_line IS
  'Editable cover eyebrow line. NULL falls back to DEFAULT_COVER_LINE.';
```

Wait for Ricardo to confirm it ran before continuing.

- [ ] **Step 2: Add the column to `lib/types/database.ts`**

In the `groups` table block, add `print_cover_line: string | null;` to the **Row** type (next to `print_couple_name` at line ~479), and `print_cover_line?: string | null;` to both the **Insert** (~528) and **Update** (~575) types. Also add `print_cover_line?: string | null;` to the convenience `Group`-level type near line ~1109 (next to `print_couple_name`).

- [ ] **Step 3: Verify type-check**

Run: `npx tsc --noEmit`
Expected: no errors (this unblocks Task 2's `select`).

- [ ] **Step 4: Commit**

```bash
git add lib/types/database.ts
git commit -m "feat(cover): add groups.print_cover_line to db types"
```

---

## Task 4: print-details endpoint accepts the cover line

**Files:**
- Modify: `app/api/v1/groups/[groupId]/print-details/route.ts`

- [ ] **Step 1: Parse `print_cover_line` from the body**

Replace the destructure (line ~47):

```ts
    const { print_couple_name } = body;
```

with:

```ts
    const { print_couple_name, print_cover_line } = body;
```

- [ ] **Step 2: Include it in the update**

Replace the `.update({ ... })` object (lines ~58–61) with:

```ts
      .update({
        print_couple_name: print_couple_name.trim(),
        // Reason: NULL is allowed and falls back to DEFAULT_COVER_LINE at render.
        print_cover_line:
          typeof print_cover_line === 'string' && print_cover_line.trim()
            ? print_cover_line.trim()
            : null,
        print_details_confirmed_at: new Date().toISOString(),
      })
```

And add `print_cover_line` to the `.select(...)` (line ~63):

```ts
      .select('print_couple_name, print_cover_line, print_details_confirmed_at, couple_image_url')
```

- [ ] **Step 3: Verify type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add app/api/v1/groups/[groupId]/print-details/route.ts
git commit -m "feat(cover): print-details endpoint saves print_cover_line"
```

---

## Task 5: Minion Pro `@font-face`

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Confirm the font files exist**

Run: `ls public/fonts/MinionPro-Display.otf public/fonts/MinionPro-Regular.otf`
Expected: both files listed (the Satori route already loads them from `/fonts/`).

- [ ] **Step 2: Add `@font-face` declarations**

Near the top of `app/globals.css` (after any existing `@font-face` or `@import`, before the Tailwind layers), add:

```css
/* Reason: the live cover + interior-spread replicas must render in the real
   print font (Minion Pro) to match the printed book. This is a documented
   exception to the type-* rule — it is a book replica, not marketing copy. */
@font-face {
  font-family: 'MinionPro-Display';
  src: url('/fonts/MinionPro-Display.otf') format('opentype');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: 'MinionPro-Regular';
  src: url('/fonts/MinionPro-Regular.otf') format('opentype');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}
```

- [ ] **Step 3: Commit**

```bash
git add app/globals.css
git commit -m "feat(cover): @font-face for Minion Pro (live cover replica)"
```

---

## Task 6: `LiveCover` component

**Files:**
- Create: `components/profile/groups/review/cover/LiveCover.tsx`

- [ ] **Step 1: Create the component**

```tsx
"use client";

import React from "react";
import { COVER_W, COVER_H, DEFAULT_COVER_LINE, splitCoupleName } from "@/lib/cover/layout";

interface LiveCoverProps {
  coverLine: string;
  name: string;
  focusedField: "eyebrow" | "name" | null;
  /** Rendered width in px; the 900×1125 artwork is scaled to fit. */
  width?: number;
}

const PAELLA = "/images/email-pdf/paella_transparent_sm.png";
const AMP = "/images/email-pdf/ampestrand_gold_transparent.png";
const LOGO = "/images/SmallPlates_logo_horizontal.png";

// Reason: the artwork is authored in the canonical 900×1125 coordinate space (the
// same numbers as the Satori render) and CSS-scaled to the requested width, so the
// live preview is pixel-faithful to the printed cover without duplicating geometry.
export function LiveCover({ coverLine, name, focusedField, width = 360 }: LiveCoverProps) {
  const scale = width / COVER_W;
  const { hasAmp, part1, part2, fontSize } = splitCoupleName(name || "");
  const eyebrow = (coverLine || DEFAULT_COVER_LINE).toUpperCase();
  const ampSize = Math.round(fontSize * 1.05);
  const glow = "0 0 0 2px rgba(212,168,84,0.45)";

  return (
    <div style={{ width, height: COVER_H * scale }}>
      <div
        style={{
          width: COVER_W,
          height: COVER_H,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          position: "relative",
          overflow: "hidden",
          backgroundColor: "#f0ece3",
          fontFamily: "'MinionPro-Display', serif",
          boxShadow: "-8px 12px 24px rgba(0,0,0,0.12), -2px 4px 8px rgba(0,0,0,0.08)",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={PAELLA}
          alt=""
          width={1170}
          height={1170}
          style={{ position: "absolute", top: 110, left: (COVER_W - 1170) / 2 }}
        />

        {/* Eyebrow */}
        <div
          style={{
            position: "absolute",
            top: 152,
            left: 0,
            width: COVER_W,
            textAlign: "center",
            fontSize: 22,
            letterSpacing: "0.24em",
            color: "#8a8c8e",
            padding: "8px 0",
            boxShadow: focusedField === "eyebrow" ? glow : "none",
            borderRadius: 6,
            transition: "box-shadow 0.2s",
          }}
        >
          {eyebrow}
        </div>

        {/* Name */}
        <div
          style={{
            position: "absolute",
            top: 237,
            left: 6,
            width: COVER_W - 12,
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            color: "#4b4b4a",
            lineHeight: 1,
            padding: "6px 0",
            boxShadow: focusedField === "name" ? glow : "none",
            borderRadius: 6,
            transition: "box-shadow 0.2s",
          }}
        >
          <span style={{ fontSize }}>{part1}</span>
          {hasAmp && (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={AMP} alt="&" width={ampSize} height={ampSize} style={{ margin: "0 6px" }} />
              <span style={{ fontSize }}>{part2}</span>
            </>
          )}
        </div>

        {/* Logo footer */}
        <div
          style={{
            position: "absolute",
            bottom: 42,
            width: COVER_W,
            display: "flex",
            justifyContent: "center",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={LOGO} alt="Small Plates & Co." width={168} height={95} style={{ opacity: 0.6 }} />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/profile/groups/review/cover/LiveCover.tsx
git commit -m "feat(cover): LiveCover HTML replica of the printed cover"
```

---

## Task 7: `InteriorSpread` component

**Files:**
- Create: `components/profile/groups/review/cover/InteriorSpread.tsx`

- [ ] **Step 1: Create the component**

```tsx
"use client";

import React from "react";
import Image from "next/image";
import { Upload } from "lucide-react";
import { splitCoupleName } from "@/lib/cover/layout";

interface InteriorSpreadProps {
  name: string;
  imageUrl: string | null;
  uploading: boolean;
  onUploadClick: () => void;
}

// Reason: a live HTML replica of the interior first spread (pages 3–4). Because it
// is a visibly OPEN book (two pages), the uploaded photo can't be mistaken for the
// front cover — which is the whole point of the redesign.
export function InteriorSpread({ name, imageUrl, uploading, onUploadClick }: InteriorSpreadProps) {
  const { hasAmp, part1, part2 } = splitCoupleName(name || "");

  return (
    <div
      className="mx-auto grid w-full max-w-2xl grid-cols-2 overflow-hidden rounded-lg shadow-lg"
      style={{ aspectRatio: "2 / 1.28" }}
    >
      {/* Left page — photo */}
      <div className="relative flex items-center justify-center border-r border-black/5 bg-white p-5">
        {imageUrl ? (
          <div className="relative h-full w-full">
            <Image
              src={imageUrl}
              alt="Inside the book"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 50vw, 320px"
            />
          </div>
        ) : (
          <button
            onClick={onUploadClick}
            disabled={uploading}
            className="flex h-full w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 transition-colors hover:border-brand-honey"
          >
            {uploading ? (
              <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-brand-honey" />
            ) : (
              <>
                <Upload className="h-6 w-6 text-gray-400" />
                <span className="text-sm text-gray-500">Upload a photo</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Right page — name + subtitle */}
      <div
        className="flex flex-col items-center justify-center bg-[#FAF7F2] p-5 text-center"
        style={{ fontFamily: "'MinionPro-Display', serif" }}
      >
        <div className="flex items-center gap-1.5 text-xl text-brand-charcoal sm:text-2xl">
          <span>{part1}</span>
          {hasAmp && (
            <>
              <span className="text-brand-honey">&amp;</span>
              <span>{part2}</span>
            </>
          )}
        </div>
        <p className="mt-2 text-xs italic text-[hsl(var(--brand-warm-gray))] sm:text-sm">
          A Small Plates Cookbook
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/profile/groups/review/cover/InteriorSpread.tsx
git commit -m "feat(cover): InteriorSpread replica of pages 3-4"
```

---

## Task 8: `CoverFieldInput` component

**Files:**
- Create: `components/profile/groups/review/cover/CoverFieldInput.tsx`

- [ ] **Step 1: Create the component**

```tsx
"use client";

import React from "react";

interface CoverFieldInputProps {
  label: string;
  value: string;
  max: number;
  placeholder?: string;
  /** Eyebrow styling: small uppercase letterspaced text. */
  uppercase?: boolean;
  tip?: React.ReactNode;
  onChange: (v: string) => void;
  onFocus: () => void;
  onBlur: () => void;
  autoFocus?: boolean;
}

// Reason: feedback is "invisible until it matters" — no counter while there's
// room; a subtle gray counter only within the last 8 chars; hard-stop via
// maxLength (no red error). The live cover's font-shrink is the main feedback.
export function CoverFieldInput({
  label,
  value,
  max,
  placeholder,
  uppercase,
  tip,
  onChange,
  onFocus,
  onBlur,
  autoFocus,
}: CoverFieldInputProps) {
  const nearLimit = max - value.length <= 8;

  return (
    <div className="flex flex-col">
      <p className="type-eyebrow mb-3">{label}</p>
      <input
        type="text"
        value={value}
        maxLength={max}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        onBlur={onBlur}
        autoFocus={autoFocus}
        placeholder={placeholder}
        className={`w-full rounded-xl border border-gray-200 bg-white px-4 py-4 text-center text-brand-charcoal transition-colors focus:border-brand-honey focus:outline-none focus:ring-1 focus:ring-brand-honey/30 ${
          uppercase ? "text-sm uppercase tracking-[0.18em]" : "font-serif text-2xl"
        }`}
      />
      <div className="mt-2 flex min-h-[20px] items-center justify-between gap-3">
        <span className="text-sm text-[hsl(var(--brand-warm-gray))]/80">{tip}</span>
        {nearLimit && (
          <span className="flex-shrink-0 text-xs text-[hsl(var(--brand-warm-gray))]/70">
            {value.length}/{max}
          </span>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/profile/groups/review/cover/CoverFieldInput.tsx
git commit -m "feat(cover): CoverFieldInput with near-limit counter + focus link"
```

---

## Task 9: Rewrite `PrintDetailsStep` as the orchestrator

**Files:**
- Rewrite: `components/profile/groups/review/PrintDetailsStep.tsx`

- [ ] **Step 1: Replace the file contents**

```tsx
"use client";

import React, { useState, useRef } from "react";
import { LiveCover } from "./cover/LiveCover";
import { InteriorSpread } from "./cover/InteriorSpread";
import { CoverFieldInput } from "./cover/CoverFieldInput";
import { COVER_LINE_MAX, COVER_NAME_MAX, DEFAULT_COVER_LINE } from "@/lib/cover/layout";

interface PrintDetailsStepProps {
  groupId: string;
  name: string;
  coverLine: string;
  imageUrl: string | null;
  // Reason: couple occasions keep "the couple" copy; everything else stays neutral.
  isCoupleOccasion: boolean;
  onNameChange: (name: string) => void;
  onCoverLineChange: (line: string) => void;
  onImageChange: (url: string | null) => void;
  onContinue: () => void;
}

// Reason: Step 1 of the book-review flow, redesigned into a WYSIWYG cover editor.
// Left = editable fields; right = the real cover rendered live (sticky). Below,
// clearly separated, the interior spread showing the photo lands INSIDE the book.
export function PrintDetailsStep({
  groupId,
  name,
  coverLine,
  imageUrl,
  isCoupleOccasion,
  onNameChange,
  onCoverLineChange,
  onImageChange,
  onContinue,
}: PrintDetailsStepProps) {
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [focused, setFocused] = useState<"eyebrow" | "name" | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await fetch(`/api/v1/groups/${groupId}/couple-image`, {
        method: "POST",
        body: formData,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Upload failed");
      onImageChange(json.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = async () => {
    setError(null);
    try {
      const res = await fetch(`/api/v1/groups/${groupId}/couple-image`, { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Failed to remove image");
      }
      onImageChange(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove");
    }
  };

  const handleContinue = async () => {
    if (!name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/groups/${groupId}/print-details`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          print_couple_name: name.trim(),
          print_cover_line: coverLine.trim() || DEFAULT_COVER_LINE,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to save");
      onContinue();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full">
      <p className="type-body-small mb-8 max-w-2xl text-pretty">
        This is your real cover. Edit it and watch it change.
      </p>

      {/* HERO: fields (left) + live cover (right, sticky on desktop) */}
      <div className="grid gap-x-12 gap-y-8 sm:grid-cols-[1fr_360px] sm:items-start">
        <div className="flex flex-col gap-7">
          <CoverFieldInput
            label="The line above"
            value={coverLine}
            max={COVER_LINE_MAX}
            placeholder={DEFAULT_COVER_LINE}
            uppercase
            onChange={onCoverLineChange}
            onFocus={() => setFocused("eyebrow")}
            onBlur={() => setFocused(null)}
          />
          <CoverFieldInput
            label="The name"
            value={name}
            max={COVER_NAME_MAX}
            placeholder={isCoupleOccasion ? "Rocío & Víctor" : "Richi"}
            tip={
              isCoupleOccasion ? (
                <>Tip: use &ldquo;&amp;&rdquo;. It looks best in print.</>
              ) : null
            }
            onChange={onNameChange}
            onFocus={() => setFocused("name")}
            onBlur={() => setFocused(null)}
            autoFocus
          />
        </div>

        <div className="flex justify-center sm:sticky sm:top-6">
          <LiveCover coverLine={coverLine} name={name} focusedField={focused} width={360} />
        </div>
      </div>

      {/* Divider */}
      <div className="my-12 border-t border-black/10" />

      {/* INTERIOR PHOTO */}
      <div className="flex flex-col">
        <p className="type-eyebrow mb-2">A photo for inside the book</p>
        <p className="type-body-small mb-6 max-w-xl text-pretty">
          This photo goes inside the book — on the first page, not the cover.
        </p>

        <InteriorSpread
          name={name}
          imageUrl={imageUrl}
          uploading={uploading}
          onUploadClick={() => fileInputRef.current?.click()}
        />

        {imageUrl && (
          <div className="mx-auto mt-4 flex gap-4">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="text-sm font-medium text-brand-honey transition-colors hover:text-brand-honey-dark"
            >
              Change photo
            </button>
            <button
              onClick={handleRemoveImage}
              disabled={uploading}
              className="text-sm text-gray-400 transition-colors hover:text-red-400"
            >
              Remove
            </button>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleImageUpload(file);
          e.target.value = "";
        }}
      />

      {error && <p className="mt-6 text-center text-sm text-red-500">{error}</p>}

      <button
        type="button"
        onClick={handleContinue}
        disabled={!name.trim() || saving}
        className="btn btn-md btn-dark mt-10 mx-auto sm:ml-auto sm:mr-0 block w-full max-w-xs"
      >
        {saving ? "Saving…" : "Looks good, continue"}
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Verify type-check**

Run: `npx tsc --noEmit`
Expected: errors about `PrintDetailsStep` missing `coverLine` / `onCoverLineChange` props at its call site in `BookReviewFlow` — expected, fixed in Task 10. The component file itself should have no internal type errors.

- [ ] **Step 3: Commit**

```bash
git add components/profile/groups/review/PrintDetailsStep.tsx
git commit -m "feat(cover): rewrite PrintDetailsStep as WYSIWYG cover editor"
```

---

## Task 10: Wire `BookReviewFlow`

**Files:**
- Modify: `components/profile/groups/review/BookReviewFlow.tsx`

- [ ] **Step 1: Import the default**

Add to the imports near the top:

```tsx
import { DEFAULT_COVER_LINE } from "@/lib/cover/layout";
```

- [ ] **Step 2: Add cover-line state**

After the `printCoupleName` state (line ~35–37), add:

```tsx
  const [printCoverLine, setPrintCoverLine] = useState(
    group.print_cover_line || DEFAULT_COVER_LINE
  );
```

- [ ] **Step 3: Change the Step 1 title**

Replace the `STEP_TITLES` Step 1 entry (lines ~163–165):

```tsx
    1: isCoupleOccasion
      ? "Add the couple's name and photo"
      : "Add your book's title and a photo",
```

with:

```tsx
    1: "Design your cover",
```

- [ ] **Step 4: Pass the new props to `PrintDetailsStep`**

Replace the `<PrintDetailsStep ... />` block (lines ~226–235) with:

```tsx
        <PrintDetailsStep
          groupId={groupId}
          name={printCoupleName}
          coverLine={printCoverLine}
          imageUrl={coupleImageUrl}
          isCoupleOccasion={isCoupleOccasion}
          onNameChange={setPrintCoupleName}
          onCoverLineChange={setPrintCoverLine}
          onImageChange={setCoupleImageUrl}
          onContinue={() => setStep(2)}
        />
```

- [ ] **Step 5: Verify type-check + build**

Run: `npx tsc --noEmit`
Expected: no errors.
Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 6: Commit**

```bash
git add components/profile/groups/review/BookReviewFlow.tsx
git commit -m "feat(cover): wire printCoverLine through BookReviewFlow + new header"
```

---

## Task 11: BookPreviewPanel cache-bust includes the cover line

**Files:**
- Modify: `components/profile/groups/BookPreviewPanel.tsx`

- [ ] **Step 1: Include the cover line in the cache key**

Replace the `coverUrl` block (lines ~27–32):

```tsx
  const coverTitle =
    (group.print_details_confirmed_at && group.print_couple_name) ||
    group.couple_display_name ||
    group.name ||
    "";
  const coverUrl = `/api/v1/admin/pdf-delivery/preview-cover?group_id=${group.id}&v=${encodeURIComponent(coverTitle)}`;
```

with:

```tsx
  const coverTitle =
    (group.print_details_confirmed_at && group.print_couple_name) ||
    group.couple_display_name ||
    group.name ||
    "";
  // Reason: bust the cache on BOTH the title and the eyebrow so editing either
  // refreshes the Satori cover image.
  const coverKey = `${coverTitle}|${group.print_cover_line || ""}`;
  const coverUrl = `/api/v1/admin/pdf-delivery/preview-cover?group_id=${group.id}&v=${encodeURIComponent(coverKey)}`;
```

- [ ] **Step 2: Verify type-check**

Run: `npx tsc --noEmit`
Expected: no errors (`print_cover_line` exists on the type from Task 3).

- [ ] **Step 3: Commit**

```bash
git add components/profile/groups/BookPreviewPanel.tsx
git commit -m "fix(cover): bust preview-cover cache on cover line edits"
```

---

## Task 12: Add `cover_line` to the packaged book JSON

**Files:**
- Modify: `app/api/v1/admin/books/[groupId]/package/route.ts`

- [ ] **Step 1: Import the default**

Add near the top imports:

```ts
import { DEFAULT_COVER_LINE } from '@/lib/cover/layout';
```

- [ ] **Step 2: Select the column**

In the group `select` (line ~23), add `print_cover_line`:

```ts
      .select('couple_first_name, partner_first_name, couple_display_name, wedding_date, book_status, print_couple_name, couple_image_url, print_cover_line')
```

- [ ] **Step 3: Add it to the `bookData.couple` object**

In the `couple: { ... }` block (lines ~165–171), add:

```ts
        cover_line: group.print_cover_line || DEFAULT_COVER_LINE,
```

- [ ] **Step 4: Verify type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add app/api/v1/admin/books/[groupId]/package/route.ts
git commit -m "feat(cover): include cover_line in packaged book JSON"
```

---

## Task 13: New InDesign cover script version (reads the eyebrow from data)

**Files:**
- Create: `scripts/indesign/generate-cover_v<N>.jsx` (new version per the script-versioning rule)

> ⚠️ **Blocked on Ricardo:** confirm which script is the live one (`generate-cover.jsx` vs `generate-cover2.jsx`) before versioning. Replicate the full active file, then apply the single change below. Do NOT edit the existing file in place.

- [ ] **Step 1: Confirm the active script + version number with Ricardo**

Ask Ricardo which `.jsx` he currently runs and what the next version number should be.

- [ ] **Step 2: Copy the active script to the new version**

Run (example — substitute the confirmed source + N):

```bash
cp scripts/indesign/generate-cover.jsx scripts/indesign/generate-cover_v2.jsx
```

- [ ] **Step 3: Set the SUBHEAD contents from the packaged data**

In the new file, the SUBHEAD text frame is found via `findByLabel(doc, LABELS.SUBHEAD)` (front) and `LABELS.SUBTITLE_BACK` (back). After the data JSON is loaded (where `data.couple` / `coupleDisplayName` is read), set the front subhead's contents from `data.couple.cover_line`, falling back to the existing fixed text. Concretely, in `repositionFrontText` (or wherever the front subhead frame is obtained), add after `var subhead = findByLabel(doc, LABELS.SUBHEAD);`:

```jsx
    if (subhead && data && data.couple && data.couple.cover_line) {
        // Reason: eyebrow is now owner-editable; the template default is the fallback.
        subhead.contents = String(data.couple.cover_line).toUpperCase();
    }
```

(Adjust the variable name `data` to match how the script reads the book JSON in the active file.)

- [ ] **Step 4: Commit**

```bash
git add scripts/indesign/generate-cover_v2.jsx
git commit -m "feat(cover): new InDesign cover version reads editable eyebrow"
```

---

## Task 14: Full verification + Ricardo screenshot

- [ ] **Step 1: Run the test suite**

Run: `npx jest lib/cover/layout.test.ts`
Expected: PASS.

- [ ] **Step 2: Type-check + build**

Run: `npx tsc --noEmit && npm run build`
Expected: both succeed.

- [ ] **Step 3: Ask Ricardo to screenshot the redesigned Step 1**

Verify visually (per project rule — no Playwright):
- Live cover updates as you type the eyebrow and the name.
- Eyebrow is editable; cover reads e.g. "RECIPES FROM THE PEOPLE WHO LOVE / Richi".
- Counter appears only near the 40-char limit.
- The interior spread shows the photo landing on the left page of an open book; the right page shows the name + "A Small Plates Cookbook".
- On desktop, the cover stays visible (sticky) while scrolling to the photo block.

---

## Self-review notes (author)

- **Spec coverage:** Decisions 1–6 all map to tasks — layout/sticky (Task 9), live cover (Task 6), interior spread (Task 7), char limits (Task 8), eyebrow end-to-end (Tasks 2–5, 12–13), copy/defaults (Tasks 9–10). ✅
- **Type consistency:** `print_cover_line` (DB/API), `coverLine`/`onCoverLineChange` (component props), `cover_line` (JSON field) are used consistently throughout. `splitCoupleName`/`titleFontSize`/`DEFAULT_COVER_LINE` names match across Tasks 1, 2, 6, 7.
- **Known cross-task dependency:** Task 2's `select` needs Task 3's type; verify them together (noted in Task 2 Step 5).
- **Out of scope (v1):** photo recrop, mobile sticky-shrink, back-cover/subtitle editing.
