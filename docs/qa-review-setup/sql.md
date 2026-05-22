# QA Review — SQL migrations (correr manualmente en Supabase)

> Estas son **TODAS** las migraciones de base de datos para la feature de QA Review.
> Corre cada bloque por orden en el SQL Editor de Supabase Dashboard.
> Ninguna depende de servicios externos — son puro DDL/DML estándar.

---

## 1. Tabla `book_qa_reviews`

```sql
create table public.book_qa_reviews (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,

  status text not null check (status in ('uploading','processing','complete','failed')),

  -- PDF en Storage (nullable después de auto-borrarlo al completar)
  storage_path text,
  pdf_size_bytes bigint,
  pdf_page_count int,

  -- Resultados
  findings jsonb,
  human_summary text,
  critical_count int default 0,
  warning_count int default 0,
  info_count int default 0,

  -- Tracking
  gemini_model text default 'gemini-2.5-pro',
  cost_usd numeric(10,4),
  duration_ms int,
  error_message text,

  created_at timestamptz default now(),
  created_by uuid references public.profiles(id),
  completed_at timestamptz
);

create index book_qa_reviews_group_id_created_at_idx
  on public.book_qa_reviews(group_id, created_at desc);

comment on table public.book_qa_reviews is
  'QA agent reviews of generated wedding cookbook PDFs. PDF binary is not stored long-term; only the structured report.';

comment on column public.book_qa_reviews.findings is
  'Array<QAFinding>: { page, severity, category, description, confidence?, suggestion?, source: "deterministic"|"gemini", diff? }';
```

---

## 2. RLS

```sql
alter table public.book_qa_reviews enable row level security;

-- Lecturas: solo admins (mismo patrón que el resto del admin)
-- NOTA: las inserciones/updates/deletes pasan por la service-role key
-- desde las API routes, así que no necesitan policy explícita.
-- ⚠️  La lista de emails de abajo DEBE coincidir con `ADMIN_EMAILS` en lib/config/admin.ts.
-- Hoy solo hay un admin oficial: team@smallplatesandcompany.com.
-- Si agregas admins en el código, agrégalos también aquí (o usa la función is_admin de abajo).
create policy "admin_select_qa_reviews"
  on public.book_qa_reviews
  for select
  to authenticated
  using (
    exists (
      select 1
      from auth.users u
      where u.id = auth.uid()
      and lower(u.email) = any(
        array['team@smallplatesandcompany.com']
      )
    )
  );
```

> ℹ️ Las escrituras (insert/update/delete) NO requieren policy porque pasan por el
> `service-role key` desde las API routes, que bypassea RLS por diseño.
> La policy de arriba solo controla SELECT desde clientes con sesión autenticada.

---

## 3. Storage bucket `qa-temp`

```sql
-- Bucket privado para PDFs temporales que sube el admin
-- Limit: 60 MB para permitir hasta 50 MB con un poco de margen
-- MIME: solo PDFs
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('qa-temp', 'qa-temp', false, 62914560, array['application/pdf']::text[])
on conflict (id) do update
  set file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;
```

Las rutas dentro del bucket son: `qa-temp/{group_id}/{review_id}.pdf`.

No requieren policies adicionales — todo el acceso pasa por signed URLs generadas
desde el server con service-role.

---

## 4. Tipos de TypeScript

**⚠️ NO corras nada en Supabase para este paso — esto NO es SQL.**

Los tipos de TypeScript para `book_qa_reviews` ya fueron agregados a
`lib/types/database.ts` durante la implementación. No tienes que hacer nada.

Si por alguna razón te falta, mira el bloque que vive en
`lib/types/database.ts:678` (debajo de `newsletter_subscribers`).

---

## Verificación post-migración

Después de correr el SQL, corre estas queries para confirmar:

```sql
-- 1. Tabla existe + tiene RLS habilitado
select tablename, rowsecurity from pg_tables where tablename = 'book_qa_reviews';

-- 2. Policy existe
select policyname, cmd from pg_policies where tablename = 'book_qa_reviews';

-- 3. Bucket existe
select id, public, file_size_limit, allowed_mime_types from storage.buckets where id = 'qa-temp';

-- 4. Foreign key se respeta (debería fallar con error de FK)
-- insert into book_qa_reviews (group_id, status) values (gen_random_uuid(), 'uploading');
```

Si las 3 primeras devuelven 1 fila cada una y el insert de prueba falla con FK violation
(o lo comentas), todo está bien.
