-- Migration: Fix profiles and groups structure
-- Date: 2025-12-16
-- Purpose: Move couple information from profiles to groups table and add missing relationship fields

-- 1. Add missing columns to groups table for complete couple information
ALTER TABLE groups 
  ADD COLUMN IF NOT EXISTS couple_first_name VARCHAR(100),
  ADD COLUMN IF NOT EXISTS couple_last_name VARCHAR(100);

-- 2. Add relationship_to_couple to group_members table
-- This allows each member to have their own relationship to the couple
ALTER TABLE group_members
  ADD COLUMN IF NOT EXISTS relationship_to_couple VARCHAR(50);

-- 3. Add relationship_to_couple to group_invitations table
-- This preserves the relationship during the invitation process
ALTER TABLE group_invitations
  ADD COLUMN IF NOT EXISTS relationship_to_couple VARCHAR(50);

-- 4. Migrate existing data from profiles to groups
-- For users who are couples, copy their names to their default group
UPDATE groups g
SET 
  couple_first_name = p.couple_first_name,
  couple_last_name = p.couple_last_name
FROM profiles p
WHERE g.created_by = p.id 
  AND p.user_type = 'couple'
  AND p.couple_first_name IS NOT NULL
  AND g.couple_first_name IS NULL;

-- 5. Update group names to follow the pattern "FirstName & PartnerName"
-- Only for groups that don't have a custom name yet
UPDATE groups g
SET name = CONCAT(
  COALESCE(g.couple_first_name, ''), 
  ' & ', 
  COALESCE(g.partner_first_name, '')
)
FROM profiles p
WHERE g.created_by = p.id 
  AND p.user_type = 'couple'
  AND (g.name IS NULL OR g.name = '' OR g.name = 'My Wedding Cookbook')
  AND g.couple_first_name IS NOT NULL
  AND g.partner_first_name IS NOT NULL;

-- 6. Set relationship_to_couple for existing group owners
-- If they're a couple, relationship is null (they are the couple)
-- If they're a gift giver, copy from the profiles table if it exists
UPDATE group_members gm
SET relationship_to_couple = 
  CASE 
    WHEN p.user_type = 'couple' THEN NULL
    WHEN p.user_type = 'gift_giver' THEN g.relationship_to_couple
    ELSE NULL
  END
FROM profiles p
JOIN groups g ON g.created_by = p.id
WHERE gm.profile_id = p.id 
  AND gm.group_id = g.id
  AND gm.role = 'owner'
  AND gm.relationship_to_couple IS NULL;

-- 7. Drop deprecated columns from profiles table
-- These fields are now managed at the group level
ALTER TABLE profiles
  DROP COLUMN IF EXISTS couple_first_name,
  DROP COLUMN IF EXISTS couple_last_name,
  DROP COLUMN IF EXISTS couple_partner_first_name,
  DROP COLUMN IF EXISTS couple_partner_last_name,
  DROP COLUMN IF EXISTS default_relationship_to_couple;

-- Note: The columns couple_partner_first_name and couple_partner_last_name 
-- were already dropped in a previous migration, but we include them here 
-- for completeness and to ensure clean state

-- 8. Add comments to document the new structure
COMMENT ON COLUMN groups.couple_first_name IS 'First name of the first member of the couple getting married';
COMMENT ON COLUMN groups.couple_last_name IS 'Last name of the first member of the couple getting married';
COMMENT ON COLUMN groups.partner_first_name IS 'First name of the second member of the couple getting married';
COMMENT ON COLUMN groups.partner_last_name IS 'Last name of the second member of the couple getting married';
COMMENT ON COLUMN groups.relationship_to_couple IS 'Relationship of the group creator to the couple (null if creator is part of the couple)';
COMMENT ON COLUMN group_members.relationship_to_couple IS 'Relationship of this member to the couple (null if member is part of the couple)';
COMMENT ON COLUMN group_invitations.relationship_to_couple IS 'Relationship of the invitee to the couple';