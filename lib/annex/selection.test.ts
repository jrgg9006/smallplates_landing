import { isAnnexEligibleUrl, isValidAnnexSource, nextAnnexPosition } from './selection';

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
