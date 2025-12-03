-- Add custom share message to profiles table
-- This allows users to personalize the message sent with their collection link

ALTER TABLE public.profiles 
ADD COLUMN custom_share_message TEXT;

-- Add comment
COMMENT ON COLUMN public.profiles.custom_share_message IS 'Custom message for sharing collection link (max 280 chars)';

-- Add constraint to limit message length
ALTER TABLE public.profiles 
ADD CONSTRAINT check_custom_share_message_length 
CHECK (char_length(custom_share_message) <= 280);
