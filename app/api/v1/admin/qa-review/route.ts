import { NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth/admin';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

/**
 * GET /api/v1/admin/qa-review
 *
 * Lists recent QA reviews, newest first. Optional ?group_id= filter.
 * Used by the history pane in the QA Review section.
 */
export async function GET(request: Request) {
  try {
    await requireAdminAuth();
    const supabase = createSupabaseAdminClient();

    const url = new URL(request.url);
    const groupId = url.searchParams.get('group_id');
    const limit = Math.min(Number(url.searchParams.get('limit') || 50), 100);

    let query = supabase
      .from('book_qa_reviews')
      .select(
        'id, group_id, status, pdf_size_bytes, pdf_page_count, critical_count, warning_count, info_count, cost_usd, duration_ms, gemini_model, error_message, created_at, completed_at',
      )
      .order('created_at', { ascending: false })
      .limit(limit);

    if (groupId) {
      query = query.eq('group_id', groupId);
    }

    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unauthorized' },
      { status: 401 },
    );
  }
}
