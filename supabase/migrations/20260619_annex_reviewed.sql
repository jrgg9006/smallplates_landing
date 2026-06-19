-- Originals annex: per-recipe "reviewed, not included" flag so dismissed photos
-- drop out of the "needs review" count.
alter table public.recipe_production_status
  add column if not exists annex_reviewed boolean not null default false;
