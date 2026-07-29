// lib/radar/monitor-types.ts
export type NotificationPriority = 'high' | 'medium' | 'low';
export type NotificationStatus = 'open' | 'attended' | 'dismissed';
export type CloseDateSource = 'book_close_date' | 'event_date' | 'gift_date' | null;

// Plain arrays so Layer 1 stays pure and unit-testable.
export interface MonitorSources {
  groups: Array<{
    id: string; name: string; created_by: string; created_at: string;
    book_status: string;
    book_close_date: string | null; event_date: string | null;
    gift_date: string | null; wedding_date: string | null;
    archived_at: string | null;
  }>;
  recipes: Array<{ group_id: string; guest_id: string | null; submitted_at: string | null; submission_status: string; }>;
  guests: Array<{ id: string; group_id: string; created_at: string; is_self: boolean; }>;
  captains: Array<{ group_id: string; joined_at: string; }>;
  comms: Array<{ group_id: string | null; recipient_profile_id: string | null; type: string; sent_at: string | null; created_at: string; }>;
  events: Array<{ group_id: string | null; event_name: string; created_at: string; }>;
  lastLoginByProfile: Record<string, string | null>; // created_by -> last_sign_in_at (ISO)
}

export interface NotificationCandidate {
  group_id: string;
  book_name: string;
  owner_id: string;
  recipes: number;
  goal: number;
  gap_to_goal: number;
  client_coldness_days: number;
  last_client_activity_at: string | null;
  days_until_close: number | null;
  close_date_source: CloseDateSource;
  momentum: { per_week: number[]; stalled: boolean };
  captains: { count: number; active_count: number };
  contributors: { distinct_submitters: number; owner_submitted: boolean; is_solo: boolean };
  owner_last_login_at: string | null;
  last_founder_outreach: { type: string; sent_at: string } | null;
  outreach_ignored: boolean;
  lifecycle: 'revive' | 'let_go';
}

export interface NotificationInterpretation {
  priority: NotificationPriority;
  headline: string;
  interpretation: string;
  recommended_action: string;
  draft_message: string;
}

export interface RadarNotificationRow {
  id: string;
  group_id: string;
  generated_at: string;
  priority: NotificationPriority;
  headline: string;
  interpretation: string;
  recommended_action: string;
  draft_message: string;
  lifecycle: 'revive' | 'let_go';
  signals: NotificationCandidate;
  status: NotificationStatus;
  attended_at: string | null;
  cooldown_until: string | null;
}
