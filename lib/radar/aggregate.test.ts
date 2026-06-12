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
