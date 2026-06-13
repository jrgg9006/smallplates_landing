// Raw rows fetched by lib/radar/queries.ts (minimal columns only).

export interface ProfileRow {
  id: string;
  email: string | null;
  full_name: string | null;
  created_at: string;
}

export interface GroupRow {
  id: string;
  name: string | null;
  created_by: string;
  created_at: string;
  status: string | null;
  book_status: string | null;
  couple_image_url: string | null;
}

export interface GuestRow {
  id: string;
  group_id: string;
  first_name: string | null;
  last_name: string | null;
  created_at: string;
  source: string | null;
  is_self: boolean | null;
}

export interface RecipeRow {
  id: string;
  group_id: string | null;
  guest_id: string | null;
  recipe_name: string | null;
  created_at: string;
  deleted_at: string | null;
  image_url: string | null;
  source: string | null;
}

export interface CommRow {
  id: string;
  group_id: string | null;
  type: string;
  channel: string | null;
  status: string | null;
  sent_at: string | null;
  created_at: string;
}

export interface EditRow {
  id: string;
  recipe_id: string;
  edited_by: string | null;
  created_at: string;
}

export interface OrderRow {
  id: string;
  group_id: string | null;
  user_id: string | null;
  amount_total: number | null;
  status: string;
  created_at: string;
}

export interface UserEventRow {
  id: number;
  user_id: string | null;
  group_id: string | null;
  event_name: string;
  props: Record<string, unknown>;
  created_at: string;
}

export interface RadarSources {
  profiles: ProfileRow[];
  groups: GroupRow[];
  guests: GuestRow[];
  recipes: RecipeRow[];
  comms: CommRow[];
  edits: EditRow[];
  orders: OrderRow[];
  events: UserEventRow[];
}

// Aggregated payload served by GET /api/v1/admin/radar.

export type RangeKey = 'today' | 'd7' | 'd30';

export interface RangeNumbers {
  current: number;
  previous: number;
}

export interface PulseMetric {
  key: string;
  label: string;
  definition: string; // shown in the (i) tooltip — exact, unambiguous
  today: RangeNumbers;
  d7: RangeNumbers;
  d30: RangeNumbers;
  spark: number[]; // last 14 daily counts, oldest first
}

export type FeedKind =
  | 'signup'
  | 'book_created'
  | 'recipe_created'
  | 'recipe_edited'
  | 'recipe_deleted'
  | 'guest_added'
  | 'email_sent'
  | 'order'
  | 'share'
  | 'couple_image';

export interface FeedItem {
  id: string;
  at: string; // ISO timestamp
  kind: FeedKind;
  text: string;
  recipeId?: string; // set on recipe items — makes the row clickable to view the recipe
}

export interface FunnelStep {
  key: string;
  label: string;
  definition: string;
  count: number;
}

// One row in the drill-down panel that opens when a pulse card is clicked.
export interface DetailItem {
  id: string;
  at: string; // ISO timestamp
  text: string;
  recipeId?: string; // set on recipe items — makes the row clickable to view the recipe
}

export interface GroupHealthRow {
  groupId: string;
  name: string;
  ownerUserId: string | null;
  ownerName: string | null;
  stage: string;
  recipes: number;
  recipesWithPhoto: number;
  guests: number;
  lastEmailAt: string | null;
  lastActivityAt: string | null;
  daysInactive: number;
  health: 'green' | 'yellow' | 'red';
  closed: boolean; // book past 'active' (reviewed/ready_to_print/printed) — already in production
}

export interface RadarPayload {
  generatedAt: string;
  pulse: PulseMetric[];
  feed: FeedItem[];
  funnel: FunnelStep[];
  groups: GroupHealthRow[];
  // Full item lists per pulse metric key (users/purchases/recipes/guests/emails/photos),
  // newest first. Powers the drill-down panel — uncapped, unlike the feed.
  details: Record<string, DetailItem[]>;
  degraded: string[]; // source keys that failed to load
}
