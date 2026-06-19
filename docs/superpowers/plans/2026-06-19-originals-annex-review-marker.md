# Originals Annex — Marcador de revisión en la lista — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Que la lista del libro (`/admin/books`) muestre, por receta, un marcador tri-estado de originals (sin foto / foto sin revisar / con original) + un contador resumen arriba, para que ninguna receta con foto del invitado se pase sin revisar.

**Architecture:** Solo front-end + un helper puro. Un helper testeado en `lib/annex/selection.ts` deriva el tri-estado desde `document_urls`/`image_url`/`annex_source_urls` (datos que el GET del libro ya manda, M1). `RecipePreviewCard` pinta un pill por fila; `BookDetailSheet` pinta el contador resumen. Cero cambios en DB/API.

**Tech Stack:** Next.js 14 App Router, TypeScript strict, React (componentes existentes), Jest (lógica pura), Tailwind, lucide-react.

## Global Constraints

- **Cero cambios en DB/API.** El GET `/api/v1/admin/books/[groupId]` ya expone `annex_source_urls` por receta (M1) y la lista ya recibe `document_urls`/`image_url`.
- **Reutilizar:** `isAnnexEligibleUrl` (ya en `lib/annex/selection.ts`) y el patrón de badge existente `text-[10px] px-1.5 py-0.5 rounded shrink-0`.
- **YAGNI:** solo marcador visual (opción A). Sin tracking explícito ni gate en el review.
- **Sin dependencias nuevas. No `any`. Archivos < 300 líneas. Sin console.log en producción.**
- **Copy (admin interno, español):** pill sin revisar `⚠ Foto sin revisar`; pill con original `✓ {n} original`; contador `📷 {x} con foto · ✓ {y} con original · ⚠ {z} sin revisar`.

Spec de referencia: `docs/superpowers/specs/2026-06-19-originals-annex-review-marker-design.md`.

---

## File Structure

- **Modify** `lib/annex/selection.ts` — añadir `eligibleAnnexImages` + `annexRowState` (puros).
- **Modify** `lib/annex/selection.test.ts` — tests de las dos funciones nuevas.
- **Modify** `app/(admin)/admin/books/components/RecipePreviewCard.tsx` — campos en `RecipeData` + pill por fila.
- **Modify** `app/(admin)/admin/books/components/BookDetailSheet.tsx` — campo en `RecipeData` + contador resumen.

---

## Task 1: Helper puro de tri-estado (TDD)

**Files:**
- Modify: `lib/annex/selection.ts`
- Test: `lib/annex/selection.test.ts`

**Interfaces:**
- Consumes: `isAnnexEligibleUrl` (ya existe en el mismo archivo).
- Produces:
  - `eligibleAnnexImages(documentUrls: string[] | null, imageUrl: string | null): string[]`
  - `type AnnexRowState = 'none' | 'unreviewed' | 'selected'`
  - `annexRowState(documentUrls: string[] | null, imageUrl: string | null, annexSourceUrls: string[] | null): { state: AnnexRowState; selectedCount: number; eligibleCount: number }`

- [ ] **Step 1: Escribir los tests que fallan**

En `lib/annex/selection.test.ts`, añadir al final del archivo (después del último `describe`):

```ts
import { eligibleAnnexImages, annexRowState } from './selection';

describe('eligibleAnnexImages', () => {
  it('devuelve solo imágenes raster de document_urls + image_url', () => {
    expect(
      eligibleAnnexImages(['https://x/a.jpg', 'https://x/b.pdf'], 'https://x/c.png')
    ).toEqual(['https://x/a.jpg', 'https://x/c.png']);
  });
  it('devuelve vacío cuando no hay imágenes elegibles', () => {
    expect(eligibleAnnexImages(['https://x/a.pdf'], null)).toEqual([]);
    expect(eligibleAnnexImages(null, null)).toEqual([]);
  });
});

describe('annexRowState', () => {
  it("'none' cuando la receta no tiene imágenes elegibles", () => {
    expect(annexRowState(['https://x/a.pdf'], null, [])).toEqual({
      state: 'none',
      selectedCount: 0,
      eligibleCount: 0,
    });
    expect(annexRowState(null, null, null).state).toBe('none');
  });
  it("'unreviewed' cuando hay foto elegible y 0 marcadas", () => {
    expect(annexRowState(['https://x/a.jpg'], null, [])).toEqual({
      state: 'unreviewed',
      selectedCount: 0,
      eligibleCount: 1,
    });
    expect(annexRowState(['https://x/a.jpg'], null, null).state).toBe('unreviewed');
  });
  it("'selected' cuando hay al menos una marcada (aunque falten otras)", () => {
    expect(
      annexRowState(['https://x/a.jpg', 'https://x/b.jpg'], null, ['https://x/a.jpg'])
    ).toEqual({ state: 'selected', selectedCount: 1, eligibleCount: 2 });
  });
});
```

- [ ] **Step 2: Correr los tests para verificar que fallan**

Run: `npx jest lib/annex/selection.test.ts`
Expected: FAIL — `eligibleAnnexImages`/`annexRowState` no exportadas ("is not a function" o de tipo).

- [ ] **Step 3: Implementar las funciones**

En `lib/annex/selection.ts`, añadir al final del archivo:

```ts
/** Eligible raster images the guest submitted (document_urls + legacy image_url). */
export function eligibleAnnexImages(
  documentUrls: string[] | null,
  imageUrl: string | null
): string[] {
  const all = [...(documentUrls ?? []), ...(imageUrl ? [imageUrl] : [])];
  return all.filter(isAnnexEligibleUrl);
}

export type AnnexRowState = 'none' | 'unreviewed' | 'selected';

/**
 * Tri-state for the book-list marker. 'none' = no guest photo to review; 'unreviewed' =
 * has photo(s) but nothing marked as original yet (needs a look); 'selected' = at least
 * one image already marked (counts as reviewed).
 */
export function annexRowState(
  documentUrls: string[] | null,
  imageUrl: string | null,
  annexSourceUrls: string[] | null
): { state: AnnexRowState; selectedCount: number; eligibleCount: number } {
  const eligibleCount = eligibleAnnexImages(documentUrls, imageUrl).length;
  const selectedCount = (annexSourceUrls ?? []).length;
  if (eligibleCount === 0) return { state: 'none', selectedCount: 0, eligibleCount: 0 };
  if (selectedCount >= 1) return { state: 'selected', selectedCount, eligibleCount };
  return { state: 'unreviewed', selectedCount: 0, eligibleCount };
}
```

- [ ] **Step 4: Correr los tests para verificar que pasan**

Run: `npx jest lib/annex/selection.test.ts`
Expected: PASS (todas las suites verdes, incluyendo las nuevas).

- [ ] **Step 5: Type check**

Run: `npx tsc --noEmit`
Expected: sin errores.

- [ ] **Step 6: Commit**

```bash
git add lib/annex/selection.ts lib/annex/selection.test.ts
git commit -m "feat(annex): helper puro de tri-estado de revision de originals + tests"
```

---

## Task 2: Pill por fila en `RecipePreviewCard`

**Files:**
- Modify: `app/(admin)/admin/books/components/RecipePreviewCard.tsx`

**Interfaces:**
- Consumes: `annexRowState` (Task 1).
- Produces: pill visible en la fila según el tri-estado.

- [ ] **Step 1: Importar el helper**

En `app/(admin)/admin/books/components/RecipePreviewCard.tsx`, después de la línea 4 (`import { ChevronDown, ... } from 'lucide-react';`), añadir:

```ts
import { annexRowState } from '@/lib/annex/selection';
```

- [ ] **Step 2: Extender la interfaz `RecipeData`**

En la interfaz local `RecipeData` (líneas 6-29), añadir después de `image_url: string | null;` (línea 14):

```ts
  document_urls: string[] | null;
  annex_source_urls?: string[];
```

- [ ] **Step 3: Calcular el estado dentro del componente**

Después de `const hasPrintImage = !!recipe.generated_image_url_print;` (línea 41), añadir:

```ts
  // Reason: tri-state originals marker so a recipe with a guest photo never gets skipped
  // in review. Derived (no DB state) from the guest's eligible images vs. what's marked.
  const annex = annexRowState(recipe.document_urls, recipe.image_url, recipe.annex_source_urls);
```

- [ ] **Step 4: Renderizar el pill en el cluster de badges**

En el row colapsado, justo después del `</span>` que cierra el badge de `book_review_status` (línea 111) y antes de `</button>` (línea 112), añadir:

```tsx
        {annex.state === 'unreviewed' && (
          <span className="text-[10px] px-1.5 py-0.5 rounded shrink-0 bg-amber-100 text-amber-700 border border-amber-300 whitespace-nowrap">
            ⚠ Foto sin revisar
          </span>
        )}
        {annex.state === 'selected' && (
          <span className="text-[10px] px-1.5 py-0.5 rounded shrink-0 bg-emerald-100 text-emerald-700 whitespace-nowrap">
            ✓ {annex.selectedCount} original
          </span>
        )}
```

- [ ] **Step 5: Type check**

Run: `npx tsc --noEmit`
Expected: sin errores.

- [ ] **Step 6: Verificación visual (screenshot de Ricardo)**

Reason: el proyecto verifica UI con screenshot, no headless. Con `npm run dev`:
1. `/admin/books` → abrir un libro con recetas de foto.
2. Una receta de texto puro: sin pill nuevo.
3. Una receta con foto del invitado y nada marcado: pill ámbar `⚠ Foto sin revisar`.
4. Marcar una foto como original en el overlay, cerrar (la lista recarga): esa receta pasa a verde `✓ 1 original`.
5. Pedir screenshot a Ricardo.

- [ ] **Step 7: Commit**

```bash
git add "app/(admin)/admin/books/components/RecipePreviewCard.tsx"
git commit -m "feat(annex): pill tri-estado de originals por receta en la lista del libro"
```

---

## Task 3: Contador resumen en `BookDetailSheet`

**Files:**
- Modify: `app/(admin)/admin/books/components/BookDetailSheet.tsx`

**Interfaces:**
- Consumes: `annexRowState` (Task 1); `detail.recipes` (ya disponible).
- Produces: línea resumen `📷 {x} con foto · ✓ {y} con original · ⚠ {z} sin revisar` arriba del listado.

- [ ] **Step 1: Importar el helper**

En `app/(admin)/admin/books/components/BookDetailSheet.tsx`, junto a los imports de componentes (cerca de la línea 13 `import BookReviewOverlay from './BookReviewOverlay';`), añadir:

```ts
import { annexRowState } from '@/lib/annex/selection';
```

- [ ] **Step 2: Extender la interfaz `RecipeData`**

En la interfaz local `RecipeData` (líneas 31-57), añadir después de `book_review_notes: string | null;` (línea 56):

```ts
  annex_source_urls?: string[];
```

(`document_urls` e `image_url` ya están en esta interfaz, líneas 39 y 43.)

- [ ] **Step 3: Calcular el resumen**

Dentro del componente, donde están las derivaciones de `detail` (p.ej. junto a `const coupleImageUrl = detail?.group.couple_image_url || null;`, línea ~220), añadir:

```ts
  // Reason: book-level checklist of originals review — surfaces how many photo recipes
  // still need a look so nothing slips. Derived, no DB state.
  const annexSummary = (detail?.recipes ?? []).reduce(
    (acc, r) => {
      const { state } = annexRowState(r.document_urls, r.image_url, r.annex_source_urls);
      if (state === 'none') return acc;
      acc.withPhoto += 1;
      if (state === 'selected') acc.withOriginal += 1;
      else acc.unreviewed += 1;
      return acc;
    },
    { withPhoto: 0, withOriginal: 0, unreviewed: 0 }
  );
```

- [ ] **Step 4: Renderizar la línea resumen arriba del listado**

En la `Section` de "Recipes" (línea 498), dentro de `{recipesExpanded && (` (línea 504), reemplazar:

```tsx
                {recipesExpanded && (
                  <div className="space-y-2">
                    {detail.recipes.map((r, i) => (
```

por:

```tsx
                {recipesExpanded && (
                  <div className="space-y-2">
                    {annexSummary.withPhoto > 0 && (
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-1 pb-1 text-[11px] text-gray-500">
                        <span>📷 {annexSummary.withPhoto} con foto</span>
                        <span className="text-emerald-600">✓ {annexSummary.withOriginal} con original</span>
                        {annexSummary.unreviewed > 0 && (
                          <span className="text-amber-600 font-medium">
                            ⚠ {annexSummary.unreviewed} sin revisar
                          </span>
                        )}
                      </div>
                    )}
                    {detail.recipes.map((r, i) => (
```

- [ ] **Step 5: Type check**

Run: `npx tsc --noEmit`
Expected: sin errores.

- [ ] **Step 6: Verificación visual (screenshot de Ricardo)**

Con `npm run dev`:
1. `/admin/books` → abrir un libro con varias recetas de foto.
2. Arriba del listado de recetas aparece `📷 X con foto · ✓ Y con original · ⚠ Z sin revisar`.
3. El segmento `⚠ … sin revisar` se ve ámbar y desaparece cuando Z llega a 0.
4. Un libro sin fotos: no aparece la línea.
5. Pedir screenshot a Ricardo.

- [ ] **Step 7: Commit**

```bash
git add "app/(admin)/admin/books/components/BookDetailSheet.tsx"
git commit -m "feat(annex): contador resumen de revision de originals en el libro"
```

---

## Definition of Done

- En `/admin/books`, cada receta con foto del invitado muestra `⚠ Foto sin revisar` (ámbar) o `✓ N original` (verde); las de texto puro, nada.
- Arriba del listado aparece `📷 X con foto · ✓ Y con original · ⚠ Z sin revisar`.
- El estado refleja la realidad tras marcar/desmarcar en el overlay (la lista recarga al cerrarlo).
- `npx tsc --noEmit` limpio y `npx jest lib/annex/selection.test.ts` verde.
- Cero cambios en DB/API.

---

## Notas

- Límite consciente (v1): una foto que se decide no incluir queda en ámbar (no hay "revisada y descartada"); marcar 1 de N pone la receta en verde. Documentado en el spec §7.
