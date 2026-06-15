import {
  titleFontSize,
  splitCoupleName,
  DEFAULT_COVER_LINE,
} from '@/lib/cover/layout';

describe('cover layout', () => {
  describe('titleFontSize', () => {
    it('returns one fixed size — names wrap, never shrink', () => {
      // 47 pt on an 8 in cover at 112.5 px/in → 73 px (matches the printed cover).
      expect(titleFontSize()).toBe(73);
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
      expect(splitCoupleName('Ana & David').fontSize).toBe(73);
      expect(splitCoupleName('Maximiliano Alexander & Jo').fontSize).toBe(73);
    });
  });

  it('exposes the default eyebrow line', () => {
    expect(DEFAULT_COVER_LINE).toBe('RECIPES FROM THE PEOPLE WHO LOVE');
  });
});
