-- Add onboarding tracking to profiles table
-- This allows us to track user progress through the onboarding flow

-- Add onboarding_state column to track onboarding progress
ALTER TABLE "public"."profiles" 
ADD COLUMN "onboarding_state" JSONB DEFAULT '{
  "has_seen_welcome": false,
  "welcome_dismissed_at": null,
  "completed_steps": [],
  "last_onboarding_shown": null,
  "dismissal_count": 0,
  "first_recipe_showcase_sent": false
}'::jsonb;

-- Add index for efficient queries on onboarding state
CREATE INDEX IF NOT EXISTS "idx_profiles_onboarding_state" 
ON "public"."profiles" USING GIN (onboarding_state);

-- Add comment for documentation
COMMENT ON COLUMN "public"."profiles"."onboarding_state" 
IS 'JSON object tracking user progress through onboarding flow including completed steps and dismissal tracking';

-- Verify the migration
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name = 'onboarding_state';