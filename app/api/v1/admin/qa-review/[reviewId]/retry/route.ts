import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth/admin';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { buildBookContext } from '@/lib/qa-review/book-context';
import { startQABookJob, RailwayError } from '@/lib/qa-review/railway-client';

const STORAGE_BUCKET = 'qa-temp';
const DOWNLOAD_URL_TTL_SECONDS = 60 * 60;

function callbackBaseUrl(): string {
  const fromEnv =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXTJS_PUBLIC_URL ||
    'https://smallplatesandcompany.com';
  return `${fromEnv.replace(/\/$/, '')}/api/v1/admin/qa-review`;
}

/**
 * POST /api/v1/admin/qa-review/[reviewId]/retry
 *
 * Re-dispatches Railway against the PDF that's still in Storage from a previous
 * failed attempt. The user does NOT have to re-upload.
 *
 * Requires the review to be in 'failed' state and to still have storage_path.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ reviewId: string }> },
) {
  try {
    await requireAdminAuth();
    const supabase = createSupabaseAdminClient();
    const { reviewId } = await params;

    const { data: review, error: reviewError } = await supabase
      .from('book_qa_reviews')
      .select('id, group_id, status, storage_path')
      .eq('id', reviewId)
      .single();

    if (reviewError || !review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }
    if (review.status !== 'failed') {
      return NextResponse.json(
        { error: `Cannot retry a review in '${review.status}' state` },
        { status: 409 },
      );
    }
    if (!review.storage_path) {
      return NextResponse.json(
        { error: 'PDF is no longer in storage. Upload a new one.' },
        { status: 409 },
      );
    }

    const { data: downloadData, error: downloadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .createSignedUrl(review.storage_path, DOWNLOAD_URL_TTL_SECONDS);

    if (downloadError || !downloadData) {
      return NextResponse.json(
        { error: `Failed signed URL: ${downloadError?.message}` },
        { status: 500 },
      );
    }

    const bookContext = await buildBookContext(review.group_id);

    await supabase
      .from('book_qa_reviews')
      .update({
        status: 'processing',
        error_message: null,
        completed_at: null,
        findings: null,
        human_summary: null,
        critical_count: 0,
        warning_count: 0,
        info_count: 0,
      })
      .eq('id', reviewId);

    try {
      await startQABookJob({
        review_id: reviewId,
        storage_signed_url: downloadData.signedUrl,
        book_context: bookContext,
        callback_url: callbackBaseUrl(),
      });
    } catch (err) {
      const message =
        err instanceof RailwayError
          ? `railway_error: ${err.message}`
          : `unexpected: ${(err as Error).message}`;

      await supabase
        .from('book_qa_reviews')
        .update({ status: 'failed', error_message: message })
        .eq('id', reviewId);

      return NextResponse.json({ error: message }, { status: 502 });
    }

    return NextResponse.json({ review_id: reviewId, status: 'processing' });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unauthorized' },
      { status: 401 },
    );
  }
}
