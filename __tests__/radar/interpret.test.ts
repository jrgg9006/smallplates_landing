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

test('system prompt contains priority calibration guardrail', () => {
  expect(RADAR_MONITOR_SYSTEM_PROMPT).toContain('most projects are medium or low');
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
