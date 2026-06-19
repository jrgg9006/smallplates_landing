// Reason: a handwritten note is only worth printing if it's an actual raster image.
// PDFs and non-image files are excluded from the annex in v1.
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];

/** True if the URL points to a raster image we can place in the annex. */
export function isAnnexEligibleUrl(url: string): boolean {
  const path = url.toLowerCase().split('?')[0];
  return IMAGE_EXTENSIONS.some((ext) => path.endsWith(ext));
}

/**
 * True if `sourceUrl` actually belongs to this recipe (document_urls or legacy
 * image_url) AND is an eligible image. Prevents inserting arbitrary URLs.
 */
export function isValidAnnexSource(
  sourceUrl: string,
  documentUrls: string[] | null,
  imageUrl: string | null
): boolean {
  const allowed = [...(documentUrls ?? []), ...(imageUrl ? [imageUrl] : [])];
  return allowed.includes(sourceUrl) && isAnnexEligibleUrl(sourceUrl);
}

/** Next position for a recipe's annex images: max existing position + 1, else 0. */
export function nextAnnexPosition(existingPositions: number[]): number {
  if (existingPositions.length === 0) return 0;
  return Math.max(...existingPositions) + 1;
}

/** Eligible raster images the guest submitted (document_urls + legacy image_url). */
export function eligibleAnnexImages(
  documentUrls: string[] | null,
  imageUrl: string | null
): string[] {
  const all = [...(documentUrls ?? []), ...(imageUrl ? [imageUrl] : [])];
  return all.filter(isAnnexEligibleUrl);
}

export type AnnexRowState = 'none' | 'unreviewed' | 'selected' | 'dismissed';

/**
 * Tri/quad-state for the book-list marker.
 *   'none'       = no guest photo to review.
 *   'selected'   = at least one image marked as original (wins over dismissed).
 *   'dismissed'  = reviewed and explicitly not included (0 marked).
 *   'unreviewed' = has photo(s), 0 marked, not dismissed → still needs a look.
 */
export function annexRowState(
  documentUrls: string[] | null,
  imageUrl: string | null,
  annexSourceUrls: string[] | null,
  dismissed: boolean = false
): { state: AnnexRowState; selectedCount: number; eligibleCount: number } {
  const eligibleCount = eligibleAnnexImages(documentUrls, imageUrl).length;
  const selectedCount = (annexSourceUrls ?? []).length;
  if (eligibleCount === 0) return { state: 'none', selectedCount: 0, eligibleCount: 0 };
  if (selectedCount >= 1) return { state: 'selected', selectedCount, eligibleCount };
  if (dismissed) return { state: 'dismissed', selectedCount: 0, eligibleCount };
  return { state: 'unreviewed', selectedCount: 0, eligibleCount };
}

export interface AnnexUpscaleCounts {
  selected: number;
  ready: number;
  notReady: number;
  processing: number;
}

/** Counts of a book's selected originals by upscale lifecycle. Drives the
 *  book-level "Upscale originals" button and the pre-export warning. */
export function annexUpscaleCounts(
  rows: { upscale_status: string | null }[]
): AnnexUpscaleCounts {
  let ready = 0;
  let processing = 0;
  for (const r of rows) {
    if (r.upscale_status === 'ready') ready += 1;
    else if (r.upscale_status === 'pending' || r.upscale_status === 'processing') processing += 1;
  }
  return { selected: rows.length, ready, notReady: rows.length - ready, processing };
}
