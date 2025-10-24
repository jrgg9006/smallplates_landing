-- Add anonymous access policies for recipe collection feature
-- This allows guests (non-authenticated users) to use collection links

-- Allow anonymous users to read profiles with valid collection tokens
-- This enables validateCollectionToken() to work for anonymous users
CREATE POLICY "Anonymous users can read profiles for collection" 
  ON public.profiles 
  FOR SELECT 
  USING (collection_enabled = true AND collection_link_token IS NOT NULL);

-- Allow anonymous users to read guests for collection search
-- This enables searchGuestInCollection() to work for anonymous users
CREATE POLICY "Anonymous users can read guests for collection" 
  ON public.guests 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = user_id 
      AND p.collection_enabled = true 
      AND p.collection_link_token IS NOT NULL
    )
  );

-- Allow anonymous users to insert guests for collection
-- This enables creating new guest records during recipe submission
CREATE POLICY "Anonymous users can create guests for collection" 
  ON public.guests 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = user_id 
      AND p.collection_enabled = true 
      AND p.collection_link_token IS NOT NULL
    )
  );

-- Allow anonymous users to insert guest recipes for collection
-- This enables recipe submission for anonymous users
CREATE POLICY "Anonymous users can submit guest recipes for collection" 
  ON public.guest_recipes 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = user_id 
      AND p.collection_enabled = true 
      AND p.collection_link_token IS NOT NULL
    )
  );

-- Allow anonymous users to update guests (for recipe submission flow)
-- This enables updating guest information during the submission process
CREATE POLICY "Anonymous users can update guests for collection" 
  ON public.guests 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = user_id 
      AND p.collection_enabled = true 
      AND p.collection_link_token IS NOT NULL
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = user_id 
      AND p.collection_enabled = true 
      AND p.collection_link_token IS NOT NULL
    )
  );