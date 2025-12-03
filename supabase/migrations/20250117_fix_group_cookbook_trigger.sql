-- Fix the group cookbook creation function to include user_id
-- This fixes the "null value in column 'user_id' of relation 'cookbooks' violates not-null constraint" error

CREATE OR REPLACE FUNCTION create_group_cookbook()
RETURNS TRIGGER AS $$
BEGIN
  -- Create a shared cookbook for the new group
  INSERT INTO public.cookbooks (name, user_id, is_group_cookbook, group_id)
  VALUES (NEW.name || ' Cookbook', NEW.created_by, TRUE, NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;