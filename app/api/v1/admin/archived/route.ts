import { NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth/admin';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

// Global "Archivados" list: every book the founder gave up on (hidden from all admin surfaces).
export async function GET() {
  try {
    await requireAdminAuth();
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from('groups')
      .select('id, name, archived_at, archived_reason')
      .not('archived_at', 'is', null)
      .order('archived_at', { ascending: false });
    if (error) throw error;
    return NextResponse.json({ archived: data ?? [] });
  } catch (error) {
    console.error('admin archived GET failed', error);
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
