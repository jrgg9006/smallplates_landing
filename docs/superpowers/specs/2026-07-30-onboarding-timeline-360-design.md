# Onboarding Timeline 360 — Design Spec

**Date:** 2026-07-30
**Status:** Approved for planning
**Author:** Ricardo + Claude

## Problem

En pre-PMF, los primeros minutos de un usuario deciden si se queda o se va. Hoy, cuando alguien se registra (ej. "Victor Sosa"), el fundador no tiene una vista de qué hizo, en qué orden, y con qué tiempos: ¿eligió ocasión?, ¿puso fecha?, ¿subió foto?, ¿editó el mensaje del link?, ¿invitó capitán?, ¿compartió?, ¿tiene guests? Sin eso, se optimiza a ciegas y se pierden usuarios por no saber a quién y cuándo darle seguimiento.

**Diagnóstico clave:** el dato ya existe (en `groups`, `group_members`, `guests`, `user_events`). Lo que falta es una **vista que lo ensamble por usuario** en orden cronológico con tiempos. Somos data-ricos, vista-pobres.

## Scope de esta entrega (Fase 1)

Una **timeline 360 del onboarding** dentro del drill-down por usuario que ya existe (`/admin/activity/[userId]`). Es el detalle de UN usuario.

**Fuera de scope (fases posteriores, ya conceptualizadas, no en este spec):**
- Fase 2: sección "Newborns" en el Radar (lista-atajo de libros nuevos que enlaza a este 360).
- Fase 3: medianas de tiempo entre pasos en el funnel + alertas proactivas de usuarios estancados.

No se toca el Feed en vivo (ya muestra los eventos como ambiente).

## Decisiones acordadas

1. **Ubicación:** el 360 vive en el drill-down `/admin/activity/[userId]`, entre el stats bar y la tabla de Guests. Reutiliza una página existente y desaprovechada.
2. **Los 10 hitos** de la timeline (en orden de onboarding):

| # | Hito | ¿Pasó? (estado) | ¿Cuándo? (evento) |
|---|---|---|---|
| 1 | Cuenta creada | `profiles.created_at` | ancla T0 |
| 2 | Libro creado (+ nombre) | `groups.created_at` | `book_created` |
| 3 | Ocasión elegida | `groups.occasion` | — (pre-signup, sin hora) |
| 4 | Fecha de entrega | `groups.gift_date` / `groups.event_date` | — (pre-signup, sin hora) |
| 5 | Foto subida | `groups.couple_image_url` | `couple_image_uploaded` |
| 6 | Mensaje del link editado | `group_members.custom_share_message` | `share_message_edited` |
| 7 | Capitán/co-organizador invitado | `group_invitations` / captain data | invitación |
| 8 | Link compartido | evento | `share` / `share_link_copied` |
| 9 | Primer guest agregado | `guests` (más antiguo, `is_self=false`) | `guests.created_at` |
| 10 | Primera receta recibida | `recipes` (más antigua) | `recipes.created_at` |

3. **Estado vs. evento:** cada hito revisa primero el ESTADO (¿existe el dato? → hecho) y luego busca el EVENTO para la hora.
   - Estado presente + evento → hora + delta.
   - Estado presente + sin evento → `done: true`, `at: null`, se muestra "✓ (sin hora)". Cubre usuarios registrados antes de instrumentar los eventos nuevos (foto/texto).
   - Estado ausente → `done: false`, pendiente (gris).
4. **Número estrella:** tiempo **registro → primer share** arriba a la derecha. Si aún no comparte, muestra "aún no comparte · Xh" en rojo.

## Visual (mock aprobado)

```
┌─ PRIMEROS MOMENTOS ──────────────────────  Registro → 1er share: 1h 1m ─┐
│  ●  Cuenta creada            ayer 11:32 p.m.                             │
│  │      +0 min                                                           │
│  ●  Libro creado "Victor & Karla"   ayer 11:32 p.m.                      │
│  │      +14 min                                                          │
│  ●  Ocasión: Wedding         ✓ (elegida en onboarding)                   │
│  ●  Fecha de entrega: 12 dic ✓ (elegida en onboarding)                   │
│  │      +47 min                                                          │
│  ●  Foto subida              ayer 12:19 a.m.                             │
│  ●  Mensaje del link editado ✓ (sin hora)                                │
│  │      +8 min                                                           │
│  ●  Link compartido (copy)   hoy 12:33 a.m.                              │
│  ○  Capitán invitado         — todavía no                                │
│  ●  Primer guest: V. Sosa    hoy 12:40 a.m.                              │
│  ●  Primera receta recibida  hoy 1:05 a.m.                               │
└──────────────────────────────────────────────────────────────────────────┘
```

Punto lleno ● = hecho. Punto vacío ○ = pendiente (gris). Deltas entre hitos hechos.

## Arquitectura

### Motor (función pura, testeable, reutilizable)

`lib/radar/onboarding-timeline.ts` exporta `buildOnboardingTimeline(inputs)` → `Milestone[]`. Sin IO. Reutilizable por Newborns en fase 2 (mismo motor, distinta presentación).

```ts
type MilestoneKey =
  | 'account_created' | 'book_created' | 'occasion' | 'delivery_date'
  | 'photo' | 'share_message' | 'captain' | 'shared_link'
  | 'first_guest' | 'first_recipe';

interface Milestone {
  key: MilestoneKey;
  label: string;
  done: boolean;
  at: string | null;              // ISO; null si done pero sin timestamp de evento
  source: 'event' | 'state';      // de dónde salió el "done"
  detail?: string;                // ej. "Wedding", "Victor & Karla", "copy_link"
  deltaFromPrevMs: number | null; // delta vs. el hito hecho anterior que tenga hora
}

interface OnboardingSummary {
  milestones: Milestone[];
  signupToFirstShareMs: number | null; // null si aún no comparte
  hasShared: boolean;
  multipleBooks: boolean;         // aviso si el usuario tiene >1 libro
}
```

Inputs (todos ya disponibles vía service client): `profile`, `group` (el más reciente del usuario), `groupMember` (del owner en ese group), `groupInvitations`, `guests`, `recipes`, `userEvents` (de ese user).

### Flujo de datos

1. La página `/admin/activity/[userId]` ya hace `GET /api/v1/admin/activity/users/[userId]`.
2. Se extiende el helper `getUserWithGuestsAdmin` (en `lib/supabase/admin-users.ts`) — o el endpoint — para traer además: `group(s)` del usuario, `group_member` del owner, `group_invitations`, `user_events` del usuario. (guests y recipes en buena parte ya se traen.)
3. El endpoint corre `buildOnboardingTimeline(...)` y regresa `onboarding: OnboardingSummary` junto a `profile` y `guests`.
4. Nuevo componente `components/admin/radar/OnboardingTimeline.tsx` pinta `milestones` + el número estrella. La página solo lo inserta entre el stats bar y la tabla de Guests.

## Casos borde

- **Usuario con >1 libro** (existe el bug de double-book, ~5/25 dueños): v1 ancla al libro **más reciente**; si `multipleBooks` es true, mostrar aviso chico: "Este usuario tiene 2 libros — mostrando el más reciente". No inventar, señalar.
- **Pre-signup (ocasión/fecha):** nunca tienen hora por usuario (ocurren antes de crear cuenta en el paso about-you). Siempre "✓ (elegida en onboarding)", sin delta artificial.
- **Localhost:** eventos nuevos no se graban en dev (`isTrackableHost` filtra), pero el estado sí. En dev se ven los ✓ por estado sin horas de eventos; en prod, completo.
- **Aditivo:** la tabla de Guests y el stats bar no cambian. Cero riesgo de regresión.

## Testing

- Test unitario de `buildOnboardingTimeline` (`lib/radar/onboarding-timeline.test.ts`), siguiendo el patrón de `lib/radar/aggregate.test.ts`. Casos:
  - Usuario completo con todos los eventos → 10 hitos hechos, deltas correctos, `signupToFirstShareMs` calculado.
  - Usuario con estado pero sin eventos (foto/texto) → `done: true`, `at: null`, `source: 'state'`.
  - Usuario que aún no comparte → `hasShared: false`, `signupToFirstShareMs: null`.
  - Hitos pendientes (sin estado ni evento) → `done: false`.
  - `multipleBooks: true` cuando hay >1 group.

## Archivos

**Nuevos:**
- `lib/radar/onboarding-timeline.ts` — motor + tipos
- `lib/radar/onboarding-timeline.test.ts` — tests
- `components/admin/radar/OnboardingTimeline.tsx` — presentación

**Modificados:**
- `lib/supabase/admin-users.ts` — extender query para traer group/group_member/invitations/events
- `app/api/v1/admin/activity/users/[userId]/route.ts` — correr el builder, regresar `onboarding`
- `app/(admin)/admin/activity/[userId]/page.tsx` — insertar `<OnboardingTimeline />` entre stats bar y tabla

## Notas de instrumentación (ya en `main`/trabajo previo)

Los eventos `couple_image_uploaded` y `share_message_edited` ya se disparan (foto en `POST /couple-image`; texto en `updateGroupShareMessage`). La timeline los consume para el "cuándo"; para usuarios previos cae al estado con "✓ (sin hora)".
