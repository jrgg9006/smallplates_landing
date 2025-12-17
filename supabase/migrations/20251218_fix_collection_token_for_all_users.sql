-- Migration: Fix collection_link_token for all users
-- Date: 2025-12-18
-- Purpose: 
--   1. Ensure ALL new users (including Captains) get collection_link_token
--   2. Remove obsolete waitlist logic and references to deleted columns
--   3. Fix SQL errors from trying to insert into non-existent columns
--
-- Issues fixed:
--   - Regular users (non-waitlist) were not getting collection_link_token
--   - Function tried to insert recipe_goal_category, recipe_goal_number, use_case (columns don't exist)
--   - This caused Captains registered via group invitations to have NULL collection_link_token
--
-- Note: Group name "My First Cookbook" is kept as-is (placeholder group created by trigger).
--       The real group with couple names is created during onboarding via createUserProfileAdmin().

-- Update the handle_new_user function - SIMPLIFIED VERSION
-- Removed: waitlist logic, recipe_goal_category, recipe_goal_number, use_case
-- Reason: These fields were removed in migration 20250212_restructure_profiles_groups_tables.sql
-- Reason: Waitlist is no longer used - all users can access the platform directly
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_token TEXT;
  default_group_id UUID;
BEGIN
  -- Generate collection token for ALL users
  -- Reason: Every user needs collection_link_token to use "Collect Recipes" button
  BEGIN
    SELECT generate_collection_token() INTO new_token;
  EXCEPTION WHEN OTHERS THEN
    -- Fallback if generate_collection_token() fails
    new_token := 'col_' || substr(md5(random()::text || NEW.id::text), 1, 16);
  END;
  
  -- Create basic profile with collection token
  -- Only use fields that actually exist in the current schema
  INSERT INTO public.profiles (
    id, 
    email, 
    full_name,
    collection_link_token,
    collection_enabled
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    new_token,
    TRUE
  );
  
  -- Create default group for new user (placeholder - will be replaced during onboarding)
  -- The triggers will automatically create the cookbook and add user as owner
  -- Note: This is a placeholder group. The real group with couple names is created
  --       during onboarding via createUserProfileAdmin() in wedding-onboarding.ts
  BEGIN
    INSERT INTO public.groups (name, description, created_by, visibility)
    VALUES (
      'My First Cookbook',
      'Add recipes and invite friends to build your Cookbook',
      NEW.id,
      'private'
    )
    RETURNING id INTO default_group_id;
  EXCEPTION WHEN OTHERS THEN
    -- Log error but don't fail profile creation
    RAISE WARNING 'Failed to create default group for user %: %', NEW.id, SQLERRM;
  END;
  
  RAISE NOTICE 'Profile and default group created for user with collection token: %', new_token;
  RETURN NEW;
  
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.handle_new_user() IS 
  'Creates a profile record and default group when a new user signs up. ALL users get collection_link_token and collection_enabled=true. Every user gets a default placeholder group called "My First Cookbook". The real group with couple names is created during onboarding.';

-- Update existing users who don't have collection_link_token
-- This fixes existing Captains who registered before this migration
SELECT ensure_collection_tokens();
