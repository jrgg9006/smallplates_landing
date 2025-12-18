-- Add dashboard image functionality to groups table
-- Date: 2025-12-18
-- Description: Add image_group_dashboard field to store dashboard photos for group pages

-- Add dashboard image URL column to groups table
ALTER TABLE public.groups 
ADD COLUMN IF NOT EXISTS image_group_dashboard TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.groups.image_group_dashboard IS 'URL to the dashboard image stored in Supabase storage for this group''s main page';

-- Create index for faster lookups when fetching group data
CREATE INDEX IF NOT EXISTS idx_groups_dashboard_image ON public.groups(image_group_dashboard) WHERE image_group_dashboard IS NOT NULL;