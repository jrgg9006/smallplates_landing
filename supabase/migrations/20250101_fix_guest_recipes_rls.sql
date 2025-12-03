-- Fix RLS policy for guest_recipes to properly check the user_id being inserted
-- The issue: the old policy checked p.id = user_id which is ambiguous
-- The fix: explicitly check against the NEW row's user_id column

-- Drop the old policy
DROP POLICY IF EXISTS "Anonymous users can submit guest recipes for collection" ON public.guest_recipes;

-- Create new policy with explicit column reference
CREATE POLICY "Anonymous users can submit guest recipes for collection" 
  ON public.guest_recipes 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = guest_recipes.user_id  -- Explicitly reference the column being inserted
      AND p.collection_enabled = true 
      AND p.collection_link_token IS NOT NULL
    )
  );

COMMENT ON POLICY "Anonymous users can submit guest recipes for collection" ON public.guest_recipes IS 
  'Allows anonymous users to insert recipes for collections that are enabled. Fixed to properly reference NEW row user_id.';

