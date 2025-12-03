-- Add visited tracking to invitation system
-- This allows us to see when users click the invitation link but don't complete signup

-- Add visited_at column to track when user visits the join page
ALTER TABLE "public"."waitlist_invitations" 
ADD COLUMN "visited_at" TIMESTAMP WITH TIME ZONE NULL;

-- Add index for performance on visited_at queries
CREATE INDEX IF NOT EXISTS "idx_waitlist_invitations_visited_at" 
ON "public"."waitlist_invitations" ("visited_at");

-- Add comment for documentation
COMMENT ON COLUMN "public"."waitlist_invitations"."visited_at" 
IS 'Timestamp when user clicked the invitation link and visited the join page';

-- Verify the migration
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'waitlist_invitations' 
AND column_name = 'visited_at';