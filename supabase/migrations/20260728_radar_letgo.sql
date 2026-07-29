-- supabase/migrations/20260728_radar_letgo.sql
-- Durable, reversible archive marker for a book that the founder gave up on.
alter table public.groups add column if not exists radar_archived_at timestamptz;

-- Lifecycle verdict persisted on each radar notification.
alter table public.radar_notifications
  add column if not exists lifecycle text not null default 'revive'
  check (lifecycle in ('revive','let_go'));
