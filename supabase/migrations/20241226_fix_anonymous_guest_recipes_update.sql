-- Fix: Add UPDATE policy for anonymous users on guest_recipes table
-- This allows the collection flow to update document_urls after file upload

-- Allow anonymous users to update guest recipes for collection
-- This enables updating document_urls after image upload in the collection flow
CREATE POLICY "Anonymous users can update guest recipes for collection" 
  ON public.guest_recipes 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = guest_recipes.user_id 
      AND p.collection_enabled = true 
      AND p.collection_link_token IS NOT NULL
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = guest_recipes.user_id 
      AND p.collection_enabled = true 
      AND p.collection_link_token IS NOT NULL
    )
  );

COMMENT ON POLICY "Anonymous users can update guest recipes for collection" ON public.guest_recipes IS 
  'Allows anonymous users to update recipes (e.g., set document_urls after file upload) for collections that are enabled.';