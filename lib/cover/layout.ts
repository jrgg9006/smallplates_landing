// Shared cover layout logic — the single source of truth for cover sizing and
// name splitting. Imported by the live HTML cover (LiveCover.tsx), the Satori
// print-preview route, and (via the packaged JSON) the InDesign script, so the
// live preview, the server render, and the printed book never drift.

/** Default eyebrow line when the owner has not set a custom one. */
export const DEFAULT_COVER_LINE = 'RECIPES FROM THE PEOPLE WHO LOVE';

/**
 * Cover paper background for the WEB preview.
 * Reason: the printed book comes out lighter and cooler ("bone") than the warm
 * cream the file color (#f0ece3) shows on screen. The preview should predict the
 * physical book, so we intentionally render a lighter, less-yellow tone here.
 * This drives only the web preview — the InDesign file / print is untouched.
 */
export const COVER_BG_COLOR = '#f4f1ea';

/** Max characters for the editable cover fields. */
export const COVER_LINE_MAX = 40;
export const COVER_NAME_MAX = 40;

/** Canonical cover coordinate space (matches the Satori render). */
export const COVER_W = 900;
export const COVER_H = 1125;

/**
 * Title font size in px for the canonical 900px-wide cover.
 * Reason: the cover uses ONE fixed size for every name (like the printed
 * InDesign cover) — long names WRAP to a second line, they never shrink. Kept as
 * a function so callers don't change if we ever reintroduce size logic.
 *
 * Derived to match the printed cover exactly: InDesign sets the title at 47 pt on
 * an 8 in cover; the canonical cover is 900 px wide (900/8 = 112.5 px/in), so
 * 47 pt × 112.5/72 = 73.4 px. Rounded to 73 so the web preview wraps at the same
 * point as the printed book.
 */
export const COVER_TITLE_FONT_SIZE = 73;

export function titleFontSize(): number {
  return COVER_TITLE_FONT_SIZE;
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
  return { hasAmp, part1, part2, fontSize: titleFontSize() };
}
