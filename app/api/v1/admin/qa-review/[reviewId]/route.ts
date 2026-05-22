import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth/admin';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

const STORAGE_BUCKET = 'qa-temp';

/**
 * GET /api/v1/admin/qa-review/[reviewId]
 * Returns the current state of a review (polled by the frontend).
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ reviewId: string }> },
) {
  try {
    await requireAdminAuth();
    const supabase = createSupabaseAdminClient();
    const { reviewId } = await params;

    const { data, error } = await supabase
      .from('book_qa_reviews')
      .select('*')
      .eq('id', reviewId)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unauthorized' },
      { status: 401 },
    );
  }
}

/**
 * DELETE /api/v1/admin/qa-review/[reviewId]
 * Discards a review: removes the storage PDF (if any) and the row.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ reviewId: string }> },
) {
  try {
    await requireAdminAuth();
    const supabase = createSupabaseAdminClient();
    const { reviewId } = await params;

    const { data: review, error: fetchError } = await supabase
      .from('book_qa_reviews')
      .select('id, storage_path')
      .eq('id', reviewId)
      .single();

    if (fetchError || !review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    if (review.storage_path) {
      // Best-effort: ignore storage delete errors so a transient Storage issue
      // doesn't block deleting the DB row.
      await supabase.storage.from(STORAGE_BUCKET).remove([review.storage_path]);
    }

    const { error: deleteError } = await supabase
      .from('book_qa_reviews')
      .delete()
      .eq('id', reviewId);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ deleted: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unauthorized' },
      { status: 401 },
    );
  }
}
