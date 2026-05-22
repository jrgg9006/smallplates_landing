import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth/admin';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { QA_MAX_PDF_SIZE_BYTES } from '@/lib/qa-review/types';

const STORAGE_BUCKET = 'qa-temp';
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * POST /api/v1/admin/qa-review/upload
 * Body: { group_id: string, pdf_size_bytes: number }
 *
 * Creates a book_qa_reviews row in 'uploading' state and returns a signed
 * URL that the client uses to PUT the PDF directly to Supabase Storage.
 * The PDF never passes through Vercel — important because Vercel has body
 * size limits and the PDFs are ~50 MB.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAdminAuth();
    const supabase = createSupabaseAdminClient();

    const body = (await request.json()) as { group_id?: string; pdf_size_bytes?: number };
    const groupId = body.group_id;
    const sizeBytes = body.pdf_size_bytes;

    if (!groupId || !UUID_RE.test(groupId)) {
      return NextResponse.json({ error: 'Invalid group_id' }, { status: 400 });
    }
    if (typeof sizeBytes !== 'number' || sizeBytes <= 0 || sizeBytes > QA_MAX_PDF_SIZE_BYTES) {
      return NextResponse.json(
        { error: `pdf_size_bytes must be 1..${QA_MAX_PDF_SIZE_BYTES}` },
        { status: 400 },
      );
    }

    // Confirm the group exists before creating a review row
    const { data: group, error: groupError } = await supabase
      .from('groups')
      .select('id')
      .eq('id', groupId)
      .single();
    if (groupError || !group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    // Create the review row
    const { data: review, error: insertError } = await supabase
      .from('book_qa_reviews')
      .insert({
        group_id: groupId,
        status: 'uploading',
        pdf_size_bytes: sizeBytes,
        created_by: user.id,
      })
      .select('id')
      .single();

    if (insertError || !review) {
      return NextResponse.json(
        { error: insertError?.message || 'Failed to create review' },
        { status: 500 },
      );
    }

    const reviewId = review.id;
    const storagePath = `${groupId}/${reviewId}.pdf`;

    // Signed upload URL: client PUTs PDF directly to Supabase Storage
    const { data: signedData, error: signedError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .createSignedUploadUrl(storagePath);

    if (signedError) {
      // Roll back the review row so we don't leave orphans
      await supabase.from('book_qa_reviews').delete().eq('id', reviewId);
      return NextResponse.json(
        { error: `Failed to create signed URL: ${signedError.message}` },
        { status: 500 },
      );
    }

    // Persist the storage path for /start to find later
    await supabase
      .from('book_qa_reviews')
      .update({ storage_path: storagePath })
      .eq('id', reviewId);

    return NextResponse.json({
      review_id: reviewId,
      storage_path: storagePath,
      signed_url: signedData.signedUrl,
      token: signedData.token,
      max_size_bytes: QA_MAX_PDF_SIZE_BYTES,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unauthorized' },
      { status: 401 },
    );
  }
}
