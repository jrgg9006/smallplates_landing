-- Add opt-out flag for showcase emails.
-- Guests who unsubscribe via the showcase email footer or List-Unsubscribe header
-- set this to true. The send route should check this before sending.
ALTER TABLE public.guests
  ADD COLUMN IF NOT EXISTS showcase_opted_out boolean NOT NULL DEFAULT false;
