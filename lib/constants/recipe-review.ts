// Single source of truth for recipe-review thresholds shared across the
// admin Operations screen and the user dashboard.

// Reason: mirrors the backend RECIPE_LIKELIHOOD_THRESHOLD (api.py). A
// guest_recipes.recipe_likelihood below this means the upload probably isn't a
// recipe (invoice, document, photo of just the dish). Independent of
// confidence_score (read quality) and needs_review (OCR/edit flags) — an invoice
// can read at 100 confidence but score 0 likelihood. Heads-up only, never blocks.
// Note: the backend keeps its own copy of this 30 (separate repo) — see backlog D2.
export const RECIPE_LIKELIHOOD_THRESHOLD = 30;
