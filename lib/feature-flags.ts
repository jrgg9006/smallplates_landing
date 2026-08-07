export function isFreeTierEnabled(): boolean {
  return process.env.NEXT_PUBLIC_FREE_TIER_ENABLED === 'true';
}

// Reason: the club and tiles sections of the landing point at flows that do not
// exist yet. These flags let the page ship with those sections dark, and turn
// them on per environment without a deploy.
export function isClubEnabled(): boolean {
  return process.env.NEXT_PUBLIC_SHOW_CLUB === 'true';
}

export function isTilesEnabled(): boolean {
  return process.env.NEXT_PUBLIC_SHOW_TILES === 'true';
}
