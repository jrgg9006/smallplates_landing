// Storage paths for annex images in the `recipes` bucket. Kept pure + tested so the
// upscale route, the Edge Function and the print pipeline all agree on exactly where
// normalized and print-ready files live.

/** Normalized PNG (sharp output) that gets fed to Replicate. */
export function annexSrcStoragePath(groupId: string, recipeId: string, position: number): string {
  return `print/annex/${groupId}/${recipeId}_${position}_src.png`;
}

/** Upscaled PNG (Real-ESRGAN output) consumed by the print pipeline (M3). */
export function annexPrintStoragePath(groupId: string, recipeId: string, position: number): string {
  return `print/annex/${groupId}/${recipeId}_${position}.png`;
}

// Reason: a row is (re)queued only when it was never processed or previously errored —
// never when it's already in flight ('pending'/'processing') or done ('ready').
export function shouldQueueForUpscale(status: string | null): boolean {
  return status === null || status === 'error';
}

/** Non-terminal states the front-end polls on. */
export function isAnnexProcessing(status: string | null): boolean {
  return status === 'pending' || status === 'processing';
}
