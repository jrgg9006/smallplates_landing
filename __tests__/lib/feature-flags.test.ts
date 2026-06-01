import { isFreeTierEnabled } from '@/lib/feature-flags';

describe('feature flags', () => {
  const originalEnv = process.env.NEXT_PUBLIC_FREE_TIER_ENABLED;

  afterEach(() => {
    process.env.NEXT_PUBLIC_FREE_TIER_ENABLED = originalEnv;
  });

  it('returns true when NEXT_PUBLIC_FREE_TIER_ENABLED is "true"', () => {
    process.env.NEXT_PUBLIC_FREE_TIER_ENABLED = 'true';
    expect(isFreeTierEnabled()).toBe(true);
  });

  it('returns false when NEXT_PUBLIC_FREE_TIER_ENABLED is "false"', () => {
    process.env.NEXT_PUBLIC_FREE_TIER_ENABLED = 'false';
    expect(isFreeTierEnabled()).toBe(false);
  });

  it('returns false when NEXT_PUBLIC_FREE_TIER_ENABLED is undefined', () => {
    delete process.env.NEXT_PUBLIC_FREE_TIER_ENABLED;
    expect(isFreeTierEnabled()).toBe(false);
  });
});
