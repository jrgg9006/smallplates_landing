import {
  dailySeries,
  computePulse,
  buildPulseMetrics,
  computeFunnel,
  computeGroupHealth,
  buildFeed,
  stripAdmin,
} from './aggregate';
import { buildDetails } from './details';
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
  members: [],
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
      { id: 'gu1', group_id: 'g1', first_name: 'Tía', last_name: 'Lupe', email: null, created_at: at(3), source: 'collection', is_self: false },
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
      { id: 'gu1', group_id: 'g1', first_name: 'Tía', last_name: null, email: null, created_at: at(10), source: 'manual', is_self: false },
    ];

    const rows = computeGroupHealth(d, NOW);
    expect(rows).toHaveLength(1);
    expect(rows[0].health).toBe('red'); // last activity 10 days ago
    expect(rows[0].daysInactive).toBe(10);
    expect(rows[0].stage).toBe('Guests agregados');
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

  it('collapses repeat edits of the same recipe by the same person into one counted line', () => {
    const d = empty();
    d.profiles = [{ id: 'u1', email: 'k@x.com', full_name: 'Karla', created_at: at(5) }];
    d.recipes = [
      { id: 'r1', group_id: 'g1', guest_id: null, recipe_name: 'Lasagna', created_at: at(2), deleted_at: null, image_url: null, source: 'manual' },
    ];
    // Two history rows ~1s apart (the double-write pattern) + one a few minutes later.
    d.edits = [
      { id: 'e1', recipe_id: 'r1', edited_by: 'u1', created_at: '2026-06-12T03:16:15.000Z' },
      { id: 'e2', recipe_id: 'r1', edited_by: 'u1', created_at: '2026-06-12T03:16:14.000Z' },
      { id: 'e3', recipe_id: 'r1', edited_by: 'u1', created_at: '2026-06-12T03:10:24.000Z' },
    ];
    const edits = buildFeed(d).filter((f) => f.kind === 'recipe_edited');
    expect(edits).toHaveLength(1);
    expect(edits[0].text).toBe('Karla editó "Lasagna" (×3)');
    expect(edits[0].recipeId).toBe('r1');
  });

  it('caps the feed at the default limit (100)', () => {
    const d = empty();
    d.profiles = Array.from({ length: 150 }, (_, i) => ({
      id: `u${i}`, email: `u${i}@x.com`, full_name: null, created_at: at(0),
    }));
    expect(buildFeed(d)).toHaveLength(100);
  });
});

describe('buildPulseMetrics', () => {
  it('returns the 6 cards with definitions', () => {
    const metrics = buildPulseMetrics(empty(), NOW);
    expect(metrics.map((m) => m.key)).toEqual([
      'users', 'purchases', 'recipes', 'guests', 'captains', 'photos',
    ]);
    for (const m of metrics) {
      expect(m.definition.length).toBeGreaterThan(10);
      expect(m.spark).toHaveLength(14);
    }
  });
});

describe('buildPulseMetrics purchases card', () => {
  it('counts only paid orders, not created groups', () => {
    const d = empty();
    d.groups = [
      { id: 'g1', name: 'A', created_by: 'u1', created_at: at(1), status: 'active', book_status: 'active', couple_image_url: null },
      { id: 'g2', name: 'B', created_by: 'u1', created_at: at(1), status: 'active', book_status: 'active', couple_image_url: null },
    ];
    d.orders = [
      { id: 'o1', group_id: 'g1', user_id: 'u1', amount_total: 16900, status: 'paid', created_at: at(0) },
      { id: 'o2', group_id: 'g2', user_id: 'u1', amount_total: 16900, status: 'refunded', created_at: at(0) },
    ];
    const purchases = buildPulseMetrics(d, NOW).find((m) => m.key === 'purchases');
    expect(purchases?.today.current).toBe(1); // only the paid order, not the 2 groups
  });
});

describe('buildDetails', () => {
  it('returns full lists per metric key, newest first, excluding refunded purchases', () => {
    const d = empty();
    d.profiles = [{ id: 'u1', email: 'a@x.com', full_name: 'Ana', created_at: at(2) }];
    d.orders = [
      { id: 'o1', group_id: null, user_id: 'u1', amount_total: 16900, status: 'paid', created_at: at(1) },
      { id: 'o2', group_id: null, user_id: 'u1', amount_total: 16900, status: 'refunded', created_at: at(0) },
    ];
    const details = buildDetails(d);
    expect(Object.keys(details)).toEqual(
      expect.arrayContaining(['users', 'purchases', 'recipes', 'guests', 'captains', 'photos'])
    );
    expect(details.users).toHaveLength(1);
    expect(details.purchases).toHaveLength(1); // refunded excluded
    expect(details.purchases[0].text).toContain('169');
  });
});

describe('computeGroupHealth closed flag', () => {
  it('flags books past active as closed', () => {
    const d = empty();
    d.profiles = [{ id: 'u1', email: 'a@x.com', full_name: 'Ana', created_at: at(20) }];
    d.groups = [
      { id: 'g1', name: 'A', created_by: 'u1', created_at: at(2), status: 'active', book_status: 'printed', couple_image_url: null },
      { id: 'g2', name: 'B', created_by: 'u1', created_at: at(2), status: 'active', book_status: 'active', couple_image_url: null },
    ];
    const rows = computeGroupHealth(d, NOW);
    expect(rows.find((r) => r.groupId === 'g1')?.closed).toBe(true);
    expect(rows.find((r) => r.groupId === 'g2')?.closed).toBe(false);
  });
});

describe('stripAdmin', () => {
  it('removes everything owned or acted on by the Small Plates team', () => {
    const d = empty();
    d.profiles = [
      { id: 'admin', email: 'team@smallplatesandcompany.com', full_name: 'Team Small Plates & Co', created_at: at(2) },
      { id: 'u1', email: 'a@x.com', full_name: 'Ana', created_at: at(2) },
    ];
    d.groups = [
      { id: 'g-admin', name: 'Comped', created_by: 'admin', created_at: at(2), status: 'active', book_status: 'active', couple_image_url: null },
      { id: 'g1', name: 'Real', created_by: 'u1', created_at: at(2), status: 'active', book_status: 'active', couple_image_url: null },
    ];
    d.recipes = [
      { id: 'r1', group_id: 'g1', guest_id: null, user_id: 'u1', recipe_name: 'Mole', created_at: at(2), deleted_at: null, image_url: null, source: 'manual' },
    ];
    d.edits = [
      { id: 'e-admin', recipe_id: 'r1', edited_by: 'admin', created_at: at(1) }, // admin cleaning a client recipe
      { id: 'e-user', recipe_id: 'r1', edited_by: 'u1', created_at: at(0) },
    ];

    const clean = stripAdmin(d);
    expect(clean.profiles.map((p) => p.id)).toEqual(['u1']);
    expect(clean.groups.map((g) => g.id)).toEqual(['g1']); // comped/admin book gone
    expect(clean.edits.map((e) => e.id)).toEqual(['e-user']); // admin edit of client recipe gone
    // The client recipe itself stays — only the admin's edit of it is removed.
    expect(clean.recipes.map((r) => r.id)).toEqual(['r1']);
  });

  it('is a no-op when there are no admin accounts', () => {
    const d = empty();
    d.profiles = [{ id: 'u1', email: 'a@x.com', full_name: 'Ana', created_at: at(2) }];
    expect(stripAdmin(d)).toBe(d);
  });
});

describe('timezone bucketing', () => {
  it('buckets a 9pm-CDMX timestamp (3am UTC next day) into the CDMX day', () => {
    // 2026-06-13T03:00:00Z == 2026-06-12 21:00 in America/Mexico_City
    const series = dailySeries(['2026-06-13T03:00:00.000Z'], 1, NOW);
    expect(series).toEqual([1]);
  });
});

describe('order status semantics', () => {
  it('never counts error or refunded orders as purchases', () => {
    const d = empty();
    d.profiles = [{ id: 'u1', email: 'a@x.com', full_name: 'Ana', created_at: at(5) }];
    d.groups = [
      { id: 'g1', name: 'Boda', created_by: 'u1', created_at: at(4), status: 'free_tier', book_status: 'active', couple_image_url: null },
    ];
    d.orders = [
      { id: 'o1', group_id: 'g1', user_id: 'u1', amount_total: 16900, status: 'error', created_at: at(1) },
      { id: 'o2', group_id: 'g1', user_id: 'u1', amount_total: 16900, status: 'refunded', created_at: at(1) },
    ];
    const funnel = computeFunnel(d, NOW);
    expect(funnel.find((s) => s.key === 'paid')?.count).toBe(0);
    expect(computeGroupHealth(d, NOW)[0].stage).not.toBe('Compró');
    expect(buildFeed(d).filter((f) => f.kind === 'order')).toHaveLength(0);
  });
});

describe('funnel monotonic gates', () => {
  it('does not count shared/paid for cohort users without a book', () => {
    const d = empty();
    d.profiles = [{ id: 'u1', email: 'a@x.com', full_name: 'Ana', created_at: at(5) }];
    d.events = [
      { id: 1, user_id: 'u1', group_id: null, event_name: 'share_link_copied', props: {}, created_at: at(1) },
    ];
    d.orders = [
      { id: 'o1', group_id: null, user_id: 'u1', amount_total: 16900, status: 'paid', created_at: at(1) },
    ];
    const funnel = computeFunnel(d, NOW);
    const byKey = Object.fromEntries(funnel.map((s) => [s.key, s.count]));
    expect(byKey.shared).toBe(0);
    expect(byKey.paid).toBe(0);
  });

  it('requires 5 recipes in a SINGLE book for recipe5', () => {
    const d = empty();
    d.profiles = [{ id: 'u1', email: 'a@x.com', full_name: 'Ana', created_at: at(5) }];
    d.groups = [
      { id: 'g1', name: 'A', created_by: 'u1', created_at: at(4), status: 'free_tier', book_status: 'active', couple_image_url: null },
      { id: 'g2', name: 'B', created_by: 'u1', created_at: at(4), status: 'free_tier', book_status: 'active', couple_image_url: null },
    ];
    d.recipes = [
      ...Array.from({ length: 3 }, (_, i) => ({ id: `a${i}`, group_id: 'g1', guest_id: null, recipe_name: 'x', created_at: at(2), deleted_at: null, image_url: null, source: 'manual' })),
      ...Array.from({ length: 3 }, (_, i) => ({ id: `b${i}`, group_id: 'g2', guest_id: null, recipe_name: 'x', created_at: at(2), deleted_at: null, image_url: null, source: 'manual' })),
    ];
    const funnel = computeFunnel(d, NOW);
    const byKey = Object.fromEntries(funnel.map((s) => [s.key, s.count]));
    expect(byKey.recipe1).toBe(1);
    expect(byKey.recipe5).toBe(0); // 6 total but max 3 per book
  });
});

describe('daysInactive clamp', () => {
  it('never returns negative days for future timestamps', () => {
    const d = empty();
    d.profiles = [{ id: 'u1', email: 'a@x.com', full_name: 'Ana', created_at: at(20) }];
    d.groups = [
      { id: 'g1', name: 'Boda', created_by: 'u1', created_at: at(20), status: 'free_tier', book_status: 'active', couple_image_url: null },
    ];
    d.recipes = [
      { id: 'r1', group_id: 'g1', guest_id: null, recipe_name: 'x', created_at: at(-1), deleted_at: null, image_url: null, source: 'manual' },
    ];
    const rows = computeGroupHealth(d, NOW);
    expect(rows[0].daysInactive).toBe(0);
  });
});
