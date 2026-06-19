import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { requireAdminAuth } from '@/lib/auth/admin';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { annexSrcStoragePath, shouldQueueForUpscale } from '@/lib/annex/upscale';

// Reason: sharp needs the Node runtime; downloading + normalizing several images can take time.
export const runtime = 'nodejs';
export const maxDuration = 60;

// Reason: Real-ESRGAN's GPU rejects inputs whose TOTAL pixels exceed ~2,096,704
// ("greater than the max size that fits in GPU memory"). Capping the longest edge is not
// enough (e.g. 2048x1536 = 3.1M px is rejected), so we cap total pixels with a safety margin.
// At 4x, ~2M input px still yields ~8M output px — plenty for one-image-per-page print.
const MAX_UPSCALE_INPUT_PIXELS = 2_000_000;

// POST — normalize every not-yet-processed annex image for this group and queue it for upscale.
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    await requireAdminAuth();
    const { groupId } = await params;
    const supabase = createSupabaseAdminClient();

    const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!baseUrl) {
      return NextResponse.json({ error: 'Supabase URL not configured' }, { status: 500 });
    }

    const { data: rows, error: rowsError } = await supabase
      .from('recipe_annex_images')
      .select('id, recipe_id, source_url, upscale_status, position')
      .eq('group_id', groupId);

    if (rowsError) return NextResponse.json({ error: rowsError.message }, { status: 500 });

    const queue = (rows ?? []).filter((r) =>
      shouldQueueForUpscale(r.upscale_status as string | null)
    );

    let queued = 0;
    const errors: { id: string; error: string }[] = [];

    for (const row of queue) {
      try {
        const srcRes = await fetch(row.source_url as string);
        if (!srcRes.ok) throw new Error(`download failed (${srcRes.status})`);
        const inputBuffer = Buffer.from(await srcRes.arrayBuffer());

        // Reason: rotate() bakes in EXIF orientation; resolve true post-rotation dimensions
        // so we can bound TOTAL pixels under Real-ESRGAN's GPU limit (downscale only, never enlarge).
        const rotated = await sharp(inputBuffer).rotate().toBuffer({ resolveWithObject: true });
        const { width: rw, height: rh } = rotated.info;
        let normalizer = sharp(rotated.data);
        if (rw && rh && rw * rh > MAX_UPSCALE_INPUT_PIXELS) {
          const scale = Math.sqrt(MAX_UPSCALE_INPUT_PIXELS / (rw * rh));
          normalizer = normalizer.resize(
            Math.max(1, Math.floor(rw * scale)),
            Math.max(1, Math.floor(rh * scale))
          );
        }
        // png() guarantees a clean, lossless input for Replicate regardless of source format.
        const normalized = await normalizer.png().toBuffer();

        const path = annexSrcStoragePath(
          groupId,
          row.recipe_id as string,
          row.position as number
        );

        const { error: uploadError } = await supabase.storage
          .from('recipes')
          .upload(path, normalized, { contentType: 'image/png', upsert: true });
        if (uploadError) throw new Error(`upload failed: ${uploadError.message}`);

        const originalUrl = `${baseUrl}/storage/v1/object/public/recipes/${path}`;

        // Reason: setting upscale_status='pending' fires the DB webhook -> upscale-annex-image.
        const { error: updateError } = await supabase
          .from('recipe_annex_images')
          .update({
            original_url: originalUrl,
            print_url: null,
            upscale_status: 'pending',
            image_dimensions: null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', row.id);
        if (updateError) throw new Error(`db update failed: ${updateError.message}`);

        queued += 1;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'normalize failed';
        errors.push({ id: row.id as string, error: msg });
        // Reason: surface the failure in the overlay instead of leaving the row stuck.
        await supabase
          .from('recipe_annex_images')
          .update({
            upscale_status: 'error',
            image_dimensions: { error: msg },
            updated_at: new Date().toISOString(),
          })
          .eq('id', row.id);
      }
    }

    return NextResponse.json({ queued, errors });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unauthorized' },
      { status: 401 }
    );
  }
}
