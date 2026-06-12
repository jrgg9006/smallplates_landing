import { auditRecipe, type AuditInput } from './recipe-audit';

const base = (over: Partial<AuditInput>): AuditInput => ({
  hasPrintReady: true,
  isManualOriginal: false,
  original: { name: '', ingredients: '', instructions: '', note: null },
  clean: { name: '', ingredients: '', instructions: '', note: null },
  ...over,
});

describe('auditRecipe — deterministic content detection', () => {
  it('flags an added ingredient (invented by the cleaner)', () => {
    const a = auditRecipe(base({
      original: { name: 'Sopa', ingredients: '1 cebolla\n2 papas', instructions: 'Hervir.', note: null },
      clean: { name: 'Sopa', ingredients: '1 cebolla\n2 papas\n100 g de panko', instructions: 'Hervir.', note: null },
    }));
    expect(a.severity).toBe('content');
    expect(a.contentCount).toBe(1);
    expect(a.sections.find(s => s.section === 'ingredients')?.changes[0]).toMatchObject({
      kind: 'added', after: '100 g de panko',
    });
  });

  it('flags a changed quantity (3/4 -> 1/4)', () => {
    const a = auditRecipe(base({
      original: { name: 'X', ingredients: 'a', instructions: 'Verter 3/4 de la salsa.', note: null },
      clean: { name: 'X', ingredients: 'a', instructions: 'Verter 1/4 de la salsa.', note: null },
    }));
    expect(a.severity).toBe('content');
  });

  it('does NOT flag fraction glyph normalization (3/4 -> ¾)', () => {
    const a = auditRecipe(base({
      original: { name: 'X', ingredients: 'a', instructions: 'Verter 3/4 de la salsa.', note: null },
      clean: { name: 'X', ingredients: 'a', instructions: 'Verter ¾ de la salsa.', note: null },
    }));
    expect(a.severity).toBe('cosmetic');
    expect(a.contentCount).toBe(0);
  });

  it('does NOT flag capitalization or joined line breaks', () => {
    const a = auditRecipe(base({
      original: { name: 'X', ingredients: 'a', instructions: 'el filete debe estar parejo.\n\nbuen provecho', note: null },
      clean: { name: 'X', ingredients: 'a', instructions: 'El filete debe estar parejo. Buen provecho', note: null },
    }));
    expect(a.severity).toBe('cosmetic');
    expect(a.contentCount).toBe(0);
  });

  it('does NOT flag removal of authorized generic headers', () => {
    const a = auditRecipe(base({
      original: { name: 'X', ingredients: 'Ingredientes:\n1 cebolla', instructions: 'Procedimiento:\nHervir.', note: null },
      clean: { name: 'X', ingredients: '1 cebolla', instructions: 'Hervir.', note: null },
    }));
    expect(a.contentCount).toBe(0);
    expect(a.severity).toBe('cosmetic');
  });

  it('flags a removed portion note', () => {
    const a = auditRecipe(base({
      original: { name: 'X', ingredients: '1 cebolla\n(4 personas)', instructions: 'Hervir.', note: null },
      clean: { name: 'X', ingredients: '1 cebolla', instructions: 'Hervir.', note: null },
    }));
    expect(a.severity).toBe('content');
    expect(a.sections.find(s => s.section === 'ingredients')?.changes[0]).toMatchObject({
      kind: 'removed', before: '4 personas',
    });
  });

  it('returns manual when original is an image/paste', () => {
    const a = auditRecipe(base({ isManualOriginal: true }));
    expect(a.severity).toBe('manual');
  });

  it('returns no-clean when there is no print-ready version', () => {
    const a = auditRecipe(base({ hasPrintReady: false }));
    expect(a.severity).toBe('no-clean');
  });

  it('reports identical when only whitespace differs but content matches', () => {
    const a = auditRecipe(base({
      original: { name: 'Tarta', ingredients: '1 huevo\n2 tazas', instructions: 'Mezclar todo bien.', note: null },
      clean: { name: 'Tarta', ingredients: '1 huevo\n2 tazas', instructions: 'Mezclar todo bien.', note: null },
    }));
    expect(a.severity).toBe('identical');
  });
});
