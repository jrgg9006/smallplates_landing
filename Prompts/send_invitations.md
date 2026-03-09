# Feature: "Send Invitations" — Bulk Guest Email System

## Contexto del proyecto
Small Plates & Co. es una plataforma que crea libros de recetas colaborativos para bodas. Los guests (invitados de la boda) reciben un email invitándolos a subir su receta. Actualmente, el organizer puede ver y administrar guests, pero no puede enviarles emails desde la plataforma.

## Objetivo
Agregar una nueva sección "Send Invitations" al action bar del libro (mismo nivel que "Add Recipes", "Guests", "Captains"), que permita al organizer enviar emails de invitación a todos sus guests con un solo clic, ver quién ya fue invitado, y mandar recordatorios individuales.

---

## Arquitectura de la UI

### Ubicación en la navegación
En `app/(platform)/profile/groups/page.tsx`, en el Action Bar donde están los botones "Add Recipes", "Guests", y "Captains", agregar un nuevo botón:
```tsx
<button 
  className="btn-secondary hidden sm:block"
  onClick={handleViewInvitations}
  disabled={!selectedGroup}
>
  Send Invitations
</button>
```

También debe aparecer en el MoreMenuDropdown para mobile, junto a los otros items.

### Componente principal
Crear `components/profile/guests/SendInvitationsSheet.tsx`

Este componente es un Sheet (igual que GuestNavigationSheet) que se abre desde la derecha en desktop y desde abajo en mobile. Contiene DOS tabs:

**Tab 1: "Compose"** (tab por defecto)
- Header: "Send Invitations"
- Subheadline: "Invite your guests to add their recipe."
- Preview del email (versión compacta, estilo card): muestra el subject line y el cuerpo del email tal como lo recibirán. No es editable.
- Lista de guests que AÚN NO han sido invitados (donde `invited_at IS NULL` y tienen email válido).
  - Cada guest aparece con nombre completo y un checkbox (todos seleccionados por defecto)
  - Si no hay guests sin invitar, mostrar estado vacío: "All guests have been invited." con un ícono de check.
- Botón al fondo: "Send to [N] guests" — btn-primary (honey background `#D4A854`, texto negro, border-radius pill)
  - Cuando se presiona: loading state "Sending...", luego success state "Sent ✓"
  - Después del envío exitoso, pasar automáticamente al tab "Sent"

**Tab 2: "Sent"**
- Lista de todos los guests que ya recibieron invitation (`invited_at IS NOT NULL`)
- Por cada guest:
  - Nombre completo
  - Fecha en que fue invitado: "Invited Mar 9"
  - Badge de status:
    - Si `recipes_received > 0`: "Recipe added ✓" en color honey `#D4A854`
    - Si `recipes_received === 0`: "Pending" en color gray `#9A9590`
  - Botón "Remind" (solo visible si `recipes_received === 0`): btn-tertiary, pequeño, al lado derecho
    - Al hacer click: envía un reminder email y actualiza `last_reminded_at`
    - Loading state: "Sending..."
    - Post-send state: "Sent ✓" por 3 segundos, luego regresa a "Remind"
- Si no hay guests enviados: estado vacío "No invitations sent yet."

### Estilos y tokens de diseño
Usar exactamente los mismos tokens CSS que usa el resto de la plataforma:

Colors:

Brand White: hsl(var(--brand-white)) = #FAF7F2
Honey: hsl(var(--brand-honey)) = #D4A854
Charcoal: hsl(var(--brand-charcoal)) = #2D2D2D
Warm Gray: hsl(var(--brand-warm-gray)) = #9A9590
Border: hsl(var(--brand-border)) = #E8E0D5
Sand: #E8E0D5
Terracotta: #C4856C (para errores/alertas si aplica)

Typography:

Headings serif: font-family Georgia (class: font-serif)
Body sans-serif: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto
Sheet title: text-2xl font-serif font-semibold text-[hsl(var(--brand-charcoal))]
Body text: text-sm text-[hsl(var(--brand-charcoal))]
Metadata/secondary: text-sm text-[hsl(var(--brand-warm-gray))]

Button classes (ya definidas en el proyecto):

btn-primary: honey background, black text, pill shape
btn-secondary: white/outline, black border, pill shape
btn-tertiary: ghost/text button

Sheet structure: Igual que GuestNavigationSheet.tsx — mismo padding, mismo header style, mismo footer pattern.

---

## Base de Datos

### Columnas existentes en tabla `guests` que usar
Las columnas ya existen en Supabase. Solo asegurarse de usarlas:
- `invitation_started_at` TIMESTAMP — settear cuando se envía el primer email (fecha del invite)
- `last_email_sent_at` TIMESTAMP — actualizar cada vez que se manda cualquier email (invite o remind)

Si las columnas NO existen todavía, crear la migración:
```sql
ALTER TABLE guests 
ADD COLUMN IF NOT EXISTS invitation_started_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_email_sent_at TIMESTAMP WITH TIME ZONE;
```

No necesitamos más columnas para este MVP. No usar `emails_sent_count` ni `invitation_paused_at` por ahora.

### Lógica de "ya invitado"
Un guest se considera "invitado" cuando `invitation_started_at IS NOT NULL`.
Un guest puede recibir reminder cuando `invitation_started_at IS NOT NULL AND recipes_received = 0`.

---

## API Endpoints

### 1. `POST /api/email/send-invitations`
Envía el email de invitación a uno o múltiples guests.

**Request body:**
```typescript
{
  groupId: string;       // UUID del grupo/libro
  guestIds: string[];    // Array de guest IDs
}
```

**Lógica:**
1. Verificar que el user autenticado es owner/captain del grupo
2. Obtener datos del grupo: `couple_first_name`, `partner_first_name`, `couple_image_url`
3. Obtener el `collection_link_token` del profile del owner
4. Para cada guestId:
   a. Obtener `first_name`, `last_name`, `email`
   b. Saltarse si no tiene email o si ya tiene `invitation_started_at`
   c. Construir collection link: `https://smallplatesandcompany.com/collect/{token}?group={groupId}&guest={guestId}`
   d. Enviar email via Postmark (ver template abajo)
   e. Actualizar guest: `invitation_started_at = NOW(), last_email_sent_at = NOW()`
5. Retornar: `{ success: true, sent: N, failed: M }`

### 2. `POST /api/email/remind-guest`
Envía un reminder a un guest específico.

**Request body:**
```typescript
{
  guestId: string;
  groupId: string;
}
```

**Lógica:**
1. Verificar autenticación
2. Obtener datos del guest y del grupo
3. Verificar que `recipes_received === 0` (no mandar reminder si ya contribuyó)
4. Construir mismo link con guest ID
5. Enviar email de reminder via Postmark (template diferente al de invitación)
6. Actualizar: `last_email_sent_at = NOW()`
7. Retornar: `{ success: true }`

---

## Email Templates

### Configuración Postmark
- From Name: `{couple_first_name} & {partner_first_name}` (ej: "Ana & Ricardo")
- From Email: `recipes@smallplatesandcompany.com`
- Reply-To: `team@smallplatesandcompany.com`
- Message Stream: `outbound`

### Template HTML — Email de Invitación

El email debe seguir el design system de Small Plates. Aquí el HTML completo:
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You're invited to {{couple_name}}'s recipe book</title>
</head>
<body style="margin: 0; padding: 0; background-color: #FAF7F2;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #FAF7F2; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 480px; background-color: #FFFFFF; border-radius: 8px; overflow: hidden; border: 1px solid #E8E0D5;">
          
          <!-- Couple image (si existe) -->
          {{#if couple_image_url}}
          <tr>
            <td>
              <img src="{{couple_image_url}}" alt="{{couple_name}}" width="100%" style="display: block; max-height: 200px; object-fit: cover;">
            </td>
          </tr>
          {{/if}}

          <!-- Content -->
          <tr>
            <td style="padding: 40px 40px 32px 40px;">
              
              <!-- Small Plates wordmark -->
              <p style="font-family: Georgia, serif; font-size: 11px; letter-spacing: 0.12em; color: #9A9590; margin: 0 0 32px 0; text-transform: uppercase;">Small Plates & Co.</p>
              
              <!-- Headline -->
              <h1 style="font-family: Georgia, serif; font-size: 26px; color: #2D2D2D; margin: 0 0 20px 0; font-weight: normal; line-height: 1.3;">
                {{couple_name}} want your recipe
              </h1>
              
              <!-- Body -->
              <p style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15px; color: #2D2D2D; line-height: 1.7; margin: 0 0 28px 0;">
                Hi {{guest_first_name}},
              </p>
              <p style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15px; color: #2D2D2D; line-height: 1.7; margin: 0 0 28px 0;">
                {{couple_name}} are making a cookbook with recipes from the people who matter most to them — and they want yours.
              </p>
              <p style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15px; color: #2D2D2D; line-height: 1.7; margin: 0 0 32px 0;">
                It doesn't have to be fancy. Your go-to pasta. The thing you make when you're tired. That dish everyone asks about. Whatever feels like you.
              </p>
              
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding-bottom: 32px;">
                    <a href="{{collection_link}}" style="display: inline-block; background-color: #2D2D2D; color: #FFFFFF; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15px; font-weight: 500; text-decoration: none; padding: 14px 36px; border-radius: 100px; letter-spacing: 0.01em;">
                      Add Your Recipe
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Subtext -->
              <p style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13px; color: #9A9590; text-align: center; margin: 0;">
                Takes about 5 minutes. Your recipe. Their kitchen. Forever.
              </p>
              
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px 28px 40px; border-top: 1px solid #E8E0D5;">
              <p style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11px; color: #9A9590; margin: 0; text-align: center; line-height: 1.8;">
                Small Plates & Co. · Recipes from the people who love you.<br>
                <a href="{{unsubscribe_link}}" style="color: #9A9590; text-decoration: underline;">Unsubscribe</a>
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

**Subject line:** `You're invited to {{couple_name}}'s recipe book`

### Template HTML — Reminder

Mismo estructura HTML, diferente copy:

- **Subject:** `{{couple_name}}'s cookbook is waiting for you`
- **Headline:** `There's still time`
- **Body:**
Hi {{guest_first_name}},
Just a note — {{couple_name}}'s recipe book is still open, and there's a spot for yours.
No pressure to be perfect. The best recipes are the real ones.
- **CTA:** `Add Your Recipe` (mismo botón)

---

## Archivos a crear/modificar

### Crear:
1. `components/profile/guests/SendInvitationsSheet.tsx` — Componente principal
2. `app/api/email/send-invitations/route.ts` — Endpoint bulk send
3. `app/api/email/remind-guest/route.ts` — Endpoint reminder
4. `lib/email/guest-invitation.ts` — Función que construye y envía el email via Postmark (similar a como se hace en `app/api/v1/send-verification-email/route.ts`, usar `POSTMARK_SERVER_TOKEN`)
5. `emails/guest-invitation.html` — Template HTML del email de invitación
6. `emails/guest-reminder.html` — Template HTML del reminder

### Modificar:
1. `app/(platform)/profile/groups/page.tsx`:
   - Agregar import de `SendInvitationsSheet`
   - Agregar estado: `const [showInvitations, setShowInvitations] = useState(false)`
   - Agregar botón "Send Invitations" en action bar (hidden sm:block, igual que "Guests")
   - Agregar opción en `MoreMenuDropdown` para mobile
   - Renderizar `<SendInvitationsSheet>` al final del componente
   
2. `components/profile/groups/MoreMenuDropdown.tsx`:
   - Agregar prop `showInvitationsOption?: boolean` y `onSendInvitationsClick?: () => void`
   - Agregar el item en el dropdown

3. `lib/supabase/guests.ts`:
   - Agregar función `updateGuestInvitedAt(guestId: string)`: actualiza `invitation_started_at` y `last_email_sent_at`
   - Agregar función `updateGuestLastReminded(guestId: string)`: actualiza solo `last_email_sent_at`
   - Agregar función `getGuestsByGroupWithInviteStatus(groupId: string)`: retorna guests con `invitation_started_at` incluido

4. `lib/types/database.ts` (o donde estén los tipos de Guest):
   - Asegurar que el tipo `Guest` incluye `invitation_started_at?: string | null` y `last_email_sent_at?: string | null`

---

## Anti-spam checklist (implementar todo)
- [ ] From name es el nombre de la pareja, no "Small Plates & Co."
- [ ] From email es `recipes@smallplatesandcompany.com` (dominio propio, no gmail)
- [ ] Subject line sin signos de exclamación ni palabras spam
- [ ] Email es principalmente texto, imagen solo si existe couple_image_url
- [ ] Unsubscribe link en footer (requerido por CAN-SPAM)
- [ ] Reply-To apunta a `team@smallplatesandcompany.com`
- [ ] No enviar a guests sin email (`email IS NOT NULL AND email NOT LIKE 'NO_EMAIL_%'`)
- [ ] No reenviar invitación si ya fue enviada (`invitation_started_at IS NOT NULL`)

---

## UX Details importantes
- El Sheet se abre del lado derecho en desktop (igual que GuestNavigationSheet)
- En mobile, se abre desde abajo como un drawer (85vh, rounded-t-[20px])
- El preview del email en el tab "Compose" no es editable — es un card que muestra el subject y el cuerpo de forma estilizada, para que el organizer sepa qué van a recibir sus guests
- Loading states en todos los botones de acción
- Manejo de errores visible en UI (ej: "Failed to send to 2 guests. Try again.")
- Después de un bulk send exitoso, los guests enviados desaparecen del tab "Compose" y aparecen en "Sent"
- El contador en el botón "Send to [N] guests" se actualiza al desmarcar checkboxes