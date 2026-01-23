-- Migration: Update unique_guest_per_user constraint to include group_id
-- This allows users to have multiple guests with the same email in different groups
-- while still preventing duplicates within the same group
-- IMPORTANT: This constraint only applies when email is NOT empty, allowing multiple guests
-- without email in the same group (different people who didn't provide email)

-- Step 1: Drop the old constraint
ALTER TABLE public.guests 
DROP CONSTRAINT IF EXISTS unique_guest_per_user;

-- Step 2: Drop any existing index with the same name (in case it was created as an index before)
DROP INDEX IF EXISTS unique_guest_per_user;

-- Step 3: Create a partial unique index that only applies when email is not empty
-- This allows:
-- - Multiple guests without email in the same group (different people)
-- - One guest per email per group (prevents duplicates when email exists)
-- - Same email across different groups (allows multiple self guests)
CREATE UNIQUE INDEX unique_guest_per_user_non_empty_email 
ON public.guests(
  user_id, 
  email, 
  COALESCE(group_id, '00000000-0000-0000-0000-000000000000'::uuid)
)
WHERE email != '' AND email IS NOT NULL;

-- Add comment explaining the change
COMMENT ON INDEX unique_guest_per_user_non_empty_email IS 
'Ensures unique guest per user per group when email is provided. Allows same email across different groups (multiple self guests), prevents duplicates within the same group. Does NOT apply to guests without email, allowing multiple different people without email in the same group. NULL group_id is treated as a special group.';
