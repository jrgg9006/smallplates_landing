// app/api/v1/admin/delete/trash-list/route.ts
import { NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth/admin';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  try {
    await requireAdminAuth();
    const admin = createSupabaseAdminClient();
    // Reason: payload->protection->purgeAllowed sin traer el payload completo
    const { data, error } = await admin
      .from('deleted_items')
      .select('id, entity_type, entity_id, entity_label, counts, status, deleted_by, deleted_at, restored_at, purged_at, payload->protection->purgeAllowed')
      .order('deleted_at', { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    const items = (data || []).map((row) => ({
      ...row,
      purgeAllowed: Boolean((row as { purgeAllowed?: boolean }).purgeAllowed),
    }));
    return NextResponse.json({ success: true, data: items });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal error';
    return NextResponse.json({ error: message }, { status: message.includes('Admin') ? 401 : 500 });
  }
}
