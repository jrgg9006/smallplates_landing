# Investigación: ¿por qué un usuario terminó con DOS libros? (Maritza Facio)

**Fecha:** 2026-06-14
**Disparador:** En el Radar (Feed en vivo) aparecieron dos "Libro creado" para el mismo usuario nuevo (Maritza Facio), con ~4 min de diferencia.
**Pregunta:** ¿Es un bug? ¿El sistema puede crear dos libros solo? ¿O el usuario lo hizo a propósito?
**Alcance:** Solo investigación. No se cambió código.

---

## TL;DR (veredicto)

**No fue una duplicación automática del sistema.** El usuario **completó el onboarding free-tier DOS veces** en la misma sesión (dos eventos `onboarding_completed`, ~3 min aparte). Cada pase creó un libro:

- **Pase 1** (00:53–00:54) → creó el libro original.
- **Pase 2** (00:56:50–00:57:44) → volvió a empezar desde el paso "occasion" y creó un **segundo** libro. El backend registró este segundo `book_created` con **`is_new_user: "false"`**.

La causa de fondo es un **hueco de diseño (falta de idempotencia)**: cuando un usuario que **ya tiene cuenta** vuelve a pasar por el onboarding, el endpoint `/api/v1/groups/free` cae en la rama de "usuario existente → SIEMPRE crea un grupo nuevo", en vez de reusar su libro free-tier vacío. No hay deduplicación.

**No es un bug crítico / corrupción** — el sistema hizo lo que el código dice. Pero sí es un **gap real** que deja libros huérfanos vacíos. **No es único de Maritza: 5 de 25 dueños tienen 2+ grupos.**

---

## Evidencia

### 1. Los dos libros (tabla `groups`)

| # | name | occasion | couple_first_name | partner_first_name | created_at | recetas | guests |
|---|------|----------|-------------------|--------------------|------------|---------|--------|
| 1 | **Maritza** | wedding | `Maritza and Aldwin` | `Aldwin Erning` | 00:53:36.672 | 0 | 0 |
| 2 | **Maritza & Aldwin** | wedding | `Maritza` | `Aldwin` | 00:57:17.339 | 0 | 0 |

Ambos `status=free_tier`, `book_status=active`, **vacíos**.

- El **#2** tiene nombres limpios (`Maritza` / `Aldwin`) y su `name` = `"Maritza & Aldwin"` coincide exacto con la fórmula de `/groups/free` (`coupleFirstName & partnerFirstName`). → Es el insert "limpio" del pase 2.
- El **#1** tiene los nombres **mal metidos** (toda la pareja en un campo) y su `name="Maritza"` **no** coincide con la fórmula → viene de un envío confuso/anterior (pase 1).

### 2. La cuenta auth (creada UNA sola vez)

| created_at | email_confirmed_at | last_sign_in_at | provider |
|---|---|---|---|
| 00:53:36.091 | 00:53:36.163 | 00:53:37.600 | email |

Una sola cuenta. El email se confirma al instante porque `/groups/free` usa `createUser({ email_confirm: true })`.

### 3. Timeline de `user_events` (la prueba reina)

```
PASE 1
00:53:38  onboarding_step_view  step 5 co_organizer      (free_tier)
00:53:59  onboarding_step_view  step 6 personalize_invite
00:54:04  onboarding_step_view  step 7 invite_first
00:54:16  onboarding_completed                            ← terminó el onboarding (1ª vez)

(pausa ~2.5 min)

PASE 2
00:56:50  onboarding_step_view  step 2 occasion           ← volvió a EMPEZAR
00:56:52  onboarding_step_view  step 3 book_date  (wedding)
00:56:59  onboarding_step_view  step 4 about_you (wedding)
00:57:17  book_created          { is_new_user: "false" }  ← creó el 2º libro
00:57:18  onboarding_step_view  step 5 co_organizer
00:57:23  onboarding_step_view  step 6 personalize_invite
00:57:27  onboarding_step_view  step 6 personalize_invite (repite)
00:57:42  onboarding_step_view  step 7 invite_first
00:57:44  onboarding_completed                            ← terminó (2ª vez)
```

El pase 1 arranca en el **paso 5** porque `/groups/free` **redirige a `/onboarding/co-organizer`** (paso 5) después de crear el libro. O sea: el libro del pase 1 ya estaba creado antes del primer evento.

---

## Cómo se crean los libros (mecánica del código)

Hay **dos** puntos que insertan en `groups` durante el alta:

1. **Trigger de BD `handle_new_user`** (en `auth.users`, al crear la cuenta): inserta un **placeholder** `'My First Cookbook'`.
   - El `INSERT INTO profiles` del trigger **no** tiene guard de conflicto, así que si el trigger corre dos veces (existen 2 triggers: `on_auth_user_created` y `on_auth_user_email_confirmed`), el **segundo intento falla en el profile insert** y no llega a crear un segundo grupo. → **Descarta la teoría de "el trigger creó dos".**

2. **Endpoint `/api/v1/groups/free`** (llamado solo desde `/onboarding/about-you`):
   - **Usuario nuevo** (`isNewUser=true`): *"Scenario A"* → busca el placeholder y lo **actualiza** (renombra al nombre real). → 1 solo libro.
   - **Usuario existente** (`isNewUser=false`): rama `else` → **SIEMPRE inserta un grupo nuevo**. Comentario en el código:
     > `// Existing user — ALWAYS create a new group. Never touch existing ones`

   ⚠️ El comentario de arriba del bloque promete un *"Scenario B: existing user re-doing free tier → has a free_tier group → update it"*, **pero ese caso NO está implementado** — la rama `else` siempre crea uno nuevo.

### Aplicado a Maritza

- **Pase 1:** `createUser` la crea (nueva) → trigger placeholder → `/groups/free` Scenario A lo consume/renombra → **libro #1**.
- **Pase 2:** vuelve a `about-you` y reenvía. Ahora `createUser` responde *"already been registered"* → `isNewUser=false` → rama `else` → **inserta libro #2** (`is_new_user:"false"` en el evento). El libro #1 queda como **huérfano vacío**.

---

## ¿Bug o no?

**No es un bug de duplicación automática.** El sistema ejecutó exactamente lo que está codificado. Lo que falla es de **diseño/UX**, en tres frentes:

1. **Falta de idempotencia (lo principal):** si un usuario re-hace el onboarding (botón atrás, refrescar, o restart como Maritza), la rama `else` le crea otro libro en vez de reusar su libro free-tier **vacío**. No hay dedupe ni ventana de gracia.
2. **Comentario/código inconsistente:** el "Scenario B" (reusar el free_tier existente) está documentado pero **no implementado**.
3. **Comentario obsoleto en el trigger:** dice que el libro real se crea en `wedding-onboarding.ts` vía `createUserProfileAdmin()` — **ese archivo y esa función ya no existen** (el flujo real es free-tier). Despista a quien lea el trigger.

**¿Lo hizo a propósito?** Casi seguro **no quería dos libros**. La historia más probable: en el **pase 1 metió los nombres mal** (toda la pareja en un campo: `"Maritza and Aldwin"` + `"Aldwin Erning"`), el libro salió raro, y **reinició el onboarding para corregir**, esta vez con nombres limpios (`Maritza` / `Aldwin`) → `"Maritza & Aldwin"`. Resultado no deseado: dos libros.

---

## Detalle no resuelto al 100% (inmaterial para el veredicto)

El `name="Maritza"` del libro #1 **no** sale de la fórmula de `/groups/free` (que daría `"Maritza and Aldwin & Aldwin Erning"`). No pude determinar con la evidencia disponible si:
- (a) el placeholder `'My First Cookbook'` fue renombrado a `"Maritza"` por un paso posterior, o
- (b) el pase 1 entró con un estado de formulario inconsistente (occasion/honoree mezclados).

Esto **no cambia la conclusión** (dos pases de onboarding → dos libros). Es un detalle forense del pase 1 que requeriría rastrear el render del form `about-you` paso a paso.

---

## Impacto / prevalencia

- **5 de 25 dueños** (`group_members`/`groups`) tienen **2+ grupos**. No todos son necesariamente este bug (puede haber casos legítimos: equipo, capitanes, o alguien que sí quiso 2 libros), pero confirma que **el patrón existe y no es exclusivo de Maritza**.
- **Síntomas:** libros fantasma vacíos que ensucian el Feed del Radar, la tabla "Salud por libro", y potencialmente conteos/funnel. (En el funnel actual no infla "Libro creado" porque se cuenta por dueño único.)

---

## Recomendaciones (para después — NO aplicadas)

1. **Idempotencia en `/groups/free`:** para un usuario existente, si tiene un libro `free_tier` **vacío** (0 recetas, 0 guests) creado hace poco, **reusarlo** (update) en vez de crear otro. Implementar el "Scenario B" que el comentario ya promete.
2. **Guardar en el front contra reenvío:** deshabilitar el submit / bloquear el restart si ya hay `onboarding_completed` en la sesión, o avisar "ya tienes un libro".
3. **Limpiar comentarios obsoletos** del trigger (`wedding-onboarding.ts` ya no existe).
4. **Script de limpieza** (opcional) para mergear/archivar libros free-tier huérfanos vacíos (los 5 casos), con cuidado de no tocar libros con recetas/guests.
5. **Decisión de producto:** definir si un usuario *puede* tener varios libros gratis a la vez (hoy el `else` lo permite sin querer) o no.

---

## Apéndice: queries usadas

```sql
-- Grupos de Maritza
select g.name, g.occasion, g.couple_first_name, g.partner_first_name,
       g.status, g.created_at, g.updated_at
from groups g join profiles p on p.id=g.created_by
where p.full_name='Maritza Facio' order by g.created_at;

-- Timeline de eventos
select e.created_at, e.event_name, e.props
from user_events e join profiles p on p.id=e.user_id
where p.full_name='Maritza Facio' order by e.created_at;

-- Auth (una sola cuenta)
select u.created_at, u.email_confirmed_at, u.last_sign_in_at
from auth.users u join profiles p on p.id=u.id
where p.full_name='Maritza Facio';

-- Prevalencia
select count(*) total, count(*) filter (where n>=2) con_2plus
from (select created_by, count(*) n from groups group by created_by) t;

-- Trigger
select pg_get_functiondef('handle_new_user'::regproc);
```

**Proyecto Supabase:** `iinnpndsxepvviafrmwz` (Small_Plates).
