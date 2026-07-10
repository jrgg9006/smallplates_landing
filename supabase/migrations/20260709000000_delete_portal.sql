-- supabase/migrations/20260709000000_delete_portal.sql
-- Delete Portal: papelera física (capa 2) + semántica capa 1

create table public.deleted_items (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type in ('profile','group','guest','recipe')),
  entity_id uuid not null,
  entity_label text not null,
  payload jsonb,
  counts jsonb not null default '{}'::jsonb,
  status text not null default 'trashed' check (status in ('trashed','restored','purged')),
  deleted_by uuid references public.profiles(id) on delete set null,
  deleted_at timestamptz not null default now(),
  restored_at timestamptz,
  purged_at timestamptz
);

-- RLS sin policies a propósito: solo el service role (rutas admin) puede tocarla
alter table public.deleted_items enable row level security;

create index deleted_items_status_idx on public.deleted_items (status, deleted_at desc);

comment on table public.deleted_items is
  'Admin trash (Delete Portal): snapshot JSONB completo de entidades borradas físicamente. Capa 2. Solo service-role.';

-- Capa 1: audit de quién quita recetas del producto
alter table public.guest_recipes
  add column deleted_by uuid references public.profiles(id) on delete set null;

-- Capa 1: comentarios de semántica (matan la ambigüedad sin renombrar)
comment on column public.guest_recipes.deleted_at is
  'Product-level soft delete: receta oculta del libro. La escribe el dueño (dashboard) o el admin (Operations archive). NO es la papelera admin (deleted_items).';
comment on column public.guest_recipes.deleted_by is
  'Quién puso deleted_at (dueño o admin). Audit agregado jul 2026.';
comment on column public.guests.is_archived is
  'Product-level: guest oculto de la lista del dueño. Reversible en producto. NO es la papelera admin.';
comment on column public.profiles.deleted_at is
  'Cuenta desactivada: admin soft delete o auto-borrado del usuario (users/me/delete). NO es la papelera admin (deleted_items).';
comment on column public.group_recipes.removed_at is
  'Audit product-level: receta quitada de un grupo. NO es la papelera admin.';
