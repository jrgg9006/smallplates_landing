/**
 * Pre-submit check: does the uploaded photo actually contain a written recipe?
 *
 * Guests often upload a picture of the finished dish instead of the recipe card.
 * This asks the AI engine for an opinion so we can warn them while they are still
 * on the page. It is advice, never a gate: every failure mode returns null and the
 * caller submits exactly as it does today.
 */

export interface PhotoRecipeCheckResult {
  has_recipe: boolean;
  recipe_likelihood: number;
  reason: string;
}

const CHECK_ENDPOINT = '/api/v1/ai-engine/check-recipe-photo';
const CHECK_TIMEOUT_MS = 5000;
const MAX_IMAGES = 10;

/**
 * Reason: the Railway endpoint is not deployed yet (phase 3 of the hand-off).
 * While this is non-null the check never touches the network and returns this
 * canned answer, so the whole UI can be exercised. Set to null to go live.
 */
const STUB_RESPONSE: PhotoRecipeCheckResult | null = {
  has_recipe: false,
  recipe_likelihood: 10,
  reason: 'stubbed response: finished dish, no recipe text',
};

/**
 * Returns the engine's opinion, or null when we could not get one.
 * null means "proceed silently" — it is indistinguishable from has_recipe: true.
 */
export async function checkPhotoHasRecipe(
  imageUrls: string[]
): Promise<PhotoRecipeCheckResult | null> {
  if (!imageUrls.length) return null;

  if (STUB_RESPONSE) return STUB_RESPONSE;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), CHECK_TIMEOUT_MS);

  try {
    const response = await fetch(CHECK_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image_urls: imageUrls.slice(0, MAX_IMAGES) }),
      signal: controller.signal,
    });

    if (!response.ok) return null;

    const data: unknown = await response.json();
    if (typeof data !== 'object' || data === null) return null;

    const parsed = data as Partial<PhotoRecipeCheckResult>;
    if (typeof parsed.has_recipe !== 'boolean') return null;

    return {
      has_recipe: parsed.has_recipe,
      recipe_likelihood: typeof parsed.recipe_likelihood === 'number' ? parsed.recipe_likelihood : -1,
      reason: typeof parsed.reason === 'string' ? parsed.reason : '',
    };
  } catch {
    // Reason: timeout, network error, bad JSON — all fail open. The guest never
    // sees an error about the check itself.
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}
