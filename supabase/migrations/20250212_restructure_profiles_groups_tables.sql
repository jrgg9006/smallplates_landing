-- Migration: Restructure profiles and groups tables
-- Date: 2025-02-12
-- Description: Move event-specific data from profiles to groups table for better data organization

-- 1. Add new columns to groups table with descriptions
ALTER TABLE public.groups 
ADD COLUMN IF NOT EXISTS planning_stage VARCHAR,
ADD COLUMN IF NOT EXISTS partner_first_name VARCHAR,
ADD COLUMN IF NOT EXISTS partner_last_name VARCHAR,
ADD COLUMN IF NOT EXISTS relationship_to_couple VARCHAR;

-- 2. Add column descriptions for all groups fields
COMMENT ON COLUMN public.groups.id IS 'UUID primary key for the group';
COMMENT ON COLUMN public.groups.name IS 'Display name of the cookbook/group';
COMMENT ON COLUMN public.groups.description IS 'Optional description of the cookbook purpose';
COMMENT ON COLUMN public.groups.created_by IS 'User who created the group (foreign key to profiles.id)';
COMMENT ON COLUMN public.groups.visibility IS 'Group visibility setting (private or public)';
COMMENT ON COLUMN public.groups.created_at IS 'Timestamp when the group was created';
COMMENT ON COLUMN public.groups.updated_at IS 'Timestamp when the group was last updated';
COMMENT ON COLUMN public.groups.wedding_date IS 'Date of the wedding/event';
COMMENT ON COLUMN public.groups.wedding_date_undecided IS 'Whether the wedding date is still undecided';
COMMENT ON COLUMN public.groups.timeline IS 'Timeline for the wedding (6-plus-months, 3-6-months, etc)';
COMMENT ON COLUMN public.groups.planning_stage IS 'Current planning stage for this event (research, booking, finalizing, etc)';
COMMENT ON COLUMN public.groups.partner_first_name IS 'First name of partner for this cookbook';
COMMENT ON COLUMN public.groups.partner_last_name IS 'Last name of partner for this cookbook';
COMMENT ON COLUMN public.groups.relationship_to_couple IS 'Creator''s relationship to the couple (bride, groom, friend, parent, etc)';

-- 3. Migrate existing data from profiles to groups
-- This migrates data from the group creator's profile to their groups
UPDATE public.groups 
SET 
  planning_stage = p.planning_stage,
  partner_first_name = COALESCE(p.partner_first_name, p.couple_partner_name),
  partner_last_name = p.partner_last_name,
  relationship_to_couple = p.relationship_to_couple
FROM public.profiles p 
WHERE groups.created_by = p.id 
AND (p.planning_stage IS NOT NULL 
  OR p.partner_first_name IS NOT NULL 
  OR p.couple_partner_name IS NOT NULL 
  OR p.relationship_to_couple IS NOT NULL);

-- 4. Drop obsolete columns from profiles table
ALTER TABLE public.profiles 
DROP COLUMN IF EXISTS wedding_date,
DROP COLUMN IF EXISTS wedding_date_undecided,
DROP COLUMN IF EXISTS recipe_goal_category,
DROP COLUMN IF EXISTS recipe_goal_number,
DROP COLUMN IF EXISTS planning_stage,
DROP COLUMN IF EXISTS timeline,
DROP COLUMN IF EXISTS partner_first_name,
DROP COLUMN IF EXISTS partner_last_name,
DROP COLUMN IF EXISTS couple_first_name,
DROP COLUMN IF EXISTS couple_partner_name,
DROP COLUMN IF EXISTS relationship_to_couple,
DROP COLUMN IF EXISTS guest_count;

-- 5. Add email_verified field to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;

-- 6. Add/update column descriptions for profiles table
COMMENT ON COLUMN public.profiles.id IS 'UUID from auth.users - primary key and foreign key';
COMMENT ON COLUMN public.profiles.email IS 'User email address from authentication';
COMMENT ON COLUMN public.profiles.full_name IS 'User''s full name for display purposes';
COMMENT ON COLUMN public.profiles.created_at IS 'Timestamp when the profile was created';
COMMENT ON COLUMN public.profiles.updated_at IS 'Timestamp when the profile was last updated';
COMMENT ON COLUMN public.profiles.phone_number IS 'User''s phone number for contact purposes';
COMMENT ON COLUMN public.profiles.collection_link_token IS 'Unique token for recipe collection link sharing';
COMMENT ON COLUMN public.profiles.collection_enabled IS 'Whether recipe collection is enabled for this user';
COMMENT ON COLUMN public.profiles.pending_email IS 'New email address pending verification';
COMMENT ON COLUMN public.profiles.email_verification_token IS 'Token for email verification process';
COMMENT ON COLUMN public.profiles.email_verification_expires_at IS 'Expiration time for email verification token';
COMMENT ON COLUMN public.profiles.email_verified IS 'Whether the user has verified their email address';
COMMENT ON COLUMN public.profiles.custom_share_message IS 'Custom message for sharing collection link (max 280 chars)';
COMMENT ON COLUMN public.profiles.custom_share_signature IS 'Custom signature for collection messages';
COMMENT ON COLUMN public.profiles.onboarding_state IS 'JSON object tracking user progress through onboarding flow';
COMMENT ON COLUMN public.profiles.user_type IS 'Type of user account (gift_giver, couple, etc)';