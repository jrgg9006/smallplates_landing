-- Migration: Fix waitlist conversion timing
-- Disables automatic waitlist conversion on profile creation
-- Conversion will now happen explicitly via API call after password completion

-- Update the trigger function to skip waitlist conversion
-- This preserves profile creation but removes automatic waitlist conversion
CREATE OR REPLACE FUNCTION update_waitlist_on_profile_create()
RETURNS TRIGGER AS $$
DECLARE
  user_metadata JSONB;
  waitlist_user_id UUID;
BEGIN
  -- Get user metadata from auth.users
  SELECT raw_user_meta_data INTO user_metadata
  FROM auth.users
  WHERE id = NEW.id;
  
  -- Check if user has waitlist_id in metadata (came from waitlist)
  IF user_metadata ? 'waitlist_id' THEN
    
    -- Extract waitlist_id from user metadata
    waitlist_user_id := (user_metadata->>'waitlist_id')::UUID;
    
    -- LOG ONLY - Don't automatically convert
    -- Conversion will happen via explicit API call after password completion
    RAISE NOTICE 'Profile created for waitlist user % - conversion will happen via API', waitlist_user_id;
    
    -- Note: We intentionally do NOT update the waitlist status here anymore
    -- The conversion will be handled by the /api/auth/complete-signup endpoint
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the function comment to reflect the new behavior
COMMENT ON FUNCTION update_waitlist_on_profile_create() IS 
  'Logs when profile is created for waitlist user but does not auto-convert. Conversion handled by API.';

-- The trigger itself remains the same, just the function behavior changed
-- So no need to recreate the trigger

-- Add a comment to document this change
COMMENT ON TRIGGER on_profile_created_update_waitlist ON public.profiles IS 
  'Logs profile creation for waitlist users. Actual conversion handled by /api/auth/complete-signup after password completion.';