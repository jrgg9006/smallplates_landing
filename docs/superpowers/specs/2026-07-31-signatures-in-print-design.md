# Firmas del invitado en el libro impreso (InDesign) — Diseño

Fecha: 2026-07-31 · Rama: `feature/guest-signature`

## Contexto

Ya capturamos, guardamos (`guest_recipes.signature_url`, PNG transparente ~1600px
en el bucket `recipes`) y mostramos la firma del invitado en web (review + modal del
organizer). Falta la fase final: que la firma **aparezca impresa en el libro** vía el
pipeline de InDesign, con un clic, limpia y sin errores cuando una receta no tiene firma.

## Pipeline actual (no se toca la lógica base)

`fetch-book_v2.js` (Node, service-role) baja datos + descarga imágenes a carpetas locales
y escribe `data/book.<names>.json`. `generate-book_v20.jsx` lee ese JSON y coloca cada
imagen **buscando un marco por etiqueta** (`{{IMAGE}}`, `{{COUPLE_IMAGE}}`, `{{ORIGINAL_IMAGE}}`…)
que el operador dibuja y dimensiona en el `.indd`. El script **nunca calcula coordenadas**;
solo rellena marcos existentes con `place()` + `fit()`. Regla dura: **NUNCA tocar
`allowPageShuffle`** (rebalancea todo el documento).

## Decisiones

- **Versionado nuevo** (no editar prod): `fetch-book_v3.js` (copia de v2 + firma) y
  `generate-book_v21.jsx` (copia de v20 + firma). Pipeline nuevo = **v3 → v21**; el viejo
  (v2 → v20) queda intacto como fallback. Ambos son compatibles cruzados (v3→v20 ignora la
  clave extra; v2→v21 simplemente no encuentra firma y no hace nada).
- **Ubicación**: abajo a la derecha de la página de receta (mismo lenguaje visual que el
  review web y el modal). Marco ~7×1.5 cm.
- **Archivo**: PNG transparente, negro (#1a1a1a) sobre alpha. A 1600px en 7cm ≈ 580 DPI.

## Fase 1 — Data + script (esta entrega)

### `fetch-book_v3.js` (copia de `fetch-book_v2.js` + cambios)
- Agregar `signature_url` al `select` de `guest_recipes`.
- Nueva subcarpeta `image_assets/${GROUP_ID}/signatures/` (lazy).
- Por receta, **solo si** `recipe.signature_url`: descargar a `signatures/${recipe.id}.png`
  y setear `transformed.signature_image_path = "image_assets/${GROUP_ID}/signatures/${recipe.id}.png"`
  (relativo, como el resto). Si no hay firma, **omitir la clave** (cero-regresión, JSON
  idéntico al viejo). Cola de descarga guardada, mirror del patrón de anexo (PASO 5b).
- Descarga tolerante a fallos (mismo `downloadImage` + try/catch por asset): si falla, se
  omite la firma, la receta sigue.

### `generate-book_v21.jsx` (copia de `generate-book_v20.jsx` + cambios)
- `CONFIG.signatureImageLabel = "{{SIGNATURE}}"` (junto a las otras etiquetas ~líneas 91-109).
- Nuevo helper `placeSignatureInSpread(spread, recipe, basePath)` modelado en
  `placeImageInSpread` (líneas 1041-1067) pero:
  - `fit(FitOptions.PROPORTIONALLY)` + `fit(FitOptions.CENTER_CONTENT)` (imagen completa,
    nunca recorta), **sin** `sendToBack()` (la firma va encima).
  - Triple guarda → `return false` limpio: sin `recipe.signature_image_path`, sin archivo
    en disco, o sin marco `{{SIGNATURE}}` en el spread. Cero errores.
- Llamada dentro de `processRecipeOnTemplate` (línea ~208), **antes** de `recompose()`, para
  que caiga en el template que gane la cascada A → A-INGREDIENTS → B → C.
- No se toca paginación, spreads, Originals, ni `allowPageShuffle`.

**Importante**: como los templates aún no tienen el marco `{{SIGNATURE}}` (eso es Fase 2),
v21 queda **listo pero visualmente inerte** hasta la Fase 2. Es el mismo modelo de todas las
imágenes del libro. Se puede probar agregando el marco a **un** template primero.

## Fase 2 — InDesign templates (siguiente entrega)

- En los **4 templates de receta** (A, A-INGREDIENTS, B, C) del master, dibujar un marco
  ~7×1.5 cm etiquetado `{{SIGNATURE}}`, abajo a la derecha, dentro de márgenes (fuera del
  bleed), sin colisionar con texto/imagen/footer.
- Con eso, v21 lo rellena solo. Recetas sin firma dejan el marco vacío (invisible).

## Edge cases (cubiertos)
- Receta sin firma (vieja o saltada) → clave omitida en JSON → helper no hace nada. ✓
- `signature_url` roto/borrado → descarga falla → se omite, receta sigue. ✓
- Template sin marco (master viejo) → helper no encuentra frame → no-op. ✓
- Firma presente en cualquiera de los 4 templates → la llamada vive en `processRecipeOnTemplate`. ✓

## Nota de impresión (diferida, no bloquea)
El trazo es #1a1a1a RGB; al convertir a CMYK puede volverse negro "rico". En líneas finas
eso puede dar leve halo de registro. Para una firma chica suele verse bien; si se nota, se
fuerza negro K puro en el export/manejo de color. Anotado para después.

## Verificación (Fase 1)
Como es InDesign (fuera de la app), la verificación es manual por el operador:
1. Correr `fetch-book_v3.js` para un grupo con al menos una receta firmada → confirmar que
   se creó `image_assets/<group>/signatures/<recipeId>.png` y que el JSON trae
   `signature_image_path` en esa receta (y NO en las sin firma).
2. (Para ver algo) agregar el marco `{{SIGNATURE}}` a un template y correr `generate-book_v21.jsx`
   → la firma cae en el marco; recetas sin firma dejan el marco vacío; cero errores en consola.
3. Confirmar que un grupo SIN ninguna firma genera igual que con v20 (cero-regresión).
