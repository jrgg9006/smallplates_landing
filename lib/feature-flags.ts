export function isFreeTierEnabled(): boolean {
  return process.env.NEXT_PUBLIC_FREE_TIER_ENABLED === 'true';
}
