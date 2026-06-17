# Clean Version as Source of Truth in the Dashboard — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the user dashboard (`RecipeDetailsModal`) show and edit the cleaned version (`recipe_print_ready`) as the single source of truth, with a processing state while cleaning runs and a 60s timeout that falls back to the editable original.

**Architecture:** A pure helper decides which of three view states applies (`cleaned` / `processing` / `fallback`) from "does a print_ready row exist" + "how long since the recipe was created". A new user-scoped server endpoint reads and writes the clean version with the admin client (RLS-safe, mirrors the existing Book Review PATCH). The modal consumes both: it fetches state on open, polls while processing, and switches its editor target and copy per state.

**Tech Stack:** Next.js 14 App Router (route handlers), TypeScript strict, React (client component), Supabase admin client, Jest + ts (pure-logic unit tests). UI verified via screenshots from the founder (no headless/Playwright — see [[feedback_verify_via_user_screenshot]]).

---

## Background facts (verified in code)

- The cleaned version lives in `recipe_print_ready` with columns: `recipe_name_clean`, `ingredients_clean`, `instructions_clean`, `note_clean`, plus `cleaning_version`, `needs_regeneration`, `agent_metadata`, `updated_at`.
- Its existence is the only signal that cleaning finished (no per-recipe status field outside the image queue).
- `guest_recipes` (the original) has `created_at` (ISO string) — used for the 60s window.
- The Book Review PATCH (`app/api/v1/groups/[groupId]/review-recipes/route.ts`) already writes `recipe_print_ready` + inserts `recipe_edit_history` with `edit_target: 'print_ready'` using the admin client. The new endpoint mirrors its write shape.
- `RecipeDetailsModal` is rendered by `components/profile/groups/RedesignedGroupsSection.tsx` and `components/profile/recipes/RecipeTable.tsx`. It receives a `RecipeWithGuest` prop and already loads groups/guests/permissions client-side on open.
- Today the modal edits `guest_recipes` (original) and flags `recipe_print_ready.needs_regeneration = true`. The **fallback** path keeps exactly this behavior. The **cleaned** path replaces it with a write to `recipe_print_ready`.

## File Structure

- **Create** `lib/recipes/cleanVersionState.ts` — pure state logic. One responsibility: given inputs, return the view state. No React, no Supabase.
- **Create** `lib/recipes/cleanVersionState.test.ts` — unit tests for the helper.
- **Create** `app/api/v1/recipes/[recipeId]/clean/route.ts` — user-scoped GET (returns `{ print_ready, can_edit }`) and PATCH (saves clean version + audit row).
- **Modify** `components/profile/recipes/RecipeDetailsModal.tsx` — fetch state on open, poll while processing, render per-state copy, switch editor source + save target, add subtle "cleaned version" label, "View original", and the (i) tooltip.
- **Modify** `lib/types/database.ts` — only if a shared type is needed for the endpoint response (a local interface in the route is acceptable; prefer local to avoid churn).

---

## Task 1: Pure view-state helper (TDD)

**Files:**
- Create: `lib/recipes/cleanVersionState.ts`
- Test: `lib/recipes/cleanVersionState.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// lib/recipes/cleanVersionState.test.ts
import { getRecipeViewState, CLEANING_TIMEOUT_MS } from './cleanVersionState';

const CREATED = '2026-06-16T00:00:00.000Z';
const createdMs = new Date(CREATED).getTime();

describe('getRecipeViewState', () => {
  it('returns "cleaned" whenever a print_ready row exists, regardless of time', () => {
    expect(getRecipeViewState({ hasPrintReady: true, recipeCreatedAt: CREATED, now: createdMs })).toBe('cleaned');
    expect(getRecipeViewState({ hasPrintReady: true, recipeCreatedAt: CREATED, now: createdMs + 10 * 60_000 })).toBe('cleaned');
  });

  it('returns "processing" when no print_ready and within the timeout window', () => {
    expect(getRecipeViewState({ hasPrintReady: false, recipeCreatedAt: CREATED, now: createdMs + 5_000 })).toBe('processing');
  });

  it('returns "fallback" when no print_ready and the timeout has elapsed', () => {
    expect(getRecipeViewState({ hasPrintReady: false, recipeCreatedAt: CREATED, now: createdMs + CLEANING_TIMEOUT_MS })).toBe('fallback');
    expect(getRecipeViewState({ hasPrintReady: false, recipeCreatedAt: CREATED, now: createdMs + 10 * 60_000 })).toBe('fallback');
  });

  it('treats the exact timeout boundary as fallback (>=)', () => {
    expect(getRecipeViewState({ hasPrintReady: false, recipeCreatedAt: CREATED, now: createdMs + CLEANING_TIMEOUT_MS - 1 })).toBe('processing');
    expect(getRecipeViewState({ hasPrintReady: false, recipeCreatedAt: CREATED, now: createdMs + CLEANING_TIMEOUT_MS })).toBe('fallback');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest lib/recipes/cleanVersionState.test.ts`
Expected: FAIL — cannot find module `./cleanVersionState`.

- [ ] **Step 3: Write minimal implementation**

```ts
// lib/recipes/cleanVersionState.ts

// Reason: the existence of a recipe_print_ready row is the only signal that
// cleaning finished. We never need a separate "processing started" timestamp —
// the recipe's created_at bounds the wait. An old, never-cleaned recipe lands
// straight in "fallback" (no spinner), which is what we want.
export type RecipeViewState = 'cleaned' | 'processing' | 'fallback';

export const CLEANING_TIMEOUT_MS = 60_000;

export function getRecipeViewState(params: {
  hasPrintReady: boolean;
  recipeCreatedAt: string; // ISO timestamp from guest_recipes.created_at
  now: number; // Date.now()
  timeoutMs?: number;
}): RecipeViewState {
  const { hasPrintReady, recipeCreatedAt, now, timeoutMs = CLEANING_TIMEOUT_MS } = params;
  if (hasPrintReady) return 'cleaned';
  const elapsed = now - new Date(recipeCreatedAt).getTime();
  return elapsed < timeoutMs ? 'processing' : 'fallback';
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest lib/recipes/cleanVersionState.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/recipes/cleanVersionState.ts lib/recipes/cleanVersionState.test.ts
git commit -m "feat(recipes): pure view-state helper for clean/processing/fallback"
```

---

## Task 2: User-scoped server endpoint for the clean version

**Files:**
- Create: `app/api/v1/recipes/[recipeId]/clean/route.ts`

This endpoint is RLS-safe (admin client + explicit permission check) and mirrors the write shape of the Book Review PATCH. Permission rule = the modal's existing `canEdit`: the user is the recipe creator OR a member of a group the recipe belongs to.

- [ ] **Step 1: Write the route handler**

```ts
// app/api/v1/recipes/[recipeId]/clean/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseRoute } from '@/lib/supabase/route';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

// Reason: mirrors canEdit in RecipeDetailsModal — creator OR member of any group
// the recipe is active in. Uses the admin client so RLS/column grants on
// recipe_print_ready never block a legitimate edit.
async function canUserEditRecipe(userId: string, recipeId: string): Promise<boolean> {
  const admin = createSupabaseAdminClient();

  const { data: recipe } = await admin
    .from('guest_recipes')
    .select('user_id')
    .eq('id', recipeId)
    .is('deleted_at', null)
    .maybeSingle();

  if (!recipe) return false;
  if (recipe.user_id === userId) return true;

  const { data: groupRecipes } = await admin
    .from('group_recipes')
    .select('group_id')
    .eq('recipe_id', recipeId)
    .is('removed_at', null);

  const groupIds = (groupRecipes || []).map((g) => g.group_id);
  if (groupIds.length === 0) return false;

  const { data: membership } = await admin
    .from('group_members')
    .select('group_id')
    .eq('profile_id', userId)
    .in('group_id', groupIds)
    .limit(1);

  return !!(membership && membership.length > 0);
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ recipeId: string }> }
) {
  const supabase = await createSupabaseRoute();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const { recipeId } = await params;
  const canEdit = await canUserEditRecipe(user.id, recipeId);
  if (!canEdit) return NextResponse.json({ error: 'Not allowed' }, { status: 403 });

  const admin = createSupabaseAdminClient();
  const { data: printReady } = await admin
    .from('recipe_print_ready')
    .select('recipe_name_clean, ingredients_clean, instructions_clean, note_clean')
    .eq('recipe_id', recipeId)
    .maybeSingle();

  return NextResponse.json({ print_ready: printReady || null, can_edit: true });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ recipeId: string }> }
) {
  const supabase = await createSupabaseRoute();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const { recipeId } = await params;
  const canEdit = await canUserEditRecipe(user.id, recipeId);
  if (!canEdit) return NextResponse.json({ error: 'Not allowed' }, { status: 403 });

  const body = await req.json();
  const { recipe_name, ingredients, instructions, note } = body as {
    recipe_name: string; ingredients: string; instructions: string; note: string | null;
  };

  if (!recipe_name?.trim() || !ingredients?.trim() || !instructions?.trim()) {
    return NextResponse.json({ error: 'Name, ingredients and instructions are required' }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();

  // Snapshot the current clean version for the audit trail.
  const { data: current } = await admin
    .from('recipe_print_ready')
    .select('recipe_name_clean, ingredients_clean, instructions_clean, note_clean')
    .eq('recipe_id', recipeId)
    .maybeSingle();

  const { error: historyError } = await admin
    .from('recipe_edit_history')
    .insert({
      recipe_id: recipeId,
      edited_by: user.id,
      edit_target: 'print_ready',
      recipe_name_before: current?.recipe_name_clean || '',
      ingredients_before: current?.ingredients_clean || '',
      instructions_before: current?.instructions_clean || '',
      comments_before: current?.note_clean || null,
      recipe_name_after: recipe_name.trim(),
      ingredients_after: ingredients.trim(),
      instructions_after: instructions.trim(),
      comments_after: note?.trim() || null,
      edit_reason: 'Edited by recipe owner (clean version)',
    });
  if (historyError) {
    return NextResponse.json({ error: historyError.message }, { status: 500 });
  }

  const printReady = {
    recipe_name_clean: recipe_name.trim(),
    ingredients_clean: ingredients.trim(),
    instructions_clean: instructions.trim(),
    note_clean: note?.trim() || null,
  };

  const { error: upsertError } = await admin
    .from('recipe_print_ready')
    .upsert({ recipe_id: recipeId, ...printReady, updated_at: new Date().toISOString() }, { onConflict: 'recipe_id' });
  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, print_ready: printReady });
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors. (If `createSupabaseRoute`/`createSupabaseAdminClient` import paths differ, match the imports used in `app/api/v1/groups/[groupId]/review-recipes/route.ts`.)

- [ ] **Step 3: Manual smoke test (logged in, dev server running)**

Start dev: `npm run dev`. In the browser devtools console while logged in as a user who can edit recipe `<RID>`:

```js
await fetch('/api/v1/recipes/<RID>/clean').then(r => r.json()); // → { print_ready: {...}|null, can_edit: true }
```

Expected: 200 with the clean fields (or `null` if not cleaned). A recipe the user cannot edit returns 403.

- [ ] **Step 4: Commit**

```bash
git add app/api/v1/recipes/[recipeId]/clean/route.ts
git commit -m "feat(recipes): user-scoped endpoint to read/write the clean version"
```

---

## Task 3: Modal fetches clean state on open

**Files:**
- Modify: `components/profile/recipes/RecipeDetailsModal.tsx`

Add state for the clean version + view state, fetched from the new endpoint when the modal opens. Reuses the existing `RecipeViewState` helper.

- [ ] **Step 1: Add imports and state**

Near the top imports add:

```tsx
import { getRecipeViewState, type RecipeViewState, CLEANING_TIMEOUT_MS } from "@/lib/recipes/cleanVersionState";
```

Inside the component, with the other `useState` declarations, add:

```tsx
type CleanFields = {
  recipe_name_clean: string;
  ingredients_clean: string;
  instructions_clean: string;
  note_clean: string | null;
};
const [printReady, setPrintReady] = useState<CleanFields | null>(null);
const [viewState, setViewState] = useState<RecipeViewState>('processing');
const [cleanLoaded, setCleanLoaded] = useState(false);
const [showOriginal, setShowOriginal] = useState(false); // "View original" toggle in cleaned state
```

- [ ] **Step 2: Fetch the clean version when the modal opens**

Add an effect (place it after the existing "load groups" effect):

```tsx
// Reason: the clean version (recipe_print_ready) is the source of truth the user
// sees/edits. Fetch it via the server endpoint (RLS-safe). Existence + recipe age
// drive which of the three states (cleaned/processing/fallback) we render.
useEffect(() => {
  if (!localRecipe || !isOpen) return;
  let cancelled = false;
  setCleanLoaded(false);
  const load = async () => {
    try {
      const res = await fetch(`/api/v1/recipes/${localRecipe.id}/clean`);
      const json = await res.json();
      if (cancelled) return;
      const pr: CleanFields | null = res.ok ? json.print_ready : null;
      setPrintReady(pr);
      setViewState(getRecipeViewState({
        hasPrintReady: !!pr,
        recipeCreatedAt: localRecipe.created_at,
        now: Date.now(),
      }));
    } catch {
      if (!cancelled) {
        setPrintReady(null);
        setViewState(getRecipeViewState({
          hasPrintReady: false,
          recipeCreatedAt: localRecipe.created_at,
          now: Date.now(),
        }));
      }
    } finally {
      if (!cancelled) setCleanLoaded(true);
    }
  };
  load();
  return () => { cancelled = true; };
}, [localRecipe?.id, isOpen]);
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add components/profile/recipes/RecipeDetailsModal.tsx
git commit -m "feat(recipes): fetch clean version + view state when modal opens"
```

---

## Task 4: Processing state with polling + 60s timeout

**Files:**
- Modify: `components/profile/recipes/RecipeDetailsModal.tsx`

- [ ] **Step 1: Add the polling effect**

Add after the fetch effect from Task 3:

```tsx
// Reason: while cleaning is in flight we poll for the print_ready row every 3s and
// recompute the state (elapsed grows toward the 60s timeout). We stop as soon as
// the clean version lands (→ cleaned) or the timeout elapses (→ fallback).
useEffect(() => {
  if (!localRecipe || !isOpen || viewState !== 'processing') return;
  const tick = async () => {
    try {
      const res = await fetch(`/api/v1/recipes/${localRecipe.id}/clean`);
      const json = await res.json();
      const pr: CleanFields | null = res.ok ? json.print_ready : null;
      if (pr) setPrintReady(pr);
      setViewState(getRecipeViewState({
        hasPrintReady: !!pr,
        recipeCreatedAt: localRecipe.created_at,
        now: Date.now(),
      }));
    } catch {
      setViewState(getRecipeViewState({
        hasPrintReady: false,
        recipeCreatedAt: localRecipe.created_at,
        now: Date.now(),
      }));
    }
  };
  const interval = setInterval(tick, 3000);
  return () => clearInterval(interval);
}, [localRecipe?.id, isOpen, viewState]);
```

- [ ] **Step 2: Render the processing block**

Add a processing UI that replaces the recipe body when `viewState === 'processing'`. Insert this as the first branch inside both `desktopContent` and `mobileContent`, before the existing guest-name row (so it takes over the body). Use a shared snippet placed above those definitions:

```tsx
const processingBlock = (
  <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-16">
    <div className="animate-spin rounded-full h-7 w-7 border-2 border-gray-200 border-t-[hsl(var(--brand-honey))] mb-5" />
    <h3 className="font-serif text-2xl text-brand-charcoal mb-2">Getting your recipe ready</h3>
    <p className="text-sm text-gray-500 max-w-sm leading-relaxed">
      We&apos;re cleaning up the spelling and formatting so it reads right in the book. Takes a few seconds.
    </p>
  </div>
);
```

Then in `desktopContent` and `mobileContent`, return early when processing. At the top of each JSX (inside the outer wrapper `<div>`), add:

```tsx
{viewState === 'processing' ? processingBlock : (
  <>
    {/* existing content of desktopContent / mobileContent goes here */}
  </>
)}
```

Also disable the Edit pencil while processing: the Edit button already renders only when `canEdit && !isEditMode`; add `&& viewState !== 'processing'` to that condition in both `desktopContent` and `mobileContent`.

- [ ] **Step 3: Verify (screenshot)**

Run `npm run dev`. Ask the founder for a screenshot: open a recipe whose `recipe_print_ready` row was just deleted/absent and `created_at` is < 60s old (or temporarily lower `CLEANING_TIMEOUT_MS` to 5_000 in `lib/recipes/cleanVersionState.ts` for the demo, then revert). Expect the spinner + "Getting your recipe ready" copy, and the spinner replaced by content once a print_ready row exists. Per [[feedback_verify_via_user_screenshot]] we confirm by screenshot, not headless.

- [ ] **Step 4: Commit**

```bash
git add components/profile/recipes/RecipeDetailsModal.tsx
git commit -m "feat(recipes): processing state with 3s polling and 60s timeout"
```

---

## Task 5: Cleaned vs fallback — display source, copy, and save target

**Files:**
- Modify: `components/profile/recipes/RecipeDetailsModal.tsx`

In **cleaned** state the modal shows/edits the clean fields and saves to the new endpoint. In **fallback** state it shows/edits the original and keeps today's behavior (writes `guest_recipes` + flags `needs_regeneration`/NEEDS REVIEW).

- [ ] **Step 1: Compute the displayed (read-only view) fields by state**

Just after `const guest = localRecipe.guests;` add:

```tsx
// Reason: cleaned state shows the clean version (source of truth); fallback shows
// the original. "View original" temporarily reveals the raw submission in cleaned.
const inCleaned = viewState === 'cleaned' && !!printReady;
const displayName = inCleaned && !showOriginal ? printReady!.recipe_name_clean : localRecipe.recipe_name;
const displayIngredients = inCleaned && !showOriginal ? printReady!.ingredients_clean : localRecipe.ingredients;
const displayInstructions = inCleaned && !showOriginal ? printReady!.instructions_clean : localRecipe.instructions;
const displayNote = inCleaned && !showOriginal ? printReady!.note_clean : localRecipe.comments;
```

Then replace the read-mode references in `desktopContent`/`mobileContent` that currently use `localRecipe.recipe_name` / `localRecipe.ingredients` / `localRecipe.instructions` / `localRecipe.comments` with `displayName` / `displayIngredients` / `displayInstructions` / `displayNote` respectively (read mode only — the processing block and edit textareas are handled separately).

- [ ] **Step 2: Initialize the edit form from the active source**

In the existing "Initialize form state when entering edit mode" effect, change the seed so cleaned state seeds from the clean version:

```tsx
useEffect(() => {
  if (localRecipe && isEditMode) {
    if (viewState === 'cleaned' && printReady) {
      setRecipeTitle(printReady.recipe_name_clean || '');
      setRecipeIngredients(printReady.ingredients_clean || '');
      setRecipeInstructions(printReady.instructions_clean || '');
      setRecipeNotes(printReady.note_clean || '');
    } else {
      setRecipeTitle(localRecipe.recipe_name || '');
      setRecipeIngredients(localRecipe.ingredients || '');
      setRecipeInstructions(localRecipe.instructions || '');
      setRecipeNotes(localRecipe.comments || '');
    }
    setSelectedGuestId(localRecipe.guest_id);
    setError(null);
  }
}, [localRecipe, isEditMode, viewState, printReady]);
```

- [ ] **Step 2b: Add a `editReason`/route switch in `handleSave`**

In `handleSave`, after validation and the guest-change handling, branch the text write by state. Replace the current `updateRecipe(...)` + `needs_regeneration` block with:

```tsx
if (viewState === 'cleaned') {
  // Source of truth = recipe_print_ready. Save via the user-scoped endpoint
  // (admin client server-side). The original stays untouched.
  const res = await fetch(`/api/v1/recipes/${localRecipe.id}/clean`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      recipe_name: after.recipe_name,
      ingredients: after.ingredients,
      instructions: after.instructions,
      note: after.comments,
    }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    setError(json.error || 'Failed to save');
    setLoading(false);
    return;
  }
  setPrintReady(json.print_ready);
} else {
  // Fallback (no clean version yet): keep today's behavior — write the original
  // and flag the print-ready as stale / NEEDS REVIEW.
  const { error: updateError } = await updateRecipe(localRecipe.id, after);
  if (updateError) {
    setError(updateError);
    setLoading(false);
    return;
  }
  if (textChanged || guestChanged) {
    const supabase = (await import('@/lib/supabase/client')).createSupabaseClient();
    const { error: staleError } = await supabase
      .from('recipe_print_ready')
      .update({ needs_regeneration: true })
      .eq('recipe_id', localRecipe.id);
    if (staleError) console.error('Failed to flag print-ready as stale:', staleError);
  }
}
```

Keep the existing guest-change `logRecipeEdit` block as-is (guest reassignment still applies in both states). After a successful cleaned-state save, the local `setLocalRecipe({...})` update should NOT overwrite the original text fields — only update guest fields. Adjust the existing `setLocalRecipe` call so that in cleaned state it spreads `localRecipe` without `...after` for the text columns:

```tsx
setLocalRecipe({
  ...localRecipe,
  ...(viewState === 'cleaned' ? {} : after),
  guest_id: guestChanged ? selectedGuestId : localRecipe.guest_id,
  guests: guestChanged && newGuest ? { /* unchanged from current code */ } : localRecipe.guests,
});
```

(Leave the `guests` object exactly as the current code builds it.)

- [ ] **Step 3: Add the subtle cleaned-state label + View original toggle**

In read mode of `desktopContent` and `mobileContent`, directly under the guest-name row, render this only when `inCleaned`:

```tsx
{inCleaned && !isEditMode && (
  <div className="flex items-center gap-2 mb-3 text-xs text-gray-400">
    <span>This is the cleaned-up version that goes in your book.</span>
    <button
      type="button"
      onClick={() => setShowOriginal((v) => !v)}
      className="underline underline-offset-2 hover:text-gray-600 transition-colors"
    >
      {showOriginal ? 'View cleaned' : 'View original'}
    </button>
  </div>
)}
```

- [ ] **Step 4: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Verify (screenshots)**

Run `npm run dev`. Ask the founder for screenshots:
1. Open a normally-cleaned recipe → sees the clean version + the subtle label + "View original". Toggling shows the raw original read-only.
2. Edit in cleaned state, change instructions, Save → reopen Book Review for that group → the change is reflected (because it wrote `recipe_print_ready`). Confirm a new `recipe_edit_history` row with `edit_target = 'print_ready'`.
3. Open an old never-cleaned recipe (no print_ready, created > 60s ago) → sees the original (fallback), editing it flags NEEDS REVIEW in Operations as before.

- [ ] **Step 6: Commit**

```bash
git add components/profile/recipes/RecipeDetailsModal.tsx
git commit -m "feat(recipes): cleaned-state edits write print_ready; fallback keeps original path"
```

---

## Task 6: The (i) info tooltip explaining the cleaning service

**Files:**
- Modify: `components/profile/recipes/RecipeDetailsModal.tsx`

A small, quiet info affordance near the "Recipe Details" title that explains the clean-up. Keep it subtle (an `(i)` icon revealing a popover/tooltip on hover/click) — must not crowd the header.

- [ ] **Step 1: Add an info icon + tooltip near the modal title**

Import the icon (lucide `Info`) alongside the existing lucide imports:

```tsx
import { Edit, Download, ChevronDown, Plus, Info } from "lucide-react";
```

Add local state with the other `useState`s:

```tsx
const [showCleaningInfo, setShowCleaningInfo] = useState(false);
```

In both the desktop `DialogHeader` and mobile `SheetHeader`, render the icon next to the title:

```tsx
<div className="relative inline-flex items-center gap-2">
  <span>Recipe Details</span>
  <button
    type="button"
    aria-label="About the clean-up"
    onClick={() => setShowCleaningInfo((v) => !v)}
    className="text-gray-300 hover:text-gray-500 transition-colors"
  >
    <Info className="h-4 w-4" />
  </button>
  {showCleaningInfo && (
    <div className="absolute left-0 top-7 z-20 w-72 rounded-xl border border-gray-200 bg-white p-3 text-xs leading-relaxed text-gray-600 shadow-xl">
      Every recipe runs through a quick clean-up that fixes spelling and sets the
      formatting, so every page in the book reads the same way. Want to see exactly
      what was sent? Open <span className="font-medium">View original</span>.
    </div>
  )}
</div>
```

Wrap the existing `Recipe Details` title text inside `DialogTitle`/`SheetTitle` with the markup above (replace the plain string).

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Verify (screenshot)**

Run `npm run dev`. Ask the founder for a screenshot of the header with the `(i)` open. It must look clean, editorial, uncramped — adjust spacing/position if the popover overlaps the close button.

- [ ] **Step 4: Commit**

```bash
git add components/profile/recipes/RecipeDetailsModal.tsx
git commit -m "feat(recipes): subtle (i) tooltip explaining the clean-up service"
```

---

## Task 7: Full-flow verification + cleanup

- [ ] **Step 1: Run the unit tests and type-check**

Run: `npx jest lib/recipes/cleanVersionState.test.ts && npx tsc --noEmit`
Expected: tests PASS, no type errors.

- [ ] **Step 2: Confirm the timeout is back to 60s**

Verify `CLEANING_TIMEOUT_MS = 60_000` in `lib/recipes/cleanVersionState.ts` (revert any temporary lower value used for the processing demo).

- [ ] **Step 3: Founder screenshot pass (the three states + magic feel)**

Ask the founder to confirm, with screenshots:
- Cleaned: clean version shown, subtle label, View original toggles, (i) tooltip reads well.
- Processing: spinner + copy (use a freshly submitted recipe or temporary short timeout).
- Fallback: old uncleaned recipe shows editable original; editing flags NEEDS REVIEW.
- Overall: clean, editorial, uncramped, nothing confusing.

- [ ] **Step 4: Final commit (if any spacing/polish tweaks were made)**

```bash
git add -A
git commit -m "polish(recipes): spacing/visual tweaks for clean-version dashboard"
```

---

## Self-Review notes

- **Spec coverage:** display logic (Task 5), edit target switch (Task 5), processing + 60s timeout (Tasks 3–4), copy ×4 (Tasks 4–6), View original (Task 5), (i) tooltip (Task 6), fallback reuses NEEDS REVIEW (Task 5), forward-only / no migration (no task touches historical rows), late-clean race accepted with no code (not implemented, by design). All covered.
- **Out of scope respected:** no data migration; image-queue and Railway untouched; Book Review flow untouched (only read for parity).
- **Type consistency:** `RecipeViewState` and `CLEANING_TIMEOUT_MS` defined in Task 1 and reused verbatim in Tasks 3–4; `CleanFields` shape matches the endpoint's GET/PATCH response in Task 2; endpoint body keys (`recipe_name`/`ingredients`/`instructions`/`note`) match the modal's PATCH call in Task 5.
- **Known integration risks to watch during execution:** confirm `createSupabaseRoute`/`createSupabaseAdminClient` import paths against `review-recipes/route.ts`; confirm `recipe_edit_history` accepts a user-authenticated insert with `edit_target='print_ready'` (the Book Review PATCH already does this, so it should). If the modal's read-mode JSX references differ slightly from the named fields, map them to `displayName`/`displayIngredients`/`displayInstructions`/`displayNote`.
