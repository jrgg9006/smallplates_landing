# Delete Portal — Diseño

**Fecha:** 2026-07-09
**Estado:** Aprobado por Ricardo (pendiente plan de implementación)

## Problema

Hoy el único borrado seguro desde el admin es el de profiles (`/admin/users`). Para borrar guests, recetas o grupos de test, Ricardo tiene que ir al editor de Supabase y borrar filas por ID, sin visibilidad de cascadas y sin red de seguridad. Un click mal puesto no tiene undo. Objetivo: **un solo portal desde donde se borra todo, con visibilidad total de consecuencias y sin posibilidad de perder datos de clientes reales.**

## Decisiones tomadas

| Decisión | Elección |
|---|---|
| Modelo de seguridad | Papelera con retención (nada se borra de verdad al primer click) |
| Alcance v1 | Las 4 entidades: profiles, groups/books, guests, recipes |
| Ubicación | Página nueva `/admin/delete` con tabs; `/admin/users` se queda para gestión |
| Protección | Pagado = intocable (capa superior al flag TEST) |
| Vaciado de papelera | Manual únicamente, sin auto-purga |
| Implementación de papelera | Archivo JSONB (`deleted_items`), NO columnas `deleted_at` nuevas |

## Modelo de 2 capas (semántica de borrado)

**Capa 1 — "Quitado del producto" (ya existe, no se toca):** la fila sigue viva, solo se oculta del producto. Columnas actuales:

| Columna | Quién la escribe | Significado |
|---|---|---|
| `guest_recipes.deleted_at` | Dueño del libro (`deleteRecipe()`) y admin (Operations → archive) | Receta quitada del libro, restaurable desde Operations |
| `guests.is_archived` | Dueño del libro | Guest oculto de su lista |
| `profiles.deleted_at` | Admin (soft delete) y el propio usuario (`users/me/delete`) | Cuenta desactivada |
| `group_recipes.removed_at/removed_by` | Sistema/admin | Audit de receta quitada de un grupo |

No se renombran (las escriben ambos actores; un rename tocaría ~25 archivos). En su lugar:
- `COMMENT ON COLUMN` en Postgres documentando cada una
- Comentarios espejo en `lib/types/database.ts`
- Columna nueva `guest_recipes.deleted_by` (hoy no se sabe quién quitó una receta)

**Capa 2 — "Papelera admin" (lo nuevo):** la fila se va físicamente de las tablas vivas a `deleted_items`. Sin ambigüedad: no es una columna, es otra tabla.

## Tabla `deleted_items`

```
id            uuid PK
entity_type   'profile' | 'group' | 'guest' | 'recipe'
entity_id     uuid          -- id original del objeto raíz
entity_label  text          -- nombre humano ("test@…", "Richi's Birthday!")
payload       jsonb         -- snapshot completo: fila raíz + todas las hijas, por tabla
counts        jsonb         -- resumen {guests: 5, recipes: 3…}
status        'trashed' | 'restored' | 'purged'
deleted_by    uuid          -- admin que borró
deleted_at    timestamptz
restored_at   timestamptz
purged_at     timestamptz
```

- Al purgar: `payload` se vacía, `status = 'purged'`, la fila queda como **audit log permanente**.
- **RLS**: activado, cero policies → solo service role (rutas admin).

## Flujo de trash (3 pasos, visibles como checklist en la UI)

1. **Snapshot** — leer fila raíz + toda la cascada (generalizar la lógica de `hard-delete-preview` a `lib/admin/deletion/`)
2. **Archivar** — insertar snapshot en `deleted_items`
3. **DELETE de la raíz** — un solo statement; las cascadas FK de Postgres son atómicas (todo o nada)

Si el DELETE falla (ej. FK NO ACTION por orders), el snapshot huérfano se limpia y se muestra el motivo ("🛡️ Protegido: tiene 2 orders pagadas").

**Profiles:** trash NO borra `auth.users` — solo ban (sin login, email reservado). El auth user se borra al purgar (email queda reusable).

## Mapa de cascadas (verificado en la DB el 2026-07-09)

- **GROUP** → CASCADE: guest_recipes (y sus hijas), group_members, group_invitations, group_recipes, cookbooks (→ cookbook_recipes), book_qa_reviews, recipe_annex_images. SET NULL: guests.group_id, communication_log.group_id. **NO ACTION (bloquea): orders, shipping_addresses.**
- **GUEST** → CASCADE: guest_recipes (y sus hijas), communication_log.
- **RECIPE (guest_recipes)** → CASCADE: cookbook_recipes, group_recipes, image_processing_queue, midjourney_prompts, prompt_evaluations, recipe_annex_images, recipe_edit_history, recipe_print_ready, recipe_production_status. SET NULL: debug_logs.
- **PROFILE** → CASCADE: groups (cascada completa), guests, guest_recipes, cookbooks, cookbook_recipes, communication_log, group_members, group_invitations, group_recipes. **NO ACTION (bloquea): book_qa_reviews.created_by.**

## UI: `/admin/delete`

5 tabs: **Books · Profiles · Guests · Recipes · Papelera**. Búsqueda y filtros por tab. Badges: `🛡️ PAID`, `🧪 TEST`, `👻 quitada del producto` (capa 1).

Click en fila → sheet con **preview de cascada con nombres** (nunca solo números) + confirmación escrita (nombre/email) → [Mandar a papelera].

### Reglas por entidad

| Entidad | Trash incluye | Protecciones |
|---|---|---|
| Recipe | Receta + 9 tablas hijas | Ninguna especial |
| Guest | Guest + recetas + comm log | Aviso si recetas en libro cerrado/producción |
| Book | Grupo completo + **guests explícitamente** (la FK los dejaría huérfanos) | Bloqueado si tiene orders/shipping (DB lo impide) |
| Profile | Grupos (cascada), guests, recetas, cookbooks + ban auth | Bloqueado si orders pagadas. Grupo con otros members → elegir: transferir o borrar completo |

### Tab Papelera

- Lista: qué era, quién borró, cuándo, resumen
- **[Restaurar]** — preview de restore + re-inserción
- **[🔥 Purgar]** — solo si dueño es TEST **y** cero orders pagadas; doble confirmación escrita. Lo demás vive en papelera indefinidamente

`/admin/users` conserva gestión (clean, reset onboarding, flag test); sus borrados redirigen al portal.

## Restore

- Preview de restore antes de ejecutar (misma filosofía que el trash)
- Re-inserción **padres primero** (grupo → guests → recetas → hijas), **mismos IDs originales** (tokens y links vuelven a funcionar)
- **Conflictos**: si un ID ya existe vivo, se marca en preview y se omite — nunca se sobreescribe
- **Padre faltante**: ofrecer restaurar el padre primero (si está en papelera) o abortar. Nunca filas huérfanas
- Profiles: re-insertar filas + quitar ban → cuenta funcional, mismo password

## Storage (decisión v1)

Los archivos en buckets NO se borran ni en trash ni en purge. El snapshot guarda URLs; el restore las recupera intactas. Huérfanos de purga = inofensivos; limpieza aparte en el futuro.

## API (todas con `requireAdminAuth`)

- `GET  /api/v1/admin/delete/preview?type=&id=` — preview de cascada
- `POST /api/v1/admin/delete/trash` — snapshot + borrado
- `POST /api/v1/admin/delete/restore` — re-inserción desde snapshot
- `POST /api/v1/admin/delete/purge` — purga (solo TEST + sin pagos)
- `GET  /api/v1/admin/delete/trash-list` — contenido de papelera

## Verificación

1. Tests de integración de snapshot/restore (orden de inserción, conflictos)
2. Ensayo end-to-end con `test@smallplatesandcompany.com` ("Richi's Birthday!", 5 guests): trash → verificar desaparición → restore → verificar recuperación completa → trash → purge
3. SQL de migración entregado en bloque para ejecución manual (regla del proyecto)

## Fuera de alcance v1

- Auto-purga programada
- Borrado de archivos en Storage / limpieza de huérfanos
- Borrado en lote (multi-select)
- Renombrar columnas `deleted_at` existentes
