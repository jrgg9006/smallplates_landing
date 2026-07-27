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
