import {
  titleFontSize,
  splitCoupleName,
  DEFAULT_COVER_LINE,
} from '@/lib/cover/layout';

describe('cover layout', () => {
  describe('titleFontSize', () => {
    it('returns one fixed size — names wrap, never shrink', () => {
      expect(titleFontSize()).toBe(80);
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
    it('uses the fixed cover font size regardless of length', () => {
      expect(splitCoupleName('Ana & David').fontSize).toBe(80);
      expect(splitCoupleName('Maximiliano Alexander & Jo').fontSize).toBe(80);
    });
  });

  it('exposes the default eyebrow line', () => {
    expect(DEFAULT_COVER_LINE).toBe('RECIPES FROM THE PEOPLE WHO LOVE');
  });
});
