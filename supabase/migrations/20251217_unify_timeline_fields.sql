-- Migration: Unify planning_stage and timeline into wedding_timeline
-- Date: 2025-12-17
-- Purpose: Merge planning_stage and timeline columns into a single wedding_timeline field

-- 1. Create the new wedding_timeline column
ALTER TABLE groups 
  ADD COLUMN IF NOT EXISTS wedding_timeline VARCHAR(50);

-- 2. Migrate existing data from planning_stage (onboarding tradicional) to wedding_timeline
-- Map planning stages to timeline equivalents
UPDATE groups 
SET wedding_timeline = CASE 
  WHEN planning_stage = 'just-engaged' THEN '6-plus-months'
  WHEN planning_stage = 'deep-planning' THEN '3-6-months' 
  WHEN planning_stage = 'almost-done' THEN '1-3-months'
  WHEN planning_stage = 'just-exploring' THEN '6-plus-months'
  ELSE NULL
END
WHERE planning_stage IS NOT NULL AND wedding_timeline IS NULL;

-- 3. Migrate existing data from timeline (gift giver onboarding) to wedding_timeline
-- Timeline values are already in the correct format, so copy directly
UPDATE groups 
SET wedding_timeline = timeline
WHERE timeline IS NOT NULL AND wedding_timeline IS NULL;

-- 4. Drop the old columns
ALTER TABLE groups 
  DROP COLUMN IF EXISTS planning_stage,
  DROP COLUMN IF EXISTS timeline;

-- 5. Add comment to document the new field
COMMENT ON COLUMN groups.wedding_timeline IS 'Timeline until the wedding event: 6-plus-months, 3-6-months, 1-3-months, less-than-month, already-happened';