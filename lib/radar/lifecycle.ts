import { LETGO_COLD_NO_INVESTMENT_DAYS, LETGO_COLD_WITH_INVESTMENT_DAYS, LETGO_DEADLINE_PASSED_COLD_DAYS } from './monitor-constants';

export function computeOutreachIgnored(input: {
  last_founder_outreach: { sent_at: string } | null;
  last_client_activity_at: string | null;
}): boolean {
  if (!input.last_founder_outreach) return false;
  if (!input.last_client_activity_at) return true;
  return new Date(input.last_founder_outreach.sent_at).getTime() > new Date(input.last_client_activity_at).getTime();
}

export function classifyLifecycle(input: {
  outreach_ignored: boolean;
  recipes: number;
  distinct_submitters: number;
  client_coldness_days: number;
  days_until_close: number | null;
  gap_to_goal: number;
}): 'revive' | 'let_go' {
  // Reason: never write off someone we never reached (or who responded).
  if (!input.outreach_ignored) return 'revive';
  const { recipes, distinct_submitters, client_coldness_days, days_until_close, gap_to_goal } = input;
  if (days_until_close != null && days_until_close < 0 && gap_to_goal > 0 && client_coldness_days >= LETGO_DEADLINE_PASSED_COLD_DAYS) return 'let_go';
  if (recipes === 0 && distinct_submitters === 0 && client_coldness_days >= LETGO_COLD_NO_INVESTMENT_DAYS) return 'let_go';
  if (recipes >= 1 && client_coldness_days >= LETGO_COLD_WITH_INVESTMENT_DAYS) return 'let_go';
  return 'revive';
}
