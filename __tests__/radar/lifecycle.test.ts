import { computeOutreachIgnored, classifyLifecycle } from '@/lib/radar/lifecycle';

const iso = (d: string) => new Date(d).toISOString();

describe('computeOutreachIgnored', () => {
  test('false when no outreach was ever sent', () => {
    expect(computeOutreachIgnored({ last_founder_outreach: null, last_client_activity_at: iso('2026-06-01') })).toBe(false);
  });
  test('true when outreach sent and client never active', () => {
    expect(computeOutreachIgnored({ last_founder_outreach: { sent_at: iso('2026-06-01') }, last_client_activity_at: null })).toBe(true);
  });
  test('true when outreach is after the last client activity', () => {
    expect(computeOutreachIgnored({ last_founder_outreach: { sent_at: iso('2026-06-10') }, last_client_activity_at: iso('2026-06-01') })).toBe(true);
  });
  test('false when client acted after the outreach', () => {
    expect(computeOutreachIgnored({ last_founder_outreach: { sent_at: iso('2026-06-01') }, last_client_activity_at: iso('2026-06-10') })).toBe(false);
  });
});

const base = { outreach_ignored: true, recipes: 0, distinct_submitters: 0, client_coldness_days: 50, days_until_close: null, gap_to_goal: 25 };

describe('classifyLifecycle', () => {
  test('never let_go when outreach was not ignored', () => {
    expect(classifyLifecycle({ ...base, outreach_ignored: false })).toBe('revive');
  });
  test('let_go: no investment, cold >= 40 (Gineele & Marco case)', () => {
    expect(classifyLifecycle({ ...base, recipes: 0, distinct_submitters: 0, client_coldness_days: 45 })).toBe('let_go');
  });
  test('not let_go: no investment but cold < 40', () => {
    expect(classifyLifecycle({ ...base, recipes: 0, distinct_submitters: 0, client_coldness_days: 30 })).toBe('revive');
  });
  test('with investment needs cold >= 60', () => {
    expect(classifyLifecycle({ ...base, recipes: 8, distinct_submitters: 3, client_coldness_days: 45 })).toBe('revive');
    expect(classifyLifecycle({ ...base, recipes: 8, distinct_submitters: 3, client_coldness_days: 65 })).toBe('let_go');
  });
  test('deadline passed with gap and cold >= 21 is let_go even with some investment', () => {
    expect(classifyLifecycle({ ...base, recipes: 5, distinct_submitters: 2, client_coldness_days: 25, days_until_close: -3, gap_to_goal: 20 })).toBe('let_go');
  });
  test('deadline passed but gap 0 (goal met) is not let_go', () => {
    expect(classifyLifecycle({ ...base, recipes: 25, distinct_submitters: 4, client_coldness_days: 25, days_until_close: -3, gap_to_goal: 0 })).toBe('revive');
  });
});
