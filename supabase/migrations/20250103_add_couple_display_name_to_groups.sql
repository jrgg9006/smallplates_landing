-- Add couple_display_name field to groups table for consistent email formatting
-- This field will store "FirstName & PartnerFirstName" format specifically for emails
-- Separates the editable book name from the couple display name used in emails

ALTER TABLE groups 
ADD COLUMN couple_display_name TEXT;

-- Add comment for clarity
COMMENT ON COLUMN groups.couple_display_name IS 'Formatted couple name for emails (e.g. "Ana & Pedro"). Separate from editable book name.';

-- Backfill existing groups with couple_display_name where both couple names exist
UPDATE groups 
SET couple_display_name = couple_first_name || ' & ' || partner_first_name 
WHERE couple_first_name IS NOT NULL 
  AND partner_first_name IS NOT NULL 
  AND couple_first_name != '' 
  AND partner_first_name != ''
  AND couple_display_name IS NULL;

-- For groups with only one name, use that name
UPDATE groups 
SET couple_display_name = couple_first_name 
WHERE couple_first_name IS NOT NULL 
  AND couple_first_name != ''
  AND (partner_first_name IS NULL OR partner_first_name = '')
  AND couple_display_name IS NULL;

-- For groups with only partner name, use that name  
UPDATE groups 
SET couple_display_name = partner_first_name 
WHERE partner_first_name IS NOT NULL 
  AND partner_first_name != ''
  AND (couple_first_name IS NULL OR couple_first_name = '')
  AND couple_display_name IS NULL;

-- For remaining groups without individual names, use the group name as fallback
UPDATE groups 
SET couple_display_name = name 
WHERE couple_display_name IS NULL;