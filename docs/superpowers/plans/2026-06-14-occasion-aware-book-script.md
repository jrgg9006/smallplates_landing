# Occasion-aware book generator (InDesign v17) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the printed book adapt page 3 (title) and page 11 (letter) to the group's occasion, leaving weddings/bridal showers byte-for-byte identical to v16 and recipes untouched.

**Architecture:** `fetch-book.js` exposes `groups.occasion` in the book JSON. A new `generate-book_v17.jsx` (copy of v16) reads `occasion` + `partner_first_name` and: (page 3) overwrites the title frame with a single name when there is no partner; (page 11) deletes whichever of two pre-styled letter frames does not apply. All page-11 copy lives in the InDesign template as two hand-styled frames; the script only deletes one.

**Tech Stack:** Node.js (`fetch-book.js`, Supabase JS client), Adobe InDesign ExtendScript (`.jsx`), Git.

**Verification note:** ExtendScript cannot be unit-tested headlessly, and per project convention UI/print output is verified by Ricardo's screenshots — not Playwright/headless. Automated checks here are limited to grep/syntax on the source; correctness of the generated book is confirmed by running v17 in InDesign against a wedding JSON (must equal v16) and a non-wedding JSON (must show the new behavior).

---

## File Structure

- `scripts/indesign/fetch-book.js` — **modify**: add `occasion` to the group query and to the `couple` block of the output JSON. (~2 lines.)
- `scripts/indesign/generate-book_v17.jsx` — **create**: exact copy of `generate-book_v16.jsx` plus version bump, 3 new `CONFIG` labels, 1 helper (`removeItemByLabel`), 2 functions (`applyTitleName`, `applyIntroMessage`), and 2 call sites in `main()`.
- InDesign master template (`.indd`) — **manual, by Ricardo**: add labels `{{TITLE_NAME}}`, `{{INTRO_WEDDING}}`, `{{INTRO_GENERIC}}` and create the second (generic) letter frame. Documented in Task 6.
- `docs/superpowers/specs/2026-06-14-occasion-aware-book-script-design.md` — the approved spec (already committed).

---

## Task 1: Expose `occasion` in the book JSON (`fetch-book.js`)

**Files:**
- Modify: `scripts/indesign/fetch-book.js:107` (the group `.select(...)`)
- Modify: `scripts/indesign/fetch-book.js:386-392` (the `couple` block of `bookData`)

- [ ] **Step 1: Add `occasion` to the group query**

In `scripts/indesign/fetch-book.js`, change the select on line 107 from:

```js
    .select('couple_first_name, partner_first_name, couple_display_name, wedding_date, couple_image_url, print_couple_name')
```

to:

```js
    .select('couple_first_name, partner_first_name, couple_display_name, wedding_date, couple_image_url, print_couple_name, occasion')
```

- [ ] **Step 2: Add `occasion` to the `couple` block of the output JSON**

In the `bookData` object, change the `couple` block (lines ~386-392) from:

```js
    couple: {
      couple_first_name: group.couple_first_name || '',
      partner_first_name: group.partner_first_name || '',
      couple_display_name: coupleDisplayName,
      wedding_date: group.wedding_date || null,
      local_image_path: coupleImageLocalPath
    },
```

to:

```js
    couple: {
      couple_first_name: group.couple_first_name || '',
      partner_first_name: group.partner_first_name || '',
      couple_display_name: coupleDisplayName,
      // Reason: drives occasion-aware pages in generate-book_v17.jsx (page 11
      // wedding vs neutral letter). Mirrors groups.occasion; null = legacy group.
      occasion: group.occasion || null,
      wedding_date: group.wedding_date || null,
      local_image_path: coupleImageLocalPath
    },
```

- [ ] **Step 3: Syntax-check the file**

Run: `node --check scripts/indesign/fetch-book.js`
Expected: no output, exit code 0 (file parses).

- [ ] **Step 4: Commit**

```bash
git add scripts/indesign/fetch-book.js
git commit -m "feat(book): expose groups.occasion in book JSON for v17"
```

---

## Task 2: Create `generate-book_v17.jsx` as a copy of v16

**Files:**
- Create: `scripts/indesign/generate-book_v17.jsx` (copy of `generate-book_v16.jsx`)

- [ ] **Step 1: Copy v16 to v17**

Run:

```bash
cp scripts/indesign/generate-book_v16.jsx scripts/indesign/generate-book_v17.jsx
```

- [ ] **Step 2: Bump the version header**

In `scripts/indesign/generate-book_v17.jsx`, change the top banner. Replace:

```js
// ============================================
// SMALL PLATES — Book Generator v1.14.0
//
```

with:

```js
// ============================================
// SMALL PLATES — Book Generator v1.15.0
//
// v1.15.0: OCCASION-AWARE front matter (v17).
//          Page 3 title: if no partner_first_name, overwrite {{TITLE_NAME}}
//          with couple_display_name (single name / book title, no ampersand).
//          Couples (partner present) keep the two-name title from the template.
//          Page 11 letter: two pre-styled frames live in the template,
//          {{INTRO_WEDDING}} and {{INTRO_GENERIC}}. Deletes the one that does
//          not apply. Weddings/bridal showers (and legacy null occasion) keep
//          the wedding letter, so output equals v16 for those groups.
//          Requires fetch-book.js that emits couple.occasion.
//
```

- [ ] **Step 3: Verify the copy is otherwise identical to v16**

Run:

```bash
diff scripts/indesign/generate-book_v16.jsx scripts/indesign/generate-book_v17.jsx
```

Expected: only the header banner differs (the changelog block added in Step 2). No other lines should differ yet.

- [ ] **Step 4: Commit**

```bash
git add scripts/indesign/generate-book_v17.jsx
git commit -m "chore(book): scaffold generate-book_v17 from v16"
```

---

## Task 3: Add `CONFIG` labels and the `removeItemByLabel` helper to v17

**Files:**
- Modify: `scripts/indesign/generate-book_v17.jsx` (`CONFIG.labels`-adjacent block and the SPREAD UTILITIES section)

- [ ] **Step 1: Add the three new label keys to `CONFIG`**

In `CONFIG`, the top-level keys currently include `imageFrameLabel`, `coupleImageLabel`, `qrImageLabel`, `repurchaseQRLabel`. Add the three occasion labels right after `repurchaseQRLabel`. Change:

```js
var CONFIG = {
    imageFrameLabel: "{{IMAGE}}",
    coupleImageLabel: "{{COUPLE_IMAGE}}",
    qrImageLabel: "{{QR_IMAGE}}",
    repurchaseQRLabel: "{{QR_REPURCHASE}}",
```

to:

```js
var CONFIG = {
    imageFrameLabel: "{{IMAGE}}",
    coupleImageLabel: "{{COUPLE_IMAGE}}",
    qrImageLabel: "{{QR_IMAGE}}",
    repurchaseQRLabel: "{{QR_REPURCHASE}}",

    // v17: occasion-aware front matter (page 3 title, page 11 letter)
    titleNameLabel: "{{TITLE_NAME}}",
    introWeddingLabel: "{{INTRO_WEDDING}}",
    introGenericLabel: "{{INTRO_GENERIC}}",
```

- [ ] **Step 2: Add the `removeItemByLabel` helper**

This helper removes a single labeled page item (not a spread). Place it in the `SPREAD UTILITIES` section, immediately after the existing `removeSpread` function (the function that ends with the `for` loop removing pages). Add:

```js
// Reason: v17 deletes one of two overlapping page-11 letter frames by its
// Script Label. Mirrors removeSpread's defensive style; no-ops if the label
// is absent (older master template) so generation never crashes.
function removeItemByLabel(doc, label) {
    var item = findItemByLabel(doc, label);
    if (!item) return false;
    try {
        item.remove();
        return true;
    } catch (e) {
        $.writeln("removeItemByLabel error for '" + label + "': " + e.message);
        return false;
    }
}
```

- [ ] **Step 3: Syntax sanity-check (brace/paren balance via node)**

ExtendScript is not Node, but it is close enough that `node --check` catches gross syntax errors (unbalanced braces, stray commas). Run:

Run: `cp scripts/indesign/generate-book_v17.jsx /tmp/v17check.js && node --check /tmp/v17check.js && echo OK; rm -f /tmp/v17check.js`
Expected: prints `OK` (node rejects the `.jsx` extension directly, so we check a `.js` copy). (If it errors on ExtendScript-only constructs, note that `node --check` parses plain ES; v16 already passes it, so any *new* error is from this task's edits — fix it.)

- [ ] **Step 4: Commit**

```bash
git add scripts/indesign/generate-book_v17.jsx
git commit -m "feat(book): v17 occasion labels + removeItemByLabel helper"
```

---

## Task 4: Add `applyTitleName` and `applyIntroMessage` functions to v17

**Files:**
- Modify: `scripts/indesign/generate-book_v17.jsx` (new functions in the `PERSONALIZE FIXED PAGES` section)

- [ ] **Step 1: Add `applyTitleName` (page 3 logic)**

Place this immediately after the existing `personalizeFixedPages` function (before `populateContributors`):

```js
// ============================================
// OCCASION-AWARE: PAGE 3 TITLE (v17)
// Reason: couples (a partner name exists) keep the two-name title and the
// golden ampersand from the template — v16's placeholder replacement already
// filled both names. Non-couple occasions have a single name (or a book
// title), so we overwrite the {{TITLE_NAME}} frame with couple_display_name
// (= print_couple_name || couple_display_name || "first & partner"). Setting
// .contents drops the ampersand's character styling naturally.
// ============================================
function applyTitleName(doc, bookData) {
    var partner = getNestedValue(bookData, "couple.partner_first_name");
    var hasPartner = partner && String(partner).replace(/\s/g, "").length > 0;
    if (hasPartner) {
        $.writeln("  Title: couple (partner present) — leaving template two-name title");
        return;
    }

    var frame = findItemByLabel(doc, CONFIG.titleNameLabel);
    if (!frame) {
        $.writeln("  Title: '" + CONFIG.titleNameLabel + "' frame not found — skipping (older master?)");
        return;
    }

    var title = getNestedValue(bookData, "couple.couple_display_name") || "";
    try {
        frame.contents = String(title);
        $.writeln("  Title: single-name set -> " + title);
    } catch (e) {
        $.writeln("  Title set error: " + e.message);
    }
}
```

- [ ] **Step 2: Add `applyIntroMessage` (page 11 logic)**

Place it immediately after `applyTitleName`:

```js
// ============================================
// OCCASION-AWARE: PAGE 11 LETTER (v17)
// Reason: two pre-styled letter frames live on page 11 of the template,
// {{INTRO_WEDDING}} (current wedding letter) and {{INTRO_GENERIC}} (neutral
// letter). We delete the one that does not apply; deleting (not rewriting)
// preserves every hand-applied paragraph/character style (e.g. the bold
// closing line). Weddings/bridal showers and legacy groups with no occasion
// keep the wedding letter, so the result equals v16 for those groups.
// ============================================
function applyIntroMessage(doc, bookData) {
    var occasion = getNestedValue(bookData, "couple.occasion");
    var isWedding = !occasion || occasion === "wedding" || occasion === "bridal_shower";

    var labelToRemove = isWedding ? CONFIG.introGenericLabel : CONFIG.introWeddingLabel;
    var labelToKeep = isWedding ? CONFIG.introWeddingLabel : CONFIG.introGenericLabel;

    var removed = removeItemByLabel(doc, labelToRemove);
    $.writeln("  Intro: occasion=" + (occasion || "(none)") +
              " isWedding=" + isWedding +
              " kept=" + labelToKeep +
              " removed=" + (removed ? labelToRemove : "(frame not found)"));
}
```

- [ ] **Step 3: Syntax-check**

Run: `cp scripts/indesign/generate-book_v17.jsx /tmp/v17check.js && node --check /tmp/v17check.js && echo OK; rm -f /tmp/v17check.js`
Expected: prints `OK` (node rejects the `.jsx` extension directly, so we check a `.js` copy).

- [ ] **Step 4: Commit**

```bash
git add scripts/indesign/generate-book_v17.jsx
git commit -m "feat(book): v17 applyTitleName + applyIntroMessage functions"
```

---

## Task 5: Wire the functions into `main()` and bump on-screen version strings

**Files:**
- Modify: `scripts/indesign/generate-book_v17.jsx` (`main()` — STEP 4 area, the confirm dialog, the report alert)

- [ ] **Step 1: Call the two functions right after `personalizeFixedPages`**

In `main()`, find STEP 4:

```js
    // ── STEP 4: Personalize fixed pages ──
    $.writeln("\n=== Personalizing fixed pages ===");
    personalizeFixedPages(doc, bookData);
```

Replace it with:

```js
    // ── STEP 4: Personalize fixed pages ──
    $.writeln("\n=== Personalizing fixed pages ===");
    personalizeFixedPages(doc, bookData);

    // ── STEP 4a: Occasion-aware front matter (v17) ──
    // Reason: page 3 title (single name vs couple) and page 11 letter
    // (wedding vs neutral). Runs after personalizeFixedPages so the page-3
    // override wins over the generic placeholder replacement.
    $.writeln("\n=== Occasion-aware front matter ===");
    applyTitleName(doc, bookData);
    applyIntroMessage(doc, bookData);
```

- [ ] **Step 2: Bump the confirm dialog version**

Find:

```js
    if (!confirm("SMALL PLATES - Book Generator v1.14.0\n\n" +
```

Replace with:

```js
    if (!confirm("SMALL PLATES - Book Generator v1.15.0\n\n" +
```

- [ ] **Step 3: Bump the report alert version**

Find:

```js
    var msg = "LIBRO GENERADO (v1.14.0)\n\n";
```

Replace with:

```js
    var msg = "LIBRO GENERADO (v1.15.0)\n\n";
```

- [ ] **Step 4: Add occasion to the report alert**

Find (near the end of `main`, after the couple image line):

```js
    msg += "\nCouple image: " + (coupleImagePlaced ? "Placed" : "None");
```

Replace with:

```js
    msg += "\nCouple image: " + (coupleImagePlaced ? "Placed" : "None");

    // Reason: surface which front-matter variant was produced so the operator
    // can sanity-check it without opening pages 3 and 11.
    var reportOccasion = getNestedValue(bookData, "couple.occasion") || "(none)";
    var reportPartner = getNestedValue(bookData, "couple.partner_first_name");
    var reportHasPartner = reportPartner && String(reportPartner).replace(/\s/g, "").length > 0;
    msg += "\nOccasion: " + reportOccasion +
           " | Page 3: " + (reportHasPartner ? "two names" : "single name") +
           " | Page 11: " + ((!getNestedValue(bookData, "couple.occasion") ||
               getNestedValue(bookData, "couple.occasion") === "wedding" ||
               getNestedValue(bookData, "couple.occasion") === "bridal_shower") ? "wedding letter" : "neutral letter");
```

- [ ] **Step 5: Syntax-check**

Run: `cp scripts/indesign/generate-book_v17.jsx /tmp/v17check.js && node --check /tmp/v17check.js && echo OK; rm -f /tmp/v17check.js`
Expected: prints `OK` (node rejects the `.jsx` extension directly, so we check a `.js` copy).

- [ ] **Step 6: Commit**

```bash
git add scripts/indesign/generate-book_v17.jsx
git commit -m "feat(book): wire occasion-aware front matter into v17 main()"
```

---

## Task 6: InDesign master template changes (manual — Ricardo)

> This task is performed by hand in the `.indd` master template. The script
> no-ops gracefully if any label is missing, but the feature only works once
> these labels exist. Document, then have Ricardo confirm.

**Files:**
- The InDesign master template `.indd` (not in git).

- [ ] **Step 1: Label the page-3 title frame**

In InDesign, open the master template. Select the page-3 title text frame (the one
that reads `<<couple_first_name>> & <<partner_first_name>>`). Open
**Window ▸ Utilities ▸ Script Label** and set the label to exactly:

```
{{TITLE_NAME}}
```

(No spaces, exactly two curly braces each side.)

- [ ] **Step 2: Label the existing page-11 letter frame as the wedding variant**

Select the page-11 letter text frame (the long wedding letter). Set its Script Label to:

```
{{INTRO_WEDDING}}
```

- [ ] **Step 3: Create the generic letter frame**

Duplicate the page-11 letter frame in place (Edit ▸ Copy, then Edit ▸ Paste in Place)
so it sits exactly over the original. Replace its text with the approved neutral copy:

> Not by our hands — by theirs. The people in these pages showed up for you. Not just on the day — here, in this book. They chose a recipe, wrote a note, and gave you something from their kitchen to make it yours.
>
> Some of these recipes have been in families for generations. Others were invented last Tuesday. It doesn't matter. What matters is that every page has a name, and every name is someone who wanted to be part of your kitchen.
>
> This isn't a book to display. It's a book to use. Stain it. Fold the corners. Cook something on a Wednesday night because a recipe reminded you of someone — and then call them.
>
> **The day ends. This book is what stays.**

Re-apply the same paragraph/character styling the wedding frame uses (notably the
bold/separated closing line). Then set this duplicate's Script Label to:

```
{{INTRO_GENERIC}}
```

- [ ] **Step 4: Save the master template and confirm labels**

Save the `.indd`. Confirm via **Script Label** panel that the three labels exist on
the correct frames. (Optional sanity: the v17 report alert will print
`removed=(frame not found)` if a label is missing when you run it.)

---

## Task 7: End-to-end verification in InDesign (manual — Ricardo)

**Files:** none (runtime verification).

- [ ] **Step 1: Regenerate a wedding JSON and confirm parity with v16**

Run `fetch-book_v2.js` for a wedding group (occasion `wedding` or `bridal_shower`, or a
legacy group with null occasion). Open the master template, run
`generate-book_v17.jsx`. Verify:
- Page 3 shows both names + the golden ampersand (unchanged).
- Page 11 shows the original wedding letter (unchanged), bold closing line intact.
- The report alert reads `Page 3: two names | Page 11: wedding letter`.

Expected: visually identical to a v16 run. Capture a screenshot of pages 3 and 11.

- [ ] **Step 2: Regenerate a non-wedding JSON and confirm new behavior**

Run `fetch-book_v2.js` for a birthday/graduation group (single name, no partner, occasion
not wedding/bridal). Run `generate-book_v17.jsx`. Verify:
- Page 3 shows the single name / book title, no ampersand.
- Page 11 shows the neutral letter, with its bold closing line intact (proves the
  delete-frame approach preserved styling).
- The report alert reads `Page 3: single name | Page 11: neutral letter`.

Expected: occasion-correct front matter. Capture a screenshot of pages 3 and 11 for
Ricardo to confirm.

- [ ] **Step 3: Confirm with Ricardo**

Share both screenshots. Only mark the feature complete once Ricardo confirms both the
wedding (parity) and non-wedding (new copy + single name) outputs look right.

---

## Self-review notes

- **Spec coverage:** fetch-book.js occasion (Task 1) ✓; v17 scaffold (Task 2) ✓; labels + helper (Task 3) ✓; page-3 + page-11 functions (Task 4) ✓; wiring + version strings (Task 5) ✓; template labels + two frames + neutral copy (Task 6) ✓; wedding-parity + non-wedding verification (Task 7) ✓.
- **Graceful degradation:** every new label lookup no-ops if absent (mirrors `{{QR_REPURCHASE}}`), so an out-of-date master never crashes generation.
- **Naming consistency:** `applyTitleName`, `applyIntroMessage`, `removeItemByLabel`, and the CONFIG keys `titleNameLabel` / `introWeddingLabel` / `introGenericLabel` are used identically across Tasks 3–5.
- **`isWedding` rule** matches the codebase convention (`!occasion || 'wedding' || 'bridal_shower'`); `anniversary` intentionally gets two names on page 3 (Task 4 partner check) but the neutral letter on page 11 (Task 4 occasion check).
