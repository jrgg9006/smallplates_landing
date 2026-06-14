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
 * longest "&"-separated part. Mirrors the Satori render exactly.
 * Reason: 900px wide with ~6px side padding; finer buckets + a 48px floor keep
 * long names from collapsing to a cramped size.
 */
export function titleFontSize(maxPartLen: number): number {
  if (maxPartLen <= 7) return 80;
  if (maxPartLen <= 10) return 72;
  if (maxPartLen <= 14) return 70;
  if (maxPartLen <= 18) return 68;
  if (maxPartLen <= 22) return 66;
  if (maxPartLen <= 27) return 64;
  if (maxPartLen <= 33) return 56;
  return 48;
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
