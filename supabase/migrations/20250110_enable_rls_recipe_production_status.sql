-- Enable RLS on recipe_production_status
-- This table is admin-only, accessed via API routes using service_role
ALTER TABLE public.recipe_production_status ENABLE ROW LEVEL SECURITY;

-- Only service_role can access (admin operations via API routes)
CREATE POLICY "Service role has full access to recipe_production_status"
  ON public.recipe_production_status
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
