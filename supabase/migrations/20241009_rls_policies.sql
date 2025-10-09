-- Enable Row Level Security on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guest_recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communication_log ENABLE ROW LEVEL SECURITY;

-- Profiles table policies
-- Users can only view their own profile
CREATE POLICY "Users can view own profile" 
  ON public.profiles 
  FOR SELECT 
  USING (auth.uid() = id);

-- Users can only update their own profile
CREATE POLICY "Users can update own profile" 
  ON public.profiles 
  FOR UPDATE 
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Users can insert their own profile (happens during signup)
CREATE POLICY "Users can insert own profile" 
  ON public.profiles 
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Guests table policies
-- Users can only view their own guests (including archived)
CREATE POLICY "Users can view own guests" 
  ON public.guests 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Users can only insert guests for themselves
CREATE POLICY "Users can insert own guests" 
  ON public.guests 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Users can only update their own guests
CREATE POLICY "Users can update own guests" 
  ON public.guests 
  FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can only delete (archive) their own guests
CREATE POLICY "Users can delete own guests" 
  ON public.guests 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Guest recipes table policies
-- Users can view recipes from their own guests
CREATE POLICY "Users can view own guest recipes" 
  ON public.guest_recipes 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Users can insert recipes for their own guests
CREATE POLICY "Users can insert own guest recipes" 
  ON public.guest_recipes 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Users can update recipes from their own guests
CREATE POLICY "Users can update own guest recipes" 
  ON public.guest_recipes 
  FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete recipes from their own guests
CREATE POLICY "Users can delete own guest recipes" 
  ON public.guest_recipes 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Communication log table policies
-- Users can only view their own communication logs
CREATE POLICY "Users can view own communication logs" 
  ON public.communication_log 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Users can only insert their own communication logs
CREATE POLICY "Users can insert own communication logs" 
  ON public.communication_log 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Users can only update their own communication logs
CREATE POLICY "Users can update own communication logs" 
  ON public.communication_log 
  FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Note: Typically you wouldn't allow deletion of communication logs for audit purposes
-- But if needed, uncomment below:
-- CREATE POLICY "Users can delete own communication logs" 
--   ON public.communication_log 
--   FOR DELETE 
--   USING (auth.uid() = user_id);

-- Additional security policies for guest public access (for recipe submission forms)
-- This allows guests to submit recipes via a public form with a special token
-- You would generate a unique token per guest and include it in the invitation email

-- Create a function to validate guest tokens (to be implemented based on your token strategy)
-- For now, we'll comment this out as it requires additional implementation
-- CREATE OR REPLACE FUNCTION public.validate_guest_token(guest_email TEXT, token TEXT)
-- RETURNS BOOLEAN AS $$
-- BEGIN
--   -- Implement your token validation logic here
--   RETURN FALSE;
-- END;
-- $$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policy to allow guests to insert their own recipes with valid token
-- CREATE POLICY "Guests can submit recipes with valid token"
--   ON public.guest_recipes
--   FOR INSERT
--   WITH CHECK (
--     EXISTS (
--       SELECT 1 FROM public.guests g
--       WHERE g.id = guest_id
--       AND public.validate_guest_token(g.email, current_setting('app.guest_token', TRUE))
--     )
--   );