# Sistema de Email Invitations — Documento de Diseño

## Overview

Este documento define el sistema completo de invitaciones por email para Small Plates. El objetivo es automatizar el proceso de invitar guests a subir recetas, con una secuencia de 4 emails espaciados cada 3 días.

---

## 1. Estados del Guest

### Nuevos estados a agregar

| Estado | Significado | Emails activos |
|--------|-------------|----------------|
| `pending` | Agregado, no invitado | ❌ No |
| `invited` | Secuencia activa | ✅ Sí |
| `submitted` | Ya subió receta | ❌ No (se detuvo) |
| `completed` | Secuencia terminó sin respuesta | ❌ No |
| `paused` | Captain pausó manualmente | ❌ No |

### Transiciones de estado

```
pending → invited       (Captain inicia secuencia)
invited → submitted     (Guest sube receta - automático)
invited → completed     (4 emails enviados, sin respuesta - automático)
invited → paused        (Captain pausa manualmente)
paused → invited        (Captain reinicia secuencia)
completed → invited     (Captain reinicia secuencia)
```

---

## 2. La Secuencia de Emails

### Configuración

| Parámetro | Valor |
|-----------|-------|
| Total de emails | 4 |
| Spacing | 3 días |
| Idioma | Inglés |
| Personalizable por Captain | No (fijo) |

### Timeline

```
Día 0:   Email 1 — Invitación inicial
Día 3:   Email 2 — Primer reminder
Día 6:   Email 3 — Segundo reminder (urgencia suave)
Día 9:   Email 4 — Último reminder
Día 9+:  Status → "completed" (si no respondió)
```

### Contenido de cada email

#### Email 1: Invitación inicial
**Subject:** You're invited to {Couple}'s recipe book
**Tone:** Warm, exciting, low pressure

#### Email 2: Primer reminder
**Subject:** {Couple}'s cookbook is filling up
**Tone:** Friendly nudge, social proof

#### Email 3: Segundo reminder
**Subject:** Still time to add your recipe
**Tone:** Gentle urgency, easy

#### Email 4: Último reminder
**Subject:** Last chance: {Couple}'s book
**Tone:** Final, but not pushy

---

## 3. Personalización de Emails

### Variables disponibles

| Variable | Fuente | Ejemplo |
|----------|--------|---------|
| `{couple_name}` | groups.couple_first_name + groups.partner_first_name | "Ana & Pedro" |
| `{guest_name}` | guests.first_name | "María" |
| `{collection_link}` | profiles.collection_link_token | "https://smallplatesandcompany.com/collect/abc123" |
| `{book_name}` | groups.name | "Ana & Pedro's Wedding" |

### From/Reply-To

```
From Name: "{couple_first_name} & {partner_first_name}"
From Email: recipes@smallplatesandcompany.com
Reply-To: team@smallplatesandcompany.com
```

---

## 4. Arquitectura Técnica

### Componentes

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Supabase DB   │────▶│  Vercel Cron    │────▶│    Postmark     │
│  (guest data)   │     │  (daily check)  │     │  (send email)   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                               │
                               ▼
                        ┌─────────────────┐
                        │  Update Status  │
                        │  (after send)   │
                        └─────────────────┘
```

### Vercel Cron Job

**Frecuencia:** Diario a las 9:00 AM UTC (aproximadamente 3-4 AM hora México)

**Lógica:**
```
1. Query: SELECT guests WHERE status = 'invited'
2. Para cada guest:
   a. Calcular días desde invitation_started_at
   b. Determinar qué email toca (1, 2, 3, o 4)
   c. Si ya se envió ese email → skip
   d. Si toca enviar → send via Postmark
   e. Si email 4 ya enviado + 1 día → status = 'completed'
```

### API Endpoint

```
POST /api/cron/send-invitation-emails
Authorization: CRON_SECRET (para seguridad)
```

---

## 5. Cambios en Base de Datos

### Tabla: guests (columnas a agregar)

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `invitation_started_at` | timestamp | Cuándo se inició la secuencia |
| `invitation_paused_at` | timestamp | Cuándo se pausó (si aplica) |
| `emails_sent_count` | integer | Cuántos emails se han enviado (0-4) |
| `last_email_sent_at` | timestamp | Cuándo se envió el último email |

### SQL Migration

```sql
-- Agregar columnas para email sequence tracking
ALTER TABLE guests 
ADD COLUMN invitation_started_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN invitation_paused_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN emails_sent_count INTEGER DEFAULT 0,
ADD COLUMN last_email_sent_at TIMESTAMP WITH TIME ZONE;

-- Agregar comentarios
COMMENT ON COLUMN guests.invitation_started_at IS 'When the email invitation sequence was started';
COMMENT ON COLUMN guests.invitation_paused_at IS 'When the sequence was paused by captain (if applicable)';
COMMENT ON COLUMN guests.emails_sent_count IS 'Number of invitation emails sent (0-4)';
COMMENT ON COLUMN guests.last_email_sent_at IS 'Timestamp of the last invitation email sent';

-- Actualizar constraint de status para incluir nuevos valores
-- (verificar si existe un constraint actual primero)
```

### Actualizar enum de status

El campo `status` debe permitir los valores:
- `pending`
- `invited`
- `submitted`
- `completed`
- `paused`

---

## 6. Flujo del Captain (UI)

### En GuestNavigationSheet

Para cada guest, mostrar el status actual:

| Status | Display | Color |
|--------|---------|-------|
| `pending` | "Pending" | Gray |
| `invited` | "Invited · Email 2/4" | Honey/Yellow |
| `submitted` | "1 recipe" | Green |
| `completed` | "No response" | Gray |
| `paused` | "Paused" | Gray |

### Acciones disponibles

#### Para guest con status `pending`:
- Botón: **"Invite"** → Inicia secuencia

#### Para guest con status `invited`:
- Botón: **"Pause"** → Pausa secuencia

#### Para guest con status `paused`:
- Botón: **"Resume"** → Reanuda secuencia

#### Para guest con status `completed`:
- Botón: **"Retry"** → Reinicia secuencia desde email 1

#### Para guest con status `submitted`:
- Sin acciones de email (ya no necesita)

### Ubicación de acciones

**Opción A:** En el GuestDetailsModal (al abrirlo)
**Opción B:** En el GuestNavigationSheet con un dropdown por guest

Recomendación: **Opción A** — mantiene el sheet limpio

---

## 7. Lógica de Auto-Stop

### Cuando guest sube receta

En el flujo de submission de receta (`/collect/[token]`), después de guardar la receta:

```typescript
// Si el guest tenía status 'invited', cambiar a 'submitted'
if (guest.status === 'invited') {
  await updateGuest(guest.id, { status: 'submitted' });
}
```

Esto automáticamente detiene la secuencia porque el cron solo procesa guests con `status = 'invited'`.

---

## 8. Email Templates (HTML)

### Estructura base

Basarse en los templates existentes en `/emails/`:
- `email-verification.html`

### Template para invitaciones

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You're invited to {couple_name}'s recipe book</title>
</head>
<body style="margin: 0; padding: 0; background-color: #FAF7F2; font-family: Georgia, serif;">
  
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #FAF7F2; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 500px; background-color: #FFFFFF; border-radius: 8px; overflow: hidden;">
          
          <!-- Logo -->
          <tr>
            <td style="padding: 32px 32px 24px 32px; text-align: center;">
              <img src="https://smallplatesandcompany.com/logo.png" alt="Small Plates & Co." width="150">
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 0 32px 32px 32px;">
              <h1 style="font-family: Georgia, serif; font-size: 24px; color: #2D2D2D; margin: 0 0 16px 0; font-weight: normal;">
                {headline}
              </h1>
              
              <p style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 16px; color: #2D2D2D; line-height: 1.6; margin: 0 0 24px 0;">
                {body_text}
              </p>
              
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="{collection_link}" style="display: inline-block; background-color: #2D2D2D; color: #FFFFFF; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 16px; font-weight: 500; text-decoration: none; padding: 14px 32px; border-radius: 50px;">
                      Add Your Recipe
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; color: #9A9590; line-height: 1.6; margin: 24px 0 0 0; text-align: center;">
                Takes about 5 minutes. Your recipe. Their kitchen. Forever.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; background-color: #FAF7F2; border-top: 1px solid #E8E0D5;">
              <p style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; color: #9A9590; margin: 0; text-align: center;">
                Small Plates & Co.<br>
                Recipes from the people who love you.
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
  
</body>
</html>
```

---

## 9. Copy para cada Email

### Email 1: Invitación inicial

**Subject:** You're invited to {couple_name}'s recipe book

**Headline:** {couple_name} want your recipe

**Body:**
> Hi {guest_name},
>
> {couple_name} are creating a cookbook filled with recipes from the people who matter most to them—and they want yours.
>
> It doesn't have to be fancy. Your go-to pasta. The thing you make when you're tired. That dish everyone asks about. Whatever feels like you.

---

### Email 2: Primer reminder

**Subject:** {couple_name}'s cookbook is coming together

**Headline:** The book is filling up

**Body:**
> Hi {guest_name},
>
> Just a gentle nudge—{couple_name}'s recipe book is starting to take shape, and there's a spot waiting for you.
>
> No pressure to be perfect. The best recipes are the real ones.

---

### Email 3: Segundo reminder

**Subject:** Still time to add your recipe

**Headline:** There's still time

**Body:**
> Hi {guest_name},
>
> We know life gets busy. But if you've been meaning to add your recipe to {couple_name}'s book, now's a good time.
>
> Five minutes. One recipe. A page in their kitchen forever.

---

### Email 4: Último reminder

**Subject:** Last call for {couple_name}'s book

**Headline:** One last nudge

**Body:**
> Hi {guest_name},
>
> This is our last reminder about {couple_name}'s recipe book. If you'd like to be part of it, we'd love to have you.
>
> No hard feelings if not—but the door's still open.

---

## 10. Archivos a Crear/Modificar

### Nuevos archivos

| Archivo | Descripción |
|---------|-------------|
| `app/api/cron/send-invitations/route.ts` | Vercel Cron endpoint |
| `lib/email/invitation-templates.ts` | Templates de los 4 emails |
| `lib/email/send-invitation.ts` | Función para enviar via Postmark |
| `emails/invitation-1.html` | Template HTML email 1 |
| `emails/invitation-2.html` | Template HTML email 2 |
| `emails/invitation-3.html` | Template HTML email 3 |
| `emails/invitation-4.html` | Template HTML email 4 |

### Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `vercel.json` | Agregar cron job config |
| `lib/supabase/guests.ts` | Funciones para actualizar status |
| `components/profile/guests/GuestDetailsModal.tsx` | Agregar botones Invite/Pause/Resume |
| `components/profile/guests/GuestNavigationSheet.tsx` | Mostrar status de invitación |
| Flujo de recipe submission | Auto-stop cuando guest sube receta |

### Configuración de Vercel Cron

En `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/send-invitations",
      "schedule": "0 9 * * *"
    }
  ]
}
```

---

## 11. Plan de Implementación

### Fase 2B-1: Base de datos
1. Agregar columnas a tabla `guests`
2. Actualizar tipos de TypeScript

### Fase 2B-2: Email templates
1. Crear los 4 templates HTML
2. Crear función de envío con Postmark

### Fase 2B-3: Cron job
1. Crear endpoint `/api/cron/send-invitations`
2. Implementar lógica de selección y envío
3. Configurar en `vercel.json`

### Fase 2B-4: UI para Captain
1. Actualizar GuestDetailsModal con botones de acción
2. Actualizar GuestNavigationSheet con status visual
3. Conectar acciones a funciones de Supabase

### Fase 2B-5: Auto-stop
1. Modificar flujo de recipe submission
2. Detectar y actualizar status automáticamente

### Fase 2B-6: Testing
1. Probar secuencia completa
2. Verificar auto-stop funciona
3. Verificar UI muestra estados correctos

---

## 12. Consideraciones de Seguridad

### Cron endpoint
- Usar `CRON_SECRET` para autenticar requests
- Vercel envía header `Authorization: Bearer <CRON_SECRET>`

### Rate limiting
- Postmark tiene límites (depende del plan)
- Considerar batching si hay muchos guests

### Email deliverability
- Usar dominio verificado en Postmark
- From address consistente
- Incluir unsubscribe link (requerido por ley)

---

## 13. Métricas a Trackear (Futuro)

| Métrica | Cómo |
|---------|------|
| Open rate | Postmark tracking |
| Click rate | Postmark tracking |
| Conversion rate | guests que pasan de `invited` a `submitted` |
| Drop-off por email | En qué email se pierde la gente |

---

## Resumen

Este sistema permite al Captain:
1. Seleccionar guests pendientes
2. Iniciar secuencia de 4 emails con un click
3. Ver el progreso (Email 2/4, etc.)
4. Pausar/Reanudar si es necesario
5. La secuencia se detiene automáticamente si el guest sube receta

El sistema corre diariamente, revisa qué emails toca enviar, y actualiza los estados automáticamente.