-- Migration: Add collection functionality to existing schema
-- Date: 2024-10-09
-- Description: Add collection tokens and source tracking for recipe collection feature

-- Add collection token functionality to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS collection_link_token TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS collection_enabled BOOLEAN DEFAULT true;

-- Add source tracking to guests table to distinguish manual vs collection entries
ALTER TABLE public.guests 
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'collection'));

-- Create index for fast token lookups
CREATE INDEX IF NOT EXISTS idx_profiles_collection_token ON public.profiles(collection_link_token);

-- Create index for guest source filtering
CREATE INDEX IF NOT EXISTS idx_guests_source ON public.guests(source);

-- Add comments for documentation
COMMENT ON COLUMN public.profiles.collection_link_token IS 'Unique token for recipe collection link sharing';
COMMENT ON COLUMN public.profiles.collection_enabled IS 'Whether recipe collection is enabled for this user';
COMMENT ON COLUMN public.guests.source IS 'How this guest was added: manual (by user) or collection (via recipe submission)';

-- Drop existing function if it exists (in case it has the old base64url code)
DROP FUNCTION IF EXISTS generate_collection_token();

-- Function to generate secure collection tokens
CREATE OR REPLACE FUNCTION generate_collection_token()
RETURNS TEXT AS $$
BEGIN
  -- Generate a secure random token (32 characters, URL-safe)
  RETURN translate(encode(gen_random_bytes(24), 'base64'), '+/', '-_');
END;
$$ LANGUAGE plpgsql;

-- Function to ensure all users have collection tokens
CREATE OR REPLACE FUNCTION ensure_collection_tokens()
RETURNS VOID AS $$
BEGIN
  -- Update existing users who don't have tokens
  UPDATE public.profiles 
  SET collection_link_token = generate_collection_token()
  WHERE collection_link_token IS NULL;
END;
$$ LANGUAGE plpgsql;

-- Generate tokens for existing users
SELECT ensure_collection_tokens();

-- Note: RLS policies for profiles table are already defined in 20241009_rls_policies.sql
-- The existing policies already cover access to collection_link_token and collection_enabled columns