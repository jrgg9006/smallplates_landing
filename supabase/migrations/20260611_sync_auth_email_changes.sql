-- Migration: drop unused pending_email + document email-sync decision
--
-- Context: when a user changes their email via Supabase Auth, only
-- auth.users.email is updated after confirmation. profiles.email and
-- the user's own guest record (guests.is_self = true) kept the old
-- address, so Postmark sends went to the old email.
--
-- A trigger on auth.users was the first approach, but Supabase no
-- longer grants the postgres role ownership of auth.users, so
-- CREATE TRIGGER fails with "must be owner of relation users"
-- (the legacy on_auth_user_created triggers predate that change).
--
-- The sync is therefore done app-side: syncEmailFromAuth() in
-- lib/supabase/profiles.ts, called from AuthContext on every session
-- event. It compares auth email vs profiles.email and mirrors the
-- change into profiles + the self guest record.
--
-- This migration only buries the fossil: pending_email belonged to a
-- custom email-change flow that was never finished; zero code reads
-- or writes it.

ALTER TABLE public.profiles
  DROP COLUMN IF EXISTS pending_email;
