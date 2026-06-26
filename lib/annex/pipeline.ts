// M3 pipeline glue: turns the book's "ready" annex rows into (a) per-recipe
// `annex_images` blocks for the book JSON and (b) a flat download list for the
// package zip. Pure + tested so the package route and fetch-book.js agree exactly.
//
// Zero-regression: a book with no ready originals yields an empty plan, so the
// caller adds no `annex_images` key and the JSON is byte-identical to today.

export interface AnnexPipelineRow {
  recipe_id: string;
  position: number;
  print_url: string | null;
  original_url: string | null;
  upscale_status: string | null;
}

export interface AnnexImageBlock {
  local_image_path: string;
  position: number;
}

export interface AnnexPipelinePlan {
  /** recipeId -> ordered annex_images blocks (only recipes that have originals). */
  byRecipe: Map<string, AnnexImageBlock[]>;
  /** Flat list of files to download into the package, in (recipe, position) order. */
  downloads: { url: string; localImagePath: string }[];
}

/** Package-local path for an annex image inside the zip. */
export function annexLocalImagePath(groupId: string, recipeId: string, position: number): string {
  return `image_assets/${groupId}/annex/${recipeId}_${position}.png`;
}

export function buildAnnexPipelinePlan(
  rows: AnnexPipelineRow[],
  groupId: string
): AnnexPipelinePlan {
  const byRecipe = new Map<string, AnnexImageBlock[]>();
  const downloads: { url: string; localImagePath: string }[] = [];

  // Reason: only fully-processed originals belong in the print package. print_url
  // is the upscaled output; fall back to original_url (normalized PNG) just in case.
  const usable = rows
    .filter((r) => r.upscale_status === 'ready' && (r.print_url || r.original_url))
    .sort((a, b) => a.recipe_id.localeCompare(b.recipe_id) || a.position - b.position);

  for (const row of usable) {
    const url = (row.print_url || row.original_url) as string;
    const localImagePath = annexLocalImagePath(groupId, row.recipe_id, row.position);
    const block = { local_image_path: localImagePath, position: row.position };

    const existing = byRecipe.get(row.recipe_id);
    if (existing) existing.push(block);
    else byRecipe.set(row.recipe_id, [block]);

    downloads.push({ url, localImagePath });
  }

  return { byRecipe, downloads };
}
