# Prompt 2B-3: Cron Job para Envío de Emails de Invitación

## Contexto

Small Plates es una plataforma donde invitados de boda suben recetas. Estamos implementando un sistema automatizado de emails que envía 4 emails espaciados cada 3 días a los guests que han sido invitados.

**Objetivo:** Crear el cron job que corre diariamente y envía los emails correspondientes.

---

## Archivos a crear/modificar

| Archivo | Acción | Descripción |
|---------|--------|-------------|
| `app/api/cron/send-invitations/route.ts` | CREAR | El endpoint del cron |
| `lib/supabase/guests.ts` | MODIFICAR | Agregar funciones para invitation |
| `vercel.json` | CREAR | Configuración del cron schedule |

---

## 1. MODIFICAR: lib/supabase/guests.ts

Agregar estas funciones al final del archivo existente:

```typescript
// ============================================
// INVITATION EMAIL FUNCTIONS
// ============================================

/**
 * Get all guests that are currently in the invitation sequence
 * Returns guests with status 'invited' and a valid email
 */
export async function getGuestsForInvitationEmails(): Promise<{ 
  data: Array<Guest & { 
    group: {
      id: string;
      couple_first_name: string | null;
      partner_first_name: string | null;
      couple_image_url: string | null;
      created_by: string;
    };
    collection_link_token: string | null;
  }> | null; 
  error: string | null 
}> {
  const supabase = createSupabaseClient();
  
  // Get guests with status 'invited', their group info, and the profile's collection_link_token
  const { data, error } = await supabase
    .from('guests')
    .select(`
      *,
      group:groups!inner (
        id,
        couple_first_name,
        partner_first_name,
        couple_image_url,
        created_by,
        profile:profiles!created_by (
          collection_link_token
        )
      )
    `)
    .eq('status', 'invited')
    .not('email', 'is', null)
    .not('email', 'like', 'NO_EMAIL_%');

  if (error) {
    return { data: null, error: error.message };
  }

  // Flatten the data structure
  const flattenedData = data?.map(guest => {
    const { group, ...guestData } = guest;
    return {
      ...guestData,
      group: {
        id: group.id,
        couple_first_name: group.couple_first_name,
        partner_first_name: group.partner_first_name,
        couple_image_url: group.couple_image_url,
        created_by: group.created_by,
      },
      collection_link_token: group.profile?.collection_link_token || null,
    };
  }) || [];

  return { data: flattenedData, error: null };
}

/**
 * Update guest after sending an invitation email
 */
export async function updateGuestInvitationStatus(
  guestId: string, 
  emailsSentCount: number
): Promise<{ error: string | null }> {
  const supabase = createSupabaseClient();
  
  const { error } = await supabase
    .from('guests')
    .update({
      emails_sent_count: emailsSentCount,
      last_email_sent_at: new Date().toISOString(),
    })
    .eq('id', guestId);

  return { error: error?.message || null };
}

/**
 * Mark guest invitation as completed (all emails sent, no response)
 */
export async function markGuestInvitationCompleted(
  guestId: string
): Promise<{ error: string | null }> {
  const supabase = createSupabaseClient();
  
  const { error } = await supabase
    .from('guests')
    .update({
      status: 'completed',
    })
    .eq('id', guestId);

  return { error: error?.message || null };
}

/**
 * Start invitation sequence for a guest
 */
export async function startGuestInvitation(
  guestId: string
): Promise<{ data: Guest | null; error: string | null }> {
  const supabase = createSupabaseClient();
  
  const { data, error } = await supabase
    .from('guests')
    .update({
      status: 'invited',
      invitation_started_at: new Date().toISOString(),
      emails_sent_count: 0,
      invitation_paused_at: null,
    })
    .eq('id', guestId)
    .select()
    .single();

  return { data, error: error?.message || null };
}

/**
 * Pause invitation sequence for a guest
 */
export async function pauseGuestInvitation(
  guestId: string
): Promise<{ data: Guest | null; error: string | null }> {
  const supabase = createSupabaseClient();
  
  const { data, error } = await supabase
    .from('guests')
    .update({
      status: 'paused',
      invitation_paused_at: new Date().toISOString(),
    })
    .eq('id', guestId)
    .select()
    .single();

  return { data, error: error?.message || null };
}

/**
 * Resume invitation sequence for a guest
 */
export async function resumeGuestInvitation(
  guestId: string
): Promise<{ data: Guest | null; error: string | null }> {
  const supabase = createSupabaseClient();
  
  const { data, error } = await supabase
    .from('guests')
    .update({
      status: 'invited',
      invitation_paused_at: null,
    })
    .eq('id', guestId)
    .select()
    .single();

  return { data, error: error?.message || null };
}

/**
 * Retry invitation sequence for a guest (start from email 1)
 */
export async function retryGuestInvitation(
  guestId: string
): Promise<{ data: Guest | null; error: string | null }> {
  const supabase = createSupabaseClient();
  
  const { data, error } = await supabase
    .from('guests')
    .update({
      status: 'invited',
      invitation_started_at: new Date().toISOString(),
      emails_sent_count: 0,
      invitation_paused_at: null,
      last_email_sent_at: null,
    })
    .eq('id', guestId)
    .select()
    .single();

  return { data, error: error?.message || null };
}

/**
 * Manually mark a guest as submitted (e.g., received recipe via WhatsApp)
 */
export async function markGuestAsSubmitted(
  guestId: string
): Promise<{ data: Guest | null; error: string | null }> {
  const supabase = createSupabaseClient();
  
  const { data, error } = await supabase
    .from('guests')
    .update({
      status: 'submitted',
    })
    .eq('id', guestId)
    .select()
    .single();

  return { data, error: error?.message || null };
}
```

---

## 2. CREAR: app/api/cron/send-invitations/route.ts

```typescript
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendGuestInvitationEmail } from '@/lib/email/send-invitation-email';

// Create a Supabase client with service role for cron jobs
// This bypasses RLS policies
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Email schedule: which email to send on which day
const EMAIL_SCHEDULE = [
  { day: 0, emailNumber: 1 },
  { day: 3, emailNumber: 2 },
  { day: 6, emailNumber: 3 },
  { day: 9, emailNumber: 4 },
] as const;

// After this many days with all emails sent, mark as completed
const COMPLETION_DAY = 10;

export async function GET(request: Request) {
  // Verify the request is from Vercel Cron
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log('🚀 Starting invitation email cron job...');

  try {
    // 1. Get all guests with status 'invited'
    const { data: guests, error: guestsError } = await supabaseAdmin
      .from('guests')
      .select(`
        *,
        group:groups!inner (
          id,
          couple_first_name,
          partner_first_name,
          couple_image_url,
          created_by
        )
      `)
      .eq('status', 'invited')
      .not('email', 'is', null)
      .not('email', 'like', 'NO_EMAIL_%')
      .not('invitation_started_at', 'is', null);

    if (guestsError) {
      console.error('Error fetching guests:', guestsError);
      return NextResponse.json({ error: guestsError.message }, { status: 500 });
    }

    if (!guests || guests.length === 0) {
      console.log('No guests to process');
      return NextResponse.json({ 
        success: true, 
        message: 'No guests to process',
        stats: { processed: 0, emailsSent: 0, completed: 0, errors: 0 }
      });
    }

    console.log(`Found ${guests.length} guests to process`);

    // 2. Get collection link tokens for all unique group creators
    const creatorIds = [...new Set(guests.map(g => g.group.created_by))];
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('id, collection_link_token')
      .in('id', creatorIds);

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      return NextResponse.json({ error: profilesError.message }, { status: 500 });
    }

    // Create a map for quick lookup
    const tokenMap = new Map(profiles?.map(p => [p.id, p.collection_link_token]) || []);

    // 3. Process each guest
    const stats = {
      processed: 0,
      emailsSent: 0,
      completed: 0,
      errors: 0,
    };

    for (const guest of guests) {
      stats.processed++;
      
      try {
        // Calculate days since invitation started
        const startDate = new Date(guest.invitation_started_at);
        const now = new Date();
        const daysSinceStart = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        
        const emailsSentCount = guest.emails_sent_count || 0;

        console.log(`Processing ${guest.first_name} (${guest.email}): Day ${daysSinceStart}, Emails sent: ${emailsSentCount}`);

        // Check if we should mark as completed
        if (daysSinceStart >= COMPLETION_DAY && emailsSentCount >= 4) {
          console.log(`Marking ${guest.first_name} as completed`);
          await supabaseAdmin
            .from('guests')
            .update({ status: 'completed' })
            .eq('id', guest.id);
          stats.completed++;
          continue;
        }

        // Find which email should be sent today
        const scheduledEmail = EMAIL_SCHEDULE.find(schedule => 
          daysSinceStart >= schedule.day && emailsSentCount < schedule.emailNumber
        );

        // Find the highest email number we should have sent by now
        const targetEmail = [...EMAIL_SCHEDULE]
          .reverse()
          .find(schedule => daysSinceStart >= schedule.day);

        if (!targetEmail || emailsSentCount >= targetEmail.emailNumber) {
          console.log(`No email to send for ${guest.first_name} today`);
          continue;
        }

        // Determine which email to send (the next one after what we've already sent)
        const emailToSend = (emailsSentCount + 1) as 1 | 2 | 3 | 4;

        if (emailToSend > 4) {
          console.log(`All emails already sent for ${guest.first_name}`);
          continue;
        }

        // Get collection link token
        const collectionLinkToken = tokenMap.get(guest.group.created_by);
        if (!collectionLinkToken) {
          console.error(`No collection link token found for guest ${guest.id}`);
          stats.errors++;
          continue;
        }

        // Build couple name
        const coupleName = [
          guest.group.couple_first_name,
          guest.group.partner_first_name
        ].filter(Boolean).join(' & ') || 'The Couple';

        // Build collection link
        const collectionLink = `${process.env.NEXT_PUBLIC_APP_URL || 'https://smallplatesandcompany.com'}/collect/${collectionLinkToken}`;

        // Send the email
        console.log(`Sending email ${emailToSend} to ${guest.email}`);
        const result = await sendGuestInvitationEmail({
          to: guest.email,
          guestName: guest.first_name,
          coupleName,
          collectionLink,
          coupleImageUrl: guest.group.couple_image_url || undefined,
          emailNumber: emailToSend,
        });

        if (result.success) {
          // Update the guest record
          await supabaseAdmin
            .from('guests')
            .update({
              emails_sent_count: emailToSend,
              last_email_sent_at: new Date().toISOString(),
            })
            .eq('id', guest.id);
          
          stats.emailsSent++;
          console.log(`✅ Email ${emailToSend} sent successfully to ${guest.email}`);
        } else {
          console.error(`Failed to send email to ${guest.email}:`, result.error);
          stats.errors++;
        }
      } catch (error) {
        console.error(`Error processing guest ${guest.id}:`, error);
        stats.errors++;
      }
    }

    console.log('📊 Cron job completed:', stats);

    return NextResponse.json({
      success: true,
      message: 'Cron job completed',
      stats,
    });
  } catch (error) {
    console.error('Cron job failed:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
```

---

## 3. CREAR: vercel.json

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

**Nota:** `0 9 * * *` significa "todos los días a las 9:00 AM UTC".

Si quieres ajustar la hora (ej: 9 AM hora México = 3 PM UTC en invierno):
- `0 15 * * *` = 9 AM México (CST)
- `0 14 * * *` = 9 AM México (CDT, horario de verano)

---

## 4. Variables de entorno necesarias

Agregar a `.env.local` y a Vercel:

```
CRON_SECRET=tu-secreto-aleatorio-aqui
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
NEXT_PUBLIC_APP_URL=https://smallplatesandcompany.com
```

**Para generar CRON_SECRET:**
```bash
openssl rand -base64 32
```

**SUPABASE_SERVICE_ROLE_KEY:**
Lo encuentras en Supabase Dashboard → Settings → API → service_role key (es diferente al anon key).

**⚠️ IMPORTANTE:** El service_role key tiene acceso completo a tu base de datos. Nunca lo expongas en el frontend.

---

## 5. Agregar CRON_SECRET en Vercel

1. Ve a tu proyecto en Vercel
2. Settings → Environment Variables
3. Agrega `CRON_SECRET` con el valor que generaste

Vercel automáticamente usa este secreto para autenticar las llamadas al cron.

---

## Cómo probar localmente

Puedes probar el endpoint manualmente:

```bash
curl -X GET http://localhost:3000/api/cron/send-invitations \
  -H "Authorization: Bearer tu-cron-secret"
```

O crear un script de prueba temporal:

```typescript
// scripts/test-cron.ts
// Ejecutar con: npx tsx scripts/test-cron.ts

const response = await fetch('http://localhost:3000/api/cron/send-invitations', {
  headers: {
    'Authorization': `Bearer ${process.env.CRON_SECRET}`
  }
});

const data = await response.json();
console.log(data);
```

---

## Lógica del cron explicada

```
Para cada guest con status = 'invited':

1. Calcular: días desde invitation_started_at

2. Si días >= 10 y emails_sent >= 4:
   → Marcar como 'completed'
   → Continuar al siguiente guest

3. Determinar qué email toca:
   - Día 0-2: Email 1
   - Día 3-5: Email 2
   - Día 6-8: Email 3
   - Día 9+:  Email 4

4. Si emails_sent_count < email que toca:
   → Enviar el siguiente email
   → Actualizar emails_sent_count y last_email_sent_at

5. Si emails_sent_count >= email que toca:
   → No hacer nada (ya se envió)
```

---

## Verificación post-implementación

1. [ ] El archivo `vercel.json` existe en la raíz
2. [ ] Las variables de entorno están configuradas (local y Vercel)
3. [ ] El endpoint responde con 401 sin el header correcto
4. [ ] El endpoint procesa guests correctamente con el header
5. [ ] Los emails se envían via Postmark
6. [ ] La DB se actualiza después de enviar (emails_sent_count, last_email_sent_at)
7. [ ] Los guests se marcan como 'completed' después del día 10
8. [ ] Los logs muestran el progreso correctamente

---

## Próximos pasos después de este prompt

1. **Fase 2B-4:** UI para Captain (botones Invite/Pause/Resume en el modal)
2. **Fase 2B-5:** Auto-stop cuando guest sube receta
3. **Fase 2B-6:** Testing completo