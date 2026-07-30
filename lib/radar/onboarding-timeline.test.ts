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
  // delta chain over timestamped milestones: photo t47 -> share_message t50 (+3m)
  // -> shared_link t61 (+11m).
  expect(m.share_message.deltaFromPrevMs).toBe(3 * 60_000);
  expect(m.shared_link.deltaFromPrevMs).toBe(11 * 60_000);
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
