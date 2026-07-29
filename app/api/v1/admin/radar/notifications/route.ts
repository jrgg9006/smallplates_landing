import { NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth/admin';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { ATTENDED_COOLDOWN_DAYS, DAY_MS } from '@/lib/radar/monitor-constants';

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
    const { id, status } = (await request.json()) as { id: string; status: 'attended' | 'dismissed' | 'archived' };
    if (!id || !['attended', 'dismissed', 'archived'].includes(status)) {
      return NextResponse.json({ error: 'Bad request' }, { status: 400 });
    }
    const supabase = createSupabaseAdminClient();

    if (status === 'archived') {
      const { data: notif } = await supabase.from('radar_notifications').select('group_id').eq('id', id).single();
      if (!notif) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      // Reason: archive is a durable, reversible book-level flag; the notification CHECK only allows
      // open/attended/dismissed, so the durable fact lives on groups.radar_archived_at instead.
      // Reason: archive the book FIRST; only dismiss the notification if the archive write succeeds,
      // so we never silently lose the notification while leaving the book un-archived.
      const { error: archiveError } = await supabase
        .from('groups')
        .update({ radar_archived_at: new Date().toISOString() })
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
