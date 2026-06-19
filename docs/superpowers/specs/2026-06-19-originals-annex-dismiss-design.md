# Originals — Estado "revisada, sin original"

**Fecha:** 2026-06-19
**Estado:** Diseño aprobado (pendiente de plan de implementación)
**Branch:** `feature/originals-annex`
**Relación:** Cierra la arista §7 del marcador de revisión (`2026-06-19-originals-annex-review-marker-design.md`). Es la "opción C" que se había diferido.

---

## 1. Problema

El marcador de revisión (ya implementado) tiene tres estados: sin foto, foto sin revisar (ámbar), con original (verde). Pero **no hay forma de decir "la revisé y decidí NO incluirla"**: una foto que el equipo mira y descarta se queda en ámbar para siempre, así que el contador `⚠ sin revisar` nunca baja a 0 aunque ya se haya revisado todo. En palabras del fundador:

> "Hay algunas imágenes que NO van a estar incluidas… las reviso y decido no incluirlas. No tengo ninguna forma de decir 'ok, la revisé y NO la quiero incluir'."

**Objetivo:** un cuarto estado, a nivel receta y reversible, que registre "revisada, sin original", para que el ámbar refleje solo lo que de verdad falta mirar.

---

## 2. Principios y restricciones

- **Reutilizar antes de crear:** guardar el flag en `recipe_production_status` (tabla por receta que el GET del libro **ya** trae), no en una tabla nueva. La escritura va por un `PATCH` a la ruta `/annex` que ya existe.
- **Supabase manual:** el `ALTER TABLE` de la columna nueva se entrega como SQL en bloque para correr a mano.
- **Cero regresión:** no toca el flujo de recetas, el upscale (M2) ni el pipeline. Sin la columna, todo sigue igual (default `false`).
- **YAGNI:** descarte a nivel receta (no por foto), solo en el overlay (no en la lista). Sin "razón de descarte" ni historial.
- **Sin dependencias nuevas. No `any`. Archivos < 300 líneas. Sin console.log en producción.**
- **Copy (admin interno, español):** botón `No incluir (revisada)` / `Deshacer`; pill `⊘ Revisada · sin original`.

---

## 3. Decisiones cerradas (resumen)

| Decisión | Resultado |
|---|---|
| Estado nuevo | `dismissed` ("revisada, sin original"), a nivel receta, reversible |
| Precedencia | `selected` (verde) gana sobre `dismissed`; `dismissed` solo aplica con 0 marcadas |
| Dónde se marca | Overlay de review, panel de foto, botón a nivel receta |
| Dónde se guarda | `recipe_production_status.annex_reviewed boolean default false` |
| Cómo se escribe | `PATCH /api/v1/admin/books/[groupId]/annex` con `{ recipe_id, annex_reviewed }` (upsert) |
| Alcance | Por receta (no por libro) |
| Efecto en contador | Las `dismissed` salen del `⚠ sin revisar` |

---

## 4. Los cuatro estados (la regla)

```
eligible = imágenes raster del invitado (document_urls + image_url, isAnnexEligibleUrl)
selected = annex_source_urls de la receta
dismissed = recipe_production_status.annex_reviewed === true

estado (en orden de precedencia):
  'none'        si eligible.length === 0
  'selected'    si selected.length >= 1
  'dismissed'   si dismissed === true
  'unreviewed'  en cualquier otro caso (hay foto, 0 marcadas, no descartada)
```

`selected` antes que `dismissed`: marcar una foto como original siempre gana, aunque la receta estuviera descartada.

---

## 5. Arquitectura por pieza

### Pieza 1 — Base de datos (SQL manual)

```sql
alter table public.recipe_production_status
  add column if not exists annex_reviewed boolean not null default false;
```

Sin RLS nueva (las rutas usan service-role; la tabla ya está protegida).

### Pieza 2 — GET del libro expone el flag

En `app/api/v1/admin/books/[groupId]/route.ts`:
- La query ya selecciona `recipe_production_status(...)`. Añadir `annex_reviewed` a esa selección.
- En `formattedRecipes`, junto a `annex_source_urls`, añadir `annex_reviewed: ps?.annex_reviewed ?? false`.

### Pieza 3 — `PATCH` en la ruta `/annex`

En `app/api/v1/admin/books/[groupId]/annex/route.ts`, añadir `PATCH`:
- Body: `{ recipe_id: string, annex_reviewed: boolean }`.
- Valida membresía vía `group_recipes` (mismo patrón que el `POST` existente).
- Upsert en `recipe_production_status` (`onConflict: 'recipe_id'`) con `annex_reviewed` + `updated_at`.
- Devuelve `{ success: true }`.

### Pieza 4 — Helper `annexRowState` gana el 4º estado

En `lib/annex/selection.ts`:
- `type AnnexRowState = 'none' | 'unreviewed' | 'selected' | 'dismissed'`.
- `annexRowState(documentUrls, imageUrl, annexSourceUrls, dismissed: boolean)` con la precedencia de §4. Mantener el retorno `{ state, selectedCount, eligibleCount }`.
- Actualizar los dos callers (`RecipePreviewCard`, `BookDetailSheet`) para pasar el nuevo argumento.
- Tests: `dismissed` con foto y 0 marcadas → `'dismissed'`; `selected` gana sobre `dismissed`; `dismissed=false` se comporta como antes.

### Pieza 5 — Botón en el overlay (`BookReviewOverlay`)

- `ReviewRecipe` gana `annex_reviewed?: boolean`.
- En el panel de foto (`showPhoto`), botón a nivel receta visible **solo cuando la receta tiene fotos elegibles y 0 marcadas como original**:
  - `annex_reviewed === false` → botón `No incluir (revisada)` (gris/neutro).
  - `annex_reviewed === true` → etiqueta `⊘ Revisada · sin original` + botón `Deshacer`.
- Handler: `PATCH` a `/annex` con el nuevo valor; actualiza `localRecipes` (y limpia el estado en memoria). Patrón idéntico a `toggleAnnex`.

### Pieza 6 — Pill gris en la fila (`RecipePreviewCard`)

- Recibe `annex_reviewed?: boolean` en su `RecipeData`.
- Pasa el flag a `annexRowState`.
- Render: `dismissed` → pill gris `⊘ Revisada · sin original` (`bg-gray-100 text-gray-500`). `none` sigue sin pill.

### Pieza 7 — Contador (`BookDetailSheet`)

- `RecipeData` gana `annex_reviewed?: boolean`; pasarlo al `annexRowState` del reduce.
- El reduce ya cuenta `unreviewed` solo cuando `state === 'unreviewed'`, así que las `dismissed` salen solas del `⚠ sin revisar`. Sin cambios en el copy del contador.

---

## 6. Garantías de cero-riesgo

- **Default seguro:** columna `default false` → comportamiento idéntico al actual hasta que alguien descarte algo.
- **No toca recetas ni originals:** el flag vive en `recipe_production_status`, separado de `recipe_annex_images`.
- **Reversible:** `Deshacer` regresa la receta a ámbar.
- **Consistente con el overlay:** al marcar/descartar y refrescar la lista, el pill y el contador reflejan la realidad.

---

## 7. Límites conscientes (v1)

- Descarte por receta, no por foto.
- Sin razón de descarte ni historial.
- El flag es por receta (global), no por libro: si la misma receta vive en dos libros (raro), el descarte aplica en ambos.
- Solo se marca en el overlay (no hay acción rápida en la lista).

---

## 8. Fuera de alcance

- Descarte por foto individual.
- Acción rápida de descarte desde la lista.
- Captura de "por qué" no se incluyó.

---

## 9. Copy (admin interno, español)

- Botón descartar: `No incluir (revisada)`
- Estado descartado en overlay: `⊘ Revisada · sin original` + `Deshacer`
- Pill en la lista: `⊘ Revisada · sin original`

---

## 10. Verificación

Screenshot del fundador: una receta con foto descartada se ve gris `⊘ Revisada · sin original` en la lista, sale del `⚠ sin revisar` del contador, y `Deshacer` la regresa a ámbar.
