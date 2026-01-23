-- Migration: Fix duplicate guests before applying new unique constraint
-- This script identifies and resolves duplicate guests that would violate the new constraint

-- Step 1: Identify duplicates that will violate the new constraint
-- This shows guests with same (user_id, email, group_id) combination
WITH duplicates AS (
  SELECT 
    user_id,
    COALESCE(email, '') as email,
    group_id,
    COUNT(*) as count,
    array_agg(id ORDER BY created_at) as guest_ids
  FROM guests
  WHERE is_archived = false
  GROUP BY user_id, COALESCE(email, ''), group_id
  HAVING COUNT(*) > 1
)
SELECT 
  d.user_id,
  d.email,
  d.group_id,
  d.count,
  d.guest_ids
FROM duplicates d
ORDER BY d.count DESC, d.user_id;

-- Step 2: For each duplicate group, keep the oldest one and archive the rest
-- This preserves the first guest created and archives duplicates
DO $$
DECLARE
  dup_record RECORD;
  guest_ids_to_archive UUID[];
  first_guest_id UUID;
BEGIN
  -- Find all duplicate groups
  FOR dup_record IN
    SELECT 
      user_id,
      COALESCE(email, '') as email,
      group_id,
      array_agg(id ORDER BY created_at) as guest_ids
    FROM guests
    WHERE is_archived = false
    GROUP BY user_id, COALESCE(email, ''), group_id
    HAVING COUNT(*) > 1
  LOOP
    -- Get the array of guest IDs
    guest_ids_to_archive := dup_record.guest_ids;
    
    -- The first one (oldest) is the one to keep
    first_guest_id := guest_ids_to_archive[1];
    
    -- Archive all except the first one
    UPDATE guests
    SET is_archived = true,
        updated_at = NOW()
    WHERE id = ANY(guest_ids_to_archive[2:array_length(guest_ids_to_archive, 1)])
    AND id != first_guest_id;
    
    RAISE NOTICE 'Archived % duplicate guests for user_id=%, email=%, group_id=%. Kept guest_id=%', 
      array_length(guest_ids_to_archive, 1) - 1,
      dup_record.user_id,
      dup_record.email,
      dup_record.group_id,
      first_guest_id;
  END LOOP;
END $$;

-- Step 3: Verify no duplicates remain (should return 0 rows)
SELECT 
  user_id,
  COALESCE(email, '') as email,
  group_id,
  COUNT(*) as count
FROM guests
WHERE is_archived = false
GROUP BY user_id, COALESCE(email, ''), group_id
HAVING COUNT(*) > 1;
