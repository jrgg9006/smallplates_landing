import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import type { RadarSources } from './types';

// Reason: 60 days covers the pulse 30-vs-previous-30 comparison. Small tables
// (profiles/groups/guests/recipes/orders) are fetched whole — needed for
// group-health counts and tiny at current scale; revisit with Postgres views
// when row counts grow past the limits below.
const SINCE_DAYS = 60;
const DAY_MS = 86_400_000;

export async function fetchRadarSources(): Promise<{
  sources: RadarSources;
  degraded: string[];
}> {
  const supabase = createSupabaseAdminClient();
  const since = new Date(Date.now() - SINCE_DAYS * DAY_MS).toISOString();

  // Reason: every query orders by created_at desc so that if a table ever
  // exceeds its row limit, we keep the NEWEST rows instead of an arbitrary
  // subset (Postgres returns undefined order without ORDER BY).
  const queries = {
    profiles: supabase
      .from('profiles')
      .select('id, email, full_name, created_at')
      .order('created_at', { ascending: false })
      .limit(5000),
    groups: supabase
      .from('groups')
      .select('id, name, created_by, created_at, status, book_status, couple_image_url')
      .order('created_at', { ascending: false })
      .limit(5000),
    guests: supabase
      .from('guests')
      .select('id, group_id, user_id, first_name, last_name, email, created_at, source, is_self')
      .order('created_at', { ascending: false })
      .limit(10000),
    recipes: supabase
      .from('guest_recipes')
      .select('id, group_id, guest_id, user_id, recipe_name, created_at, deleted_at, image_url, source, upload_method')
      .order('created_at', { ascending: false })
      .limit(10000),
    comms: supabase
      .from('communication_log')
      .select('id, group_id, recipient_profile_id, guest_id, type, channel, status, sent_at, created_at')
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(10000),
    edits: supabase
      .from('recipe_edit_history')
      .select('id, recipe_id, edited_by, created_at')
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(5000),
    orders: supabase
      .from('orders')
      .select('id, group_id, user_id, amount_total, status, created_at')
      .order('created_at', { ascending: false })
      .limit(5000),
    events: supabase
      .from('user_events')
      .select('id, user_id, group_id, event_name, props, created_at')
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(10000),
    // Reason: captains = group_members with role='member' (owners excluded).
    members: supabase
      .from('group_members')
      .select('group_id, profile_id, role, joined_at, invited_by')
      .eq('role', 'member')
      .order('joined_at', { ascending: false })
      .limit(5000),
  };

  const keys = Object.keys(queries) as (keyof typeof queries)[];
  const settled = await Promise.allSettled(Object.values(queries));

  const degraded: string[] = [];
  const out: Record<string, unknown[]> = {};
  keys.forEach((key, i) => {
    const result = settled[i];
    if (result.status === 'fulfilled' && !result.value.error) {
      out[key] = result.value.data ?? [];
    } else {
      // Reason: one broken source must not blank the whole dashboard —
      // mark it degraded and render the rest.
      out[key] = [];
      degraded.push(key);
      const msg =
        result.status === 'rejected' ? String(result.reason) : result.value.error?.message;
      console.error(`radar: source "${key}" failed`, msg);
    }
  });

  return { sources: out as unknown as RadarSources, degraded };
}
