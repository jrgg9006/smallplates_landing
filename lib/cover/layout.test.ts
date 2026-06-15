import {
  titleFontSize,
  splitCoupleName,
  DEFAULT_COVER_LINE,
} from '@/lib/cover/layout';

describe('cover layout', () => {
  describe('titleFontSize', () => {
    it('returns the largest size for short names', () => {
      expect(titleFontSize(5)).toBe(80);
      expect(titleFontSize(16)).toBe(80);
    });
    it('steps down gently for medium names', () => {
      expect(titleFontSize(17)).toBe(72);
      expect(titleFontSize(24)).toBe(72);
    });
    it('holds a high 64px floor for long names (they wrap, not shrink)', () => {
      expect(titleFontSize(25)).toBe(64);
      expect(titleFontSize(40)).toBe(64);
      expect(titleFontSize(80)).toBe(64);
    });
  });

  describe('splitCoupleName', () => {
    it('splits on the ampersand and trims', () => {
      const r = splitCoupleName('Olivia & David');
      expect(r.hasAmp).toBe(true);
      expect(r.part1).toBe('Olivia');
      expect(r.part2).toBe('David');
    });
    it('handles a single name with no ampersand', () => {
      const r = splitCoupleName('Richi');
      expect(r.hasAmp).toBe(false);
      expect(r.part1).toBe('Richi');
      expect(r.part2).toBe('');
    });
    it('sizes by the longer part', () => {
      // longest part "Maximiliano" = 11 -> 80; "Maximiliano Alexander" = 21 -> 72
      expect(splitCoupleName('Maximiliano & Jo').fontSize).toBe(80);
      expect(splitCoupleName('Maximiliano Alexander & Jo').fontSize).toBe(72);
    });
  });

  it('exposes the default eyebrow line', () => {
    expect(DEFAULT_COVER_LINE).toBe('RECIPES FROM THE PEOPLE WHO LOVE');
  });
});
