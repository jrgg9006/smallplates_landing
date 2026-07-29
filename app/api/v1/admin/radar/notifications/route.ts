import { NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth/admin';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { ATTENDED_COOLDOWN_DAYS, DAY_MS } from '@/lib/radar/monitor-constants';
import { PAID_STATUSES } from '@/lib/radar/aggregate';

export async function GET() {
  try {
    await requireAdminAuth();
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from('radar_notifications')
      .select('*, groups(name)')
      .eq('status', 'open')
      .order('priority', { ascending: true }) // 'high' < 'low' alphabetically; re-sort client-side
      .order('generated_at', { ascending: false });
    if (error) throw error;
    return NextResponse.json({ notifications: data ?? [] });
  } catch (error) {
    console.error('Error in GET /api/v1/admin/radar/notifications:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unauthorized' },
      { status: 401 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    await requireAdminAuth();
    const { id, status, reason } = (await request.json()) as {
      id: string;
      status: 'attended' | 'dismissed' | 'archived';
      reason?: string;
    };
    if (!id || !['attended', 'dismissed', 'archived'].includes(status)) {
      return NextResponse.json({ error: 'Bad request' }, { status: 400 });
    }
    const supabase = createSupabaseAdminClient();

    if (status === 'archived') {
      const { data: notif } = await supabase.from('radar_notifications').select('group_id').eq('id', id).single();
      if (!notif) return NextResponse.json({ error: 'Not found' }, { status: 404 });

      // Guardrail: never hide a paid / in-production book. Losing it from Operations could drop a real order.
      // Reason: a group can have MULTIPLE paid orders (book close + extra copies), so use limit(1) on a list,
      // not maybeSingle() (which errors on 2+ rows and would silently skip the block).
      const { data: paidOrders, error: paidError } = await supabase
        .from('orders')
        .select('id')
        .eq('group_id', notif.group_id)
        .in('status', Array.from(PAID_STATUSES))
        .limit(1);
      if (paidError) throw paidError;
      if (paidOrders && paidOrders.length > 0) {
        return NextResponse.json(
          { error: 'Este libro ya pagó o está en producción. No se puede dar por muerto.' },
          { status: 409 }
        );
      }

      // Reason: "dead" is a durable, reversible book-level flag; the notification CHECK only allows
      // open/attended/dismissed, so the durable fact lives on groups.archived_at + archived_reason.
      // Reason: archive the book FIRST; only dismiss the notification if the archive write succeeds,
      // so we never silently lose the notification while leaving the book un-archived.
      const { error: archiveError } = await supabase
        .from('groups')
        .update({ archived_at: new Date().toISOString(), archived_reason: reason?.trim() || null })
        .eq('id', notif.group_id);
      if (archiveError) throw archiveError;
      const { error: dismissError } = await supabase
        .from('radar_notifications')
        .update({ status: 'dismissed' })
        .eq('id', id);
      if (dismissError) throw dismissError;
      return NextResponse.json({ ok: true });
    }

    const now = new Date();
    const patch =
      status === 'attended'
        ? { status, attended_at: now.toISOString(), cooldown_until: new Date(now.getTime() + ATTENDED_COOLDOWN_DAYS * DAY_MS).toISOString() }
        : { status, attended_at: null, cooldown_until: null };
    const { error } = await supabase.from('radar_notifications').update(patch).eq('id', id);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error in PATCH /api/v1/admin/radar/notifications:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unauthorized' },
      { status: 401 }
    );
  }
}
