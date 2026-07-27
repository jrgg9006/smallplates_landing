# Radar Notifications — Sensor continuo de libros en riesgo

**Fecha:** 2026-07-27
**Autor:** Ricardo + Claude
**Estado:** Diseño aprobado (esqueleto), pendiente review de spec

---

## 1. Problema

El fundador (solo, ~10 libros activos/mes) pierde clientes porque no se entera a tiempo de que un
libro se estancó. Ejemplo real: "Akanksha's Cookbook" (Danay Kamdar) llegó a 15/25 recetas y luego
pasó ~30 días sin que nadie subiera nada. El fundador no lo notó hasta revisar a mano.

**La causa raíz no es falta de datos.** El Radar ya calcula `daysInactive` por libro y ya tiene una
tabla "Salud por libro" que ordena los rojos primero. El problema es:

1. **La atención está en la tabla equivocada.** El fundador mira "AVANCE DE LIBROS ACTIVOS", que
   ordena por *progreso*. Danay con 15 recetas se ve sana (barra larga) cuando es la más urgente.
2. **Es pull, no push.** Depende de que el fundador entre y lea la tabla correcta. Solo, no escala.
3. **El "riesgo" es ciego al contexto.** `daysInactive` es un número fijo, ignora la cercanía al
   cierre y la caída de impulso. Un libro tranquilo 8 días con cierre lejano está bien; uno tranquilo
   4 días que cierra el viernes es una emergencia.
4. **Bug de enmascaramiento:** `daysInactive` cuenta "email enviado" como actividad. Si el fundador
   le manda un recordatorio al cliente, el contador se resetea y el libro se ve activo aunque el
   cliente siga sin mover nada.

## 2. Objetivo

Un **sensor continuo** que cada día identifica los libros en riesgo, los *interpreta* con inteligencia
(no solo un umbral), y se los presenta al fundador como una lista priorizada dentro de Radar, cada uno
con un **borrador de mensaje** listo para revisar y (fase 2) enviar al cliente.

Clave: no es "regla algorítmica >7 días = alerta". Es una **lectura interpretada** que toma múltiples
factores (coldness real del cliente, cercanía al cierre, caída de impulso, si tiene capitanes activos,
solo vs. acompañada, si la dueña misma subió, último login, último contacto del fundador) y dice, en
lenguaje humano, *qué creo que está pasando y qué haría yo*.

### No-objetivos (fuera de alcance de fase 1)
- Enviar correos automáticos al fundador (fase 2).
- Enviar mensajes al cliente sin revisión humana (fase 2, y solo cuando haya confianza en los borradores).
- Rediseñar el resto del Radar (pulso, feed, funnel). Solo se agrega la sección Notificaciones.

## 3. Arquitectura: dos capas

Regla de diseño: **no mandar cada libro a un LLM.** Es caro y ruidoso. Pre-filtrar barato, interpretar solo lo que vale la pena.

```
Cron diario (~8am)  ──►  Capa 1: pre-ranking determinístico  ──►  Capa 2: interpretación LLM  ──►  radar_notifications  ──►  UI Radar
   (+ botón                (10 libros → ~3-5 candidatos)          (solo candidatos)                (tabla)              (sección Notificaciones)
   "Regenerar ahora")
```

### Capa 1 — Pre-ranking determinístico

Corre sobre todos los libros **activos** (`book_status = 'active'`, no cerrados, excluyendo grupos de
test/admin vía `stripAdmin`). Reutiliza y extiende la lógica de `lib/radar/aggregate.ts` y
`lib/email/queries.ts`. Calcula por libro:

- **`client_coldness_days`** — días desde la última acción *del cliente*. Honesta, NO se resetea por
  correos del fundador. Se define como `today - max(...)` de:
  - última `guest_recipes.submitted_at` con `submission_status = 'submitted'`,
  - última `guests.created_at`,
  - último login de la dueña (`profiles.last_login_at` / equivalente usado en `getBooksForRemindersTip`),
  - último `user_events.created_at` de eventos originados por el cliente (`share_link_copied`, `share`, `couple_image_uploaded`).
  - **Excluye** `communication_log` y `recipe_edit_history` (ruido del fundador/admin).
- **`days_until_close`** — `book_close_date - today` si existe; si no, se usa `event_date`/`gift_date` como referencia suave; si no hay ninguna, `null`.
- **`momentum`** — recetas subidas por semana en las últimas 4 semanas. Se marca `stalled` si hubo
  ≥2 recetas en alguna semana previa y 0 en los últimos N días (default 10). Este es el caso Danay.
- **`recipes` / `goal`** — conteo actual vs. umbral de impresión (25) y brecha a la meta.

**Un libro es candidato** si es activo y cumple al menos una:
- `client_coldness_days >= COLDNESS_CANDIDATE_DAYS` (default 5), **o**
- `momentum.stalled === true`, **o**
- `days_until_close != null && days_until_close <= DEADLINE_NEAR_DAYS (default 10) && recipes < goal`.

El fundador **no** ve esta lista cruda; alimenta la Capa 2.

### Capa 2 — Interpretación con LLM

Para cada candidato se arma un contexto estructurado y se pide una lectura. Reutiliza la integración
de modelo ya cableada (OpenAI GPT-4o, usada hoy para limpieza de recetas) para no agregar API keys
nuevas. *(Upgrade path: Claude vía AI Gateway si se quiere más calidad de voz; decisión diferible.)*

**Input por libro (todo derivable de tablas existentes):**
```
{
  book_name, owner_name, occasion,
  recipes, goal, gap_to_goal,
  client_coldness_days, last_client_activity_at,
  days_until_close, close_date_source,       // book_close_date | event_date | gift_date | null
  momentum: { per_week: number[], stalled: boolean },
  captains: { count, active_count },          // group_members role captain, actividad reciente
  contributors: { distinct_submitters, owner_submitted, is_solo },
  owner_last_login_at,
  last_founder_outreach: { type, sent_at } | null  // último communication_log al organizer
}
```

**Output por libro (JSON estructurado):**
```
{
  priority: "high" | "medium" | "low",   // juicio del modelo, NO umbral fijo
  headline: string,        // 1 línea: "Danay se frenó a 15/25 hace 30 días, sin capitanes"
  interpretation: string,  // 2-4 frases: qué creo que pasa y por qué
  recommended_action: string,  // qué haría yo
  draft_message: string    // mensaje al cliente, en voz Small Plates, listo para revisar
}
```

**Restricciones del prompt (obligatorias):**
- El `draft_message` sigue `brand/voice.md`: nunca las palabras vetadas (cherish, journey, memories,
  special, etc.), sin em dashes, sin números de invitados, "your people" no "showed up". Firma Ana.
- Si `last_founder_outreach` es reciente y el cliente sigue frío, el mensaje/acción debe reconocerlo
  (no repetir el mismo recordatorio).
- Prioridad `high` reservada para riesgo real de perder al cliente (frío + cerca de cierre, o caída de
  impulso marcada con inversión ya hecha).

## 4. Modelo de datos

Nueva tabla `radar_notifications` (una fila = lectura de un libro en una corrida):

| Columna | Tipo | Nota |
|---|---|---|
| `id` | uuid PK | |
| `group_id` | uuid FK groups | |
| `generated_at` | timestamptz | cuándo se generó |
| `priority` | text | 'high' \| 'medium' \| 'low' |
| `headline` | text | |
| `interpretation` | text | |
| `recommended_action` | text | |
| `draft_message` | text | editable en UI |
| `signals` | jsonb | snapshot del input de Capa 1 (para auditar/iterar) |
| `status` | text | 'open' \| 'attended' \| 'dismissed' (default 'open') |
| `attended_at` | timestamptz | null hasta marcar atendido |
| `cooldown_until` | timestamptz | null; se setea al marcar atendido |

**RLS:** solo admin (mismo patrón que el resto de tablas admin). Verificar policy al crear.

### Comportamiento de cooldown / "atendido"
- Al marcar **atendido**: `status='attended'`, `attended_at=now()`, `cooldown_until = now() + ATTENDED_COOLDOWN_DAYS` (default 4).
- La corrida diaria **no** genera nueva notificación para un libro cuyo `cooldown_until` sea futuro…
- **…salvo escalada:** si el libro sube a `high` estando el anterior en `medium`/`low`, o si cruza a
  `days_until_close <= 3`, se genera de nuevo aunque esté en cooldown (para no silenciar una emergencia).
- Pasado el cooldown, si sigue siendo candidato, reaparece como `open`.
- **dismissed:** el fundador puede descartar sin cooldown (no aplica / falso positivo); no reaparece
  hasta que cambie materialmente la señal.

## 5. Superficie (endpoints + UI)

- **Cron** `app/api/cron/radar-monitor/route.ts`, diario ~8am (patrón del cron existente
  `send-invitations`). Corre Capa 1 + Capa 2, escribe `radar_notifications`, respeta cooldown.
- **Regenerar ahora** — endpoint admin que dispara la misma rutina on-demand (para iterar los mensajes
  sin esperar al cron). Botón en la sección.
- **Sección "Notificaciones"** — nuevo componente `components/admin/radar/Notifications.tsx`, colocado
  **arriba** en `RadarDashboard.tsx` (primera cosa que se ve). Muestra:
  - Lista ordenada por prioridad (high → low), luego por coldness.
  - Cada item: badge de prioridad, `headline`, expandible a `interpretation` + `recommended_action` + `draft_message` copiable.
  - Acciones: **Copiar borrador**, **Marcar atendido**, **Descartar**. Link al detalle del libro que se
    queda en Radar (arreglando el bug de "Back to Activity").
- **API de lectura** — `app/api/v1/admin/radar/notifications/route.ts` (GET lista, PATCH status).

## 6. Bugs arreglados de paso
- **Coldness honesta:** la señal de riesgo mide actividad-del-cliente, no correos del fundador (§3, Capa 1).
- **Back button:** desde Radar, el link al detalle de un libro y su "Back" regresan a `/admin/radar`,
  no a `/admin/activity`. (En `BookProgress.tsx` / `GroupHealthTable.tsx` y la página de detalle.)

## 7. Fases
- **Fase 1 (este spec):** todo in-app en Radar. Borradores para copiar/pegar. Se itera la calidad de la
  interpretación y de los mensajes con el botón "Regenerar ahora".
- **Fase 2 (después):** el mismo contenido se envía por correo al fundador en la mañana; el
  `draft_message` se manda al cliente con un clic (nuevo `CommunicationType`, log en `communication_log`).

## 8. Constantes (ajustables)
```
COLDNESS_CANDIDATE_DAYS = 5
DEADLINE_NEAR_DAYS      = 10
MOMENTUM_STALL_DAYS     = 10
ATTENDED_COOLDOWN_DAYS  = 4
PRINT_GOAL              = 25
```

## 9. Riesgos / decisiones abiertas
- **Modelo:** default OpenAI GPT-4o (ya cableado). Si la voz de marca no sale bien, upgrade a Claude.
- **Calidad de `draft_message`:** por eso fase 1 es solo in-app; se mide y ajusta antes de mandar nada real.
- **Costo:** ~3-5 candidatos/día × 1 llamada = trivial a esta escala.
- **Falsos positivos:** el botón "Descartar" y el cooldown evitan fatiga de alertas.
