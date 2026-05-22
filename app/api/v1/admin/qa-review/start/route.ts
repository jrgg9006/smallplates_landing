import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth/admin';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { buildBookContext } from '@/lib/qa-review/book-context';
import { startQABookJob, RailwayError } from '@/lib/qa-review/railway-client';

const STORAGE_BUCKET = 'qa-temp';
const DOWNLOAD_URL_TTL_SECONDS = 60 * 60; // 1h — plenty for Railway to download

function callbackBaseUrl(): string {
  // Reason: Railway needs to know where to POST the callback. Prefer an explicit env
  // var (NEXTJS_PUBLIC_URL or NEXT_PUBLIC_SITE_URL), fall back to a hardcoded prod URL.
  const fromEnv =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXTJS_PUBLIC_URL ||
    'https://smallplatesandcompany.com';
  return `${fromEnv.replace(/\/$/, '')}/api/v1/admin/qa-review`;
}

/**
 * POST /api/v1/admin/qa-review/start
 * Body: { review_id: string }
 *
 * Called by the frontend after the PDF upload to Storage finishes.
 * Loads the book context, generates a signed download URL, and tells
 * Railway to start processing. Railway responds 202 and processes async.
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdminAuth();
    const supabase = createSupabaseAdminClient();

    const { review_id: reviewId } = (await request.json()) as { review_id?: string };
    if (!reviewId || typeof reviewId !== 'string') {
      return NextResponse.json({ error: 'review_id is required' }, { status: 400 });
    }

    // 1. Load review row
    const { data: review, error: reviewError } = await supabase
      .from('book_qa_reviews')
      .select('id, group_id, status, storage_path')
      .eq('id', reviewId)
      .single();

    if (reviewError || !review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }
    if (review.status === 'processing') {
      return NextResponse.json({ error: 'Review is already processing' }, { status: 409 });
    }
    if (!review.storage_path) {
      return NextResponse.json({ error: 'PDF was not uploaded' }, { status: 409 });
    }

    // 2. Generate signed download URL for Railway
    const { data: downloadData, error: downloadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .createSignedUrl(review.storage_path, DOWNLOAD_URL_TTL_SECONDS);

    if (downloadError || !downloadData) {
      return NextResponse.json(
        { error: `Failed signed download URL: ${downloadError?.message}` },
        { status: 500 },
      );
    }

    // 3. Build the book context
    const bookContext = await buildBookContext(review.group_id);

    // 4. Dispatch to Railway. Update status BEFORE the call so concurrent /start
    //    calls don't double-dispatch; if Railway fails we revert below.
    await supabase
      .from('book_qa_reviews')
      .update({ status: 'processing', error_message: null })
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
