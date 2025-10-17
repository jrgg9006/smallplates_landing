-- Migration to simplify guest status to 3 options
-- Update guest status constraint to only allow 3 statuses

-- Drop the existing constraint
ALTER TABLE guests DROP CONSTRAINT IF EXISTS guests_status_check;

-- Add new constraint with simplified statuses
ALTER TABLE guests ADD CONSTRAINT guests_status_check 
CHECK (status IN ('pending', 'submitted', 'reached_out'));

-- Update existing data to map to new status values
-- Map old statuses to new ones:
-- 'invited' -> 'reached_out' (when a message has been sent)
-- 'responded' -> 'submitted' (when at least one recipe has been sent)
-- 'declined' -> 'reached_out' (guest was contacted but declined)

UPDATE guests 
SET status = CASE 
  WHEN status = 'invited' THEN 'reached_out'
  WHEN status = 'responded' THEN 'submitted'
  WHEN status = 'declined' THEN 'reached_out'
  ELSE status -- Keep 'pending' and 'submitted' as is
END
WHERE status IN ('invited', 'responded', 'declined');