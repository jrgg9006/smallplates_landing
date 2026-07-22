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

// Reason: "this week" in the weekly status email means the ISO calendar week
// starting Monday 00:00 (not a rolling 7-day window). Aligns with the founder's
// intent of sending on Saturdays — recipients read "+3 this week" as "+3 since
// Monday", which matches their mental model. Used by getWeeklyStatsForGroup
// AND the weekly-status preview route — keep them in sync.
export function getStartOfThisWeekISO(): string {
  const d = new Date();
  const dayOfWeek = d.getDay() || 7; // Sun=0 → 7 so Monday stays the anchor
  d.setDate(d.getDate() - dayOfWeek + 1);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

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
  // Reason: each recipient gets a CTA link built with THEIR own token so
  // recipes captured via that link are attributed to them, not to the group
  // creator. Falls back to the group creator's token when null.
  collection_link_token: string | null;
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
  // Reason: full chronological trail of every weekly_status email sent for this group.
  status_sent_dates: string[];
  // Reason: organizer's public collection token, used to build the "Collect Recipes"
  // CTA link that captains/organizer share with anyone who hasn't submitted yet.
  collection_link_token: string | null;
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

// ---------- 4. Reminders Tool Tip (churn / "who's going cold" queue) ----------

// Reason: why a book is or isn't in the main send list. Everything but 'candidate'
// is shown collapsed so nothing silently disappears.
//   candidate  — email this one; ranked by coldness
//   opted_out  — organizer opted out of book updates
//   no_time    — book already closed (Closes in 0d); "No close date" is NOT this
//   cooldown   — got this same tip < REMINDERS_TIP_COOLDOWN_DAYS ago
//   duplicate  — same organizer email already has a colder book in the list
export type RemindersTipBucket = 'candidate' | 'opted_out' | 'no_time' | 'cooldown' | 'duplicate';

// Reason: don't re-send this tip within two weeks. Tied to THIS tip only (not
// weekly-status etc.), or everyone active would always look "recently emailed".
export const REMINDERS_TIP_COOLDOWN_DAYS = 14;

export interface BookForRemindersTip {
  group_id: string;
  group_name: string;
  couple_display_name: string | null;
  organizer_profile_id: string;
  organizer_email: string;
  organizer_name: string | null;
  organizer_opted_out: boolean;
  total_recipes: number;
  captain_count: number;
  // Reason: how many times the organizer has used the Send Reminders tool.
  // 0 = never used it. Shown as a signal, not a filter.
  reminders_used_count: number;
  book_close_date: string | null;
  days_left: number | null;
  // Recency signals feeding the coldness score.
  last_recipe_at: string | null;
  last_login_at: string | null;
  // Reason: the most recent sign of life (recipe OR login), with book creation as
  // the floor so brand-new/never-active books still rank instead of dropping out.
  last_activity_at: string | null;
  // Reason: days since last_activity_at — the primary rank. Bigger = colder = higher.
  coldness_days: number;
  // This tab's own sends.
  tip_sent_dates: string[];
  last_tip_sent_at: string | null;
  bucket: RemindersTipBucket;
}

export async function getBooksForRemindersTip(): Promise<BookForRemindersTip[]> {
  const supabase = createSupabaseAdminClient();

  // Reason: only active books — a finished book doesn't need a "don't forget" nudge.
  const { data: groups } = await supabase
    .from('groups')
    .select('id, name, couple_display_name, created_by, book_close_date, created_at')
    .eq('book_status', 'active')
    .order('created_at', { ascending: false });

  if (!groups || groups.length === 0) return [];

  const groupIds = groups.map(g => g.id);
  const organizerIds = Array.from(new Set(groups.map(g => g.created_by)));

  const [profilesRes, recipesRes, captainsRes, reminderLogRes, tipLogRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, email, full_name, notification_emails_opt_out')
      .in('id', organizerIds),
    supabase
      .from('guest_recipes')
      .select('group_id, submitted_at')
      .in('submission_status', ['submitted', 'approved'])
      .in('group_id', groupIds),
    supabase
      .from('group_members')
      .select('group_id')
      .eq('role', 'member')
      .in('group_id', groupIds),
    supabase
      .from('communication_log')
      .select('group_id')
      .eq('type', 'reminder')
      .in('group_id', groupIds),
    supabase
      .from('communication_log')
      .select('group_id, sent_at')
      .eq('type', 'reminders_tip')
      .in('group_id', groupIds),
  ]);

  // Reason: last_sign_in_at lives in auth.users, not profiles. Fetch once and map
  // by id (same pattern as the admin users panel). Degrade gracefully on failure.
  const lastLoginByProfile = new Map<string, string | null>();
  try {
    const { data: authData } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
    for (const u of authData?.users || []) lastLoginByProfile.set(u.id, u.last_sign_in_at || null);
  } catch (e) {
    console.error('reminders-tip: failed to list auth users for last_sign_in_at', e);
  }

  const profileMap = new Map((profilesRes.data ?? []).map(p => [p.id, p]));

  const recipeCountByGroup = new Map<string, number>();
  const lastRecipeByGroup = new Map<string, string>();
  for (const r of recipesRes.data ?? []) {
    if (!r.group_id) continue;
    recipeCountByGroup.set(r.group_id, (recipeCountByGroup.get(r.group_id) ?? 0) + 1);
    if (r.submitted_at) {
      const prev = lastRecipeByGroup.get(r.group_id);
      if (!prev || r.submitted_at > prev) lastRecipeByGroup.set(r.group_id, r.submitted_at);
    }
  }

  const captainCountByGroup = new Map<string, number>();
  for (const c of captainsRes.data ?? []) {
    if (!c.group_id) continue;
    captainCountByGroup.set(c.group_id, (captainCountByGroup.get(c.group_id) ?? 0) + 1);
  }

  const reminderCountByGroup = new Map<string, number>();
  for (const log of reminderLogRes.data ?? []) {
    if (!log.group_id) continue;
    reminderCountByGroup.set(log.group_id, (reminderCountByGroup.get(log.group_id) ?? 0) + 1);
  }

  const tipDatesByGroup = new Map<string, string[]>();
  for (const log of tipLogRes.data ?? []) {
    if (!log.group_id || !log.sent_at) continue;
    const arr = tipDatesByGroup.get(log.group_id) ?? [];
    arr.push(log.sent_at);
    tipDatesByGroup.set(log.group_id, arr);
  }
  for (const arr of tipDatesByGroup.values()) arr.sort();

  const now = Date.now();
  const daysSince = (iso: string | null): number | null =>
    iso ? Math.floor((now - new Date(iso).getTime()) / ONE_DAY_MS) : null;

  const enriched = groups
    .map(g => {
      const profile = profileMap.get(g.created_by);
      if (!profile?.email) return null;

      const days_left: number | null = g.book_close_date
        ? Math.max(0, Math.floor((new Date(g.book_close_date).getTime() - now) / ONE_DAY_MS))
        : null;

      const last_recipe_at = lastRecipeByGroup.get(g.id) ?? null;
      const last_login_at = lastLoginByProfile.get(g.created_by) ?? null;
      // Reason: most recent sign of life; book creation is the floor so a
      // never-active book still ranks by age instead of being treated as "fresh".
      const activity = [last_recipe_at, last_login_at, g.created_at].filter(Boolean) as string[];
      const last_activity_at = activity.length
        ? activity.reduce((a, b) => (a > b ? a : b))
        : null;
      const coldness_days = daysSince(last_activity_at) ?? 0;

      const tipDates = tipDatesByGroup.get(g.id) ?? [];
      const last_tip_sent_at = tipDates.length ? tipDates[tipDates.length - 1] : null;

      // Reason: classify once so the UI just groups by bucket. Order matters:
      // opted-out and closed win over cooldown.
      let bucket: RemindersTipBucket;
      if (profile.notification_emails_opt_out) bucket = 'opted_out';
      else if (days_left === 0) bucket = 'no_time';
      else if (last_tip_sent_at && (daysSince(last_tip_sent_at) ?? 999) < REMINDERS_TIP_COOLDOWN_DAYS)
        bucket = 'cooldown';
      else bucket = 'candidate';

      return {
        group_id: g.id,
        group_name: g.name,
        couple_display_name: g.couple_display_name,
        organizer_profile_id: g.created_by,
        organizer_email: profile.email,
        organizer_name: profile.full_name,
        organizer_opted_out: !!profile.notification_emails_opt_out,
        total_recipes: recipeCountByGroup.get(g.id) ?? 0,
        captain_count: captainCountByGroup.get(g.id) ?? 0,
        reminders_used_count: reminderCountByGroup.get(g.id) ?? 0,
        book_close_date: g.book_close_date,
        days_left,
        last_recipe_at,
        last_login_at,
        last_activity_at,
        coldness_days,
        tip_sent_dates: tipDates,
        last_tip_sent_at,
        bucket,
      } as BookForRemindersTip;
    })
    .filter((b): b is BookForRemindersTip => b !== null);

  // Reason: dedupe candidates by organizer email — the same person with two books
  // shouldn't get the tip twice. Keep the coldest (needs it most), demote the rest.
  const seenEmail = new Set<string>();
  for (const b of enriched
    .filter(b => b.bucket === 'candidate')
    .sort((a, b) => b.coldness_days - a.coldness_days)) {
    const key = b.organizer_email.toLowerCase();
    if (seenEmail.has(key)) b.bucket = 'duplicate';
    else seenEmail.add(key);
  }

  // Reason: candidates first, coldest-first; tiebreak fewer recipes (more stalled)
  // then less runway. Non-candidates fall to the bottom (UI shows them collapsed).
  enriched.sort((a, b) => {
    const rank = (x: BookForRemindersTip) => (x.bucket === 'candidate' ? 0 : 1);
    if (rank(a) !== rank(b)) return rank(a) - rank(b);
    if (b.coldness_days !== a.coldness_days) return b.coldness_days - a.coldness_days;
    if (a.total_recipes !== b.total_recipes) return a.total_recipes - b.total_recipes;
    return (a.days_left ?? Number.POSITIVE_INFINITY) - (b.days_left ?? Number.POSITIVE_INFINITY);
  });

  return enriched;
}

// ---------- 5. Reactivation (curious-but-abandoned winback) ----------

// Reason: why an abandoned book is or isn't in the send list.
//   candidate  — email this one; ranked by how long it's been abandoned
//   opted_out  — organizer opted out
//   no_time    — book already closed
//   cooldown   — reactivation sent < REACTIVATION_COOLDOWN_DAYS ago
//   exhausted  — already got REACTIVATION_MAX_TOUCHES nudges; stop
//   duplicate  — same organizer email already has an older abandoned book here
export type ReactivationBucket =
  | 'candidate'
  | 'opted_out'
  | 'no_time'
  | 'cooldown'
  | 'exhausted'
  | 'duplicate';

// Reason: signup + this many days of zero activity before the first winback.
export const REACTIVATION_MIN_DAYS = 7;
// Reason: gap between the two touches (so a day-7 send reappears around day 21).
export const REACTIVATION_COOLDOWN_DAYS = 14;
// Reason: two touches max, then leave them alone.
export const REACTIVATION_MAX_TOUCHES = 2;

export interface BookForReactivation {
  group_id: string;
  group_name: string;
  couple_display_name: string | null;
  organizer_profile_id: string;
  organizer_email: string;
  organizer_name: string | null;
  organizer_opted_out: boolean;
  created_at: string;
  // Reason: days since signup/book creation — the rank (oldest abandoned first).
  age_days: number;
  last_login_at: string | null;
  // Reason: days since last login; null when we have no auth record.
  days_since_login: number | null;
  book_close_date: string | null;
  days_left: number | null;
  tip_sent_dates: string[];
  last_tip_sent_at: string | null;
  sent_count: number;
  bucket: ReactivationBucket;
}

export async function getBooksForReactivation(): Promise<BookForReactivation[]> {
  const supabase = createSupabaseAdminClient();

  const { data: groups } = await supabase
    .from('groups')
    .select('id, name, couple_display_name, created_by, book_close_date, created_at')
    .eq('book_status', 'active')
    .order('created_at', { ascending: true });

  if (!groups || groups.length === 0) return [];

  const groupIds = groups.map(g => g.id);
  const organizerIds = Array.from(new Set(groups.map(g => g.created_by)));

  const [profilesRes, recipesRes, guestsRes, tipLogRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, email, full_name, notification_emails_opt_out')
      .in('id', organizerIds),
    supabase
      .from('guest_recipes')
      .select('group_id')
      .in('submission_status', ['submitted', 'approved'])
      .in('group_id', groupIds),
    supabase
      .from('guests')
      .select('group_id')
      .in('group_id', groupIds),
    supabase
      .from('communication_log')
      .select('group_id, sent_at')
      .eq('type', 'reactivation')
      .in('group_id', groupIds),
  ]);

  const lastLoginByProfile = new Map<string, string | null>();
  try {
    const { data: authData } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
    for (const u of authData?.users || []) lastLoginByProfile.set(u.id, u.last_sign_in_at || null);
  } catch (e) {
    console.error('reactivation: failed to list auth users for last_sign_in_at', e);
  }

  const profileMap = new Map((profilesRes.data ?? []).map(p => [p.id, p]));

  const recipeCountByGroup = new Map<string, number>();
  for (const r of recipesRes.data ?? []) {
    if (!r.group_id) continue;
    recipeCountByGroup.set(r.group_id, (recipeCountByGroup.get(r.group_id) ?? 0) + 1);
  }

  const guestCountByGroup = new Map<string, number>();
  for (const g of guestsRes.data ?? []) {
    if (!g.group_id) continue;
    guestCountByGroup.set(g.group_id, (guestCountByGroup.get(g.group_id) ?? 0) + 1);
  }

  const tipDatesByGroup = new Map<string, string[]>();
  for (const log of tipLogRes.data ?? []) {
    if (!log.group_id || !log.sent_at) continue;
    const arr = tipDatesByGroup.get(log.group_id) ?? [];
    arr.push(log.sent_at);
    tipDatesByGroup.set(log.group_id, arr);
  }
  for (const arr of tipDatesByGroup.values()) arr.sort();

  const now = Date.now();
  const daysSince = (iso: string | null): number | null =>
    iso ? Math.floor((now - new Date(iso).getTime()) / ONE_DAY_MS) : null;

  const abandoned = groups
    .map(g => {
      const profile = profileMap.get(g.created_by);
      if (!profile?.email) return null;

      // Reason: the abandoned population — signed up, but never did anything and
      // never came back. Anything with a recipe, a guest, or a recent login is out.
      const recipes = recipeCountByGroup.get(g.id) ?? 0;
      const guests = guestCountByGroup.get(g.id) ?? 0;
      if (recipes > 0 || guests > 0) return null;

      const age_days = daysSince(g.created_at) ?? 0;
      const last_login_at = lastLoginByProfile.get(g.created_by) ?? null;
      const days_since_login = daysSince(last_login_at);
      // Reason: "came back recently" disqualifies — they're browsing, not abandoned.
      const inactiveFor = days_since_login ?? age_days;
      if (inactiveFor < REACTIVATION_MIN_DAYS || age_days < REACTIVATION_MIN_DAYS) return null;

      const days_left: number | null = g.book_close_date
        ? Math.max(0, Math.floor((new Date(g.book_close_date).getTime() - now) / ONE_DAY_MS))
        : null;

      const tipDates = tipDatesByGroup.get(g.id) ?? [];
      const last_tip_sent_at = tipDates.length ? tipDates[tipDates.length - 1] : null;
      const sent_count = tipDates.length;

      let bucket: ReactivationBucket;
      if (profile.notification_emails_opt_out) bucket = 'opted_out';
      else if (days_left === 0) bucket = 'no_time';
      else if (sent_count >= REACTIVATION_MAX_TOUCHES) bucket = 'exhausted';
      else if (last_tip_sent_at && (daysSince(last_tip_sent_at) ?? 999) < REACTIVATION_COOLDOWN_DAYS)
        bucket = 'cooldown';
      else bucket = 'candidate';

      return {
        group_id: g.id,
        group_name: g.name,
        couple_display_name: g.couple_display_name,
        organizer_profile_id: g.created_by,
        organizer_email: profile.email,
        organizer_name: profile.full_name,
        organizer_opted_out: !!profile.notification_emails_opt_out,
        created_at: g.created_at,
        age_days,
        last_login_at,
        days_since_login,
        book_close_date: g.book_close_date,
        days_left,
        tip_sent_dates: tipDates,
        last_tip_sent_at,
        sent_count,
        bucket,
      } as BookForReactivation;
    })
    .filter((b): b is BookForReactivation => b !== null);

  // Reason: dedupe candidates by organizer email — keep the oldest abandoned book,
  // demote the rest so the same person isn't emailed twice.
  const seenEmail = new Set<string>();
  for (const b of abandoned
    .filter(b => b.bucket === 'candidate')
    .sort((a, b) => b.age_days - a.age_days)) {
    const key = b.organizer_email.toLowerCase();
    if (seenEmail.has(key)) b.bucket = 'duplicate';
    else seenEmail.add(key);
  }

  // Reason: candidates first, oldest-abandoned first; tiebreak by longest gone quiet.
  abandoned.sort((a, b) => {
    const rank = (x: BookForReactivation) => (x.bucket === 'candidate' ? 0 : 1);
    if (rank(a) !== rank(b)) return rank(a) - rank(b);
    if (b.age_days !== a.age_days) return b.age_days - a.age_days;
    return (b.days_since_login ?? 0) - (a.days_since_login ?? 0);
  });

  return abandoned;
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
  const weekStart = getStartOfThisWeekISO();

  const groupRes = await supabase
    .from('groups')
    .select('id, name, couple_display_name, book_status, book_close_date, created_by')
    .eq('id', groupId)
    .single();

  if (!groupRes.data) return null;
  const group = groupRes.data;

  const [totalRes, weekRecipesRes, weekGuestsRes, membersRes, sentLogsRes, organizerProfileRes] = await Promise.all([
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
      .gte('submitted_at', weekStart),
    supabase
      .from('guests')
      .select('id', { count: 'exact', head: true })
      .eq('group_id', groupId)
      .gte('created_at', weekStart),
    // Reason: select role + profile_id only, then fetch profiles in a separate
    // query and join in JS. The nested .select('profiles(...)') form requires
    // supabase-js to infer the FK relationship between group_members and
    // profiles, which sometimes returns null silently — causing 0 recipients.
    supabase
      .from('group_members')
      .select('profile_id, role')
      .eq('group_id', groupId)
      .in('role', ['owner', 'member']),
    // Reason: collect every weekly_status send date so the dashboard can show
    // the full chronological trail. We dedupe by sent_at since one campaign
    // produces N rows (one per recipient) but they all share a timestamp.
    supabase
      .from('communication_log')
      .select('sent_at')
      .eq('group_id', groupId)
      .eq('type', 'weekly_status')
      .order('sent_at', { ascending: true }),
    // Reason: organizer's collection_link_token — drives the "Collect Recipes"
    // CTA. Fetched in the same Promise.all to keep latency flat.
    supabase
      .from('profiles')
      .select('collection_link_token')
      .eq('id', group.created_by)
      .maybeSingle(),
  ]);

  // Dedupe send timestamps to a campaign-level trail. Each weekly campaign produces
  // one log per recipient — we want the dates of the campaigns themselves, not per-recipient.
  const seenDays = new Set<string>();
  const statusSentDates: string[] = [];
  for (const row of sentLogsRes.data ?? []) {
    if (!row.sent_at) continue;
    const day = row.sent_at.slice(0, 10);
    if (seenDays.has(day)) continue;
    seenDays.add(day);
    statusSentDates.push(row.sent_at);
  }

  const days_left: number | null = group.book_close_date
    ? Math.max(
        0,
        Math.floor((new Date(group.book_close_date).getTime() - Date.now()) / ONE_DAY_MS)
      )
    : null;

  const memberRows = membersRes.data ?? [];
  const memberProfileIds = Array.from(new Set(memberRows.map(m => m.profile_id)));

  const profilesRes = memberProfileIds.length > 0
    ? await supabase
        .from('profiles')
        .select('id, email, full_name, notification_emails_opt_out, collection_link_token')
        .in('id', memberProfileIds)
    : { data: [] as Array<{ id: string; email: string; full_name: string | null; notification_emails_opt_out: boolean | null; collection_link_token: string | null }> };

  const profileMap = new Map(
    (profilesRes.data ?? []).map(p => [p.id, p])
  );

  const recipients: WeeklyStatusRecipient[] = memberRows
    .map(m => {
      const p = profileMap.get(m.profile_id);
      if (!p?.email) return null;
      const role = m.role === 'owner' || m.role === 'member' ? m.role : null;
      if (!role) return null;
      return {
        profile_id: p.id,
        email: p.email,
        full_name: p.full_name,
        role,
        notification_emails_opt_out: !!p.notification_emails_opt_out,
        collection_link_token: p.collection_link_token ?? null,
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
    status_sent_dates: statusSentDates,
    collection_link_token: organizerProfileRes.data?.collection_link_token ?? null,
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
