-- Migration: Update RPC functions to filter by removed_at for soft delete
-- This ensures that removed recipes are not shown in group listings

-- Update get_recipe_groups to only return active group associations
CREATE OR REPLACE FUNCTION get_recipe_groups(p_recipe_id UUID)
RETURNS TABLE (
  group_id UUID,
  group_name TEXT,
  added_at TIMESTAMPTZ,
  added_by_name TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    rg.group_id,
    g.name as group_name,
    rg.added_at,
    p.full_name as added_by_name
  FROM public.group_recipes rg
  JOIN public.groups g ON rg.group_id = g.id
  JOIN public.profiles p ON rg.added_by = p.id
  WHERE rg.recipe_id = p_recipe_id
  AND rg.removed_at IS NULL  -- Only show active associations
  AND g.id IN (
    SELECT gm.group_id 
    FROM public.group_members gm 
    WHERE gm.profile_id = auth.uid()
  )
  ORDER BY rg.added_at DESC;
END;
$$;

-- Update is_recipe_in_group to only check active associations
CREATE OR REPLACE FUNCTION is_recipe_in_group(p_recipe_id UUID, p_group_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.group_recipes 
    WHERE recipe_id = p_recipe_id 
    AND group_id = p_group_id
    AND removed_at IS NULL  -- Only check active associations
  );
END;
$$;
