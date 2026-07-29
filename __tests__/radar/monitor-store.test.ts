import { shouldGenerate, escalates } from '@/lib/radar/monitor-store';
import type { RadarNotificationRow, NotificationInterpretation, NotificationCandidate } from '@/lib/radar/monitor-types';

const NOW = new Date('2026-07-27T12:00:00Z');
const future = (n: number) => new Date(NOW.getTime() + n * 86400000).toISOString();
const past = (n: number) => new Date(NOW.getTime() - n * 86400000).toISOString();

const interp = (priority: 'high' | 'medium' | 'low'): NotificationInterpretation =>
  ({ priority, headline: '', interpretation: '', recommended_action: '', draft_message: '' });
const cand = (over: Partial<NotificationCandidate> = {}): NotificationCandidate =>
  ({ group_id: 'g1', book_name: 'B', owner_id: 'p1', recipes: 10, goal: 25, gap_to_goal: 15, client_coldness_days: 20, last_client_activity_at: past(20), days_until_close: null, close_date_source: null, momentum: { per_week: [], stalled: true }, captains: { count: 0, active_count: 0 }, contributors: { distinct_submitters: 1, owner_submitted: false, is_solo: true }, owner_last_login_at: null, last_founder_outreach: null, outreach_ignored: false, lifecycle: 'revive', ...over });
const row = (over: Partial<RadarNotificationRow> = {}): RadarNotificationRow =>
  ({ id: 'n1', group_id: 'g1', generated_at: past(1), priority: 'medium', headline: '', interpretation: '', recommended_action: '', draft_message: '', lifecycle: 'revive', signals: cand(), status: 'open', attended_at: null, cooldown_until: null, ...over });

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
