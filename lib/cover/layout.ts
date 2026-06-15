// Shared cover layout logic — the single source of truth for cover sizing and
// name splitting. Imported by the live HTML cover (LiveCover.tsx), the Satori
// print-preview route, and (via the packaged JSON) the InDesign script, so the
// live preview, the server render, and the printed book never drift.

/** Default eyebrow line when the owner has not set a custom one. */
export const DEFAULT_COVER_LINE = 'RECIPES FROM THE PEOPLE WHO LOVE';

/** Max characters for the editable cover fields. */
export const COVER_LINE_MAX = 40;
export const COVER_NAME_MAX = 40;

/** Canonical cover coordinate space (matches the Satori render). */
export const COVER_W = 900;
export const COVER_H = 1125;

/**
 * Title font size in px for the canonical 900px-wide cover, bucketed by the
 * longest "&"-separated part.
 * Reason: the cover keeps a LARGE font and WRAPS long names to a second line
 * (like the printed InDesign cover) instead of shrinking to fit one line. So we
 * only step down gently and hold a high 64px floor — the wrap absorbs the rest.
 */
export function titleFontSize(maxPartLen: number): number {
  if (maxPartLen <= 16) return 80;
  if (maxPartLen <= 24) return 72;
  return 64;
}

export interface SplitName {
  hasAmp: boolean;
  part1: string;
  part2: string;
  /** Font size for this name on the canonical 900px cover. */
  fontSize: number;
}

/** Split a cover name on the first "&" into the two flanking parts. */
export function splitCoupleName(name: string): SplitName {
  const idx = name.indexOf('&');
  const hasAmp = idx > -1;
  const part1 = hasAmp ? name.slice(0, idx).trim() : name;
  const part2 = hasAmp ? name.slice(idx + 1).trim() : '';
  const fontSize = titleFontSize(Math.max(part1.length, part2.length));
  return { hasAmp, part1, part2, fontSize };
}
