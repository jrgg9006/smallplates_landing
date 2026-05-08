/**
 * Data shapes + queries consumed by the Email Dashboard and the 3 send routes
 * (captain_reminder, weekly_status, closing_nudge).
 *
 * Reason: each query calls `createSupabaseAdminClient()` internally because
 * these functions are admin-only and bypass RLS. Volume is small
 * (~10 active books at a time) so we use multiple targeted queries
 * instead of a single complex SQL view.
 */

import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import type { BookStatus, MemberRole } from '@/lib/types/database';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

// ---------- 1. Captain Reminder ----------

// Read-only counterpart of GroupNeedingCaptain — for the "books with captains"
// reference table shown below the Captain Reminder list.
export interface GroupWithCaptainsSummary {
  group_id: string;
  group_name: string;
  couple_display_name: string | null;
  organizer_name: string | null;
  captain_count: number;
  // Reason: surfaces who the captains actually are, so the founder recognizes them by name.
  captain_names: string[];
  total_recipes: number;
  group_created_at: string;
}

export interface GroupNeedingCaptain {
  group_id: string;
  group_name: string;
  couple_display_name: string | null;
  organizer_profile_id: string;
  organizer_email: string;
  organizer_name: string | null;
  organizer_opted_out: boolean;
  book_close_date: string | null;
  // Reason: surfaces "how long has this book gone without a captain" — used in the
  // dashboard as a gravity indicator (newer = ok, older = urgent).
  group_created_at: string;
  // Reason: combined with age, this tells Ricardo whether the organizer is
  // stuck (0 recipes) or pulling it off solo (20+ recipes).
  total_recipes: number;
  // Reason: full chronological trail of every captain reminder sent for this group.
  // No cap on count — we just show what's been sent.
  reminder_sent_dates: string[];
}

// ---------- 2. Weekly Status ----------

export interface WeeklyStatusRecipient {
  profile_id: string;
  email: string;
  full_name: string | null;
  // Reason: in this codebase, captains are stored as role = 'member';
  // 'owner' is the organizer who bought the book. The 'admin' value exists
  // in the type union but is not used operationally.
  role: Extract<MemberRole, 'owner' | 'member'>;
  notification_emails_opt_out: boolean;
}

export interface WeeklyStats {
  group_id: string;
  group_name: string;
  couple_display_name: string | null;
  book_status: BookStatus;
  book_close_date: string | null;
  total_recipes: number;
  recipes_this_week: number;
  new_guests_this_week: number;
  days_left: number | null;
  recipients: WeeklyStatusRecipient[];
  last_status_sent_at: string | null;
}

// ---------- 3. Closing Nudge ----------

export interface ClosingNudgeGuest {
  guest_id: string;
  email: string;
  first_name: string;
  last_name: string;
  showcase_opted_out: boolean;
  // Reason: kept for visibility in the dashboard (so Ricardo can see opt-in status)
  // but NOT part of the eligibility filter — the actual filter is just
  // `email IS NOT NULL && !showcase_opted_out && !already_nudged`.
  notify_opt_in: boolean;
  already_nudged: boolean;
}

export interface GroupClosingSoon {
  group_id: string;
  group_name: string;
  couple_display_name: string | null;
  book_close_date: string;
  days_until_close: number;
  eligible_guests_count: number;
  closing_nudge_sent_count: number;
  guests: ClosingNudgeGuest[];
}

// ---------- Implementations ----------

export async function getGroupsWithoutCaptains(includeAll = false): Promise<GroupNeedingCaptain[]> {
  const supabase = createSupabaseAdminClient();

  // Reason: captain reminders only matter for active books by default. Once book_status
  // is reviewed / ready_to_print / printed, the book is closed and adding captains is
  // moot. `includeAll = true` is for when the founder wants historical reference;
  // `inactive` (soft-deleted) is always excluded.
  let query = supabase
    .from('groups')
    .select('id, name, couple_display_name, created_by, book_close_date, book_status, created_at')
    .order('created_at', { ascending: false });
  query = includeAll ? query.neq('book_status', 'inactive') : query.eq('book_status', 'active');
  const { data: groups } = await query;

  if (!groups || groups.length === 0) return [];

  // Reason: captains are role = 'member' (not 'admin'). 'owner' rows are the organizer.
  const { data: captains } = await supabase
    .from('group_members')
    .select('group_id')
    .eq('role', 'member');

  const captainGroupIds = new Set((captains ?? []).map(c => c.group_id));
  const groupsNeedingCaptain = groups.filter(g => !captainGroupIds.has(g.id));

  if (groupsNeedingCaptain.length === 0) return [];

  const organizerIds = Array.from(new Set(groupsNeedingCaptain.map(g => g.created_by)));
  const groupIds = groupsNeedingCaptain.map(g => g.id);

  const [profilesRes, logsRes, recipesRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, email, full_name, notification_emails_opt_out')
      .in('id', organizerIds),
    supabase
      .from('communication_log')
      .select('group_id, sent_at')
      .eq('type', 'captain_reminder')
      .in('group_id', groupIds),
    supabase
      .from('guest_recipes')
      .select('group_id')
      .in('submission_status', ['submitted', 'approved'])
      .in('group_id', groupIds),
  ]);

  const recipeCountByGroup = new Map<string, number>();
  for (const r of recipesRes.data ?? []) {
    if (!r.group_id) continue;
    recipeCountByGroup.set(r.group_id, (recipeCountByGroup.get(r.group_id) ?? 0) + 1);
  }

  const profileMap = new Map(
    (profilesRes.data ?? []).map(p => [p.id, p])
  );

  // Reason: collect every send date per group so we can show the full chronological trail.
  const reminderDatesByGroup = new Map<string, string[]>();
  for (const log of logsRes.data ?? []) {
    if (!log.group_id || !log.sent_at) continue;
    const arr = reminderDatesByGroup.get(log.group_id) ?? [];
    arr.push(log.sent_at);
    reminderDatesByGroup.set(log.group_id, arr);
  }
  // Sort each group's dates ascending (oldest first).
  for (const arr of reminderDatesByGroup.values()) {
    arr.sort();
  }

  return groupsNeedingCaptain
    .map(g => {
      const profile = profileMap.get(g.created_by);
      if (!profile?.email) return null;
      return {
        group_id: g.id,
        group_name: g.name,
        couple_display_name: g.couple_display_name,
        organizer_profile_id: g.created_by,
        organizer_email: profile.email,
        organizer_name: profile.full_name,
        organizer_opted_out: !!profile.notification_emails_opt_out,
        book_close_date: g.book_close_date,
        group_created_at: g.created_at,
        total_recipes: recipeCountByGroup.get(g.id) ?? 0,
        reminder_sent_dates: reminderDatesByGroup.get(g.id) ?? [],
      };
    })
    .filter((g): g is GroupNeedingCaptain => g !== null);
}

export async function getGroupsWithCaptains(includeAll = false): Promise<GroupWithCaptainsSummary[]> {
  const supabase = createSupabaseAdminClient();

  // Reason: same filter as the captain reminder list — only active books by default,
  // but the founder can opt to see all (reviewed / printed / etc.) for reference.
  let query = supabase
    .from('groups')
    .select('id, name, couple_display_name, created_by, created_at')
    .order('created_at', { ascending: false });
  query = includeAll ? query.neq('book_status', 'inactive') : query.eq('book_status', 'active');
  const { data: groups } = await query;

  if (!groups || groups.length === 0) return [];

  const groupIds = groups.map(g => g.id);

  // Captain rows (role = 'member')
  const { data: captains } = await supabase
    .from('group_members')
    .select('group_id, profile_id')
    .eq('role', 'member')
    .in('group_id', groupIds);

  const captainProfileIdsByGroup = new Map<string, string[]>();
  for (const c of captains ?? []) {
    const arr = captainProfileIdsByGroup.get(c.group_id) ?? [];
    arr.push(c.profile_id);
    captainProfileIdsByGroup.set(c.group_id, arr);
  }

  const groupsWithCaptains = groups.filter(g => (captainProfileIdsByGroup.get(g.id)?.length ?? 0) > 0);
  if (groupsWithCaptains.length === 0) return [];

  const filteredIds = groupsWithCaptains.map(g => g.id);
  const organizerIds = groupsWithCaptains.map(g => g.created_by);
  // Reason: organizer profiles + captain profiles fetched in one query
  // (both live in `profiles`, so we deduplicate IDs and lookup by id).
  const allCaptainProfileIds = (captains ?? []).map(c => c.profile_id);
  const allProfileIds = Array.from(new Set([...organizerIds, ...allCaptainProfileIds]));

  const [profilesRes, recipesRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, full_name, email')
      .in('id', allProfileIds),
    supabase
      .from('guest_recipes')
      .select('group_id')
      .in('submission_status', ['submitted', 'approved'])
      .in('group_id', filteredIds),
  ]);

  const profileMap = new Map((profilesRes.data ?? []).map(p => [p.id, p]));

  const recipeCountByGroup = new Map<string, number>();
  for (const r of recipesRes.data ?? []) {
    if (!r.group_id) continue;
    recipeCountByGroup.set(r.group_id, (recipeCountByGroup.get(r.group_id) ?? 0) + 1);
  }

  const displayName = (profileId: string): string | null => {
    const p = profileMap.get(profileId);
    if (!p) return null;
    return p.full_name?.split(' ')[0] || p.full_name || p.email || null;
  };

  return groupsWithCaptains.map(g => {
    const captainIds = captainProfileIdsByGroup.get(g.id) ?? [];
    const captainNames = captainIds
      .map(displayName)
      .filter((n): n is string => !!n);

    return {
      group_id: g.id,
      group_name: g.name,
      couple_display_name: g.couple_display_name,
      organizer_name: profileMap.get(g.created_by)?.full_name ?? null,
      captain_count: captainIds.length,
      captain_names: captainNames,
      total_recipes: recipeCountByGroup.get(g.id) ?? 0,
      group_created_at: g.created_at,
    };
  });
}

export async function getWeeklyStatsForGroup(groupId: string): Promise<WeeklyStats | null> {
  const supabase = createSupabaseAdminClient();
  const oneWeekAgo = new Date(Date.now() - 7 * ONE_DAY_MS).toISOString();

  const groupRes = await supabase
    .from('groups')
    .select('id, name, couple_display_name, book_status, book_close_date')
    .eq('id', groupId)
    .single();

  if (!groupRes.data) return null;
  const group = groupRes.data;

  const [totalRes, weekRecipesRes, weekGuestsRes, membersRes, lastSentRes] = await Promise.all([
    supabase
      .from('guest_recipes')
      .select('id', { count: 'exact', head: true })
      .eq('group_id', groupId)
      .in('submission_status', ['submitted', 'approved']),
    supabase
      .from('guest_recipes')
      .select('id', { count: 'exact', head: true })
      .eq('group_id', groupId)
      .in('submission_status', ['submitted', 'approved'])
      .gte('submitted_at', oneWeekAgo),
    supabase
      .from('guests')
      .select('id', { count: 'exact', head: true })
      .eq('group_id', groupId)
      .gte('created_at', oneWeekAgo),
    supabase
      .from('group_members')
      .select('profile_id, role, profiles(id, email, full_name, notification_emails_opt_out)')
      .eq('group_id', groupId)
      .in('role', ['owner', 'member']),
    supabase
      .from('communication_log')
      .select('sent_at')
      .eq('group_id', groupId)
      .eq('type', 'weekly_status')
      .order('sent_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const days_left: number | null = group.book_close_date
    ? Math.max(
        0,
        Math.floor((new Date(group.book_close_date).getTime() - Date.now()) / ONE_DAY_MS)
      )
    : null;

  // Reason: when joining via foreign key, supabase-js returns the joined row
  // either as an object or as an array depending on the relationship type.
  // We normalize to a single profile object.
  type RawMember = {
    profile_id: string;
    role: MemberRole;
    profiles:
      | { id: string; email: string; full_name: string | null; notification_emails_opt_out: boolean | null }
      | { id: string; email: string; full_name: string | null; notification_emails_opt_out: boolean | null }[]
      | null;
  };

  const recipients: WeeklyStatusRecipient[] = ((membersRes.data ?? []) as unknown as RawMember[])
    .map(m => {
      const p = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles;
      if (!p?.email) return null;
      const role = m.role === 'owner' || m.role === 'member' ? m.role : null;
      if (!role) return null;
      return {
        profile_id: p.id,
        email: p.email,
        full_name: p.full_name,
        role,
        notification_emails_opt_out: !!p.notification_emails_opt_out,
      };
    })
    .filter((r): r is WeeklyStatusRecipient => r !== null);

  return {
    group_id: group.id,
    group_name: group.name,
    couple_display_name: group.couple_display_name,
    book_status: group.book_status,
    book_close_date: group.book_close_date,
    total_recipes: totalRes.count ?? 0,
    recipes_this_week: weekRecipesRes.count ?? 0,
    new_guests_this_week: weekGuestsRes.count ?? 0,
    days_left,
    recipients,
    last_status_sent_at: lastSentRes.data?.sent_at ?? null,
  };
}

export async function getActiveGroupsForWeeklyStatus(): Promise<WeeklyStats[]> {
  const supabase = createSupabaseAdminClient();

  const { data: groups } = await supabase
    .from('groups')
    .select('id')
    .eq('book_status', 'active')
    .order('created_at', { ascending: false });

  if (!groups || groups.length === 0) return [];

  const stats = await Promise.all(groups.map(g => getWeeklyStatsForGroup(g.id)));
  return stats.filter((s): s is WeeklyStats => s !== null);
}

export async function getGroupsClosingSoon(daysWindow: number): Promise<GroupClosingSoon[]> {
  const supabase = createSupabaseAdminClient();
  const now = new Date();
  const horizon = new Date(now.getTime() + daysWindow * ONE_DAY_MS);

  const { data: groups } = await supabase
    .from('groups')
    .select('id, name, couple_display_name, book_close_date')
    .eq('book_status', 'active')
    .not('book_close_date', 'is', null)
    .gte('book_close_date', now.toISOString())
    .lte('book_close_date', horizon.toISOString())
    .order('book_close_date', { ascending: true });

  if (!groups || groups.length === 0) return [];

  const results = await Promise.all(
    groups.map(async g => {
      const [guestsRes, logsRes] = await Promise.all([
        supabase
          .from('guests')
          .select('id, email, first_name, last_name, showcase_opted_out, notify_opt_in')
          .eq('group_id', g.id)
          .not('email', 'is', null)
          .neq('email', ''),
        supabase
          .from('communication_log')
          .select('guest_id')
          .eq('group_id', g.id)
          .eq('type', 'closing_nudge'),
      ]);

      const nudgedGuestIds = new Set(
        (logsRes.data ?? [])
          .map(l => l.guest_id)
          .filter((id): id is string => !!id)
      );

      const guests: ClosingNudgeGuest[] = (guestsRes.data ?? []).map(row => ({
        guest_id: row.id,
        email: row.email,
        first_name: row.first_name,
        last_name: row.last_name,
        showcase_opted_out: !!row.showcase_opted_out,
        notify_opt_in: !!row.notify_opt_in,
        already_nudged: nudgedGuestIds.has(row.id),
      }));

      // Reason: "a los que ya nos dejaron su correo" — guests who submitted a recipe
      // are already in context. showcase_opted_out is the canonical unsubscribe for
      // guest-facing email; notify_opt_in is informational only and not used here.
      const eligibleCount = guests.filter(
        gst => !gst.showcase_opted_out && !gst.already_nudged
      ).length;

      const days_until_close = Math.max(
        0,
        Math.floor((new Date(g.book_close_date!).getTime() - now.getTime()) / ONE_DAY_MS)
      );

      return {
        group_id: g.id,
        group_name: g.name,
        couple_display_name: g.couple_display_name,
        book_close_date: g.book_close_date!,
        days_until_close,
        eligible_guests_count: eligibleCount,
        closing_nudge_sent_count: nudgedGuestIds.size,
        guests,
      };
    })
  );

  return results;
}
