# Originals — Marcador de revisión en la lista del libro

**Fecha:** 2026-06-19
**Estado:** Diseño aprobado (pendiente de plan de implementación)
**Branch:** `feature/originals-annex` (misma del feature Originals)
**Relación:** Complemento de UX al feature Originals (ver `2026-06-15-originals-annex-design.md`). No toca el pipeline de upscale (M2) ni InDesign (M4).

---

## 1. Problema y oportunidad

La selección de originals (M1) es **manual** y se hace receta por receta dentro de `BookReviewOverlay`. Pero desde la vista de lista del libro (`BookDetailSheet`, `/admin/books`) **no hay forma de saber qué recetas traen una foto del invitado que valga la pena mirar**. El riesgo concreto, en palabras del fundador:

> "No sé cuál exactamente tiene una imagen como anexo… me preocupa que se haga rápido la revisión y sin querer se me escape revisar una imagen que valga la pena. Quiero que siempre, al menos, se revise rápido cuando haya una imagen, para que nunca se me pase o se le olvide a mi equipo."

**La oportunidad:** convertir la lista del libro en un **checklist visual** que distinga, por receta, tres estados respecto a originals — de forma que ninguna receta con foto se pase sin que alguien la mire. Sin agregar estado nuevo en la base de datos.

---

## 2. Principios y restricciones

- **Cero cambios en DB/API.** El GET del libro (`/api/v1/admin/books/[groupId]`) ya expone `annex_source_urls` por receta (M1, Task 4) y la lista ya recibe `document_urls`/`image_url`. Esto es **solo front-end** + un helper puro.
- **Reutilizar antes de crear:** apoyarse en `isAnnexEligibleUrl` (M1, `lib/annex/selection.ts`) y en el cluster de badges existente de `RecipePreviewCard`.
- **YAGNI:** v1 = marcador visual (opción "A" de la lluvia de ideas). NO tracking explícito de "revisada y descartada" (opción "C"), NO gate forzado en el review (opción "B"). Esos quedan como evolución futura si el marcador no basta.
- **Sin dependencias nuevas. No `any`. Archivos < 300 líneas. Sin console.log en producción.**
- **Copy:** UI admin interna (exenta del sistema tipográfico de marketing). Texto en español, claro y corto.

---

## 3. Decisiones cerradas (resumen)

| Decisión | Resultado |
|---|---|
| Dónde se muestra | Lista del libro: indicador por fila (`RecipePreviewCard`) **+** contador resumen arriba (`BookDetailSheet`) |
| Tri-estado por receta | sin foto · foto sin revisar · con original |
| Tono visual | **Alarma ámbar** para "foto sin revisar"; verde para "con original" |
| Qué cuenta como "foto" | ≥1 imagen raster (jpg/png/webp/gif) del invitado en `document_urls`/`image_url`. PDF **no** cuenta; imagen generada por IA **no** cuenta |
| Estado "selected" | cualquier receta con ≥1 imagen marcada como original → verde (cuenta como revisada) |
| Datos | sin DB/API nueva; usa `annex_source_urls` (M1) + `document_urls`/`image_url` |

---

## 4. Tri-estado (la regla)

Por cada receta, derivar exactamente uno de tres estados:

```
eligible = imágenes raster del invitado (document_urls + image_url, filtradas por isAnnexEligibleUrl)
selected = annex_source_urls de la receta (las ya marcadas como original)

estado:
  'none'        si eligible.length === 0           → (sin indicador)
  'selected'    si selected.length  >= 1           → 🟢  "✓ {selected.length} original"
  'unreviewed'  si eligible.length >= 1 && selected.length === 0  → 🟡  "⚠ Foto sin revisar"
```

Notas:
- Una receta con 2 fotos y solo 1 marcada → `selected` (verde "✓ 1 original"). El marcador rastrea **receta**, no foto-por-foto (límite consciente de v1).
- Una receta con foto que el equipo decidió **no** incluir se queda en `unreviewed` (ámbar). Es el precio de no llevar tracking explícito; aceptado en v1.

---

## 5. Arquitectura por pieza

### Pieza 1 — Helper puro (`lib/annex/selection.ts`)

Extender el archivo existente de M1 con dos funciones puras testeables:

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

/** Tri-state for the book-list marker: does this recipe still need an originals look? */
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

Tests (Jest): `none` sin fotos; `unreviewed` con foto y 0 marcadas; `selected` con ≥1 marcada; PDF no cuenta como elegible; `image_url` legacy como fallback.

### Pieza 2 — Indicador por fila (`RecipePreviewCard.tsx`)

- Extender la interfaz local `RecipeData` con `document_urls: string[] | null` y `annex_source_urls?: string[]` (hoy solo trae `image_url`).
- Calcular `annexRowState(recipe.document_urls, recipe.image_url, recipe.annex_source_urls)`.
- Renderizar un pill en el cluster de badges existente (mismo patrón `text-[10px] px-1.5 py-0.5 rounded shrink-0`):
  - `unreviewed` → ámbar: `⚠ Foto sin revisar` (p.ej. `bg-amber-100 text-amber-700 border border-amber-300`).
  - `selected` → verde: `✓ {selectedCount} original` (p.ej. `bg-emerald-100 text-emerald-700`).
  - `none` → no renderizar nada.

### Pieza 3 — Contador resumen (`BookDetailSheet.tsx`)

- Extender la `RecipeData` local con `annex_source_urls` (el GET ya lo manda; `document_urls`/`image_url` ya están en esta interfaz).
- Calcular sobre `detail.recipes` con un reduce que use `annexRowState`:
  - `withPhoto` = recetas con `state !== 'none'`
  - `withOriginal` = `state === 'selected'`
  - `unreviewed` = `state === 'unreviewed'`
- Renderizar una línea resumen arriba de la sección de recetas (junto al título "Recipes"/encabezado de la `Section`):
  `📷 {withPhoto} con foto · ✓ {withOriginal} con original · ⚠ {unreviewed} sin revisar`
  - El segmento `⚠ … sin revisar` en ámbar cuando `unreviewed > 0`; en gris/oculto cuando es 0.

---

## 6. Garantías de cero-riesgo

- **Solo lectura/derivación:** ningún write nuevo; no toca recetas, ni originals, ni el pipeline.
- **Libro sin fotos:** todas las recetas en `none` → no aparece ningún pill; el contador muestra 0/0/0 (o se oculta).
- **Consistencia con el overlay:** al marcar/desmarcar en `BookReviewOverlay` y refrescar la lista, el estado del pill cambia (el GET trae `annex_source_urls` actualizado).

---

## 7. Límites conscientes (v1)

- No distingue "no revisada" de "revisada y descartada": una receta con foto no incluida sigue ámbar.
- No rastrea foto-por-foto: marcar 1 de N pone la receta en verde.
- No fuerza nada en el flujo de review (eso sería opción B).
- El contador/pills se actualizan al refrescar la lista, no en tiempo real mientras el overlay está abierto (al cerrar el overlay la lista ya se recarga).

---

## 8. Fuera de alcance

- Tracking explícito "revisada para originals" (opción C).
- Gate/auto-apertura del panel de foto en el review (opción B).
- Indicadores dentro del `BookReviewOverlay` (la foto + toggle ya están ahí).

---

## 9. Copy (admin interno, español)

- Pill sin revisar: `⚠ Foto sin revisar`
- Pill con original: `✓ {n} original`
- Contador: `📷 {x} con foto · ✓ {y} con original · ⚠ {z} sin revisar`

---

## 10. Verificación

Screenshot del fundador de la lista del libro mostrando los tres estados (una receta sin foto sin pill, una ámbar "Foto sin revisar", una verde "✓ 1 original") y el contador resumen arriba.
