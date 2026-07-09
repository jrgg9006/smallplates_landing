// app/api/v1/admin/delete/preview/route.ts
import { NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth/admin';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { buildSnapshot } from '@/lib/admin/deletion/snapshot';
import type { DeletableEntity, SnapshotTables } from '@/lib/admin/deletion/types';

const VALID_TYPES: DeletableEntity[] = ['profile', 'group', 'guest', 'recipe'];
const PREVIEW_ROW_LIMIT = 50;

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

    return NextResponse.json({ success: true, data: { ...snapshot, tables: trimmed } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal error';
    const status = message === 'Not found' ? 404 : message.includes('Admin') ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
