import {
  isAnnexEligibleUrl,
  isValidAnnexSource,
  nextAnnexPosition,
  eligibleAnnexImages,
  annexRowState,
} from './selection';

describe('isAnnexEligibleUrl', () => {
  it('acepta extensiones de imagen comunes', () => {
    expect(isAnnexEligibleUrl('https://x/abc.jpg')).toBe(true);
    expect(isAnnexEligibleUrl('https://x/abc.PNG?t=1')).toBe(true);
    expect(isAnnexEligibleUrl('https://x/abc.webp')).toBe(true);
    expect(isAnnexEligibleUrl('https://x/abc.jpeg')).toBe(true);
  });
  it('rechaza PDFs y otros tipos', () => {
    expect(isAnnexEligibleUrl('https://x/abc.pdf')).toBe(false);
    expect(isAnnexEligibleUrl('https://x/abc.mp3')).toBe(false);
    expect(isAnnexEligibleUrl('https://x/noext')).toBe(false);
  });
});

describe('isValidAnnexSource', () => {
  it('acepta una url presente en document_urls que es imagen', () => {
    expect(isValidAnnexSource('https://x/1.jpg', ['https://x/1.jpg'], null)).toBe(true);
  });
  it('rechaza una url que no pertenece a la receta', () => {
    expect(isValidAnnexSource('https://evil/1.jpg', ['https://x/1.jpg'], null)).toBe(false);
  });
  it('rechaza un pdf aunque esté presente', () => {
    expect(isValidAnnexSource('https://x/1.pdf', ['https://x/1.pdf'], null)).toBe(false);
  });
  it('usa image_url como fallback', () => {
    expect(isValidAnnexSource('https://x/legacy.jpg', null, 'https://x/legacy.jpg')).toBe(true);
  });
});

describe('nextAnnexPosition', () => {
  it('devuelve 0 si no hay filas', () => {
    expect(nextAnnexPosition([])).toBe(0);
  });
  it('devuelve max+1', () => {
    expect(nextAnnexPosition([0, 1, 2])).toBe(3);
    expect(nextAnnexPosition([5])).toBe(6);
  });
});

describe('eligibleAnnexImages', () => {
  it('devuelve solo imágenes raster de document_urls + image_url', () => {
    expect(
      eligibleAnnexImages(['https://x/a.jpg', 'https://x/b.pdf'], 'https://x/c.png')
    ).toEqual(['https://x/a.jpg', 'https://x/c.png']);
  });
  it('devuelve vacío cuando no hay imágenes elegibles', () => {
    expect(eligibleAnnexImages(['https://x/a.pdf'], null)).toEqual([]);
    expect(eligibleAnnexImages(null, null)).toEqual([]);
  });
});

describe('annexRowState', () => {
  it("'none' cuando la receta no tiene imágenes elegibles", () => {
    expect(annexRowState(['https://x/a.pdf'], null, [])).toEqual({
      state: 'none',
      selectedCount: 0,
      eligibleCount: 0,
    });
    expect(annexRowState(null, null, null).state).toBe('none');
  });
  it("'unreviewed' cuando hay foto elegible y 0 marcadas", () => {
    expect(annexRowState(['https://x/a.jpg'], null, [])).toEqual({
      state: 'unreviewed',
      selectedCount: 0,
      eligibleCount: 1,
    });
    expect(annexRowState(['https://x/a.jpg'], null, null).state).toBe('unreviewed');
  });
  it("'selected' cuando hay al menos una marcada (aunque falten otras)", () => {
    expect(
      annexRowState(['https://x/a.jpg', 'https://x/b.jpg'], null, ['https://x/a.jpg'])
    ).toEqual({ state: 'selected', selectedCount: 1, eligibleCount: 2 });
  });
});
