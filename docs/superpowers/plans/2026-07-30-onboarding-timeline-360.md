# Onboarding Timeline 360 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a per-user "primeros momentos" onboarding timeline (10 milestones with timestamps + deltas) to the existing `/admin/activity/[userId]` drill-down.

**Architecture:** A pure, testable engine (`buildOnboardingTimeline`) turns already-captured state + events into `Milestone[]`. The admin data layer gathers the inputs and the API returns them; a presentation component renders them between the stats bar and the guests table. No new tracking — the engine reads existing `groups`/`group_members`/`guests`/`guest_recipes`/`group_invitations`/`user_events`.

**Tech Stack:** Next.js 14 App Router, TypeScript strict, Tailwind, Supabase (service-role admin client), Jest.

## Global Constraints

- TypeScript strict. No `any` types.
- Marketing/public copy uses `type-*` classes; this is **admin/dashboard UI**, so raw Tailwind font utilities are allowed (per CLAUDE.md typography exception).
- No new dependencies.
- Files under 300 lines.
- `// Reason:` comments on non-obvious logic only.
- Run `npx tsc --noEmit` after a series of TypeScript changes (not per edit).
- Never run destructive Supabase ops. This feature is read-only (SELECTs via service client).
- Verify UI by asking Ricardo for a screenshot — do NOT set up Playwright/headless (per project rule).
- All timestamps from Supabase are UTC ISO strings; lexicographic order == chronological.
- Brand voice: labels are internal admin, Spanish, plain. Avoid banned words (cherish/journey/etc.) — not a concern for these functional labels but keep them plain.

---

### Task 0: Commit the pending instrumentation already on this branch

The branch `feature/onboarding-timeline-360` carries uncommitted edits from prior work in this effort (the `share_message_edited` event + the couple-image feed text tweak). Commit them so the working tree is clean before TDD.

**Files (already edited, just verify + commit):**
- `lib/analytics.ts` — `share_message_edited` added to `EXTRA_PERSISTED`
- `lib/supabase/groups.ts` — fires `trackEvent('share_message_edited', { group_id })` on success; imports `trackEvent`
- `lib/radar/types.ts` — `FeedKind` gains `'share_message'`
- `lib/radar/aggregate.ts` — feed branch for `share_message_edited`; couple-image text now names the actor
- `components/admin/radar/LiveFeed.tsx` — `share_message: '💬'` icon

- [ ] **Step 1: Confirm the working tree matches the above**

Run: `git status --short && git diff --stat`
Expected: the 5 files above show as modified, nothing else.

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Run the radar aggregate tests (guard against feed regressions)**

Run: `npx jest lib/radar/aggregate.test.ts`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add lib/analytics.ts lib/supabase/groups.ts lib/radar/types.ts lib/radar/aggregate.ts components/admin/radar/LiveFeed.tsx
git commit -m "feat(radar): track share_message_edited event + name actor on couple-image feed line

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 1: The pure engine `buildOnboardingTimeline` + types + tests (TDD)

**Files:**
- Create: `lib/radar/onboarding-timeline.ts`
- Test: `lib/radar/onboarding-timeline.test.ts`

**Interfaces:**
- Consumes: nothing (pure function over plain inputs).
- Produces (later tasks rely on these exact names/types):

```ts
export type MilestoneKey =
  | 'account_created' | 'book_created' | 'occasion' | 'delivery_date'
  | 'photo' | 'share_message' | 'captain' | 'shared_link'
  | 'first_guest' | 'first_recipe';

export interface Milestone {
  key: MilestoneKey;
  label: string;                  // Spanish, admin-facing
  done: boolean;
  at: string | null;              // ISO; null when done via state with no event timestamp
  source: 'event' | 'state';
  detail?: string;                // e.g. "Wedding", "Victor & Karla", "copy_link"
  deltaFromPrevMs: number | null; // vs previous done milestone that had an `at`
}

export interface OnboardingSummary {
  milestones: Milestone[];
  signupToFirstShareMs: number | null;
  hasShared: boolean;
  multipleBooks: boolean;
}

export interface OnboardingInputs {
  profile: { id: string; created_at: string };
  groups: Array<{
    id: string;
    name: string | null;
    created_at: string;
    created_by: string;
    occasion: string | null;
    gift_date: string | null;
    event_date: string | null;
    couple_image_url: string | null;
    captain_invite_token: string | null;
  }>;
  groupMember: { custom_share_message: string | null } | null;
  invitations: Array<{ group_id: string; created_at: string }>;
  guests: Array<{
    id: string;
    group_id: string | null;
    first_name: string | null;
    last_name: string | null;
    created_at: string;
    is_self: boolean;
  }>;
  firstRecipeAt: string | null;
  events: Array<{ event_name: string; group_id: string | null; created_at: string; props: Record<string, unknown> }>;
}

export function buildOnboardingTimeline(input: OnboardingInputs): OnboardingSummary;
```

- [ ] **Step 1: Write the failing tests**

Create `lib/radar/onboarding-timeline.test.ts`:

```ts
import { buildOnboardingTimeline, OnboardingInputs } from './onboarding-timeline';

// Reason: fixed ISO helpers — never use Date.now(); timestamps are deterministic.
const T0 = '2026-07-29T23:32:00.000Z';
const t = (min: number) => new Date(Date.parse(T0) + min * 60_000).toISOString();

function baseInput(): OnboardingInputs {
  return {
    profile: { id: 'u1', created_at: T0 },
    groups: [{
      id: 'g1', name: 'Victor & Karla', created_at: T0, created_by: 'u1',
      occasion: 'wedding', gift_date: '2026-12-12', event_date: null,
      couple_image_url: 'http://img/x.jpg', captain_invite_token: null,
    }],
    groupMember: { custom_share_message: 'hey come add a recipe' },
    invitations: [],
    guests: [
      { id: 'self', group_id: 'g1', first_name: 'Victor', last_name: 'Sosa', created_at: T0, is_self: true },
      { id: 'ge1', group_id: 'g1', first_name: 'V.', last_name: 'Sosa', created_at: t(68), is_self: false },
    ],
    firstRecipeAt: t(93),
    events: [
      { event_name: 'book_created', group_id: 'g1', created_at: t(14), props: {} },
      { event_name: 'couple_image_uploaded', group_id: 'g1', created_at: t(47), props: {} },
      { event_name: 'share_message_edited', group_id: 'g1', created_at: t(50), props: {} },
      { event_name: 'share_link_copied', group_id: 'g1', created_at: t(61), props: { channel: 'copy_link' } },
    ],
  };
}

function byKey(s: ReturnType<typeof buildOnboardingTimeline>) {
  return Object.fromEntries(s.milestones.map((m) => [m.key, m]));
}

test('full journey: all 10 milestones done, deltas and star metric correct', () => {
  const s = buildOnboardingTimeline(baseInput());
  const m = byKey(s);
  expect(s.milestones).toHaveLength(10);
  expect(m.account_created.done).toBe(true);
  expect(m.account_created.at).toBe(T0);
  expect(m.book_created.done).toBe(true);
  expect(m.book_created.detail).toBe('Victor & Karla');
  expect(m.book_created.at).toBe(t(14));
  expect(m.occasion.detail).toBe('wedding');
  expect(m.photo.at).toBe(t(47));
  expect(m.photo.source).toBe('event');
  expect(m.shared_link.done).toBe(true);
  expect(m.shared_link.detail).toBe('copy_link');
  expect(m.first_guest.detail).toBe('V. Sosa');
  expect(m.first_recipe.at).toBe(t(93));
  // delta photo->shared uses previous milestone WITH an at (photo at 47), not the
  // state-only share_message (at null): shared at 61 => 14 min.
  expect(m.shared_link.deltaFromPrevMs).toBe(14 * 60_000);
  expect(s.hasShared).toBe(true);
  expect(s.signupToFirstShareMs).toBe(61 * 60_000);
  expect(s.multipleBooks).toBe(false);
});

test('state without event: photo present but no event => done, at null, source state', () => {
  const input = baseInput();
  input.events = input.events.filter((e) => e.event_name !== 'couple_image_uploaded');
  const m = byKey(buildOnboardingTimeline(input));
  expect(m.photo.done).toBe(true);
  expect(m.photo.at).toBeNull();
  expect(m.photo.source).toBe('state');
  expect(m.photo.deltaFromPrevMs).toBeNull();
});

test('not shared yet: hasShared false, signupToFirstShareMs null', () => {
  const input = baseInput();
  input.events = input.events.filter(
    (e) => e.event_name !== 'share_link_copied' && e.event_name !== 'share'
  );
  const s = buildOnboardingTimeline(input);
  expect(s.hasShared).toBe(false);
  expect(s.signupToFirstShareMs).toBeNull();
  expect(byKey(s).shared_link.done).toBe(false);
});

test('pending milestones: no state, no event => done false', () => {
  const input = baseInput();
  input.groups[0].occasion = null;
  input.groups[0].captain_invite_token = null;
  input.invitations = [];
  const m = byKey(buildOnboardingTimeline(input));
  expect(m.occasion.done).toBe(false);
  expect(m.captain.done).toBe(false);
});

test('captain via token only: done true, at null', () => {
  const input = baseInput();
  input.groups[0].captain_invite_token = 'tok123';
  const m = byKey(buildOnboardingTimeline(input));
  expect(m.captain.done).toBe(true);
  expect(m.captain.at).toBeNull();
});

test('captain via email invite: done true with earliest invitation time', () => {
  const input = baseInput();
  input.invitations = [
    { group_id: 'g1', created_at: t(30) },
    { group_id: 'g1', created_at: t(20) },
  ];
  const m = byKey(buildOnboardingTimeline(input));
  expect(m.captain.done).toBe(true);
  expect(m.captain.at).toBe(t(20));
});

test('multiple books: anchors to most recent group and flags multipleBooks', () => {
  const input = baseInput();
  input.groups = [
    { ...input.groups[0], id: 'gOld', name: 'Old', created_at: t(-1000) },
    { ...input.groups[0], id: 'gNew', name: 'New', created_at: T0 },
  ];
  const s = buildOnboardingTimeline(input);
  expect(s.multipleBooks).toBe(true);
  expect(byKey(s).book_created.detail).toBe('New');
});

test('no group at all: book_created + downstream pending, no crash', () => {
  const input = baseInput();
  input.groups = [];
  input.groupMember = null;
  const s = buildOnboardingTimeline(input);
  const m = byKey(s);
  expect(m.account_created.done).toBe(true);
  expect(m.book_created.done).toBe(false);
  expect(m.occasion.done).toBe(false);
  expect(s.multipleBooks).toBe(false);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx jest lib/radar/onboarding-timeline.test.ts`
Expected: FAIL with "Cannot find module './onboarding-timeline'".

- [ ] **Step 3: Write the implementation**

Create `lib/radar/onboarding-timeline.ts`:

```ts
// Reason: assembles the per-user onboarding "primeros momentos" timeline from
// already-captured state + events. Pure and testable; reused by Newborns later.

export type MilestoneKey =
  | 'account_created' | 'book_created' | 'occasion' | 'delivery_date'
  | 'photo' | 'share_message' | 'captain' | 'shared_link'
  | 'first_guest' | 'first_recipe';

export interface Milestone {
  key: MilestoneKey;
  label: string;
  done: boolean;
  at: string | null;
  source: 'event' | 'state';
  detail?: string;
  deltaFromPrevMs: number | null;
}

export interface OnboardingSummary {
  milestones: Milestone[];
  signupToFirstShareMs: number | null;
  hasShared: boolean;
  multipleBooks: boolean;
}

export interface OnboardingInputs {
  profile: { id: string; created_at: string };
  groups: Array<{
    id: string;
    name: string | null;
    created_at: string;
    created_by: string;
    occasion: string | null;
    gift_date: string | null;
    event_date: string | null;
    couple_image_url: string | null;
    captain_invite_token: string | null;
  }>;
  groupMember: { custom_share_message: string | null } | null;
  invitations: Array<{ group_id: string; created_at: string }>;
  guests: Array<{
    id: string;
    group_id: string | null;
    first_name: string | null;
    last_name: string | null;
    created_at: string;
    is_self: boolean;
  }>;
  firstRecipeAt: string | null;
  events: Array<{ event_name: string; group_id: string | null; created_at: string; props: Record<string, unknown> }>;
}

const SHARE_EVENTS = new Set(['share', 'share_link_copied']);

// Reason: earliest ISO string in a list, or null. Lexicographic == chronological (UTC).
function earliest(times: string[]): string | null {
  if (times.length === 0) return null;
  return times.reduce((min, t) => (t < min ? t : min));
}

function ms(a: string, b: string): number {
  return Date.parse(a) - Date.parse(b);
}

export function buildOnboardingTimeline(input: OnboardingInputs): OnboardingSummary {
  const ownGroups = input.groups
    .filter((g) => g.created_by === input.profile.id)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
  const group = ownGroups[0] ?? null;
  const multipleBooks = ownGroups.length > 1;

  const groupEvents = group
    ? input.events.filter((e) => e.group_id === group.id)
    : [];
  const eventAt = (name: string): string | null =>
    earliest(groupEvents.filter((e) => e.event_name === name).map((e) => e.created_at));

  // shared link: any share-family event on this group
  const shareTimes = groupEvents
    .filter((e) => SHARE_EVENTS.has(e.event_name))
    .map((e) => e.created_at);
  const sharedAt = earliest(shareTimes);
  const shareEvt = groupEvents
    .filter((e) => SHARE_EVENTS.has(e.event_name))
    .sort((a, b) => a.created_at.localeCompare(b.created_at))[0];
  const shareChannel =
    typeof shareEvt?.props.channel === 'string'
      ? (shareEvt.props.channel as string)
      : typeof shareEvt?.props.method === 'string'
        ? (shareEvt.props.method as string)
        : shareEvt
          ? 'link'
          : undefined;

  // first non-self guest for this group
  const firstGuest = group
    ? input.guests
        .filter((g) => !g.is_self && g.group_id === group.id)
        .sort((a, b) => a.created_at.localeCompare(b.created_at))[0]
    : undefined;
  const guestName = firstGuest
    ? [firstGuest.first_name, firstGuest.last_name].filter(Boolean).join(' ') || 'Guest'
    : undefined;

  // captain: email invites for this group OR a captain link token generated
  const groupInvites = group
    ? input.invitations.filter((i) => i.group_id === group.id)
    : [];
  const captainAt = earliest(groupInvites.map((i) => i.created_at));
  const captainDone = groupInvites.length > 0 || !!group?.captain_invite_token;

  const deliveryDate = group?.gift_date ?? group?.event_date ?? null;

  // Reason: state answers "did it happen"; event answers "when". done via state
  // with no event => at:null, source:'state' ("✓ sin hora").
  const raw: Array<Omit<Milestone, 'deltaFromPrevMs'>> = [
    {
      key: 'account_created', label: 'Cuenta creada', done: true,
      at: input.profile.created_at, source: 'state',
    },
    {
      key: 'book_created', label: 'Libro creado', done: !!group,
      at: group ? (eventAt('book_created') ?? group.created_at) : null,
      source: eventAt('book_created') ? 'event' : 'state',
      detail: group?.name ?? undefined,
    },
    {
      key: 'occasion', label: 'Ocasión elegida', done: !!group?.occasion,
      at: null, source: 'state', detail: group?.occasion ?? undefined,
    },
    {
      key: 'delivery_date', label: 'Fecha de entrega', done: !!deliveryDate,
      at: null, source: 'state', detail: deliveryDate ?? undefined,
    },
    {
      key: 'photo', label: 'Foto subida', done: !!group?.couple_image_url,
      at: eventAt('couple_image_uploaded'),
      source: eventAt('couple_image_uploaded') ? 'event' : 'state',
    },
    {
      key: 'share_message', label: 'Mensaje del link editado',
      done: !!input.groupMember?.custom_share_message,
      at: eventAt('share_message_edited'),
      source: eventAt('share_message_edited') ? 'event' : 'state',
    },
    {
      key: 'captain', label: 'Capitán invitado', done: captainDone,
      at: captainAt, source: captainAt ? 'event' : 'state',
    },
    {
      key: 'shared_link', label: 'Link compartido', done: !!sharedAt,
      at: sharedAt, source: 'event', detail: shareChannel,
    },
    {
      key: 'first_guest', label: 'Primer guest', done: !!firstGuest,
      at: firstGuest?.created_at ?? null, source: 'event', detail: guestName,
    },
    {
      key: 'first_recipe', label: 'Primera receta recibida', done: !!input.firstRecipeAt,
      at: input.firstRecipeAt, source: 'event',
    },
  ];

  // deltaFromPrevMs: vs previous DONE milestone that had an `at`.
  let lastAt: string | null = null;
  const milestones: Milestone[] = raw.map((m) => {
    let delta: number | null = null;
    if (m.at) {
      delta = lastAt ? ms(m.at, lastAt) : null;
      lastAt = m.at;
    }
    return { ...m, deltaFromPrevMs: delta };
  });

  const hasShared = !!sharedAt;
  const signupToFirstShareMs = sharedAt ? ms(sharedAt, input.profile.created_at) : null;

  return { milestones, signupToFirstShareMs, hasShared, multipleBooks };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx jest lib/radar/onboarding-timeline.test.ts`
Expected: PASS (8 tests).

- [ ] **Step 5: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add lib/radar/onboarding-timeline.ts lib/radar/onboarding-timeline.test.ts
git commit -m "feat(radar): onboarding timeline engine (buildOnboardingTimeline)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: Data layer — gather inputs and return `onboarding` from the API

**Files:**
- Modify: `lib/supabase/admin-users.ts` (add `getUserOnboardingAdmin`)
- Modify: `app/api/v1/admin/activity/users/[userId]/route.ts:14-30`

**Interfaces:**
- Consumes: `buildOnboardingTimeline`, `OnboardingSummary`, `OnboardingInputs` from Task 1.
- Produces: `getUserOnboardingAdmin(userId: string): Promise<OnboardingSummary | null>`; API GET response gains `onboarding: OnboardingSummary | null` alongside `profile` and `guests`.

- [ ] **Step 1: Add the gathering function**

In `lib/supabase/admin-users.ts`, add at the end (after imports, add `import { buildOnboardingTimeline, OnboardingSummary } from '@/lib/radar/onboarding-timeline';` at top):

```ts
export async function getUserOnboardingAdmin(userId: string): Promise<OnboardingSummary | null> {
  const supabase = createSupabaseAdminClient();

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, created_at')
    .eq('id', userId)
    .single();
  if (!profile) return null;

  const { data: groups } = await supabase
    .from('groups')
    .select('id, name, created_at, created_by, occasion, gift_date, event_date, couple_image_url, captain_invite_token')
    .eq('created_by', userId)
    .order('created_at', { ascending: false });

  const primary = groups?.[0] ?? null;

  // Reason: the owner's own group_members row holds their custom_share_message.
  const { data: groupMember } = primary
    ? await supabase
        .from('group_members')
        .select('custom_share_message')
        .eq('group_id', primary.id)
        .eq('profile_id', userId)
        .maybeSingle()
    : { data: null };

  const { data: invitations } = primary
    ? await supabase
        .from('group_invitations')
        .select('group_id, created_at')
        .eq('group_id', primary.id)
    : { data: [] };

  const { data: guests } = primary
    ? await supabase
        .from('guests')
        .select('id, group_id, first_name, last_name, created_at, is_self')
        .eq('group_id', primary.id)
    : { data: [] };

  // Reason: earliest recipe timestamp for the primary group = "first recipe received".
  const { data: firstRecipe } = primary
    ? await supabase
        .from('guest_recipes')
        .select('created_at')
        .eq('group_id', primary.id)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle()
    : { data: null };

  const { data: events } = await supabase
    .from('user_events')
    .select('event_name, group_id, created_at, props')
    .eq('user_id', userId);

  return buildOnboardingTimeline({
    profile,
    groups: groups ?? [],
    groupMember: groupMember ?? null,
    invitations: invitations ?? [],
    guests: guests ?? [],
    firstRecipeAt: firstRecipe?.created_at ?? null,
    events: (events ?? []).map((e) => ({
      event_name: e.event_name,
      group_id: e.group_id,
      created_at: e.created_at,
      props: (e.props ?? {}) as Record<string, unknown>,
    })),
  });
}
```

- [ ] **Step 2: Wire it into the API route**

In `app/api/v1/admin/activity/users/[userId]/route.ts`, import and call it, adding `onboarding` to the response:

```ts
import { getUserWithGuestsAdmin, getUserOnboardingAdmin } from '@/lib/supabase/admin-users';
// ...
const { profile, guests, error } = await getUserWithGuestsAdmin(userId);
// ...after the not-found guard...
const onboarding = await getUserOnboardingAdmin(userId);
return NextResponse.json({ profile, guests, onboarding });
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Smoke test the endpoint (manual)**

Ask Ricardo (or, if a dev session with a logged-in admin cookie is available) to hit `/api/v1/admin/activity/users/<a-real-userId>?from=radar` and confirm the JSON now contains an `onboarding` object with a `milestones` array. If not runnable locally, defer verification to Task 3's visual check.
Expected: response includes `onboarding.milestones` (length 10) for a user with a book.

- [ ] **Step 5: Commit**

```bash
git add lib/supabase/admin-users.ts "app/api/v1/admin/activity/users/[userId]/route.ts"
git commit -m "feat(radar): serve onboarding timeline from user activity API

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: Presentation — `OnboardingTimeline` component + insert into drill-down page

**Files:**
- Create: `components/admin/radar/OnboardingTimeline.tsx`
- Modify: `app/(admin)/admin/activity/[userId]/page.tsx` (add `onboarding` to state + render component between stats bar and guests table)

**Interfaces:**
- Consumes: `OnboardingSummary`, `Milestone` from `lib/radar/onboarding-timeline`. Reuses `feedTime`/`feedDayLabel` from `components/admin/radar/timeAgo` for timestamp formatting.
- Produces: `<OnboardingTimeline summary={OnboardingSummary} />`.

- [ ] **Step 1: Create the component**

Create `components/admin/radar/OnboardingTimeline.tsx`:

```tsx
'use client';

import type { Milestone, OnboardingSummary } from '@/lib/radar/onboarding-timeline';
import { feedTime, feedDayLabel } from './timeAgo';

// Reason: humanize a millisecond delta into a short "+14 min" / "+3 h" / "+2 d".
function fmtDelta(msVal: number): string {
  const min = Math.round(msVal / 60_000);
  if (min < 1) return '+0 min';
  if (min < 60) return `+${min} min`;
  const hrs = Math.round(min / 60);
  if (hrs < 48) return `+${hrs} h`;
  return `+${Math.round(hrs / 24)} d`;
}

function fmtStar(msVal: number): string {
  const min = Math.round(msVal / 60_000);
  if (min < 60) return `${min} min`;
  const hrs = Math.floor(min / 60);
  const rem = min % 60;
  if (hrs < 48) return rem ? `${hrs}h ${rem}m` : `${hrs}h`;
  return `${Math.round(hrs / 24)} d`;
}

function whenLabel(m: Milestone): string {
  if (!m.done) return '— todavía no';
  if (!m.at) return '✓ (sin hora)';
  return `${feedDayLabel(m.at)} ${feedTime(m.at)}`;
}

export function OnboardingTimeline({ summary }: { summary: OnboardingSummary }) {
  const { milestones, hasShared, signupToFirstShareMs } = summary;

  const star = hasShared && signupToFirstShareMs !== null
    ? { text: `Registro → 1er share: ${fmtStar(signupToFirstShareMs)}`, danger: false }
    : { text: 'Aún no comparte', danger: true };

  return (
    <div className="bg-white rounded-xl shadow-md p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-700">
          Primeros momentos
        </h2>
        <span className={`text-sm font-medium ${star.danger ? 'text-red-600' : 'text-gray-700'}`}>
          {star.text}
        </span>
      </div>

      {summary.multipleBooks && (
        <p className="mb-3 text-xs text-amber-700 bg-amber-50 rounded px-2 py-1">
          Este usuario tiene más de un libro — mostrando el más reciente.
        </p>
      )}

      <ol className="space-y-0">
        {milestones.map((m) => (
          <li key={m.key} className="relative pl-6">
            {/* dot */}
            <span
              className={`absolute left-0 top-1.5 h-2.5 w-2.5 rounded-full ${
                m.done ? 'bg-[#D4A854]' : 'border border-gray-300 bg-white'
              }`}
            />
            <div className="flex items-baseline justify-between py-1.5">
              <span className={`text-sm ${m.done ? 'text-gray-900' : 'text-gray-400'}`}>
                {m.label}
                {m.detail ? <span className="text-gray-500">: {m.detail}</span> : null}
              </span>
              <span className={`text-xs ${m.done ? 'text-gray-500' : 'text-gray-400'}`}>
                {whenLabel(m)}
              </span>
            </div>
            {m.deltaFromPrevMs !== null && (
              <div className="ml-[-1px] border-l border-gray-200 pl-3 pb-1 text-[11px] text-gray-400">
                {fmtDelta(m.deltaFromPrevMs)}
              </div>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
```

- [ ] **Step 2: Wire into the drill-down page**

In `app/(admin)/admin/activity/[userId]/page.tsx`:

1. Add import: `import { OnboardingTimeline } from '@/components/admin/radar/OnboardingTimeline';` and `import type { OnboardingSummary } from '@/lib/radar/onboarding-timeline';`
2. Add state: `const [onboarding, setOnboarding] = useState<OnboardingSummary | null>(null);`
3. In `loadUserData`, after `setGuests(data.guests);` add `setOnboarding(data.onboarding ?? null);`
4. In the JSX, immediately after the closing `</div>` of the stats-bar block (the `grid grid-cols-4` container, around line 165-166) and before the `{/* Guests Table */}` comment, insert:

```tsx
{onboarding && <OnboardingTimeline summary={onboarding} />}
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Lint**

Run: `npm run lint`
Expected: no new errors in the touched files.

- [ ] **Step 5: Visual verification (Ricardo screenshot)**

Ask Ricardo to open `/admin/activity/<Victor's userId>?from=radar` in production/preview and send a screenshot. Confirm: "Primeros momentos" block appears between the stats bar and Guests table, dots filled/empty correctly, timestamps and deltas render, star metric shows in the top-right.
Expected: matches the approved mock. Note (per spec): on localhost the event-based timestamps may be missing (state-only "✓ sin hora") — that is expected, not a bug.

- [ ] **Step 6: Commit**

```bash
git add components/admin/radar/OnboardingTimeline.tsx "app/(admin)/admin/activity/[userId]/page.tsx"
git commit -m "feat(radar): render onboarding timeline 360 in user drill-down

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Self-Review

**Spec coverage:**
- 10 milestones → Task 1 engine + tests. ✓
- State vs. event (✓ sin hora) → Task 1 `source`/`at` logic + dedicated test. ✓
- Star metric registro→primer share → Task 1 `signupToFirstShareMs` + Task 3 render. ✓
- Placement between stats bar and guests table → Task 3 Step 2. ✓
- Multiple-books edge case + notice → Task 1 `multipleBooks` + Task 3 amber banner. ✓
- Pre-signup occasion/date (no per-user time) → Task 1 `at: null`, source 'state'. ✓
- Captain two-flow detection → Task 1 (`invitations` OR `captain_invite_token`) + two tests. ✓
- Localhost caveat → Task 3 Step 5 note. ✓
- Additive, no regression to guests/stats → Task 3 inserts only. ✓
- Pending instrumentation committed → Task 0. ✓
- Reusable engine for Newborns (fase 2) → Task 1 pure function. ✓

**Placeholder scan:** No TBD/TODO; all steps carry real code and exact run/expected lines.

**Type consistency:** `buildOnboardingTimeline`, `OnboardingSummary`, `OnboardingInputs`, `Milestone`, `MilestoneKey` used identically across Tasks 1–3. `getUserOnboardingAdmin` signature matches its consumer in the route. Component prop `summary: OnboardingSummary` matches Task 3 usage.

**Note for implementer:** Verify the `guest_recipes` group scoping column is `group_id` (confirmed present in `lib/types/database.ts`). If a real user shows no `first_recipe` despite recipes existing, check whether recipes for that cohort carry `group_id` (older rows may be null) and fall back to joining via `guest_id` — but do NOT add that complexity unless a real case demands it (YAGNI).
