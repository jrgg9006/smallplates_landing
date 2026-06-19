# Originals Annex — M2: Normalización + Upscale — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Que el admin, tras marcar imágenes como "original" (M1), pueda con un botón normalizarlas (sharp → PNG limpio) y escalarlas (Real-ESRGAN 4x vía un Edge Function gemelo), viendo el status por imagen en vivo (polling).

**Architecture:** Una ruta server Node (`/annex/upscale`) baja cada `source_url`, la normaliza con `sharp` a PNG (`original_url`) y pone la fila en `upscale_status='pending'`. Eso dispara un Database Webhook sobre `recipe_annex_images` → Edge Function `upscale-annex-image` (gemelo de `upscale-image`) que corre Replicate, sube el `print_url` y escribe `upscale_status='ready'`. El `BookReviewOverlay` dispara el botón y hace polling del GET `/annex` (que ya existe de M1) cada 2s hasta estado terminal — mismo patrón que `/admin/operations`.

**Tech Stack:** Next.js 14 App Router (route handler Node), TypeScript strict, Supabase (service-role client + Storage + Database Webhook), Deno Edge Function, Replicate Real-ESRGAN, `sharp` (ya es dep), Jest (lógica pura), Tailwind, lucide-react.

## Global Constraints

- **Cero regresión:** M2 no toca el flujo de recetas ni sus columnas; solo `recipe_annex_images` + Storage `recipes/print/annex/**`. Un libro sin originals no dispara nada.
- **Reutilizar antes de crear:** el Edge Function es copia de `upscale-image` (mismo modelo `f121d640bd286e1fdc67f9799164c1d5be36ff74576ee11c803ae5b665dd46aa`, `scale:4`, `face_enhance:false`); el polling copia el de `app/(admin)/admin/operations/page.tsx`; `sharp` ya está en `package.json` (^0.34.5).
- **Supabase manual:** todo SQL (el trigger del webhook) se entrega en bloque para correr a mano; nada de `apply_migration` destructivo. El deploy del Edge Function se hace vía MCP `deploy_edge_function` **solo tras confirmación del usuario**.
- **Sin dependencias nuevas.**
- **No `any`.** Componentes funcionales, early returns, archivos < 300 líneas.
- **Sin console.log** en código de producción Next (el Edge Function sí loguea, igual que su gemelo).
- **Modelo de datos ya existe** desde M1: columnas `original_url`, `print_url`, `upscale_status` (`'pending'|'processing'|'ready'|'error'|null`), `image_dimensions` (jsonb) en `recipe_annex_images`.

---

## Roadmap de milestones (contexto)

```
M1  Datos + selección       ✅ HECHO y verificado. admin marca/desmarca originals, persiste y se ve
M2  Normalización + upscale  ← ESTE PLAN. sharp + Edge Function + botón + polling
M3  Pipeline                  package route + fetch-book.js meten annex_images al JSON
M4  InDesign v17              sección Originals + referencia cruzada de páginas
```

Spec de referencia: `docs/superpowers/specs/2026-06-15-originals-annex-design.md` (§4 flujo, §5 piezas 2/3/4).
Plan M1: `docs/superpowers/plans/2026-06-15-originals-annex-m1.md`.

---

## File Structure (M2)

- **Create** `lib/annex/upscale.ts` — helper puro: rutas de Storage del anexo + predicados de status.
- **Create** `lib/annex/upscale.test.ts` — tests Jest del helper.
- **Create** `supabase/functions/upscale-annex-image/index.ts` — Edge Function gemelo (fuente canónica versionada en el repo). Se despliega a Supabase.
- **Create** `app/api/v1/admin/books/[groupId]/annex/upscale/route.ts` — ruta Node: normaliza con sharp + pone `pending`.
- **Modify** `app/(admin)/admin/books/components/BookReviewOverlay.tsx` — status por imagen + botón "Upscale originals" + polling.
- **Webhook (manual):** trigger SQL sobre `recipe_annex_images` (Task 2, Step 4).

---

## Task 1: Helper puro de upscale (rutas + predicados) — TDD

Aísla las convenciones de path de Storage y los predicados de status en funciones puras testeables, para que la ruta `/annex/upscale` y el polling del overlay coincidan exactamente con dónde viven los archivos y qué estados están "en vuelo".

**Files:**
- Create: `lib/annex/upscale.ts`
- Test: `lib/annex/upscale.test.ts`

**Interfaces:**
- Produces:
  - `annexSrcStoragePath(groupId: string, recipeId: string, position: number): string` → `print/annex/{groupId}/{recipeId}_{position}_src.png`
  - `annexPrintStoragePath(groupId: string, recipeId: string, position: number): string` → `print/annex/{groupId}/{recipeId}_{position}.png`
  - `shouldQueueForUpscale(status: string | null): boolean` → `true` si `null` o `'error'`
  - `isAnnexProcessing(status: string | null): boolean` → `true` si `'pending'` o `'processing'`

- [ ] **Step 1: Escribir el test que falla**

Create `lib/annex/upscale.test.ts`:

```ts
import {
  annexSrcStoragePath,
  annexPrintStoragePath,
  shouldQueueForUpscale,
  isAnnexProcessing,
} from './upscale';

describe('annexSrcStoragePath', () => {
  it('construye el path del PNG normalizado', () => {
    expect(annexSrcStoragePath('g1', 'r1', 0)).toBe('print/annex/g1/r1_0_src.png');
    expect(annexSrcStoragePath('g1', 'r1', 2)).toBe('print/annex/g1/r1_2_src.png');
  });
});

describe('annexPrintStoragePath', () => {
  it('construye el path del PNG escalado', () => {
    expect(annexPrintStoragePath('g1', 'r1', 0)).toBe('print/annex/g1/r1_0.png');
  });
  it('difiere del path normalizado solo por el sufijo _src', () => {
    expect(annexPrintStoragePath('g', 'r', 1)).not.toBe(annexSrcStoragePath('g', 'r', 1));
  });
});

describe('shouldQueueForUpscale', () => {
  it('encola filas nunca procesadas o con error', () => {
    expect(shouldQueueForUpscale(null)).toBe(true);
    expect(shouldQueueForUpscale('error')).toBe(true);
  });
  it('no re-encola filas en vuelo o ya listas', () => {
    expect(shouldQueueForUpscale('pending')).toBe(false);
    expect(shouldQueueForUpscale('processing')).toBe(false);
    expect(shouldQueueForUpscale('ready')).toBe(false);
  });
});

describe('isAnnexProcessing', () => {
  it('true solo para estados no terminales', () => {
    expect(isAnnexProcessing('pending')).toBe(true);
    expect(isAnnexProcessing('processing')).toBe(true);
  });
  it('false para terminales y null', () => {
    expect(isAnnexProcessing('ready')).toBe(false);
    expect(isAnnexProcessing('error')).toBe(false);
    expect(isAnnexProcessing(null)).toBe(false);
  });
});
```

- [ ] **Step 2: Correr el test para verificar que falla**

Run: `npx jest lib/annex/upscale.test.ts`
Expected: FAIL — "Cannot find module './upscale'".

- [ ] **Step 3: Implementar el helper**

Create `lib/annex/upscale.ts`:

```ts
// Storage paths for annex images in the `recipes` bucket. Kept pure + tested so the
// upscale route, the Edge Function and the print pipeline all agree on exactly where
// normalized and print-ready files live.

/** Normalized PNG (sharp output) that gets fed to Replicate. */
export function annexSrcStoragePath(groupId: string, recipeId: string, position: number): string {
  return `print/annex/${groupId}/${recipeId}_${position}_src.png`;
}

/** Upscaled PNG (Real-ESRGAN output) consumed by the print pipeline (M3). */
export function annexPrintStoragePath(groupId: string, recipeId: string, position: number): string {
  return `print/annex/${groupId}/${recipeId}_${position}.png`;
}

// Reason: a row is (re)queued only when it was never processed or previously errored —
// never when it's already in flight ('pending'/'processing') or done ('ready').
export function shouldQueueForUpscale(status: string | null): boolean {
  return status === null || status === 'error';
}

/** Non-terminal states the front-end polls on. */
export function isAnnexProcessing(status: string | null): boolean {
  return status === 'pending' || status === 'processing';
}
```

- [ ] **Step 4: Correr el test para verificar que pasa**

Run: `npx jest lib/annex/upscale.test.ts`
Expected: PASS (4 suites verdes).

- [ ] **Step 5: Commit**

```bash
git add lib/annex/upscale.ts lib/annex/upscale.test.ts
git commit -m "feat(annex): helper puro de paths/status de upscale + tests (M2)"
```

---

## Task 2: Edge Function `upscale-annex-image` + webhook

Gemelo de `upscale-image` (cuya fuente actual está desplegada en Supabase, no en el repo). Lee la fila de `recipe_annex_images`, corre Replicate sobre `original_url` (el PNG ya normalizado), sube el escalado a `print/annex/{groupId}/{recipeId}_{position}.png` y escribe `print_url`/`upscale_status`/`image_dimensions`.

**Files:**
- Create: `supabase/functions/upscale-annex-image/index.ts`

**Interfaces:**
- Consumes (del webhook payload `record`): `id`, `group_id`, `recipe_id`, `position`, `original_url`, `upscale_status`.
- Produces (en la fila): `print_url`, `upscale_status` (`processing`→`ready`/`error`), `image_dimensions`.

- [ ] **Step 1: Crear la fuente del Edge Function**

Create `supabase/functions/upscale-annex-image/index.ts`:

```ts
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

// ============================================
// Small Plates & Co. — Originals annex upscaling
// Twin of `upscale-image`, adapted to recipe_annex_images.
// Triggered by a Database Webhook on recipe_annex_images when
// upscale_status transitions to 'pending'.
// ============================================

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const REPLICATE_API_TOKEN = Deno.env.get("REPLICATE_API_TOKEN")!;

const UPSCALE_FACTOR = 4;
const REPLICATE_MODEL_VERSION =
  "f121d640bd286e1fdc67f9799164c1d5be36ff74576ee11c803ae5b665dd46aa";
const POLL_INTERVAL_MS = 2000;
const MAX_POLL_ATTEMPTS = 60;

interface WebhookPayload {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  record: Record<string, unknown>;
  old_record: Record<string, unknown> | null;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  let rowId: string | null = null;
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const payload: WebhookPayload = await req.json();
    const record = payload.record;

    rowId = record.id as string;
    const status = (record.upscale_status as string | null) ?? null;
    const originalUrl = (record.original_url as string | null) ?? null;
    const groupId = record.group_id as string;
    const recipeId = record.recipe_id as string;
    const position = (record.position as number) ?? 0;

    console.log(`Webhook: ${payload.type} annex row ${rowId} (status=${status})`);

    // Reason: only act on the pending transition; ignore our own processing/ready writes
    // (this Edge Function itself updates the row, which re-fires the webhook).
    if (status !== "pending") {
      return jsonResponse({ skipped: true, reason: "not_pending" });
    }
    if (!originalUrl) {
      await supabase
        .from("recipe_annex_images")
        .update({ upscale_status: "error", image_dimensions: { error: "missing original_url" } })
        .eq("id", rowId);
      return jsonResponse({ skipped: true, reason: "no_original_url" });
    }

    await supabase
      .from("recipe_annex_images")
      .update({ upscale_status: "processing", print_url: null })
      .eq("id", rowId);

    console.log(`  Source (normalized): ${originalUrl}`);
    console.log(`  Sending to Real-ESRGAN (${UPSCALE_FACTOR}x)...`);
    const upscaledUrl = await callReplicate(originalUrl);
    console.log(`  Upscale complete`);

    const imageResponse = await fetch(upscaledUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to download upscaled image: ${imageResponse.status}`);
    }
    const imageData = new Uint8Array(await imageResponse.arrayBuffer());
    console.log(`  Downloaded: ${(imageData.length / 1024 / 1024).toFixed(1)} MB`);

    const { width: newWidth, height: newHeight } = readImageDimensions(imageData);
    const origWidth = Math.round(newWidth / UPSCALE_FACTOR);
    const origHeight = Math.round(newHeight / UPSCALE_FACTOR);
    console.log(`  Dimensions: ${origWidth}x${origHeight} -> ${newWidth}x${newHeight}`);

    const printPath = `print/annex/${groupId}/${recipeId}_${position}.png`;
    console.log(`  Uploading to: recipes/${printPath}`);

    const { error: uploadError } = await supabase.storage
      .from("recipes")
      .upload(printPath, imageData, { contentType: "image/png", upsert: true });

    if (uploadError) {
      throw new Error(`Storage upload failed: ${uploadError.message}`);
    }

    const printUrl = `${SUPABASE_URL}/storage/v1/object/public/recipes/${printPath}`;

    const dimensions = {
      width: newWidth,
      height: newHeight,
      original_width: origWidth,
      original_height: origHeight,
      upscaled: true,
      upscale_factor: UPSCALE_FACTOR,
    };

    await supabase
      .from("recipe_annex_images")
      .update({
        print_url: printUrl,
        upscale_status: "ready",
        image_dimensions: dimensions,
      })
      .eq("id", rowId);

    console.log(`Done: annex row ${rowId} -> ${newWidth}x${newHeight}`);
    return jsonResponse({ success: true, id: rowId, print_url: printUrl, dimensions });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error(`Error: ${msg}`);

    if (rowId) {
      try {
        await supabase
          .from("recipe_annex_images")
          .update({ upscale_status: "error", image_dimensions: { error: msg } })
          .eq("id", rowId);
      } catch {
        console.error("Failed to update error status");
      }
    }

    return jsonResponse({ error: msg }, 500);
  }
});

async function callReplicate(imageUrl: string): Promise<string> {
  const createRes = await fetch("https://api.replicate.com/v1/predictions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${REPLICATE_API_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      version: REPLICATE_MODEL_VERSION,
      input: { image: imageUrl, scale: UPSCALE_FACTOR, face_enhance: false },
    }),
  });

  if (!createRes.ok) {
    const errText = await createRes.text();
    throw new Error(`Replicate create failed (${createRes.status}): ${errText}`);
  }

  let prediction = await createRes.json();
  console.log(`  Prediction ID: ${prediction.id}`);

  let attempts = 0;
  while (prediction.status !== "succeeded" && prediction.status !== "failed") {
    if (++attempts > MAX_POLL_ATTEMPTS) {
      throw new Error("Replicate timeout: exceeded 2 minutes");
    }
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
    const pollRes = await fetch(
      `https://api.replicate.com/v1/predictions/${prediction.id}`,
      { headers: { Authorization: `Bearer ${REPLICATE_API_TOKEN}` } }
    );
    prediction = await pollRes.json();
    if (attempts % 5 === 0) {
      console.log(`  Waiting... (${prediction.status}, ${attempts * 2}s)`);
    }
  }

  if (prediction.status === "failed") {
    throw new Error(`Replicate failed: ${prediction.error}`);
  }

  return prediction.output as string;
}

function readImageDimensions(data: Uint8Array): { width: number; height: number } {
  if (data[0] === 0x89 && data[1] === 0x50 && data[2] === 0x4e && data[3] === 0x47) {
    const width = (data[16] << 24) | (data[17] << 16) | (data[18] << 8) | data[19];
    const height = (data[20] << 24) | (data[21] << 16) | (data[22] << 8) | data[23];
    return { width, height };
  }
  if (data[0] === 0xff && data[1] === 0xd8) {
    let offset = 2;
    while (offset < data.length - 8) {
      if (data[offset] === 0xff) {
        const marker = data[offset + 1];
        if (marker === 0xc0 || marker === 0xc2) {
          const height = (data[offset + 5] << 8) | data[offset + 6];
          const width = (data[offset + 7] << 8) | data[offset + 8];
          return { width, height };
        }
        const len = (data[offset + 2] << 8) | data[offset + 3];
        offset += 2 + len;
      } else {
        offset++;
      }
    }
  }
  console.warn("Could not read image dimensions from header");
  return { width: 0, height: 0 };
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
```

- [ ] **Step 2: Commit de la fuente**

```bash
git add supabase/functions/upscale-annex-image/index.ts
git commit -m "feat(annex): Edge Function upscale-annex-image (gemelo de upscale-image) (M2)"
```

- [ ] **Step 3: Desplegar el Edge Function a Supabase** *(requiere confirmación del usuario)*

Reason: el deploy es una acción sobre el proyecto Supabase. Confirmar con el usuario antes de ejecutar. Los secretos `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` y `REPLICATE_API_TOKEN` ya existen a nivel proyecto (los usa `upscale-image`), así que no hay que setearlos.

Desplegar con la MCP de Supabase (`deploy_edge_function`, proyecto `iinnpndsxepvviafrmwz`, slug `upscale-annex-image`, `verify_jwt=false` — el webhook llama sin JWT, igual que el gemelo), o que el usuario lo suba a mano.

Expected: el Edge Function aparece en `list_edge_functions` con status `ACTIVE` y `verify_jwt=false`.

- [ ] **Step 4: Crear el Database Webhook (SQL manual)** *(el usuario lo corre)*

Reason: regla del proyecto — el SQL lo corre el usuario. Replica el trigger existente `upscale-image-on-upload` (verificado en la DB), pero sobre `recipe_annex_images` y con `WHEN` para disparar **solo** en la transición a `pending` (evita re-disparos cuando la propia función escribe `processing`/`ready`).

Entregar este bloque para correr en el SQL editor del proyecto `Small_Plates` (`iinnpndsxepvviafrmwz`) y esperar confirmación:

```sql
-- Originals annex: fire upscale-annex-image when a row is queued (status -> 'pending').
create trigger "upscale-annex-on-pending"
after update on public.recipe_annex_images
for each row
when (new.upscale_status = 'pending' and new.upscale_status is distinct from old.upscale_status)
execute function supabase_functions.http_request(
  'https://iinnpndsxepvviafrmwz.supabase.co/functions/v1/upscale-annex-image',
  'POST',
  '{"Content-type":"application/json"}',
  '{}',
  '5000'
);
```

Expected: `CREATE TRIGGER`. Verificable con:

```sql
select tgname from pg_trigger t join pg_class c on c.oid = t.tgrelid
where c.relname = 'recipe_annex_images' and tgname = 'upscale-annex-on-pending';
```

---

## Task 3: Ruta de normalización + disparo `/annex/upscale`

Ruta Node (sharp) a nivel libro. Para cada fila del grupo que aún no se procesó (`null`/`error`), baja `source_url`, normaliza a PNG con `sharp`, lo sube como `original_url` y pone la fila en `pending` (lo que dispara el webhook de Task 2).

**Files:**
- Create: `app/api/v1/admin/books/[groupId]/annex/upscale/route.ts`

**Interfaces:**
- Consumes: `annexSrcStoragePath`, `shouldQueueForUpscale` (Task 1); `requireAdminAuth` (`@/lib/auth/admin`), `createSupabaseAdminClient` (`@/lib/supabase/admin`) — patrón idéntico al de `annex/route.ts`.
- Produces: `POST` → `200 { queued: number, errors: { id: string; error: string }[] }`.

- [ ] **Step 1: Crear la ruta**

Create `app/api/v1/admin/books/[groupId]/annex/upscale/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { requireAdminAuth } from '@/lib/auth/admin';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { annexSrcStoragePath, shouldQueueForUpscale } from '@/lib/annex/upscale';

// Reason: sharp needs the Node runtime; downloading + normalizing several images can take time.
export const runtime = 'nodejs';
export const maxDuration = 60;

// Reason: cap the normalized image so Real-ESRGAN 4x stays within a sane output size.
// A handwritten note at 2048px upscales to 8192px — plenty for one-image-per-page print,
// and it keeps Replicate from choking on full-resolution phone photos (4000px+ -> 16000px).
const MAX_NORMALIZED_EDGE = 2048;

// POST — normalize every not-yet-processed annex image for this group and queue it for upscale.
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    await requireAdminAuth();
    const { groupId } = await params;
    const supabase = createSupabaseAdminClient();

    const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!baseUrl) {
      return NextResponse.json({ error: 'Supabase URL not configured' }, { status: 500 });
    }

    const { data: rows, error: rowsError } = await supabase
      .from('recipe_annex_images')
      .select('id, recipe_id, source_url, upscale_status, position')
      .eq('group_id', groupId);

    if (rowsError) return NextResponse.json({ error: rowsError.message }, { status: 500 });

    const queue = (rows ?? []).filter((r) =>
      shouldQueueForUpscale(r.upscale_status as string | null)
    );

    let queued = 0;
    const errors: { id: string; error: string }[] = [];

    for (const row of queue) {
      try {
        const srcRes = await fetch(row.source_url as string);
        if (!srcRes.ok) throw new Error(`download failed (${srcRes.status})`);
        const inputBuffer = Buffer.from(await srcRes.arrayBuffer());

        // Reason: rotate() bakes in EXIF orientation; png() guarantees a clean, lossless
        // input for Replicate regardless of the guest's original format (webp/gif/jpg).
        const normalized = await sharp(inputBuffer)
          .rotate()
          .resize(MAX_NORMALIZED_EDGE, MAX_NORMALIZED_EDGE, {
            fit: 'inside',
            withoutEnlargement: true,
          })
          .png()
          .toBuffer();

        const path = annexSrcStoragePath(
          groupId,
          row.recipe_id as string,
          row.position as number
        );

        const { error: uploadError } = await supabase.storage
          .from('recipes')
          .upload(path, normalized, { contentType: 'image/png', upsert: true });
        if (uploadError) throw new Error(`upload failed: ${uploadError.message}`);

        const originalUrl = `${baseUrl}/storage/v1/object/public/recipes/${path}`;

        // Reason: setting upscale_status='pending' fires the DB webhook -> upscale-annex-image.
        const { error: updateError } = await supabase
          .from('recipe_annex_images')
          .update({
            original_url: originalUrl,
            print_url: null,
            upscale_status: 'pending',
            image_dimensions: null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', row.id);
        if (updateError) throw new Error(`db update failed: ${updateError.message}`);

        queued += 1;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'normalize failed';
        errors.push({ id: row.id as string, error: msg });
        // Reason: surface the failure in the overlay instead of leaving the row stuck.
        await supabase
          .from('recipe_annex_images')
          .update({
            upscale_status: 'error',
            image_dimensions: { error: msg },
            updated_at: new Date().toISOString(),
          })
          .eq('id', row.id);
      }
    }

    return NextResponse.json({ queued, errors });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unauthorized' },
      { status: 401 }
    );
  }
}
```

- [ ] **Step 2: Type check**

Run: `npx tsc --noEmit`
Expected: sin errores.

- [ ] **Step 3: Verificación manual (con la app corriendo + Edge Function desplegado + webhook creado)**

Reason: el repo no testea rutas acopladas a Supabase; se verifica a mano (patrón del repo). Requiere Task 2 desplegada y el webhook creado.
1. En `/admin/books`, abrir un libro y marcar 1–2 imágenes como original (toggle de M1).
2. En la consola del navegador (misma sesión admin):
   ```js
   await fetch(`/api/v1/admin/books/${GROUP_ID}/annex/upscale`, { method: 'POST' }).then(r => r.json())
   ```
   Expected: `{ queued: N, errors: [] }`.
3. Inmediatamente, `await fetch(`/api/v1/admin/books/${GROUP_ID}/annex`).then(r => r.json())` → las filas muestran `upscale_status: "pending"` o `"processing"` y `original_url` poblado.
4. Tras ~10–60s, repetir el GET → `upscale_status: "ready"`, `print_url` poblado, `image_dimensions` con `width/height`.
5. Abrir `print_url` en el navegador → se ve el PNG escalado.
6. Re-correr el POST → `{ queued: 0, errors: [] }` (las `ready` no se re-encolan).

- [ ] **Step 4: Commit**

```bash
git add "app/api/v1/admin/books/[groupId]/annex/upscale/route.ts"
git commit -m "feat(annex): ruta de normalizacion (sharp) + disparo de upscale (M2)"
```

---

## Task 4: Overlay — status por imagen + botón "Upscale originals" + polling

Conecta la UI: carga el status de las filas del anexo, lo muestra por imagen, agrega el botón a nivel libro que llama a Task 3, y hace polling del GET `/annex` (M1) hasta que todo esté terminal — mismo patrón que `app/(admin)/admin/operations/page.tsx:218`.

**Files:**
- Modify: `app/(admin)/admin/books/components/BookReviewOverlay.tsx`

**Interfaces:**
- Consumes: GET `/api/v1/admin/books/[groupId]/annex` → `{ annex_images: { source_url, upscale_status, print_url, ... }[] }`; POST `/api/v1/admin/books/[groupId]/annex/upscale` (Task 3). Reutiliza `Loader2`, `Check`, `AlertTriangle` (ya importados, línea 4).

- [ ] **Step 1: Añadir estado para status/upscale/polling**

En `app/(admin)/admin/books/components/BookReviewOverlay.tsx`, junto a `const [annexBusy, setAnnexBusy] = useState<string | null>(null);` (línea ~80), añadir:

```ts
  // Reason: M2 — per-image upscale status keyed by source_url, plus batch-upscale + polling state.
  const [annexStatusByUrl, setAnnexStatusByUrl] = useState<
    Record<string, { upscale_status: string | null; print_url: string | null }>
  >({});
  const [annexUpscaling, setAnnexUpscaling] = useState(false);
  const [annexPolling, setAnnexPolling] = useState(false);
```

- [ ] **Step 2: Añadir `loadAnnexStatus` y cargarlo al montar**

Dentro del componente, después del bloque de `audits`/`sectionAudit` (línea ~126) y antes de `saveReview`, añadir:

```ts
  // Reason: the annex GET (M1) returns each row's live upscale_status/print_url; we key it
  // by source_url so each image's badge can read it. Polling refreshes this same map.
  const loadAnnexStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/v1/admin/books/${groupId}/annex`);
      if (!res.ok) return;
      const { annex_images } = (await res.json()) as {
        annex_images: { source_url: string; upscale_status: string | null; print_url: string | null }[];
      };
      const map: Record<string, { upscale_status: string | null; print_url: string | null }> = {};
      for (const row of annex_images ?? []) {
        map[row.source_url] = {
          upscale_status: row.upscale_status ?? null,
          print_url: row.print_url ?? null,
        };
      }
      setAnnexStatusByUrl(map);
    } catch {
      // Swallow transient errors; polling/next load will retry.
    }
  }, [groupId]);

  useEffect(() => {
    loadAnnexStatus();
  }, [loadAnnexStatus]);
```

- [ ] **Step 3: Disparar el upscale y arrancar el polling**

Después de `loadAnnexStatus`/`useEffect` del Step 2, añadir:

```ts
  // Reason: count selected originals across all recipes — drives the book-level button.
  const selectedAnnexCount = useMemo(
    () => localRecipes.reduce((n, r) => n + (r.annex_source_urls?.length ?? 0), 0),
    [localRecipes]
  );

  const triggerUpscale = useCallback(async () => {
    setAnnexUpscaling(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/admin/books/${groupId}/annex/upscale`, { method: 'POST' });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j.error || 'No se pudo iniciar el upscale');
        setAnnexUpscaling(false);
        return;
      }
      await loadAnnexStatus();
      setAnnexPolling(true);
    } catch {
      setError('No se pudo iniciar el upscale');
      setAnnexUpscaling(false);
    }
  }, [groupId, loadAnnexStatus]);

  // Reason: the upscale Edge Function runs async via the DB webhook — no realtime back to the
  // client — so poll the annex GET every 2s (max 90s) while any row is in flight. Mirrors
  // the operations drawer polling (app/(admin)/admin/operations/page.tsx).
  useEffect(() => {
    if (!annexPolling) return;
    const startedAt = Date.now();
    const TIMEOUT_MS = 90_000;
    const intervalId = setInterval(async () => {
      if (Date.now() - startedAt >= TIMEOUT_MS) {
        setAnnexPolling(false);
        setAnnexUpscaling(false);
        clearInterval(intervalId);
        return;
      }
      await loadAnnexStatus();
    }, 2_000);
    return () => clearInterval(intervalId);
  }, [annexPolling, loadAnnexStatus]);

  // Reason: stop polling once no row is 'pending'/'processing' anymore.
  useEffect(() => {
    if (!annexPolling) return;
    const anyInFlight = Object.values(annexStatusByUrl).some(
      (s) => s.upscale_status === 'pending' || s.upscale_status === 'processing'
    );
    if (!anyInFlight) {
      setAnnexPolling(false);
      setAnnexUpscaling(false);
    }
  }, [annexStatusByUrl, annexPolling]);
```

- [ ] **Step 4: Mantener el mapa de status en sync con el toggle**

En el handler `toggleAnnex` existente (línea ~415), dentro del `setLocalRecipes(...)` exitoso, justo después de cerrar el `setLocalRecipes((prev) => ...)`, añadir la actualización del mapa para que la UI de status reaccione al instante:

```ts
      setAnnexStatusByUrl((prev) => {
        if (isSelected) {
          const next = { ...prev };
          delete next[sourceUrl];
          return next;
        }
        return { ...prev, [sourceUrl]: { upscale_status: null, print_url: null } };
      });
```

- [ ] **Step 5: Añadir el helper de render del badge de status**

Dentro del componente, junto a las otras funciones de render/derivadas (p.ej. después de `selectedAnnexCount`/`triggerUpscale`, antes del `return`), añadir:

```tsx
  // Reason: one small badge per image reflecting its upscale lifecycle. null = selected but
  // not yet processed (no badge — the toggle already shows "✓ Original incluido").
  const renderAnnexStatus = (url: string) => {
    const st = annexStatusByUrl[url]?.upscale_status ?? null;
    if (st === 'pending' || st === 'processing') {
      return (
        <span className="mt-1 inline-flex items-center gap-1 text-xs text-amber-600">
          <Loader2 className="w-3 h-3 animate-spin" /> Procesando…
        </span>
      );
    }
    if (st === 'ready') {
      return (
        <span className="mt-1 inline-flex items-center gap-1 text-xs text-emerald-600">
          <Check className="w-3 h-3" /> Listo para imprimir
        </span>
      );
    }
    if (st === 'error') {
      return (
        <span className="mt-1 inline-flex items-center gap-1 text-xs text-red-600">
          <AlertTriangle className="w-3 h-3" /> Error al procesar
        </span>
      );
    }
    return null;
  };
```

- [ ] **Step 6: Añadir el botón "Upscale originals" en el header**

En el header superior, dentro del `<div className="flex items-center gap-4">` (línea ~457), antes del bloque `{!showSummary && auditFlaggedCount > 0 && (...)}`, añadir:

```tsx
          {!showSummary && selectedAnnexCount > 0 && (
            <button
              type="button"
              onClick={triggerUpscale}
              disabled={annexUpscaling}
              className="inline-flex items-center gap-1.5 rounded bg-emerald-600 px-3 py-1 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {annexUpscaling && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {annexUpscaling ? 'Procesando originals…' : `Upscale originals (${selectedAnnexCount})`}
            </button>
          )}
```

- [ ] **Step 7: Mostrar el badge bajo cada imagen (los dos casos)**

Caso 1 imagen (bloque junto al label, línea ~604–623): después del `</button>` del toggle, dentro del mismo IIFE `return (...)`, envolver en un fragmento para añadir el badge. Reemplazar el `return (<button ...>...</button>);` por:

```tsx
                      return (
                        <span className="inline-flex flex-col items-start">
                          <button
                            type="button"
                            title={ANNEX_HELP}
                            onClick={() => toggleAnnex(url)}
                            disabled={annexBusy === url}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded border transition-colors disabled:opacity-50 ${
                              selected
                                ? 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700'
                                : 'bg-white text-gray-700 border-gray-300 hover:border-emerald-500'
                            }`}
                          >
                            {selected ? '✓ Original incluido' : 'Incluir como original'}
                            <Info className="w-3.5 h-3.5 opacity-60" />
                          </button>
                          {renderAnnexStatus(url)}
                        </span>
                      );
```

Caso múltiples imágenes (bloque línea ~656–674): después del `</button>` del toggle por imagen y antes del cierre `);` del IIFE, añadir el badge envolviendo en fragmento. Reemplazar el `return (<button ...>...</button>);` por:

```tsx
                            return (
                              <>
                                <button
                                  type="button"
                                  title={ANNEX_HELP}
                                  onClick={() => toggleAnnex(url)}
                                  disabled={annexBusy === url}
                                  className={`mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded border transition-colors disabled:opacity-50 ${
                                    selected
                                      ? 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700'
                                      : 'bg-white text-gray-700 border-gray-300 hover:border-emerald-500'
                                  }`}
                                >
                                  {selected ? '✓ Original incluido' : 'Incluir como original'}
                                  <Info className="w-3.5 h-3.5 opacity-60" />
                                </button>
                                <div>{renderAnnexStatus(url)}</div>
                              </>
                            );
```

- [ ] **Step 8: Type check**

Run: `npx tsc --noEmit`
Expected: sin errores.

- [ ] **Step 9: Verificación visual (screenshot de Ricardo)**

Reason: el proyecto verifica UI con screenshot, no headless. Con `npm run dev`, Task 2 desplegada y el webhook creado:
1. Abrir `/admin/books` → un libro → "Start Book Review".
2. Marcar 1–2 imágenes como original (`P` → "Incluir como original").
3. En el header aparece "Upscale originals (N)". Click.
4. El botón pasa a "Procesando originals…" y bajo cada imagen aparece "Procesando…" (spinner).
5. En ~10–60s cada imagen pasa a "Listo para imprimir" (verde); el botón se rehabilita.
6. Cerrar y reabrir el overlay → el status persiste (viene del GET).
7. Forzar un error (marcar algo no procesable) → "Error al procesar" (rojo). Re-click del botón reintenta solo las `error`.
8. Pedir screenshot a Ricardo para confirmar.

- [ ] **Step 10: Commit**

```bash
git add "app/(admin)/admin/books/components/BookReviewOverlay.tsx"
git commit -m "feat(annex): status por imagen + boton Upscale originals + polling (M2)"
```

---

## Definition of Done (M2)

- El admin marca originals (M1), presiona "Upscale originals" y cada imagen se normaliza (sharp → PNG) y se escala (Real-ESRGAN 4x) con status en vivo (`pending`→`processing`→`ready`/`error`).
- `recipe_annex_images` queda con `original_url` (PNG normalizado), `print_url` (escalado) y `image_dimensions` poblados para las filas listas.
- Re-correr el botón solo reintenta filas `null`/`error`; las `ready` no se re-procesan.
- El Edge Function `upscale-annex-image` está desplegado (`verify_jwt=false`) y el webhook `upscale-annex-on-pending` existe.
- `npx tsc --noEmit` limpio y `npx jest lib/annex/upscale.test.ts` verde.
- Cero cambios al flujo de recetas ni a sus columnas. Nada de pipeline/JSON (M3) ni InDesign (M4).

---

## Limitaciones conocidas / notas para M3 (no implementar aún)

- **Orphan files:** desmarcar un original (DELETE en M1) no borra su `_src.png`/`.png` de Storage. Aceptado en v1 (no rompe nada; limpieza futura).
- **Una imagen muy grande:** se capa a 2048px antes de Replicate (`MAX_NORMALIZED_EDGE`) para acotar la salida del 4x.
- **M3** leerá `print_url` (fallback `original_url`) de las filas `ready` y bajará a `image_assets/{groupId}/annex/{recipeId}_{position}.png`, agregando `annex_images` por receta al JSON (ver spec §5). Las columnas y paths ya quedan listos desde M2 (`annexPrintStoragePath`).
