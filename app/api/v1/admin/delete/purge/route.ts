import { NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth/admin';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  try {
    await requireAdminAuth();
    const { trashId, confirmLabel } = await request.json();
    if (!trashId || !confirmLabel) {
      return NextResponse.json({ error: 'trashId and confirmLabel are required' }, { status: 400 });
    }
    const admin = createSupabaseAdminClient();

    const { data: item, error: itemError } = await admin
      .from('deleted_items')
      .select('id, entity_type, entity_id, entity_label, status, payload->protection->purgeAllowed')
      .eq('id', trashId)
      .maybeSingle();
    if (itemError || !item) {
      return NextResponse.json({ error: 'No encontrado en papelera' }, { status: 404 });
    }
    if (item.status !== 'trashed') {
      return NextResponse.json({ error: `Ya está ${item.status}` }, { status: 400 });
    }
    if (!(item as { purgeAllowed?: boolean }).purgeAllowed) {
      return NextResponse.json(
        { error: 'Purga no permitida: el dueño no es TEST o hay pagos. Vive en papelera.' },
        { status: 403 }
      );
    }
    if (item.entity_label !== confirmLabel) {
      return NextResponse.json({ error: 'La confirmación escrita no coincide' }, { status: 400 });
    }

    // Reason: al purgar un profile por fin se borra el auth user → email reusable
    if (item.entity_type === 'profile') {
      const { error: authError } = await admin.auth.admin.deleteUser(item.entity_id);
      if (authError && !authError.message.includes('not found')) {
        return NextResponse.json({ error: `Borrado de auth falló: ${authError.message}` }, { status: 500 });
      }
    }

    const { error: purgeError } = await admin
      .from('deleted_items')
      .update({ payload: null, status: 'purged', purged_at: new Date().toISOString() })
      .eq('id', trashId);
    if (purgeError) {
      return NextResponse.json({ error: purgeError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal error';
    return NextResponse.json({ error: message }, { status: message.includes('Admin') ? 401 : 500 });
  }
}
