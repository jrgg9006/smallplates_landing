import type {
  RadarSources,
  RecipeRow,
  PulseMetric,
  FeedItem,
  FunnelStep,
  GroupHealthRow,
  RangeNumbers,
} from './types';
import { isAdminEmail } from '@/lib/config/admin';

// Reason: day boundaries in the founder's timezone — Vercel runs UTC and a
// 7pm CDMX signup must count as "today", not "tomorrow".
// Mexico City abolished DST in 2022, so fixed UTC-6 makes day-stepping by 86,400,000ms safe.
const TZ = 'America/Mexico_City';
const DAY_MS = 86_400_000;

export function dayKey(d: string | Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(typeof d === 'string' ? new Date(d) : d);
}

/** Per-day counts for the last `days` days ending today, oldest first. */
export function dailySeries(timestamps: string[], days: number, now: Date): number[] {
  const keys: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    keys.push(dayKey(new Date(now.getTime() - i * DAY_MS)));
  }
  const counts = new Map<string, number>(keys.map((k) => [k, 0]));
  for (const ts of timestamps) {
    const k = dayKey(ts);
    const prev = counts.get(k);
    if (prev !== undefined) counts.set(k, prev + 1);
  }
  return keys.map((k) => counts.get(k) ?? 0);
}

interface PulseComputed {
  today: RangeNumbers;
  d7: RangeNumbers;
  d30: RangeNumbers;
  spark: number[];
}

export function computePulse(timestamps: string[], now: Date): PulseComputed {
  const s = dailySeries(timestamps, 60, now);
  const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);
  const tail = (n: number) => s.slice(s.length - n);
  const prevWindow = (n: number) => s.slice(s.length - 2 * n, s.length - n);
  return {
    today: { current: s[s.length - 1], previous: s[s.length - 2] },
    d7: { current: sum(tail(7)), previous: sum(prevWindow(7)) },
    d30: { current: sum(tail(30)), previous: sum(prevWindow(30)) },
    spark: tail(14),
  };
}

// People maps + "who acted" label, shared by feed and drill-down so attribution
// (el dueño vs ⚓ Capitán X) is computed identically everywhere.
export interface PeopleMaps {
  profName: Map<string, string>;
  groupOwner: Map<string, string>;
  captainIds: Set<string>;
  selfGuestIds: Set<string>; // guests with is_self — the owner's own entry in the guest list
}
/**
 * Removes everything owned or acted on by the Small Plates team (admin accounts)
 * so the whole Radar — pulse, funnel, group health, feed, drill-downs — shows
 * only real client activity. Internal recipe-cleaning edits, comped/test books,
 * and admin-created rows drop out. Applied once at the route boundary.
 */
export function stripAdmin(d: RadarSources): RadarSources {
  const adminIds = new Set(d.profiles.filter((p) => isAdminEmail(p.email)).map((p) => p.id));
  if (adminIds.size === 0) return d;
  const isAdmin = (id: string | null | undefined) => !!id && adminIds.has(id);
  return {
    profiles: d.profiles.filter((p) => !isAdmin(p.id)),
    groups: d.groups.filter((g) => !isAdmin(g.created_by)),
    guests: d.guests.filter((gu) => !isAdmin(gu.user_id)),
    recipes: d.recipes.filter((r) => !isAdmin(r.user_id)),
    comms: d.comms, // no clear actor — left as-is
    edits: d.edits.filter((e) => !isAdmin(e.edited_by)),
    orders: d.orders.filter((o) => !isAdmin(o.user_id)),
    events: d.events.filter((e) => !isAdmin(e.user_id)),
    members: d.members.filter((m) => !isAdmin(m.profile_id)),
  };
}

export function buildPeopleMaps(d: RadarSources): PeopleMaps {
  return {
    profName: new Map(d.profiles.map((p) => [p.id, p.full_name || p.email || 'Usuario'])),
    groupOwner: new Map(d.groups.map((g) => [g.id, g.created_by])),
    captainIds: new Set(d.members.map((m) => m.profile_id)),
    selfGuestIds: new Set(d.guests.filter((g) => g.is_self).map((g) => g.id)),
  };
}
// Reason: role + real name, lowercase so it reads mid-sentence ("por el dueño Ana");
// callers capitalize at sentence start. Masculine role words ("el dueño/el capitán")
// are the unmarked form — we don't store gender, so this avoids "la capitana JP".
export function whoActed(userId: string | undefined, groupId: string | null, m: PeopleMaps): string {
  const owner = groupId ? m.groupOwner.get(groupId) : null;
  const id = userId ?? owner ?? undefined;
  if (!id) return 'el organizador';
  const name = m.profName.get(id) ?? '—';
  if (m.captainIds.has(id)) return `el capitán ${name}`;
  if (owner && id === owner) return `el dueño ${name}`;
  return name; // known person, role unclear — just the name
}
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/**
 * How a recipe appears in the feed / drill-down. Distinguishes the guest
 * self-submitting via the link ("Linda subió X (vía link)") from someone
 * entering it on the guest's behalf ("El dueño agregó X a nombre de Linda"),
 * which is what `source='manual'` means.
 */
export function recipeActionText(
  r: RecipeRow,
  guestName: Map<string, string>,
  people: PeopleMaps,
  inGroup: (id: string | null) => string
): string {
  const name = r.recipe_name ?? 'receta';
  const img = r.upload_method === 'image' ? ' 📷' : '';
  // Reason: a self-guest recipe is the owner's/captain's OWN — don't say "a nombre de
  // {self}" (e.g. "Karla agregó X a nombre de Karla"). Treat it as no guest.
  const isSelf = r.guest_id ? people.selfGuestIds.has(r.guest_id) : false;
  const guest = r.guest_id && !isSelf ? guestName.get(r.guest_id) ?? 'Alguien' : null;
  const who = capitalize(whoActed(r.user_id, r.group_id, people));
  if (r.source === 'collection') {
    return `${guest ?? who} subió "${name}"${img} (vía link)${inGroup(r.group_id)}`;
  }
  const verb = r.source === 'imported' ? 'importó' : 'agregó';
  return guest
    ? `${who} ${verb} "${name}" a nombre de ${guest}${img}${inGroup(r.group_id)}`
    : `${who} ${verb} "${name}"${img}${inGroup(r.group_id)}`;
}

export const SENT_STATUSES = new Set(['sent', 'delivered', 'opened']);

// Reason: whitelist — 'error' (failed checkout) and 'refunded' must never
// count as revenue anywhere in the dashboard.
export const PAID_STATUSES = new Set(['paid', 'processing', 'in_production', 'shipped', 'delivered']);

// Reason: a book past 'active' is closed — already paid and moving through
// production, so it drops off the founder's daily call list.
export const CLOSED_BOOK_STATUSES = new Set(['reviewed', 'ready_to_print', 'printed']);

export function buildPulseMetrics(d: RadarSources, now: Date): PulseMetric[] {
  const cards: { key: string; label: string; definition: string; timestamps: string[] }[] = [
    {
      key: 'users',
      label: 'Usuarios nuevos',
      definition: 'Cuentas creadas ese día (profiles.created_at).',
      timestamps: d.profiles.map((p) => p.created_at),
    },
    {
      key: 'purchases',
      label: 'Libros comprados',
      definition:
        'Libros comprados ese día — órdenes pagadas (orders, excluye refunded y checkouts con error). Esto sí es revenue, no los libros creados gratis.',
      timestamps: d.orders
        .filter((o) => PAID_STATUSES.has(o.status))
        .map((o) => o.created_at),
    },
    {
      key: 'recipes',
      label: 'Recetas nuevas',
      definition:
        'Recetas creadas ese día, por cualquier vía: link de guests, manual o import (guest_recipes.created_at). Incluye las que luego se borraron.',
      timestamps: d.recipes.map((r) => r.created_at),
    },
    {
      key: 'guests',
      label: 'Guests agregados',
      definition:
        'Guests dados de alta ese día — manual, vía link o import (guests.created_at). Excluye al propio organizador (is_self).',
      timestamps: d.guests.filter((g) => !g.is_self).map((g) => g.created_at),
    },
    {
      key: 'captains',
      label: 'Capitanes',
      definition:
        'Capitanes (co-organizadores) que se unieron ese día — group_members con role=member, por cualquier canal (correo o link). No incluye al organizador dueño.',
      timestamps: d.members.filter((m) => m.role === 'member').map((m) => m.joined_at),
    },
    {
      key: 'photos',
      label: 'Recetas con foto',
      definition:
        'Recetas que el guest subió como foto/imagen/PDF (upload_method = image), no escritas a mano. Estas pasan por OCR y suelen necesitar revisión. (No confundir con la imagen que generamos nosotros post-pago.)',
      timestamps: d.recipes.filter((r) => r.upload_method === 'image').map((r) => r.created_at),
    },
  ];
  return cards.map(({ timestamps, ...rest }) => ({ ...rest, ...computePulse(timestamps, now) }));
}

const SHARE_EVENTS = new Set(['share_link_copied', 'share']);

export function computeFunnel(d: RadarSources, now: Date): FunnelStep[] {
  const since = now.getTime() - 30 * DAY_MS;
  const cohort = new Set(
    d.profiles.filter((p) => new Date(p.created_at).getTime() >= since).map((p) => p.id)
  );

  // group id -> cohort owner id (only groups owned by cohort users count)
  const groupOwner = new Map<string, string>();
  for (const g of d.groups) {
    if (cohort.has(g.created_by)) groupOwner.set(g.id, g.created_by);
  }

  const book = new Set<string>();
  const guest = new Set<string>();
  const shared = new Set<string>();
  const recipe1 = new Set<string>();
  const recipe5 = new Set<string>();
  const photo = new Set<string>();
  const paid = new Set<string>();

  for (const g of d.groups) {
    const owner = groupOwner.get(g.id);
    if (!owner) continue;
    book.add(owner);
    if (g.couple_image_url) photo.add(owner);
  }

  for (const gu of d.guests) {
    const owner = groupOwner.get(gu.group_id);
    if (!owner) continue;
    if (!gu.is_self) guest.add(owner);
    // Reason: proxy — a guest arriving via the collection link proves the link
    // was shared, even before share_link_copied events accumulate.
    if (gu.source === 'collection') shared.add(owner);
  }

  // Reason: count recipes per GROUP (not per owner) so "5+ recipes" means
  // a single book has 5 recipes, not the owner's total across all books.
  const recipesPerGroup = new Map<string, number>();
  for (const r of d.recipes) {
    if (!r.group_id || !groupOwner.has(r.group_id)) continue;
    recipesPerGroup.set(r.group_id, (recipesPerGroup.get(r.group_id) ?? 0) + 1);
  }
  for (const [groupId, n] of recipesPerGroup) {
    const owner = groupOwner.get(groupId)!;
    if (n >= 1) recipe1.add(owner);
    if (n >= 5) recipe5.add(owner);
  }

  for (const e of d.events) {
    if (!SHARE_EVENTS.has(e.event_name)) continue;
    if (e.user_id && cohort.has(e.user_id)) shared.add(e.user_id);
    const owner = e.group_id ? groupOwner.get(e.group_id) : undefined;
    if (owner) shared.add(owner);
  }

  for (const o of d.orders) {
    if (!PAID_STATUSES.has(o.status)) continue;
    const byGroup = o.group_id ? groupOwner.get(o.group_id) : undefined;
    const byUser = o.user_id && cohort.has(o.user_id) ? o.user_id : undefined;
    const owner = byGroup ?? byUser;
    if (owner) paid.add(owner);
  }

  // Reason: gate shared/paid on having a book — funnel must be monotonically
  // ordered; a share event or order with no book attached is noise.
  const sharedFinal = new Set([...shared].filter((id) => book.has(id)));
  const paidFinal = new Set([...paid].filter((id) => book.has(id)));

  return [
    { key: 'signup', label: 'Registro', definition: 'Usuarios registrados en los últimos 30 días.', count: cohort.size },
    { key: 'book', label: 'Libro creado', definition: 'Del cohorte, cuántos crearon al menos un libro.', count: book.size },
    { key: 'guest', label: '≥1 guest', definition: 'Agregaron al menos un guest (sin contarse a sí mismos).', count: guest.size },
    { key: 'shared', label: 'Link compartido', definition: 'Evento share_link_copied, o proxy: algún guest llegó vía el link de colección. Solo cuenta usuarios que ya crearon libro.', count: sharedFinal.size },
    { key: 'recipe1', label: '1ª receta', definition: 'Su libro tiene al menos una receta.', count: recipe1.size },
    { key: 'recipe5', label: '≥5 recetas', definition: 'Su libro tiene 5 o más recetas.', count: recipe5.size },
    { key: 'photo', label: 'Foto del libro', definition: 'Subieron la foto principal del libro (couple_image_url).', count: photo.size },
    { key: 'paid', label: 'Compra', definition: 'Tienen al menos una orden pagada (orders, excluye refunded).', count: paidFinal.size },
  ];
}

const STAGE_ORDER = [
  'Libro creado',
  'Guests agregados',
  'Link compartido',
  '1ª receta',
  '5+ recetas',
  'Foto subida',
  'Compró',
] as const;

export function computeGroupHealth(d: RadarSources, now: Date): GroupHealthRow[] {
  const profileById = new Map(d.profiles.map((p) => [p.id, p]));
  const recipeGroup = new Map(d.recipes.map((r) => [r.id, r.group_id]));

  const rows: GroupHealthRow[] = [];

  for (const g of d.groups) {
    if (g.book_status === 'inactive') continue;

    const recipes = d.recipes.filter((r) => r.group_id === g.id && !r.deleted_at);
    const guests = d.guests.filter((gu) => gu.group_id === g.id && !gu.is_self);
    const comms = d.comms.filter((c) => c.group_id === g.id);
    const edits = d.edits.filter((e) => recipeGroup.get(e.recipe_id) === g.id);
    const events = d.events.filter((e) => e.group_id === g.id);

    const sharedProxy =
      guests.some((gu) => gu.source === 'collection') ||
      events.some((e) => SHARE_EVENTS.has(e.event_name));
    const hasPaid = d.orders.some((o) => o.group_id === g.id && PAID_STATUSES.has(o.status));

    let stageIdx = 0; // 'Libro creado'
    if (guests.length > 0) stageIdx = 1;
    if (sharedProxy) stageIdx = 2;
    if (recipes.length >= 1) stageIdx = 3;
    if (recipes.length >= 5) stageIdx = 4;
    if (g.couple_image_url && stageIdx >= 4) stageIdx = 5;
    if (hasPaid) stageIdx = 6;

    const timestamps: number[] = [
      new Date(g.created_at).getTime(),
      ...recipes.map((r) => new Date(r.created_at).getTime()),
      ...guests.map((gu) => new Date(gu.created_at).getTime()),
      ...comms.map((c) => new Date(c.sent_at ?? c.created_at).getTime()),
      ...edits.map((e) => new Date(e.created_at).getTime()),
      ...events.map((e) => new Date(e.created_at).getTime()),
      ...d.recipes.filter((r) => r.group_id === g.id && r.deleted_at).map((r) => new Date(r.deleted_at as string).getTime()),
    ];
    const last = Math.max(...timestamps);
    const daysInactive = Math.max(0, Math.floor((now.getTime() - last) / DAY_MS));

    const sentComms = comms
      .filter((c) => SENT_STATUSES.has(c.status ?? ''))
      .map((c) => c.sent_at ?? c.created_at)
      .sort();

    const owner = profileById.get(g.created_by);

    rows.push({
      groupId: g.id,
      name: g.name ?? 'Libro sin nombre',
      ownerUserId: owner?.id ?? null,
      ownerName: owner?.full_name || owner?.email || null,
      stage: STAGE_ORDER[stageIdx],
      recipes: recipes.length,
      recipesWithPhoto: recipes.filter((r) => r.image_url).length,
      guests: guests.length,
      lastEmailAt: sentComms[sentComms.length - 1] ?? null,
      lastActivityAt: new Date(last).toISOString(),
      daysInactive,
      health: daysInactive < 3 ? 'green' : daysInactive <= 7 ? 'yellow' : 'red',
      closed: CLOSED_BOOK_STATUSES.has(g.book_status ?? ''),
    });
  }

  // Reason: riskiest first — red groups are the founder's daily call list.
  const rank = { red: 0, yellow: 1, green: 2 } as const;
  rows.sort((a, b) => rank[a.health] - rank[b.health] || b.daysInactive - a.daysInactive);
  return rows;
}

export function buildFeed(d: RadarSources, limit = 100): FeedItem[] {
  const groupName = new Map(d.groups.map((g) => [g.id, g.name ?? 'Libro sin nombre']));
  const guestName = new Map(
    d.guests.map((gu) => [
      gu.id,
      [gu.first_name, gu.last_name].filter(Boolean).join(' ') || 'Guest',
    ])
  );
  const profName = new Map(
    d.profiles.map((p) => [p.id, p.full_name || p.email || 'Usuario'])
  );
  // Reason: resolve a comm to the address it was actually sent to, so the feed can
  // disambiguate two emails to the same group (e.g. organizer vs captain).
  const profEmail = new Map(d.profiles.map((p) => [p.id, p.email]));
  const guestEmail = new Map(d.guests.map((gu) => [gu.id, gu.email]));
  const commRecipient = (c: { recipient_profile_id: string | null; guest_id: string | null }) => {
    const email = (c.recipient_profile_id && profEmail.get(c.recipient_profile_id)) ||
      (c.guest_id && guestEmail.get(c.guest_id));
    return email ? ` → ${email}` : '';
  };
  const recipeInfo = new Map(d.recipes.map((r) => [r.id, r]));
  const people = buildPeopleMaps(d);
  const inGroup = (id: string | null) => (id && groupName.has(id) ? ` — ${groupName.get(id)}` : '');

  const items: FeedItem[] = [];

  for (const p of d.profiles) {
    items.push({
      id: `signup-${p.id}`,
      at: p.created_at,
      kind: 'signup',
      text: `Nuevo registro: ${p.full_name || p.email || '—'}`,
    });
  }

  for (const g of d.groups) {
    items.push({
      id: `book-${g.id}`,
      at: g.created_at,
      kind: 'book_created',
      text: `Libro creado: ${g.name ?? 'sin nombre'} (${profName.get(g.created_by) ?? '—'})`,
    });
  }

  for (const r of d.recipes) {
    items.push({
      id: `recipe-${r.id}`,
      at: r.created_at,
      kind: 'recipe_created',
      text: recipeActionText(r, guestName, people, inGroup),
      recipeId: r.id,
    });
    if (r.deleted_at) {
      items.push({
        id: `recipe-del-${r.id}`,
        at: r.deleted_at,
        kind: 'recipe_deleted',
        text: `Receta eliminada: "${r.recipe_name ?? 'receta'}"${inGroup(r.group_id)}`,
        recipeId: r.id,
      });
    }
  }

  for (const gu of d.guests) {
    if (gu.is_self) continue;
    const via = gu.source === 'imported' ? ' (import)' : gu.source === 'collection' ? ' (vía link)' : '';
    items.push({
      id: `guest-${gu.id}`,
      at: gu.created_at,
      kind: 'guest_added',
      text: `Guest agregado: ${guestName.get(gu.id)}${via}${inGroup(gu.group_id)}`,
    });
  }

  for (const c of d.comms) {
    if (!SENT_STATUSES.has(c.status ?? '') && c.status !== 'failed') continue;
    items.push({
      id: `comm-${c.id}`,
      at: c.sent_at ?? c.created_at,
      kind: 'email_sent',
      text: `Correo ${c.type}${c.status === 'failed' ? ' FALLÓ' : ' enviado'}${inGroup(c.group_id)}${commRecipient(c)}`,
    });
  }

  // Reason: collapse repeat edits of the same recipe by the same person within a
  // window into one line with a count. The edit pipeline writes ~2 history rows per
  // save, and even legit re-edits in one review session shouldn't spam the feed.
  const EDIT_WINDOW_MS = 30 * 60 * 1000;
  const sortedEdits = [...d.edits].sort((a, b) => b.created_at.localeCompare(a.created_at));
  type EditGroup = { id: string; latestAt: string; editor: string | null; recipeId: string; count: number };
  const openByKey = new Map<string, EditGroup>();
  const editGroups: EditGroup[] = [];
  for (const e of sortedEdits) {
    const key = `${e.recipe_id}|${e.edited_by ?? ''}`;
    const open = openByKey.get(key);
    // Reason: compare to the group's newest edit so each group spans at most the window.
    if (open && new Date(open.latestAt).getTime() - new Date(e.created_at).getTime() <= EDIT_WINDOW_MS) {
      open.count += 1;
    } else {
      const g: EditGroup = { id: e.id, latestAt: e.created_at, editor: e.edited_by, recipeId: e.recipe_id, count: 1 };
      editGroups.push(g);
      openByKey.set(key, g);
    }
  }
  for (const g of editGroups) {
    const r = recipeInfo.get(g.recipeId);
    const who = g.editor ? profName.get(g.editor) ?? 'alguien' : 'alguien';
    items.push({
      id: `edit-${g.id}`,
      at: g.latestAt,
      kind: 'recipe_edited',
      text: `${who} editó "${r?.recipe_name ?? 'una receta'}"${g.count > 1 ? ` (×${g.count})` : ''}${inGroup(r?.group_id ?? null)}`,
      recipeId: g.recipeId,
      editId: g.id,
    });
  }

  for (const o of d.orders) {
    if (!PAID_STATUSES.has(o.status)) continue;
    items.push({
      id: `order-${o.id}`,
      at: o.created_at,
      kind: 'order',
      text: `Compra de $${((o.amount_total ?? 0) / 100).toFixed(0)} USD${inGroup(o.group_id)}`,
    });
  }

  for (const e of d.events) {
    if (SHARE_EVENTS.has(e.event_name)) {
      // Reason: share_link_copied sends `channel`; the older onboarding `share`
      // event sends `method` (copy_link / whatsapp / qr_download).
      const channel =
        typeof e.props.channel === 'string'
          ? e.props.channel
          : typeof e.props.method === 'string'
            ? e.props.method
            : 'link';
      items.push({
        id: `ev-${e.id}`,
        at: e.created_at,
        kind: 'share',
        text: `${e.user_id ? profName.get(e.user_id) ?? 'Alguien' : 'Alguien'} compartió el link (${channel})${inGroup(e.group_id)}`,
      });
    } else if (e.event_name === 'couple_image_uploaded') {
      items.push({
        id: `ev-${e.id}`,
        at: e.created_at,
        kind: 'couple_image',
        text: `Subió la foto principal del libro${inGroup(e.group_id)}`,
      });
    }
  }

  // Reason: all timestamps come from Supabase as UTC ISO strings, so
  // lexicographic order == chronological order.
  items.sort((a, b) => b.at.localeCompare(a.at));
  return items.slice(0, limit);
}
