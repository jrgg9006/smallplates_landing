# Radar Let-Go Triage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Classify each active book as `revive` vs `let_go` (deterministically), show the `let_go` ones in a separate quiet group in the Radar drawer, and let the founder archive one with a click (reversible, no email).

**Architecture:** A pure classifier (`lib/radar/lifecycle.ts`) decides `let_go` only when prior outreach was ignored and balanced thresholds are met. The monitor computes it per candidate, persists `lifecycle` on the notification, and suppresses books archived via a new nullable `groups.radar_archived_at` (auto-resurrecting on later client activity). The drawer splits into two groups; a "Dar por perdido" button sets `radar_archived_at`.

**Tech Stack:** Next.js 15 App Router, TypeScript strict, Supabase (service-role), Jest. Builds on the `feature/radar-notifications` branch.

## Global Constraints

- No `any`. Files under 300 lines. Early returns. No new dependencies. No console.logs (console.error for caught errors is OK, matches codebase).
- Supabase DDL is delivered as SQL for the founder to run manually. Do NOT call apply_migration/execute_sql. Show SQL, wait for "CONFIRMED".
- Keep it SIMPLE (founder's explicit ask): solve the pain, no extra features. NO farewell email / Postmark / `farewell` comm-type in this plan (deferred to another session).
- Admin UI may use raw Tailwind. Constants verbatim: `LETGO_COLD_NO_INVESTMENT_DAYS=40`, `LETGO_COLD_WITH_INVESTMENT_DAYS=60`, `LETGO_DEADLINE_PASSED_COLD_DAYS=21`.
- Classification is deterministic; the LLM never decides `let_go`.
- `let_go` requires `outreach_ignored === true` (never write off someone never contacted).

---

## File Structure

- `lib/radar/monitor-constants.ts` — add the 3 let-go constants (modify).
- `lib/radar/lifecycle.ts` — `computeOutreachIgnored`, `classifyLifecycle` (create).
- `lib/radar/monitor-types.ts` — add `outreach_ignored`, `lifecycle` to `NotificationCandidate`; `lifecycle` to `RadarNotificationRow`; `radar_archived_at` to `MonitorSources.groups` (modify).
- `lib/radar/monitor.ts` — populate `outreach_ignored`/`lifecycle`; skip archived-not-revived books (modify).
- `lib/radar/monitor-store.ts` — persist `lifecycle` in the payload (modify).
- `lib/radar/run-monitor.ts` — select `radar_archived_at`; clear it for resurrected candidates; pass `lifecycle` to prompt via candidate (modify).
- `lib/radar/monitor-prompt.ts` — include `lifecycle` in the user message (modify).
- `supabase/migrations/20260728_radar_letgo.sql` — 2 columns (create; run manually).
- `lib/types/database.ts` — add `radar_archived_at` to groups; `lifecycle` to radar_notifications (modify).
- `app/api/v1/admin/radar/notifications/route.ts` — PATCH accepts `status:'archived'` → set `groups.radar_archived_at`, mark notification dismissed (modify).
- `components/admin/radar/Notifications.tsx` — split into two lifecycle groups; add "Dar por perdido" (modify).
- Tests: `__tests__/radar/lifecycle.test.ts` (create); update fixtures in `__tests__/radar/monitor.test.ts`, `monitor-store.test.ts`, `interpret.test.ts`.

---

## Task 1: Constants + lifecycle classifier (pure, TDD)

**Files:**
- Modify: `lib/radar/monitor-constants.ts`
- Create: `lib/radar/lifecycle.ts`, `__tests__/radar/lifecycle.test.ts`

**Interfaces:**
- Produces:
  - `computeOutreachIgnored(input: { last_founder_outreach: { sent_at: string } | null; last_client_activity_at: string | null }): boolean`
  - `classifyLifecycle(input: { outreach_ignored: boolean; recipes: number; distinct_submitters: number; client_coldness_days: number; days_until_close: number | null; gap_to_goal: number }): 'revive' | 'let_go'`
- Consumes: the 3 new constants.

Note: the classifier takes small explicit input shapes (NOT the full `NotificationCandidate`) so it stays decoupled and this task changes no shared types and breaks nothing.

- [ ] **Step 1: Add constants**

Append to `lib/radar/monitor-constants.ts`:
```typescript
// Let-go triage thresholds (balanced policy, approved 2026-07-28).
export const LETGO_COLD_NO_INVESTMENT_DAYS = 40;
export const LETGO_COLD_WITH_INVESTMENT_DAYS = 60;
export const LETGO_DEADLINE_PASSED_COLD_DAYS = 21;
```

- [ ] **Step 2: Write the failing tests**

```typescript
// __tests__/radar/lifecycle.test.ts
import { computeOutreachIgnored, classifyLifecycle } from '@/lib/radar/lifecycle';

const iso = (d: string) => new Date(d).toISOString();

describe('computeOutreachIgnored', () => {
  test('false when no outreach was ever sent', () => {
    expect(computeOutreachIgnored({ last_founder_outreach: null, last_client_activity_at: iso('2026-06-01') })).toBe(false);
  });
  test('true when outreach sent and client never active', () => {
    expect(computeOutreachIgnored({ last_founder_outreach: { sent_at: iso('2026-06-01') }, last_client_activity_at: null })).toBe(true);
  });
  test('true when outreach is after the last client activity', () => {
    expect(computeOutreachIgnored({ last_founder_outreach: { sent_at: iso('2026-06-10') }, last_client_activity_at: iso('2026-06-01') })).toBe(true);
  });
  test('false when client acted after the outreach', () => {
    expect(computeOutreachIgnored({ last_founder_outreach: { sent_at: iso('2026-06-01') }, last_client_activity_at: iso('2026-06-10') })).toBe(false);
  });
});

const base = { outreach_ignored: true, recipes: 0, distinct_submitters: 0, client_coldness_days: 50, days_until_close: null, gap_to_goal: 25 };

describe('classifyLifecycle', () => {
  test('never let_go when outreach was not ignored', () => {
    expect(classifyLifecycle({ ...base, outreach_ignored: false })).toBe('revive');
  });
  test('let_go: no investment, cold >= 40 (Gineele & Marco case)', () => {
    expect(classifyLifecycle({ ...base, recipes: 0, distinct_submitters: 0, client_coldness_days: 45 })).toBe('let_go');
  });
  test('not let_go: no investment but cold < 40', () => {
    expect(classifyLifecycle({ ...base, recipes: 0, distinct_submitters: 0, client_coldness_days: 30 })).toBe('revive');
  });
  test('with investment needs cold >= 60', () => {
    expect(classifyLifecycle({ ...base, recipes: 8, distinct_submitters: 3, client_coldness_days: 45 })).toBe('revive');
    expect(classifyLifecycle({ ...base, recipes: 8, distinct_submitters: 3, client_coldness_days: 65 })).toBe('let_go');
  });
  test('deadline passed with gap and cold >= 21 is let_go even with some investment', () => {
    expect(classifyLifecycle({ ...base, recipes: 5, distinct_submitters: 2, client_coldness_days: 25, days_until_close: -3, gap_to_goal: 20 })).toBe('let_go');
  });
  test('deadline passed but gap 0 (goal met) is not let_go', () => {
    expect(classifyLifecycle({ ...base, recipes: 25, distinct_submitters: 4, client_coldness_days: 25, days_until_close: -3, gap_to_goal: 0 })).toBe('revive');
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npx jest __tests__/radar/lifecycle.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 4: Implement `lib/radar/lifecycle.ts`**

```typescript
// lib/radar/lifecycle.ts
import { LETGO_COLD_NO_INVESTMENT_DAYS, LETGO_COLD_WITH_INVESTMENT_DAYS, LETGO_DEADLINE_PASSED_COLD_DAYS } from './monitor-constants';

export function computeOutreachIgnored(input: {
  last_founder_outreach: { sent_at: string } | null;
  last_client_activity_at: string | null;
}): boolean {
  if (!input.last_founder_outreach) return false;
  if (!input.last_client_activity_at) return true;
  return new Date(input.last_founder_outreach.sent_at).getTime() > new Date(input.last_client_activity_at).getTime();
}

export function classifyLifecycle(input: {
  outreach_ignored: boolean;
  recipes: number;
  distinct_submitters: number;
  client_coldness_days: number;
  days_until_close: number | null;
  gap_to_goal: number;
}): 'revive' | 'let_go' {
  // Reason: never write off someone we never reached (or who responded).
  if (!input.outreach_ignored) return 'revive';
  const { recipes, distinct_submitters, client_coldness_days, days_until_close, gap_to_goal } = input;
  if (days_until_close != null && days_until_close < 0 && gap_to_goal > 0 && client_coldness_days >= LETGO_DEADLINE_PASSED_COLD_DAYS) return 'let_go';
  if (recipes === 0 && distinct_submitters === 0 && client_coldness_days >= LETGO_COLD_NO_INVESTMENT_DAYS) return 'let_go';
  if (recipes >= 1 && client_coldness_days >= LETGO_COLD_WITH_INVESTMENT_DAYS) return 'let_go';
  return 'revive';
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx jest __tests__/radar/lifecycle.test.ts`
Expected: PASS (all).

- [ ] **Step 6: Commit**

```bash
git add lib/radar/monitor-constants.ts lib/radar/lifecycle.ts __tests__/radar/lifecycle.test.ts
git commit -m "feat(radar): deterministic let-go lifecycle classifier"
```

---

## Task 2: Migration + database types

**Files:**
- Create: `supabase/migrations/20260728_radar_letgo.sql`
- Modify: `lib/types/database.ts`

- [ ] **Step 1: Write the migration SQL**

```sql
-- supabase/migrations/20260728_radar_letgo.sql
-- Durable, reversible archive marker for a book that the founder gave up on.
alter table public.groups add column if not exists radar_archived_at timestamptz;

-- Lifecycle verdict persisted on each radar notification.
alter table public.radar_notifications
  add column if not exists lifecycle text not null default 'revive'
  check (lifecycle in ('revive','let_go'));
```

- [ ] **Step 2: Deliver SQL to the founder for manual run**

Present the SQL and wait for "CONFIRMED". Do NOT auto-apply.

- [ ] **Step 3: Add types to `lib/types/database.ts`**

- In the `groups` table `Row` add `radar_archived_at: string | null;`, and in its `Insert`/`Update` add `radar_archived_at?: string | null;` (match the existing style for nullable timestamp columns in that table).
- In the `radar_notifications` `Row` add `lifecycle: 'revive' | 'let_go';`; in `Insert` add `lifecycle?: 'revive' | 'let_go';`; in `Update` add `lifecycle: 'revive' | 'let_go';` to the `Partial<{...}>`.

- [ ] **Step 4: Type-check**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20260728_radar_letgo.sql lib/types/database.ts
git commit -m "feat(radar): radar_archived_at + notification lifecycle columns"
```

---

## Task 3: Wire lifecycle + archive suppression into the monitor

**Files:**
- Modify: `lib/radar/monitor-types.ts`, `lib/radar/monitor.ts`, `lib/radar/monitor-store.ts`, `lib/radar/run-monitor.ts`, `lib/radar/monitor-prompt.ts`
- Modify (fixtures): `__tests__/radar/monitor.test.ts`, `__tests__/radar/monitor-store.test.ts`, `__tests__/radar/interpret.test.ts`

**Interfaces:**
- Consumes: `computeOutreachIgnored`, `classifyLifecycle` (Task 1).
- Produces: `NotificationCandidate` and `RadarNotificationRow` gain `lifecycle`; candidate also gains `outreach_ignored`. Archived-not-revived books are excluded from candidates.

- [ ] **Step 1: Extend types (`lib/radar/monitor-types.ts`)**

- Add to `MonitorSources.groups` item: `radar_archived_at: string | null;`.
- Add to `NotificationCandidate`: `outreach_ignored: boolean;` and `lifecycle: 'revive' | 'let_go';`.
- Add to `RadarNotificationRow`: `lifecycle: 'revive' | 'let_go';`.

- [ ] **Step 2: Add the failing monitor test (archive suppression + lifecycle)**

Add to `__tests__/radar/monitor.test.ts` (the `baseSources()` group literals must also gain `radar_archived_at: null` — update every group object in this file, or add `radar_archived_at: null` to the `baseSources` group and each inline group). New cases:

```typescript
test('a let_go book is classified let_go when outreach was ignored', () => {
  const s = baseSources();
  s.groups = [{ id: 'g1', name: 'Gineele & Marco', created_by: 'p1', created_at: daysAgo(60), book_status: 'active', book_close_date: null, event_date: null, gift_date: null, wedding_date: null, radar_archived_at: null }];
  // no recipes, no guests, and a founder reminder 20 days ago that was ignored
  s.comms = [{ group_id: 'g1', recipient_profile_id: 'p1', type: 'reminder', sent_at: daysAgo(20), created_at: daysAgo(20) }];
  const out = computeCandidates(s, NOW);
  expect(out).toHaveLength(1);
  expect(out[0].outreach_ignored).toBe(true);
  expect(out[0].lifecycle).toBe('let_go');
});

test('an archived book with no new client activity is suppressed', () => {
  const s = baseSources();
  s.groups = [{ id: 'g1', name: 'Archived', created_by: 'p1', created_at: daysAgo(60), book_status: 'active', book_close_date: null, event_date: null, gift_date: null, wedding_date: null, radar_archived_at: daysAgo(2) }];
  expect(computeCandidates(s, NOW)).toHaveLength(0);
});

test('an archived book resurrects when client activity is newer than the archive', () => {
  const s = baseSources();
  s.groups = [{ id: 'g1', name: 'Back', created_by: 'p1', created_at: daysAgo(60), book_status: 'active', book_close_date: null, event_date: null, gift_date: null, wedding_date: null, radar_archived_at: daysAgo(10) }];
  s.recipes = [{ group_id: 'g1', guest_id: 'x', submitted_at: daysAgo(1), submission_status: 'submitted' }];
  expect(computeCandidates(s, NOW).length).toBe(0); // recipe 1d ago → not cold enough to be a candidate at all
  // but it is NOT suppressed by archive: prove via a cold-but-recently-active setup
  s.recipes = [{ group_id: 'g1', guest_id: 'x', submitted_at: daysAgo(6), submission_status: 'submitted' }];
  const out = computeCandidates(s, NOW);
  expect(out).toHaveLength(1); // coldness ~6 >= 5 candidate; archive (10d ago) is older than activity (6d) → not suppressed
});
```

- [ ] **Step 3: Update `computeCandidates` (`lib/radar/monitor.ts`)**

Inside the per-group loop, after computing `lastActivity`/`coldness` (the `computeClientColdnessDays` result) and before/around the candidate push:

1. Archive suppression — skip archived-and-not-revived groups:
```typescript
// Reason: a book the founder gave up on stays out until the client shows real activity again.
if (g.radar_archived_at) {
  const archivedMs = new Date(g.radar_archived_at).getTime();
  const activityMs = lastActivity ? new Date(lastActivity).getTime() : 0;
  if (archivedMs >= activityMs) continue;
}
```
2. Compute the lifecycle fields and include them in the pushed candidate object:
```typescript
const outreach_ignored = computeOutreachIgnored({
  last_founder_outreach: outreach ? { sent_at: outreach.sent_at! } : null,
  last_client_activity_at: lastActivity,
});
const lifecycle = classifyLifecycle({
  outreach_ignored,
  recipes,
  distinct_submitters,
  client_coldness_days: coldness === Infinity ? daysBetween(g.created_at, now) : coldness,
  days_until_close,
  gap_to_goal: Math.max(0, PRINT_GOAL - recipes),
});
```
Add `outreach_ignored` and `lifecycle` to the object pushed into `out`. Import `computeOutreachIgnored, classifyLifecycle` from `./lifecycle`.

- [ ] **Step 4: Persist lifecycle (`lib/radar/monitor-store.ts`)**

In `persistNotification`, add to the `payload`: `lifecycle: candidate.lifecycle,`. (The payload is typed inline; add the field.)

- [ ] **Step 5: Fetch archive + clear on resurrection + pass lifecycle (`lib/radar/run-monitor.ts`)**

- In the `groups` select, add `radar_archived_at`: change to `.select('id, name, created_by, created_at, book_status, book_close_date, event_date, gift_date, wedding_date, radar_archived_at')`.
- In the `sources.groups` mapping, ensure `radar_archived_at` passes through (if the mapping is a filter/spread it already does; if it lists fields, add it).
- After `const candidates = computeCandidates(...)`, clear the archive flag for any candidate whose source group was archived (it resurrected, else it'd be suppressed):
```typescript
const resurrectedIds = candidates
  .map((c) => c.group_id)
  .filter((id) => sources.groups.find((g) => g.id === id)?.radar_archived_at);
if (resurrectedIds.length > 0) {
  await supabase.from('groups').update({ radar_archived_at: null }).in('id', resurrectedIds);
}
```

- [ ] **Step 6: Pass lifecycle to the prompt (`lib/radar/monitor-prompt.ts`)**

In `buildUserMessage`, add a line to the signals block:
```
- Lifecycle verdict: ${c.lifecycle}${c.lifecycle === 'let_go' ? ' (looks lost — consider giving up on it)' : ''}
```
Do not change the priority-rules or voice blocks.

- [ ] **Step 7: Fix the other fixtures so the suite compiles**

- `__tests__/radar/monitor-store.test.ts`: the `cand()` helper builds a `NotificationCandidate` literal — add `outreach_ignored: false, lifecycle: 'revive',` to it.
- `__tests__/radar/interpret.test.ts`: the candidate literal `c` — add `outreach_ignored: false, lifecycle: 'revive',`.

- [ ] **Step 8: Run all radar tests + type-check**

Run: `npx jest __tests__/radar/` then `npx tsc --noEmit`
Expected: all suites PASS, tsc clean.

- [ ] **Step 9: Commit**

```bash
git add lib/radar __tests__/radar
git commit -m "feat(radar): compute+persist lifecycle, archive suppression and auto-resurrect"
```

---

## Task 4: Archive API action + drawer two-group UI

**Files:**
- Modify: `app/api/v1/admin/radar/notifications/route.ts`, `components/admin/radar/Notifications.tsx`

**Interfaces:**
- Consumes: `PATCH /api/v1/admin/radar/notifications` (existing).
- Produces: PATCH accepts `status: 'archived'`; drawer shows two lifecycle groups + "Dar por perdido".

- [ ] **Step 1: Extend the PATCH handler**

In `app/api/v1/admin/radar/notifications/route.ts`, allow a third action value `'archived'`. Keep `requireAdminAuth`. Behavior:
- Validate `status` is one of `['attended','dismissed','archived']`.
- For `'archived'`: look up the notification's `group_id`, then `update groups set radar_archived_at = now()` for that group AND set the notification row `status='dismissed'` (the notifications CHECK only allows open/attended/dismissed; the durable fact lives on groups). Reason: comment it.
- `attended`/`dismissed` branches stay exactly as they are.

Concretely, after auth + parsing:
```typescript
if (status === 'archived') {
  const supabase = createSupabaseAdminClient();
  const { data: notif } = await supabase.from('radar_notifications').select('group_id').eq('id', id).single();
  if (!notif) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  // Reason: archive is a durable, reversible book-level flag; notification itself is just dismissed.
  await supabase.from('groups').update({ radar_archived_at: new Date().toISOString() }).eq('id', notif.group_id);
  await supabase.from('radar_notifications').update({ status: 'dismissed' }).eq('id', id);
  return NextResponse.json({ ok: true });
}
```
Place this before the existing attended/dismissed update. Update the status-validation array to include `'archived'`.

- [ ] **Step 2: Split the drawer into two lifecycle groups**

In `components/admin/radar/Notifications.tsx` (the drawer): after fetching and sorting `rows`, partition into `revive = rows.filter(r => r.lifecycle !== 'let_go')` and `letGo = rows.filter(r => r.lifecycle === 'let_go')`. Render two labelled sections inside the drawer body:
- **"Enfócate aquí"** → the `revive` cards (unchanged card UI).
- **"Probablemente perdidos"** → the `letGo` cards, rendered in a visually quieter style (e.g., reduced opacity / muted text), each with an extra button **"Dar por perdido"**.

The "Dar por perdido" button calls a confirm then PATCH with `status:'archived'`, removing the card (same `setRows` filter pattern as attended/dismissed). Confirm copy: `¿Dar por perdido este libro? Sale del radar. Si el cliente vuelve a moverse, reaparece solo.` (use `window.confirm`). Keep the existing "Descartar" on let_go cards too. If either group is empty, hide that group's header. Keep the file under 300 lines (extract a small subcomponent if needed). The badge count logic stays as-is (counts all open rows; let_go are not `high` so they don't turn it red).

- [ ] **Step 3: Type-check + build**

Run: `npx tsc --noEmit` then `npm run build`
Expected: both clean (no Suspense regression on the activity page).

- [ ] **Step 4: Founder visual verification**

Ask the founder for a screenshot: open the 🔔 drawer, confirm the two groups render, a let_go book shows "Dar por perdido", and clicking it removes the card. Do NOT use Playwright.

- [ ] **Step 5: Commit**

```bash
git add app/api/v1/admin/radar/notifications/route.ts components/admin/radar/Notifications.tsx
git commit -m "feat(radar): let-go group in drawer + one-click archive"
```

---

## Final verification

- [ ] `npx jest __tests__/radar/` all green; `npx tsc --noEmit` clean; `npm run build` passes.
- [ ] Founder ran the migration SQL (Task 2) and confirmed.
- [ ] Founder confirmed via screenshot: two groups, "Dar por perdido" archives and removes the card, and previously-archived books stay out of the radar.

## Spec coverage self-check

- Deterministic classifier, outreach-ignored guard, balanced thresholds → Task 1. ✅
- Archive marker (`radar_archived_at`) + lifecycle column → Task 2. ✅
- Compute/persist lifecycle, archive suppression + auto-resurrect → Task 3. ✅
- Archive API action + two-group drawer + "Dar por perdido" → Task 4. ✅
- No email / Postmark (deferred) → not tasked. ✅
