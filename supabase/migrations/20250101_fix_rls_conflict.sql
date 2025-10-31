-- Fix RLS policy conflict for guest_recipes
-- Problem: The policy "Users can insert own guest recipes" blocks anonymous users
-- Solution: Make the authenticated user policy NOT apply to collection submissions

-- Drop the conflicting policy
DROP POLICY IF EXISTS "Users can insert own guest recipes" ON public.guest_recipes;

-- Recreate it to ONLY apply when user is authenticated (not for anonymous collection submissions)
CREATE POLICY "Users can insert own guest recipes" 
  ON public.guest_recipes 
  FOR INSERT 
  WITH CHECK (
    auth.uid() IS NOT NULL  -- Only apply this policy if user is authenticated
    AND auth.uid() = user_id
  );

-- Ensure the anonymous policy exists and is correct
DROP POLICY IF EXISTS "Anonymous users can submit guest recipes for collection" ON public.guest_recipes;

CREATE POLICY "Anonymous users can submit guest recipes for collection" 
  ON public.guest_recipes 
  FOR INSERT 
  WITH CHECK (
    auth.uid() IS NULL  -- Only apply this policy if user is anonymous
    AND EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = guest_recipes.user_id
      AND p.collection_enabled = true 
      AND p.collection_link_token IS NOT NULL
    )
  );

COMMENT ON POLICY "Users can insert own guest recipes" ON public.guest_recipes IS 
  'Allows authenticated users to insert recipes for their own guests only';

COMMENT ON POLICY "Anonymous users can submit guest recipes for collection" ON public.guest_recipes IS 
  'Allows anonymous users to insert recipes for collections that are enabled';

