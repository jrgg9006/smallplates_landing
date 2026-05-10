// Reason: sharp is a Node-only native module. Keeping it isolated here —
// imported only by API routes — prevents webpack from trying to bundle it
// into client builds. lib/supabase/storage.ts is reachable from client
// components, so sharp cannot live there. `serverExternalPackages: ['sharp']`
// in next.config.js is the second layer of defense.

/**
 * Generate a 1200x630 JPEG buffer optimized for WhatsApp/Meta OG previews,
 * cropping with focal point (positionX, positionY in 0-100 percentage scale).
 *
 * WhatsApp's crawler has a tight timeout and no retry — pre-processing at
 * upload time eliminates sharp from the request path and keeps OG previews
 * reliable. Target file size is <300KB; quality 70 + mozjpeg gets us there
 * without visible loss.
 */
export async function generateCoupleImageOgBuffer(
  buffer: Buffer,
  positionX: number,
  positionY: number
): Promise<Buffer> {
  const sharp = (await import('sharp')).default;

  const meta = await sharp(buffer).metadata();
  const sourceW = meta.width;
  const sourceH = meta.height;

  if (!sourceW || !sourceH) {
    throw new Error('Could not read image dimensions');
  }

  const sourceRatio = sourceW / sourceH;
  const targetRatio = 1200 / 630;

  // Reason: percentage-based focal point on cover-crop. Sharp's `position`
  // option only accepts string presets ('top', 'centre', etc.), so we compute
  // the crop offsets manually: scale by the dimension that limits, then extract
  // a 1200x630 region with offset proportional to position.
  let pipeline = sharp(buffer);
  if (sourceRatio > targetRatio) {
    // Source wider than target — scale by height, crop horizontally
    const scaledW = Math.round(sourceW * (630 / sourceH));
    const offsetX = Math.max(0, Math.min(scaledW - 1200, Math.round((scaledW - 1200) * (positionX / 100))));
    pipeline = pipeline
      .resize(scaledW, 630)
      .extract({ left: offsetX, top: 0, width: 1200, height: 630 });
  } else {
    // Source taller (or equal) — scale by width, crop vertically
    const scaledH = Math.round(sourceH * (1200 / sourceW));
    const offsetY = Math.max(0, Math.min(scaledH - 630, Math.round((scaledH - 630) * (positionY / 100))));
    pipeline = pipeline
      .resize(1200, scaledH)
      .extract({ left: 0, top: offsetY, width: 1200, height: 630 });
  }

  return pipeline
    .flatten({ background: { r: 255, g: 255, b: 255 } })
    .jpeg({ quality: 70, progressive: true, mozjpeg: true })
    .toBuffer();
}

/**
 * Upload a pre-processed OG buffer for a group's couple image.
 * Always stored as `couple_image_og.jpg` (fixed path/extension) so it
 * overwrites cleanly on regeneration.
 */
export async function uploadCoupleImageOgWithClient(
  supabase: any,
  groupId: string,
  ogBuffer: Buffer
): Promise<{ url: string | null; error: string | null }> {
  try {
    const filePath = `groups/${groupId}/couple_image_og.jpg`;

    const { error: uploadError } = await supabase.storage
      .from('recipes')
      .upload(filePath, ogBuffer, {
        contentType: 'image/jpeg',
        cacheControl: '31536000',
        upsert: true,
      });

    if (uploadError) {
      console.error('Error uploading couple OG image:', uploadError);
      return { url: null, error: `Failed to upload OG image: ${uploadError.message}` };
    }

    const { data: { publicUrl } } = supabase.storage
      .from('recipes')
      .getPublicUrl(filePath);

    // Reason: ?t timestamp doubles as the og_url version surfaced in share
    // links (extractOgVersion). Changing it on every regeneration is what
    // forces WhatsApp to treat re-shared links as new and re-crawl.
    return { url: `${publicUrl}?t=${Date.now()}`, error: null };
  } catch (error) {
    console.error('Error in uploadCoupleImageOgWithClient:', error);
    return { url: null, error: 'An unexpected error occurred while uploading OG image' };
  }
}
