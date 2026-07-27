# Radar Notifications Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A daily sensor that detects at-risk cookbook projects, interprets each with an LLM, and surfaces a prioritized "Notificaciones" feed inside Radar — each with a copy-ready draft message.

**Architecture:** Two layers. Layer 1 (pure, deterministic) pre-ranks active books into a small candidate set using client-honest coldness, momentum drop, and deadline proximity. Layer 2 (LLM) interprets only the candidates into `{priority, headline, interpretation, recommended_action, draft_message}`. Results persist to a new `radar_notifications` table (one active row per book, with cooldown), read/written by admin API routes and rendered as the top section of Radar. A daily Vercel cron plus an admin "Regenerar ahora" button both call the same `runRadarMonitor()` orchestrator.

**Tech Stack:** Next.js 14 App Router, TypeScript strict, Supabase (service-role), OpenAI `gpt-4o` (JSON mode), Jest.

## Global Constraints

- No `any` types. Functional components with hooks. Early returns over nesting. Files under 300 lines. (CLAUDE.md)
- Supabase writes (DDL/DML) are delivered as SQL for the founder to run manually. Do NOT call `apply_migration`/`execute_sql`. Show SQL, wait for "CONFIRMED". (CLAUDE.md + user rule)
- Every new table MUST enable RLS. This table is admin-only: enable RLS, add NO permissive policy (only the service-role client, which bypasses RLS, touches it). (CLAUDE.md)
- Draft messages (`draft_message`) MUST follow `brand/voice.md`: never the banned words (cherish, treasure, memories, special, unique, loved ones, celebrate, journey, curated, perfect, amazing, magical, timeless, forever, keepsake, meaningful, yummy…); no em dashes; no guest-count numbers; use "your people" not "showed up"; signed by Ana.
- Marketing/user-facing copy in the UI uses `type-*` utility classes, not raw Tailwind font utilities. Admin dashboard UI may use raw Tailwind (Radar is admin).
- Reuse before create: mirror `getBooksForRemindersTip` (coldness) and `send-invitations` (cron) patterns. Do not add new dependencies.
- Constants (verbatim): `COLDNESS_CANDIDATE_DAYS=5`, `DEADLINE_NEAR_DAYS=10`, `MOMENTUM_STALL_DAYS=10`, `ATTENDED_COOLDOWN_DAYS=4`, `PRINT_GOAL=25`.
- After a series of TypeScript changes run `npx tsc --noEmit`. UI verification is a screenshot from the founder, not Playwright.

---

## File Structure

- `lib/radar/monitor-constants.ts` — the 5 tunable constants (create).
- `lib/radar/monitor-types.ts` — shared types: `MonitorSources`, `NotificationCandidate`, `NotificationInterpretation`, `RadarNotificationRow`, enums (create).
- `lib/radar/monitor.ts` — Layer 1 pure logic: `computeCandidates(sources, now)` + helpers (create).
- `lib/radar/monitor-prompt.ts` — LLM system prompt (brand voice) + `buildUserMessage(candidate)` (create).
- `lib/radar/interpret.ts` — Layer 2: `interpretCandidate(candidate)` OpenAI call (create).
- `lib/radar/monitor-store.ts` — persistence + cooldown: `shouldGenerate`, `escalates`, `upsertNotification` (create).
- `lib/radar/run-monitor.ts` — `fetchMonitorSources()` + `runRadarMonitor()` orchestrator (create).
- `supabase/migrations/20260727_radar_notifications.sql` — table + RLS (create; run manually).
- `lib/types/database.ts` — add `radar_notifications` Row/Insert/Update + convenience types (modify).
- `app/api/cron/radar-monitor/route.ts` — daily cron GET (create).
- `app/api/v1/admin/radar/notifications/route.ts` — admin GET list + PATCH status (create).
- `app/api/v1/admin/radar/notifications/regenerate/route.ts` — admin POST → runRadarMonitor (create).
- `components/admin/radar/Notifications.tsx` — the feed UI (create).
- `components/admin/radar/RadarDashboard.tsx` — mount Notifications at top (modify).
- `components/admin/radar/BookProgress.tsx`, `GroupHealthTable.tsx` — fix "back to Activity" links to stay in Radar (modify).
- `vercel.json` — add cron entry (modify).
- Tests: `__tests__/radar/monitor.test.ts`, `__tests__/radar/monitor-store.test.ts`, `__tests__/radar/interpret.test.ts`.

---

## Task 1: Constants + shared types

**Files:**
- Create: `lib/radar/monitor-constants.ts`, `lib/radar/monitor-types.ts`

**Interfaces:**
- Produces: all constants; types `MonitorSources`, `NotificationCandidate`, `NotificationPriority`, `NotificationStatus`, `NotificationInterpretation`, `RadarNotificationRow`.

- [ ] **Step 1: Write constants**

```typescript
// lib/radar/monitor-constants.ts
// Reason: single source for the monitor's tunable thresholds (approved 2026-07-27).
export const COLDNESS_CANDIDATE_DAYS = 5;
export const DEADLINE_NEAR_DAYS = 10;
export const MOMENTUM_STALL_DAYS = 10;
export const ATTENDED_COOLDOWN_DAYS = 4;
export const PRINT_GOAL = 25;
export const DAY_MS = 1000 * 60 * 60 * 24;
```

- [ ] **Step 2: Write types**

```typescript
// lib/radar/monitor-types.ts
export type NotificationPriority = 'high' | 'medium' | 'low';
export type NotificationStatus = 'open' | 'attended' | 'dismissed';
export type CloseDateSource = 'book_close_date' | 'event_date' | 'gift_date' | null;

// Plain arrays so Layer 1 stays pure and unit-testable.
export interface MonitorSources {
  groups: Array<{
    id: string; name: string; created_by: string; created_at: string;
    book_status: string;
    book_close_date: string | null; event_date: string | null;
    gift_date: string | null; wedding_date: string | null;
  }>;
  recipes: Array<{ group_id: string; guest_id: string | null; submitted_at: string | null; submission_status: string; }>;
  guests: Array<{ id: string; group_id: string; created_at: string; is_self: boolean; }>;
  captains: Array<{ group_id: string; joined_at: string; }>;
  comms: Array<{ group_id: string | null; recipient_profile_id: string | null; type: string; sent_at: string | null; created_at: string; }>;
  events: Array<{ group_id: string | null; event_name: string; created_at: string; }>;
  lastLoginByProfile: Record<string, string | null>; // created_by -> last_sign_in_at (ISO)
}

export interface NotificationCandidate {
  group_id: string;
  book_name: string;
  owner_id: string;
  recipes: number;
  goal: number;
  gap_to_goal: number;
  client_coldness_days: number;
  last_client_activity_at: string | null;
  days_until_close: number | null;
  close_date_source: CloseDateSource;
  momentum: { per_week: number[]; stalled: boolean };
  captains: { count: number; active_count: number };
  contributors: { distinct_submitters: number; owner_submitted: boolean; is_solo: boolean };
  owner_last_login_at: string | null;
  last_founder_outreach: { type: string; sent_at: string } | null;
}

export interface NotificationInterpretation {
  priority: NotificationPriority;
  headline: string;
  interpretation: string;
  recommended_action: string;
  draft_message: string;
}

export interface RadarNotificationRow {
  id: string;
  group_id: string;
  generated_at: string;
  priority: NotificationPriority;
  headline: string;
  interpretation: string;
  recommended_action: string;
  draft_message: string;
  signals: NotificationCandidate;
  status: NotificationStatus;
  attended_at: string | null;
  cooldown_until: string | null;
}
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: PASS (no references yet).

- [ ] **Step 4: Commit**

```bash
git add lib/radar/monitor-constants.ts lib/radar/monitor-types.ts
git commit -m "feat(radar): monitor constants and shared types"
```

---

## Task 2: Layer 1 — candidate computation (pure, TDD)

**Files:**
- Create: `lib/radar/monitor.ts`
- Test: `__tests__/radar/monitor.test.ts`

**Interfaces:**
- Consumes: `MonitorSources`, `NotificationCandidate` (Task 1), constants (Task 1).
- Produces: `computeCandidates(sources: MonitorSources, now: Date): NotificationCandidate[]` (only books that are candidates, active book_status, sorted by coldness desc). Also exported helpers `computeClientColdnessDays`, `computeMomentum`, `computeDaysUntilClose` for testing.

- [ ] **Step 1: Write the failing tests**

```typescript
// __tests__/radar/monitor.test.ts
import { computeCandidates, computeMomentum, computeDaysUntilClose } from '@/lib/radar/monitor';
import type { MonitorSources } from '@/lib/radar/monitor-types';

const NOW = new Date('2026-07-27T12:00:00Z');
const daysAgo = (n: number) => new Date(NOW.getTime() - n * 86400000).toISOString();

function baseSources(): MonitorSources {
  return { groups: [], recipes: [], guests: [], captains: [], comms: [], events: [], lastLoginByProfile: {} };
}

test('computeMomentum flags stalled when prior weeks had recipes but last 10 days none', () => {
  const submitted = [daysAgo(25), daysAgo(24), daysAgo(20), daysAgo(18)]; // all older than 10d
  const m = computeMomentum(submitted, NOW);
  expect(m.stalled).toBe(true);
  expect(m.per_week.reduce((a, b) => a + b, 0)).toBe(4);
});

test('computeMomentum not stalled when a recipe arrived in last 10 days', () => {
  const submitted = [daysAgo(20), daysAgo(3)];
  expect(computeMomentum(submitted, NOW).stalled).toBe(false);
});

test('computeDaysUntilClose prefers book_close_date then event then gift', () => {
  expect(computeDaysUntilClose({ book_close_date: daysAgo(-5), event_date: null, gift_date: null }, NOW))
    .toEqual({ days_until_close: 5, close_date_source: 'book_close_date' });
  expect(computeDaysUntilClose({ book_close_date: null, event_date: daysAgo(-2), gift_date: daysAgo(-9) }, NOW))
    .toEqual({ days_until_close: 2, close_date_source: 'event_date' });
  expect(computeDaysUntilClose({ book_close_date: null, event_date: null, gift_date: null }, NOW))
    .toEqual({ days_until_close: null, close_date_source: null });
});

test('a cold active book with prior momentum becomes a candidate (Danay case)', () => {
  const s = baseSources();
  s.groups = [{ id: 'g1', name: "Akanksha's Cookbook", created_by: 'p1', created_at: daysAgo(60), book_status: 'active', book_close_date: null, event_date: null, gift_date: null, wedding_date: null }];
  s.guests = [{ id: 'gu1', group_id: 'g1', created_at: daysAgo(30), is_self: false }];
  // 15 recipes, all submitted ~30 days ago, none since
  s.recipes = Array.from({ length: 15 }, (_, i) => ({ group_id: 'g1', guest_id: 'gu1', submitted_at: daysAgo(30 + (i % 5)), submission_status: 'submitted' }));
  const out = computeCandidates(s, NOW);
  expect(out).toHaveLength(1);
  expect(out[0].group_id).toBe('g1');
  expect(out[0].recipes).toBe(15);
  expect(out[0].client_coldness_days).toBeGreaterThanOrEqual(29);
  expect(out[0].momentum.stalled).toBe(true);
  expect(out[0].contributors.is_solo).toBe(true); // only one guest submitted
});

test('a fresh active book (recipe yesterday) is NOT a candidate', () => {
  const s = baseSources();
  s.groups = [{ id: 'g2', name: 'Fresh', created_by: 'p2', created_at: daysAgo(3), book_status: 'active', book_close_date: null, event_date: null, gift_date: null, wedding_date: null }];
  s.recipes = [{ group_id: 'g2', guest_id: 'x', submitted_at: daysAgo(1), submission_status: 'submitted' }];
  expect(computeCandidates(s, NOW)).toHaveLength(0);
});

test('closed books are excluded', () => {
  const s = baseSources();
  s.groups = [{ id: 'g3', name: 'Done', created_by: 'p3', created_at: daysAgo(60), book_status: 'printed', book_close_date: null, event_date: null, gift_date: null, wedding_date: null }];
  expect(computeCandidates(s, NOW)).toHaveLength(0);
});

test('founder emails do NOT reset coldness (honest coldness)', () => {
  const s = baseSources();
  s.groups = [{ id: 'g4', name: 'Cold', created_by: 'p4', created_at: daysAgo(40), book_status: 'active', book_close_date: null, event_date: null, gift_date: null, wedding_date: null }];
  s.recipes = [{ group_id: 'g4', guest_id: 'gz', submitted_at: daysAgo(20), submission_status: 'submitted' }];
  s.comms = [{ group_id: 'g4', recipient_profile_id: 'p4', type: 'reminder', sent_at: daysAgo(1), created_at: daysAgo(1) }];
  const out = computeCandidates(s, NOW);
  expect(out[0].client_coldness_days).toBeGreaterThanOrEqual(19); // email 1d ago is ignored
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx jest __tests__/radar/monitor.test.ts`
Expected: FAIL ("computeCandidates is not a function").

- [ ] **Step 3: Implement `lib/radar/monitor.ts`**

```typescript
// lib/radar/monitor.ts
import { COLDNESS_CANDIDATE_DAYS, DEADLINE_NEAR_DAYS, MOMENTUM_STALL_DAYS, PRINT_GOAL, DAY_MS } from './monitor-constants';
import type { MonitorSources, NotificationCandidate, CloseDateSource } from './monitor-types';

const CLOSED_BOOK_STATUSES = new Set(['reviewed', 'ready_to_print', 'printed', 'inactive']);
const daysBetween = (fromIso: string, now: Date) => Math.floor((now.getTime() - new Date(fromIso).getTime()) / DAY_MS);

export function computeMomentum(submittedIso: string[], now: Date): { per_week: number[]; stalled: boolean } {
  const per_week = [0, 0, 0, 0]; // 0-7d, 7-14d, 14-21d, 21-28d
  let recent = 0; // within MOMENTUM_STALL_DAYS
  for (const iso of submittedIso) {
    const d = daysBetween(iso, now);
    if (d < 0) continue;
    if (d < MOMENTUM_STALL_DAYS) recent++;
    const bucket = Math.floor(d / 7);
    if (bucket >= 0 && bucket < 4) per_week[bucket]++;
  }
  // Prior activity = recipes older than the stall window.
  const prior = submittedIso.filter((iso) => daysBetween(iso, now) >= MOMENTUM_STALL_DAYS).length;
  const stalled = prior >= 2 && recent === 0;
  return { per_week, stalled };
}

export function computeDaysUntilClose(
  g: { book_close_date: string | null; event_date: string | null; gift_date: string | null },
  now: Date,
): { days_until_close: number | null; close_date_source: CloseDateSource } {
  const pick: Array<[string | null, CloseDateSource]> = [
    [g.book_close_date, 'book_close_date'],
    [g.event_date, 'event_date'],
    [g.gift_date, 'gift_date'],
  ];
  for (const [iso, source] of pick) {
    if (iso) return { days_until_close: Math.ceil((new Date(iso).getTime() - now.getTime()) / DAY_MS), close_date_source: source };
  }
  return { days_until_close: null, close_date_source: null };
}

export function computeClientColdnessDays(
  groupId: string, ownerId: string, sources: MonitorSources, now: Date,
): { coldness: number; lastActivity: string | null } {
  // Reason: honest coldness = client-originated signals only. Excludes comms + edits (founder noise).
  const ts: number[] = [];
  for (const r of sources.recipes) if (r.group_id === groupId && r.submission_status === 'submitted' && r.submitted_at) ts.push(new Date(r.submitted_at).getTime());
  for (const gu of sources.guests) if (gu.group_id === groupId) ts.push(new Date(gu.created_at).getTime());
  for (const e of sources.events) if (e.group_id === groupId) ts.push(new Date(e.created_at).getTime());
  const login = sources.lastLoginByProfile[ownerId];
  if (login) ts.push(new Date(login).getTime());
  if (ts.length === 0) return { coldness: Infinity, lastActivity: null };
  const last = Math.max(...ts);
  return { coldness: Math.floor((now.getTime() - last) / DAY_MS), lastActivity: new Date(last).toISOString() };
}

export function computeCandidates(sources: MonitorSources, now: Date): NotificationCandidate[] {
  const out: NotificationCandidate[] = [];
  for (const g of sources.groups) {
    if (CLOSED_BOOK_STATUSES.has(g.book_status)) continue;

    const groupRecipes = sources.recipes.filter((r) => r.group_id === g.id && r.submission_status === 'submitted');
    const recipes = groupRecipes.length;
    const submittedIso = groupRecipes.map((r) => r.submitted_at).filter((x): x is string => !!x);
    const momentum = computeMomentum(submittedIso, now);
    const { days_until_close, close_date_source } = computeDaysUntilClose(g, now);
    const { coldness, lastActivity } = computeClientColdnessDays(g.id, g.created_by, sources, now);

    const groupGuests = sources.guests.filter((gu) => gu.group_id === g.id);
    const selfGuestIds = new Set(groupGuests.filter((gu) => gu.is_self).map((gu) => gu.id));
    const submitters = new Set(groupRecipes.map((r) => r.guest_id).filter((x): x is string => !!x));
    const owner_submitted = [...submitters].some((id) => selfGuestIds.has(id));
    const distinct_submitters = submitters.size;

    const captains = sources.captains.filter((c) => c.group_id === g.id);
    const active_count = captains.filter((c) => daysBetween(c.joined_at, now) <= 30).length;

    const outreach = sources.comms
      .filter((c) => c.group_id === g.id && c.recipient_profile_id === g.created_by && c.sent_at)
      .sort((a, b) => (a.sent_at! > b.sent_at! ? -1 : 1))[0];

    const isCandidate =
      coldness >= COLDNESS_CANDIDATE_DAYS ||
      momentum.stalled ||
      (days_until_close != null && days_until_close <= DEADLINE_NEAR_DAYS && recipes < PRINT_GOAL);
    if (!isCandidate) continue;

    out.push({
      group_id: g.id,
      book_name: g.name,
      owner_id: g.created_by,
      recipes,
      goal: PRINT_GOAL,
      gap_to_goal: Math.max(0, PRINT_GOAL - recipes),
      client_coldness_days: coldness === Infinity ? daysBetween(g.created_at, now) : coldness,
      last_client_activity_at: lastActivity,
      days_until_close,
      close_date_source,
      momentum,
      captains: { count: captains.length, active_count },
      contributors: { distinct_submitters, owner_submitted, is_solo: distinct_submitters <= 1 },
      owner_last_login_at: sources.lastLoginByProfile[g.created_by] ?? null,
      last_founder_outreach: outreach ? { type: outreach.type, sent_at: outreach.sent_at! } : null,
    });
  }
  return out.sort((a, b) => b.client_coldness_days - a.client_coldness_days);
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx jest __tests__/radar/monitor.test.ts`
Expected: PASS (all 7).

- [ ] **Step 5: Commit**

```bash
git add lib/radar/monitor.ts __tests__/radar/monitor.test.ts
git commit -m "feat(radar): layer 1 candidate computation with honest coldness"
```

---

## Task 3: Migration + database types

**Files:**
- Create: `supabase/migrations/20260727_radar_notifications.sql`
- Modify: `lib/types/database.ts` (add table types near other Row/Insert/Update blocks)

**Interfaces:**
- Produces: table `radar_notifications`; TS types `Database['public']['Tables']['radar_notifications']`.

- [ ] **Step 1: Write the migration SQL**

```sql
-- supabase/migrations/20260727_radar_notifications.sql
create table if not exists public.radar_notifications (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  generated_at timestamptz not null default now(),
  priority text not null check (priority in ('high','medium','low')),
  headline text not null,
  interpretation text not null,
  recommended_action text not null,
  draft_message text not null,
  signals jsonb not null default '{}'::jsonb,
  status text not null default 'open' check (status in ('open','attended','dismissed')),
  attended_at timestamptz,
  cooldown_until timestamptz
);

-- One active (open) notification per book keeps the feed clean.
create unique index if not exists radar_notifications_one_open_per_group
  on public.radar_notifications (group_id) where status = 'open';
create index if not exists radar_notifications_group_generated
  on public.radar_notifications (group_id, generated_at desc);

-- Admin-only table: enable RLS with NO permissive policy.
-- Only the service-role client (which bypasses RLS) reads/writes it.
alter table public.radar_notifications enable row level security;
```

- [ ] **Step 2: Deliver SQL to the founder for manual run**

Do NOT auto-apply. Present the SQL block above and wait for the founder to run it in Supabase and reply "CONFIRMED". (Per project rule: Supabase writes are manual.)

- [ ] **Step 3: Add types to `lib/types/database.ts`**

Locate the `Tables:` map and add a sibling entry (match the existing Row/Insert/Update style):

```typescript
      radar_notifications: {
        Row: {
          id: string;
          group_id: string;
          generated_at: string;
          priority: 'high' | 'medium' | 'low';
          headline: string;
          interpretation: string;
          recommended_action: string;
          draft_message: string;
          signals: Record<string, unknown>;
          status: 'open' | 'attended' | 'dismissed';
          attended_at: string | null;
          cooldown_until: string | null;
        };
        Insert: {
          id?: string;
          group_id: string;
          generated_at?: string;
          priority: 'high' | 'medium' | 'low';
          headline: string;
          interpretation: string;
          recommended_action: string;
          draft_message: string;
          signals?: Record<string, unknown>;
          status?: 'open' | 'attended' | 'dismissed';
          attended_at?: string | null;
          cooldown_until?: string | null;
        };
        Update: Partial<{
          priority: 'high' | 'medium' | 'low';
          headline: string;
          interpretation: string;
          recommended_action: string;
          draft_message: string;
          signals: Record<string, unknown>;
          status: 'open' | 'attended' | 'dismissed';
          attended_at: string | null;
          cooldown_until: string | null;
          generated_at: string;
        }>;
      };
```

- [ ] **Step 4: Type-check**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20260727_radar_notifications.sql lib/types/database.ts
git commit -m "feat(radar): radar_notifications table + types"
```

---

## Task 4: Persistence + cooldown logic (pure, TDD)

**Files:**
- Create: `lib/radar/monitor-store.ts`
- Test: `__tests__/radar/monitor-store.test.ts`

**Interfaces:**
- Consumes: `RadarNotificationRow`, `NotificationCandidate`, `NotificationInterpretation`, `NotificationPriority`, `ATTENDED_COOLDOWN_DAYS`.
- Produces:
  - `escalates(existing: RadarNotificationRow, interp: NotificationInterpretation, candidate: NotificationCandidate): boolean`
  - `shouldGenerate(existing: RadarNotificationRow | null, interp: NotificationInterpretation, candidate: NotificationCandidate, now: Date): boolean`
  - `persistNotifications(supabase, results, now)` (thin DB wrapper; consumed by Task 6).

- [ ] **Step 1: Write the failing tests**

```typescript
// __tests__/radar/monitor-store.test.ts
import { shouldGenerate, escalates } from '@/lib/radar/monitor-store';
import type { RadarNotificationRow, NotificationInterpretation, NotificationCandidate } from '@/lib/radar/monitor-types';

const NOW = new Date('2026-07-27T12:00:00Z');
const future = (n: number) => new Date(NOW.getTime() + n * 86400000).toISOString();
const past = (n: number) => new Date(NOW.getTime() - n * 86400000).toISOString();

const interp = (priority: 'high' | 'medium' | 'low'): NotificationInterpretation =>
  ({ priority, headline: '', interpretation: '', recommended_action: '', draft_message: '' });
const cand = (over: Partial<NotificationCandidate> = {}): NotificationCandidate =>
  ({ group_id: 'g1', book_name: 'B', owner_id: 'p1', recipes: 10, goal: 25, gap_to_goal: 15, client_coldness_days: 20, last_client_activity_at: past(20), days_until_close: null, close_date_source: null, momentum: { per_week: [], stalled: true }, captains: { count: 0, active_count: 0 }, contributors: { distinct_submitters: 1, owner_submitted: false, is_solo: true }, owner_last_login_at: null, last_founder_outreach: null, ...over });
const row = (over: Partial<RadarNotificationRow> = {}): RadarNotificationRow =>
  ({ id: 'n1', group_id: 'g1', generated_at: past(1), priority: 'medium', headline: '', interpretation: '', recommended_action: '', draft_message: '', signals: cand(), status: 'open', attended_at: null, cooldown_until: null, ...over });

test('generates when no prior notification exists', () => {
  expect(shouldGenerate(null, interp('medium'), cand(), NOW)).toBe(true);
});

test('generates when prior is open (updates in place)', () => {
  expect(shouldGenerate(row({ status: 'open' }), interp('medium'), cand(), NOW)).toBe(true);
});

test('suppresses while attended cooldown is active', () => {
  const existing = row({ status: 'attended', attended_at: past(1), cooldown_until: future(3), priority: 'medium' });
  expect(shouldGenerate(existing, interp('medium'), cand(), NOW)).toBe(false);
});

test('escalation overrides cooldown when priority rises', () => {
  const existing = row({ status: 'attended', cooldown_until: future(3), priority: 'medium' });
  expect(shouldGenerate(existing, interp('high'), cand(), NOW)).toBe(true);
});

test('escalation overrides cooldown when deadline critical (<=3d)', () => {
  const existing = row({ status: 'attended', cooldown_until: future(3), priority: 'high' });
  expect(shouldGenerate(existing, interp('high'), cand({ days_until_close: 2 }), NOW)).toBe(true);
});

test('regenerates after cooldown passed', () => {
  const existing = row({ status: 'attended', cooldown_until: past(1), priority: 'medium' });
  expect(shouldGenerate(existing, interp('medium'), cand(), NOW)).toBe(true);
});

test('dismissed only reappears on escalation', () => {
  const existing = row({ status: 'dismissed', priority: 'medium', cooldown_until: null });
  expect(shouldGenerate(existing, interp('medium'), cand(), NOW)).toBe(false);
  expect(shouldGenerate(existing, interp('high'), cand(), NOW)).toBe(true);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx jest __tests__/radar/monitor-store.test.ts`
Expected: FAIL ("shouldGenerate is not a function").

- [ ] **Step 3: Implement `lib/radar/monitor-store.ts`**

```typescript
// lib/radar/monitor-store.ts
import type { SupabaseClient } from '@supabase/supabase-js';
import type { RadarNotificationRow, NotificationCandidate, NotificationInterpretation } from './monitor-types';

const RANK: Record<'low' | 'medium' | 'high', number> = { low: 0, medium: 1, high: 2 };

export function escalates(
  existing: RadarNotificationRow, interp: NotificationInterpretation, candidate: NotificationCandidate,
): boolean {
  if (RANK[interp.priority] > RANK[existing.priority]) return true;
  if (candidate.days_until_close != null && candidate.days_until_close <= 3) return true;
  return false;
}

export function shouldGenerate(
  existing: RadarNotificationRow | null,
  interp: NotificationInterpretation,
  candidate: NotificationCandidate,
  now: Date,
): boolean {
  if (!existing) return true;
  if (existing.status === 'open') return true;
  if (existing.status === 'dismissed') return escalates(existing, interp, candidate);
  // attended
  const cooling = existing.cooldown_until != null && new Date(existing.cooldown_until) > now;
  if (cooling) return escalates(existing, interp, candidate);
  return true;
}

// Thin DB layer (integration-tested via the cron route; consumed by Task 6).
export async function fetchLatestByGroup(
  supabase: SupabaseClient, groupIds: string[],
): Promise<Map<string, RadarNotificationRow>> {
  const map = new Map<string, RadarNotificationRow>();
  if (groupIds.length === 0) return map;
  const { data } = await supabase
    .from('radar_notifications')
    .select('*')
    .in('group_id', groupIds)
    .order('generated_at', { ascending: false });
  for (const r of (data ?? []) as RadarNotificationRow[]) {
    if (!map.has(r.group_id)) map.set(r.group_id, r); // newest first → keep first seen
  }
  return map;
}

export async function persistNotification(
  supabase: SupabaseClient,
  existing: RadarNotificationRow | null,
  candidate: NotificationCandidate,
  interp: NotificationInterpretation,
  now: Date,
): Promise<void> {
  const payload = {
    group_id: candidate.group_id,
    generated_at: now.toISOString(),
    priority: interp.priority,
    headline: interp.headline,
    interpretation: interp.interpretation,
    recommended_action: interp.recommended_action,
    draft_message: interp.draft_message,
    signals: candidate as unknown as Record<string, unknown>,
    status: 'open' as const,
    attended_at: null,
    cooldown_until: null,
  };
  if (existing && existing.status === 'open') {
    await supabase.from('radar_notifications').update(payload).eq('id', existing.id);
  } else {
    await supabase.from('radar_notifications').insert(payload);
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx jest __tests__/radar/monitor-store.test.ts`
Expected: PASS (all 7).

- [ ] **Step 5: Commit**

```bash
git add lib/radar/monitor-store.ts __tests__/radar/monitor-store.test.ts
git commit -m "feat(radar): notification persistence + cooldown/escalation logic"
```

---

## Task 5: Layer 2 — LLM interpretation (brand-voice prompt + OpenAI call)

**Files:**
- Create: `lib/radar/monitor-prompt.ts`, `lib/radar/interpret.ts`
- Test: `__tests__/radar/interpret.test.ts`

**Interfaces:**
- Consumes: `NotificationCandidate`, `NotificationInterpretation`.
- Produces:
  - `RADAR_MONITOR_SYSTEM_PROMPT: string`
  - `buildUserMessage(c: NotificationCandidate): string`
  - `parseInterpretation(raw: unknown): NotificationInterpretation` (validates + clamps priority)
  - `interpretCandidate(c: NotificationCandidate, openai?: OpenAI): Promise<NotificationInterpretation>`

- [ ] **Step 1: Write the failing tests (pure parts only)**

```typescript
// __tests__/radar/interpret.test.ts
import { buildUserMessage, parseInterpretation, RADAR_MONITOR_SYSTEM_PROMPT } from '@/lib/radar/monitor-prompt';
import type { NotificationCandidate } from '@/lib/radar/monitor-types';

const c: NotificationCandidate = {
  group_id: 'g1', book_name: "Akanksha's Cookbook", owner_id: 'p1', recipes: 15, goal: 25, gap_to_goal: 10,
  client_coldness_days: 30, last_client_activity_at: '2026-06-27T00:00:00Z', days_until_close: null, close_date_source: null,
  momentum: { per_week: [0, 0, 0, 3], stalled: true }, captains: { count: 0, active_count: 0 },
  contributors: { distinct_submitters: 1, owner_submitted: true, is_solo: true }, owner_last_login_at: null, last_founder_outreach: null,
};

test('system prompt encodes banned words + no em dash rule', () => {
  expect(RADAR_MONITOR_SYSTEM_PROMPT.toLowerCase()).toContain('cherish');
  expect(RADAR_MONITOR_SYSTEM_PROMPT).toContain('em dash');
});

test('user message includes the concrete signals', () => {
  const msg = buildUserMessage(c);
  expect(msg).toContain("Akanksha's Cookbook");
  expect(msg).toContain('15');
  expect(msg).toContain('30');
});

test('parseInterpretation validates shape and clamps bad priority to medium', () => {
  const out = parseInterpretation({ priority: 'urgent', headline: 'h', interpretation: 'i', recommended_action: 'a', draft_message: 'm' });
  expect(out.priority).toBe('medium');
  expect(out.headline).toBe('h');
});

test('parseInterpretation throws on missing fields', () => {
  expect(() => parseInterpretation({ priority: 'high' })).toThrow();
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx jest __tests__/radar/interpret.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement `lib/radar/monitor-prompt.ts`**

```typescript
// lib/radar/monitor-prompt.ts
import type { NotificationCandidate, NotificationInterpretation, NotificationPriority } from './monitor-types';

// Reason: brand rules embedded in-prompt (voice.md is docs-only; matches lib/tiktok-agent pattern).
export const RADAR_MONITOR_SYSTEM_PROMPT = `You are the operations copilot for Small Plates & Co., a service where a group contributes recipes and we print a hardcover cookbook for someone. You help the founder (a solo operator) spot cookbook projects that are stalling and act in time.

You receive one project's signals. Do two things:
1. Interpret what is going on, like a sharp operator: combine coldness, momentum, deadline, captains, whether the owner is doing it solo, and prior founder outreach. Say what you actually think and why.
2. Draft a short message the founder could send to the client.

Priority rules:
- "high": real risk of losing the client (cold AND near a close date, or clear momentum drop after real investment).
- "medium": drifting, worth a nudge.
- "low": minor.

VOICE for draft_message (hard rules):
- Never these words: cherish, treasure, memories, special, unique, loved ones, celebrate, journey, curated, perfect, amazing, magical, timeless, forever, keepsake, meaningful, yummy.
- No em dash characters anywhere. Use a period, comma, or colon.
- Never cite a number of guests. Say "your people".
- Never "showed up".
- Specific, dry, direct, warm without performing it. Sign as Ana.
- If prior founder outreach was recent and the client is still cold, do NOT repeat the same reminder. Change the angle or offer help.

Return ONLY JSON: {"priority","headline","interpretation","recommended_action","draft_message"}. headline is one line. interpretation is 2-4 sentences.`;

export function buildUserMessage(c: NotificationCandidate): string {
  return `Project signals:
- Book: ${c.book_name}
- Recipes: ${c.recipes} of ${c.goal} (gap ${c.gap_to_goal})
- Client coldness: ${c.client_coldness_days} days since last client activity (last: ${c.last_client_activity_at ?? 'never'})
- Days until close: ${c.days_until_close ?? 'no close date set'} (source: ${c.close_date_source ?? 'none'})
- Momentum per week (newest first): ${JSON.stringify(c.momentum.per_week)}; stalled: ${c.momentum.stalled}
- Captains: ${c.captains.count} total, ${c.captains.active_count} active
- Contributors: ${c.contributors.distinct_submitters} distinct, owner_submitted: ${c.contributors.owner_submitted}, solo: ${c.contributors.is_solo}
- Owner last login: ${c.owner_last_login_at ?? 'unknown'}
- Last founder outreach: ${c.last_founder_outreach ? `${c.last_founder_outreach.type} on ${c.last_founder_outreach.sent_at}` : 'none'}

Return the JSON.`;
}

export function parseInterpretation(raw: unknown): NotificationInterpretation {
  const r = raw as Record<string, unknown>;
  const fields = ['headline', 'interpretation', 'recommended_action', 'draft_message'] as const;
  for (const f of fields) {
    if (typeof r?.[f] !== 'string' || !(r[f] as string).trim()) throw new Error(`Missing field: ${f}`);
  }
  const allowed: NotificationPriority[] = ['high', 'medium', 'low'];
  const priority = allowed.includes(r.priority as NotificationPriority) ? (r.priority as NotificationPriority) : 'medium';
  return {
    priority,
    headline: r.headline as string,
    interpretation: r.interpretation as string,
    recommended_action: r.recommended_action as string,
    draft_message: r.draft_message as string,
  };
}
```

- [ ] **Step 4: Implement `lib/radar/interpret.ts`**

```typescript
// lib/radar/interpret.ts
import OpenAI from 'openai';
import type { NotificationCandidate, NotificationInterpretation } from './monitor-types';
import { RADAR_MONITOR_SYSTEM_PROMPT, buildUserMessage, parseInterpretation } from './monitor-prompt';

export async function interpretCandidate(
  candidate: NotificationCandidate,
  client?: OpenAI,
): Promise<NotificationInterpretation> {
  const openai = client ?? new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: RADAR_MONITOR_SYSTEM_PROMPT },
      { role: 'user', content: buildUserMessage(candidate) },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.4,
    max_tokens: 700,
  });
  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error('Empty LLM response');
  return parseInterpretation(JSON.parse(content));
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx jest __tests__/radar/interpret.test.ts`
Expected: PASS (all 4). (No network — only pure functions tested.)

- [ ] **Step 6: Commit**

```bash
git add lib/radar/monitor-prompt.ts lib/radar/interpret.ts __tests__/radar/interpret.test.ts
git commit -m "feat(radar): layer 2 LLM interpretation with brand-voice prompt"
```

---

## Task 6: Orchestrator + data fetch

**Files:**
- Create: `lib/radar/run-monitor.ts`

**Interfaces:**
- Consumes: everything above; `createSupabaseAdminClient` from `@/lib/supabase/admin`; `isAdminEmail` from `@/lib/config/admin`.
- Produces: `runRadarMonitor(): Promise<{ generated: number; candidates: number }>`; `fetchMonitorSources(supabase): Promise<{ sources: MonitorSources; adminOwnerIds: Set<string> }>`.

- [ ] **Step 1: Implement `lib/radar/run-monitor.ts`**

```typescript
// lib/radar/run-monitor.ts
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { isAdminEmail } from '@/lib/config/admin';
import { computeCandidates } from './monitor';
import { interpretCandidate } from './interpret';
import { fetchLatestByGroup, persistNotification, shouldGenerate } from './monitor-store';
import type { MonitorSources } from './monitor-types';

// 60-day window matches the existing radar/email queries.
const WINDOW_DAYS = 60;

export async function fetchMonitorSources(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
): Promise<{ sources: MonitorSources; adminOwnerIds: Set<string> }> {
  const since = new Date(Date.now() - WINDOW_DAYS * 86400000).toISOString();

  const [{ data: profiles }, { data: groups }, { data: recipes }, { data: guests }, { data: captains }, { data: comms }, { data: events }] =
    await Promise.all([
      supabase.from('profiles').select('id, email'),
      supabase.from('groups').select('id, name, created_by, created_at, book_status, book_close_date, event_date, gift_date, wedding_date'),
      supabase.from('guest_recipes').select('group_id, guest_id, submitted_at, submission_status').gte('submitted_at', since),
      supabase.from('guests').select('id, group_id, created_at, is_self'),
      supabase.from('group_members').select('group_id, joined_at').eq('role', 'member'),
      supabase.from('communication_log').select('group_id, recipient_profile_id, type, sent_at, created_at').gte('created_at', since),
      supabase.from('user_events').select('group_id, event_name, created_at').gte('created_at', since),
    ]);

  // last_sign_in_at lives on auth.users (not profiles). Mirror lib/email/queries.ts.
  const lastLoginByProfile: Record<string, string | null> = {};
  const { data: authUsers } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  for (const u of authUsers?.users ?? []) lastLoginByProfile[u.id] = u.last_sign_in_at ?? null;

  const adminOwnerIds = new Set(
    (profiles ?? []).filter((p) => isAdminEmail(p.email)).map((p) => p.id),
  );

  const sources: MonitorSources = {
    groups: (groups ?? []).filter((g) => !adminOwnerIds.has(g.created_by)),
    recipes: recipes ?? [],
    guests: guests ?? [],
    captains: captains ?? [],
    comms: comms ?? [],
    events: events ?? [],
    lastLoginByProfile,
  };
  return { sources, adminOwnerIds };
}

export async function runRadarMonitor(): Promise<{ generated: number; candidates: number }> {
  const supabase = createSupabaseAdminClient();
  const now = new Date();
  const { sources } = await fetchMonitorSources(supabase);

  const candidates = computeCandidates(sources, now);
  const existingByGroup = await fetchLatestByGroup(supabase, candidates.map((c) => c.group_id));

  let generated = 0;
  for (const candidate of candidates) {
    const interp = await interpretCandidate(candidate);
    const existing = existingByGroup.get(candidate.group_id) ?? null;
    if (!shouldGenerate(existing, interp, candidate, now)) continue;
    await persistNotification(supabase, existing, candidate, interp, now);
    generated++;
  }
  return { generated, candidates: candidates.length };
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: PASS. (If `group_members` role literal differs, adjust `.eq('role', ...)` to match `lib/types/database.ts`.)

- [ ] **Step 3: Commit**

```bash
git add lib/radar/run-monitor.ts
git commit -m "feat(radar): monitor orchestrator + source fetch"
```

---

## Task 7: Cron route + admin API routes

**Files:**
- Create: `app/api/cron/radar-monitor/route.ts`, `app/api/v1/admin/radar/notifications/route.ts`, `app/api/v1/admin/radar/notifications/regenerate/route.ts`
- Modify: `vercel.json`

**Interfaces:**
- Consumes: `runRadarMonitor` (Task 6), `requireAdminAuth` from `@/lib/auth/admin`, `createSupabaseAdminClient`.
- Produces: `GET /api/cron/radar-monitor`; `GET /api/v1/admin/radar/notifications`; `PATCH /api/v1/admin/radar/notifications`; `POST /api/v1/admin/radar/notifications/regenerate`.

- [ ] **Step 1: Cron route**

```typescript
// app/api/cron/radar-monitor/route.ts
import { NextResponse } from 'next/server';
import { runRadarMonitor } from '@/lib/radar/run-monitor';

export const maxDuration = 300;

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const result = await runRadarMonitor();
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'failed' }, { status: 500 });
  }
}
```

- [ ] **Step 2: Admin list + patch route**

```typescript
// app/api/v1/admin/radar/notifications/route.ts
import { NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth/admin';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { ATTENDED_COOLDOWN_DAYS, DAY_MS } from '@/lib/radar/monitor-constants';

export async function GET() {
  try {
    await requireAdminAuth();
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from('radar_notifications')
      .select('*, groups(name)')
      .eq('status', 'open')
      .order('priority', { ascending: true }) // 'high' < 'low' alphabetically; re-sort client-side
      .order('generated_at', { ascending: false });
    if (error) throw error;
    return NextResponse.json({ notifications: data ?? [] });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unauthorized' }, { status: 401 });
  }
}

export async function PATCH(request: Request) {
  try {
    await requireAdminAuth();
    const { id, status } = (await request.json()) as { id: string; status: 'attended' | 'dismissed' };
    if (!id || !['attended', 'dismissed'].includes(status)) {
      return NextResponse.json({ error: 'Bad request' }, { status: 400 });
    }
    const supabase = createSupabaseAdminClient();
    const now = new Date();
    const patch =
      status === 'attended'
        ? { status, attended_at: now.toISOString(), cooldown_until: new Date(now.getTime() + ATTENDED_COOLDOWN_DAYS * DAY_MS).toISOString() }
        : { status, attended_at: now.toISOString(), cooldown_until: null };
    const { error } = await supabase.from('radar_notifications').update(patch).eq('id', id);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unauthorized' }, { status: 401 });
  }
}
```

- [ ] **Step 3: Regenerate route**

```typescript
// app/api/v1/admin/radar/notifications/regenerate/route.ts
import { NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth/admin';
import { runRadarMonitor } from '@/lib/radar/run-monitor';

export const maxDuration = 300;

export async function POST() {
  try {
    await requireAdminAuth();
    const result = await runRadarMonitor();
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unauthorized' }, { status: 401 });
  }
}
```

- [ ] **Step 4: Add cron to `vercel.json`**

Add to the `crons` array (keep the existing `send-invitations` entry):

```json
    {
      "path": "/api/cron/radar-monitor",
      "schedule": "0 13 * * *"
    }
```

(13:00 UTC ≈ 8am CDMX, matching the founder's morning. `send-invitations` stays at `0 9 * * *`.)

- [ ] **Step 5: Type-check + verify locally**

Run: `npx tsc --noEmit`
Then, with the dev server running and logged in as admin, trigger a generation:
`curl -X POST http://localhost:3000/api/v1/admin/radar/notifications/regenerate` (from the browser session/devtools so the admin cookie is attached), and confirm the JSON `{ ok: true, generated, candidates }`. Then GET the list route and confirm rows return.

- [ ] **Step 6: Commit**

```bash
git add app/api/cron/radar-monitor app/api/v1/admin/radar/notifications vercel.json
git commit -m "feat(radar): cron + admin notifications API + regenerate"
```

---

## Task 8: Notifications UI section + back-button fix

**Files:**
- Create: `components/admin/radar/Notifications.tsx`
- Modify: `components/admin/radar/RadarDashboard.tsx` (mount at top), `components/admin/radar/BookProgress.tsx` + `components/admin/radar/GroupHealthTable.tsx` (back-link fix)

**Interfaces:**
- Consumes: `GET/PATCH /api/v1/admin/radar/notifications`, `POST …/regenerate`.
- Produces: `<Notifications />` React component.

- [ ] **Step 1: Build `Notifications.tsx`**

Fetch on mount from `/api/v1/admin/radar/notifications`; sort client-side by priority (`high`→`medium`→`low`) then `client_coldness_days` from `signals`. Render each as a card: priority badge, `headline`, expandable body with `interpretation`, `recommended_action`, and `draft_message` in a copyable block (button copies to clipboard). Two actions per card calling PATCH: **"Marcar atendido"** (`status:'attended'`) and **"Descartar"** (`status:'dismissed'`), removing the card on success. A header button **"Regenerar ahora"** POSTs to the regenerate route, then refetches. Empty state: "Todo en orden. Ningún libro en riesgo hoy." Admin UI may use raw Tailwind (no `type-*` requirement here). Keep the file under 300 lines; if it grows, extract a `NotificationCard` subcomponent.

```typescript
'use client';
import { useCallback, useEffect, useState } from 'react';
import type { RadarNotificationRow } from '@/lib/radar/monitor-types';

const RANK: Record<string, number> = { high: 0, medium: 1, low: 2 };
type Row = RadarNotificationRow & { groups?: { name: string } | null };

export default function Notifications() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/v1/admin/radar/notifications');
    const json = await res.json();
    const list: Row[] = json.notifications ?? [];
    list.sort((a, b) => RANK[a.priority] - RANK[b.priority] || (b.signals?.client_coldness_days ?? 0) - (a.signals?.client_coldness_days ?? 0));
    setRows(list);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const patch = async (id: string, status: 'attended' | 'dismissed') => {
    await fetch('/api/v1/admin/radar/notifications', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status }) });
    setRows((r) => r.filter((x) => x.id !== id));
  };
  const regenerate = async () => { setBusy(true); await fetch('/api/v1/admin/radar/notifications/regenerate', { method: 'POST' }); await load(); setBusy(false); };

  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Notificaciones</h2>
        <button onClick={regenerate} disabled={busy} className="text-sm text-gray-500 hover:text-gray-900 disabled:opacity-50">
          {busy ? 'Regenerando…' : 'Regenerar ahora'}
        </button>
      </div>
      {loading ? <p className="text-sm text-gray-400">Cargando…</p>
        : rows.length === 0 ? <p className="text-sm text-gray-400">Todo en orden. Ningún libro en riesgo hoy.</p>
        : <ul className="space-y-3">{rows.map((n) => <NotificationCard key={n.id} n={n} onAttend={() => patch(n.id, 'attended')} onDismiss={() => patch(n.id, 'dismissed')} />)}</ul>}
    </section>
  );
}

function NotificationCard({ n, onAttend, onDismiss }: { n: Row; onAttend: () => void; onDismiss: () => void }) {
  const [open, setOpen] = useState(false);
  const color = n.priority === 'high' ? 'bg-red-100 text-red-700' : n.priority === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600';
  return (
    <li className="rounded-xl border border-gray-100 p-4">
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center gap-3 text-left">
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${color}`}>{n.priority}</span>
        <span className="flex-1 text-sm font-medium text-gray-900">{n.headline}</span>
        <span className="text-xs text-gray-400">{n.groups?.name}</span>
      </button>
      {open && (
        <div className="mt-3 space-y-3 text-sm text-gray-700">
          <p>{n.interpretation}</p>
          <p className="text-gray-500"><strong className="text-gray-700">Qué haría:</strong> {n.recommended_action}</p>
          <div className="rounded-lg bg-gray-50 p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs uppercase tracking-wide text-gray-400">Borrador</span>
              <button onClick={() => navigator.clipboard.writeText(n.draft_message)} className="text-xs text-gray-500 hover:text-gray-900">Copiar</button>
            </div>
            <p className="whitespace-pre-wrap text-gray-800">{n.draft_message}</p>
          </div>
          <div className="flex gap-3">
            <button onClick={onAttend} className="rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-medium text-white">Marcar atendido</button>
            <button onClick={onDismiss} className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-600">Descartar</button>
          </div>
        </div>
      )}
    </li>
  );
}
```

- [ ] **Step 2: Mount at top of `RadarDashboard.tsx`**

Import and render `<Notifications />` as the FIRST section inside the dashboard container (above the pulse cards), so it is the first thing seen.

- [ ] **Step 3: Fix the back-button/link bug**

In `BookProgress.tsx` and `GroupHealthTable.tsx`, the per-book links currently point to `/admin/activity/{userId}`. The detail page's "Back" reads its origin from that route. Change the Radar links to carry a return target (e.g. append `?from=radar`) OR point to a Radar-scoped detail; then in the detail page's back link, when `from=radar`, render "← Back to Radar" going to `/admin/radar`. Keep the change minimal: only the links originating in Radar components change, per the "only the named surface" rule.

- [ ] **Step 4: Type-check**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 5: Founder visual verification**

Ask the founder for a screenshot of `/admin/radar` showing the Notifications section (after clicking "Regenerar ahora"), plus a click into a card to confirm the draft renders and "Copiar" works. Do NOT use Playwright. Iterate on wording/priority if the founder flags a bad read.

- [ ] **Step 6: Commit**

```bash
git add components/admin/radar/Notifications.tsx components/admin/radar/RadarDashboard.tsx components/admin/radar/BookProgress.tsx components/admin/radar/GroupHealthTable.tsx
git commit -m "feat(radar): notifications UI section + back-to-radar fix"
```

---

## Final verification

- [ ] `npx jest __tests__/radar/` — all pure-logic suites pass.
- [ ] `npx tsc --noEmit` — clean.
- [ ] Founder ran the migration SQL (Task 3) and confirmed.
- [ ] Founder confirmed via screenshot the section renders, a draft reads well, and the Danay-type book surfaces as high/medium.
- [ ] `CRON_SECRET` and `OPENAI_API_KEY` exist in the deployment environment (both already used by existing features).

## Spec coverage self-check

- Two-layer architecture → Tasks 2 (Layer 1) + 5 (Layer 2). ✅
- Honest client coldness (bug fix) → Task 2 `computeClientColdnessDays` + test. ✅
- Momentum drop / deadline proximity → Task 2 helpers + candidate predicate. ✅
- Factors interpreted (captains, solo vs accompanied, owner login, prior outreach) → Task 2 candidate fields + Task 5 prompt. ✅
- `radar_notifications` table + cooldown/escalation → Tasks 3 + 4. ✅
- Daily cron + "Regenerar ahora" → Task 7. ✅
- Notifications section at top of Radar + draft copy + attended/dismissed → Task 8. ✅
- Back-to-Activity bug → Task 8 Step 3. ✅
- Brand voice on drafts → Global Constraints + Task 5 system prompt + test. ✅
- Phase 2 (email + one-click send) → explicitly out of scope; not tasked. ✅
