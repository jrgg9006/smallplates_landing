-- Allow NULL emails for guests to support cases where guests don't provide email
ALTER TABLE public.guests
  ALTER COLUMN email DROP NOT NULL;

-- Note: unique constraint on (user_id, email) remains; Postgres allows multiple NULLs
-- If you previously inserted empty strings, consider normalizing them to NULL:
-- UPDATE public.guests SET email = NULL WHERE email = '';

