-- Add column for pre-processed Open Graph image URL.
-- Reason: WhatsApp/Meta crawlers time out on the live /api/og-image proxy
-- (cold start + Supabase fetch + sharp ~5-10s); they cache failures with
-- no retry. Pre-generating a 1200x630 JPEG <300KB at upload time and
-- serving it directly eliminates the on-demand path. NULL on legacy rows
-- triggers fallback to the proxy in generateMetadata.
ALTER TABLE groups
ADD COLUMN IF NOT EXISTS couple_image_og_url TEXT;

COMMENT ON COLUMN groups.couple_image_og_url IS
  'Pre-processed 1200x630 JPEG (<300KB) for WhatsApp/Meta OG previews. '
  'Generated on couple image upload or position change. NULL for legacy '
  'groups; falls back to /api/og-image proxy.';
