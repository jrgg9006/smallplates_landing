# Radar Admin Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `/admin/radar` — founder dashboard with daily pulse, live activity feed, activation funnel, and per-group health — plus a lightweight `user_events` table fed by the existing `trackEvent()` helper.

**Architecture:** One admin GET endpoint fetches raw rows from Supabase (service role) and aggregates in TypeScript (`lib/radar/aggregate.ts`, pure + jest-tested). Client page polls every 60s with visibility pause. A public `POST /api/v1/events` endpoint persists allowlisted client events; one server-side event (`couple_image_uploaded`) is recorded directly in its API route.

**Tech Stack:** Next.js 14 App Router, Supabase (service role via `createSupabaseAdminClient()`), Recharts (new dep, approved), Jest.

**Spec:** `docs/superpowers/specs/2026-06-12-radar-admin-dashboard-design.md`

**Two deviations from spec (better data found during planning):**
1. No `recipe_deleted` client event — `deleteRecipe()` (`lib/supabase/recipes.ts:496`) already soft-deletes via `guest_recipes.deleted_at`. Radar reads deletions from the DB.
2. Pulse card #6 is "Recetas con foto" (couple-image upload has no timestamp column). Instead, `couple_image_uploaded` is recorded server-side in `user_events` from the couple-image route, and feeds the live feed.

**Prerequisite (already done by Ricardo):** `user_events` table exists in Supabase. Verify with:
```sql
select count(*) from public.user_events;
```

---

### Task 1: `user_events` types + analytics persistence

**Files:**
- Modify: `lib/types/database.ts` (add `user_events` to `Tables`)
- Modify: `lib/analytics.ts`

- [ ] **Step 1: Add `user_events` to database types**

In `lib/types/database.ts`, inside `Database['public']['Tables']` (e.g. right after `newsletter_subscribers`, ~line 730), add, matching the file's existing format:

```ts
      user_events: {
        Row: {
          id: number;
          created_at: string;
          user_id: string | null;
          group_id: string | null;
          event_name: string;
          props: Record<string, unknown>;
        };
        Insert: {
          created_at?: string;
          user_id?: string | null;
          group_id?: string | null;
          event_name: string;
          props?: Record<string, unknown>;
        };
        Update: {
          event_name?: string;
          props?: Record<string, unknown>;
        };
      };
```

- [ ] **Step 2: Extend `lib/analytics.ts`**

Add to the `EVENTS` registry (after `WHATSAPP_CLICKED`):

```ts
  SHARE_LINK_COPIED: 'share_link_copied',
```

After the `META_EVENTS` block, add:

```ts
// Reason: ad-hoc event names fired outside the EVENTS registry that we still
// want persisted to user_events; this set is the allowlist for POST /api/v1/events.
const EXTRA_PERSISTED = [
  'onboarding_step_complete',
  'start_recipe',
  'submit_recipe',
  'from_book_view',
  'from_book_cta_click',
  'couple_image_uploaded',
] as const;

export const PERSISTED_EVENTS: ReadonlySet<string> = new Set([
  ...Object.values(EVENTS),
  ...EXTRA_PERSISTED,
]);
```

After `cleanParams`, add:

```ts
// Reason: mirror GA4 events into our own user_events table (Radar dashboard).
// sendBeacon survives page navigations (e.g. share -> WhatsApp redirect).
function persistEvent(name: string, params: TrackParams): void {
  try {
    if (typeof window === 'undefined') return;
    if (!isTrackableHost()) return;
    if (!PERSISTED_EVENTS.has(name)) return;
    const { group_id, ...props } = params;
    const body = JSON.stringify({ event_name: name, group_id, props: cleanParams(props) });
    const blob = new Blob([body], { type: 'application/json' });
    if (navigator.sendBeacon && navigator.sendBeacon('/api/v1/events', blob)) return;
    void fetch('/api/v1/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
    }).catch(() => {});
  } catch {
    // Silent fail. Tracking must never break the app.
  }
}
```

Modify `trackEvent` so persistence runs even when gtag is absent:

```ts
export function trackEvent(name: string, params: TrackParams = {}): void {
  persistEvent(name, params);
  try {
    if (!isTrackableHost()) return;
    if (typeof window.gtag !== 'function') return;
    window.gtag('event', name, cleanParams(params));
  } catch {
    // Silent fail. Tracking must never break the app.
  }
}
```

- [ ] **Step 3: Type check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add lib/types/database.ts lib/analytics.ts
git commit -m "feat(radar): user_events types + persist trackEvent to Supabase"
```

---

### Task 2: `POST /api/v1/events` endpoint

**Files:**
- Create: `app/api/v1/events/route.ts`

- [ ] **Step 1: Create the route**

```ts
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { PERSISTED_EVENTS } from '@/lib/analytics';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(req: NextRequest) {
  try {
    const raw = await req.text();
    if (raw.length > 2000) {
      return NextResponse.json({ error: 'Payload too large' }, { status: 413 });
    }
    const body = JSON.parse(raw) as { event_name?: unknown; group_id?: unknown; props?: unknown };

    const eventName = typeof body.event_name === 'string' ? body.event_name : '';
    if (!PERSISTED_EVENTS.has(eventName)) {
      return NextResponse.json({ error: 'Unknown event' }, { status: 400 });
    }
    const groupId =
      typeof body.group_id === 'string' && UUID_RE.test(body.group_id) ? body.group_id : null;
    const props =
      body.props && typeof body.props === 'object' && !Array.isArray(body.props)
        ? (body.props as Record<string, unknown>)
        : {};

    // Reason: user_id comes from the session cookie, never from the client payload.
    // Anonymous events are valid (pre-signup onboarding steps).
    let userId: string | null = null;
    try {
      const supabase = await createSupabaseServer();
      const { data: { user } } = await supabase.auth.getUser();
      userId = user?.id ?? null;
    } catch {
      userId = null;
    }

    const admin = createSupabaseAdminClient();
    const { error } = await admin.from('user_events').insert({
      event_name: eventName,
      user_id: userId,
      group_id: groupId,
      props,
    });
    if (error) {
      console.error('events: insert failed', error.message);
    }

    // Reason: the client fires-and-forgets; insert failures only matter in server logs.
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error in /api/v1/events:', error);
    return new NextResponse(null, { status: 204 });
  }
}
```

- [ ] **Step 2: Manual smoke test**

Run dev server (`npm run dev`) and:

```bash
curl -i -X POST http://localhost:3000/api/v1/events \
  -H "Content-Type: application/json" \
  -d '{"event_name":"share_link_copied","props":{"channel":"copy"}}'
```
Expected: `204 No Content` (row inserted, `user_id` null).

```bash
curl -i -X POST http://localhost:3000/api/v1/events \
  -H "Content-Type: application/json" \
  -d '{"event_name":"hacker_event"}'
```
Expected: `400` with `{"error":"Unknown event"}`.

Ricardo verifies the inserted row with: `select * from user_events order by id desc limit 5;`

- [ ] **Step 3: Commit**

```bash
git add app/api/v1/events/route.ts
git commit -m "feat(radar): POST /api/v1/events persists allowlisted events"
```

---

### Task 3: Instrument share actions in `ShareCollectionModal`

**Files:**
- Modify: `components/profile/guests/ShareCollectionModal.tsx`

- [ ] **Step 1: Add import**

```ts
import { trackEvent, EVENTS } from '@/lib/analytics';
```

- [ ] **Step 2: Track the 4 share channels**

In `handleCopyLink` (~line 162), after `onLinkCopied?.();`:

```ts
      trackEvent(EVENTS.SHARE_LINK_COPIED, { group_id: groupId ?? undefined, channel: 'copy' });
```

In `handleShareWhatsApp` (~line 174), after `onLinkCopied?.();`:

```ts
    trackEvent(EVENTS.SHARE_LINK_COPIED, { group_id: groupId ?? undefined, channel: 'whatsapp' });
```

In the email-HTML copy handler, after EACH `setEmailCopied(true)` (~lines 246 and 254 — both clipboard branches):

```ts
      trackEvent(EVENTS.SHARE_LINK_COPIED, { group_id: groupId ?? undefined, channel: 'email' });
```

In `handleDownloadQR` (~line 267), at the top of the function body:

```ts
    trackEvent(EVENTS.SHARE_LINK_COPIED, { group_id: groupId ?? undefined, channel: 'qr' });
```

- [ ] **Step 3: Commit**

```bash
git add components/profile/guests/ShareCollectionModal.tsx
git commit -m "feat(radar): track share_link_copied (copy/whatsapp/email/qr)"
```

---

### Task 4: Server-side event for couple image upload

**Files:**
- Create: `lib/radar/track-server.ts`
- Modify: `app/api/v1/groups/[groupId]/couple-image/route.ts`

- [ ] **Step 1: Create the server-side recorder**

`lib/radar/track-server.ts`:

```ts
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

/**
 * Record an event into user_events from server code (API routes).
 * Fire-and-forget contract: never throws, errors only go to server logs.
 */
export async function recordServerEvent(
  eventName: string,
  userId: string | null,
  groupId: string | null,
  props: Record<string, unknown> = {}
): Promise<void> {
  try {
    const admin = createSupabaseAdminClient();
    const { error } = await admin.from('user_events').insert({
      event_name: eventName,
      user_id: userId,
      group_id: groupId,
      props,
    });
    if (error) {
      console.error('recordServerEvent: insert failed', error.message);
    }
  } catch (error) {
    console.error('recordServerEvent failed', error);
  }
}
```

- [ ] **Step 2: Record `couple_image_uploaded` in the couple-image route**

Read `app/api/v1/groups/[groupId]/couple-image/route.ts`. In the POST handler, after the successful DB update of `couple_image_url` and immediately before the success `NextResponse` is returned, add (adapting the user/groupId variable names already in scope in that handler):

```ts
    // Reason: groups has no timestamp for the couple image; this event is the
    // only record of WHEN it was uploaded (Radar feed + funnel analysis).
    await recordServerEvent('couple_image_uploaded', user.id, groupId);
```

with import:

```ts
import { recordServerEvent } from '@/lib/radar/track-server';
```

- [ ] **Step 3: Type check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add lib/radar/track-server.ts "app/api/v1/groups/[groupId]/couple-image/route.ts"
git commit -m "feat(radar): record couple_image_uploaded server-side"
```

---

### Task 5: Radar types

**Files:**
- Create: `lib/radar/types.ts`

- [ ] **Step 1: Create the types file**

```ts
// Raw rows fetched by lib/radar/queries.ts (minimal columns only).

export interface ProfileRow {
  id: string;
  email: string | null;
  full_name: string | null;
  created_at: string;
}

export interface GroupRow {
  id: string;
  name: string | null;
  created_by: string;
  created_at: string;
  status: string | null;
  book_status: string | null;
  couple_image_url: string | null;
}

export interface GuestRow {
  id: string;
  group_id: string;
  first_name: string | null;
  last_name: string | null;
  created_at: string;
  source: string | null;
  is_self: boolean | null;
}

export interface RecipeRow {
  id: string;
  group_id: string | null;
  guest_id: string | null;
  recipe_name: string | null;
  created_at: string;
  deleted_at: string | null;
  image_url: string | null;
  source: string | null;
}

export interface CommRow {
  id: string;
  group_id: string | null;
  type: string;
  channel: string | null;
  status: string | null;
  sent_at: string | null;
  created_at: string;
}

export interface EditRow {
  id: string;
  recipe_id: string;
  edited_by: string | null;
  created_at: string;
}

export interface OrderRow {
  id: string;
  group_id: string | null;
  user_id: string | null;
  amount_total: number | null;
  status: string;
  created_at: string;
}

export interface UserEventRow {
  id: number;
  user_id: string | null;
  group_id: string | null;
  event_name: string;
  props: Record<string, unknown>;
  created_at: string;
}

export interface RadarSources {
  profiles: ProfileRow[];
  groups: GroupRow[];
  guests: GuestRow[];
  recipes: RecipeRow[];
  comms: CommRow[];
  edits: EditRow[];
  orders: OrderRow[];
  events: UserEventRow[];
}

// Aggregated payload served by GET /api/v1/admin/radar.

export type RangeKey = 'today' | 'd7' | 'd30';

export interface RangeNumbers {
  current: number;
  previous: number;
}

export interface PulseMetric {
  key: string;
  label: string;
  definition: string; // shown in the (i) tooltip — exact, unambiguous
  today: RangeNumbers;
  d7: RangeNumbers;
  d30: RangeNumbers;
  spark: number[]; // last 14 daily counts, oldest first
}

export type FeedKind =
  | 'signup'
  | 'book_created'
  | 'recipe_created'
  | 'recipe_edited'
  | 'recipe_deleted'
  | 'guest_added'
  | 'email_sent'
  | 'order'
  | 'share'
  | 'couple_image';

export interface FeedItem {
  id: string;
  at: string; // ISO timestamp
  kind: FeedKind;
  text: string;
}

export interface FunnelStep {
  key: string;
  label: string;
  definition: string;
  count: number;
}

export interface GroupHealthRow {
  groupId: string;
  name: string;
  ownerUserId: string | null;
  ownerName: string | null;
  stage: string;
  recipes: number;
  recipesWithPhoto: number;
  guests: number;
  lastEmailAt: string | null;
  lastActivityAt: string | null;
  daysInactive: number;
  health: 'green' | 'yellow' | 'red';
}

export interface RadarPayload {
  generatedAt: string;
  pulse: PulseMetric[];
  feed: FeedItem[];
  funnel: FunnelStep[];
  groups: GroupHealthRow[];
  degraded: string[]; // source keys that failed to load
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/radar/types.ts
git commit -m "feat(radar): payload and source-row types"
```

---

### Task 6: Aggregation functions (TDD)

**Files:**
- Test: `lib/radar/aggregate.test.ts`
- Create: `lib/radar/aggregate.ts`

All date math uses `America/Mexico_City` day boundaries (the founder's timezone; Vercel runs UTC).

- [ ] **Step 1: Write the failing tests**

`lib/radar/aggregate.test.ts`:

```ts
import {
  dailySeries,
  computePulse,
  buildPulseMetrics,
  computeFunnel,
  computeGroupHealth,
  buildFeed,
} from './aggregate';
import type { RadarSources } from './types';

// 18:00 UTC = 12:00 in America/Mexico_City — same calendar day, no boundary surprises.
const NOW = new Date('2026-06-12T18:00:00.000Z');
const DAY = 86_400_000;
const at = (daysAgo: number) => new Date(NOW.getTime() - daysAgo * DAY).toISOString();

const empty = (): RadarSources => ({
  profiles: [],
  groups: [],
  guests: [],
  recipes: [],
  comms: [],
  edits: [],
  orders: [],
  events: [],
});

describe('dailySeries', () => {
  it('counts timestamps into per-day buckets, oldest first', () => {
    const series = dailySeries([at(0), at(0), at(1), at(3)], 4, NOW);
    expect(series).toEqual([1, 0, 1, 2]); // day-3, day-2, day-1, today
  });

  it('ignores timestamps outside the window', () => {
    expect(dailySeries([at(10)], 3, NOW)).toEqual([0, 0, 0]);
  });
});

describe('computePulse', () => {
  it('computes today vs yesterday and 7d windows', () => {
    const stamps = [at(0), at(0), at(1), at(8)]; // 2 today, 1 yesterday, 1 eight days ago
    const pulse = computePulse(stamps, NOW);
    expect(pulse.today).toEqual({ current: 2, previous: 1 });
    expect(pulse.d7.current).toBe(3); // today + yesterday
    expect(pulse.d7.previous).toBe(1); // the day-8 one
    expect(pulse.spark).toHaveLength(14);
    expect(pulse.spark[13]).toBe(2); // today is last
  });
});

describe('computeFunnel', () => {
  it('counts cohort users reaching each stage', () => {
    const d = empty();
    d.profiles = [
      { id: 'u1', email: 'a@x.com', full_name: 'Ana', created_at: at(5) },
      { id: 'u2', email: 'b@x.com', full_name: 'Beto', created_at: at(5) },
      { id: 'u3', email: 'c@x.com', full_name: 'Old', created_at: at(45) }, // outside cohort
    ];
    d.groups = [
      { id: 'g1', name: 'Boda Ana', created_by: 'u1', created_at: at(4), status: 'free_tier', book_status: 'active', couple_image_url: 'http://img' },
      { id: 'g3', name: 'Viejo', created_by: 'u3', created_at: at(44), status: 'active', book_status: 'active', couple_image_url: null },
    ];
    d.guests = [
      { id: 'gu1', group_id: 'g1', first_name: 'Tía', last_name: 'Lupe', created_at: at(3), source: 'collection', is_self: false },
    ];
    d.recipes = Array.from({ length: 5 }, (_, i) => ({
      id: `r${i}`, group_id: 'g1', guest_id: 'gu1', recipe_name: `Receta ${i}`,
      created_at: at(2), deleted_at: null, image_url: null, source: 'collection',
    }));
    d.orders = [
      { id: 'o1', group_id: 'g1', user_id: null, amount_total: 16900, status: 'paid', created_at: at(1) },
    ];

    const funnel = computeFunnel(d, NOW);
    const byKey = Object.fromEntries(funnel.map((s) => [s.key, s.count]));
    expect(byKey).toEqual({
      signup: 2, // u1 + u2 (u3 outside 30d)
      book: 1,
      guest: 1,
      shared: 1, // guest with source=collection (proxy)
      recipe1: 1,
      recipe5: 1,
      photo: 1,
      paid: 1,
    });
  });
});

describe('computeGroupHealth', () => {
  it('flags inactive groups red and computes stage', () => {
    const d = empty();
    d.profiles = [{ id: 'u1', email: 'a@x.com', full_name: 'Ana', created_at: at(20) }];
    d.groups = [
      { id: 'g1', name: 'Boda Ana', created_by: 'u1', created_at: at(20), status: 'free_tier', book_status: 'active', couple_image_url: null },
    ];
    d.guests = [
      { id: 'gu1', group_id: 'g1', first_name: 'Tía', last_name: null, created_at: at(10), source: 'manual', is_self: false },
    ];

    const rows = computeGroupHealth(d, NOW);
    expect(rows).toHaveLength(1);
    expect(rows[0].health).toBe('red'); // last activity 10 days ago
    expect(rows[0].daysInactive).toBe(10);
    expect(rows[0].stage).toBe('Invitados agregados');
    expect(rows[0].ownerName).toBe('Ana');
  });

  it('flags recent activity green', () => {
    const d = empty();
    d.profiles = [{ id: 'u1', email: 'a@x.com', full_name: 'Ana', created_at: at(20) }];
    d.groups = [
      { id: 'g1', name: 'Boda Ana', created_by: 'u1', created_at: at(20), status: 'free_tier', book_status: 'active', couple_image_url: null },
    ];
    d.recipes = [
      { id: 'r1', group_id: 'g1', guest_id: null, recipe_name: 'Mole', created_at: at(1), deleted_at: null, image_url: null, source: 'manual' },
    ];

    const rows = computeGroupHealth(d, NOW);
    expect(rows[0].health).toBe('green');
  });
});

describe('buildFeed', () => {
  it('merges sources, newest first, including soft-deleted recipes', () => {
    const d = empty();
    d.profiles = [{ id: 'u1', email: 'a@x.com', full_name: 'Ana', created_at: at(2) }];
    d.groups = [
      { id: 'g1', name: 'Boda Ana', created_by: 'u1', created_at: at(1), status: 'free_tier', book_status: 'active', couple_image_url: null },
    ];
    d.recipes = [
      { id: 'r1', group_id: 'g1', guest_id: null, recipe_name: 'Mole', created_at: at(1), deleted_at: at(0), image_url: null, source: 'manual' },
    ];

    const feed = buildFeed(d);
    expect(feed[0].kind).toBe('recipe_deleted'); // most recent event
    expect(feed[0].text).toContain('Mole');
    const kinds = feed.map((f) => f.kind);
    expect(kinds).toEqual(expect.arrayContaining(['signup', 'book_created', 'recipe_created', 'recipe_deleted']));
  });

  it('caps the feed at 50 items', () => {
    const d = empty();
    d.profiles = Array.from({ length: 80 }, (_, i) => ({
      id: `u${i}`, email: `u${i}@x.com`, full_name: null, created_at: at(0),
    }));
    expect(buildFeed(d)).toHaveLength(50);
  });
});

describe('buildPulseMetrics', () => {
  it('returns the 6 cards with definitions', () => {
    const metrics = buildPulseMetrics(empty(), NOW);
    expect(metrics.map((m) => m.key)).toEqual([
      'users', 'books', 'recipes', 'guests', 'emails', 'photos',
    ]);
    for (const m of metrics) {
      expect(m.definition.length).toBeGreaterThan(10);
      expect(m.spark).toHaveLength(14);
    }
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx jest lib/radar/aggregate.test.ts`
Expected: FAIL — `Cannot find module './aggregate'`.

- [ ] **Step 3: Implement `lib/radar/aggregate.ts`**

```ts
import type {
  RadarSources,
  PulseMetric,
  FeedItem,
  FunnelStep,
  GroupHealthRow,
  RangeNumbers,
} from './types';

// Reason: day boundaries in the founder's timezone — Vercel runs UTC and a
// 7pm CDMX signup must count as "today", not "tomorrow".
const TZ = 'America/Mexico_City';
const DAY_MS = 86_400_000;

export function dayKey(d: string | Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(typeof d === 'string' ? new Date(d) : d);
}

/** Per-day counts for the last `days` days ending today, oldest first. */
export function dailySeries(timestamps: string[], days: number, now: Date): number[] {
  const keys: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    keys.push(dayKey(new Date(now.getTime() - i * DAY_MS)));
  }
  const counts = new Map<string, number>(keys.map((k) => [k, 0]));
  for (const ts of timestamps) {
    const k = dayKey(ts);
    const prev = counts.get(k);
    if (prev !== undefined) counts.set(k, prev + 1);
  }
  return keys.map((k) => counts.get(k) ?? 0);
}

interface PulseComputed {
  today: RangeNumbers;
  d7: RangeNumbers;
  d30: RangeNumbers;
  spark: number[];
}

export function computePulse(timestamps: string[], now: Date): PulseComputed {
  const s = dailySeries(timestamps, 60, now);
  const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);
  const tail = (n: number) => s.slice(s.length - n);
  const prevWindow = (n: number) => s.slice(s.length - 2 * n, s.length - n);
  return {
    today: { current: s[s.length - 1], previous: s[s.length - 2] },
    d7: { current: sum(tail(7)), previous: sum(prevWindow(7)) },
    d30: { current: sum(tail(30)), previous: sum(prevWindow(30)) },
    spark: tail(14),
  };
}

const SENT_STATUSES = new Set(['sent', 'delivered', 'opened']);

export function buildPulseMetrics(d: RadarSources, now: Date): PulseMetric[] {
  const cards: { key: string; label: string; definition: string; timestamps: string[] }[] = [
    {
      key: 'users',
      label: 'Usuarios nuevos',
      definition: 'Cuentas creadas ese día (profiles.created_at).',
      timestamps: d.profiles.map((p) => p.created_at),
    },
    {
      key: 'books',
      label: 'Libros creados',
      definition: 'Libros/grupos creados ese día (groups.created_at).',
      timestamps: d.groups.map((g) => g.created_at),
    },
    {
      key: 'recipes',
      label: 'Recetas nuevas',
      definition:
        'Recetas creadas ese día, por cualquier vía: link de invitados, manual o import (guest_recipes.created_at). Incluye las que luego se borraron.',
      timestamps: d.recipes.map((r) => r.created_at),
    },
    {
      key: 'guests',
      label: 'Invitados agregados',
      definition:
        'Invitados dados de alta ese día — manual, vía link o import (guests.created_at). Excluye al propio organizador (is_self).',
      timestamps: d.guests.filter((g) => !g.is_self).map((g) => g.created_at),
    },
    {
      key: 'emails',
      label: 'Correos enviados',
      definition:
        'Correos con status sent/delivered/opened en communication_log (invitaciones, reminders, etc.).',
      timestamps: d.comms
        .filter((c) => SENT_STATUSES.has(c.status ?? ''))
        .map((c) => c.sent_at ?? c.created_at),
    },
    {
      key: 'photos',
      label: 'Recetas con foto',
      definition:
        'Recetas creadas ese día que incluyen imagen (guest_recipes.image_url). Señal de calidad del contenido.',
      timestamps: d.recipes.filter((r) => r.image_url).map((r) => r.created_at),
    },
  ];
  return cards.map(({ timestamps, ...rest }) => ({ ...rest, ...computePulse(timestamps, now) }));
}

const SHARE_EVENTS = new Set(['share_link_copied', 'share']);

export function computeFunnel(d: RadarSources, now: Date): FunnelStep[] {
  const since = now.getTime() - 30 * DAY_MS;
  const cohort = new Set(
    d.profiles.filter((p) => new Date(p.created_at).getTime() >= since).map((p) => p.id)
  );

  // group id -> cohort owner id (only groups owned by cohort users count)
  const groupOwner = new Map<string, string>();
  for (const g of d.groups) {
    if (cohort.has(g.created_by)) groupOwner.set(g.id, g.created_by);
  }

  const book = new Set<string>();
  const guest = new Set<string>();
  const shared = new Set<string>();
  const recipe1 = new Set<string>();
  const recipe5 = new Set<string>();
  const photo = new Set<string>();
  const paid = new Set<string>();

  for (const g of d.groups) {
    const owner = groupOwner.get(g.id);
    if (!owner) continue;
    book.add(owner);
    if (g.couple_image_url) photo.add(owner);
  }

  for (const gu of d.guests) {
    const owner = groupOwner.get(gu.group_id);
    if (!owner) continue;
    if (!gu.is_self) guest.add(owner);
    // Reason: proxy — a guest arriving via the collection link proves the link
    // was shared, even before share_link_copied events accumulate.
    if (gu.source === 'collection') shared.add(owner);
  }

  const recipesPerOwner = new Map<string, number>();
  for (const r of d.recipes) {
    const owner = r.group_id ? groupOwner.get(r.group_id) : undefined;
    if (!owner) continue;
    recipesPerOwner.set(owner, (recipesPerOwner.get(owner) ?? 0) + 1);
  }
  for (const [owner, n] of recipesPerOwner) {
    if (n >= 1) recipe1.add(owner);
    if (n >= 5) recipe5.add(owner);
  }

  for (const e of d.events) {
    if (!SHARE_EVENTS.has(e.event_name)) continue;
    if (e.user_id && cohort.has(e.user_id)) shared.add(e.user_id);
    const owner = e.group_id ? groupOwner.get(e.group_id) : undefined;
    if (owner) shared.add(owner);
  }

  for (const o of d.orders) {
    if (o.status === 'refunded') continue;
    const byGroup = o.group_id ? groupOwner.get(o.group_id) : undefined;
    const byUser = o.user_id && cohort.has(o.user_id) ? o.user_id : undefined;
    const owner = byGroup ?? byUser;
    if (owner) paid.add(owner);
  }

  return [
    { key: 'signup', label: 'Registro', definition: 'Usuarios registrados en los últimos 30 días.', count: cohort.size },
    { key: 'book', label: 'Libro creado', definition: 'Del cohorte, cuántos crearon al menos un libro.', count: book.size },
    { key: 'guest', label: '≥1 invitado', definition: 'Agregaron al menos un invitado (sin contarse a sí mismos).', count: guest.size },
    { key: 'shared', label: 'Link compartido', definition: 'Evento share_link_copied, o proxy: algún invitado llegó vía el link de colección.', count: shared.size },
    { key: 'recipe1', label: '1ª receta', definition: 'Su libro tiene al menos una receta.', count: recipe1.size },
    { key: 'recipe5', label: '≥5 recetas', definition: 'Su libro tiene 5 o más recetas.', count: recipe5.size },
    { key: 'photo', label: 'Foto del libro', definition: 'Subieron la foto principal del libro (couple_image_url).', count: photo.size },
    { key: 'paid', label: 'Compra', definition: 'Tienen al menos una orden pagada (orders, excluye refunded).', count: paid.size },
  ];
}

const STAGE_ORDER = [
  'Libro creado',
  'Invitados agregados',
  'Link compartido',
  '1ª receta',
  '5+ recetas',
  'Foto subida',
  'Compró',
] as const;

export function computeGroupHealth(d: RadarSources, now: Date): GroupHealthRow[] {
  const profileById = new Map(d.profiles.map((p) => [p.id, p]));
  const recipeGroup = new Map(d.recipes.map((r) => [r.id, r.group_id]));

  const rows: GroupHealthRow[] = [];

  for (const g of d.groups) {
    if (g.book_status === 'inactive') continue;

    const recipes = d.recipes.filter((r) => r.group_id === g.id && !r.deleted_at);
    const guests = d.guests.filter((gu) => gu.group_id === g.id && !gu.is_self);
    const comms = d.comms.filter((c) => c.group_id === g.id);
    const edits = d.edits.filter((e) => recipeGroup.get(e.recipe_id) === g.id);
    const events = d.events.filter((e) => e.group_id === g.id);

    const sharedProxy =
      guests.some((gu) => gu.source === 'collection') ||
      events.some((e) => SHARE_EVENTS.has(e.event_name));
    const hasPaid = d.orders.some((o) => o.group_id === g.id && o.status !== 'refunded');

    let stageIdx = 0; // 'Libro creado'
    if (guests.length > 0) stageIdx = 1;
    if (sharedProxy) stageIdx = 2;
    if (recipes.length >= 1) stageIdx = 3;
    if (recipes.length >= 5) stageIdx = 4;
    if (g.couple_image_url && stageIdx >= 4) stageIdx = 5;
    if (hasPaid) stageIdx = 6;

    const timestamps: number[] = [
      new Date(g.created_at).getTime(),
      ...recipes.map((r) => new Date(r.created_at).getTime()),
      ...guests.map((gu) => new Date(gu.created_at).getTime()),
      ...comms.map((c) => new Date(c.sent_at ?? c.created_at).getTime()),
      ...edits.map((e) => new Date(e.created_at).getTime()),
      ...events.map((e) => new Date(e.created_at).getTime()),
    ];
    const last = Math.max(...timestamps);
    const daysInactive = Math.floor((now.getTime() - last) / DAY_MS);

    const sentComms = comms
      .filter((c) => SENT_STATUSES.has(c.status ?? ''))
      .map((c) => c.sent_at ?? c.created_at)
      .sort();

    const owner = profileById.get(g.created_by);

    rows.push({
      groupId: g.id,
      name: g.name ?? 'Libro sin nombre',
      ownerUserId: owner?.id ?? null,
      ownerName: owner?.full_name || owner?.email || null,
      stage: STAGE_ORDER[stageIdx],
      recipes: recipes.length,
      recipesWithPhoto: recipes.filter((r) => r.image_url).length,
      guests: guests.length,
      lastEmailAt: sentComms[sentComms.length - 1] ?? null,
      lastActivityAt: new Date(last).toISOString(),
      daysInactive,
      health: daysInactive < 3 ? 'green' : daysInactive <= 7 ? 'yellow' : 'red',
    });
  }

  // Reason: riskiest first — red groups are the founder's daily call list.
  const rank = { red: 0, yellow: 1, green: 2 } as const;
  rows.sort((a, b) => rank[a.health] - rank[b.health] || b.daysInactive - a.daysInactive);
  return rows;
}

export function buildFeed(d: RadarSources, limit = 50): FeedItem[] {
  const groupName = new Map(d.groups.map((g) => [g.id, g.name ?? 'Libro sin nombre']));
  const guestName = new Map(
    d.guests.map((gu) => [
      gu.id,
      [gu.first_name, gu.last_name].filter(Boolean).join(' ') || 'Invitado',
    ])
  );
  const profName = new Map(
    d.profiles.map((p) => [p.id, p.full_name || p.email || 'Usuario'])
  );
  const inGroup = (id: string | null) => (id && groupName.has(id) ? ` — ${groupName.get(id)}` : '');

  const items: FeedItem[] = [];

  for (const p of d.profiles) {
    items.push({
      id: `signup-${p.id}`,
      at: p.created_at,
      kind: 'signup',
      text: `Nuevo registro: ${p.full_name || p.email || '—'}`,
    });
  }

  for (const g of d.groups) {
    items.push({
      id: `book-${g.id}`,
      at: g.created_at,
      kind: 'book_created',
      text: `Libro creado: ${g.name ?? 'sin nombre'} (${profName.get(g.created_by) ?? '—'})`,
    });
  }

  for (const r of d.recipes) {
    const via =
      r.source === 'collection' ? ' (vía link)' : r.source === 'imported' ? ' (import)' : '';
    const who = r.guest_id ? guestName.get(r.guest_id) ?? 'Alguien' : 'El organizador';
    items.push({
      id: `recipe-${r.id}`,
      at: r.created_at,
      kind: 'recipe_created',
      text: `${who} subió "${r.recipe_name ?? 'receta'}"${r.image_url ? ' con foto' : ''}${via}${inGroup(r.group_id)}`,
    });
    if (r.deleted_at) {
      items.push({
        id: `recipe-del-${r.id}`,
        at: r.deleted_at,
        kind: 'recipe_deleted',
        text: `Receta eliminada: "${r.recipe_name ?? 'receta'}"${inGroup(r.group_id)}`,
      });
    }
  }

  for (const gu of d.guests) {
    if (gu.is_self) continue;
    const via = gu.source === 'imported' ? ' (import)' : gu.source === 'collection' ? ' (vía link)' : '';
    items.push({
      id: `guest-${gu.id}`,
      at: gu.created_at,
      kind: 'guest_added',
      text: `Invitado agregado: ${guestName.get(gu.id)}${via}${inGroup(gu.group_id)}`,
    });
  }

  for (const c of d.comms) {
    if (!SENT_STATUSES.has(c.status ?? '') && c.status !== 'failed') continue;
    items.push({
      id: `comm-${c.id}`,
      at: c.sent_at ?? c.created_at,
      kind: 'email_sent',
      text: `Correo ${c.type}${c.status === 'failed' ? ' FALLÓ' : ' enviado'}${inGroup(c.group_id)}`,
    });
  }

  for (const e of d.edits) {
    items.push({
      id: `edit-${e.id}`,
      at: e.created_at,
      kind: 'recipe_edited',
      text: `Receta editada por ${e.edited_by ? profName.get(e.edited_by) ?? 'alguien' : 'alguien'}`,
    });
  }

  for (const o of d.orders) {
    items.push({
      id: `order-${o.id}`,
      at: o.created_at,
      kind: 'order',
      text: `Compra de $${((o.amount_total ?? 0) / 100).toFixed(0)} USD${inGroup(o.group_id)}`,
    });
  }

  for (const e of d.events) {
    if (SHARE_EVENTS.has(e.event_name)) {
      const channel = typeof e.props.channel === 'string' ? e.props.channel : 'link';
      items.push({
        id: `ev-${e.id}`,
        at: e.created_at,
        kind: 'share',
        text: `${e.user_id ? profName.get(e.user_id) ?? 'Alguien' : 'Alguien'} compartió el link (${channel})${inGroup(e.group_id)}`,
      });
    } else if (e.event_name === 'couple_image_uploaded') {
      items.push({
        id: `ev-${e.id}`,
        at: e.created_at,
        kind: 'couple_image',
        text: `Subió la foto principal del libro${inGroup(e.group_id)}`,
      });
    }
  }

  items.sort((a, b) => (a.at < b.at ? 1 : -1));
  return items.slice(0, limit);
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx jest lib/radar/aggregate.test.ts`
Expected: ALL PASS. If a test fails, fix the implementation (not the test) unless the test contradicts the spec.

- [ ] **Step 5: Commit**

```bash
git add lib/radar/aggregate.ts lib/radar/aggregate.test.ts
git commit -m "feat(radar): pure aggregation functions with tests"
```

---

### Task 7: Supabase queries

**Files:**
- Create: `lib/radar/queries.ts`

- [ ] **Step 1: Create the queries module**

```ts
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import type { RadarSources } from './types';

// Reason: 60 days covers the pulse 30-vs-previous-30 comparison. Small tables
// (profiles/groups/guests/recipes/orders) are fetched whole — needed for
// group-health counts and tiny at current scale; revisit with Postgres views
// when row counts grow past the limits below.
const SINCE_DAYS = 60;
const DAY_MS = 86_400_000;

export async function fetchRadarSources(): Promise<{
  sources: RadarSources;
  degraded: string[];
}> {
  const supabase = createSupabaseAdminClient();
  const since = new Date(Date.now() - SINCE_DAYS * DAY_MS).toISOString();

  const queries = {
    profiles: supabase
      .from('profiles')
      .select('id, email, full_name, created_at')
      .limit(5000),
    groups: supabase
      .from('groups')
      .select('id, name, created_by, created_at, status, book_status, couple_image_url')
      .limit(5000),
    guests: supabase
      .from('guests')
      .select('id, group_id, first_name, last_name, created_at, source, is_self')
      .limit(10000),
    recipes: supabase
      .from('guest_recipes')
      .select('id, group_id, guest_id, recipe_name, created_at, deleted_at, image_url, source')
      .limit(10000),
    comms: supabase
      .from('communication_log')
      .select('id, group_id, type, channel, status, sent_at, created_at')
      .gte('created_at', since)
      .limit(10000),
    edits: supabase
      .from('recipe_edit_history')
      .select('id, recipe_id, edited_by, created_at')
      .gte('created_at', since)
      .limit(5000),
    orders: supabase
      .from('orders')
      .select('id, group_id, user_id, amount_total, status, created_at')
      .limit(5000),
    events: supabase
      .from('user_events')
      .select('id, user_id, group_id, event_name, props, created_at')
      .gte('created_at', since)
      .limit(10000),
  };

  const keys = Object.keys(queries) as (keyof typeof queries)[];
  const settled = await Promise.allSettled(Object.values(queries));

  const degraded: string[] = [];
  const out: Record<string, unknown[]> = {};
  keys.forEach((key, i) => {
    const result = settled[i];
    if (result.status === 'fulfilled' && !result.value.error) {
      out[key] = result.value.data ?? [];
    } else {
      // Reason: one broken source must not blank the whole dashboard —
      // mark it degraded and render the rest.
      out[key] = [];
      degraded.push(key);
      const msg =
        result.status === 'rejected' ? String(result.reason) : result.value.error?.message;
      console.error(`radar: source "${key}" failed`, msg);
    }
  });

  return { sources: out as unknown as RadarSources, degraded };
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/radar/queries.ts
git commit -m "feat(radar): source queries with per-source degradation"
```

---

### Task 8: `GET /api/v1/admin/radar`

**Files:**
- Create: `app/api/v1/admin/radar/route.ts`

- [ ] **Step 1: Create the route**

```ts
import { NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth/admin';
import { fetchRadarSources } from '@/lib/radar/queries';
import {
  buildPulseMetrics,
  buildFeed,
  computeFunnel,
  computeGroupHealth,
} from '@/lib/radar/aggregate';
import type { RadarPayload } from '@/lib/radar/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await requireAdminAuth();

    const now = new Date();
    const { sources, degraded } = await fetchRadarSources();

    const payload: RadarPayload = {
      generatedAt: now.toISOString(),
      pulse: buildPulseMetrics(sources, now),
      feed: buildFeed(sources),
      funnel: computeFunnel(sources, now),
      groups: computeGroupHealth(sources, now),
      degraded,
    };

    return NextResponse.json(payload);
  } catch (error) {
    console.error('Error in /api/v1/admin/radar:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unauthorized' },
      { status: 401 }
    );
  }
}
```

- [ ] **Step 2: Manual smoke test**

With dev server running and logged in as an admin in the browser, open `http://localhost:3000/api/v1/admin/radar`.
Expected: JSON with `pulse` (6 items), `feed`, `funnel` (8 steps), `groups`, `degraded: []`.
Logged out (incognito): expected `401`.

- [ ] **Step 3: Type check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add app/api/v1/admin/radar/route.ts
git commit -m "feat(radar): admin radar endpoint"
```

---

### Task 9: Install Recharts

- [ ] **Step 1: Install (approved by Ricardo)**

Run: `npm install recharts`
Expected: added to `dependencies` in `package.json`, no peer-dep errors.

- [ ] **Step 2: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore(radar): add recharts (approved)"
```

---

### Task 10: UI building blocks

**Files:**
- Create: `components/admin/radar/InfoTip.tsx`
- Create: `components/admin/radar/timeAgo.ts`
- Create: `components/admin/radar/PulseCards.tsx`
- Create: `components/admin/radar/LiveFeed.tsx`
- Create: `components/admin/radar/ActivationFunnel.tsx`
- Create: `components/admin/radar/GroupHealthTable.tsx`

Admin UI is exempt from the `type-*` typography system (functional UI per CLAUDE.md). Match existing admin styling: white cards, `rounded-xl shadow-lg`, gray text scale, honey `#D4A854` accents.

- [ ] **Step 1: `InfoTip.tsx`**

```tsx
'use client';

// Reason: every Radar metric carries its exact definition — "nada ambiguo".
export function InfoTip({ text }: { text: string }) {
  return (
    <span className="group/tip relative inline-block align-middle">
      <span className="ml-1.5 inline-flex h-4 w-4 cursor-help items-center justify-center rounded-full bg-gray-200 text-[10px] font-semibold text-gray-500">
        i
      </span>
      <span className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 hidden w-60 -translate-x-1/2 rounded-lg bg-gray-900 px-3 py-2 text-xs font-normal normal-case leading-snug text-white shadow-lg group-hover/tip:block">
        {text}
      </span>
    </span>
  );
}
```

- [ ] **Step 2: `timeAgo.ts`**

```ts
export function timeAgo(iso: string, nowMs: number = Date.now()): string {
  const s = Math.max(0, Math.floor((nowMs - new Date(iso).getTime()) / 1000));
  if (s < 60) return 'hace unos segundos';
  const m = Math.floor(s / 60);
  if (m < 60) return `hace ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.floor(h / 24);
  return d === 1 ? 'hace 1 día' : `hace ${d} días`;
}
```

- [ ] **Step 3: `PulseCards.tsx`**

```tsx
'use client';

import { Line, LineChart, ResponsiveContainer } from 'recharts';
import type { PulseMetric, RangeKey, RangeNumbers } from '@/lib/radar/types';
import { InfoTip } from './InfoTip';

const RANGE_DELTA_LABEL: Record<RangeKey, string> = {
  today: 'vs ayer',
  d7: 'vs 7d previos',
  d30: 'vs 30d previos',
};

function Delta({ numbers, range }: { numbers: RangeNumbers; range: RangeKey }) {
  const diff = numbers.current - numbers.previous;
  if (numbers.current === 0 && numbers.previous === 0) {
    return <span className="text-xs text-gray-400">sin movimiento</span>;
  }
  const color = diff > 0 ? 'text-emerald-600' : diff < 0 ? 'text-red-500' : 'text-gray-400';
  const arrow = diff > 0 ? '▲' : diff < 0 ? '▼' : '=';
  return (
    <span className={`text-xs font-medium ${color}`}>
      {arrow} {Math.abs(diff)} {RANGE_DELTA_LABEL[range]}
    </span>
  );
}

export function PulseCards({ metrics, range }: { metrics: PulseMetric[]; range: RangeKey }) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
      {metrics.map((m) => {
        const numbers = m[range];
        return (
          <div key={m.key} className="rounded-xl bg-white p-4 shadow-lg">
            <div className="flex items-center text-xs font-semibold uppercase tracking-wide text-gray-500">
              {m.label}
              <InfoTip text={m.definition} />
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-gray-900">{numbers.current}</span>
              <Delta numbers={numbers} range={range} />
            </div>
            <div className="mt-2 h-9">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={m.spark.map((v, i) => ({ i, v }))}>
                  <Line type="monotone" dataKey="v" stroke="#D4A854" strokeWidth={2} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-1 text-[10px] text-gray-400">últimos 14 días</div>
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 4: `LiveFeed.tsx`**

```tsx
'use client';

import type { FeedItem, FeedKind } from '@/lib/radar/types';
import { InfoTip } from './InfoTip';
import { timeAgo } from './timeAgo';

const KIND_ICON: Record<FeedKind, string> = {
  signup: '👋',
  book_created: '📖',
  recipe_created: '🍲',
  recipe_edited: '✏️',
  recipe_deleted: '🗑️',
  guest_added: '👤',
  email_sent: '✉️',
  order: '💰',
  share: '🔗',
  couple_image: '📸',
};

export function LiveFeed({ items }: { items: FeedItem[] }) {
  return (
    <div className="rounded-xl bg-white p-5 shadow-lg">
      <div className="mb-3 flex items-center text-sm font-semibold uppercase tracking-wide text-gray-700">
        Feed en vivo
        <InfoTip text="Las últimas 50 acciones de usuarios en la plataforma, de todas las fuentes, más reciente primero. Se actualiza cada 60 segundos." />
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-gray-400">Sin actividad reciente.</p>
      ) : (
        <ul className="max-h-[70vh] space-y-3 overflow-y-auto pr-1">
          {items.map((item) => (
            <li key={item.id} className="flex items-start gap-2.5 text-sm">
              <span className="mt-0.5 text-base leading-none">{KIND_ICON[item.kind]}</span>
              <div className="min-w-0">
                <p className="text-gray-800">{item.text}</p>
                <p className="text-xs text-gray-400">{timeAgo(item.at)}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

- [ ] **Step 5: `ActivationFunnel.tsx`**

```tsx
'use client';

import type { FunnelStep } from '@/lib/radar/types';
import { InfoTip } from './InfoTip';

export function ActivationFunnel({ steps }: { steps: FunnelStep[] }) {
  const base = steps[0]?.count ?? 0;
  return (
    <div className="rounded-xl bg-white p-5 shadow-lg">
      <div className="mb-1 flex items-center text-sm font-semibold uppercase tracking-wide text-gray-700">
        Funnel de activación
        <InfoTip text="Cohorte: usuarios registrados en los últimos 30 días. Cada barra muestra cuántos de ellos llegaron a ese paso y el % respecto al registro." />
      </div>
      <p className="mb-4 text-xs text-gray-400">Registros de los últimos 30 días</p>
      <div className="space-y-2.5">
        {steps.map((step, i) => {
          const pct = base > 0 ? Math.round((step.count / base) * 100) : 0;
          const prev = steps[i - 1]?.count ?? step.count;
          const stepPct = i > 0 && prev > 0 ? Math.round((step.count / prev) * 100) : null;
          return (
            <div key={step.key}>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="flex items-center font-medium text-gray-700">
                  {step.label}
                  <InfoTip text={step.definition} />
                </span>
                <span className="text-gray-500">
                  {step.count} · {pct}%
                  {stepPct !== null && (
                    <span className="ml-1 text-gray-400">({stepPct}% del paso previo)</span>
                  )}
                </span>
              </div>
              <div className="h-5 w-full rounded bg-gray-100">
                <div
                  className="h-5 rounded bg-[#D4A854] transition-all duration-500"
                  style={{ width: `${Math.max(pct, step.count > 0 ? 3 : 0)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 6: `GroupHealthTable.tsx`**

```tsx
'use client';

import Link from 'next/link';
import type { GroupHealthRow } from '@/lib/radar/types';
import { InfoTip } from './InfoTip';
import { timeAgo } from './timeAgo';

const DOT: Record<GroupHealthRow['health'], string> = {
  green: 'bg-emerald-500',
  yellow: 'bg-amber-400',
  red: 'bg-red-500',
};

export function GroupHealthTable({ rows }: { rows: GroupHealthRow[] }) {
  return (
    <div className="rounded-xl bg-white p-5 shadow-lg">
      <div className="mb-3 flex items-center text-sm font-semibold uppercase tracking-wide text-gray-700">
        Salud por libro
        <InfoTip text="Un renglón por libro activo, ordenado por riesgo. Última actividad = lo más reciente entre recetas, invitados, correos, ediciones y shares. Verde: <3 días. Amarillo: 3–7. Rojo: >7 días sin actividad." />
      </div>
      {rows.length === 0 ? (
        <p className="text-sm text-gray-400">No hay libros activos.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-400">
                <th className="py-2 pr-3 font-medium">Libro</th>
                <th className="py-2 pr-3 font-medium">Etapa</th>
                <th className="py-2 pr-3 font-medium">Recetas</th>
                <th className="py-2 pr-3 font-medium">Invitados</th>
                <th className="py-2 pr-3 font-medium">Último correo</th>
                <th className="py-2 font-medium">Actividad</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.groupId} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-2.5 pr-3">
                    {row.ownerUserId ? (
                      <Link href={`/admin/activity/${row.ownerUserId}`} className="font-medium text-gray-900 hover:underline">
                        {row.name}
                      </Link>
                    ) : (
                      <span className="font-medium text-gray-900">{row.name}</span>
                    )}
                    <div className="text-xs text-gray-400">{row.ownerName ?? '—'}</div>
                  </td>
                  <td className="py-2.5 pr-3 text-gray-600">{row.stage}</td>
                  <td className="py-2.5 pr-3 text-gray-600">
                    {row.recipes}
                    <span className="text-xs text-gray-400"> ({row.recipesWithPhoto} c/foto)</span>
                  </td>
                  <td className="py-2.5 pr-3 text-gray-600">{row.guests}</td>
                  <td className="py-2.5 pr-3 text-xs text-gray-500">
                    {row.lastEmailAt ? timeAgo(row.lastEmailAt) : 'nunca'}
                  </td>
                  <td className="py-2.5">
                    <span className="flex items-center gap-1.5 text-xs text-gray-600">
                      <span className={`h-2.5 w-2.5 rounded-full ${DOT[row.health]}`} />
                      {row.daysInactive === 0 ? 'hoy' : `${row.daysInactive} d sin actividad`}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 7: Commit**

```bash
git add components/admin/radar/
git commit -m "feat(radar): UI building blocks (pulse, feed, funnel, health)"
```

---

### Task 11: Dashboard shell, page, and admin hub card

**Files:**
- Create: `components/admin/radar/RadarDashboard.tsx`
- Create: `app/(admin)/admin/radar/page.tsx`
- Modify: `app/(admin)/admin/page.tsx` (add hub card after the Activity card, ~line 206)

- [ ] **Step 1: `RadarDashboard.tsx`**

```tsx
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { RadarPayload, RangeKey } from '@/lib/radar/types';
import { PulseCards } from './PulseCards';
import { LiveFeed } from './LiveFeed';
import { ActivationFunnel } from './ActivationFunnel';
import { GroupHealthTable } from './GroupHealthTable';

const POLL_MS = 60_000;

const RANGE_LABEL: Record<RangeKey, string> = {
  today: 'Hoy',
  d7: '7 días',
  d30: '30 días',
};

export default function RadarDashboard() {
  const [data, setData] = useState<RadarPayload | null>(null);
  const [range, setRange] = useState<RangeKey>('today');
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/admin/radar', { cache: 'no-store' });
      if (!res.ok) {
        throw new Error(res.status === 401 ? 'No autorizado' : `Error ${res.status}`);
      }
      const payload = (await res.json()) as RadarPayload;
      setData(payload);
      setError(null);
      setLastFetch(Date.now());
    } catch (e) {
      // Reason: keep the last good data on screen — a blip must not blank the radar.
      setError(e instanceof Error ? e.message : 'Error de conexión');
    }
  }, []);

  useEffect(() => {
    const start = () => {
      void load();
      timerRef.current = setInterval(() => void load(), POLL_MS);
    };
    const stop = () => {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
    };
    // Reason: pause polling in hidden tabs — zero wasted requests.
    const onVisibility = () => (document.hidden ? stop() : start());

    start();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [load]);

  return (
    <div className="min-h-screen bg-[#FAF7F2] p-6 lg:p-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">📡 Radar</h1>
            <p className="text-sm text-gray-500">
              Qué están haciendo los usuarios, ahora mismo
              {lastFetch && (
                <span className="ml-2 text-xs text-gray-400">
                  · actualizado {new Date(lastFetch).toLocaleTimeString('es-MX')}
                </span>
              )}
            </p>
          </div>
          <div className="flex rounded-lg bg-white p-1 shadow">
            {(Object.keys(RANGE_LABEL) as RangeKey[]).map((key) => (
              <button
                key={key}
                onClick={() => setRange(key)}
                className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                  range === key ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {RANGE_LABEL[key]}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm text-amber-800">
            {error === 'No autorizado'
              ? 'No autorizado — inicia sesión con una cuenta admin.'
              : `Sin conexión (${error}) — mostrando los últimos datos, reintentando…`}
          </div>
        )}
        {data && data.degraded.length > 0 && (
          <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm text-amber-800">
            Fuentes con error (sección incompleta): {data.degraded.join(', ')}
          </div>
        )}

        {!data && !error && <p className="text-sm text-gray-400">Cargando radar…</p>}

        {data && (
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <div className="space-y-6 xl:col-span-2">
              <PulseCards metrics={data.pulse} range={range} />
              <ActivationFunnel steps={data.funnel} />
              <GroupHealthTable rows={data.groups} />
            </div>
            <div>
              <LiveFeed items={data.feed} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: `app/(admin)/admin/radar/page.tsx`**

```tsx
import RadarDashboard from '@/components/admin/radar/RadarDashboard';

export default function RadarPage() {
  return <RadarDashboard />;
}
```

- [ ] **Step 3: Add hub card**

In `app/(admin)/admin/page.tsx`, immediately AFTER the closing `</Link>` of the Activity card (~line 206), add:

```tsx
          {/* Radar */}
          <Link href="/admin/radar" className="group">
            <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-2xl transition-all duration-300 border-2 border-transparent group-hover:border-black cursor-pointer h-full">
              <div className="text-5xl mb-4">📡</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Radar</h2>
              <p className="text-gray-600 mb-4">
                Pulso diario, feed en vivo, funnel de activación y salud por libro
              </p>
              <div className="flex items-center text-sm text-gray-500 group-hover:text-black transition-colors">
                <span>Open radar</span>
                <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>
```

- [ ] **Step 4: Commit**

```bash
git add components/admin/radar/RadarDashboard.tsx "app/(admin)/admin/radar/page.tsx" "app/(admin)/admin/page.tsx"
git commit -m "feat(radar): dashboard page with 60s polling and hub card"
```

---

### Task 12: Final verification and spec sync

**Files:**
- Modify: `docs/superpowers/specs/2026-06-12-radar-admin-dashboard-design.md`

- [ ] **Step 1: Full check suite**

```bash
npx tsc --noEmit && npm run lint && npx jest lib/radar/aggregate.test.ts
```
Expected: all pass, no errors.

- [ ] **Step 2: Visual verification by Ricardo (NOT Playwright)**

Run `npm run dev`, ask Ricardo to open `http://localhost:3000/admin/radar` logged in as admin and send a screenshot. Check together: 6 pulse cards with sparklines and (i) tooltips, live feed with real events, 8-step funnel, health table sorted red-first, range selector switches instantly, "actualizado HH:MM" ticks after 60s.

- [ ] **Step 3: Sync the spec with the two planning deviations**

In the spec, update: (a) section 3 — remove the `recipe_deleted` client event (soft delete via `guest_recipes.deleted_at` covers it) and add `couple_image_uploaded` as a server-side event recorded in the couple-image route; (b) section 4 — "Receta eliminada" source is `guest_recipes.deleted_at`; (c) section 5.1 — card #6 is "Recetas con foto" (couple image has no timestamp; its upload appears in the feed via the server event).

- [ ] **Step 4: Final commit**

```bash
git add docs/superpowers/specs/2026-06-12-radar-admin-dashboard-design.md
git commit -m "docs(radar): sync spec with implementation decisions"
```
