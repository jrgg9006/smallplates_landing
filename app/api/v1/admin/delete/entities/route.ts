// app/api/v1/admin/delete/entities/route.ts
import { NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth/admin';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import type { DeletableEntity } from '@/lib/admin/deletion/types';

interface EntityListItem {
  id: string;
  label: string;
  sublabel: string;
  badges: string[];
  created_at: string;
}

export async function GET(request: Request) {
  try {
    await requireAdminAuth();
    const url = new URL(request.url);
    const type = url.searchParams.get('type') as DeletableEntity | null;
    // Reason: PostgREST .or() parsea comas/paréntesis como sintaxis del filtro —
    // se quitan del término de búsqueda para que un email raro no rompa la query
    const q = (url.searchParams.get('q') || '').trim().replace(/[,()]/g, '');
    // Reason: paginación con "Cargar más" — offset avanza de PAGE_SIZE en PAGE_SIZE
    const offset = Math.max(0, parseInt(url.searchParams.get('offset') || '0', 10) || 0);
    const PAGE_SIZE = 50;
    const to = offset + PAGE_SIZE - 1;
    const admin = createSupabaseAdminClient();

    let items: EntityListItem[] = [];

    if (type === 'profile') {
      let query = admin
        .from('profiles')
        .select('id, email, full_name, is_test_account, deleted_at, created_at')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .range(offset, to);
      if (q) query = query.or(`email.ilike.%${q}%,full_name.ilike.%${q}%`);
      const { data, error } = await query;
      if (error) throw new Error(error.message);
      items = (data || []).map((p) => ({
        id: p.id,
        label: p.email,
        sublabel: p.full_name || '—',
        badges: p.is_test_account ? ['TEST'] : [],
        created_at: p.created_at,
      }));
    } else if (type === 'group') {
      let query = admin
        .from('groups')
        .select('id, name, occasion, status, created_at, created_by')
        .order('created_at', { ascending: false })
        .range(offset, to);
      if (q) query = query.ilike('name', `%${q}%`);
      const { data, error } = await query;
      if (error) throw new Error(error.message);
      const groupIds = (data || []).map((g) => g.id);
      // Reason: un solo query para marcar badges PAID en la lista
      const { data: orderRows } = groupIds.length
        ? await admin.from('orders').select('group_id').in('group_id', groupIds)
        : { data: [] };
      const paidGroups = new Set((orderRows || []).map((o) => o.group_id));
      items = (data || []).map((g) => ({
        id: g.id,
        label: g.name,
        sublabel: `${g.occasion || '—'} · ${g.status || '—'}`,
        badges: paidGroups.has(g.id) ? ['PAID'] : [],
        created_at: g.created_at,
      }));
    } else if (type === 'guest') {
      let query = admin
        .from('guests')
        .select('id, first_name, last_name, email, status, created_at, groups(name)')
        .order('created_at', { ascending: false })
        .range(offset, to);
      if (q) query = query.or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%,email.ilike.%${q}%`);
      const { data, error } = await query;
      if (error) throw new Error(error.message);
      items = (data || []).map((g) => {
        const groupName = (g.groups as { name?: string } | null)?.name;
        return {
          id: g.id,
          label: [g.first_name, g.last_name].filter(Boolean).join(' ') || g.email || '—',
          sublabel: `${groupName || 'sin grupo'} · ${g.status}`,
          badges: [],
          created_at: g.created_at,
        };
      });
    } else if (type === 'recipe') {
      let query = admin
        .from('guest_recipes')
        .select('id, recipe_name, submission_status, deleted_at, created_at, guests(first_name, last_name)')
        .order('created_at', { ascending: false })
        .range(offset, to);
      if (q) query = query.ilike('recipe_name', `%${q}%`);
      const { data, error } = await query;
      if (error) throw new Error(error.message);
      items = (data || []).map((r) => {
        const guest = r.guests as { first_name?: string; last_name?: string } | null;
        const guestName = [guest?.first_name, guest?.last_name].filter(Boolean).join(' ');
        return {
          id: r.id,
          label: r.recipe_name || 'Untitled',
          sublabel: `${guestName || 'sin guest'} · ${r.submission_status}`,
          // Reason: 👻 = capa 1, receta ya oculta del producto por el dueño/admin
          badges: r.deleted_at ? ['HIDDEN'] : [],
          created_at: r.created_at,
        };
      });
    } else {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: items, hasMore: items.length === PAGE_SIZE });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal error';
    return NextResponse.json({ error: message }, { status: message.includes('Admin') ? 401 : 500 });
  }
}
