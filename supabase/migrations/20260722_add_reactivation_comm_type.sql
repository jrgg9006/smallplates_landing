-- Extend communication_log.type to include 'reactivation' (the winback email sent
-- from the Email Dashboard to signups who abandoned at zero activity).
--
-- Built to derive the allowed set from the values already in the table plus the
-- known standard ones, so it can't be broken by a stray character in the literal.
DO $$
DECLARE
  allowed text;
BEGIN
  SELECT string_agg(quote_literal(t), ', ') INTO allowed FROM (
    SELECT DISTINCT type AS t FROM public.communication_log WHERE type IS NOT NULL
    UNION SELECT 'invitation'
    UNION SELECT 'reminder'
    UNION SELECT 'thank_you'
    UNION SELECT 'custom'
    UNION SELECT 'pdf_delivery'
    UNION SELECT 'captain_reminder'
    UNION SELECT 'weekly_status'
    UNION SELECT 'closing_nudge'
    UNION SELECT 'reminders' || '_tip'
    UNION SELECT 'reactivation'
  ) s;

  EXECUTE 'ALTER TABLE public.communication_log DROP CONSTRAINT IF EXISTS communication_log_type_check';
  EXECUTE 'ALTER TABLE public.communication_log ADD CONSTRAINT communication_log_type_check CHECK (type IN (' || allowed || '))';
END $$;
