import { isFreeTierEnabled, isClubEnabled, isTilesEnabled } from '@/lib/feature-flags';

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

  describe('isClubEnabled', () => {
    const original = process.env.NEXT_PUBLIC_SHOW_CLUB;
    afterEach(() => {
      process.env.NEXT_PUBLIC_SHOW_CLUB = original;
    });

    it('returns true when NEXT_PUBLIC_SHOW_CLUB is "true"', () => {
      process.env.NEXT_PUBLIC_SHOW_CLUB = 'true';
      expect(isClubEnabled()).toBe(true);
    });

    it('returns false when NEXT_PUBLIC_SHOW_CLUB is undefined', () => {
      delete process.env.NEXT_PUBLIC_SHOW_CLUB;
      expect(isClubEnabled()).toBe(false);
    });
  });

  describe('isTilesEnabled', () => {
    const original = process.env.NEXT_PUBLIC_SHOW_TILES;
    afterEach(() => {
      process.env.NEXT_PUBLIC_SHOW_TILES = original;
    });

    it('returns true when NEXT_PUBLIC_SHOW_TILES is "true"', () => {
      process.env.NEXT_PUBLIC_SHOW_TILES = 'true';
      expect(isTilesEnabled()).toBe(true);
    });

    it('returns false when NEXT_PUBLIC_SHOW_TILES is undefined', () => {
      delete process.env.NEXT_PUBLIC_SHOW_TILES;
      expect(isTilesEnabled()).toBe(false);
    });
  });
});
