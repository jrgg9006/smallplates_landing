-- Migration: Enable recipes to belong to multiple groups
-- This migration creates a many-to-many relationship between recipes and groups
-- allowing a single recipe to be shared across multiple groups

-- Step 1: Create the join table for group_recipes relationship
CREATE TABLE IF NOT EXISTS public.group_recipes (
  -- Foreign keys forming composite primary key
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  recipe_id UUID NOT NULL REFERENCES public.guest_recipes(id) ON DELETE CASCADE,
  
  -- Track who added the recipe to the group and when
  added_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Additional metadata
  note TEXT, -- Optional note about why this recipe was added to the group
  
  -- Composite primary key ensures a recipe can only be added once per group
  PRIMARY KEY (group_id, recipe_id)
);

-- Add table comment
COMMENT ON TABLE public.group_recipes IS 'Many-to-many relationship between groups and recipes, allowing recipes to be shared in multiple groups';
COMMENT ON COLUMN public.group_recipes.group_id IS 'Foreign key to groups table';
COMMENT ON COLUMN public.group_recipes.recipe_id IS 'Foreign key to guest_recipes table';
COMMENT ON COLUMN public.group_recipes.added_by IS 'User who added the recipe to the group';
COMMENT ON COLUMN public.group_recipes.added_at IS 'Timestamp when the recipe was added to the group';
COMMENT ON COLUMN public.group_recipes.note IS 'Optional note about the recipe in this group context';

-- Step 2: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_group_recipes_group ON public.group_recipes(group_id);
CREATE INDEX IF NOT EXISTS idx_group_recipes_recipe ON public.group_recipes(recipe_id);
CREATE INDEX IF NOT EXISTS idx_group_recipes_added_by ON public.group_recipes(added_by);
CREATE INDEX IF NOT EXISTS idx_group_recipes_added_at ON public.group_recipes(added_at DESC);

-- Step 3: Enable Row Level Security
ALTER TABLE public.group_recipes ENABLE ROW LEVEL SECURITY;

-- Step 4: Create RLS policies for group_recipes

-- Users can view recipes in groups they are members of
CREATE POLICY "Users can view recipes in their groups"
  ON public.group_recipes
  FOR SELECT
  USING (
    group_id IN (
      SELECT group_id FROM public.group_members
      WHERE profile_id = auth.uid()
    )
  );

-- Group members can add recipes to the group
CREATE POLICY "Group members can add recipes to groups"
  ON public.group_recipes
  FOR INSERT
  WITH CHECK (
    -- Must be a member of the group
    group_id IN (
      SELECT group_id FROM public.group_members
      WHERE profile_id = auth.uid()
    )
    -- Must be adding as yourself
    AND added_by = auth.uid()
    -- Must own the recipe or it must be in a group you're a member of
    AND (
      recipe_id IN (
        SELECT id FROM public.guest_recipes
        WHERE user_id = auth.uid()
      )
      OR recipe_id IN (
        SELECT gr.id FROM public.guest_recipes gr
        JOIN public.group_recipes gr2 ON gr.id = gr2.recipe_id
        JOIN public.group_members gm ON gr2.group_id = gm.group_id
        WHERE gm.profile_id = auth.uid()
      )
    )
  );

-- Users who added a recipe or group admins/owners can remove recipes
CREATE POLICY "Users can remove recipes they added or admins can remove any"
  ON public.group_recipes
  FOR DELETE
  USING (
    -- User added this recipe
    added_by = auth.uid()
    OR
    -- User is a group admin or owner
    group_id IN (
      SELECT group_id FROM public.group_members
      WHERE profile_id = auth.uid() AND role IN ('admin', 'owner')
    )
  );

-- Group admins/owners can update recipe notes
CREATE POLICY "Group admins can update recipe notes"
  ON public.group_recipes
  FOR UPDATE
  USING (
    group_id IN (
      SELECT group_id FROM public.group_members
      WHERE profile_id = auth.uid() AND role IN ('admin', 'owner')
    )
  )
  WITH CHECK (
    group_id IN (
      SELECT group_id FROM public.group_members
      WHERE profile_id = auth.uid() AND role IN ('admin', 'owner')
    )
  );

-- Step 5: Migrate existing data from guest_recipes.group_id to the new join table
-- This preserves all existing group associations
INSERT INTO public.group_recipes (group_id, recipe_id, added_by, added_at, note)
SELECT 
  gr.group_id,
  gr.id as recipe_id,
  gr.user_id as added_by,
  gr.updated_at as added_at,
  'Migrated from single group association' as note
FROM public.guest_recipes gr
WHERE gr.group_id IS NOT NULL
ON CONFLICT (group_id, recipe_id) DO NOTHING;

-- Step 6: Create a view to simplify querying recipes with their groups
CREATE OR REPLACE VIEW public.recipe_groups_view AS
SELECT 
  gr.recipe_id,
  gr.group_id,
  g.name as group_name,
  gr.added_by,
  p.full_name as added_by_name,
  gr.added_at,
  gr.note
FROM public.group_recipes gr
JOIN public.groups g ON gr.group_id = g.id
JOIN public.profiles p ON gr.added_by = p.id;

-- Grant access to the view
GRANT SELECT ON public.recipe_groups_view TO authenticated;

-- Step 7: Create helper function to get all groups a recipe belongs to
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
  AND g.id IN (
    SELECT gm.group_id 
    FROM public.group_members gm 
    WHERE gm.profile_id = auth.uid()
  )
  ORDER BY rg.added_at DESC;
END;
$$;

-- Step 8: Create function to check if a recipe is in a specific group
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
  );
END;
$$;

-- Step 9: Update triggers to handle the new relationship
-- When a group is deleted, the CASCADE will automatically remove entries from group_recipes

-- Step 10: IMPORTANT - Remove the old group_id column from guest_recipes
-- This should be done AFTER updating the application code to use the new join table
-- Uncomment the following line when ready to remove the old column:
-- ALTER TABLE public.guest_recipes DROP COLUMN IF EXISTS group_id;

-- For now, we'll add a check constraint to prevent new direct group assignments
-- This will help catch any code still using the old pattern
ALTER TABLE public.guest_recipes 
ADD CONSTRAINT check_group_id_is_null 
CHECK (group_id IS NULL);

-- Add a comment explaining the migration
COMMENT ON CONSTRAINT check_group_id_is_null ON public.guest_recipes IS 
'Temporary constraint to ensure code is updated to use group_recipes join table instead of direct group_id';

-- Migration complete!
-- Next steps:
-- 1. Update application code to use the new group_recipes table
-- 2. Test thoroughly
-- 3. Remove the group_id column from guest_recipes table
-- 4. Drop the check constraint