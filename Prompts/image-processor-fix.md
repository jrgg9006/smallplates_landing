# Implementación: Procesamiento Asíncrono de Imágenes con Supabase Edge Functions

**Fecha:** 9 de enero de 2026  
**Estado:** ✅ Implementado y probado exitosamente  
**Proyecto:** Small Plates

---

## Resumen Ejecutivo

Se implementó un sistema de procesamiento asíncrono para imágenes de recetas usando Supabase Edge Functions y Database Webhooks. Esto reemplaza el flujo síncrono anterior donde el usuario debía esperar ~30 segundos mientras se procesaba la imagen.

**Resultado:** El usuario ahora recibe respuesta inmediata (<1 segundo) y el procesamiento ocurre en background.

---

## Arquitectura Anterior (Síncrona)

```
Usuario sube imagen
       ↓
Vercel API recibe request
       ↓
Vercel llama a Railway /process-image (BLOQUEA ~30 seg)
       ↓
Railway hace OCR + genera prompt
       ↓
Vercel guarda en Supabase
       ↓
Vercel responde al usuario (después de 30 seg de espera)
```

**Problema:** El usuario veía un spinner por ~30 segundos.

---

## Arquitectura Nueva (Asíncrona)

```
Usuario sube imagen
       ↓
Vercel API recibe request
       ↓
Vercel inserta en `image_processing_queue` (status: 'pending')
       ↓
Vercel responde al usuario INMEDIATAMENTE ✓
       ↓
[ASYNC] Database Webhook detecta el INSERT
       ↓
[ASYNC] Webhook dispara Edge Function `process-image-queue`
       ↓
[ASYNC] Edge Function llama a Railway /process-image
       ↓
[ASYNC] Edge Function guarda resultados en Supabase
       ↓
[ASYNC] Edge Function marca status: 'completed'
```

**Resultado:** Usuario libre en <1 segundo. Procesamiento en background.

---

## Componentes Implementados

### 1. Edge Function: `process-image-queue`

**Ubicación:** Supabase Edge Functions  
**URL:** `https://iinnpndsxepvviafrmwz.supabase.co/functions/v1/process-image-queue`  
**JWT Required:** No (llamado internamente por webhook)

**Funcionalidad:**
- Recibe payload del webhook con datos del registro insertado
- Actualiza status a `processing`
- Llama a Railway `/process-image` con `image_url` y `dish_name`
- Guarda resultados de OCR en `guest_recipes` (ingredients, instructions, confidence_score, raw_recipe_text)
- Guarda prompt generado en `midjourney_prompts`
- Actualiza status a `completed` o `failed`

**Código fuente:**

```typescript
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RAILWAY_AGENT_URL = Deno.env.get("RAILWAY_AGENT_URL") || "https://smallplatesweb-production-f5e1.up.railway.app";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface QueueRecord {
  id: string;
  recipe_id: string | null;
  image_url: string;
  recipe_name: string | null;
  status: string;
  attempts: number;
}

interface WebhookPayload {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  record: QueueRecord;
  old_record: QueueRecord | null;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  try {
    const payload: WebhookPayload = await req.json();
    console.log("📥 Webhook received:", JSON.stringify(payload, null, 2));

    // Only process INSERTs with status 'pending'
    if (payload.type !== "INSERT" || payload.record.status !== "pending") {
      console.log("⏭️ Skipping: not a pending INSERT");
      return new Response(JSON.stringify({ skipped: true }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    const queueItem = payload.record;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Mark as processing
    await supabase
      .from("image_processing_queue")
      .update({ status: "processing", updated_at: new Date().toISOString() })
      .eq("id", queueItem.id);

    console.log("🔄 Processing image:", queueItem.image_url);

    // Call Railway agent
    const response = await fetch(`${RAILWAY_AGENT_URL}/process-image`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        image_url: queueItem.image_url,
        dish_name: queueItem.recipe_name || null,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Railway returned ${response.status}: ${errorText}`);
    }

    const promptData = await response.json();
    console.log("✅ Railway response received");

    const hasOCRData = promptData.recipe_name || promptData.ingredients || promptData.instructions;
    const hasPrompt = promptData.generated_prompt;

    if (!hasOCRData && !hasPrompt) {
      throw new Error("No data extracted from image");
    }

    // Update guest_recipes if we have a recipe_id
    if (queueItem.recipe_id && hasOCRData) {
      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };

      if (promptData.ingredients) updateData.ingredients = promptData.ingredients;
      if (promptData.instructions) updateData.instructions = promptData.instructions;
      if (promptData.confidence_score !== undefined) updateData.confidence_score = promptData.confidence_score;
      if (promptData.raw_text) updateData.raw_recipe_text = promptData.raw_text;

      const { error: updateError } = await supabase
        .from("guest_recipes")
        .update(updateData)
        .eq("id", queueItem.recipe_id);

      if (updateError) {
        console.error("❌ Error updating guest_recipes:", updateError);
      } else {
        console.log("✅ OCR data saved to guest_recipes");
      }
    }

    // Save prompt if exists
    if (queueItem.recipe_id && hasPrompt) {
      const { error: insertError } = await supabase
        .from("midjourney_prompts")
        .upsert(
          {
            recipe_id: queueItem.recipe_id,
            generated_prompt: promptData.generated_prompt,
            agent_metadata: promptData.agent_metadata || {},
            updated_at: new Date().toISOString(),
          },
          { onConflict: "recipe_id" }
        );

      if (insertError) {
        console.error("❌ Error saving prompt:", insertError);
      } else {
        console.log("✅ Prompt saved to midjourney_prompts");
      }
    }

    // Mark as completed
    await supabase
      .from("image_processing_queue")
      .update({
        status: "completed",
        processed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", queueItem.id);

    console.log("🎉 Processing completed for queue item:", queueItem.id);

    return new Response(
      JSON.stringify({ success: true, queue_id: queueItem.id }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("❌ Error processing:", error);

    // Try to mark as failed if we have the queue item
    try {
      const payload = await req.clone().json();
      if (payload.record?.id) {
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        await supabase
          .from("image_processing_queue")
          .update({
            status: "failed",
            error_message: error instanceof Error ? error.message : "Unknown error",
            attempts: (payload.record.attempts || 0) + 1,
            updated_at: new Date().toISOString(),
          })
          .eq("id", payload.record.id);
      }
    } catch {
      // Ignore errors when trying to update status
    }

    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
```

### 2. Database Webhook: `process-image-on-insert`

**Configuración:**
- **Tabla:** `image_processing_queue`
- **Evento:** INSERT (solamente)
- **Target:** Edge Function `process-image-queue`
- **Method:** POST
- **Timeout:** 10000ms

---

## Prueba Realizada

Se insertó un registro de prueba:

```sql
INSERT INTO image_processing_queue (recipe_id, image_url, recipe_name, status)
VALUES (
  '1558f013-3d8d-4526-a6d7-5441d2d40f8f',
  'https://iinnpndsxepvviafrmwz.supabase.co/storage/v1/object/public/recipes/.../001.png',
  'TEST - probando webhook',
  'pending'
);
```

**Resultado:**
- Status cambió: `pending` → `processing` → `completed`
- Tiempo total de procesamiento: ~63 segundos
- Datos guardados correctamente en `guest_recipes`
- Prompt guardado correctamente en `midjourney_prompts`
- Confidence score: 95%

---

## Cambios Requeridos en Vercel (Código del Frontend)

### Archivo a modificar: `/api/process-image/route.ts` (o equivalente)

**ANTES (síncrono - a eliminar):**

```typescript
// ❌ ELIMINAR ESTE FLUJO
const response = await fetch(`${RAILWAY_AGENT_URL}/process-image`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ image_url, dish_name }),
});

const promptData = await response.json();
// ... guardar en Supabase
// ... responder al usuario después de 30 segundos
```

**DESPUÉS (asíncrono - implementar):**

```typescript
// ✅ NUEVO FLUJO
export async function POST(request: NextRequest) {
  try {
    const { image_url, dish_name, recipe_id } = await request.json();

    if (!image_url) {
      return NextResponse.json(
        { error: 'image_url is required' },
        { status: 400 }
      );
    }

    const supabase = createSupabaseAdminClient();

    // Solo insertar en la cola - el webhook hace el resto
    const { data, error } = await supabase
      .from('image_processing_queue')
      .insert({
        recipe_id: recipe_id || null,
        image_url: image_url,
        recipe_name: dish_name || null,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error inserting to queue:', error);
      return NextResponse.json(
        { error: 'Failed to queue image for processing' },
        { status: 500 }
      );
    }

    // Responder INMEDIATAMENTE al usuario
    return NextResponse.json({
      success: true,
      message: 'Image queued for processing',
      queue_id: data.id,
      status: 'pending',
    });

  } catch (error) {
    console.error('❌ Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
```

### Cambios en el Frontend (UI)

El frontend debe adaptarse para no esperar los datos de OCR inmediatamente:

**ANTES:**
```typescript
// Esperaba respuesta con datos de OCR
const response = await fetch('/api/process-image', { ... });
const { ingredients, instructions } = await response.json();
setRecipeData({ ingredients, instructions });
```

**DESPUÉS:**
```typescript
// Solo confirma que se encoló
const response = await fetch('/api/process-image', { ... });
const { success, queue_id } = await response.json();

if (success) {
  // Mostrar mensaje al usuario
  toast.success('¡Imagen recibida! Procesando en segundo plano...');
  
  // Opcionalmente: polling o realtime subscription para detectar cuando termine
}
```

---

## Archivos que pueden eliminarse o deprecarse

Una vez confirmado que el nuevo flujo funciona en producción, considera:

1. **Eliminar lógica síncrona** en `/api/process-image/route.ts` que llama directamente a Railway
2. **Eliminar el cron job** de Vercel (`vercel.json` con el cron de `/api/cron/process-images`) - ya no es necesario
3. **Revisar** si hay otros lugares donde se llame a Railway directamente para procesamiento de imágenes

---

## Monitoreo

### Ver registros pendientes/fallidos:

```sql
-- Registros pendientes (no deberían acumularse)
SELECT * FROM image_processing_queue WHERE status = 'pending';

-- Registros fallidos (revisar error_message)
SELECT * FROM image_processing_queue WHERE status = 'failed';

-- Registros que se quedaron en "processing" por más de 5 minutos (posible timeout)
SELECT * FROM image_processing_queue 
WHERE status = 'processing' 
AND updated_at < now() - interval '5 minutes';
```

### Ver logs de Edge Function:

Supabase Dashboard → Edge Functions → `process-image-queue` → Logs

---

## Limitaciones Conocidas

1. **Timeout de Edge Functions:** 60 segundos en plan gratuito. Si Railway tarda más, el proceso falla. Solución: upgrade a Pro ($25/mes) para 150 segundos.

2. **Sin retry automático:** Si un registro falla, queda en status `failed`. Se puede implementar retry manual o automático después.

3. **Sin autenticación en Railway:** El endpoint `/process-image` no tiene API key. Riesgo bajo pero considerar agregar en el futuro.

---

## Contacto

Implementación realizada el 9 de enero de 2026.  
Cualquier duda sobre la implementación, revisar los logs de la Edge Function o la tabla `image_processing_queue`.