-- supabase/migrations/20260727_radar_notifications.sql
create table if not exists public.radar_notifications (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  generated_at timestamptz not null default now(),
  priority text not null check (priority in ('high','medium','low')),
  headline text not null,
  interpretation text not null,
  recommended_action text not null,
  draft_message text not null,
  signals jsonb not null default '{}'::jsonb,
  status text not null default 'open' check (status in ('open','attended','dismissed')),
  attended_at timestamptz,
  cooldown_until timestamptz
);

-- One active (open) notification per book keeps the feed clean.
create unique index if not exists radar_notifications_one_open_per_group
  on public.radar_notifications (group_id) where status = 'open';
create index if not exists radar_notifications_group_generated
  on public.radar_notifications (group_id, generated_at desc);

-- Admin-only table: enable RLS with NO permissive policy.
-- Only the service-role client (which bypasses RLS) reads/writes it.
alter table public.radar_notifications enable row level security;
