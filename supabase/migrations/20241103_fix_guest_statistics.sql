-- Fix guest statistics to exclude archived (deleted) guests and their recipes
-- This ensures that when a guest is deleted, they don't appear in the statistics

CREATE OR REPLACE FUNCTION public.get_guest_statistics(user_uuid UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_guests', COUNT(*) FILTER (WHERE NOT is_archived),  -- Fixed: now excludes archived guests
    'active_guests', COUNT(*) FILTER (WHERE NOT is_archived),
    'archived_guests', COUNT(*) FILTER (WHERE is_archived),
    'pending_invitations', COUNT(*) FILTER (WHERE status = 'pending' AND NOT is_archived),
    'invites_sent', COUNT(*) FILTER (WHERE status IN ('invited', 'responded', 'submitted') AND NOT is_archived),
    'recipes_received', COALESCE(SUM(recipes_received) FILTER (WHERE NOT is_archived), 0),  -- Fixed: now excludes recipes from archived guests
    'total_expected_recipes', COALESCE(SUM(number_of_recipes) FILTER (WHERE NOT is_archived), 0),  -- Fixed: now excludes expected recipes from archived guests
    'completion_rate', CASE 
      WHEN SUM(number_of_recipes) FILTER (WHERE NOT is_archived) > 0 THEN 
        ROUND((SUM(recipes_received) FILTER (WHERE NOT is_archived)::DECIMAL / SUM(number_of_recipes) FILTER (WHERE NOT is_archived)::DECIMAL) * 100, 2)
      ELSE 0
    END
  ) INTO result
  FROM public.guests
  WHERE user_id = user_uuid;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;