# Originals Annex — Descargar originals escalados — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Un botón "Descargar originals" en el detalle del libro que arma un zip con solo las originals ya escaladas (`upscale_status='ready'`), con nombres legibles `{Receta}_{Invitado}.png`.

**Architecture:** Una ruta `GET /annex/download` espeja el patrón de zip del `/package` (archiver + descarga en lotes a memoria) pero filtra a filas `ready` y nombra los archivos con un helper puro. Un botón en `BookDetailSheet`, visible cuando hay ≥1 escalada, baja el blob.

**Tech Stack:** Next.js 14 App Router (route handler Node), TypeScript strict, Supabase (service-role admin client), `archiver` (ya es dep), Jest (lógica pura), Tailwind, lucide-react.

## Global Constraints

- **Reutilizar:** patrón de zip del `GET /api/v1/admin/books/[groupId]/package/route.ts` (archiver, PassThrough, descarga en lotes BATCH_SIZE=10 con `Promise.allSettled`).
- **Solo `ready`:** filas con `upscale_status='ready'` y `print_url not null`. Nada más entra al zip.
- **Cero cambios en DB. Sin dependencias nuevas. No `any`. Archivos < 300 líneas. Sin console.log en producción.**
- **Copy (admin interno, español):** botón `Descargar originals` / `Generando…`; error `No hay originals procesados para descargar`; zip `SmallPlates_Originals_{pareja}.zip`.

Spec de referencia: `docs/superpowers/specs/2026-06-25-originals-annex-download-design.md`.

---

## File Structure

- **Modify** `lib/annex/selection.ts` — `annexDownloadFilename` (puro).
- **Modify** `lib/annex/selection.test.ts` — tests del helper.
- **Create** `app/api/v1/admin/books/[groupId]/annex/download/route.ts` — ruta del zip.
- **Modify** `app/(admin)/admin/books/components/BookDetailSheet.tsx` — botón + handler de descarga.

---

## Task 1: Helper `annexDownloadFilename` (TDD)

**Files:**
- Modify: `lib/annex/selection.ts`
- Test: `lib/annex/selection.test.ts`

**Interfaces:**
- Produces: `annexDownloadFilename(recipeName: string, guestName: string, dupIndex: number): string`
  - Sanitiza ambos (alfanuméricos + acentos; lo demás → `-`), une con `_`, termina en `.png`. `dupIndex>0` agrega `_${dupIndex+1}`. Vacíos → `Original` / `Invitado`.

- [ ] **Step 1: Escribir los tests que fallan**

En `lib/annex/selection.test.ts`, añadir `annexDownloadFilename` al import de `'./selection'` y agregar al final del archivo:

```ts
describe('annexDownloadFilename', () => {
  it('une receta e invitado, termina en .png', () => {
    expect(annexDownloadFilename('Red Cake', 'Maria Garcia', 0)).toBe('Red-Cake_Maria-Garcia.png');
  });
  it('agrega sufijo para duplicados de la misma receta', () => {
    expect(annexDownloadFilename('Red Cake', 'Maria Garcia', 1)).toBe('Red-Cake_Maria-Garcia_2.png');
    expect(annexDownloadFilename('Red Cake', 'Maria Garcia', 2)).toBe('Red-Cake_Maria-Garcia_3.png');
  });
  it('sanitiza caracteres raros y conserva acentos', () => {
    expect(annexDownloadFilename('Pollo / Arroz!', 'José Pérez', 0)).toBe('Pollo-Arroz_José-Pérez.png');
  });
  it('usa fallbacks cuando viene vacío', () => {
    expect(annexDownloadFilename('', '', 0)).toBe('Original_Invitado.png');
  });
});
```

- [ ] **Step 2: Correr los tests para verificar que fallan**

Run: `npx jest lib/annex/selection.test.ts`
Expected: FAIL — `annexDownloadFilename` no exportada.

- [ ] **Step 3: Implementar el helper**

En `lib/annex/selection.ts`, añadir al final:

```ts
// Reason: filenames inside the originals zip must be human-legible and filesystem-safe.
// Keep letters/digits/accented chars; collapse everything else to a single dash.
function sanitizeAnnexNamePart(value: string, fallback: string): string {
  const cleaned = value
    .trim()
    .replace(/[^a-zA-Z0-9áéíóúñÁÉÍÓÚÑ]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return cleaned || fallback;
}

/** Human-legible zip filename for an upscaled original: `{Recipe}_{Guest}.png`. */
export function annexDownloadFilename(recipeName: string, guestName: string, dupIndex: number): string {
  const recipe = sanitizeAnnexNamePart(recipeName, 'Original');
  const guest = sanitizeAnnexNamePart(guestName, 'Invitado');
  const suffix = dupIndex > 0 ? `_${dupIndex + 1}` : '';
  return `${recipe}_${guest}${suffix}.png`;
}
```

- [ ] **Step 4: Correr los tests para verificar que pasan**

Run: `npx jest lib/annex/selection.test.ts`
Expected: PASS.

- [ ] **Step 5: Type check**

Run: `npx tsc --noEmit`
Expected: sin errores.

- [ ] **Step 6: Commit**

```bash
git add lib/annex/selection.ts lib/annex/selection.test.ts
git commit -m "feat(annex): helper annexDownloadFilename + tests"
```

---

## Task 2: Ruta `GET /annex/download`

**Files:**
- Create: `app/api/v1/admin/books/[groupId]/annex/download/route.ts`

**Interfaces:**
- Consumes: `annexDownloadFilename` (Task 1); `requireAdminAuth`, `createSupabaseAdminClient`; `archiver`.
- Produces: `GET` → `application/zip` con las originals `ready`, o `400 { error }` si no hay.

- [ ] **Step 1: Crear la ruta**

Create `app/api/v1/admin/books/[groupId]/annex/download/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth/admin';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import archiver from 'archiver';
import { PassThrough } from 'stream';
import { annexDownloadFilename } from '@/lib/annex/selection';

export const maxDuration = 300;

// GET — zip of the book's upscaled originals (upscale_status='ready'), named {Recipe}_{Guest}.png.
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    await requireAdminAuth();
    const { groupId } = await params;
    const supabase = createSupabaseAdminClient();

    const { data: rows, error: rowsError } = await supabase
      .from('recipe_annex_images')
      .select('recipe_id, position, print_url')
      .eq('group_id', groupId)
      .eq('upscale_status', 'ready')
      .not('print_url', 'is', null)
      .order('recipe_id')
      .order('position');

    if (rowsError) return NextResponse.json({ error: rowsError.message }, { status: 500 });
    if (!rows || rows.length === 0) {
      return NextResponse.json(
        { error: 'No hay originals procesados para descargar' },
        { status: 400 }
      );
    }

    // Resolve recipe + guest names for legible filenames.
    const recipeIds = [...new Set(rows.map((r) => r.recipe_id as string))];
    const { data: recipeData } = await supabase
      .from('guest_recipes')
      .select('id, recipe_name, guests(first_name,last_name,printed_name), recipe_print_ready(recipe_name_clean)')
      .in('id', recipeIds);

    const nameMap = new Map<string, { name: string; guest: string }>();
    for (const r of recipeData ?? []) {
      const pr = Array.isArray(r.recipe_print_ready)
        ? r.recipe_print_ready[0] || null
        : r.recipe_print_ready || null;
      const guest = r.guests as unknown as {
        first_name: string | null;
        last_name: string | null;
        printed_name: string | null;
      } | null;
      const guestName =
        guest?.printed_name ||
        `${guest?.first_name || ''} ${guest?.last_name || ''}`.trim() ||
        'Invitado';
      const name =
        (pr as { recipe_name_clean?: string } | null)?.recipe_name_clean ||
        (r.recipe_name as string) ||
        'Original';
      nameMap.set(r.id as string, { name, guest: guestName });
    }

    // Couple name for the zip filename.
    const { data: group } = await supabase
      .from('groups')
      .select('couple_display_name, print_couple_name, couple_first_name, partner_first_name')
      .eq('id', groupId)
      .single();
    const coupleName =
      group?.print_couple_name ||
      group?.couple_display_name ||
      `${group?.couple_first_name || ''} & ${group?.partner_first_name || ''}`.trim() ||
      'Originals';

    // Build the download list with a per-recipe duplicate index.
    const perRecipeCount = new Map<string, number>();
    const downloads: { url: string; filename: string }[] = [];
    for (const row of rows) {
      const recipeId = row.recipe_id as string;
      const dupIndex = perRecipeCount.get(recipeId) ?? 0;
      perRecipeCount.set(recipeId, dupIndex + 1);
      const info = nameMap.get(recipeId) ?? { name: 'Original', guest: 'Invitado' };
      downloads.push({
        url: row.print_url as string,
        filename: annexDownloadFilename(info.name, info.guest, dupIndex),
      });
    }

    // Download images to memory in batches (same pattern as /package).
    const BATCH_SIZE = 10;
    const files: { filename: string; buffer: Buffer }[] = [];
    for (let i = 0; i < downloads.length; i += BATCH_SIZE) {
      const batch = downloads.slice(i, i + BATCH_SIZE);
      const results = await Promise.allSettled(
        batch.map(async (d) => {
          const res = await fetch(d.url, { signal: AbortSignal.timeout(30_000) });
          if (!res.ok) return null;
          return { filename: d.filename, buffer: Buffer.from(await res.arrayBuffer()) };
        })
      );
      for (const result of results) {
        if (result.status === 'fulfilled' && result.value) files.push(result.value);
      }
    }

    if (files.length === 0) {
      return NextResponse.json(
        { error: 'No se pudo descargar ninguna imagen' },
        { status: 502 }
      );
    }

    // Build the ZIP in one shot — all buffers are in memory.
    const passthrough = new PassThrough();
    const archive = archiver('zip', { zlib: { level: 5 } });
    const collectPromise = new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = [];
      passthrough.on('data', (chunk: Buffer) => chunks.push(chunk));
      passthrough.on('end', () => resolve(Buffer.concat(chunks)));
      passthrough.on('error', reject);
      archive.on('error', reject);
    });

    archive.pipe(passthrough);
    for (const f of files) {
      archive.append(f.buffer, { name: f.filename });
    }
    archive.finalize();

    const zipBuffer = await collectPromise;

    const safeName = coupleName
      .replace(/[^a-zA-Z0-9áéíóúñÁÉÍÓÚÑ&\s]/g, '')
      .replace(/\s+/g, '_');

    return new NextResponse(new Uint8Array(zipBuffer), {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="SmallPlates_Originals_${safeName}.zip"`,
        'Content-Length': String(zipBuffer.length),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2: Type check**

Run: `npx tsc --noEmit`
Expected: sin errores.

- [ ] **Step 3: Verificación manual (con la app corriendo)**

Reason: rutas Supabase se verifican a mano. Con sesión admin y un libro con ≥1 original `ready`:
1. En el navegador, ir a `/api/v1/admin/books/${GROUP_ID}/annex/download` (misma sesión) → descarga un zip.
2. Abrir el zip → contiene los PNG escalados, nombrados `{Receta}_{Invitado}.png`.
3. En un libro sin originals `ready` → la ruta responde `400` con `No hay originals procesados para descargar`.

- [ ] **Step 4: Commit**

```bash
git add "app/api/v1/admin/books/[groupId]/annex/download/route.ts"
git commit -m "feat(annex): ruta GET /annex/download (zip de originals escalados)"
```

---

## Task 3: Botón "Descargar originals" en `BookDetailSheet`

**Files:**
- Modify: `app/(admin)/admin/books/components/BookDetailSheet.tsx`

**Interfaces:**
- Consumes: la ruta de Task 2; `annexCounts` (ya existe), `Download`/`Loader2` de lucide.

- [ ] **Step 1: Re-añadir el ícono `Download` al import de lucide**

En `app/(admin)/admin/books/components/BookDetailSheet.tsx`, la línea de import de lucide-react actualmente es:

```ts
import { Pencil, Check, X, Loader2, ChevronDown, ChevronRight, Upload } from 'lucide-react';
```

Cambiarla a:

```ts
import { Pencil, Check, X, Loader2, ChevronDown, ChevronRight, Upload, Download } from 'lucide-react';
```

- [ ] **Step 2: Añadir estado de descarga**

Junto a los otros estados del anexo (después de `const [showFetchWarn, setShowFetchWarn] = useState(false);`), añadir:

```ts
  const [downloadingOriginals, setDownloadingOriginals] = useState(false);
```

- [ ] **Step 3: Añadir el handler de descarga**

Junto a `triggerUpscale` (después de su definición), añadir:

```ts
  const downloadOriginals = useCallback(async () => {
    if (!book) return;
    setDownloadingOriginals(true);
    try {
      const res = await fetch(`/api/v1/admin/books/${book.id}/annex/download`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Download failed');
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download =
        res.headers.get('Content-Disposition')?.split('filename=')[1]?.replace(/"/g, '') ||
        'originals.zip';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Download failed');
    } finally {
      setDownloadingOriginals(false);
    }
  }, [book]);
```

- [ ] **Step 4: Añadir el botón junto a "Upscale originals"**

Justo después del bloque `{annexCounts.selected > 0 && (<Button ...Upscale originals...</Button>)}`, añadir:

```tsx
                    {annexCounts.ready > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={downloadingOriginals}
                        onClick={downloadOriginals}
                      >
                        {downloadingOriginals ? (
                          <Loader2 className="w-3 h-3 animate-spin mr-1" />
                        ) : (
                          <Download className="w-3 h-3 mr-1" />
                        )}
                        {downloadingOriginals ? 'Generando…' : 'Descargar originals'}
                      </Button>
                    )}
```

- [ ] **Step 5: Type check**

Run: `npx tsc --noEmit`
Expected: sin errores.

- [ ] **Step 6: Verificación visual (screenshot de Ricardo)**

Con `npm run dev`:
1. Libro con ≥1 original `ready` → aparece "Descargar originals" junto a "Upscale originals".
2. Click → `Generando…` → baja el zip; las imágenes adentro se llaman `{Receta}_{Invitado}.png` y son las grandes.
3. Libro sin escaladas → el botón no aparece.
4. Pedir screenshot a Ricardo.

- [ ] **Step 7: Commit**

```bash
git add "app/(admin)/admin/books/components/BookDetailSheet.tsx"
git commit -m "feat(annex): boton 'Descargar originals' en el detalle del libro"
```

---

## Definition of Done

- Con ≥1 original `ready`, el detalle del libro muestra "Descargar originals"; al darle, baja un zip con solo las escaladas, nombradas `{Receta}_{Invitado}.png` (con `_2/_3` para duplicados).
- Sin escaladas → el botón no aparece y la ruta responde `400`.
- `npx tsc --noEmit` limpio y `npx jest lib/annex/selection.test.ts` verde.
- Cero cambios en DB; reutiliza `archiver` y el patrón del `/package`.

---

## Notas

- Colisión rara: dos recetas distintas con mismo nombre+invitado producirían el mismo filename; `archiver` los agrega ambos y la mayoría de descompresores renombra. Aceptado en v1.
- La descarga de una imagen que falle se omite del zip (no rompe el resto), igual que `/package`.
