-- Add free_tier as valid status for groups.
-- Free tier groups exist before Stripe payment; upgrade to pending_setup on checkout.

BEGIN;

-- 1. Drop existing CHECK constraint on groups.status.
DO $$
DECLARE
  constraint_name TEXT;
BEGIN
  SELECT con.conname INTO constraint_name
  FROM pg_constraint con
  JOIN pg_class rel ON rel.oid = con.conrelid
  JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
  WHERE rel.relname = 'groups'
    AND nsp.nspname = 'public'
    AND con.contype = 'c'
    AND pg_get_constraintdef(con.oid) ILIKE '%status%';

  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.groups DROP CONSTRAINT %I', constraint_name);
  END IF;
END $$;

-- 2. New constraint that accepts free_tier.
ALTER TABLE public.groups
  ADD CONSTRAINT groups_status_check
  CHECK (status IN ('free_tier', 'pending_setup', 'active'));

COMMIT;
