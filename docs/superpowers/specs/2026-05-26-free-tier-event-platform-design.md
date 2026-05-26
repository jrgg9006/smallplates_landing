# Free-Tier Event Platform — Design Spec

**Estado:** Draft v1 · 2026-05-26
**Autor:** Ricardo García (founder) + Claude (brainstorm partner)
**Resultado del brainstorming:** docs/superpowers/specs/

---

## 1. Problema

Hoy Small Plates cobra $169 USD upfront antes de que la mamá vea cualquier output del producto. Esa apuesta a ciegas friciona la venta. En conversaciones con leads y clientas se confirman dos patrones:

- Las mamás **no entienden qué van a recibir** hasta que pagan. No pueden ni loggearse antes del pago.
- El verdadero momento emocional del producto es el **evento** (típicamente la despedida de soltera), no la boda misma. Las mamás llegan al producto en ese momento, no antes ni después.

Esto sugiere que el cuello de botella actual **no es retención** (casi el 100% de las que pagan completan el libro), sino **adquisición**: la barrera económica antes de probar es demasiado alta para una compra unitaria de $169.

## 2. Hipótesis

Abrir un free tier que permita a la mamá crear su evento, recolectar recetas y recibir un sample tangible del libro antes de pagar — y mover el cobro al momento en que ya quiere imprimir — aumentará significativamente el volumen del top of funnel y el revenue total, aún si la tasa de conversión baja.

**Modelo análogo:** Storyworth Celebrations (free to start, paid at print). NO Storyworth Memoirs (upfront $99, libro 12 meses después).

**Riesgo principal a vigilar:** canibalización del libro físico (las que completan el free tier no upgradean). Mitigado con sample PDF claramente "teaser" y diseño premium del libro físico que es imposible de replicar caseramente.

## 3. Scope (lo que SÍ va al MVP)

### 3.1 Free creation flow
- Sign-up sin pago, passwordless (magic link + Google OAuth)
- Crear evento sin Stripe
- Onboarding multi-step estilo Storyworth Celebrations
- Estado nuevo en `groups.status`: `free_tier` (antes de `pending_setup` y `active`)

### 3.2 Onboarding multi-step
8 pantallas en sucesión, una pregunta por pantalla, con "Skip for now" donde aplique:

1. **Bienvenida** — "Así funciona Small Plates" con 4 pasos ilustrados.
2. **¿Qué evento es?** — Bridal shower / Boda / Aniversario / Cumpleaños / No estoy segura. Solo bridal shower destacado en MVP; resto como "Other" o "Coming soon".
3. **¿Cuándo te gustaría tener el libro?** — fecha + Skip for now.
4. **Cuéntanos un poco** — nombre del libro + tu nombre + tu correo. *Aquí se crea la cuenta silenciosamente.*
5. **¿Agregas a alguien que te ayude a organizar?** — co-organizer opcional + Skip.
6. **¿Cuándo y dónde es tu evento?** — fecha, hora, lugar (texto libre) + Skip.
7. **Personaliza la invitación** — mensaje editable pre-llenado + Preview Invite (vista del email que recibirán las invitadas).
8. **Invita a las primeras** — Copy link + Compartir por WhatsApp + opcional invitar por email.

### 3.3 Dashboard simplificado estilo Storyworth
- Header minimal: logo, Help, Mi cuenta dropdown. Nada más.
- Título del proyecto como protagonista (ej. "Libro de Sofía & Daniel").
- Welcome card con checklist persistente y gamificado:
  - Crea tu evento ✅
  - Invita a tu gente (next action destacada)
  - Recibe tu primera receta
  - Llega a 20 recetas
  - Imprime tu libro
- Mockup de portada arriba a la derecha como "norte" visual (con botón Editar).
- Stats: "X recetas · Y contribuyeron · Ver" (link secundario a lista de guests).
- Botones: `[ Add a recipe ]` `[ Invite ▾ ]`
- Sin imágenes de marketing ni banners promocionales.

### 3.4 Botón "Invite" con dropdown
Tres opciones:
- **Invite to event** — para personas invitadas al evento. Link público con info del evento + petición de receta.
- **Send recipe collection link** — para quien NO va al evento pero contribuye con receta. Link sin info del evento, token aleatorio para no exponer el link principal.
- **Invite a Captain** — co-organizadores.

Cada opción abre un modal con tres vías de envío:
- Manual: Copy link, Enviar por WhatsApp (mensaje pre-llenado vía `wa.me/?text=`).
- Email automatizado: seleccionar de lista persistente de guests o agregar nuevos.
- Import desde Zola/Knot (solo en modal "Invite to event"; reusa el feature existente).

### 3.5 Lista persistente de guests
Mantenemos el modelo actual: los guests pueden vivir en la lista sin haber recibido invitación aún. La diferencia vs. hoy es que esa lista NO domina el dashboard — vive como pantalla secundaria accesible por el link "Ver" en el dashboard.

Estados visibles por guest:
- Sin invitación
- Invitada al evento (link `/evento/[token]`)
- Link enviado (link `/collect/[token]/r/[token-aleatorio]`)
- Vino por link (entró por el link sin haber estado en la lista; se auto-agrega)
- Con receta / Pendiente

### 3.6 Landing pública del evento — dos URLs físicamente distintas

```
/evento/[token]              → landing CON fecha, lugar, mensaje + CTA receta
/collect/[token]/r/[token-aleatorio]  → landing SIN info del evento, solo CTA receta
                                        (token aleatorio para no exponer el principal)
```

La landing del evento es texto + un CTA grande "Mandar mi receta" que linkea al `/collect/[token]` existente (con `?from=event` para tracking del thank-you screen).

**Página pública del evento, layout aproximado:**

```
[Ilustración / foto opcional]

Libro de Sofía & Daniel

Sábado 15 de junio · 5:00 pm
En casa de María, Av. Reforma 123, CDMX

"Le estoy haciendo a Sofía un libro de recetas hecho por todas
nosotras. ¿Me ayudas con UNA receta? Toma 5 minutos."
                                    — María, su mamá

         [   Mandar mi receta  →   ]
```

Sin RSVP, sin mapa interactivo, sin galería, sin themes, sin countdown. Todo el "evento bonito" estilo Paperless Post queda OUT (ver §4).

### 3.7 Sample PDF
- 5 recetas terminadas y maquetadas en formato libro real.
- **Cuáles 5:** las primeras 5 recetas aprobadas en orden de aprobación. La mamá puede aprobar/rechazar antes del PDF; si aprobó más de 5, igual el sample muestra solo las primeras 5 aprobadas.
- Descarga directa.
- Baja resolución (72 DPI) — se ve bien en pantalla, mal impreso.
- Diseño visual completo (NO marca de agua agresiva, NO se ve "draft").
- Se genera automáticamente cuando hay al menos 5 recetas aprobadas.

### 3.8 Botón "Imprimir mi libro — $169"
- Existe en el dashboard desde el día uno **pero con baja prominencia visual hasta llegar a 20 recetas**.
- "Baja prominencia" significa: presente y funcional (la mamá puede pagar antes si así lo decide), pero NO destacado como CTA principal, sin color sólido, en una sección secundaria del dashboard. No literalmente oculto.
- A partir de 20 recetas se vuelve botón principal visible con peso visual fuerte.
- Modelo idéntico al que ya existe hoy en clientes activos, solo cambia la prominencia visual.
- Click → flujo de Stripe existente → grupo transiciona de `free_tier` a `pending_setup` o `active`.

### 3.9 "Send update" único
- Reemplazar el sistema actual de 3 mensajes independientes por UN solo botón "Send update" estilo Storyworth.
- Manda UN mensaje broadcast a todos los contribuyentes (los que ya entraron, dejaron contacto y subieron o no receta).
- Si los datos post-lanzamiento muestran necesidad de segmentar, se hace en v1.2.

### 3.10 Weekly digest extendido al free tier
- El weekly digest existente para clientes pagados se extiende al free tier.
- Para free tier el CTA al final del email es distinto: "ya tienes X recetas, descarga tu preview" o "ya llegaste a 20 recetas, imprime tu libro".
- No es nuevo código sustancial; es modificación de templates y lógica de CTA.

### 3.11 Reminders a invitadas
- Email automático a las que dejaron email pero no subieron receta — usa infraestructura Postmark existente.
- Botón manual "Recordar por WhatsApp" en cada guest del dashboard — abre WhatsApp con mensaje pre-llenado vía `wa.me/<numero>?text=`.
- Sin WhatsApp Business API. Sin SMS automatizado. Quedan en backlog.

### 3.12 Auth passwordless
- Magic link (Supabase `signInWithOtp`) y Google OAuth.
- Eliminar email + password tradicional del nuevo flujo. Los usuarios actuales conservan su sesión.
- Manejo de deep linking del magic link.
- Sesión persistente: si la mamá vuelve, sigue logged in. Si hace logout, magic link o Google.

### 3.13 Co-organizer (Captain) flow
- Mismo flujo que invite to event pero con permisos distintos: las capitanas pueden invitar a otros y revisar/editar recetas.
- La mamá los invita por link, WhatsApp o email.

## 4. Fuera de scope para MVP (backlog explícito)

### 4.1 Feature A — Invitación bonita estilo Paperless Post
Templates de invitación con stationery, themes, customización visual extensa, RSVP, etc. NO va al MVP. Después del MVP, si los datos muestran demanda real, se aborda como producto separado.

### 4.2 PDF descargable de invitación
La invitación digital cumple los jobs principales. PDF queda en backlog. Si las mamás piden explícitamente algo imprimible para mandar como "invitación formal", se aborda en v1.2.

### 4.3 Personalización de portada (2-3 colores)
Low-effort en InDesign pero requiere UI en el dashboard. Anotado como fast-follow en v1.1 si los datos muestran que la mamá llega al checklist pero no avanza a invitar.

### 4.4 Rediseño del flujo Import from Zola/Knot
El feature actual sigue existiendo, integrado discretamente en el modal de "Invite to event". El comportamiento actual ("importar crea guests sin enviar") sigue funcionando, lo cual genera deuda técnica reconocida (ver §8). Rediseño completo (segmentación entre evento/solo receta con UI dedicada) queda en backlog v1.2.

### 4.5 SMS automatizado y WhatsApp Business API
Reminders y broadcasts automatizados por canales distintos a email se difieren. WhatsApp queda como acción manual desde el dashboard.

### 4.6 Múltiples tipos de evento como ciudadanos de primera clase
El MVP arranca con bridal shower destacado. Otros tipos aparecen como opciones pero el copy, los templates y la lógica están afinados para bridal shower. Aniversarios, cumpleaños, baby showers, reuniones familiares, etc. se desarrollan iterativamente post-MVP.

### 4.7 Memory archive persistente, RSVP, galería de fotos del evento, countdown, dress code, gift registry
Todo el ecosistema de "página viva del evento como objeto sentimental persistente" (propuesto en la conversación original con GPT) queda fuera del MVP.

## 5. Modelo de datos — cambios principales

### 5.1 `groups.status`
Agregar nuevo valor al enum existente:
```
GroupStatus = 'free_tier' | 'pending_setup' | 'active'
```
- `free_tier`: la mamá creó el evento sin pagar.
- `pending_setup`: Stripe confirmó pago, aún sin completar setup (estado actual post-pago).
- `active`: setup completo (estado actual una vez listo el libro).

Transición `free_tier → pending_setup` cuando la mamá hace upgrade vía Stripe.

### 5.2 Nuevo campo `groups.entry_link_type` (o equivalente) en submissions
Permite saber por qué link entró cada invitada. Valores posibles:
- `event_invite` — entró por `/evento/[token]`
- `recipe_only` — entró por `/collect/[token]/r/[token-aleatorio]`
- `direct` — entró por `/collect/[token]` directo (legacy o manual)

Se usa para mostrar el thank-you screen apropiado y para que los reminders mantengan el tipo correcto de link.

### 5.3 Nuevo token aleatorio para `recipe_only`
La URL `/collect/[token]/r/[random]` requiere generar un random token corto por grupo que no sea deducible. Se almacena en `groups` (campo nuevo, ej. `recipe_only_token`).

### 5.4 Campos para info del evento en `groups`
- `event_date` (timestamp, nullable)
- `event_location` (text, nullable)

Estos campos ya pueden existir parcialmente; verificar en implementación.

### 5.5 RLS policies
Verificar y actualizar policies para que grupos en estado `free_tier` sean accesibles por su owner y co-organizers, pero con restricciones apropiadas (ej. no pueden ordenar libro impreso sin pago).

## 6. Arquitectura — rutas

### 6.1 Nuevas rutas públicas
```
/evento/[token]                              → landing con info del evento + CTA
/collect/[token]/r/[recipe_only_token]       → landing solo receta (sin info evento)
/collect/[token]                             → existente (sin cambios)
```

### 6.2 Nuevas rutas de la plataforma (estructura tentativa)
```
/(auth)/signin                               → magic link + Google
/onboarding/welcome                          → paso 1
/onboarding/occasion                         → paso 2
/onboarding/book-date                        → paso 3
/onboarding/about-you                        → paso 4 (creación de cuenta)
/onboarding/co-organizer                     → paso 5
/onboarding/event-details                    → paso 6
/onboarding/personalize-invite               → paso 7
/onboarding/invite-first                     → paso 8
/(platform)/groups/[id]/dashboard            → dashboard simplificado (modificación del existente)
/(platform)/groups/[id]/guests               → lista secundaria de guests
```

**Nota:** la ubicación final del grupo de rutas de onboarding (¿nuevo route group `(onboarding)`, dentro de `(auth)`, dentro de `(platform)`?) es decisión de implementación que toma el plan, no este spec. Lo importante es la secuencia y contenido de los pasos.

### 6.3 API endpoints nuevos
- `POST /api/v1/groups/free` — crear grupo en estado `free_tier`
- `POST /api/v1/groups/[id]/sample-pdf` — generar/regenerar sample PDF
- `POST /api/v1/groups/[id]/upgrade` — disparar flujo Stripe
- Modificaciones a endpoints existentes para soportar `free_tier` status

## 7. UX detallado — wireframes textuales

Los wireframes detallados de cada pantalla (onboarding 1-8, dashboard, modales de Invite, lista de guests, landing pública del evento) están consolidados a lo largo de §3. En implementación, traducirlos a Figma o React directamente.

**Principios de diseño visibles en todas las pantallas:**
- Header minimal: logo + Help + Mi cuenta. Sin nav adicional.
- Ilustraciones custom (NO stock photos).
- Mucho espacio en blanco, tipografía limpia.
- Una pregunta por pantalla en onboarding.
- "Skip for now" donde aplique.
- Cero banners promocionales.

## 8. Deuda técnica conocida

### 8.1 Inconsistencia "invitar = enviar" vs. Import legacy
El flujo principal del MVP es "invitar = enviar mensaje". Pero el feature de Import from Zola/Knot mantiene su comportamiento actual de "importar crea guests sin enviar". Esto es deuda técnica reconocida. Se documentará en código con comentarios apropiados. Rediseño en v1.2 si los datos lo justifican.

### 8.2 Sistema de mensajes simplificado
El reemplazo de los 3 mensajes independientes actuales por UN "Send update" es una simplificación que asume que la segmentación no es necesaria para MVP. Si post-lanzamiento se confirma la necesidad de segmentar (ej. mandar solo a las que aún no han subido receta), se rehabilita el patrón segmentado en v1.2.

### 8.3 Generación de sample PDF
La pipeline actual de InDesign procesa libros completos. Generar un sample de 5 recetas a baja resolución requiere adaptación. Si la pipeline actual no soporta generación parcial automatizada, puede requerirse una rama del pipeline específica para samples. Magnitud del trabajo se valida en implementation plan.

## 9. Riesgos y guard rails

### 9.1 Riesgo principal: canibalización
Que las mamás que completan el free tier digan "esto está bien" y no upgraden. Mitigación:
- Sample PDF claramente "teaser" (5 de N recetas)
- Baja resolución que se nota al imprimir caseramente
- Libro físico visualmente premium (hardcover, papel, encuadernación) imposible de replicar imprimiendo el PDF en Officemax
- Botón "Imprimir mi libro" se vuelve prominente a las 20 recetas

### 9.2 Riesgo: complejidad del flow para mamás mayores
El onboarding multi-step asume comodidad digital. Mitigaciones:
- Cada pantalla muy simple, una decisión
- Skip for now donde aplique
- Magic link evita passwords
- Co-organizer permite que una hija/hermana ayude

### 9.3 Riesgo: WhatsApp manual (no automatizado) puede sentirse "incompleto" vs competencia
Mitigación: el botón "Send to WhatsApp" tiene UX cuidado para que la fricción sea mínima (mensaje pre-llenado, abre WA directo). Si datos muestran que es bottleneck real, WhatsApp Business API entra a backlog priorizado.

### 9.4 Guard rail: rollback al paywall
La cadencia, métricas y criterios exactos de rollback los maneja Ricardo en paralelo a la implementación técnica (basándose en sus conversaciones con leads y mamás actuales). El equipo técnico debe asegurar que feature flags estén implementados desde el inicio (ver §10) para hacer el rollback técnicamente fácil.

## 10. Implementation milestones

### M1 — Foundation (target ~2 semanas)
Foco: abrir la puerta. Sin features de producto todavía.
- Auth passwordless (Supabase `signInWithOtp` + Google OAuth)
- Free signup flow sin Stripe
- Nuevo `groups.status = 'free_tier'`
- Onboarding multi-step (8 pantallas) — estructura básica
- Feature flag `FREE_TIER_ENABLED` para gatear todo el nuevo flujo
- Migración de base de datos (status enum, nuevos campos, RLS policies)

### M2 — Dashboard & Invite (target ~2 semanas)
Foco: el corazón de la experiencia free.
- Dashboard simplificado estilo Storyworth
- Nueva landing pública `/evento/[token]` con info del evento
- Nueva landing pública `/collect/[token]/r/[random]` (solo receta)
- Modal "Invite to event" con tres vías (link, WhatsApp, email a lista)
- Modal "Send recipe collection link"
- Modal "Invite a Captain"
- Integración del Import from Zola/Knot existente en el modal apropiado
- Pantalla secundaria de lista de guests con estados visibles
- Sample PDF generator (5 recetas, baja resolución)
- Add a recipe a nombre de alguien (ghost guest)

### M3 — Engagement & Conversion (target ~1-2 semanas)
Foco: cerrar el loop hacia el pago.
- Weekly digest extendido al free tier (con CTAs apropiados)
- Reminders a invitadas (email automático + botón manual WhatsApp)
- Botón "Imprimir mi libro" con visibilidad condicional (escondido < 20 recetas)
- Flujo de upgrade `free_tier → pending_setup` vía Stripe
- "Send update" único en lugar de los 3 mensajes actuales
- Métricas y telemetría base (suficientes para que Ricardo pueda evaluar con sus conversaciones)

**Total estimado: 5-6 semanas con buffer.** El plan detallado, con tareas, dependencias técnicas, archivos a modificar y riesgos por milestone, se desarrolla en el siguiente paso (skill `writing-plans` → `docs/superpowers/plans/`).

## 11. Decisiones que NO se han tomado (pendientes para implementación)

- Ruta exacta y naming final de endpoints API
- Naming exacto de feature flag y dónde se evalúa (build-time vs runtime)
- Estructura final del onboarding state (¿una tabla `onboarding_progress` o campos en `groups`?)
- Estrategia exacta para generar el sample PDF (rama del pipeline InDesign vs. servicio nuevo)
- Diseño visual final de las ilustraciones del onboarding (puede ser delegado a designer separado)
- Texto exacto/copy de cada pantalla (separado del trabajo de ingeniería)

Estas decisiones se toman en el plan de implementación o durante la ejecución, no son bloqueantes para empezar.

## 12. Apéndice — referencias

- Deep research comparativo Paperless Post / Storyworth / Partiful: `docs/paperless_project/deep_research.md`
- Screenshots del onboarding de Storyworth Celebrations: `docs/paperless_project/onboarding_images/`
- Brand voice y tone-of-voice: `brand_wedding/tone-of-voice.md`
- Modelo de datos actual: `lib/types/database.ts`
- Flujo actual de creación de grupo post-pago: `lib/stripe/post-payment-setup.ts`

---

**Estado del spec:** Listo para revisión de Ricardo. Una vez aprobado, pasa al skill `writing-plans` para producir el plan de implementación detallado.
