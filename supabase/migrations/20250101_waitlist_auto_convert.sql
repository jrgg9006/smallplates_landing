-- Migration: Auto-convert waitlist status when user profile is created/updated
-- This is a simpler approach that uses a trigger on the profiles table instead of auth.users
-- When a profile is created for a user who came from waitlist, update their waitlist status

-- Create function to update waitlist status when profile is created
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
    
    -- Update waitlist status to 'converted'
    UPDATE public.waitlist
    SET 
      status = 'converted',
      converted_at = NOW(),
      updated_at = NOW()
    WHERE id = waitlist_user_id
      AND status = 'invited'; -- Only update if currently 'invited'
    
    RAISE NOTICE 'Waitlist user % converted to full user', waitlist_user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_profile_created_update_waitlist ON public.profiles;

-- Create trigger on profiles table
CREATE TRIGGER on_profile_created_update_waitlist
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_waitlist_on_profile_create();

COMMENT ON FUNCTION update_waitlist_on_profile_create() IS 
  'Automatically updates waitlist status to converted when a profile is created for an invited user';

COMMENT ON TRIGGER on_profile_created_update_waitlist ON public.profiles IS 
  'Triggers waitlist status update when profile is created for user from waitlist';

