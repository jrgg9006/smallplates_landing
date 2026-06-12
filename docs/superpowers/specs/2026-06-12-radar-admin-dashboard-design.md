# Radar — Admin Analytics Dashboard (Spec v1)

**Fecha:** 2026-06-12
**Estado:** Aprobado en diseño, pendiente de plan de implementación
**Objetivo:** Dar al equipo fundador visibilidad total y en tiempo (casi) real de qué hacen los usuarios dentro de la plataforma: pulso diario, feed de actividad, funnel de activación y salud por grupo.

---

## 1. Contexto y principios

- Etapa pre-PMF: el valor está en **ver** la actividad y dónde se atora el funnel, no en predicción estadística (no hay volumen para eso todavía).
- **Simple pero poderoso**: cero infraestructura nueva salvo una tabla ligera de eventos. Reutiliza patrones existentes del admin (Operations).
- GA4 queda **fuera** del Radar v1 (datos con retraso 24–48h, anónimos, setup frágil). GA4 sigue para adquisición/ads en su propia consola.
- El comportamiento in-app se mide con la base de datos propia, que es en tiempo real y tiene identidad (user_id/group_id).

## 2. Arquitectura

| Pieza | Ubicación | Patrón |
|---|---|---|
| Página | `app/(admin)/admin/radar/page.tsx` | Client component, igual que Operations |
| Componentes | `components/admin/radar/` | PulseCards, LiveFeed, ActivationFunnel, GroupHealthTable |
| API | `app/api/v1/admin/radar/route.ts` (GET) | `requireAdminAuth()` + `createSupabaseAdminClient()` |
| Eventos | `app/api/v1/events/route.ts` (POST) | Inserta en `user_events` con service role |
| Tracking | `lib/analytics.ts` (extender `trackEvent()`) | GA4 + POST a `/api/v1/events`, fire-and-forget |

Decisiones clave:

- **Agregación en TypeScript, no en SQL.** El route GET trae las filas relevantes de los últimos 30 días y agrega en memoria. Con el volumen actual (decenas de usuarios) es trivial. Migrar a views de Postgres solo cuando el payload crezca (evolución prevista, no rescate).
- **Un solo GET** devuelve todo el payload del dashboard (pulso + feed + funnel + salud) para minimizar requests.
- **Polling cada 60s** en el cliente, con pausa cuando la pestaña está oculta (`visibilitychange`) e indicador "actualizado hace Xs". Sin websockets.
- **Selector de rango:** Hoy / 7 días / 30 días.
- El polling vive solo en el navegador del admin; cero impacto en usuarios finales. Recharts y el código del Radar solo se descargan en la ruta del admin (code-splitting por ruta).

## 3. Tabla `user_events`

SQL que Ricardo corre manualmente en Supabase (nunca via MCP):

```sql
create table public.user_events (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  user_id uuid references public.profiles(id) on delete set null,
  group_id uuid,
  event_name text not null,
  props jsonb not null default '{}'::jsonb
);

create index user_events_created_at_idx on public.user_events (created_at desc);
create index user_events_name_created_idx on public.user_events (event_name, created_at desc);

alter table public.user_events enable row level security;
-- Sin policies públicas a propósito: solo el service role escribe y lee.
```

Reglas del endpoint `POST /api/v1/events`:

- Valida `event_name` contra una allowlist derivada del registro `EVENTS` de `lib/analytics.ts` (+ los dos eventos nuevos). Nombre desconocido → 400, no inserta.
- Acepta `user_id`/`group_id` opcionales y `props` (jsonb) opcional.
- Nunca lanza al cliente: respuesta rápida, errores solo a log del servidor.
- Fire-and-forget desde `trackEvent()`: jamás bloquea ni degrada la UX del usuario.

Eventos nuevos a instrumentar:

| Evento | Dónde dispara | Props |
|---|---|---|
| `share_link_copied` | `ShareCollectionModal` (copy / whatsapp / email / qr) | `{ channel }` |
| `couple_image_uploaded` | **Server-side** en `POST /api/v1/groups/[groupId]/couple-image` (groups no tiene timestamp para esa foto) | `{}` |

Nota (descubierto en planeación): `recipe_deleted` NO se instrumenta como evento cliente — `deleteRecipe()` ya hace soft delete vía `guest_recipes.deleted_at`, así que el Radar lee los borrados directo de la base (más confiable).

Los eventos existentes del funnel de onboarding (PR #36: `start_book_click`, `onboarding_step_view`, `sign_up`, `book_created`, `share`, `onboarding_completed`, `start_recipe`, `submit_recipe`, etc.) se persisten automáticamente al extender `trackEvent()`.

## 4. Fuentes de datos por métrica

| Métrica | Fuente |
|---|---|
| Usuarios nuevos / día | `profiles.created_at` |
| Libros (grupos) creados | `groups.created_at`, `status` |
| Recetas creadas (+ método y origen) | `guest_recipes.created_at`, `source` (manual/collection/imported), `upload_method` |
| Recetas con foto | `guest_recipes.image_url is not null` |
| Foto del couple subida ("imán" → aclarado: es la couple image) | `groups.couple_image_url is not null` |
| Invitados agregados (+ si fue import) | `guests.created_at`, `source` |
| Reminders / correos enviados | `communication_log` (`type`, `channel`, `status`, `sent_at`, `opened_at`) |
| Invitaciones a capitanes | `group_invitations.created_at`, `status` |
| Receta editada | `recipe_edit_history.created_at`, `edited_by` |
| Receta eliminada | `guest_recipes.deleted_at` (soft delete ya existente) |
| Link compartido | `user_events` (`share_link_copied` / `share`) — antes invisible |
| Compras | `orders.created_at`, `status`, `amount_total` |

## 5. Secciones del dashboard

### 5.1 Pulso (fila superior — 6 tarjetas)

Usuarios nuevos · Libros creados · Recetas nuevas · Invitados agregados · Correos enviados · Recetas con foto.

(La tarjeta de "fotos de couple" se descartó: `couple_image_url` no tiene timestamp, así que no puede contarse por día. El upload de esa foto sí aparece en el feed vía el evento server-side `couple_image_uploaded`.)

Cada tarjeta: número grande del periodo, delta vs día anterior (▲▼ con color) y vs promedio 7 días, sparkline de 14 días, y tooltip ⓘ con la **definición exacta** de la métrica ("Usuarios nuevos = filas en `profiles` creadas ese día"). Nada ambiguo.

### 5.2 Feed en vivo (columna derecha, scrolleable)

Stream cronológico unificado de las últimas ~50 acciones, merge en TS de: `profiles` (registros), `groups` (libros creados), `guest_recipes` (recetas, con/sin foto, vía link o manual), `guests` (altas + imports), `communication_log` (correos/reminders), `recipe_edit_history` (ediciones), `orders` (compras), `user_events` (shares, deletes).

Formato: *"María G. subió 'Lasaña de la abuela' con foto (vía link) — hace 4 min"*. Icono y color por tipo de evento.

### 5.3 Funnel de activación (cohorte: registros de los últimos 30 días)

Barras horizontales con conteo y % de conversión paso a paso:

1. Registro (`profiles`)
2. Libro creado (`groups`)
3. ≥1 invitado agregado (`guests`)
4. Link compartido (`user_events.share_link_copied`; **proxy temporal** mientras acumula datos: existe algún guest con `source='collection'` — el ⓘ lo explica)
5. 1ª receta recibida (`guest_recipes`)
6. ≥5 recetas
7. Foto del couple subida (`couple_image_url`)
8. Compra (`orders`)

### 5.4 Salud por grupo (tabla, una fila por libro activo)

Columnas: Grupo · dueño · etapa del funnel · # recetas (con/sin foto) · # invitados · último correo · días sin actividad · semáforo.

- "Última actividad" = max(última receta, último guest agregado, último correo, última edición).
- Semáforo: 🟢 < 3 días · 🟡 3–7 días · 🔴 > 7 días sin actividad.
- Orden default: por riesgo (rojos arriba). Clic en fila → `/admin/activity/[userId]` (detalle existente; el Radar lo complementa, no lo duplica).

## 6. Diseño visual

- Admin UI = excepción al sistema tipográfico `type-*` (permitido por CLAUDE.md para UI funcional).
- Estética consistente con el admin actual: fondo warm white `#FAF7F2`, tarjetas blancas con sombra suave, acentos honey `#D4A854` para deltas positivos.
- **Recharts** (nueva dependencia, aprobada por Ricardo) para sparklines y barras del funnel, usando los tokens de color de chart ya definidos en Tailwind.
- Densidad pensada para "pestaña siempre abierta": informativo de un vistazo, sin scroll para el pulso.

## 7. Manejo de errores

- GET del Radar falla → la página conserva los últimos datos y muestra banner "sin conexión, reintentando"; no se vacía.
- POST de eventos falla → silencioso para el usuario, log en servidor. Nunca afecta la UX del producto.
- Queries parciales: si una fuente falla (p. ej. `recipe_edit_history`), el payload marca esa sección como degradada y el resto se renderiza.

## 8. Fuera de alcance (v1)

- Predicción, correlaciones automáticas y análisis de levers (v2, cuando `user_events` tenga 2–3 meses de datos).
- Integración GA4 Data API.
- Retention curves, exports, filtros complejos, websockets.
- Modificar cualquier tabla existente (solo se crea `user_events`).

## 9. Criterios de éxito

- Ricardo abre `/admin/radar` y en <5 segundos sabe: cuántos usuarios nuevos hoy vs ayer, qué pasó en la última hora, dónde se atora el funnel y qué grupos están en riesgo.
- Cada métrica tiene definición visible (ⓘ). Cero ambigüedad.
- Cero impacto medible en la experiencia de usuarios finales.
- `user_events` acumula eventos desde el día del deploy.
