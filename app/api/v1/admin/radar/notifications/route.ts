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
    const { id, status } = (await request.json()) as { id: string; status: 'attended' | 'dismissed' };
    if (!id || !['attended', 'dismissed'].includes(status)) {
      return NextResponse.json({ error: 'Bad request' }, { status: 400 });
    }
    const supabase = createSupabaseAdminClient();
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
