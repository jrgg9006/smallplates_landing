-- Migration: add profiles.password_set_at
--
-- The app is passwordless-first: users are created with no password
-- (or, historically, a random unknown one from the login-modal signup
-- path), so auth.users.encrypted_password does NOT tell us whether the
-- user deliberately chose a password.
--
-- password_set_at is the app-owned source of truth: stamped by
-- updatePassword() in lib/supabase/profiles.ts whenever a user sets or
-- changes a password on purpose. It decides:
--   - Account > Password section: "Set a password" vs "Change password"
--   - Account > Email / Delete: whether to ask for the current password
--   - /api/v1/users/me/delete: whether to require password verification
--
-- NULL = passwordless (logs in with email links/codes or Google).

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS password_set_at timestamptz;

COMMENT ON COLUMN public.profiles.password_set_at IS
  'When the user last deliberately set a password. NULL = passwordless account.';
