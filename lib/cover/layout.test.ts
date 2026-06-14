import {
  titleFontSize,
  splitCoupleName,
  DEFAULT_COVER_LINE,
} from '@/lib/cover/layout';

describe('cover layout', () => {
  describe('titleFontSize', () => {
    it('returns the largest size for short names', () => {
      expect(titleFontSize(5)).toBe(80);
    });
    it('steps down through the buckets', () => {
      expect(titleFontSize(10)).toBe(72);
      expect(titleFontSize(14)).toBe(70);
      expect(titleFontSize(18)).toBe(68);
      expect(titleFontSize(22)).toBe(66);
      expect(titleFontSize(27)).toBe(64);
      expect(titleFontSize(33)).toBe(56);
    });
    it('floors at 48 for very long names', () => {
      expect(titleFontSize(34)).toBe(48);
      expect(titleFontSize(80)).toBe(48);
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
      // "Maximiliano" = 11 chars -> bucket <=14 -> 70
      expect(splitCoupleName('Maximiliano & Jo').fontSize).toBe(70);
    });
  });

  it('exposes the default eyebrow line', () => {
    expect(DEFAULT_COVER_LINE).toBe('RECIPES FROM THE PEOPLE WHO LOVE');
  });
});
