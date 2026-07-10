// app/api/v1/admin/delete/preview/route.ts
import { NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth/admin';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { buildSnapshot } from '@/lib/admin/deletion/snapshot';
import type { DeletableEntity, SnapshotTables } from '@/lib/admin/deletion/types';

const VALID_TYPES: DeletableEntity[] = ['profile', 'group', 'guest', 'recipe'];
const PREVIEW_ROW_LIMIT = 50;

type Row = Record<string, unknown>;

// Reason: contexto humano para el modal — en qué libro vive la entidad, cuándo se
// subió y quién la editó. Es solo display; el grupo/guest referenciado NO se borra.
async function buildContext(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  type: DeletableEntity,
  id: string,
  tables: SnapshotTables
): Promise<Record<string, string>> {
  const context: Record<string, string> = {};

  const groupName = async (groupId: unknown): Promise<string | null> => {
    if (!groupId) return null;
    const { data } = await admin.from('groups').select('name').eq('id', String(groupId)).maybeSingle();
    return data?.name ? String(data.name) : null;
  };

  if (type === 'recipe') {
    const root = (tables.guest_recipes || []).find((r: Row) => String(r.id) === id);
    if (!root) return context;
    const book = await groupName(root.group_id);
    if (book) context['En el libro'] = book;
    if (root.guest_id) {
      const { data: guest } = await admin
        .from('guests')
        .select('first_name, last_name')
        .eq('id', String(root.guest_id))
        .maybeSingle();
      const name = [guest?.first_name, guest?.last_name].filter(Boolean).join(' ');
      if (name) context['Del guest'] = name;
    }
    if (root.created_at) context['Subida'] = new Date(String(root.created_at)).toLocaleString();
    if (root.submitted_at) context['Enviada'] = new Date(String(root.submitted_at)).toLocaleString();

    const edits = (tables.recipe_edit_history || []) as Row[];
    if (edits.length > 0) {
      const last = edits.reduce((a, b) =>
        String(a.edited_at || '') > String(b.edited_at || '') ? a : b
      );
      let editor = 'desconocido';
      if (last.edited_by) {
        const { data: profile } = await admin
          .from('profiles')
          .select('email')
          .eq('id', String(last.edited_by))
          .maybeSingle();
        if (profile?.email) editor = String(profile.email);
      }
      context['Ediciones'] = `${edits.length} — última ${new Date(String(last.edited_at)).toLocaleDateString()} por ${editor}`;
    } else {
      context['Ediciones'] = 'ninguna';
    }
  }

  if (type === 'guest') {
    const root = (tables.guests || []).find((r: Row) => String(r.id) === id);
    const book = await groupName(root?.group_id);
    if (book) context['En el libro'] = book;
    if (root?.created_at) context['Agregado'] = new Date(String(root.created_at)).toLocaleString();
  }

  if (type === 'group') {
    const root = (tables.groups || []).find((r: Row) => String(r.id) === id);
    if (root?.created_by) {
      const { data: owner } = await admin
        .from('profiles')
        .select('email')
        .eq('id', String(root.created_by))
        .maybeSingle();
      if (owner?.email) context['Dueño'] = String(owner.email);
    }
    if (root?.created_at) context['Creado'] = new Date(String(root.created_at)).toLocaleString();
  }

  return context;
}

export async function GET(request: Request) {
  try {
    await requireAdminAuth();
    const url = new URL(request.url);
    const type = url.searchParams.get('type') as DeletableEntity | null;
    const id = url.searchParams.get('id');

    if (!type || !VALID_TYPES.includes(type) || !id) {
      return NextResponse.json({ error: 'type and id are required' }, { status: 400 });
    }

    const admin = createSupabaseAdminClient();
    const snapshot = await buildSnapshot(admin, type, id);

    // Reason: el payload completo puede ser enorme; la UI solo necesita muestras
    const trimmed: SnapshotTables = {};
    for (const [table, rows] of Object.entries(snapshot.tables)) {
      if (rows.length > 0) trimmed[table] = rows.slice(0, PREVIEW_ROW_LIMIT);
    }

    // Reason: group_members solo trae profile_id — se enriquece con nombre/email
    // para que el modal muestre personas, no UUIDs (solo display, no viaja al payload)
    const members = (snapshot.tables.group_members || []) as Row[];
    if (members.length > 0) {
      const memberIds = [...new Set(members.map((m) => String(m.profile_id)).filter(Boolean))];
      const { data: memberProfiles } = await admin
        .from('profiles')
        .select('id, email, full_name')
        .in('id', memberIds);
      const byId = new Map((memberProfiles || []).map((p) => [String(p.id), p]));
      for (const m of members) {
        const p = byId.get(String(m.profile_id));
        if (p) m.member_label = [p.full_name, p.email].filter(Boolean).join(' · ');
      }
    }

    const context = await buildContext(admin, type, id, snapshot.tables);

    return NextResponse.json({ success: true, data: { ...snapshot, tables: trimmed, context } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal error';
    const status = message === 'Not found' ? 404 : message.includes('Admin') ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
