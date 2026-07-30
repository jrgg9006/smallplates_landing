// Reason: assembles the per-user onboarding "primeros momentos" timeline from
// already-captured state + events. Pure and testable; reused by Newborns later.

export type MilestoneKey =
  | 'account_created' | 'book_created' | 'occasion' | 'delivery_date'
  | 'photo' | 'share_message' | 'captain' | 'shared_link'
  | 'first_guest' | 'first_recipe';

export interface Milestone {
  key: MilestoneKey;
  label: string;
  done: boolean;
  at: string | null;
  source: 'event' | 'state';
  detail?: string;
  deltaFromPrevMs: number | null;
}

export interface OnboardingSummary {
  milestones: Milestone[];
  signupToFirstShareMs: number | null;
  hasShared: boolean;
  multipleBooks: boolean;
}

export interface OnboardingInputs {
  profile: { id: string; created_at: string };
  groups: Array<{
    id: string;
    name: string | null;
    created_at: string;
    created_by: string;
    occasion: string | null;
    gift_date: string | null;
    event_date: string | null;
    couple_image_url: string | null;
    captain_invite_token: string | null;
  }>;
  groupMember: { custom_share_message: string | null } | null;
  invitations: Array<{ group_id: string; created_at: string }>;
  guests: Array<{
    id: string;
    group_id: string | null;
    first_name: string | null;
    last_name: string | null;
    created_at: string;
    is_self: boolean;
  }>;
  firstRecipeAt: string | null;
  events: Array<{ event_name: string; group_id: string | null; created_at: string; props: Record<string, unknown> }>;
}

const SHARE_EVENTS = new Set(['share', 'share_link_copied']);

// Reason: earliest ISO string in a list, or null. Lexicographic == chronological (UTC).
function earliest(times: string[]): string | null {
  if (times.length === 0) return null;
  return times.reduce((min, t) => (t < min ? t : min));
}

function ms(a: string, b: string): number {
  return Date.parse(a) - Date.parse(b);
}

export function buildOnboardingTimeline(input: OnboardingInputs): OnboardingSummary {
  const ownGroups = input.groups
    .filter((g) => g.created_by === input.profile.id)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
  const group = ownGroups[0] ?? null;
  const multipleBooks = ownGroups.length > 1;

  const groupEvents = group
    ? input.events.filter((e) => e.group_id === group.id)
    : [];
  const eventAt = (name: string): string | null =>
    earliest(groupEvents.filter((e) => e.event_name === name).map((e) => e.created_at));

  // shared link: any share-family event on this group
  const shareTimes = groupEvents
    .filter((e) => SHARE_EVENTS.has(e.event_name))
    .map((e) => e.created_at);
  const sharedAt = earliest(shareTimes);
  const shareEvt = groupEvents
    .filter((e) => SHARE_EVENTS.has(e.event_name))
    .sort((a, b) => a.created_at.localeCompare(b.created_at))[0];
  const shareChannel =
    typeof shareEvt?.props.channel === 'string'
      ? (shareEvt.props.channel as string)
      : typeof shareEvt?.props.method === 'string'
        ? (shareEvt.props.method as string)
        : shareEvt
          ? 'link'
          : undefined;

  // first non-self guest for this group
  const firstGuest = group
    ? input.guests
        .filter((g) => !g.is_self && g.group_id === group.id)
        .sort((a, b) => a.created_at.localeCompare(b.created_at))[0]
    : undefined;
  const guestName = firstGuest
    ? [firstGuest.first_name, firstGuest.last_name].filter(Boolean).join(' ') || 'Guest'
    : undefined;

  // captain: email invites for this group OR a captain link token generated
  const groupInvites = group
    ? input.invitations.filter((i) => i.group_id === group.id)
    : [];
  const captainAt = earliest(groupInvites.map((i) => i.created_at));
  const captainDone = groupInvites.length > 0 || !!group?.captain_invite_token;

  const deliveryDate = group?.gift_date ?? group?.event_date ?? null;

  // Reason: state answers "did it happen"; event answers "when". done via state
  // with no event => at:null, source:'state' ("✓ sin hora").
  const raw: Array<Omit<Milestone, 'deltaFromPrevMs'>> = [
    {
      key: 'account_created', label: 'Cuenta creada', done: true,
      at: input.profile.created_at, source: 'state',
    },
    {
      key: 'book_created', label: 'Libro creado', done: !!group,
      at: group ? (eventAt('book_created') ?? group.created_at) : null,
      source: eventAt('book_created') ? 'event' : 'state',
      detail: group?.name ?? undefined,
    },
    {
      key: 'occasion', label: 'Ocasión elegida', done: !!group?.occasion,
      at: null, source: 'state', detail: group?.occasion ?? undefined,
    },
    {
      key: 'delivery_date', label: 'Fecha de entrega', done: !!deliveryDate,
      at: null, source: 'state', detail: deliveryDate ?? undefined,
    },
    {
      key: 'photo', label: 'Foto subida', done: !!group?.couple_image_url,
      at: eventAt('couple_image_uploaded'),
      source: eventAt('couple_image_uploaded') ? 'event' : 'state',
    },
    {
      key: 'share_message', label: 'Mensaje del link editado',
      done: !!input.groupMember?.custom_share_message,
      at: eventAt('share_message_edited'),
      source: eventAt('share_message_edited') ? 'event' : 'state',
    },
    {
      key: 'captain', label: 'Capitán invitado', done: captainDone,
      at: captainAt, source: captainAt ? 'event' : 'state',
    },
    {
      key: 'shared_link', label: 'Link compartido', done: !!sharedAt,
      at: sharedAt, source: 'event', detail: shareChannel,
    },
    {
      key: 'first_guest', label: 'Primer guest', done: !!firstGuest,
      at: firstGuest?.created_at ?? null, source: 'event', detail: guestName,
    },
    {
      key: 'first_recipe', label: 'Primera receta recibida', done: !!input.firstRecipeAt,
      at: input.firstRecipeAt, source: 'event',
    },
  ];

  // deltaFromPrevMs: vs previous DONE milestone that had an `at`.
  // Reason: skip metadata milestones (share_message, delivery_date, occasion) in delta chain.
  const skipInDeltaChain = new Set(['share_message', 'delivery_date', 'occasion']);
  let lastAt: string | null = null;
  const milestones: Milestone[] = raw.map((m) => {
    let delta: number | null = null;
    if (m.at && !skipInDeltaChain.has(m.key)) {
      delta = lastAt ? ms(m.at, lastAt) : null;
      lastAt = m.at;
    }
    return { ...m, deltaFromPrevMs: delta };
  });

  const hasShared = !!sharedAt;
  const signupToFirstShareMs = sharedAt ? ms(sharedAt, input.profile.created_at) : null;

  return { milestones, signupToFirstShareMs, hasShared, multipleBooks };
}
