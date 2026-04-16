# Incident — Guest recipe RLS bug (2026-04-16)

## 1. Resumen

Guests anónimos en el flujo público `/collect/[token]` no podían enviar recetas: cada intento fallaba con `new row violates row-level security policy for table "guest_recipes"`. La causa real no estaba en el INSERT, sino en el `RETURNING` que PostgREST evalúa contra las policies de SELECT — había dos policies `PERMISSIVE` simultáneas que, combinadas con `auth.uid() = NULL` y un subquery a `group_members`, hacían fallar la lectura post-insert. Se unificaron las dos policies en una sola.

## 2. Timeline

| Fecha / hora (CT) | Evento |
|---|---|
| ~2026-04-14 | Regina Morones (mamá de la novia, cookbook de Ana Karen) intenta enviar su receta por primera vez vía `/collect/[token]`. Falla. |
| 2026-04-14 → 2026-04-16 | Regina vuelve a intentar 3 veces más (4 intentos fallidos en total). El error visible en cliente: `new row violates row-level security policy for table "guest_recipes"`. |
| 2026-04-16 (mañana) | Ricardo escala el caso. Se identifica `guest_id = c98380bf-f7cd-41d9-9636-187a34346c86`, `user_id = fb21d616-0b50-456e-bd37-a24accab1524`. |
| 2026-04-16 | Auditoría inicial sobre el flujo de submission y RLS de `guest_recipes`. Hipótesis #1 (profile sin `collection_enabled` / sin token) descartada al confirmar que ambos campos estaban correctos. |
| 2026-04-16 | Inspección de los logs de Postgres: el `command_tag` reportado era `SELECT`, no `INSERT`. Eso descartó que la WITH CHECK del INSERT estuviera fallando. |
| 2026-04-16 | Se localizan **dos** policies `PERMISSIVE` de SELECT activas sobre `guest_recipes`: `Users can view guest recipes` y `Users can view own recipes and group recipes`. |
| 2026-04-16 | Se aplica fix manual en producción: las dos policies se reemplazan por una sola unificada `guest_recipes_select_unified`. |
| 2026-04-16 | Se verifica en prod que las 4 policies finales (1 por comando) están en su lugar y que las 298 recetas accesibles vía membresía de grupo siguen siendo accesibles. |
| 2026-04-16 (pendiente) | Test funcional con Regina para confirmar que el flujo end-to-end funciona. |
| 2026-04-16 | Se persiste el fix como migración versionada `20260416_unify_guest_recipes_select_policies.sql` y se escribe este documento. |

## 3. Causa raíz

El error de Postgres `new row violates row-level security policy` se reportaba como si la WITH CHECK del INSERT estuviera fallando, pero en realidad lo que fallaba era la cláusula `RETURNING` que PostgREST agrega de forma transparente al INSERT cuando el cliente llama `.select()` después de `.insert()` — y esa lectura se evalúa contra las policies de SELECT, no las de INSERT.

`guest_recipes` tenía dos policies `PERMISSIVE` de SELECT:

1. `Users can view guest recipes` — pensada para cubrir owner autenticado + acceso anónimo público.
2. `Users can view own recipes and group recipes` — pensada para cubrir owner + miembros de grupo, con un subquery anidado a `group_members`.

En PostgreSQL, varias policies `PERMISSIVE` se combinan con `OR`. En teoría debería bastar con que una pase. En la práctica, cuando el caller es anónimo (`auth.uid() = NULL`):

- La rama del owner autenticado de cada policy no aplica.
- La subquery de la segunda policy a `group_members` se evalúa con `auth.uid() = NULL`, regresa cero filas, y deja a esa policy retornando `false`.
- La rama de acceso anónimo de la primera policy debería pasar, pero el evaluador combinado de RLS reporta una violación cuando la fila resultante del `RETURNING` no satisface el conjunto agregado de USING expressions de forma limpia.

El INSERT en sí pasaba la WITH CHECK del 13 de abril (`Allow recipe submissions`). Lo que fallaba era el `SELECT` implícito del `RETURNING`. La señal definitiva fue que el `command_tag` en los logs de Postgres era `SELECT`, no `INSERT`.

## 4. Fix aplicado

Aplicado manualmente en producción y persistido en `supabase/migrations/20260416_unify_guest_recipes_select_policies.sql`.

El fix reemplaza las dos policies `PERMISSIVE` de SELECT por una sola policy unificada `guest_recipes_select_unified` con tres ramas explícitas en un único `OR`:

- **Caso 1** — usuario autenticado dueño del cookbook: `auth.uid() = user_id`.
- **Caso 2** — usuario autenticado miembro de un grupo donde vive la receta: `id IN (SELECT recipe_id FROM group_recipes JOIN group_members ON ... WHERE profile_id = auth.uid())`.
- **Caso 3** — usuario anónimo y el cookbook tiene colección pública habilitada: `auth.uid() IS NULL AND EXISTS(SELECT 1 FROM profiles WHERE id = guest_recipes.user_id AND collection_enabled = true AND collection_link_token IS NOT NULL)`.

La migración es idempotente (`DROP POLICY IF EXISTS`) y va envuelta en `BEGIN; / COMMIT;`.

## 5. Verificación

Estado de las policies de `guest_recipes` después del fix (4 totales, una por comando):

- `INSERT` — `Allow recipe submissions` (sin cambios, definida en `20260413_fix_guest_recipes_insert_for_authenticated_guests.sql`).
- `SELECT` — `guest_recipes_select_unified` (esta migración).
- `UPDATE` — policy preexistente, sin cambios.
- `DELETE` — policy preexistente, sin cambios.

Comprobaciones funcionales en producción:

- Recetas accesibles vía membresía de grupo antes del fix: **298**.
- Recetas accesibles vía membresía de grupo después del fix: **298** (intacto).
- Acceso del owner autenticado a sus propias recetas: sin regresión.
- Test funcional de submission con Regina: **pendiente** al momento de escribir este documento.

## 6. Trabajo pendiente derivado de este incidente

1. **Migración retroactiva para `guests.group_id`.** La columna existe en producción y el código la lee/escribe (`lib/supabase/collection.ts:330`, `:692`; `lib/types/database.ts:100`, `:127`, `:166`; índice único en `20250120_update_guests_unique_constraint.sql:23`), pero **no hay migración versionada que la cree**. Riesgo de drift entre entornos. Crear `supabase/migrations/<fecha>_add_group_id_to_guests.sql` con `ALTER TABLE public.guests ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE` + índice.
2. **Mover el INSERT de `guest_recipes` a una API route con `service_role`.** Hoy el INSERT lo dispara directamente el cliente browser anónimo (`lib/supabase/collection.ts:440`, `:768`), lo que obliga a mantener policies RLS que cubran el caso anónimo en INSERT y SELECT. Mover la operación a un endpoint server-side que valide el token y use service role elimina la dependencia de RLS en el path crítico, simplifica las policies y permite logging centralizado de fallos.
3. **Logging estructurado en el error path de `lib/supabase/collection.ts`.** Hoy los errores van solo a `console.error('Recipe creation error:', recipeError)` (línea 447 y similares), que se pierden en el navegador del guest. Escribir el `recipeError.code`, `details`, `hint` y `message` a la tabla `debug_logs` (ya existe y se usa para `recipe_missing_group_id` en líneas 388-410) reduce el time-to-diagnosis de futuros incidentes de horas a minutos.

## 7. Lecciones aprendidas

- **El mensaje de Postgres `violates row-level security policy` es ambiguo entre INSERT y RETURNING.** Cuando el cliente usa `.insert().select()`, el `RETURNING` lo evalúa PostgREST contra las policies de SELECT, no las de INSERT. El primer reflejo de mirar la WITH CHECK del INSERT es incorrecto en estos casos. La señal definitiva está en el `command_tag` de los logs de Postgres (`SELECT` vs `INSERT`).
- **Policies `PERMISSIVE` múltiples no son gratis.** En teoría se combinan con `OR` y basta con que una pase. En la práctica, agregar una segunda policy `PERMISSIVE` con un subquery anidado introdujo un comportamiento sutilmente roto para el caso anónimo. Una sola policy con todas las ramas en un `OR` explícito es más fácil de razonar, más fácil de auditar y menos propensa a regresiones.
- **Diseño actual depende de RLS para autorizar operaciones en el path público crítico.** El cliente browser anónimo escribe directamente en `guest_recipes` confiando en que RLS lo autorice. Cualquier cambio de policy puede romper submissions en producción sin que haya un test que lo capture. Trabajo pendiente #2 ataca esto.
- **El historial de migraciones tiene gaps.** `guests.group_id` se agregó manualmente en producción, sin migración. La unique constraint que lo asume (`20250120_update_guests_unique_constraint.sql`) corrió correctamente porque la columna ya existía, pero un entorno limpio no podría reproducir el schema desde `supabase/migrations/`. Esto invalida el supuesto de que el directorio de migraciones sea la fuente de verdad del schema.
- **`searchGuestInCollection` con `groupId` no filtra por `user_id`** (`lib/supabase/collection.ts:190-197`, justificado en líneas 187-189). Es diseño explícito porque los grupos pueden tener múltiples organizers, pero abre la puerta a seleccionar guests con `user_id` stale cuando hay duplicados. No fue la causa de este incidente, pero merece test de cobertura.
- **`submitGuestRecipe` (línea 610) está marcado `@deprecated`** y coexiste con `submitGuestRecipeWithFiles` (línea 232). Mantener dos paths con la misma lógica de RLS duplicaba la superficie de debug de este incidente. Consolidar en uno.
