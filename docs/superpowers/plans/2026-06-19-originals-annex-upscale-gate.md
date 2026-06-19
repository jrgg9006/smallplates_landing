# Originals Annex — Upscale a nivel libro + aviso — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mover el disparo de upscale al nivel del libro (`BookDetailSheet`, ocultando "Download Book Package") y avisar con un modal —sin bloquear— al dar "Copy Fetch Command" si hay originals marcados sin upscale.

**Architecture:** Un helper puro cuenta el estado de upscale de las filas del anexo. `BookDetailSheet` carga `GET /annex`, hace polling, muestra el botón "Upscale originals" con su estado, y al dar "Copy Fetch Command" abre un modal de advertencia cuando faltan originals. El overlay pierde su botón de upscale (queda a nivel libro) pero conserva los badges por foto.

**Tech Stack:** Next.js 14 App Router, TypeScript strict, React, Jest (lógica pura), Tailwind, lucide-react.

## Global Constraints

- **Reutilizar:** rutas `POST /annex/upscale` y `GET /annex` ya existen (M2); el polling copia el patrón del overlay (M2) / `/admin/operations`.
- **Aviso, no bloqueo:** "Copy Fetch Command" siempre se puede ejecutar; si faltan originals, modal con `Cancelar` / `Avanzar de todos modos`.
- **No tocar "Move to Printed".**
- **Cero regresión:** sin originals marcados → ni botón ni modal; "Copy Fetch Command" igual que hoy.
- **Sin dependencias nuevas. No `any`. Archivos < 300 líneas. Sin console.log en producción.**
- **Copy (admin interno, español):** botón `Upscale originals ({n})` / `Procesando… ({x}/{y})` / `✓ Originals listos`; modal título `Originals sin procesar`, botones `Cancelar` · `Avanzar de todos modos`.

Spec de referencia: `docs/superpowers/specs/2026-06-19-originals-annex-upscale-gate-design.md`.

---

## File Structure

- **Modify** `lib/annex/selection.ts` — `annexUpscaleCounts` (puro).
- **Modify** `lib/annex/selection.test.ts` — tests del helper.
- **Modify** `app/(admin)/admin/books/components/BookDetailSheet.tsx` — fetch/poll de anexo, botón "Upscale originals" (quita "Download Book Package"), modal de aviso en "Copy Fetch Command".
- **Modify** `app/(admin)/admin/books/components/BookReviewOverlay.tsx` — quitar el botón de upscale del header y el estado/efectos que solo le servían.

---

## Task 1: Helper `annexUpscaleCounts` (TDD)

**Files:**
- Modify: `lib/annex/selection.ts`
- Test: `lib/annex/selection.test.ts`

**Interfaces:**
- Produces:
  - `interface AnnexUpscaleCounts { selected: number; ready: number; notReady: number; processing: number }`
  - `annexUpscaleCounts(rows: { upscale_status: string | null }[]): AnnexUpscaleCounts`
- `notReady` = filas con status distinto de `'ready'`; `processing` = `'pending'`|`'processing'`.

- [ ] **Step 1: Escribir los tests que fallan**

En `lib/annex/selection.test.ts`, añadir al final del archivo:

```ts
import { annexUpscaleCounts } from './selection';

describe('annexUpscaleCounts', () => {
  it('cuenta vacío', () => {
    expect(annexUpscaleCounts([])).toEqual({ selected: 0, ready: 0, notReady: 0, processing: 0 });
  });
  it('clasifica por estado', () => {
    expect(
      annexUpscaleCounts([
        { upscale_status: 'ready' },
        { upscale_status: 'ready' },
        { upscale_status: 'pending' },
        { upscale_status: 'processing' },
        { upscale_status: 'error' },
        { upscale_status: null },
      ])
    ).toEqual({ selected: 6, ready: 2, notReady: 4, processing: 2 });
  });
  it('todo listo', () => {
    expect(annexUpscaleCounts([{ upscale_status: 'ready' }])).toEqual({
      selected: 1,
      ready: 1,
      notReady: 0,
      processing: 0,
    });
  });
});
```

- [ ] **Step 2: Correr los tests para verificar que fallan**

Run: `npx jest lib/annex/selection.test.ts`
Expected: FAIL — `annexUpscaleCounts` no exportada.

- [ ] **Step 3: Implementar el helper**

En `lib/annex/selection.ts`, añadir al final:

```ts
export interface AnnexUpscaleCounts {
  selected: number;
  ready: number;
  notReady: number;
  processing: number;
}

/** Counts of a book's selected originals by upscale lifecycle. Drives the
 *  book-level "Upscale originals" button and the pre-export warning. */
export function annexUpscaleCounts(
  rows: { upscale_status: string | null }[]
): AnnexUpscaleCounts {
  let ready = 0;
  let processing = 0;
  for (const r of rows) {
    if (r.upscale_status === 'ready') ready += 1;
    else if (r.upscale_status === 'pending' || r.upscale_status === 'processing') processing += 1;
  }
  return { selected: rows.length, ready, notReady: rows.length - ready, processing };
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
git commit -m "feat(annex): helper annexUpscaleCounts + tests"
```

---

## Task 2: Botón "Upscale originals" a nivel libro + polling

**Files:**
- Modify: `app/(admin)/admin/books/components/BookDetailSheet.tsx`

**Interfaces:**
- Consumes: `annexUpscaleCounts` (Task 1); `GET /api/v1/admin/books/[groupId]/annex`; `POST /api/v1/admin/books/[groupId]/annex/upscale`.
- Produces: `annexCounts` (objeto) y `copyFetchCommand()` usados por Task 3.

- [ ] **Step 1: Importar el helper**

En `app/(admin)/admin/books/components/BookDetailSheet.tsx`, junto al import existente `import { annexRowState } from '@/lib/annex/selection';`, ampliar a:

```ts
import { annexRowState, annexUpscaleCounts } from '@/lib/annex/selection';
```

- [ ] **Step 2: Añadir estado**

Después de `const [downloadingPackage, setDownloadingPackage] = useState(false);` (línea ~183), añadir:

```ts
  // Reason: book-level upscale of selected originals — rows come from GET /annex (carries
  // upscale_status), polled while any is in flight. Drives the button + the pre-export warning.
  const [annexRows, setAnnexRows] = useState<{ upscale_status: string | null }[]>([]);
  const [annexUpscaling, setAnnexUpscaling] = useState(false);
  const [annexPolling, setAnnexPolling] = useState(false);
  const [showFetchWarn, setShowFetchWarn] = useState(false);
```

- [ ] **Step 3: Cargar las filas de anexo y derivar conteos**

Después de `const prevStatus = PREV_STATUS[currentStatus];` (línea ~337), añadir:

```ts
  const annexCounts = annexUpscaleCounts(annexRows);

  const loadAnnexRows = useCallback(async (groupId: string) => {
    try {
      const res = await fetch(`/api/v1/admin/books/${groupId}/annex`);
      if (!res.ok) return;
      const { annex_images } = (await res.json()) as {
        annex_images: { upscale_status: string | null }[];
      };
      setAnnexRows((annex_images ?? []).map((r) => ({ upscale_status: r.upscale_status ?? null })));
    } catch {
      // Swallow transient errors; polling/next load will retry.
    }
  }, []);
```

- [ ] **Step 4: Cargar al abrir el detalle y al cerrar el overlay de review**

Después del `useEffect` que llama `fetchDetail(book.id)` (el bloque que termina en `}, [open, book, fetchDetail]);`, línea ~218), añadir:

```ts
  useEffect(() => {
    // Reason: refresh annex upscale status when the sheet opens and whenever the review
    // overlay closes (the admin may have marked new originals in there).
    if (open && book && !reviewOverlayOpen) {
      loadAnnexRows(book.id);
    }
  }, [open, book, reviewOverlayOpen, loadAnnexRows]);
```

- [ ] **Step 5: Disparar el upscale + polling**

Después del `useEffect` del Step 4, añadir:

```ts
  const triggerUpscale = useCallback(async () => {
    if (!book) return;
    setAnnexUpscaling(true);
    try {
      const res = await fetch(`/api/v1/admin/books/${book.id}/annex/upscale`, { method: 'POST' });
      if (!res.ok) {
        alert('No se pudo iniciar el upscale');
        setAnnexUpscaling(false);
        return;
      }
      await loadAnnexRows(book.id);
      setAnnexPolling(true);
    } catch {
      alert('No se pudo iniciar el upscale');
      setAnnexUpscaling(false);
    }
  }, [book, loadAnnexRows]);

  useEffect(() => {
    if (!annexPolling || !book) return;
    const startedAt = Date.now();
    const TIMEOUT_MS = 90_000;
    const intervalId = setInterval(async () => {
      if (Date.now() - startedAt >= TIMEOUT_MS) {
        setAnnexPolling(false);
        setAnnexUpscaling(false);
        clearInterval(intervalId);
        return;
      }
      await loadAnnexRows(book.id);
    }, 2_000);
    return () => clearInterval(intervalId);
  }, [annexPolling, book, loadAnnexRows]);

  useEffect(() => {
    if (!annexPolling) return;
    if (annexCounts.processing === 0) {
      setAnnexPolling(false);
      setAnnexUpscaling(false);
    }
  }, [annexCounts.processing, annexPolling]);
```

- [ ] **Step 6: Quitar "Download Book Package" y poner "Upscale originals"**

Reemplazar **todo** el bloque del botón Download (el `{currentStatus === 'ready_to_print' && (<Button ... >{downloadingPackage ? 'Generating...' : 'Download Book Package'}</Button>)}`, líneas ~784-819) por:

```tsx
                    {annexCounts.selected > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        className={
                          annexCounts.notReady === 0
                            ? 'border-emerald-500 text-emerald-600'
                            : 'border-brand-honey text-brand-honey hover:bg-brand-honey/10'
                        }
                        disabled={annexUpscaling || annexCounts.processing > 0 || annexCounts.notReady === 0}
                        onClick={triggerUpscale}
                      >
                        {(annexUpscaling || annexCounts.processing > 0) ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin mr-1" />
                            Procesando… ({annexCounts.ready}/{annexCounts.selected})
                          </>
                        ) : annexCounts.notReady === 0 ? (
                          '✓ Originals listos'
                        ) : (
                          `Upscale originals (${annexCounts.notReady})`
                        )}
                      </Button>
                    )}
```

- [ ] **Step 7: Type check**

Run: `npx tsc --noEmit`
Expected: sin errores. (`Download` de lucide queda sin usar — si tsc/eslint marca el import como no usado, quitar `Download` de la línea de import de lucide-react.)

- [ ] **Step 8: Verificación manual + visual**

Reason: rutas Supabase se verifican a mano; UI por screenshot. Con `npm run dev` y la columna/edge de M2 ya en su lugar:
1. Marcar 1–2 originals en un libro (overlay) y cerrar.
2. En la barra del detalle aparece `Upscale originals (N)`. Click → `Procesando… (X/Y)` → `✓ Originals listos`.
3. Recargar el detalle → sigue `✓ Originals listos` (viene del GET).
4. Pedir screenshot a Ricardo.

- [ ] **Step 9: Commit**

```bash
git add "app/(admin)/admin/books/components/BookDetailSheet.tsx"
git commit -m "feat(annex): boton 'Upscale originals' a nivel libro (quita Download Book Package)"
```

---

## Task 3: Modal de aviso en "Copy Fetch Command"

**Files:**
- Modify: `app/(admin)/admin/books/components/BookDetailSheet.tsx`

**Interfaces:**
- Consumes: `annexCounts`, `showFetchWarn`/`setShowFetchWarn` (Task 2).

- [ ] **Step 1: Extraer el copiado del comando a un helper**

En `app/(admin)/admin/books/components/BookDetailSheet.tsx`, junto a las otras funciones derivadas (p.ej. después de `triggerUpscale`), añadir:

```ts
  const copyFetchCommand = useCallback(() => {
    if (!detail) return;
    const cmd = `node scripts/indesign/fetch-book.js ${detail.group.id}`;
    navigator.clipboard.writeText(cmd);
    alert('Copied to clipboard:\n' + cmd);
  }, [detail]);
```

- [ ] **Step 2: El botón "Copy Fetch Command" avisa si faltan originals**

Reemplazar el `onClick` del botón "Copy Fetch Command" (el bloque `{currentStatus === 'ready_to_print' && (<Button ...>Copy Fetch Command</Button>)}`, líneas ~820-833). Cambiar su `onClick` actual:

```tsx
                        onClick={() => {
                          const cmd = `node scripts/indesign/fetch-book.js ${detail.group.id}`;
                          navigator.clipboard.writeText(cmd);
                          alert('Copied to clipboard:\n' + cmd);
                        }}
```

por:

```tsx
                        onClick={() => {
                          // Reason: don't hard-block — warn if there are selected originals not yet
                          // upscaled, then let the admin proceed anyway.
                          if (annexCounts.notReady > 0) {
                            setShowFetchWarn(true);
                          } else {
                            copyFetchCommand();
                          }
                        }}
```

- [ ] **Step 3: Renderizar el modal**

Antes del cierre del componente raíz (junto a donde se monta `<BookReviewOverlay ... />`, dentro del JSX de retorno), añadir:

```tsx
      {showFetchWarn && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900">Originals sin procesar</h3>
            <p className="mt-3 text-sm text-gray-600">
              Hay {annexCounts.notReady} foto(s) marcada(s) como original que todavía no pasaron por
              upscale (alta resolución). Si generas el libro ahora, esas imágenes saldrán en baja
              calidad o no se incluirán. Te recomiendo correr &quot;Upscale originals&quot; antes.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="outline" size="sm" onClick={() => setShowFetchWarn(false)}>
                Cancelar
              </Button>
              <Button
                size="sm"
                className="bg-brand-honey text-white hover:bg-brand-honey/90"
                onClick={() => {
                  copyFetchCommand();
                  setShowFetchWarn(false);
                }}
              >
                Avanzar de todos modos
              </Button>
            </div>
          </div>
        </div>
      )}
```

- [ ] **Step 4: Type check**

Run: `npx tsc --noEmit`
Expected: sin errores.

- [ ] **Step 5: Verificación visual**

Con la app corriendo, libro en `ready_to_print`:
1. Con un original sin procesar, dar "Copy Fetch Command" → aparece el modal `Originals sin procesar`.
2. `Cancelar` cierra sin copiar; `Avanzar de todos modos` copia el comando y cierra.
3. Con todos los originals `ready`, "Copy Fetch Command" copia directo (sin modal).
4. Pedir screenshot a Ricardo.

- [ ] **Step 6: Commit**

```bash
git add "app/(admin)/admin/books/components/BookDetailSheet.tsx"
git commit -m "feat(annex): aviso (modal) en Copy Fetch Command si faltan originals"
```

---

## Task 4: Quitar el botón de upscale del overlay

**Files:**
- Modify: `app/(admin)/admin/books/components/BookReviewOverlay.tsx`

**Interfaces:**
- Conserva: `annexStatusByUrl`, `loadAnnexStatus`, `renderAnnexStatus` (badges por foto siguen).
- Elimina: el botón del header + `triggerUpscale`, `annexUpscaling`, `annexPolling`, `selectedAnnexCount`, y los dos `useEffect` de polling.

- [ ] **Step 1: Quitar el botón del header**

En `app/(admin)/admin/books/components/BookReviewOverlay.tsx`, eliminar el bloque del header:

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

- [ ] **Step 2: Quitar el estado y las funciones ya no usadas**

Eliminar estas declaraciones (de M2):

```ts
  const [annexUpscaling, setAnnexUpscaling] = useState(false);
  const [annexPolling, setAnnexPolling] = useState(false);
```

Eliminar `selectedAnnexCount` (el `useMemo`), `triggerUpscale` (el `useCallback`), y los dos `useEffect` de polling (el de `setInterval` con `annexPolling` y el que checa `anyInFlight` sobre `annexStatusByUrl`). **Conservar** `annexStatusByUrl`, `setAnnexStatusByUrl`, `loadAnnexStatus`, su `useEffect` de carga al montar, y `renderAnnexStatus`.

- [ ] **Step 3: Type check**

Run: `npx tsc --noEmit`
Expected: sin errores. Si `Loader2` queda sin uso en este archivo, mantenerlo solo si `renderAnnexStatus` lo usa (sí lo usa en el badge "Procesando…"); no quitarlo.

- [ ] **Step 4: Verificación visual**

Con la app corriendo: en el overlay ya NO está el botón "Upscale originals" del header; los badges por foto ("Listo para imprimir"/"Procesando"/"Error") siguen apareciendo. Pedir screenshot.

- [ ] **Step 5: Commit**

```bash
git add "app/(admin)/admin/books/components/BookReviewOverlay.tsx"
git commit -m "feat(annex): quitar boton de upscale del overlay (vive a nivel libro)"
```

---

## Definition of Done

- "Download Book Package" ya no aparece; en su lugar, "Upscale originals (N)" → "Procesando… (X/Y)" → "✓ Originals listos" a nivel libro.
- "Copy Fetch Command" abre el modal `Originals sin procesar` cuando faltan originals, con `Cancelar` / `Avanzar de todos modos`; copia directo si todo está `ready`.
- "Move to Printed" sin cambios. Libro sin originals → sin botón ni modal.
- El overlay ya no tiene el botón de upscale; conserva los badges por foto.
- `npx tsc --noEmit` limpio y `npx jest lib/annex/selection.test.ts` verde.

---

## Notas

- El polling a nivel libro corre solo mientras hay `pending`/`processing`; se detiene en estado terminal (máx 90s). Mismo patrón que M2.
- Re-correr "Upscale originals" solo procesa `null`/`error` (la ruta ya filtra), así que no hay doble costo.
