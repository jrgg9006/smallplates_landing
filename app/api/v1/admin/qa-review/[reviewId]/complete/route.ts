import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { verifyRailwayBearer } from '@/lib/qa-review/railway-client';
import type { RailwayCompleteCallback, QAFinding } from '@/lib/qa-review/types';

const STORAGE_BUCKET = 'qa-temp';

/**
 * POST /api/v1/admin/qa-review/[reviewId]/complete
 *
 * Callback from the Railway microservice when a QA job finishes.
 * Auth via the shared RAILWAY_AGENT_SECRET bearer header.
 *
 * On success: persists the report and deletes the PDF from Storage.
 * On failure: persists the error_message and KEEPS the PDF so the user can retry.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ reviewId: string }> },
) {
  const authorization = request.headers.get('authorization');
  if (!verifyRailwayBearer(authorization)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const { reviewId } = await params;
  let body: RailwayCompleteCallback;
  try {
    body = (await request.json()) as RailwayCompleteCallback;
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  if (body.status !== 'complete' && body.status !== 'failed') {
    return NextResponse.json({ error: 'invalid_status' }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();

  // Look up the review to find the storage_path (we delete on success)
  const { data: review, error: lookupError } = await supabase
    .from('book_qa_reviews')
    .select('id, storage_path')
    .eq('id', reviewId)
    .single();

  if (lookupError || !review) {
    return NextResponse.json({ error: 'review_not_found' }, { status: 404 });
  }

  if (body.status === 'complete') {
    const findings = (body.findings || []) as QAFinding[];
    const { error: updateError } = await supabase
      .from('book_qa_reviews')
      .update({
        status: 'complete',
        findings,
        human_summary: body.human_summary ?? null,
        critical_count: body.critical_count ?? 0,
        warning_count: body.warning_count ?? 0,
        info_count: body.info_count ?? 0,
        pdf_page_count: body.pdf_page_count ?? null,
        pdf_size_bytes: body.pdf_size_bytes ?? null,
        cost_usd: body.cost_usd ?? null,
        duration_ms: body.duration_ms ?? null,
        gemini_model: body.gemini_model ?? null,
        completed_at: new Date().toISOString(),
        error_message: null,
        // Reason: clear storage_path so the UI knows the PDF is gone.
        storage_path: null,
      })
      .eq('id', reviewId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Auto-delete the PDF (the report is what we keep)
    if (review.storage_path) {
      await supabase.storage.from(STORAGE_BUCKET).remove([review.storage_path]);
    }

    return NextResponse.json({ ok: true });
  }

  // status === 'failed'
  const { error: updateError } = await supabase
    .from('book_qa_reviews')
    .update({
      status: 'failed',
      error_message: body.error_message ?? 'unknown_error',
      duration_ms: body.duration_ms ?? null,
      gemini_model: body.gemini_model ?? null,
      completed_at: new Date().toISOString(),
    })
    .eq('id', reviewId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // Keep storage_path/PDF so the user can retry.
  return NextResponse.json({ ok: true });
}
