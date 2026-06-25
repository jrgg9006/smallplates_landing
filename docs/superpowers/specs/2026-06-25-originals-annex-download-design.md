# Originals — Descargar los originals ya escalados

**Fecha:** 2026-06-25
**Estado:** Diseño aprobado (pendiente de plan de implementación)
**Branch:** `feature/originals-annex`
**Relación:** Complemento de M2. Hoy las imágenes upscaleadas viven en Storage (`print_url`) sin forma de obtenerlas desde el front. Esto agrega un botón para descargarlas en zip. No toca M3 (pipeline) ni M4 (InDesign).

---

## 1. Problema

Tras "Upscale originals", cada foto marcada queda escalada en Storage (`recipe_annex_images.print_url`, `upscale_status='ready'`). Pero **no hay forma de bajarlas desde el admin** — solo viven en la base/Storage. El fundador quiere poder descargarlas:

> "Un espacio para poder descargar las originals ya upscaleadas, porque desde el front-end no hay forma de obtenerlas. Un botón simple de download originals enlarged (solo las ya escaladas/grandeadas)."

**Objetivo:** un botón que arme un zip con las originals **ya escaladas** del libro y lo descargue.

---

## 2. Principios y restricciones

- **Reutilizar:** el patrón de zip del `GET /api/v1/admin/books/[groupId]/package` (usa `archiver`, baja imágenes en lotes a memoria, arma el zip de una). `archiver` ya es dependencia.
- **Solo las `ready`:** únicamente filas con `upscale_status='ready'` y `print_url`. Las pendientes/error/descartadas no entran.
- **Cero cambios en DB.**
- **Sin dependencias nuevas. No `any`. Archivos < 300 líneas. Sin console.log en producción.**
- **Copy (admin interno, español).**

---

## 3. Decisiones cerradas (resumen)

| Decisión | Resultado |
|---|---|
| Qué se descarga | Solo originals con `upscale_status='ready'` (su `print_url`) del libro |
| Formato | Un `.zip` armado en memoria con `archiver` |
| Nombres en el zip | `{Receta}_{Invitado}.png`; varias por receta → `_2`, `_3` por `position` |
| Dónde | Botón "Descargar originals" en `BookDetailSheet`, junto a "Upscale originals" |
| Visibilidad | Solo cuando hay ≥1 original `ready` (`annexCounts.ready > 0`) |
| Selección parcial | No: baja todas las escaladas del libro |

---

## 4. Arquitectura por pieza

### Pieza 1 — Ruta `GET /api/v1/admin/books/[groupId]/annex/download`

Espejo reducido del `/package`:

1. `requireAdminAuth`; `createSupabaseAdminClient`.
2. Cargar filas: `recipe_annex_images` del `group_id` con `upscale_status='ready'` y `print_url not null`, ordenadas por `recipe_id, position`.
3. Si no hay → `400 { error: 'No hay originals procesados para descargar' }`.
4. Resolver nombres: query a `guest_recipes` (+ `recipe_print_ready`, `guests`) para los `recipe_id` del set → mapa `recipe_id → { name, guest }` (preferir `recipe_name_clean`; invitado = `printed_name` o `first+last`). Para el nombre del zip, leer `couple_display_name`/`print_couple_name` del grupo.
5. Construir el nombre de archivo por fila con un helper puro (ver Pieza 3): `{safeRecipe}_{safeGuest}.png`, con sufijo `_{n}` cuando la misma receta tiene varias (orden por `position`).
6. Descargar cada `print_url` en lotes (BATCH_SIZE=10, `Promise.allSettled`, timeout 30s) a memoria — mismo patrón que `/package`.
7. Armar el zip con `archiver` (PassThrough → Buffer) y devolverlo con `Content-Type: application/zip` y `Content-Disposition: attachment; filename="SmallPlates_Originals_{pareja}.zip"`.
8. `export const maxDuration = 300;` (como `/package`).

Notas:
- Extensión: `print_url` siempre es `.png` (lo sube el Edge Function), pero derivar la extensión de la URL con fallback `png`.
- Una descarga que falle (`print_url` inalcanzable) se omite del zip (no rompe el resto), igual que `/package`.

### Pieza 2 — Botón en `BookDetailSheet`

- Junto al botón "Upscale originals", añadir **"Descargar originals"** (ícono `Download` de lucide).
- **Visible solo cuando `annexCounts.ready > 0`.**
- Estado `downloadingOriginals`: al click, `fetch` a la ruta → `blob` → `URL.createObjectURL` → `a.click()` (mismo patrón que tenía el viejo "Download Book Package"). Mientras: `Generando…` + spinner, botón deshabilitado. En error: `alert` con el mensaje.

### Pieza 3 — Helper puro de nombres (TDD)

En `lib/annex/selection.ts` (o un archivo hermano), una función pura testeable:

```
annexDownloadFilename(recipeName: string, guestName: string, dupIndex: number): string
```

- Sanitiza receta e invitado (quita caracteres raros, espacios → `-` o `_`), une con `_`.
- `dupIndex === 0` → sin sufijo; `>0` → `_${dupIndex+1}`.
- Siempre termina en `.png`.

Esto aísla la única lógica con ramas (sanitización + sufijo de duplicados) en algo testeable; la ruta queda como orquestación.

---

## 5. Garantías y límites

- **Cero riesgo:** solo lectura + zip en memoria; no escribe nada.
- **Solo `ready`:** lo demás no tiene `print_url`, así que no puede colarse una imagen sin escalar.
- **Sin estado nuevo en DB.**
- **Límite (v1):** descarga todo el libro (sin selección parcial); no incluye descartadas ni no marcadas; no hay descarga por receta individual.

---

## 6. Fuera de alcance

- Selección parcial / descarga por receta.
- Incluir las originals sin escalar (crudas).
- Descargar también el JSON o el resto del paquete (eso ya lo hace `/package`).

---

## 7. Copy (admin interno, español)

- Botón: `Descargar originals` / `Generando…`
- Error sin escaladas: `No hay originals procesados para descargar`
- Nombre del zip: `SmallPlates_Originals_{pareja}.zip`

---

## 8. Verificación

Screenshot del fundador: con ≥1 original `ready`, aparece "Descargar originals"; al darle, baja un zip cuyas imágenes se llaman `{Receta}_{Invitado}.png` y son las versiones grandes (alta resolución). Si no hay ninguna escalada, el botón no aparece.
