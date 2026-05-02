-- Add pdf_url to groups for storing the digital PDF path per book.
-- One PDF per group — uploaded by admin after the physical book is delivered.
ALTER TABLE public.groups
  ADD COLUMN IF NOT EXISTS pdf_url TEXT;

-- Extend communication_log.type to include pdf_delivery.
-- The original CHECK had 4 values; recipe_showcase was added without a migration.
-- Drop and recreate to include all known values.
ALTER TABLE public.communication_log
  DROP CONSTRAINT IF EXISTS communication_log_type_check;

ALTER TABLE public.communication_log
  ADD CONSTRAINT communication_log_type_check
  CHECK (type IN ('invitation', 'reminder', 'thank_you', 'custom', 'recipe_showcase', 'pdf_delivery'));
