import type { SupabaseClient } from '@supabase/supabase-js';
import type { RadarNotificationRow, NotificationCandidate, NotificationInterpretation } from './monitor-types';

const RANK: Record<'low' | 'medium' | 'high', number> = { low: 0, medium: 1, high: 2 };

export function escalates(
  existing: RadarNotificationRow,
  interp: NotificationInterpretation,
  candidate: NotificationCandidate,
): boolean {
  if (RANK[interp.priority] > RANK[existing.priority]) return true;
  if (candidate.days_until_close != null && candidate.days_until_close <= 3) return true;
  return false;
}

export function shouldGenerate(
  existing: RadarNotificationRow | null,
  interp: NotificationInterpretation,
  candidate: NotificationCandidate,
  now: Date,
): boolean {
  if (!existing) return true;
  if (existing.status === 'open') return true;
  if (existing.status === 'dismissed') return escalates(existing, interp, candidate);
  // attended
  const cooling = existing.cooldown_until != null && new Date(existing.cooldown_until) > now;
  if (cooling) return escalates(existing, interp, candidate);
  return true;
}

// Thin DB layer (integration-tested via the cron route; consumed by Task 6).
export async function fetchLatestByGroup(
  supabase: SupabaseClient,
  groupIds: string[],
): Promise<Map<string, RadarNotificationRow>> {
  const map = new Map<string, RadarNotificationRow>();
  if (groupIds.length === 0) return map;
  const { data } = await supabase
    .from('radar_notifications')
    .select('*')
    .in('group_id', groupIds)
    .order('generated_at', { ascending: false });
  for (const r of (data ?? []) as RadarNotificationRow[]) {
    if (!map.has(r.group_id)) map.set(r.group_id, r); // newest first → keep first seen
  }
  return map;
}

export async function persistNotification(
  supabase: SupabaseClient,
  existing: RadarNotificationRow | null,
  candidate: NotificationCandidate,
  interp: NotificationInterpretation,
  now: Date,
): Promise<void> {
  const payload = {
    group_id: candidate.group_id,
    generated_at: now.toISOString(),
    priority: interp.priority,
    headline: interp.headline,
    interpretation: interp.interpretation,
    recommended_action: interp.recommended_action,
    draft_message: interp.draft_message,
    lifecycle: candidate.lifecycle,
    signals: candidate as unknown as Record<string, unknown>,
    status: 'open' as const,
    attended_at: null,
    cooldown_until: null,
  };
  if (existing && existing.status === 'open') {
    await supabase.from('radar_notifications').update(payload).eq('id', existing.id);
  } else {
    await supabase.from('radar_notifications').insert(payload);
  }
}
