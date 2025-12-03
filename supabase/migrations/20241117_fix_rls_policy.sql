-- Fix the circular reference in group_recipes RLS policy

-- Drop the problematic policy
DROP POLICY IF EXISTS "Group members can add recipes to groups" ON public.group_recipes;

-- Create a simpler, non-recursive policy
-- Group members can add recipes to the group if they own the recipe
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
    -- Must own the recipe
    AND recipe_id IN (
      SELECT id FROM public.guest_recipes
      WHERE user_id = auth.uid()
    )
  );

-- Note: This simplified policy only allows users to add their own recipes to groups.
-- If you need to allow sharing other people's recipes, we can add that functionality
-- through the application layer instead of the database policy.