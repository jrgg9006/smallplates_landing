-- Function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all tables that have an updated_at column
CREATE TRIGGER update_profiles_updated_at 
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_guests_updated_at 
  BEFORE UPDATE ON public.guests
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_guest_recipes_updated_at 
  BEFORE UPDATE ON public.guest_recipes
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to automatically create a user profile when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile when user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();

-- Function to update guest recipe count and status when recipe is submitted
CREATE OR REPLACE FUNCTION public.update_guest_recipe_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update when submission_status changes to 'submitted'
  IF NEW.submission_status = 'submitted' AND (OLD.submission_status IS NULL OR OLD.submission_status != 'submitted') THEN
    UPDATE public.guests 
    SET 
      recipes_received = recipes_received + 1,
      status = CASE 
        WHEN recipes_received + 1 >= number_of_recipes THEN 'submitted'
        ELSE status
      END,
      updated_at = NOW()
    WHERE id = NEW.guest_id;
  END IF;
  
  -- If submission_status changes from 'submitted' to something else, decrease count
  IF OLD.submission_status = 'submitted' AND NEW.submission_status != 'submitted' THEN
    UPDATE public.guests 
    SET 
      recipes_received = GREATEST(recipes_received - 1, 0),
      status = CASE 
        WHEN recipes_received - 1 < number_of_recipes THEN 'responded'
        ELSE status
      END,
      updated_at = NOW()
    WHERE id = NEW.guest_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update guest recipe count when recipe submission status changes
CREATE TRIGGER update_recipe_count_on_status_change
  AFTER UPDATE OF submission_status ON public.guest_recipes
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_guest_recipe_count();

-- Trigger to update guest recipe count when new recipe is inserted
CREATE TRIGGER increment_recipe_count_on_insert
  AFTER INSERT ON public.guest_recipes
  FOR EACH ROW 
  WHEN (NEW.submission_status = 'submitted')
  EXECUTE FUNCTION public.update_guest_recipe_count();

-- Function to handle recipe deletion and adjust guest counts
CREATE OR REPLACE FUNCTION public.handle_recipe_deletion()
RETURNS TRIGGER AS $$
BEGIN
  -- If a submitted recipe is deleted, decrease the guest's recipe count
  IF OLD.submission_status = 'submitted' THEN
    UPDATE public.guests 
    SET 
      recipes_received = GREATEST(recipes_received - 1, 0),
      status = CASE 
        WHEN recipes_received - 1 < number_of_recipes THEN 'responded'
        ELSE status
      END,
      updated_at = NOW()
    WHERE id = OLD.guest_id;
  END IF;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Trigger to handle recipe deletion
CREATE TRIGGER handle_recipe_deletion_trigger
  BEFORE DELETE ON public.guest_recipes
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_recipe_deletion();

-- Function to get guest statistics for a user
CREATE OR REPLACE FUNCTION public.get_guest_statistics(user_uuid UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_guests', COUNT(*),
    'active_guests', COUNT(*) FILTER (WHERE NOT is_archived),
    'archived_guests', COUNT(*) FILTER (WHERE is_archived),
    'pending_invitations', COUNT(*) FILTER (WHERE status = 'pending' AND NOT is_archived),
    'invites_sent', COUNT(*) FILTER (WHERE status IN ('invited', 'responded', 'submitted') AND NOT is_archived),
    'recipes_received', COALESCE(SUM(recipes_received), 0),
    'total_expected_recipes', COALESCE(SUM(number_of_recipes), 0),
    'completion_rate', CASE 
      WHEN SUM(number_of_recipes) > 0 THEN ROUND((SUM(recipes_received)::DECIMAL / SUM(number_of_recipes)::DECIMAL) * 100, 2)
      ELSE 0
    END
  ) INTO result
  FROM public.guests
  WHERE user_id = user_uuid;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to search guests by various criteria
CREATE OR REPLACE FUNCTION public.search_guests(
  user_uuid UUID,
  search_query TEXT DEFAULT NULL,
  status_filter TEXT DEFAULT NULL,
  include_archived BOOLEAN DEFAULT FALSE
)
RETURNS SETOF public.guests AS $$
BEGIN
  RETURN QUERY
  SELECT g.*
  FROM public.guests g
  WHERE g.user_id = user_uuid
    AND (include_archived = TRUE OR g.is_archived = FALSE)
    AND (status_filter IS NULL OR g.status = status_filter)
    AND (
      search_query IS NULL OR
      g.first_name ILIKE '%' || search_query || '%' OR
      g.last_name ILIKE '%' || search_query || '%' OR
      g.email ILIKE '%' || search_query || '%' OR
      g.significant_other_name ILIKE '%' || search_query || '%' OR
      g.notes ILIKE '%' || search_query || '%'
    )
  ORDER BY g.last_name, g.first_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log communications
CREATE OR REPLACE FUNCTION public.log_communication(
  guest_uuid UUID,
  user_uuid UUID,
  comm_type TEXT,
  comm_channel TEXT,
  comm_subject TEXT DEFAULT NULL,
  comm_content TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO public.communication_log (
    guest_id,
    user_id,
    type,
    channel,
    subject,
    content,
    status
  ) VALUES (
    guest_uuid,
    user_uuid,
    comm_type,
    comm_channel,
    comm_subject,
    comm_content,
    'pending'
  )
  RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update communication status
CREATE OR REPLACE FUNCTION public.update_communication_status(
  log_uuid UUID,
  new_status TEXT,
  error_msg TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.communication_log
  SET 
    status = new_status,
    sent_at = CASE WHEN new_status = 'sent' THEN NOW() ELSE sent_at END,
    delivered_at = CASE WHEN new_status = 'delivered' THEN NOW() ELSE delivered_at END,
    opened_at = CASE WHEN new_status = 'opened' THEN NOW() ELSE opened_at END,
    error_message = error_msg,
    retry_count = CASE WHEN new_status = 'failed' THEN retry_count + 1 ELSE retry_count END
  WHERE id = log_uuid;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments to functions
COMMENT ON FUNCTION public.update_updated_at_column() IS 'Automatically updates the updated_at timestamp on row updates';
COMMENT ON FUNCTION public.handle_new_user() IS 'Creates a profile record when a new user signs up';
COMMENT ON FUNCTION public.update_guest_recipe_count() IS 'Updates guest recipe counts and status when recipes are submitted';
COMMENT ON FUNCTION public.handle_recipe_deletion() IS 'Adjusts guest counts when recipes are deleted';
COMMENT ON FUNCTION public.get_guest_statistics(UUID) IS 'Returns comprehensive statistics about a user''s guests and recipes';
COMMENT ON FUNCTION public.search_guests(UUID, TEXT, TEXT, BOOLEAN) IS 'Searches guests with various filters and criteria';
COMMENT ON FUNCTION public.log_communication(UUID, UUID, TEXT, TEXT, TEXT, TEXT) IS 'Logs communication attempts to guests';
COMMENT ON FUNCTION public.update_communication_status(UUID, TEXT, TEXT) IS 'Updates the status of communication logs';