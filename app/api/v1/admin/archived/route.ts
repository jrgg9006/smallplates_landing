import { NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth/admin';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { isGroupPaid, PAID_BOOK_ARCHIVE_ERROR } from '@/lib/radar/archive-guard';
import { PAID_STATUSES } from '@/lib/radar/aggregate';

// Global "Archivados" data: the dead books (with note) + the books still eligible to archive
// (non-archived AND not paid — paid books are protected from being hidden).
export async function GET() {
  try {
    await requireAdminAuth();
    const supabase = createSupabaseAdminClient();
    const [archivedRes, archivableRes, paidRes] = await Promise.all([
      supabase
        .from('groups')
        .select('id, name, archived_at, archived_reason')
        .not('archived_at', 'is', null)
        .order('archived_at', { ascending: false }),
      // Only OPEN books are candidates to give up on. Closed / in-production / delivered books
      // (book_status reviewed | ready_to_print | printed | inactive) are done, not "dead".
      supabase
        .from('groups')
        .select('id, name')
        .is('archived_at', null)
        .eq('book_status', 'active')
        .order('created_at', { ascending: false }),
      supabase.from('orders').select('group_id').in('status', Array.from(PAID_STATUSES)),
    ]);
    if (archivedRes.error) throw archivedRes.error;
    if (archivableRes.error) throw archivableRes.error;
    if (paidRes.error) throw paidRes.error;
    const paidGroupIds = new Set((paidRes.data ?? []).map((o) => o.group_id));
    const archivable = (archivableRes.data ?? []).filter((g) => !paidGroupIds.has(g.id));
    return NextResponse.json({ archived: archivedRes.data ?? [], archivable });
  } catch (error) {
    console.error('admin archived GET failed', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unauthorized' },
      { status: 401 }
    );
  }
}

// Archive a book by group id (from the Archivados page). Same paid guardrail as the radar action.
export async function POST(request: Request) {
  try {
    await requireAdminAuth();
    const { groupId, reason } = (await request.json()) as { groupId: string; reason?: string };
    if (!groupId) {
      return NextResponse.json({ error: 'Bad request' }, { status: 400 });
    }
    const supabase = createSupabaseAdminClient();
    if (await isGroupPaid(supabase, groupId)) {
      return NextResponse.json({ error: PAID_BOOK_ARCHIVE_ERROR }, { status: 409 });
    }
    const { error } = await supabase
      .from('groups')
      .update({ archived_at: new Date().toISOString(), archived_reason: reason?.trim() || null })
      .eq('id', groupId);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('admin archived POST failed', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unauthorized' },
      { status: 401 }
    );
  }
}

// Reactivate a book: clear the flag so it is evaluated again and reappears across the admin.
export async function PATCH(request: Request) {
  try {
    await requireAdminAuth();
    const { groupId } = (await request.json()) as { groupId: string };
    if (!groupId) {
      return NextResponse.json({ error: 'Bad request' }, { status: 400 });
    }
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase
      .from('groups')
      .update({ archived_at: null, archived_reason: null })
      .eq('id', groupId);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('admin archived PATCH failed', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unauthorized' },
      { status: 401 }
    );
  }
}
