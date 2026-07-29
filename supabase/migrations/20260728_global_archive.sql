-- Promote the archive flag to a global, group-level "dead" flag that every admin surface
-- (radar, operations, book production, activity, email) respects. Non-destructive & idempotent.

-- If the earlier radar-only column exists, rename it (preserves any existing data)...
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'groups' and column_name = 'radar_archived_at'
  ) then
    alter table public.groups rename column radar_archived_at to archived_at;
  end if;
end $$;

-- ...otherwise just create it. `if not exists` makes this a no-op when the rename already ran.
alter table public.groups add column if not exists archived_at timestamptz;

-- The founder's note on WHY a book was given up on.
alter table public.groups add column if not exists archived_reason text;
