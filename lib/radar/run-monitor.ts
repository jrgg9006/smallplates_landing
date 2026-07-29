// lib/radar/run-monitor.ts
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { isAdminEmail } from '@/lib/config/admin';
import { computeCandidates } from './monitor';
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
      supabase.from('groups').select('id, name, created_by, created_at, book_status, book_close_date, event_date, gift_date, wedding_date, radar_archived_at'),
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

  // Reason: if a candidate made it through archive suppression, it resurrected — clear the flag so future
  // runs don't re-evaluate the stale archive timestamp.
  const resurrectedIds = candidates
    .map((c) => c.group_id)
    .filter((id) => sources.groups.find((g) => g.id === id)?.radar_archived_at);
  if (resurrectedIds.length > 0) {
    await supabase.from('groups').update({ radar_archived_at: null }).in('id', resurrectedIds);
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
