-- Migration: Add source tracking to guest_recipes
-- Purpose: Allow distinguishing between recipes added manually vs via collection link

ALTER TABLE public.guest_recipes
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'collection'));

COMMENT ON COLUMN public.guest_recipes.source IS 'Origin of the recipe entry: manual (added by host) or collection (submitted via shared link)';

-- Backfill existing rows with default if needed
UPDATE public.guest_recipes
SET source = 'manual'
WHERE source IS NULL;

