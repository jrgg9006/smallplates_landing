# Clean version as the source of truth in the user dashboard

**Date:** 2026-06-15
**Status:** Design — pending review
**Branch (suggested):** `feature/clean-version-dashboard`

---

## Problem

Recipes live in two places:

- `guest_recipes` — the **original** raw text the guest submitted.
- `recipe_print_ready` — the **cleaned** version (spelling + formatting fixed by the
  Railway AI agent). This is what the book and the Book Review flow actually use.

Today the **dashboard** (`RecipeDetailsModal`) shows and edits the *original*
(`guest_recipes`), while the **Book Review** flow shows and edits the *cleaned*
version (`recipe_print_ready`). The two surfaces write to different tables, so a
user who edits in the dashboard sees their change there but NOT in the review —
and not in the printed book. A real client hit exactly this.

Root cause: there is no single source of truth for "what gets printed."

## Goal

Make `recipe_print_ready` the single source of truth that the user sees and edits
in the dashboard. The original becomes read-only reference (and the baseline for
the originals annex + the original-vs-clean auditor). Whatever the user last saved
is what gets printed — no manual reconciliation between two versions.

Because the clean version is produced **asynchronously** after submission, the
design must also handle the window where cleaning is still running or has failed.

## Non-goals (explicitly out of scope)

- Retroactively fixing past recipes. The existing client data is being corrected
  **manually in Operations** by the founder. This design applies **going forward
  only** — no migration that rewrites historical rows.
- Building special handling for the rare "late clean arrives after the user already
  edited the fallback original" race (see Edge Cases). We accept today's behavior:
  the NEEDS REVIEW flag catches it for Operations.
- Changing the Railway cleaning agent, the image queue, or the Book Review flow
  (which already writes to `print_ready` correctly).

---

## Current state (verified in code)

- **Trigger:** cleaning is fire-and-forget at submission time.
  - Text recipes → `generateAndSaveMidjourneyPrompt(...)` in `lib/supabase/collection.ts`,
    called with `.catch()` that only logs. **No retry, no status tracking.**
  - Image recipes → inserted into `image_processing_queue`
    (`status` pending/processing/completed/failed, `attempts` max 3, `error_message`,
    `processed_at`). **Has status + retry.**
- **Write of the clean version:** `app/api/v1/ai-engine/{generate-prompt,process-image}/route.ts`
  call Railway, then upsert `recipe_print_ready` (`cleaning_version: 2`).
- **Signal that cleaning finished:** the existence of a `recipe_print_ready` row.
  There is no per-recipe "cleaning status" field outside the image queue.
- **Today's fallback:** both the dashboard and review render
  `pr?.x_clean || recipe.x` — i.e. they already fall back to the original when no
  clean row exists. A cleaning failure is currently invisible (user sees their
  original). This design intentionally preserves that graceful degradation.

---

## Design

### Display logic in the dashboard (`RecipeDetailsModal`)

The recipe is shown according to three states, derived from whether a
`recipe_print_ready` row exists:

| State | Condition | What the user sees |
|---|---|---|
| **Cleaned** (normal) | `print_ready` row exists | The **clean version**, editable. A subtle label + "View original" link. |
| **Processing** (transient) | No `print_ready` row, < 60s since submission | "Getting your recipe ready" — editing **blocked**, polling. |
| **Fallback** (failure) | No `print_ready` row, ≥ 60s | The **original**, editable (today's behavior). Editing it flags NEEDS REVIEW. |

### Edit target

- **Cleaned state:** edits write to `recipe_print_ready` (same path the Book Review
  PATCH already uses). The original (`guest_recipes`) is **read-only**.
- **Fallback state:** edits write to `guest_recipes` (today's behavior) and flag
  NEEDS REVIEW (`recipe_production_status.needs_review` via the existing DB trigger,
  plus `recipe_print_ready.needs_regeneration` is moot since no row exists yet —
  Operations re-cleans/reviews as today).

### Processing state + 60s timeout

- While in **Processing**, the modal shows the "Getting your recipe ready" copy,
  disables the editor, and **polls** for the `print_ready` row (e.g. every ~3s).
- As soon as the row appears → switch to **Cleaned** state (show the clean version).
- After **60 seconds** with no row → switch to **Fallback** state (show the
  editable original). This bounds the wait so a stuck/failed clean never traps the
  user on a spinner.
- Note: in practice the owner usually opens a recipe long after submission, so the
  clean already exists and Processing is rarely seen. The timeout is a safety net,
  mostly for genuine cleaning failures.

### Copy (approved)

**Processing (blocked, ~60s):**
> **Getting your recipe ready**
> We're cleaning up the spelling and formatting so it reads right in the book. Takes a few seconds.

**Fallback (after 60s, original is editable):**
> **Still cleaning this one up**
> For now you're looking at what was sent. Go ahead and edit it — we'll handle the formatting before it's printed.

**Cleaned-state label (subtle, minimal footprint):**
> This is the cleaned-up version that goes in your book. Edit anything you want. · **View original**

**Info (i) tooltip — explains the cleaning service:**
> Every recipe runs through a quick clean-up that fixes spelling and sets the formatting, so every page in the book reads the same way. Want to see exactly what was sent? Open **View original**.

Copy notes: avoids all banned brand words; does **not** promise the cleaner "never
changes anything" — it states what it does (spelling + formatting) and offers
"View original" as proof.

### "View original" affordance

In the Cleaned state, the user can open their original submission read-only to
compare. This is the trust mechanism behind the (i) tooltip. Visual treatment
should be quiet (a link/secondary action), not a second editor.

---

## UX principles (must-haves)

The experience must feel **clean, editorial, magical, simple, modern**. Concretely:

- No cramped or cluttered layouts. One clear thing to do per state.
- The three states are distinct and never shown at once. Transitions feel calm
  (e.g. a gentle reveal when the clean version lands), not a jarring swap.
- The "cleaned version" label and "View original" are subtle and low-footprint —
  they inform without competing with the recipe.
- Nothing confusing: the user should never wonder which version they're editing or
  whether their change "took."

---

## Data flow

```
Guest submits recipe
   └─ guest_recipes row created (original)            [synchronous]
   └─ cleaning triggered                              [async, fire-and-forget]
         └─ Railway agent → upsert recipe_print_ready (clean)

Owner opens recipe in dashboard
   ├─ print_ready exists?  ── yes ─→ CLEANED: show + edit clean (→ print_ready)
   │                                  original read-only ("View original")
   └─ no ─→ poll up to 60s
              ├─ row appears ─→ CLEANED
              └─ 60s elapsed ─→ FALLBACK: show + edit original (→ guest_recipes)
                                            editing flags NEEDS REVIEW (as today)
```

## Error handling

- **Cleaning never completes (failure):** handled by the 60s timeout → Fallback.
  Reuses today's NEEDS REVIEW path; no new error surface for the user.
- **Save to `print_ready` fails:** show inline error in the editor; do not lose the
  user's typed text (keep it in the textarea). Same pattern as the existing edit
  modal.
- **Polling never resolves but row exists with empty fields:** treat a present row
  as Cleaned (the agent only writes `print_ready` on `status === 'success'`).

## Edge cases

- **Late clean after fallback edit (rare; images only, which retry ≤3x):** the late
  clean creates `print_ready` from the pre-edit submitted text, which could shadow
  the user's fallback edit in the Cleaned view. Accepted: the NEEDS REVIEW flag
  (set when the original was edited) ensures Operations reviews it. **No special
  code.** Text recipes never hit this (no retry).
- **Owner opens a recipe seconds after submission:** sees Processing briefly, then
  the clean lands. Expected.

## Sequencing / rollout

- The display flip (dashboard shows `print_ready`) affects **all** recipes' rendering
  immediately, including past ones. The founder's **manual past-data correction in
  Operations must be complete before this ships**, or clients who edited in the old
  dashboard would suddenly see stale clean versions. (Per the conversation, the
  manual cleanup is already done.)

## Affected code (for the implementation plan)

- `components/profile/recipes/RecipeDetailsModal.tsx` — display logic (3 states),
  edit target switch, polling + 60s timeout, copy, "View original", (i) tooltip.
- Read path that feeds the modal — needs the recipe's `print_ready` (clean) fields
  alongside the original. Mirror what `app/api/v1/groups/[groupId]/review-recipes`
  already returns.
- Save path — Cleaned state should reuse the print_ready write used by the review
  PATCH (`recipe_print_ready` upsert + `recipe_edit_history` insert with
  `edit_target: 'print_ready'`), rather than the current `guest_recipes` update.

## Open questions

- None blocking. Polling interval (~3s) and exact 60s timeout are tunable defaults.
