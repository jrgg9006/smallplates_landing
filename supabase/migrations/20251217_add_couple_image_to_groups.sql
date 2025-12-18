-- Add couple image functionality to groups table
-- Date: 2025-12-17
-- Description: Add couple_image_url field to store couple photos for recipe collection display

-- Add couple image URL column to groups table
ALTER TABLE public.groups 
ADD COLUMN IF NOT EXISTS couple_image_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.groups.couple_image_url IS 'URL to the couple image stored in Supabase storage for this group/cookbook';

-- Create index for faster lookups when fetching group data
CREATE INDEX IF NOT EXISTS idx_groups_couple_image ON public.groups(couple_image_url) WHERE couple_image_url IS NOT NULL;