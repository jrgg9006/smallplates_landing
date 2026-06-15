# Originals Annex — M1: Datos + Selección — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permitir que el admin marque/desmarque, dentro de `BookReviewOverlay`, qué imágenes originales de una receta valen la pena como anexo — y que esa selección persista y se vea.

**Architecture:** Tabla hija nueva `recipe_annex_images` (una fila por imagen). Una ruta admin dedicada (`/api/v1/admin/books/[groupId]/annex`) crea/borra filas, validando que la URL pertenezca a la receta y sea imagen. El `BookReviewOverlay` añade un toggle por imagen en el panel de "Foto original". La lógica de validación/posición vive en un helper puro testeado con Jest; las piezas acopladas a Supabase y la UI se verifican manualmente (patrón del repo).

**Tech Stack:** Next.js 14 App Router, TypeScript strict, Supabase (service-role admin client), Jest (lógica pura), Tailwind.

**Alcance:** SOLO M1. No incluye upscaling (M2), pipeline/JSON (M3), ni InDesign (M4). Después de M1 cada milestone recibe su propio plan.

---

## Roadmap de milestones (contexto)

```
M1  Datos + selección      ← ESTE PLAN. admin marca/desmarca originals, persiste y se ve
M2  Normalización + upscale   sharp + Edge Function upscale-annex-image + polling + botón
M3  Pipeline                  package route + fetch-book.js meten annex_images al JSON
M4  InDesign v17              sección Originals + referencia cruzada de páginas
```

Spec de referencia: `docs/superpowers/specs/2026-06-15-originals-annex-design.md`.

---

## File Structure (M1)

- **Create** `supabase/migrations/20260615_create_recipe_annex_images.sql` — DDL + RLS de la tabla (se corre manual).
- **Modify** `lib/types/database.ts` — añadir el tipo de tabla + convenience types.
- **Create** `lib/annex/selection.ts` — helper puro: elegibilidad de URL, validación de origen, siguiente posición.
- **Create** `lib/annex/selection.test.ts` — tests Jest del helper.
- **Create** `app/api/v1/admin/books/[groupId]/annex/route.ts` — GET/POST/DELETE de filas de anexo.
- **Modify** `app/api/v1/admin/books/[groupId]/route.ts` — el GET adjunta `annex_source_urls` por receta.
- **Modify** `app/(admin)/admin/books/components/BookReviewOverlay.tsx` — toggle "Original" por imagen.

---

## Task 1: Tabla `recipe_annex_images` + tipos

**Files:**
- Create: `supabase/migrations/20260615_create_recipe_annex_images.sql`
- Modify: `lib/types/database.ts` (Tables object ~línea 730, convenience types ~línea 924)

- [ ] **Step 1: Crear el archivo de migración**

Create `supabase/migrations/20260615_create_recipe_annex_images.sql`:

```sql
-- Originals annex: one row per guest image selected to be printed at the back of the book.
create table if not exists public.recipe_annex_images (
  id               uuid primary key default gen_random_uuid(),
  recipe_id        uuid not null references public.guest_recipes(id) on delete cascade,
  group_id         uuid not null references public.groups(id) on delete cascade,
  source_url       text not null,                 -- the document_urls/image_url entry the admin selected
  original_url     text,                          -- normalized PNG (written in M2)
  print_url        text,                          -- upscaled version (written in M2)
  upscale_status   text check (upscale_status in ('pending','processing','ready','error')),
  image_dimensions jsonb,
  position         int  not null default 0,       -- order within the recipe and the annex
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (recipe_id, source_url)
);

create index if not exists idx_recipe_annex_images_group  on public.recipe_annex_images(group_id);
create index if not exists idx_recipe_annex_images_recipe on public.recipe_annex_images(recipe_id);

-- Admin-only: routes use the service-role client (bypasses RLS). Enable RLS with NO
-- permissive policies so anon/authenticated are denied by default.
alter table public.recipe_annex_images enable row level security;
```

- [ ] **Step 2: Correr el SQL manualmente en Supabase**

Reason: regla del proyecto — los cambios de DDL los corre el usuario a mano (no `apply_migration` destructivo). Entregar el bloque SQL de arriba y esperar confirmación de que se ejecutó en el proyecto `Small_Plates` (`iinnpndsxepvviafrmwz`) antes de seguir.

Expected: tabla `recipe_annex_images` creada, RLS habilitada, sin policies.

- [ ] **Step 3: Añadir el tipo de tabla en `database.ts`**

En `lib/types/database.ts`, dentro del objeto `Tables` (p.ej. justo después del bloque `recipe_print_ready:` que termina ~línea 730), añadir:

```ts
      recipe_annex_images: {
        Row: {
          id: string;
          recipe_id: string;
          group_id: string;
          source_url: string;
          original_url: string | null;
          print_url: string | null;
          upscale_status: 'pending' | 'processing' | 'ready' | 'error' | null;
          image_dimensions: Record<string, unknown> | null;
          position: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          recipe_id: string;
          group_id: string;
          source_url: string;
          original_url?: string | null;
          print_url?: string | null;
          upscale_status?: 'pending' | 'processing' | 'ready' | 'error' | null;
          image_dimensions?: Record<string, unknown> | null;
          position?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          original_url?: string | null;
          print_url?: string | null;
          upscale_status?: 'pending' | 'processing' | 'ready' | 'error' | null;
          image_dimensions?: Record<string, unknown> | null;
          position?: number;
          updated_at?: string;
        };
      };
```

- [ ] **Step 4: Añadir convenience types al final de `database.ts`**

Junto a los otros (p.ej. después de la línea 924 `export type RecipePrintReadyUpdate = ...`):

```ts
export type RecipeAnnexImage = Database['public']['Tables']['recipe_annex_images']['Row'];
export type RecipeAnnexImageInsert = Database['public']['Tables']['recipe_annex_images']['Insert'];
export type RecipeAnnexImageUpdate = Database['public']['Tables']['recipe_annex_images']['Update'];
```

- [ ] **Step 5: Type check**

Run: `npx tsc --noEmit`
Expected: sin errores nuevos.

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations/20260615_create_recipe_annex_images.sql lib/types/database.ts
git commit -m "feat(annex): tabla recipe_annex_images + tipos (M1)"
```

---

## Task 2: Helper puro de selección (TDD)

**Files:**
- Create: `lib/annex/selection.ts`
- Test: `lib/annex/selection.test.ts`

- [ ] **Step 1: Escribir el test que falla**

Create `lib/annex/selection.test.ts`:

```ts
import { isAnnexEligibleUrl, isValidAnnexSource, nextAnnexPosition } from './selection';

describe('isAnnexEligibleUrl', () => {
  it('acepta extensiones de imagen comunes', () => {
    expect(isAnnexEligibleUrl('https://x/abc.jpg')).toBe(true);
    expect(isAnnexEligibleUrl('https://x/abc.PNG?t=1')).toBe(true);
    expect(isAnnexEligibleUrl('https://x/abc.webp')).toBe(true);
    expect(isAnnexEligibleUrl('https://x/abc.jpeg')).toBe(true);
  });
  it('rechaza PDFs y otros tipos', () => {
    expect(isAnnexEligibleUrl('https://x/abc.pdf')).toBe(false);
    expect(isAnnexEligibleUrl('https://x/abc.mp3')).toBe(false);
    expect(isAnnexEligibleUrl('https://x/noext')).toBe(false);
  });
});

describe('isValidAnnexSource', () => {
  it('acepta una url presente en document_urls que es imagen', () => {
    expect(isValidAnnexSource('https://x/1.jpg', ['https://x/1.jpg'], null)).toBe(true);
  });
  it('rechaza una url que no pertenece a la receta', () => {
    expect(isValidAnnexSource('https://evil/1.jpg', ['https://x/1.jpg'], null)).toBe(false);
  });
  it('rechaza un pdf aunque esté presente', () => {
    expect(isValidAnnexSource('https://x/1.pdf', ['https://x/1.pdf'], null)).toBe(false);
  });
  it('usa image_url como fallback', () => {
    expect(isValidAnnexSource('https://x/legacy.jpg', null, 'https://x/legacy.jpg')).toBe(true);
  });
});

describe('nextAnnexPosition', () => {
  it('devuelve 0 si no hay filas', () => {
    expect(nextAnnexPosition([])).toBe(0);
  });
  it('devuelve max+1', () => {
    expect(nextAnnexPosition([0, 1, 2])).toBe(3);
    expect(nextAnnexPosition([5])).toBe(6);
  });
});
```

- [ ] **Step 2: Correr el test para verificar que falla**

Run: `npx jest lib/annex/selection.test.ts`
Expected: FAIL — "Cannot find module './selection'".

- [ ] **Step 3: Implementar el helper**

Create `lib/annex/selection.ts`:

```ts
// Reason: a handwritten note is only worth printing if it's an actual raster image.
// PDFs and non-image files are excluded from the annex in v1.
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];

/** True if the URL points to a raster image we can place in the annex. */
export function isAnnexEligibleUrl(url: string): boolean {
  const path = url.toLowerCase().split('?')[0];
  return IMAGE_EXTENSIONS.some((ext) => path.endsWith(ext));
}

/**
 * True if `sourceUrl` actually belongs to this recipe (document_urls or legacy
 * image_url) AND is an eligible image. Prevents inserting arbitrary URLs.
 */
export function isValidAnnexSource(
  sourceUrl: string,
  documentUrls: string[] | null,
  imageUrl: string | null
): boolean {
  const allowed = [...(documentUrls ?? []), ...(imageUrl ? [imageUrl] : [])];
  return allowed.includes(sourceUrl) && isAnnexEligibleUrl(sourceUrl);
}

/** Next position for a recipe's annex images: max existing position + 1, else 0. */
export function nextAnnexPosition(existingPositions: number[]): number {
  if (existingPositions.length === 0) return 0;
  return Math.max(...existingPositions) + 1;
}
```

- [ ] **Step 4: Correr el test para verificar que pasa**

Run: `npx jest lib/annex/selection.test.ts`
Expected: PASS (3 suites, todos verdes).

- [ ] **Step 5: Commit**

```bash
git add lib/annex/selection.ts lib/annex/selection.test.ts
git commit -m "feat(annex): helper puro de validación/posición + tests (M1)"
```

---

## Task 3: Ruta admin `/annex` (GET/POST/DELETE)

**Files:**
- Create: `app/api/v1/admin/books/[groupId]/annex/route.ts`

- [ ] **Step 1: Crear la ruta**

Create `app/api/v1/admin/books/[groupId]/annex/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth/admin';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { isValidAnnexSource, nextAnnexPosition } from '@/lib/annex/selection';

// GET — list annex rows for this group (drives polling/hydration).
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    await requireAdminAuth();
    const { groupId } = await params;
    const supabase = createSupabaseAdminClient();

    const { data, error } = await supabase
      .from('recipe_annex_images')
      .select('id, recipe_id, source_url, original_url, print_url, upscale_status, position')
      .eq('group_id', groupId)
      .order('position');

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ annex_images: data ?? [] });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unauthorized' },
      { status: 401 }
    );
  }
}

// POST — mark an image as original. Body: { recipe_id, source_url }.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    await requireAdminAuth();
    const { groupId } = await params;
    const supabase = createSupabaseAdminClient();
    const { recipe_id, source_url } = (await request.json()) as {
      recipe_id?: string;
      source_url?: string;
    };

    if (!recipe_id || !source_url) {
      return NextResponse.json(
        { error: 'recipe_id and source_url are required' },
        { status: 400 }
      );
    }

    // Validate the source_url actually belongs to this recipe and is an image.
    const { data: recipe, error: recipeError } = await supabase
      .from('guest_recipes')
      .select('id, document_urls, image_url')
      .eq('id', recipe_id)
      .eq('group_id', groupId)
      .single();

    if (recipeError || !recipe) {
      return NextResponse.json({ error: 'Recipe not found in this group' }, { status: 404 });
    }

    const documentUrls = (recipe as { document_urls: string[] | null }).document_urls;
    const imageUrl = (recipe as { image_url: string | null }).image_url;

    if (!isValidAnnexSource(source_url, documentUrls, imageUrl)) {
      return NextResponse.json(
        { error: 'source_url is not an eligible image for this recipe' },
        { status: 400 }
      );
    }

    // Compute next position from existing rows for this recipe.
    const { data: existing } = await supabase
      .from('recipe_annex_images')
      .select('position')
      .eq('recipe_id', recipe_id);

    const position = nextAnnexPosition((existing ?? []).map((r) => r.position as number));

    // Idempotent: UNIQUE(recipe_id, source_url) — re-marking is a no-op.
    const { error: insertError } = await supabase
      .from('recipe_annex_images')
      .upsert(
        { recipe_id, group_id: groupId, source_url, position },
        { onConflict: 'recipe_id,source_url', ignoreDuplicates: true }
      );

    if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unauthorized' },
      { status: 401 }
    );
  }
}

// DELETE — unmark an image. Body: { recipe_id, source_url }.
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    await requireAdminAuth();
    const { groupId } = await params;
    const supabase = createSupabaseAdminClient();
    const { recipe_id, source_url } = (await request.json()) as {
      recipe_id?: string;
      source_url?: string;
    };

    if (!recipe_id || !source_url) {
      return NextResponse.json(
        { error: 'recipe_id and source_url are required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('recipe_annex_images')
      .delete()
      .eq('group_id', groupId)
      .eq('recipe_id', recipe_id)
      .eq('source_url', source_url);

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

- [ ] **Step 2: Type check**

Run: `npx tsc --noEmit`
Expected: sin errores.

- [ ] **Step 3: Verificación manual (con la app corriendo)**

Reason: el repo no testea rutas acopladas a Supabase; se verifica a mano. Con `npm run dev` y sesión admin:
1. En `/admin/books`, abrir un libro con recetas que tengan `document_urls` con imágenes; copiar un `recipe_id` (de la respuesta de `/api/v1/admin/books/[groupId]`) y una `source_url` (una de sus `document_urls`).
2. POST: marcar como original. En la pestaña Network o vía consola del navegador (misma sesión/cookies):
   ```js
   await fetch(`/api/v1/admin/books/${GROUP_ID}/annex`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ recipe_id: RECIPE_ID, source_url: SOURCE_URL }) }).then(r => r.json())
   ```
   Expected: `{ success: true }`.
3. GET: `await fetch(`/api/v1/admin/books/${GROUP_ID}/annex`).then(r => r.json())` → la fila aparece con `position: 0`.
4. POST con una `source_url` que NO esté en la receta → `400` "not an eligible image".
5. POST con una `.pdf` de la receta → `400`.
6. DELETE la fila → `{ success: true }`, y el GET ya no la lista.

- [ ] **Step 4: Commit**

```bash
git add "app/api/v1/admin/books/[groupId]/annex/route.ts"
git commit -m "feat(annex): ruta admin GET/POST/DELETE de originals (M1)"
```

---

## Task 4: El GET de books adjunta `annex_source_urls` por receta

**Files:**
- Modify: `app/api/v1/admin/books/[groupId]/route.ts` (GET handler)

- [ ] **Step 1: Buscar las filas de anexo del grupo**

En `app/api/v1/admin/books/[groupId]/route.ts`, dentro del `GET`, después de calcular `activeRecipeIds` (línea ~60) y antes de `const formattedRecipes = ...` (línea ~158), añadir:

```ts
    // Annex selections (Originals) for this group, grouped by recipe.
    const { data: annexRows } = await supabase
      .from('recipe_annex_images')
      .select('recipe_id, source_url')
      .eq('group_id', groupId);

    const annexByRecipe = new Map<string, string[]>();
    for (const row of annexRows ?? []) {
      const list = annexByRecipe.get(row.recipe_id) ?? [];
      list.push(row.source_url);
      annexByRecipe.set(row.recipe_id, list);
    }
```

- [ ] **Step 2: Adjuntar `annex_source_urls` a cada receta formateada**

Dentro del `.map(r => { ... return { ... } })` de `formattedRecipes` (el objeto que empieza en la línea ~165), añadir una propiedad al objeto retornado, junto a `book_review_notes`:

```ts
        annex_source_urls: annexByRecipe.get(r.id) ?? [],
```

- [ ] **Step 3: Type check**

Run: `npx tsc --noEmit`
Expected: sin errores.

- [ ] **Step 4: Verificación manual**

Con la app corriendo y una fila de anexo creada en Task 3:
`await fetch(`/api/v1/admin/books/${GROUP_ID}`).then(r => r.json())` → la receta correspondiente trae `annex_source_urls: ["<source_url>"]`; las demás traen `[]`.

- [ ] **Step 5: Commit**

```bash
git add "app/api/v1/admin/books/[groupId]/route.ts"
git commit -m "feat(annex): exponer annex_source_urls por receta en el GET de books (M1)"
```

---

## Task 5: Toggle "Original" por imagen en `BookReviewOverlay`

**Files:**
- Modify: `app/(admin)/admin/books/components/BookReviewOverlay.tsx`

- [ ] **Step 1: Extender la interfaz `ReviewRecipe`**

En `app/(admin)/admin/books/components/BookReviewOverlay.tsx`, en la interfaz `ReviewRecipe` (termina ~línea 33), añadir el campo justo después de `book_review_notes: string | null;`:

```ts
  annex_source_urls?: string[];
```

- [ ] **Step 2: Añadir estado para el toggle en vuelo**

Dentro del componente, junto a los otros `useState` (p.ej. después de `const [error, setError] = useState<string | null>(null);`, línea ~73), añadir:

```ts
  // Reason: which source_url is currently being toggled as an "original", to disable its button.
  const [annexBusy, setAnnexBusy] = useState<string | null>(null);
```

- [ ] **Step 3: Añadir el handler `toggleAnnex`**

Dentro del componente, después de la definición de `originalFiles` (línea ~409), añadir (nota: `recipe` es la receta actual ya derivada; `setLocalRecipes` y `groupId` ya existen):

```ts
  const toggleAnnex = useCallback(async (sourceUrl: string) => {
    if (!recipe) return;
    const isSelected = (recipe.annex_source_urls ?? []).includes(sourceUrl);
    setAnnexBusy(sourceUrl);
    setError(null);
    try {
      const res = await fetch(`/api/v1/admin/books/${groupId}/annex`, {
        method: isSelected ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipe_id: recipe.id, source_url: sourceUrl }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j.error || 'No se pudo actualizar el original');
        return;
      }
      setLocalRecipes((prev) =>
        prev.map((r) => {
          if (r.id !== recipe.id) return r;
          const current = r.annex_source_urls ?? [];
          const next = isSelected
            ? current.filter((u) => u !== sourceUrl)
            : [...current, sourceUrl];
          return { ...r, annex_source_urls: next };
        })
      );
    } finally {
      setAnnexBusy(null);
    }
  }, [recipe, groupId]);
```

- [ ] **Step 4: Añadir el botón toggle en el panel de foto original**

En el panel `showPhoto` (la rama no-PDF de `originalFiles.map`, dentro del `<div key={url}>` que envuelve la `<img>`, línea ~580-593), añadir el botón justo después del `</a>` que cierra la imagen, dentro del mismo `<div key={url}>`:

```tsx
                          {(() => {
                            const selected = (recipe.annex_source_urls ?? []).includes(url);
                            return (
                              <button
                                type="button"
                                onClick={() => toggleAnnex(url)}
                                disabled={annexBusy === url}
                                className={`mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded border transition-colors disabled:opacity-50 ${
                                  selected
                                    ? 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700'
                                    : 'bg-white text-gray-700 border-gray-300 hover:border-emerald-500'
                                }`}
                              >
                                {selected ? '✓ Original incluido' : 'Incluir como original'}
                              </button>
                            );
                          })()}
```

- [ ] **Step 5: Type check**

Run: `npx tsc --noEmit`
Expected: sin errores.

- [ ] **Step 6: Verificar que el campo llega desde el padre**

Reason: el toggle depende de que `recipe.annex_source_urls` venga poblado en las recetas que el padre pasa al overlay.

Run: `grep -n "annex_source_urls\|BookReviewOverlay\|recipes={" app/\(admin\)/admin/books/components/BookDetailSheet.tsx`

Si el padre construye el array de recetas con un `.map` explícito (en vez de pasar tal cual los objetos del GET), añadir `annex_source_urls: r.annex_source_urls ?? []` a ese map. Si pasa los objetos del GET directamente, ya fluye (el GET lo expone tras Task 4) y no hace falta cambio.

- [ ] **Step 7: Verificación visual (screenshot del usuario)**

Reason: el proyecto verifica UI con screenshot, no headless. Con `npm run dev`:
1. Abrir `/admin/books` → un libro → "Start Book Review".
2. En una receta con foto, presionar `P` (Foto original).
3. Bajo cada imagen aparece "Incluir como original"; al clic cambia a "✓ Original incluido" (verde).
4. Cerrar y reabrir el overlay → el estado persiste (viene del GET).
5. Pedir screenshot a Ricardo para confirmar.

- [ ] **Step 8: Commit**

```bash
git add "app/(admin)/admin/books/components/BookReviewOverlay.tsx"
git commit -m "feat(annex): toggle 'Incluir como original' por imagen en Book Review (M1)"
```

---

## Definition of Done (M1)

- La tabla `recipe_annex_images` existe con RLS habilitada y sin policies públicas.
- El admin puede marcar/desmarcar imágenes como "original" en `BookReviewOverlay`; persiste tras recargar.
- Solo imágenes elegibles (no PDF, pertenecientes a la receta) pueden marcarse.
- `npx tsc --noEmit` limpio y `npx jest lib/annex/selection.test.ts` verde.
- Sin tocar el flujo de recetas ni columnas existentes. Nada de upscaling/pipeline/InDesign todavía.

---

## Notas para M2 (no implementar aún)

- M2 añade: ruta de normalización con `sharp` (escribe `original_url`), Edge Function `upscale-annex-image` (gemelo de `upscale-image`, modelo Real-ESRGAN `f121d640…`), webhook sobre `recipe_annex_images`, botón "Upscale originals" e indicador de status con polling (patrón de `/admin/operations`, GET cada 2s/máx 90s).
- Las columnas `original_url`, `print_url`, `upscale_status`, `image_dimensions` ya existen desde M1 (Task 1), listas para M2.
