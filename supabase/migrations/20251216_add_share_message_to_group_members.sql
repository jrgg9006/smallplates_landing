-- Add custom share message fields to group_members table
-- This allows each captain to have their own personalized message per group

ALTER TABLE group_members
ADD COLUMN IF NOT EXISTS custom_share_message TEXT,
ADD COLUMN IF NOT EXISTS custom_share_signature TEXT;

-- Add comment for documentation
COMMENT ON COLUMN group_members.custom_share_message IS 'Custom message this member uses when sharing the collection link for this group';
COMMENT ON COLUMN group_members.custom_share_signature IS 'Custom signature (name) this member uses when sharing';
