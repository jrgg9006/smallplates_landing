// lib/radar/monitor.ts
import { COLDNESS_CANDIDATE_DAYS, DEADLINE_NEAR_DAYS, MOMENTUM_STALL_DAYS, PRINT_GOAL, DAY_MS } from './monitor-constants';
import { computeOutreachIgnored, classifyLifecycle } from './lifecycle';
import type { MonitorSources, NotificationCandidate, CloseDateSource } from './monitor-types';

const CLOSED_BOOK_STATUSES = new Set(['reviewed', 'ready_to_print', 'printed', 'inactive']);
const daysBetween = (fromIso: string, now: Date) => Math.floor((now.getTime() - new Date(fromIso).getTime()) / DAY_MS);

export function computeMomentum(submittedIso: string[], now: Date): { per_week: number[]; stalled: boolean } {
  const per_week = [0, 0, 0, 0]; // 0-7d, 7-14d, 14-21d, 21-28d
  let recent = 0; // within MOMENTUM_STALL_DAYS
  for (const iso of submittedIso) {
    const d = daysBetween(iso, now);
    if (d < 0) continue;
    if (d < MOMENTUM_STALL_DAYS) recent++;
    const bucket = Math.floor(d / 7);
    if (bucket >= 0 && bucket < 4) per_week[bucket]++;
  }
  // Prior activity = recipes older than the stall window.
  const prior = submittedIso.filter((iso) => daysBetween(iso, now) >= MOMENTUM_STALL_DAYS).length;
  const stalled = prior >= 2 && recent === 0;
  return { per_week, stalled };
}

export function computeDaysUntilClose(
  g: { book_close_date: string | null; event_date: string | null; gift_date: string | null },
  now: Date,
): { days_until_close: number | null; close_date_source: CloseDateSource } {
  const pick: Array<[string | null, CloseDateSource]> = [
    [g.book_close_date, 'book_close_date'],
    [g.event_date, 'event_date'],
    [g.gift_date, 'gift_date'],
  ];
  for (const [iso, source] of pick) {
    if (iso) return { days_until_close: Math.ceil((new Date(iso).getTime() - now.getTime()) / DAY_MS), close_date_source: source };
  }
  return { days_until_close: null, close_date_source: null };
}

export function computeClientColdnessDays(
  groupId: string, ownerId: string, sources: MonitorSources, now: Date,
): { coldness: number; lastActivity: string | null } {
  // Reason: honest coldness = client-originated signals only. Excludes comms + edits (founder noise).
  const ts: number[] = [];
  for (const r of sources.recipes) if (r.group_id === groupId && r.submission_status === 'submitted' && r.submitted_at) ts.push(new Date(r.submitted_at).getTime());
  for (const gu of sources.guests) if (gu.group_id === groupId) ts.push(new Date(gu.created_at).getTime());
  for (const e of sources.events) if (e.group_id === groupId) ts.push(new Date(e.created_at).getTime());
  const login = sources.lastLoginByProfile[ownerId];
  if (login) ts.push(new Date(login).getTime());
  if (ts.length === 0) return { coldness: Infinity, lastActivity: null };
  const last = Math.max(...ts);
  return { coldness: Math.floor((now.getTime() - last) / DAY_MS), lastActivity: new Date(last).toISOString() };
}

export function computeCandidates(sources: MonitorSources, now: Date): NotificationCandidate[] {
  const out: NotificationCandidate[] = [];
  for (const g of sources.groups) {
    if (CLOSED_BOOK_STATUSES.has(g.book_status)) continue;

    const groupRecipes = sources.recipes.filter((r) => r.group_id === g.id && r.submission_status === 'submitted');
    const recipes = groupRecipes.length;
    const submittedIso = groupRecipes.map((r) => r.submitted_at).filter((x): x is string => !!x);
    const momentum = computeMomentum(submittedIso, now);
    const { days_until_close, close_date_source } = computeDaysUntilClose(g, now);
    const { coldness, lastActivity } = computeClientColdnessDays(g.id, g.created_by, sources, now);

    const groupGuests = sources.guests.filter((gu) => gu.group_id === g.id);
    const selfGuestIds = new Set(groupGuests.filter((gu) => gu.is_self).map((gu) => gu.id));
    const submitters = new Set(groupRecipes.map((r) => r.guest_id).filter((x): x is string => !!x));
    const owner_submitted = [...submitters].some((id) => selfGuestIds.has(id));
    const distinct_submitters = submitters.size;

    const captains = sources.captains.filter((c) => c.group_id === g.id);
    const active_count = captains.filter((c) => daysBetween(c.joined_at, now) <= 30).length;

    const outreach = sources.comms
      .filter((c) => c.group_id === g.id && c.recipient_profile_id === g.created_by && c.sent_at)
      .sort((a, b) => (a.sent_at! > b.sent_at! ? -1 : 1))[0];

    // Reason: a book the founder gave up on stays out until the client shows real activity again.
    if (g.radar_archived_at) {
      const archivedMs = new Date(g.radar_archived_at).getTime();
      const activityMs = lastActivity ? new Date(lastActivity).getTime() : 0;
      if (archivedMs >= activityMs) continue;
    }

    const isCandidate =
      coldness >= COLDNESS_CANDIDATE_DAYS ||
      momentum.stalled ||
      (days_until_close != null && days_until_close <= DEADLINE_NEAR_DAYS && recipes < PRINT_GOAL);
    if (!isCandidate) continue;

    const outreach_ignored = computeOutreachIgnored({
      last_founder_outreach: outreach ? { sent_at: outreach.sent_at! } : null,
      last_client_activity_at: lastActivity,
    });
    const lifecycle = classifyLifecycle({
      outreach_ignored,
      recipes,
      distinct_submitters,
      client_coldness_days: coldness === Infinity ? daysBetween(g.created_at, now) : coldness,
      days_until_close,
      gap_to_goal: Math.max(0, PRINT_GOAL - recipes),
    });

    out.push({
      group_id: g.id,
      book_name: g.name,
      owner_id: g.created_by,
      recipes,
      goal: PRINT_GOAL,
      gap_to_goal: Math.max(0, PRINT_GOAL - recipes),
      client_coldness_days: coldness === Infinity ? daysBetween(g.created_at, now) : coldness,
      last_client_activity_at: lastActivity,
      days_until_close,
      close_date_source,
      momentum,
      captains: { count: captains.length, active_count },
      contributors: { distinct_submitters, owner_submitted, is_solo: distinct_submitters <= 1 },
      owner_last_login_at: sources.lastLoginByProfile[g.created_by] ?? null,
      last_founder_outreach: outreach ? { type: outreach.type, sent_at: outreach.sent_at! } : null,
      outreach_ignored,
      lifecycle,
    });
  }
  return out.sort((a, b) => b.client_coldness_days - a.client_coldness_days);
}
