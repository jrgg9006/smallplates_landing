import { getRecipeViewState, CLEANING_TIMEOUT_MS } from './cleanVersionState';

const CREATED = '2026-06-16T00:00:00.000Z';
const createdMs = new Date(CREATED).getTime();

describe('getRecipeViewState', () => {
  it('returns "cleaned" whenever a print_ready row exists, regardless of time', () => {
    expect(getRecipeViewState({ hasPrintReady: true, recipeCreatedAt: CREATED, now: createdMs })).toBe('cleaned');
    expect(getRecipeViewState({ hasPrintReady: true, recipeCreatedAt: CREATED, now: createdMs + 10 * 60_000 })).toBe('cleaned');
  });

  it('returns "processing" when no print_ready and within the timeout window', () => {
    expect(getRecipeViewState({ hasPrintReady: false, recipeCreatedAt: CREATED, now: createdMs + 5_000 })).toBe('processing');
  });

  it('returns "fallback" when no print_ready and the timeout has elapsed', () => {
    expect(getRecipeViewState({ hasPrintReady: false, recipeCreatedAt: CREATED, now: createdMs + CLEANING_TIMEOUT_MS })).toBe('fallback');
    expect(getRecipeViewState({ hasPrintReady: false, recipeCreatedAt: CREATED, now: createdMs + 10 * 60_000 })).toBe('fallback');
  });

  it('treats the exact timeout boundary as fallback (>=)', () => {
    expect(getRecipeViewState({ hasPrintReady: false, recipeCreatedAt: CREATED, now: createdMs + CLEANING_TIMEOUT_MS - 1 })).toBe('processing');
    expect(getRecipeViewState({ hasPrintReady: false, recipeCreatedAt: CREATED, now: createdMs + CLEANING_TIMEOUT_MS })).toBe('fallback');
  });
});
