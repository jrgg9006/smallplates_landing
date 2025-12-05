-- Migration: Add default group creation for new users
-- This ensures every new user automatically gets a default group called "My First Book"
-- when they create their account for the first time

-- Update the handle_new_user function to create a default group
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_token TEXT;
  recipe_goal_num INTEGER;
  waitlist_data RECORD;
  has_waitlist_id BOOLEAN;
  default_group_id UUID;
BEGIN
  -- Safely check if user came from waitlist (has waitlist_id in metadata)
  has_waitlist_id := (NEW.raw_user_meta_data ? 'waitlist_id');
  
  IF has_waitlist_id THEN
    BEGIN
      -- Get waitlist user data
      SELECT * INTO waitlist_data
      FROM public.waitlist
      WHERE id = (NEW.raw_user_meta_data->>'waitlist_id')::UUID;
      
      -- If waitlist data was found, create enhanced profile
      IF FOUND THEN
        -- Generate collection token
        BEGIN
          SELECT generate_collection_token() INTO new_token;
        EXCEPTION WHEN OTHERS THEN
          new_token := NULL;
        END;
        
        IF new_token IS NULL THEN
          new_token := 'col_' || substr(md5(random()::text), 1, 9);
        END IF;
        
        -- Calculate recipe goal number
        recipe_goal_num := CASE
          WHEN waitlist_data.recipe_goal_category = '40-or-less' THEN 40
          WHEN waitlist_data.recipe_goal_category = '40-60' THEN 60
          WHEN waitlist_data.recipe_goal_category = '60-or-more' THEN 80
          ELSE 40
        END;
        
        -- Create profile with complete waitlist data
        INSERT INTO public.profiles (
          id, 
          email, 
          full_name,
          recipe_goal_category,
          recipe_goal_number,
          use_case,
          collection_link_token,
          collection_enabled
        )
        VALUES (
          NEW.id,
          NEW.email,
          COALESCE(NEW.raw_user_meta_data->>'full_name', waitlist_data.first_name || ' ' || waitlist_data.last_name),
          waitlist_data.recipe_goal_category,
          recipe_goal_num,
          waitlist_data.use_case,
          new_token,
          TRUE
        );
        
        -- Create default group for new user
        -- The triggers will automatically create the cookbook and add user as owner
        BEGIN
          INSERT INTO public.groups (name, description, created_by, visibility)
          VALUES (
            'My First Book',
            'Add recipes and invite friends to build your book',
            NEW.id,
            'private'
          )
          RETURNING id INTO default_group_id;
        EXCEPTION WHEN OTHERS THEN
          -- Log error but don't fail profile creation
          RAISE WARNING 'Failed to create default group for user %: %', NEW.id, SQLERRM;
        END;
        
        RAISE NOTICE 'Profile and default group created for waitlist user with collection token: %', new_token;
        RETURN NEW;
      END IF;
      
    EXCEPTION WHEN OTHERS THEN
      -- If anything fails with waitlist, fall back to basic profile
      RAISE WARNING 'Error processing waitlist user, creating basic profile: %', SQLERRM;
    END;
  END IF;
  
  -- Regular user (not from waitlist) OR fallback - create basic profile
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', '')
  );
  
  -- Create default group for new user
  -- The triggers will automatically create the cookbook and add user as owner
  BEGIN
    INSERT INTO public.groups (name, description, created_by, visibility)
    VALUES (
      'My First Book',
      'Add recipes and invite friends to build your book',
      NEW.id,
      'private'
    )
    RETURNING id INTO default_group_id;
  EXCEPTION WHEN OTHERS THEN
    -- Log error but don't fail profile creation
    RAISE WARNING 'Failed to create default group for user %: %', NEW.id, SQLERRM;
  END;
  
  RAISE NOTICE 'Basic profile and default group created for regular user';
  RETURN NEW;
  
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.handle_new_user() IS 
  'Creates a profile record and default group when a new user signs up. For waitlist users, includes collection token and recipe goals. Every user gets a default group called "My First Book".';

