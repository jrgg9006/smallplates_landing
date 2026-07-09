> **OBSOLETO (2026-07-08):** el modelo de spreads ORIGINALS_OPENER/ORIGINALS_PAIR (v17)
> fue reemplazado por el modelo de PÁGINAS template de `generate-book_v18.jsx` (v1.16.0):
> 3 páginas template (título / 1-up / 2-up), inserción después de OBJECTS_THAT_STAY,
> regla 2 imágenes de una receta = página 2-up con un solo pie, filler de paridad.
> La sección M3 (pipeline/JSON) sigue vigente. El checklist del .indd de abajo NO aplica.

# Originals Annex — M3 + M4 entregados (código) + checklist del .indd

**Fecha:** 2026-06-26
**Branch:** `feature/originals-annex`
**Spec maestro:** `docs/superpowers/specs/2026-06-15-originals-annex-design.md`

---

## Qué quedó en código

### M3 — Pipeline (el puente del JSON)
- `lib/annex/pipeline.ts` (nuevo, puro + testeado): `buildAnnexPipelinePlan(rows, groupId)`.
  Filtra filas `upscale_status='ready'` con URL usable (`print_url` → fallback `original_url`),
  agrupa por receta ordenadas por `position`, y produce los bloques `annex_images` +
  la lista de descargas. `annexLocalImagePath()` = `image_assets/{group}/annex/{recipe}_{pos}.png`.
- `lib/annex/pipeline.test.ts` — 5 tests.
- `app/api/v1/admin/books/[groupId]/package/route.ts` (editado in-place): baja las filas `ready`,
  mete las descargas al zip, y agrega `annex_images` por receta **solo si la tiene**.
- `scripts/indesign/fetch-book_v2.js` (copia versionada de `fetch-book.js`; el v1 NO se tocó):
  mismo plan replicado inline + baja los originals a `.../annex/`.

**Bloque nuevo en el JSON, por receta (solo si tiene originals `ready`):**
```json
"annex_images": [
  { "local_image_path": "image_assets/{group}/annex/{recipeId}_0.png", "position": 0 }
]
```
**Cero-regresión:** libro sin originals → ninguna receta lleva la clave → JSON byte-idéntico a hoy.

### M4 — InDesign `generate-book_v17.jsx` (v16 INTACTO)
- Gate `hasAnnex` (¿alguna receta trae `annex_images`?). Sin annex → corre idéntico a v16.
- Sección "The Originals" después del back matter, **una imagen por página**, pie
  `{recipe} shared by {guest}`. Modelo opener + pair → **siempre termina en página par**.
- Footer de receta `See Originals Page {N}` (solo recetas con original), pasada final
  cuando la numeración ya es estable.

---

## Checklist del .indd (trabajo manual de Ricardo)

Todo esto vive en el master template (`SmallPlates_MasterTemplate_v1.indd`). El script lee
los **Script Labels** (ventana: Window > Utilities > Script Label).

### 1. Frame de footer en los 4 templates de receta
En `TEMPLATE_RECIPE_A`, `TEMPLATE_RECIPE_A_INGREDIENTS`, `TEMPLATE_RECIPE_B`, `TEMPLATE_RECIPE_C`:
- Agregar un **text frame vacío** en el footer (abajo, junto al número de página — ver mockup).
- Script Label = **`originalNoteFooter`**.
- Dejarlo **vacío** por default. El script lo llena con `See Originals Page {N}` solo cuando
  esa receta tiene un original; si no, queda vacío (invisible).
- Estilo de párrafo: el mismo gris/discreto del mockup. Que el TOC NO lo levante.

### 2. Template `ORIGINALS_OPENER` (spread de 2 caras)
- Script Label del **spread** = **`ORIGINALS_OPENER`**.
- Cara izquierda (par): portada estática "The Originals" + subtítulo
  *Real images that we believe should stay in your kitchen.* (sin frames con label).
- Cara derecha (impar) = **página-imagen**:
  - Eyebrow estático "ORIGINALS" arriba (texto fijo, sin label).
  - Frame de imagen con Script Label = **`{{ORIGINAL_IMAGE}}`** (tamaño/posición a tu gusto;
    el script hace fit proporcional sin recortar y centra).
  - Text frame de pie con Script Label = **`originalCaption`** (vacío; el script lo llena).
  - Número de página visible (como hoy).

### 3. Template `ORIGINALS_PAIR` (spread de 2 caras)
- Script Label del **spread** = **`ORIGINALS_PAIR`**.
- **Ambas** caras = página-imagen idéntica a la cara derecha del opener:
  eyebrow "ORIGINALS" + frame **`{{ORIGINAL_IMAGE}}`** + frame **`originalCaption`** + número de página.

### 4. Ubicación y estilos
- Pon `ORIGINALS_OPENER` y `ORIGINALS_PAIR` **junto a los demás `TEMPLATE_*`** (se borran solos
  en STEP 10, igual que los templates de receta). No los pongas dentro del back matter.
- Los estilos de párrafo del eyebrow/pie de Originals deben quedar **fuera del TOC** (que el
  índice no los incluya), igual que el resto de la sección.
- Mantén la **página blank-buffer** al final del master como hasta ahora (el script la captura
  y la quita sola).

---

## Cómo se llena (para que cuadre con tu cabeza)
- N = total de imágenes originals del libro (en orden de receta, luego `position`).
- El script duplica **1× `ORIGINALS_OPENER`** + **`ceil((N−1)/2)× `ORIGINALS_PAIR`**.
- Llena las N imágenes en orden de lectura: opener-derecha (p. impar) → pair-izq → pair-der → …
- Cara sobrante (si N hace que sobre un slot) → se vacía y queda en blanco.
- Total de páginas de la sección = siempre par.
- Footer de cada receta con original → `See Originals Page {página de su primer original}`.

---

## Verificación (visual, tú)
1. Corre `node scripts/indesign/fetch-book_v2.js <GROUP_ID>` (un libro que YA tenga originals
   `ready` en `recipe_annex_images`). Revisa que el JSON traiga `annex_images` en las recetas
   correctas y que se hayan bajado los PNG a `image_assets/{group}/annex/`.
2. Abre el master con los templates nuevos y corre `generate-book_v17.jsx`.
3. Verifica: sección Originals al final, 1 imagen/página, pies correctos, footer
   `See Originals Page {N}` en las recetas con original, y que la sección termine en par.
4. Corre un libro **sin** originals con v17 → debe salir idéntico a v16 (control de regresión).

## Pendientes de M1/M2 (prerequisitos para probar M3/M4 end-to-end)
- SQL de la tabla `recipe_annex_images` corrido en Supabase.
- SQL del webhook `upscale-annex-on-pending`.
- Tener al menos un libro con originals marcadas y upscaleadas a `ready`.
