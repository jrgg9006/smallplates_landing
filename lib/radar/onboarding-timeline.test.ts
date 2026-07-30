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
      couple_image_url: 'http://img/x.jpg',
    }],
    groupMember: { custom_share_message: 'hey come add a recipe' },
    invitations: [],
    captainMembers: [],
    guests: [
      { id: 'self', group_id: 'g1', first_name: 'Victor', last_name: 'Sosa', created_at: T0, is_self: true, source: 'manual' },
      { id: 'ge1', group_id: 'g1', first_name: 'V.', last_name: 'Sosa', created_at: t(68), is_self: false, source: 'collection' },
    ],
    firstRecipeAt: t(93),
    events: [
      { event_name: 'book_created', group_id: 'g1', created_at: T0, props: {} },
      { event_name: 'couple_image_uploaded', group_id: 'g1', created_at: t(47), props: {} },
      { event_name: 'share_message_edited', group_id: 'g1', created_at: t(50), props: {} },
      { event_name: 'share_link_copied', group_id: 'g1', created_at: t(61), props: { channel: 'copy_link' } },
    ],
  };
}

function byKey(s: ReturnType<typeof buildOnboardingTimeline>) {
  return Object.fromEntries(s.milestones.map((m) => [m.key, m]));
}

test('full journey: account+book merged, deltas and star metric correct', () => {
  const s = buildOnboardingTimeline(baseInput());
  const m = byKey(s);
  // account + book merged into one line (they land at the same moment)
  expect(s.milestones).toHaveLength(9);
  expect(m.book_created).toBeUndefined();
  expect(m.account_created.label).toBe('Cuenta y libro');
  expect(m.account_created.detail).toBe('Victor & Karla');
  expect(m.account_created.at).toBe(T0);
  expect(m.occasion.detail).toBe('wedding');
  expect(m.photo.at).toBe(t(47));
  expect(m.photo.source).toBe('event');
  // delta chain over timestamped milestones: account T0 -> photo t47 (+47m)
  // -> share_message t50 (+3m) -> shared_link t61 (+11m) -> first_guest t68 (+7m)
  // -> first_recipe t93 (+25m). occasion/date/captain have no `at`, so they skip.
  expect(m.share_message.deltaFromPrevMs).toBe(3 * 60_000);
  expect(m.shared_link.done).toBe(true);
  expect(m.shared_link.at).toBe(t(61));
  expect(m.shared_link.source).toBe('event');
  expect(m.shared_link.detail).toBe('copió el link');
  expect(m.shared_link.deltaFromPrevMs).toBe(11 * 60_000);
  expect(m.first_guest.detail).toBe('V. Sosa');
  expect(m.first_guest.deltaFromPrevMs).toBe(7 * 60_000);
  expect(m.first_recipe.at).toBe(t(93));
  expect(m.first_recipe.deltaFromPrevMs).toBe(25 * 60_000);
  // captain not invited/joined in the base fixture
  expect(m.captain.done).toBe(false);
  expect(s.hasShared).toBe(true);
  expect(s.signupToFirstShareMs).toBe(61 * 60_000);
  expect(s.multipleBooks).toBe(false);
});

test('account and book NOT merged when book created well after signup', () => {
  const input = baseInput();
  input.groups[0].created_at = t(1000);
  input.events = input.events.map((e) =>
    e.event_name === 'book_created' ? { ...e, created_at: t(1000) } : e
  );
  const s = buildOnboardingTimeline(input);
  const m = byKey(s);
  expect(m.account_created.label).toBe('Cuenta creada');
  expect(m.book_created.done).toBe(true);
  expect(m.book_created.at).toBe(t(1000));
  expect(m.book_created.detail).toBe('Victor & Karla');
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

test('not shared at all: no share event and no collection guest', () => {
  const input = baseInput();
  input.events = input.events.filter(
    (e) => e.event_name !== 'share_link_copied' && e.event_name !== 'share'
  );
  input.guests = input.guests.map((g) => ({ ...g, source: 'manual' }));
  const s = buildOnboardingTimeline(input);
  expect(s.hasShared).toBe(false);
  expect(s.signupToFirstShareMs).toBeNull();
  expect(byKey(s).shared_link.done).toBe(false);
});

test('shared via proxy: a collection guest means the link was shared', () => {
  const input = baseInput();
  // remove the explicit share event; rely on the collection-guest proxy
  input.events = input.events.filter(
    (e) => e.event_name !== 'share_link_copied' && e.event_name !== 'share'
  );
  const s = buildOnboardingTimeline(input);
  const m = byKey(s);
  expect(s.hasShared).toBe(true);
  expect(m.shared_link.done).toBe(true);
  // Reason: proxy proves it was shared, not when — no fake timestamp.
  expect(m.shared_link.at).toBeNull();
  expect(m.shared_link.source).toBe('state');
  expect(m.shared_link.detail).toBe('alguien llegó por el link');
  expect(s.signupToFirstShareMs).toBeNull();
});

test('captain joined: non-owner member => "Capitán a bordo" with name', () => {
  const input = baseInput();
  input.captainMembers = [{ group_id: 'g1', joined_at: t(40), name: 'Ana' }];
  const m = byKey(buildOnboardingTimeline(input));
  expect(m.captain.done).toBe(true);
  expect(m.captain.label).toBe('Capitán a bordo');
  expect(m.captain.detail).toBe('Ana');
  expect(m.captain.at).toBe(t(40));
  expect(m.captain.source).toBe('state');
});

test('captain invited only: email invite => "Capitán invitado" with invite time', () => {
  const input = baseInput();
  input.invitations = [
    { group_id: 'g1', created_at: t(30), name: 'Ana', email: 'ana@x.com', status: 'pending' },
    { group_id: 'g1', created_at: t(20), name: null, email: 'bob@x.com', status: 'pending' },
  ];
  const m = byKey(buildOnboardingTimeline(input));
  expect(m.captain.done).toBe(true);
  expect(m.captain.label).toBe('Capitán invitado');
  expect(m.captain.at).toBe(t(20)); // earliest invite
  expect(m.captain.detail).toBe('bob@x.com (pendiente)'); // email + status when no name
  expect(m.captain.source).toBe('event');
});

test('captain invited then declined: status surfaces in detail', () => {
  const input = baseInput();
  input.invitations = [
    { group_id: 'g1', created_at: t(20), name: 'Ana', email: 'ana@x.com', status: 'declined' },
  ];
  const m = byKey(buildOnboardingTimeline(input));
  expect(m.captain.detail).toBe('Ana (rechazó)');
});

test('captain joined takes precedence over a pending invite', () => {
  const input = baseInput();
  input.invitations = [{ group_id: 'g1', created_at: t(20), name: 'Ana', email: 'ana@x.com', status: 'pending' }];
  input.captainMembers = [{ group_id: 'g1', joined_at: t(40), name: 'Ana' }];
  const m = byKey(buildOnboardingTimeline(input));
  expect(m.captain.label).toBe('Capitán a bordo');
});

test('multiple books: anchors to most recent group and flags multipleBooks', () => {
  const input = baseInput();
  input.groups = [
    { ...input.groups[0], id: 'gOld', name: 'Old', created_at: t(-5000) },
    { ...input.groups[0], id: 'gNew', name: 'New', created_at: T0 },
  ];
  input.events = input.events.map((e) =>
    e.event_name === 'book_created' ? { ...e, group_id: 'gNew' } : e
  );
  const s = buildOnboardingTimeline(input);
  expect(s.multipleBooks).toBe(true);
  expect(byKey(s).account_created.detail).toBe('New');
});

test('no group at all: book + downstream pending, no crash', () => {
  const input = baseInput();
  input.groups = [];
  input.groupMember = null;
  const s = buildOnboardingTimeline(input);
  const m = byKey(s);
  expect(m.account_created.done).toBe(true);
  expect(m.account_created.label).toBe('Cuenta creada');
  expect(m.book_created.done).toBe(false);
  expect(m.occasion.done).toBe(false);
  expect(m.captain.done).toBe(false);
  expect(m.shared_link.done).toBe(false);
  expect(s.multipleBooks).toBe(false);
});
