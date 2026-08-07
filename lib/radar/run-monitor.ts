// lib/radar/run-monitor.ts
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { isAdminEmail } from '@/lib/config/admin';
import { computeCandidates, computeResurrectedGroupIds, CLOSED_BOOK_STATUSES } from './monitor';
import { interpretCandidate } from './interpret';
import { fetchLatestByGroup, persistNotification, shouldGenerate } from './monitor-store';
import type { MonitorSources } from './monitor-types';

// 60-day window matches the existing radar/email queries.
const WINDOW_DAYS = 60;

export async function fetchMonitorSources(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
): Promise<{ sources: MonitorSources; adminOwnerIds: Set<string> }> {
  const since = new Date(Date.now() - WINDOW_DAYS * 86400000).toISOString();

  const [{ data: profiles }, { data: groups }, { data: recipes }, { data: guests }, { data: captains }, { data: comms }, { data: events }] =
    await Promise.all([
      supabase.from('profiles').select('id, email'),
      supabase.from('groups').select('id, name, created_by, created_at, book_status, book_close_date, event_date, gift_date, wedding_date, archived_at'),
      supabase.from('guest_recipes').select('group_id, guest_id, submitted_at, submission_status').gte('submitted_at', since),
      supabase.from('guests').select('id, group_id, created_at, is_self'),
      // Reason: captains are role = 'member' in group_members; 'owner' is the organizer.
      // Confirmed against lib/email/queries.ts and database.ts MemberRole type.
      supabase.from('group_members').select('group_id, joined_at').eq('role', 'member'),
      supabase.from('communication_log').select('group_id, recipient_profile_id, type, sent_at, created_at').gte('created_at', since),
      supabase.from('user_events').select('group_id, event_name, created_at').gte('created_at', since),
    ]);

  // Reason: last_sign_in_at lives on auth.users (not profiles). Mirror lib/email/queries.ts
  // pattern exactly — { page: 1, perPage: 1000 } with graceful degradation on failure.
  const lastLoginByProfile: Record<string, string | null> = {};
  try {
    const { data: authData } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
    for (const u of authData?.users ?? []) lastLoginByProfile[u.id] = u.last_sign_in_at ?? null;
  } catch (e) {
    console.error('run-monitor: failed to list auth users for last_sign_in_at', e);
  }

  const adminOwnerIds = new Set(
    (profiles ?? []).filter((p) => isAdminEmail(p.email)).map((p) => p.id),
  );

  const sources: MonitorSources = {
    groups: (groups ?? []).filter((g) => !adminOwnerIds.has(g.created_by)),
    recipes: recipes ?? [],
    guests: guests ?? [],
    captains: captains ?? [],
    comms: comms ?? [],
    events: events ?? [],
    lastLoginByProfile,
  };
  return { sources, adminOwnerIds };
}

export async function runRadarMonitor(): Promise<{ generated: number; candidates: number; failed: number }> {
  const supabase = createSupabaseAdminClient();
  const now = new Date();
  const { sources } = await fetchMonitorSources(supabase);

  const candidates = computeCandidates(sources, now);

  // Reason: un-archive ANY archived book with new client activity since it was archived (login, recipe,
  // guest) — even if it returns healthy and never becomes an at-risk candidate.
  const resurrectedIds = computeResurrectedGroupIds(sources, now);
  if (resurrectedIds.length > 0) {
    const { error: resurrectionError } = await supabase
      .from('groups')
      .update({ archived_at: null, archived_reason: null })
      .in('id', resurrectedIds);
    if (resurrectionError) console.error('radar-monitor: failed to clear archived_at', resurrectionError);
  }

  // Reason: un libro que ya cerró (reviewed/ready_to_print/printed/inactive) deja de ser candidato,
  // pero su notificación vieja se queda 'open' para siempre. La cerramos aquí; nunca vuelve porque
  // computeCandidates ya salta esos estados.
  const closedGroupIds = sources.groups.filter((g) => CLOSED_BOOK_STATUSES.has(g.book_status)).map((g) => g.id);
  if (closedGroupIds.length > 0) {
    const { error: closeError } = await supabase
      .from('radar_notifications')
      .update({ status: 'dismissed' })
      .in('group_id', closedGroupIds)
      .eq('status', 'open');
    if (closeError) console.error('radar-monitor: failed to close notifications for closed books', closeError);
  }

  const existingByGroup = await fetchLatestByGroup(supabase, candidates.map((c) => c.group_id));

  let generated = 0;
  let failed = 0;
  for (const candidate of candidates) {
    try {
      const interp = await interpretCandidate(candidate);
      const existing = existingByGroup.get(candidate.group_id) ?? null;
      if (!shouldGenerate(existing, interp, candidate, now)) continue;
      await persistNotification(supabase, existing, candidate, interp, now);
      generated++;
    } catch (e) {
      console.error('run-monitor: interpretCandidate failed for group_id', candidate.group_id, e);
      failed++;
    }
  }
  return { generated, candidates: candidates.length, failed };
}
