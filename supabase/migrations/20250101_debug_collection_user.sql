-- Debug query to check if the user has collection enabled
-- Run this to see what's wrong with user bb4ff095-cea9-474e-878e-bd43b43e9926

SELECT 
  id,
  email,
  full_name,
  collection_enabled,
  collection_link_token,
  CASE 
    WHEN collection_enabled = true AND collection_link_token IS NOT NULL THEN 'SHOULD WORK ✅'
    WHEN collection_enabled = false THEN '❌ collection_enabled is FALSE'
    WHEN collection_link_token IS NULL THEN '❌ collection_link_token is NULL'
    ELSE '❌ UNKNOWN ISSUE'
  END as diagnosis
FROM public.profiles
WHERE id = 'bb4ff095-cea9-474e-878e-bd43b43e9926';

-- Also check if RLS is enabled
SELECT 
  tablename,
  rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'guest_recipes';

-- Check all active policies
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'guest_recipes'
ORDER BY cmd, policyname;

