// Reason: the existence of a recipe_print_ready row is the only signal that
// cleaning finished. We never need a separate "processing started" timestamp —
// the recipe's created_at bounds the wait. An old, never-cleaned recipe lands
// straight in "fallback" (no spinner), which is what we want.
export type RecipeViewState = 'cleaned' | 'processing' | 'fallback';

export const CLEANING_TIMEOUT_MS = 60_000;

export function getRecipeViewState(params: {
  hasPrintReady: boolean;
  recipeCreatedAt: string; // ISO timestamp from guest_recipes.created_at
  now: number; // Date.now()
  timeoutMs?: number;
}): RecipeViewState {
  const { hasPrintReady, recipeCreatedAt, now, timeoutMs = CLEANING_TIMEOUT_MS } = params;
  if (hasPrintReady) return 'cleaned';
  const elapsed = now - new Date(recipeCreatedAt).getTime();
  return elapsed < timeoutMs ? 'processing' : 'fallback';
}
