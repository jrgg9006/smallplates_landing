-- Remove the temporary constraint that prevents group_id from being set
-- This constraint was added during the many-to-many migration but should be removed
-- to allow collection links to properly associate recipes with groups

-- Drop the check constraint that forces group_id to be NULL
ALTER TABLE public.guest_recipes 
DROP CONSTRAINT IF EXISTS check_group_id_is_null;

-- Add comment explaining the change
COMMENT ON COLUMN public.guest_recipes.group_id IS 
'Foreign key to groups table for recipes shared within a group context (e.g., collection links)';