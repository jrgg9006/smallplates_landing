# Radar Let-Go Triage — see the dead, archive them cleanly

**Fecha:** 2026-07-28
**Autor:** Ricardo + Claude
**Estado:** Diseño (pendiente review de spec)
**Rama:** `feature/radar-notifications` (extensión del sensor de notificaciones)

> **Alcance recortado (decisión del founder 2026-07-28):** el correo de despedida (template + envío Postmark + tipo `farewell`) se difiere a **otra sesión**. Este spec cubre solo: (1) **ver claramente** qué libros ya están perdidos, y (2) **marcarlos con un clic** para sacarlos del radar, limpio y reversible.

---

## 1. Problema

El radar mezcla libros que pueden revivir con libros que ya no se van a levantar (frío total, sin inversión, reminder ignorado). Ejemplo real: "Gineele & Marco", 0 recetas, 0 contribuidores, 45 días sin login, ya se le mandó recordatorio y nada. Tenerlo junto a los que sí tienen oportunidad diluye el foco. Un radar sirve para decidir qué ignorar: falta ver los muertos aparte y poder cerrarlos de la vista.

## 2. Objetivo

1. **Clasificar** cada libro en `revive` (enfócate aquí) vs `let_go` (probablemente perdido), de forma determinística.
2. Mostrar los `let_go` en un **grupo aparte y tenue** del drawer, con el porqué.
3. Un botón **"Dar por perdido"** que **archiva** el libro: sale del radar. Reversible y sin borrar nada. Si el cliente vuelve a dar señales de vida, **resucita solo**.

### Principios
- La clasificación `let_go` es **determinística** (regla pura, testeable). El LLM no decide a quién dar por perdido; solo redacta el contexto para el founder.
- **Nunca damos por perdido a quien nunca contactamos.** `let_go` exige outreach previo ignorado. Sin outreach, sigue en `revive` con acción "manda el primer recordatorio".
- Archivar es **manual** (un clic del founder) y **reversible**. Nada se borra.
- **Sin correo en esta fase.** Marcar perdido no manda nada; solo cambia estado interno.

### No-objetivos (esta sesión)
- No correo de despedida / Postmark / tipo `farewell`. (Otra sesión.)
- No auto-clasificar-y-archivar: el sistema sugiere, el founder decide con el clic.
- No borrar libros. No tocar el resto del radar.

## 3. Clasificación de ciclo de vida (determinística)

Nueva señal en el candidato: **`outreach_ignored`** = hubo outreach del founder al organizer (`last_founder_outreach != null`) Y no hubo actividad del cliente después (`last_client_activity_at == null` o `last_founder_outreach.sent_at > last_client_activity_at`).

`classifyLifecycle(candidate): 'revive' | 'let_go'` (política **Balanceada**, aprobada 2026-07-28):

```
let_go SOLO si outreach_ignored === true Y alguna de:
  A. Sin inversión: recipes === 0 && distinct_submitters === 0 && client_coldness_days >= LETGO_COLD_NO_INVESTMENT_DAYS (40)
  B. Con inversión: recipes >= 1 && client_coldness_days >= LETGO_COLD_WITH_INVESTMENT_DAYS (60)
  C. Deadline vencido: days_until_close != null && days_until_close < 0 && gap_to_goal > 0 && client_coldness_days >= LETGO_DEADLINE_PASSED_COLD_DAYS (21)
En cualquier otro caso: revive.
```

- Si `outreach_ignored === false` → **siempre `revive`** (protege al ocupado y al no-contactado).
- Se calcula **antes** de la interpretación LLM y se pasa al prompt, para que `recommended_action` sea coherente ("parece perdido; considera darlo por perdido").

Constantes nuevas en `lib/radar/monitor-constants.ts`:
```
LETGO_COLD_NO_INVESTMENT_DAYS = 40
LETGO_COLD_WITH_INVESTMENT_DAYS = 60
LETGO_DEADLINE_PASSED_COLD_DAYS = 21
```

## 4. Archivar y resurrección (una columna nullable)

Marcador durable a nivel libro: nueva columna nullable **`groups.radar_archived_at timestamptz`**.

- **Archivar** ("Dar por perdido"): set `radar_archived_at = now()` para ese grupo. Se marca también la notificación abierta como `dismissed`.
- **Supresión en el monitor:** un libro se excluye de candidatos (no genera notificación) si `radar_archived_at != null` Y no hubo actividad del cliente después: `last_client_activity_at == null` o `radar_archived_at >= last_client_activity_at`.
- **Resurrección automática:** si hay actividad del cliente posterior (`last_client_activity_at > radar_archived_at`), la supresión deja de aplicar y el libro vuelve al radar. Al generar la nueva notificación, se limpia `radar_archived_at = null` para dejar el dato limpio.
- La honest-coldness ya ignora `communication_log`; archivar es un cambio de estado interno, no toca la actividad del cliente. Correcto.

## 5. Superficie

### Datos (SQL manual, el founder la corre)
- `groups`: `add column radar_archived_at timestamptz` (nullable). Additive, no default.
- `radar_notifications`: `add column lifecycle text not null default 'revive' check (lifecycle in ('revive','let_go'))`.

### Backend
- `lib/radar/lifecycle.ts` (nuevo): `computeOutreachIgnored(candidate)` y `classifyLifecycle(candidate)` puras, con tests.
- `lib/radar/monitor-types.ts`: agregar `outreach_ignored: boolean` y `lifecycle: 'revive' | 'let_go'` al candidato; `lifecycle` a `RadarNotificationRow`.
- `lib/radar/monitor.ts`: computar `outreach_ignored` y `lifecycle` en cada candidato.
- `lib/radar/run-monitor.ts`: (a) fetch de `radar_archived_at` por grupo; (b) excluir archivados-no-resucitados; (c) limpiar `radar_archived_at` de los resucitados; (d) persistir `lifecycle` en la notificación; (e) pasar `lifecycle` al prompt.
- `lib/radar/monitor-prompt.ts`: el prompt recibe `lifecycle`; para `let_go`, `recommended_action` sugiere darlo por perdido.
- `app/api/v1/admin/radar/notifications/route.ts` (PATCH existente): agregar acción `archive` → set `groups.radar_archived_at = now()` para el grupo de la notificación + marcar la notificación `dismissed`. (Reusa la ruta PATCH; nuevo valor de `status`/acción, con `requireAdminAuth` como ya está.)

### UI (drawer)
- El drawer se parte en **dos grupos**:
  - **"Enfócate aquí"** (`lifecycle === 'revive'`): como hoy (nudge + borrador copiable).
  - **"Probablemente perdidos"** (`lifecycle === 'let_go'`): grupo tenue/apagado (visualmente secundario). Cada card muestra el contexto (por qué se considera perdido: días fríos, 0 recetas/contribuidores, reminder ignorado, deadline) + botón **"Dar por perdido"** con confirmación corta ("Se saca este libro del radar. Puedes recuperarlo si el cliente vuelve. ¿Confirmar?"). Al confirmar: PATCH `archive`, el card sale de la lista, el badge baja.
  - También botón **"Descartar"** (quitar de la vista sin archivar, por si quiere darle una última chance manual).
- El badge de conteo cuenta abiertas; el rojo sigue atado a `high`. Los `let_go` no son `high`, así que no encienden rojo (coherente: no son urgencias, son cierres).
- Etiqueta del grupo/acción: "Probablemente perdidos" / "Dar por perdido" (neutral y claro; el founder puede renombrar a "zombi"/"muerto" si prefiere, es solo copy).

## 6. Riesgos / decisiones
- **Falsos "perdidos":** la regla exige outreach previo ignorado + umbrales altos (40/60 días) + es solo una **sugerencia** (el founder aprieta el clic). "Descartar" y la resurrección automática son las redes.
- **Reversibilidad:** archivar solo pone un timestamp; el libro reaparece con cualquier señal real del cliente. Nada se borra.
- **Coherencia con el correo futuro:** cuando se agregue la despedida (otra sesión), el envío del correo puede reusar este mismo `radar_archived_at` como el momento de standby. Este diseño no lo bloquea.
