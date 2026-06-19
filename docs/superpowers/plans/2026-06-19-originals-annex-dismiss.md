# Originals Annex — Estado "revisada, sin original" — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permitir marcar una receta como "revisada, sin original" (4º estado, reversible) para que las fotos que el equipo decide NO incluir salgan del contador `⚠ sin revisar`.

**Architecture:** Un booleano `annex_reviewed` en `recipe_production_status` (tabla por receta que el GET del libro ya trae) guarda el descarte. Se escribe por un `PATCH` nuevo en la ruta `/annex` existente. El helper puro `annexRowState` gana un 4º estado `dismissed`; el overlay muestra el botón de descarte; la fila pinta un pill gris.

**Tech Stack:** Next.js 14 App Router, TypeScript strict, Supabase (service-role admin client), Jest (lógica pura), Tailwind.

## Global Constraints

- **Reutilizar antes de crear:** el flag vive en `recipe_production_status` (no tabla nueva); la escritura va por la ruta `/annex` existente (no endpoint nuevo de fondo).
- **Supabase manual:** el `ALTER TABLE` lo corre el usuario a mano (no `apply_migration` destructivo).
- **Cero regresión:** columna `default false` → comportamiento idéntico hasta que alguien descarte. No toca recetas, originals (M2) ni pipeline.
- **Precedencia:** `selected` (verde) gana sobre `dismissed`; `dismissed` solo aplica con 0 marcadas.
- **Sin dependencias nuevas. No `any`. Archivos < 300 líneas. Sin console.log en producción.**
- **Copy (admin interno, español):** botón `No incluir (revisada)` / `Deshacer`; pill/etiqueta `⊘ Revisada · sin original`.

Spec de referencia: `docs/superpowers/specs/2026-06-19-originals-annex-dismiss-design.md`.

---

## File Structure

- **Create** `supabase/migrations/20260619_annex_reviewed.sql` — columna nueva (SQL manual).
- **Modify** `lib/annex/selection.ts` — `annexRowState` gana 4º estado `dismissed` (param opcional).
- **Modify** `lib/annex/selection.test.ts` — tests del 4º estado.
- **Modify** `app/api/v1/admin/books/[groupId]/route.ts` — GET expone `annex_reviewed`.
- **Modify** `app/api/v1/admin/books/[groupId]/annex/route.ts` — `PATCH` que escribe `annex_reviewed`.
- **Modify** `app/(admin)/admin/books/components/BookReviewOverlay.tsx` — botón descartar/deshacer.
- **Modify** `app/(admin)/admin/books/components/RecipePreviewCard.tsx` — pill gris.
- **Modify** `app/(admin)/admin/books/components/BookDetailSheet.tsx` — pasar el flag al contador.

---

## Task 1: Columna `annex_reviewed` (SQL manual)

**Files:**
- Create: `supabase/migrations/20260619_annex_reviewed.sql`

- [ ] **Step 1: Crear el archivo de migración**

Create `supabase/migrations/20260619_annex_reviewed.sql`:

```sql
-- Originals annex: per-recipe "reviewed, not included" flag so dismissed photos
-- drop out of the "needs review" count.
alter table public.recipe_production_status
  add column if not exists annex_reviewed boolean not null default false;
```

- [ ] **Step 2: Correr el SQL manualmente en Supabase**

Reason: regla del proyecto — el DDL lo corre el usuario. Entregar el bloque de arriba para correr en el SQL editor del proyecto `Small_Plates` (`iinnpndsxepvviafrmwz`) y esperar confirmación antes de seguir (el GET de Task 3 selecciona esta columna; si no existe, la query falla).

Expected: `ALTER TABLE`. Verificable:

```sql
select column_name from information_schema.columns
where table_name = 'recipe_production_status' and column_name = 'annex_reviewed';
```

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260619_annex_reviewed.sql
git commit -m "feat(annex): columna annex_reviewed en recipe_production_status (descarte)"
```

---

## Task 2: Helper `annexRowState` gana el 4º estado (TDD)

**Files:**
- Modify: `lib/annex/selection.ts`
- Test: `lib/annex/selection.test.ts`

**Interfaces:**
- Produces:
  - `type AnnexRowState = 'none' | 'unreviewed' | 'selected' | 'dismissed'`
  - `annexRowState(documentUrls: string[] | null, imageUrl: string | null, annexSourceUrls: string[] | null, dismissed?: boolean): { state: AnnexRowState; selectedCount: number; eligibleCount: number }`
- Nota: `dismissed` es opcional (default `false`) → los callers actuales siguen compilando y comportándose igual hasta que se les pase el flag (Tasks 5/6).

- [ ] **Step 1: Escribir los tests que fallan**

En `lib/annex/selection.test.ts`, dentro del `describe('annexRowState', ...)` existente, añadir estos casos (antes del cierre `});` del describe):

```ts
  it("'dismissed' cuando hay foto, 0 marcadas y dismissed=true", () => {
    expect(annexRowState(['https://x/a.jpg'], null, [], true)).toEqual({
      state: 'dismissed',
      selectedCount: 0,
      eligibleCount: 1,
    });
  });
  it("'selected' gana sobre dismissed", () => {
    expect(
      annexRowState(['https://x/a.jpg'], null, ['https://x/a.jpg'], true).state
    ).toBe('selected');
  });
  it('dismissed=false (u omitido) se comporta como antes', () => {
    expect(annexRowState(['https://x/a.jpg'], null, []).state).toBe('unreviewed');
    expect(annexRowState(['https://x/a.jpg'], null, [], false).state).toBe('unreviewed');
  });
  it("'none' aunque dismissed=true si no hay foto elegible", () => {
    expect(annexRowState(['https://x/a.pdf'], null, [], true).state).toBe('none');
  });
```

- [ ] **Step 2: Correr los tests para verificar que fallan**

Run: `npx jest lib/annex/selection.test.ts`
Expected: FAIL — `annexRowState` no acepta el 4º argumento / no devuelve `'dismissed'`.

- [ ] **Step 3: Actualizar el helper**

En `lib/annex/selection.ts`, reemplazar el tipo `AnnexRowState` y la función `annexRowState` por:

```ts
export type AnnexRowState = 'none' | 'unreviewed' | 'selected' | 'dismissed';

/**
 * Tri/quad-state for the book-list marker.
 *   'none'       = no guest photo to review.
 *   'selected'   = at least one image marked as original (wins over dismissed).
 *   'dismissed'  = reviewed and explicitly not included (0 marked).
 *   'unreviewed' = has photo(s), 0 marked, not dismissed → still needs a look.
 */
export function annexRowState(
  documentUrls: string[] | null,
  imageUrl: string | null,
  annexSourceUrls: string[] | null,
  dismissed: boolean = false
): { state: AnnexRowState; selectedCount: number; eligibleCount: number } {
  const eligibleCount = eligibleAnnexImages(documentUrls, imageUrl).length;
  const selectedCount = (annexSourceUrls ?? []).length;
  if (eligibleCount === 0) return { state: 'none', selectedCount: 0, eligibleCount: 0 };
  if (selectedCount >= 1) return { state: 'selected', selectedCount, eligibleCount };
  if (dismissed) return { state: 'dismissed', selectedCount: 0, eligibleCount };
  return { state: 'unreviewed', selectedCount: 0, eligibleCount };
}
```

- [ ] **Step 4: Correr los tests para verificar que pasan**

Run: `npx jest lib/annex/selection.test.ts`
Expected: PASS (todas verdes).

- [ ] **Step 5: Type check**

Run: `npx tsc --noEmit`
Expected: sin errores (los callers actuales compilan: `dismissed` es opcional).

- [ ] **Step 6: Commit**

```bash
git add lib/annex/selection.ts lib/annex/selection.test.ts
git commit -m "feat(annex): annexRowState gana 4o estado 'dismissed' + tests"
```

---

## Task 3: Backend — GET expone el flag + `PATCH` que lo escribe

**Files:**
- Modify: `app/api/v1/admin/books/[groupId]/route.ts`
- Modify: `app/api/v1/admin/books/[groupId]/annex/route.ts`

**Interfaces:**
- Produces: cada receta del GET trae `annex_reviewed: boolean`; `PATCH /api/v1/admin/books/[groupId]/annex` con body `{ recipe_id: string; annex_reviewed: boolean }` → `{ success: true }`.

- [ ] **Step 1: GET selecciona la columna**

En `app/api/v1/admin/books/[groupId]/route.ts`, línea ~75, cambiar:

```ts
            recipe_production_status(needs_review)
```

por:

```ts
            recipe_production_status(needs_review, annex_reviewed)
```

- [ ] **Step 2: GET expone `annex_reviewed` en cada receta**

En el mismo archivo, en el objeto de `formattedRecipes`, justo después de `annex_source_urls: annexByRecipe.get(r.id) ?? [],` (línea ~210), añadir:

```ts
        annex_reviewed: (() => {
          const ps = Array.isArray(r.recipe_production_status)
            ? r.recipe_production_status[0] || null
            : r.recipe_production_status || null;
          return (ps as { annex_reviewed?: boolean } | null)?.annex_reviewed ?? false;
        })(),
```

- [ ] **Step 3: Añadir el `PATCH` a la ruta `/annex`**

En `app/api/v1/admin/books/[groupId]/annex/route.ts`, añadir al final del archivo (después del `DELETE`):

```ts
// PATCH — set/clear the recipe-level "reviewed, not included" flag.
// Body: { recipe_id, annex_reviewed }.
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    await requireAdminAuth();
    const { groupId } = await params;
    const supabase = createSupabaseAdminClient();
    const { recipe_id, annex_reviewed } = (await request.json()) as {
      recipe_id?: string;
      annex_reviewed?: boolean;
    };

    if (!recipe_id || typeof annex_reviewed !== 'boolean') {
      return NextResponse.json(
        { error: 'recipe_id and annex_reviewed (boolean) are required' },
        { status: 400 }
      );
    }

    // Validate the recipe is actually in this group (same pattern as POST).
    const { data: membership } = await supabase
      .from('group_recipes')
      .select('recipe_id')
      .eq('group_id', groupId)
      .eq('recipe_id', recipe_id)
      .is('removed_at', null)
      .maybeSingle();

    if (!membership) {
      return NextResponse.json({ error: 'Recipe not found in this group' }, { status: 404 });
    }

    const { error } = await supabase
      .from('recipe_production_status')
      .upsert(
        { recipe_id, annex_reviewed, updated_at: new Date().toISOString() },
        { onConflict: 'recipe_id' }
      );

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unauthorized' },
      { status: 401 }
    );
  }
}
```

- [ ] **Step 4: Type check**

Run: `npx tsc --noEmit`
Expected: sin errores.

- [ ] **Step 5: Verificación manual (con la app corriendo + Task 1 aplicada)**

Reason: rutas acopladas a Supabase se verifican a mano. Con sesión admin, en la consola del navegador:
```js
await fetch(`/api/v1/admin/books/${GROUP_ID}/annex`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ recipe_id: RECIPE_ID, annex_reviewed: true }) }).then(r => r.json())
```
Expected: `{ success: true }`. Luego `await fetch(`/api/v1/admin/books/${GROUP_ID}`).then(r=>r.json())` → esa receta trae `annex_reviewed: true`. Repetir con `false` → vuelve a `false`.

- [ ] **Step 6: Commit**

```bash
git add "app/api/v1/admin/books/[groupId]/route.ts" "app/api/v1/admin/books/[groupId]/annex/route.ts"
git commit -m "feat(annex): GET expone annex_reviewed + PATCH que lo escribe"
```

---

## Task 4: Botón descartar/deshacer en el overlay

**Files:**
- Modify: `app/(admin)/admin/books/components/BookReviewOverlay.tsx`

**Interfaces:**
- Consumes: `PATCH /annex` (Task 3); `eligibleAnnexImages` (M1 helper).

- [ ] **Step 1: Importar el helper de elegibilidad**

En `app/(admin)/admin/books/components/BookReviewOverlay.tsx`, en la línea de import de audit/recipe (cerca de `import { auditRecipe, ... } from '@/lib/recipe-audit';`), añadir un import nuevo debajo:

```ts
import { eligibleAnnexImages } from '@/lib/annex/selection';
```

- [ ] **Step 2: Extender `ReviewRecipe`**

En la interfaz `ReviewRecipe`, después de `annex_source_urls?: string[];`, añadir:

```ts
  annex_reviewed?: boolean;
```

- [ ] **Step 3: Añadir el handler `toggleAnnexReviewed`**

Junto a `toggleAnnex` (después de su definición `}, [recipe, groupId]);`), añadir:

```ts
  const toggleAnnexReviewed = useCallback(async (next: boolean) => {
    if (!recipe) return;
    setAnnexBusy('__reviewed__');
    setError(null);
    try {
      const res = await fetch(`/api/v1/admin/books/${groupId}/annex`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipe_id: recipe.id, annex_reviewed: next }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j.error || 'No se pudo actualizar el estado');
        return;
      }
      setLocalRecipes((prev) =>
        prev.map((r) => (r.id === recipe.id ? { ...r, annex_reviewed: next } : r))
      );
    } finally {
      setAnnexBusy(null);
    }
  }, [recipe, groupId]);
```

- [ ] **Step 4: Renderizar el control en el panel de foto**

En el panel de foto, dentro del `<div className="mb-4 flex items-center gap-3">` (el header con "Foto original del invitado"), después del bloque del toggle de imagen única (el IIFE que termina con `})()}` justo antes del `</div>` de ese header), añadir:

```tsx
                    {(() => {
                      const selectedCount = (recipe?.annex_source_urls ?? []).length;
                      const hasEligible =
                        eligibleAnnexImages(recipe?.document_urls ?? null, recipe?.image_url ?? null).length > 0;
                      // Reason: dismiss is only meaningful when there's a photo and nothing marked
                      // (a marked original already resolves the recipe to green).
                      if (!hasEligible || selectedCount > 0) return null;
                      const dismissed = recipe?.annex_reviewed === true;
                      return dismissed ? (
                        <span className="inline-flex items-center gap-2 text-xs text-gray-500">
                          ⊘ Revisada · sin original
                          <button
                            type="button"
                            onClick={() => toggleAnnexReviewed(false)}
                            disabled={annexBusy === '__reviewed__'}
                            className="px-2 py-1 rounded border border-gray-300 text-gray-600 hover:border-gray-500 disabled:opacity-50"
                          >
                            Deshacer
                          </button>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => toggleAnnexReviewed(true)}
                          disabled={annexBusy === '__reviewed__'}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded border border-gray-300 bg-white text-gray-700 hover:border-gray-500 transition-colors disabled:opacity-50"
                        >
                          No incluir (revisada)
                        </button>
                      );
                    })()}
```

- [ ] **Step 5: Type check**

Run: `npx tsc --noEmit`
Expected: sin errores.

- [ ] **Step 6: Verificación visual (screenshot de Ricardo)**

Con `npm run dev`, Task 1 aplicada:
1. Abrir un libro → review → una receta con foto y nada marcado.
2. Aparece el botón `No incluir (revisada)` en el panel de foto.
3. Click → cambia a `⊘ Revisada · sin original` + `Deshacer`.
4. `Deshacer` → vuelve al botón.
5. Marcar una foto como original → el control de descarte desaparece (la receta queda resuelta).
6. Pedir screenshot a Ricardo.

- [ ] **Step 7: Commit**

```bash
git add "app/(admin)/admin/books/components/BookReviewOverlay.tsx"
git commit -m "feat(annex): boton 'No incluir (revisada)' en el overlay de review"
```

---

## Task 5: Pill gris en la fila (`RecipePreviewCard`)

**Files:**
- Modify: `app/(admin)/admin/books/components/RecipePreviewCard.tsx`

**Interfaces:**
- Consumes: `annexRowState` (Task 2, ahora con 4º arg).

- [ ] **Step 1: Extender `RecipeData`**

En `app/(admin)/admin/books/components/RecipePreviewCard.tsx`, en la interfaz `RecipeData`, después de `annex_source_urls?: string[];`, añadir:

```ts
  annex_reviewed?: boolean;
```

- [ ] **Step 2: Pasar el flag al helper**

Reemplazar la línea:

```ts
  const annex = annexRowState(recipe.document_urls, recipe.image_url, recipe.annex_source_urls ?? null);
```

por:

```ts
  const annex = annexRowState(
    recipe.document_urls,
    recipe.image_url,
    recipe.annex_source_urls ?? null,
    recipe.annex_reviewed ?? false
  );
```

- [ ] **Step 3: Renderizar el pill gris**

Después del bloque `{annex.state === 'selected' && (...)}` (antes de `</button>`), añadir:

```tsx
        {annex.state === 'dismissed' && (
          <span className="text-[10px] px-1.5 py-0.5 rounded shrink-0 bg-gray-100 text-gray-500 whitespace-nowrap">
            ⊘ Revisada · sin original
          </span>
        )}
```

- [ ] **Step 4: Type check**

Run: `npx tsc --noEmit`
Expected: sin errores.

- [ ] **Step 5: Verificación visual (screenshot de Ricardo)**

Con la app corriendo: una receta descartada en el overlay (Task 4) muestra en la lista el pill gris `⊘ Revisada · sin original` (ya no ámbar). Pedir screenshot.

- [ ] **Step 6: Commit**

```bash
git add "app/(admin)/admin/books/components/RecipePreviewCard.tsx"
git commit -m "feat(annex): pill gris 'Revisada · sin original' en la lista"
```

---

## Task 6: Contador respeta el descarte (`BookDetailSheet`)

**Files:**
- Modify: `app/(admin)/admin/books/components/BookDetailSheet.tsx`

**Interfaces:**
- Consumes: `annexRowState` (Task 2).

- [ ] **Step 1: Extender `RecipeData`**

En `app/(admin)/admin/books/components/BookDetailSheet.tsx`, en la interfaz `RecipeData`, después de `annex_source_urls?: string[];`, añadir:

```ts
  annex_reviewed?: boolean;
```

- [ ] **Step 2: Pasar el flag al helper en el reduce**

En el cálculo de `annexSummary`, reemplazar:

```ts
      const { state } = annexRowState(r.document_urls, r.image_url, r.annex_source_urls ?? null);
```

por:

```ts
      const { state } = annexRowState(
        r.document_urls,
        r.image_url,
        r.annex_source_urls ?? null,
        r.annex_reviewed ?? false
      );
```

- [ ] **Step 3: Type check**

Run: `npx tsc --noEmit`
Expected: sin errores.

- [ ] **Step 4: Verificación visual (screenshot de Ricardo)**

Con la app corriendo: al descartar una receta en el overlay y refrescar la lista, el `⚠ Z sin revisar` del contador baja en 1 (la descartada ya no cuenta como sin revisar). Pedir screenshot.

- [ ] **Step 5: Commit**

```bash
git add "app/(admin)/admin/books/components/BookDetailSheet.tsx"
git commit -m "feat(annex): contador excluye recetas descartadas del 'sin revisar'"
```

---

## Definition of Done

- En el overlay, una receta con foto y 0 marcadas muestra `No incluir (revisada)`; al darle queda `⊘ Revisada · sin original` con `Deshacer`.
- La fila de esa receta muestra pill gris `⊘ Revisada · sin original` y sale del `⚠ sin revisar` del contador.
- Marcar un original gana: la receta pasa a verde y el control de descarte desaparece.
- `npx tsc --noEmit` limpio y `npx jest lib/annex/selection.test.ts` verde.
- Columna `annex_reviewed` con default `false`; sin la columna, el GET fallaría — por eso Task 1 corre primero.

---

## Notas

- Límite consciente (v1): descarte por receta (no por foto), solo en el overlay, sin razón ni historial, flag por receta (no por libro). Documentado en el spec §7.
