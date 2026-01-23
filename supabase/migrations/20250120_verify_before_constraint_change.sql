-- Verification script: Run this BEFORE applying the constraint change migration
-- This helps identify any potential issues with existing data

-- Check 1: Verify no duplicate guests that would violate the new constraint
-- This should return 0 rows if data is clean
SELECT 
  user_id, 
  email, 
  COALESCE(group_id::text, 'NULL') as group_id,
  COUNT(*) as count
FROM guests 
WHERE is_archived = false
GROUP BY user_id, email, group_id
HAVING COUNT(*) > 1;

-- Check 2: Count self guests per user per group
-- This helps understand the current state
SELECT 
  user_id,
  COALESCE(group_id::text, 'NULL') as group_id,
  COUNT(*) as self_guest_count
FROM guests 
WHERE is_self = true AND is_archived = false
GROUP BY user_id, group_id
ORDER BY self_guest_count DESC, user_id;

-- Check 3: Find users with multiple self guests (should be 0 with current constraint)
-- After migration, this will be allowed
SELECT 
  user_id,
  COUNT(*) as self_guest_count,
  array_agg(COALESCE(group_id::text, 'NULL')) as group_ids
FROM guests 
WHERE is_self = true AND is_archived = false
GROUP BY user_id
HAVING COUNT(*) > 1;

-- Check 4: Find guests with same email but different group_id (currently not possible)
-- After migration, this will be allowed
SELECT 
  user_id,
  email,
  COUNT(DISTINCT group_id) as different_groups_count,
  array_agg(DISTINCT COALESCE(group_id::text, 'NULL')) as group_ids
FROM guests 
WHERE is_archived = false AND email IS NOT NULL AND email != ''
GROUP BY user_id, email
HAVING COUNT(DISTINCT group_id) > 1;
