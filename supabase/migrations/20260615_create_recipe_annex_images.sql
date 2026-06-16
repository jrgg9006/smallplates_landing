-- Originals annex: one row per guest image selected to be printed at the back of the book.
create table if not exists public.recipe_annex_images (
  id               uuid primary key default gen_random_uuid(),
  recipe_id        uuid not null references public.guest_recipes(id) on delete cascade,
  group_id         uuid not null references public.groups(id) on delete cascade,
  source_url       text not null,                 -- the document_urls/image_url entry the admin selected
  original_url     text,                          -- normalized PNG (written in M2)
  print_url        text,                          -- upscaled version (written in M2)
  upscale_status   text check (upscale_status in ('pending','processing','ready','error')),
  image_dimensions jsonb,
  position         int  not null default 0,       -- order within the recipe and the annex
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (recipe_id, source_url)
);

create index if not exists idx_recipe_annex_images_group  on public.recipe_annex_images(group_id);
create index if not exists idx_recipe_annex_images_recipe on public.recipe_annex_images(recipe_id);

-- Admin-only: routes use the service-role client (bypasses RLS). Enable RLS with NO
-- permissive policies so anon/authenticated are denied by default.
alter table public.recipe_annex_images enable row level security;
