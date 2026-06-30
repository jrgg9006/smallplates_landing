-- Backfill migration: capture columns that already exist in the live DB but were
-- never committed as a versioned migration (added out-of-band). Verified against
-- information_schema on 2026-06-29:
--   manually_cleared    boolean NOT NULL DEFAULT false
--   needs_review_reason text    NULL
-- `if not exists` makes this a no-op on the live DB; it exists so a fresh
-- environment rebuilds the same schema.
alter table public.recipe_production_status
  add column if not exists needs_review_reason text,
  add column if not exists manually_cleared boolean not null default false;
