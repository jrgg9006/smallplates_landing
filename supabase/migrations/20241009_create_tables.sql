-- Create profiles table that extends auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
  -- Primary key linked to Supabase auth
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- User identification
  email TEXT NOT NULL,                    -- User's email from auth.users
  full_name TEXT,                         -- User's full name
  phone_number TEXT,                      -- User's phone number (optional)
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),   -- When profile was created
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()    -- Last profile update
);

-- Add comment to profiles table
COMMENT ON TABLE public.profiles IS 'User profiles that extend the auth.users table with additional information';
COMMENT ON COLUMN public.profiles.id IS 'UUID from auth.users - primary key and foreign key';
COMMENT ON COLUMN public.profiles.email IS 'User email address from authentication';
COMMENT ON COLUMN public.profiles.full_name IS 'User''s full name for display purposes';
COMMENT ON COLUMN public.profiles.phone_number IS 'User''s phone number for contact purposes';
COMMENT ON COLUMN public.profiles.created_at IS 'Timestamp when the profile was created';
COMMENT ON COLUMN public.profiles.updated_at IS 'Timestamp when the profile was last updated';

-- Create guests table for tracking recipe contributors
CREATE TABLE IF NOT EXISTS public.guests (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Foreign key to user
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Guest identification
  first_name TEXT NOT NULL,               -- Guest's first name
  last_name TEXT NOT NULL,                -- Guest's last name
  email TEXT NOT NULL,                    -- Guest's email address
  phone TEXT,                             -- Optional phone number
  
  -- Relationship information
  significant_other_name TEXT,            -- Partner/spouse name (optional)
  
  -- Communication tracking
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'invited', 'responded', 'declined', 'submitted')),
  date_message_sent TIMESTAMPTZ,          -- When invitation was sent
  last_reminder_sent TIMESTAMPTZ,         -- Track reminder emails
  
  -- Recipe information
  number_of_recipes INTEGER NOT NULL DEFAULT 1 CHECK (number_of_recipes > 0),    -- Expected number of recipes
  recipes_received INTEGER NOT NULL DEFAULT 0 CHECK (recipes_received >= 0),     -- Actual recipes received
  
  -- Additional information
  notes TEXT,                             -- Any special notes about guest
  tags TEXT[],                            -- Custom tags for grouping
  
  -- Soft delete
  is_archived BOOLEAN NOT NULL DEFAULT FALSE,      -- Soft delete flag
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),   -- When guest was added
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),   -- Last update
  
  -- Constraints
  CONSTRAINT unique_guest_per_user UNIQUE(user_id, email),
  CONSTRAINT valid_recipe_count CHECK (recipes_received <= number_of_recipes)
);

-- Add comments to guests table
COMMENT ON TABLE public.guests IS 'Guest list for recipe collection - tracks people invited to contribute recipes';
COMMENT ON COLUMN public.guests.id IS 'Unique identifier for the guest';
COMMENT ON COLUMN public.guests.user_id IS 'Reference to the user who owns this guest list';
COMMENT ON COLUMN public.guests.first_name IS 'Guest''s first name';
COMMENT ON COLUMN public.guests.last_name IS 'Guest''s last name';
COMMENT ON COLUMN public.guests.email IS 'Guest''s email address for sending invitations';
COMMENT ON COLUMN public.guests.phone IS 'Optional phone number for SMS reminders';
COMMENT ON COLUMN public.guests.significant_other_name IS 'Name of partner/spouse if inviting as a couple';
COMMENT ON COLUMN public.guests.status IS 'Current status: pending, invited, responded, declined, submitted';
COMMENT ON COLUMN public.guests.date_message_sent IS 'Timestamp when invitation email was sent';
COMMENT ON COLUMN public.guests.last_reminder_sent IS 'Timestamp of last reminder email';
COMMENT ON COLUMN public.guests.number_of_recipes IS 'How many recipes expected from this guest';
COMMENT ON COLUMN public.guests.recipes_received IS 'How many recipes actually received';
COMMENT ON COLUMN public.guests.notes IS 'Any special notes about this guest';
COMMENT ON COLUMN public.guests.tags IS 'Custom tags for categorizing guests';
COMMENT ON COLUMN public.guests.is_archived IS 'Soft delete flag - true means guest is archived';

-- Create guest_recipes table for submitted recipes
CREATE TABLE IF NOT EXISTS public.guest_recipes (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Foreign keys
  guest_id UUID NOT NULL REFERENCES public.guests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Recipe information
  recipe_name TEXT NOT NULL,              -- Name of the recipe
  
  -- Recipe details
  ingredients TEXT NOT NULL,              -- List of ingredients (free text)
  instructions TEXT NOT NULL,             -- Step-by-step instructions (free text)
  comments TEXT,                          -- Personal notes, memories, or stories about the recipe
  
  -- Media
  image_url TEXT,                         -- URL to recipe image
  
  -- Status tracking
  submission_status TEXT NOT NULL DEFAULT 'draft' CHECK (submission_status IN ('draft', 'submitted', 'approved', 'rejected')),
  submitted_at TIMESTAMPTZ,               -- When recipe was submitted
  approved_at TIMESTAMPTZ,                -- When recipe was approved
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add comments to guest_recipes table
COMMENT ON TABLE public.guest_recipes IS 'Recipes submitted by guests for the cookbook';
COMMENT ON COLUMN public.guest_recipes.id IS 'Unique identifier for the recipe';
COMMENT ON COLUMN public.guest_recipes.guest_id IS 'Reference to the guest who submitted this recipe';
COMMENT ON COLUMN public.guest_recipes.user_id IS 'Reference to the user who owns the cookbook';
COMMENT ON COLUMN public.guest_recipes.recipe_name IS 'Name of the recipe';
COMMENT ON COLUMN public.guest_recipes.ingredients IS 'List of ingredients in free text format';
COMMENT ON COLUMN public.guest_recipes.instructions IS 'Cooking instructions in free text format';
COMMENT ON COLUMN public.guest_recipes.comments IS 'Personal notes, stories, or memories about this recipe';
COMMENT ON COLUMN public.guest_recipes.image_url IS 'URL to the recipe image';
COMMENT ON COLUMN public.guest_recipes.submission_status IS 'Status: draft, submitted, approved, or rejected';
COMMENT ON COLUMN public.guest_recipes.submitted_at IS 'Timestamp when recipe was submitted by guest';
COMMENT ON COLUMN public.guest_recipes.approved_at IS 'Timestamp when recipe was approved by user';

-- Create communication_log table for tracking all communications
CREATE TABLE IF NOT EXISTS public.communication_log (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Foreign keys
  guest_id UUID NOT NULL REFERENCES public.guests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Communication details
  type TEXT NOT NULL CHECK (type IN ('invitation', 'reminder', 'thank_you', 'custom')),
  channel TEXT NOT NULL CHECK (channel IN ('email', 'sms', 'whatsapp')),
  subject TEXT,                           -- Email subject or message title
  content TEXT,                           -- Message content
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'opened')),
  sent_at TIMESTAMPTZ,                    -- When message was sent
  delivered_at TIMESTAMPTZ,               -- When message was delivered
  opened_at TIMESTAMPTZ,                  -- When message was opened
  
  -- Error tracking
  error_message TEXT,                     -- Any error messages
  retry_count INTEGER NOT NULL DEFAULT 0 CHECK (retry_count >= 0),  -- Number of retry attempts
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add comments to communication_log table
COMMENT ON TABLE public.communication_log IS 'Log of all communications sent to guests';
COMMENT ON COLUMN public.communication_log.id IS 'Unique identifier for the communication record';
COMMENT ON COLUMN public.communication_log.guest_id IS 'Reference to the guest who received this communication';
COMMENT ON COLUMN public.communication_log.user_id IS 'Reference to the user who sent this communication';
COMMENT ON COLUMN public.communication_log.type IS 'Type of communication: invitation, reminder, thank_you, or custom';
COMMENT ON COLUMN public.communication_log.channel IS 'Communication channel: email, sms, or whatsapp';
COMMENT ON COLUMN public.communication_log.subject IS 'Subject line for emails or title for other messages';
COMMENT ON COLUMN public.communication_log.content IS 'The actual message content sent';
COMMENT ON COLUMN public.communication_log.status IS 'Status: pending, sent, delivered, failed, or opened';
COMMENT ON COLUMN public.communication_log.sent_at IS 'Timestamp when the message was sent';
COMMENT ON COLUMN public.communication_log.delivered_at IS 'Timestamp when the message was delivered';
COMMENT ON COLUMN public.communication_log.opened_at IS 'Timestamp when the message was opened (if trackable)';
COMMENT ON COLUMN public.communication_log.error_message IS 'Any error message if sending failed';
COMMENT ON COLUMN public.communication_log.retry_count IS 'Number of times sending was retried';

-- Create indexes for better performance
CREATE INDEX idx_guests_user_id ON public.guests(user_id);
CREATE INDEX idx_guests_email ON public.guests(email);
CREATE INDEX idx_guests_status ON public.guests(status);
CREATE INDEX idx_guests_is_archived ON public.guests(is_archived);
CREATE INDEX idx_guest_recipes_guest_id ON public.guest_recipes(guest_id);
CREATE INDEX idx_guest_recipes_user_id ON public.guest_recipes(user_id);
CREATE INDEX idx_guest_recipes_submission_status ON public.guest_recipes(submission_status);
CREATE INDEX idx_communication_log_guest_id ON public.communication_log(guest_id);
CREATE INDEX idx_communication_log_user_id ON public.communication_log(user_id);
CREATE INDEX idx_communication_log_status ON public.communication_log(status);