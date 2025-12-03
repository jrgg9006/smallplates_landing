-- Diagnose and fix RLS policies for guest_recipes
-- This will show all current policies and then fix them

-- First, let's see what policies exist (run this first to diagnose)
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'guest_recipes';

-- Now let's drop ALL existing policies and recreate them correctly
DROP POLICY IF EXISTS "Users can view own guest recipes" ON public.guest_recipes;
DROP POLICY IF EXISTS "Users can insert own guest recipes" ON public.guest_recipes;
DROP POLICY IF EXISTS "Users can update own guest recipes" ON public.guest_recipes;
DROP POLICY IF EXISTS "Users can delete own guest recipes" ON public.guest_recipes;
DROP POLICY IF EXISTS "Anonymous users can submit guest recipes for collection" ON public.guest_recipes;

-- Policy 1: Authenticated users can view their own guest recipes
CREATE POLICY "Users can view own guest recipes" 
  ON public.guest_recipes 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Policy 2: Authenticated users can insert recipes for their own guests
-- This policy uses OR logic: either you're the authenticated owner, OR it's a valid collection submission
CREATE POLICY "Users can insert recipes" 
  ON public.guest_recipes 
  FOR INSERT 
  WITH CHECK (
    -- Either: user is authenticated and it's their recipe
    (auth.uid() IS NOT NULL AND auth.uid() = user_id)
    OR
    -- Or: user is anonymous and it's for a valid collection
    (auth.uid() IS NULL AND EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = guest_recipes.user_id
      AND p.collection_enabled = true 
      AND p.collection_link_token IS NOT NULL
    ))
  );

-- Policy 3: Authenticated users can update their own guest recipes
CREATE POLICY "Users can update own guest recipes" 
  ON public.guest_recipes 
  FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy 4: Authenticated users can delete their own guest recipes
CREATE POLICY "Users can delete own guest recipes" 
  ON public.guest_recipes 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Add helpful comments
COMMENT ON POLICY "Users can insert recipes" ON public.guest_recipes IS 
  'Allows both authenticated users to insert their own recipes AND anonymous users to submit via collection links';

