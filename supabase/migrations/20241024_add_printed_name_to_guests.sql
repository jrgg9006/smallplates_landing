-- Migration: Add printed_name column to guests table
-- Description: Add a printed_name field to store how guest names should appear in the printed cookbook

ALTER TABLE public.guests 
ADD COLUMN printed_name TEXT;

-- Add comment to document the purpose
COMMENT ON COLUMN public.guests.printed_name IS 'How the guest''s name should appear in the printed cookbook (e.g., ''Jaime y Nana'', ''Chef Rodriguez''). If null, use first_name + last_name.';

-- Optional: Add an index if you plan to search by printed names frequently
-- CREATE INDEX idx_guests_printed_name ON public.guests(printed_name) WHERE printed_name IS NOT NULL;