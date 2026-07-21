-- Extend communication_log.type to include 'reminders_tip' (the founder tip that
-- promotes the Send Reminders tool, sent from the Email Dashboard).
--
-- Note: the committed migrations only ever advanced this CHECK to 'pdf_delivery'.
-- In production it was later extended by hand to include captain_reminder,
-- weekly_status and closing_nudge (same as recipe_showcase was). This migration
-- recreates the constraint with the FULL known set so migrations match reality.
ALTER TABLE public.communication_log
  DROP CONSTRAINT IF EXISTS communication_log_type_check;

ALTER TABLE public.communication_log
  ADD CONSTRAINT communication_log_type_check
  CHECK (type IN (
    'invitation',
    'reminder',
    'thank_you',
    'custom',
    'recipe_showcase',
    'pdf_delivery',
    'captain_reminder',
    'weekly_status',
    'closing_nudge',
    'reminders_tip'
  ));
