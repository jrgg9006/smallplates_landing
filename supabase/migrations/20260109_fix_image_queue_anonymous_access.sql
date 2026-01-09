-- Add anonymous access for image_processing_queue
-- This replicates the same pattern used for guest_recipes
-- Allows users with valid collection tokens to insert images for processing

-- Allow anonymous users to insert into image_processing_queue for collection
-- This enables image processing for anonymous users with valid collection tokens
CREATE POLICY "Anonymous users can insert to image queue for collection" 
  ON public.image_processing_queue
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.guest_recipes gr
      JOIN public.profiles p ON p.id = gr.user_id
      WHERE gr.id = recipe_id
      AND p.collection_enabled = true 
      AND p.collection_link_token IS NOT NULL
    )
  );