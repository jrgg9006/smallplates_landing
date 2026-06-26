import {
  annexLocalImagePath,
  buildAnnexPipelinePlan,
  type AnnexPipelineRow,
} from './pipeline';

describe('annexLocalImagePath', () => {
  it('builds the package-local path under image_assets/{group}/annex', () => {
    expect(annexLocalImagePath('G1', 'R1', 0)).toBe('image_assets/G1/annex/R1_0.png');
    expect(annexLocalImagePath('G1', 'R1', 2)).toBe('image_assets/G1/annex/R1_2.png');
  });
});

describe('buildAnnexPipelinePlan', () => {
  const groupId = 'G1';

  it('returns an empty plan when there are no rows (zero-regression gate)', () => {
    const plan = buildAnnexPipelinePlan([], groupId);
    expect(plan.byRecipe.size).toBe(0);
    expect(plan.downloads).toEqual([]);
  });

  it('only includes rows that are ready AND have a usable url', () => {
    const rows: AnnexPipelineRow[] = [
      { recipe_id: 'R1', position: 0, print_url: 'https://x/p0.png', original_url: 'https://x/s0.png', upscale_status: 'ready' },
      { recipe_id: 'R1', position: 1, print_url: null, original_url: null, upscale_status: 'ready' }, // no url -> skip
      { recipe_id: 'R2', position: 0, print_url: 'https://x/r2.png', original_url: null, upscale_status: 'pending' }, // not ready -> skip
      { recipe_id: 'R3', position: 0, print_url: null, original_url: null, upscale_status: 'error' }, // skip
    ];
    const plan = buildAnnexPipelinePlan(rows, groupId);
    expect([...plan.byRecipe.keys()]).toEqual(['R1']);
    expect(plan.byRecipe.get('R1')).toEqual([
      { local_image_path: 'image_assets/G1/annex/R1_0.png', position: 0 },
    ]);
    expect(plan.downloads).toEqual([
      { url: 'https://x/p0.png', localImagePath: 'image_assets/G1/annex/R1_0.png' },
    ]);
  });

  it('prefers print_url and falls back to original_url', () => {
    const rows: AnnexPipelineRow[] = [
      { recipe_id: 'R1', position: 0, print_url: null, original_url: 'https://x/src.png', upscale_status: 'ready' },
    ];
    const plan = buildAnnexPipelinePlan(rows, groupId);
    expect(plan.downloads[0].url).toBe('https://x/src.png');
  });

  it('groups multiple images per recipe ordered by position', () => {
    const rows: AnnexPipelineRow[] = [
      { recipe_id: 'R1', position: 2, print_url: 'https://x/p2.png', original_url: null, upscale_status: 'ready' },
      { recipe_id: 'R1', position: 0, print_url: 'https://x/p0.png', original_url: null, upscale_status: 'ready' },
      { recipe_id: 'R1', position: 1, print_url: 'https://x/p1.png', original_url: null, upscale_status: 'ready' },
    ];
    const plan = buildAnnexPipelinePlan(rows, groupId);
    expect(plan.byRecipe.get('R1')).toEqual([
      { local_image_path: 'image_assets/G1/annex/R1_0.png', position: 0 },
      { local_image_path: 'image_assets/G1/annex/R1_1.png', position: 1 },
      { local_image_path: 'image_assets/G1/annex/R1_2.png', position: 2 },
    ]);
  });
});
