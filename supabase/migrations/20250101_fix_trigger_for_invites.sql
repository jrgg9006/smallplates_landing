-- Migration: Fix trigger to only create profile when email is confirmed
-- This prevents errors when inviting users (they don't have a profile until they accept)

-- Drop the existing trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Recreate trigger to only fire when email is confirmed
-- For invited users, this means they've clicked the invite link and set their password
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  WHEN (NEW.email_confirmed_at IS NOT NULL OR NEW.confirmed_at IS NOT NULL)
  EXECUTE FUNCTION public.handle_new_user();

-- Also create trigger for when email gets confirmed AFTER invitation
DROP TRIGGER IF EXISTS on_auth_user_email_confirmed ON auth.users;

CREATE TRIGGER on_auth_user_email_confirmed
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (
    (NEW.email_confirmed_at IS NOT NULL AND OLD.email_confirmed_at IS NULL)
    OR (NEW.confirmed_at IS NOT NULL AND OLD.confirmed_at IS NULL)
  )
  EXECUTE FUNCTION public.handle_new_user();

COMMENT ON TRIGGER on_auth_user_created ON auth.users IS 
  'Creates profile only when user email is confirmed (after accepting invitation or signing up)';

COMMENT ON TRIGGER on_auth_user_email_confirmed ON auth.users IS 
  'Creates profile when invited user confirms their email by setting password';

