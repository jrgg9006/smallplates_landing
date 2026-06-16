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
