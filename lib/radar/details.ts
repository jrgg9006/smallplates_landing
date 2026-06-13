import type { RadarSources, DetailItem } from './types';
import { PAID_STATUSES, buildPeopleMaps, whoActed, recipeActionText } from './aggregate';

// Full, uncapped item lists behind each pulse card — shown in the drill-down
// panel when a card is clicked. Keys mirror buildPulseMetrics().
export function buildDetails(d: RadarSources): Record<string, DetailItem[]> {
  const people = buildPeopleMaps(d);
  const { profName, groupOwner } = people;
  const groupName = new Map(d.groups.map((g) => [g.id, g.name ?? 'Libro sin nombre']));
  const guestName = new Map(
    d.guests.map((gu) => [
      gu.id,
      [gu.first_name, gu.last_name].filter(Boolean).join(' ') || 'Guest',
    ])
  );
  const inGroup = (id: string | null) =>
    id && groupName.has(id) ? ` — ${groupName.get(id)}` : '';

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
    text: recipeActionText(r, guestName, people, inGroup) + (r.deleted_at ? ' (eliminada)' : ''),
    recipeId: r.id,
  }));

  // Reason: each guest's recipes (excludes soft-deleted) — drives the "· N recetas"
  // chip and the inline expand that lists them, each opening the recipe modal.
  const recipesByGuest = new Map<string, { id: string; name: string }[]>();
  for (const r of d.recipes) {
    if (r.deleted_at || !r.guest_id) continue;
    const list = recipesByGuest.get(r.guest_id) ?? [];
    list.push({ id: r.id, name: r.recipe_name ?? 'receta' });
    recipesByGuest.set(r.guest_id, list);
  }

  // Reason: explicit channel + who for every guest, so anyone reading the report
  // understands without context (manual/link/import · el dueño / ⚓ Capitán X).
  const guests: DetailItem[] = d.guests
    .filter((gu) => !gu.is_self)
    .map((gu) => {
      const channel =
        gu.source === 'collection' ? 'vía link' : gu.source === 'imported' ? 'import' : 'manual';
      return {
        id: `g-${gu.id}`,
        at: gu.created_at,
        text: `${guestName.get(gu.id)}${inGroup(gu.group_id)} · ${channel}, por ${whoActed(
          gu.user_id,
          gu.group_id,
          people
        )}`,
        recipes: recipesByGuest.get(gu.id) ?? [],
      };
    });

  const captains: DetailItem[] = d.members
    .filter((m) => m.role === 'member')
    .map((m) => {
      // Reason: link-flow captains have no invited_by — fall back to the group owner,
      // who shared the captain link, so "quién lo invitó" is almost always answered.
      const inviter = m.invited_by ?? groupOwner.get(m.group_id) ?? null;
      const inviterName = inviter ? profName.get(inviter) : null;
      return {
        id: `cap-${m.group_id}-${m.profile_id}`,
        at: m.joined_at,
        text: `${profName.get(m.profile_id) ?? 'Capitán'} se unió como capitán${inGroup(
          m.group_id
        )}${inviterName ? ` · invitado por ${inviterName}` : ''}`,
      };
    });

  const photos: DetailItem[] = d.recipes
    .filter((r) => r.upload_method === 'image')
    .map((r) => ({
      id: `p-${r.id}`,
      at: r.created_at,
      text: recipeActionText(r, guestName, people, inGroup),
      recipeId: r.id,
    }));

  const out: Record<string, DetailItem[]> = { users, purchases, recipes, guests, captains, photos };
  // Reason: ISO UTC strings sort lexicographically == chronologically.
  for (const key of Object.keys(out)) out[key].sort((a, b) => b.at.localeCompare(a.at));
  return out;
}
