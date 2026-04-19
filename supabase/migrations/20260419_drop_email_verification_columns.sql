-- Migration: drop custom email verification columns from profiles
-- Reason: the custom email verification system (registration-time
-- flow with token + expires_at + verified flag) is redundant with
-- Stripe Checkout email capture and Supabase Auth email confirmation.
-- Removed in Phase 9 cleanup.
--
-- Columns dropped:
--   - email_verified: was the source-of-truth flag
--   - email_verification_token: one-time token for verification link
--   - email_verification_expires_at: token expiration timestamp
--
-- Note: pending_email column is NOT dropped — it belongs to a
-- separate feature (email change flow) orthogonal to this system.
--
-- APPLY AFTER code deploy. The code writing to these columns must
-- be removed from production before this migration runs, otherwise
-- inserts/updates will fail with "column does not exist".

ALTER TABLE public.profiles
  DROP COLUMN IF EXISTS email_verified,
  DROP COLUMN IF EXISTS email_verification_token,
  DROP COLUMN IF EXISTS email_verification_expires_at;
