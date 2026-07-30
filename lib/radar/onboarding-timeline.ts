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
  }>;
  groupMember: { custom_share_message: string | null } | null;
  // Reason: co-organizer / captain email invites live in group_invitations.
  invitations: Array<{ group_id: string; created_at: string; name: string | null; email: string | null; status: string | null }>;
  // Reason: a captain who actually joined = a non-owner group_members row.
  captainMembers: Array<{ group_id: string; joined_at: string | null; name: string | null }>;
  guests: Array<{
    id: string;
    group_id: string | null;
    first_name: string | null;
    last_name: string | null;
    created_at: string;
    is_self: boolean;
    source: string | null;
  }>;
  firstRecipeAt: string | null;
  events: Array<{ event_name: string; group_id: string | null; created_at: string; props: Record<string, unknown> }>;
}

const SHARE_EVENTS = new Set(['share', 'share_link_copied']);
// Reason: account + book are one moment in free-tier onboarding; collapse them
// into a single line when they land within this window.
const MERGE_WINDOW_MS = 2 * 60 * 1000;

// Reason: earliest ISO string in a list, or null. Lexicographic == chronological (UTC).
function earliest(times: string[]): string | null {
  if (times.length === 0) return null;
  return times.reduce((min, t) => (t < min ? t : min));
}

function ms(a: string, b: string): number {
  return Date.parse(a) - Date.parse(b);
}

// Reason: turn the raw share channel/method into human copy for the timeline.
function channelLabel(ch: string | undefined): string | undefined {
  switch (ch) {
    case 'copy_link':
    case 'copy':
      return 'copió el link';
    case 'whatsapp':
      return 'WhatsApp';
    case 'qr':
    case 'qr_download':
      return 'QR';
    case 'email':
      return 'email';
    case 'sms':
      return 'SMS';
    default:
      return undefined;
  }
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

  // non-self guests for this group
  const groupGuests = group
    ? input.guests.filter((g) => !g.is_self && g.group_id === group.id)
    : [];
  const sortedGuests = [...groupGuests].sort((a, b) => a.created_at.localeCompare(b.created_at));
  const firstGuest = sortedGuests[0];
  const guestName = firstGuest
    ? [firstGuest.first_name, firstGuest.last_name].filter(Boolean).join(' ') || 'Guest'
    : undefined;

  // shared link: a real share event gives the exact moment; otherwise the funnel's
  // proxy — a guest who arrived via the collection link proves the link WAS shared,
  // but NOT when. Never show the guest's arrival time as if it were the share time.
  const shareEvt = groupEvents
    .filter((e) => SHARE_EVENTS.has(e.event_name))
    .sort((a, b) => a.created_at.localeCompare(b.created_at))[0];
  const shareEventAt = shareEvt?.created_at ?? null;
  const shareChannel =
    typeof shareEvt?.props.channel === 'string'
      ? shareEvt.props.channel
      : typeof shareEvt?.props.method === 'string'
        ? shareEvt.props.method
        : undefined;
  const hasCollectionGuest = sortedGuests.some((g) => g.source === 'collection');
  const hasShared = !!shareEventAt || hasCollectionGuest;

  let sharedLink: Omit<Milestone, 'deltaFromPrevMs'>;
  if (shareEventAt) {
    sharedLink = {
      key: 'shared_link', label: 'Link compartido', done: true,
      at: shareEventAt, source: 'event', detail: channelLabel(shareChannel),
    };
  } else if (hasCollectionGuest) {
    // Reason: at:null — we know it was shared, not when. Shown as "✓ (sin hora)".
    sharedLink = {
      key: 'shared_link', label: 'Link compartido', done: true,
      at: null, source: 'state', detail: 'alguien llegó por el link',
    };
  } else {
    sharedLink = { key: 'shared_link', label: 'Link compartido', done: false, at: null, source: 'state' };
  }

  // captain: a captain who actually joined (non-owner member) OR an email invite sent.
  const groupCaptains = group ? input.captainMembers.filter((c) => c.group_id === group.id) : [];
  const groupInvites = group ? input.invitations.filter((i) => i.group_id === group.id) : [];
  const captainJoinedAt = earliest(
    groupCaptains.map((c) => c.joined_at).filter((v): v is string => !!v)
  );
  const captainInvitedAt = earliest(groupInvites.map((i) => i.created_at));
  let captain: Omit<Milestone, 'deltaFromPrevMs'>;
  if (groupCaptains.length > 0) {
    captain = {
      key: 'captain', label: 'Capitán a bordo', done: true,
      at: captainJoinedAt, source: 'state',
      detail: groupCaptains[0].name ?? undefined,
    };
  } else if (groupInvites.length > 0) {
    const inv = [...groupInvites].sort((a, b) => a.created_at.localeCompare(b.created_at))[0];
    // Reason: an invite that isn't in captainMembers hasn't been accepted — surface
    // its status so "invited" is never mistaken for "on board".
    const statusEs =
      inv.status === 'accepted' ? 'aceptó'
        : inv.status === 'declined' ? 'rechazó'
          : inv.status === 'expired' ? 'expiró'
            : 'pendiente';
    const who = inv.name ?? inv.email ?? '';
    captain = {
      key: 'captain', label: 'Capitán invitado', done: true,
      at: captainInvitedAt, source: 'event',
      detail: who ? `${who} (${statusEs})` : `(${statusEs})`,
    };
  } else {
    captain = { key: 'captain', label: 'Capitán invitado', done: false, at: null, source: 'state' };
  }

  const deliveryDate = group?.gift_date ?? group?.event_date ?? null;

  const accountAt = input.profile.created_at;
  const bookAt = group ? (eventAt('book_created') ?? group.created_at) : null;
  // Reason: in free-tier, signup and book creation are the same moment — merge.
  const mergeAccountAndBook = !!(bookAt && Math.abs(ms(bookAt, accountAt)) < MERGE_WINDOW_MS);

  // Reason: state answers "did it happen"; event answers "when". done via state
  // with no event => at:null, source:'state' ("✓ sin hora").
  const raw: Array<Omit<Milestone, 'deltaFromPrevMs'>> = [];

  if (mergeAccountAndBook) {
    raw.push({
      key: 'account_created', label: 'Cuenta y libro', done: true,
      at: accountAt, source: 'state', detail: group?.name ?? undefined,
    });
  } else {
    raw.push({
      key: 'account_created', label: 'Cuenta creada', done: true,
      at: accountAt, source: 'state',
    });
    raw.push({
      key: 'book_created', label: 'Libro creado', done: !!group,
      at: bookAt,
      source: eventAt('book_created') ? 'event' : 'state',
      detail: group?.name ?? undefined,
    });
  }

  raw.push(
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
    captain,
    sharedLink,
    {
      key: 'first_guest', label: 'Primer guest', done: !!firstGuest,
      at: firstGuest?.created_at ?? null, source: 'event', detail: guestName,
    },
    {
      key: 'first_recipe', label: 'Primera receta recibida', done: !!input.firstRecipeAt,
      at: input.firstRecipeAt, source: 'event',
    }
  );

  // Reason: deltaFromPrevMs = time since the previous milestone that had an `at`.
  let lastAt: string | null = null;
  const milestones: Milestone[] = raw.map((m) => {
    let delta: number | null = null;
    if (m.at) {
      delta = lastAt ? ms(m.at, lastAt) : null;
      lastAt = m.at;
    }
    return { ...m, deltaFromPrevMs: delta };
  });

  // Reason: only a real share event yields a trustworthy "time to first share".
  const signupToFirstShareMs = shareEventAt ? ms(shareEventAt, accountAt) : null;

  return { milestones, signupToFirstShareMs, hasShared, multipleBooks };
}
