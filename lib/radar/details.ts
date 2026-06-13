import type { RadarSources, DetailItem } from './types';
import { SENT_STATUSES, PAID_STATUSES } from './aggregate';

// Full, uncapped item lists behind each pulse card — shown in the drill-down
// panel when a card is clicked. Keys mirror buildPulseMetrics().
export function buildDetails(d: RadarSources): Record<string, DetailItem[]> {
  const groupName = new Map(d.groups.map((g) => [g.id, g.name ?? 'Libro sin nombre']));
  const guestName = new Map(
    d.guests.map((gu) => [
      gu.id,
      [gu.first_name, gu.last_name].filter(Boolean).join(' ') || 'Invitado',
    ])
  );
  const inGroup = (id: string | null) =>
    id && groupName.has(id) ? ` — ${groupName.get(id)}` : '';
  const recipeWho = (guestId: string | null) =>
    guestId ? guestName.get(guestId) ?? 'Alguien' : 'El organizador';
  const recipeVia = (source: string | null) =>
    source === 'collection' ? ' (vía link)' : source === 'imported' ? ' (import)' : '';

  const users: DetailItem[] = d.profiles.map((p) => ({
    id: `u-${p.id}`,
    at: p.created_at,
    text: p.full_name || p.email || '—',
  }));

  const purchases: DetailItem[] = d.orders
    .filter((o) => PAID_STATUSES.has(o.status))
    .map((o) => ({
      id: `o-${o.id}`,
      at: o.created_at,
      text: `Compra $${((o.amount_total ?? 0) / 100).toFixed(0)} USD${inGroup(o.group_id)}`,
    }));

  const recipes: DetailItem[] = d.recipes.map((r) => ({
    id: `r-${r.id}`,
    at: r.created_at,
    text: `${recipeWho(r.guest_id)} subió "${r.recipe_name ?? 'receta'}"${
      r.image_url ? ' con foto' : ''
    }${recipeVia(r.source)}${inGroup(r.group_id)}${r.deleted_at ? ' (eliminada)' : ''}`,
    recipeId: r.id,
  }));

  const guests: DetailItem[] = d.guests
    .filter((gu) => !gu.is_self)
    .map((gu) => ({
      id: `g-${gu.id}`,
      at: gu.created_at,
      text: `${guestName.get(gu.id)}${
        gu.source === 'imported' ? ' (import)' : gu.source === 'collection' ? ' (vía link)' : ''
      }${inGroup(gu.group_id)}`,
    }));

  const emails: DetailItem[] = d.comms
    .filter((c) => SENT_STATUSES.has(c.status ?? ''))
    .map((c) => ({
      id: `c-${c.id}`,
      at: c.sent_at ?? c.created_at,
      text: `Correo ${c.type}${inGroup(c.group_id)}`,
    }));

  const photos: DetailItem[] = d.recipes
    .filter((r) => r.image_url)
    .map((r) => ({
      id: `p-${r.id}`,
      at: r.created_at,
      text: `${recipeWho(r.guest_id)} subió "${r.recipe_name ?? 'receta'}" con foto${inGroup(
        r.group_id
      )}`,
      recipeId: r.id,
    }));

  const out: Record<string, DetailItem[]> = { users, purchases, recipes, guests, emails, photos };
  // Reason: ISO UTC strings sort lexicographically == chronologically.
  for (const key of Object.keys(out)) out[key].sort((a, b) => b.at.localeCompare(a.at));
  return out;
}
