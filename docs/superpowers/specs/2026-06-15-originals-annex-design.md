# Originals — Anexo de fotos/notas originales en el cookbook

**Fecha:** 2026-06-15
**Estado:** Diseño aprobado (pendiente de plan de implementación)
**Branch sugerido:** `feature/originals-annex`

---

## 1. Problema y oportunidad

Cuando los invitados comparten recetas, la mayoría sube **imágenes**, y muchas son **notas escritas a mano** (la receta que la abuela escribió hace años, guardada en un cajón). Hoy ese material tiene un peso emocional enorme que **estamos desaprovechando**: el pipeline extrae el texto de la imagen, lo limpia y lo estandariza en el libro, pero **la imagen original nunca se muestra**.

No todas las imágenes valen la pena (a veces es el screenshot de una receta del NYT, o la foto de una revista — nada emocional). Solo **algunas**.

**La oportunidad:** seguir operando exactamente igual que hoy (texto limpio y estandarizado en cada receta), pero **adicionalmente** imprimir las fotos originales que pesan, tal cual se ven, en una sección **"Originals"** al final del libro — con referencia cruzada automática en ambos sentidos.

Brand: *cool afuera, emocional adentro*. La sección "Originals" es "the afterward".

---

## 2. Principios y restricciones

- **No cambiar nada del flujo actual de recetas.** El texto limpio y estandarizado se mantiene idéntico.
- **Cero regresión:** un libro sin originals debe generar exactamente el mismo resultado que hoy (mismo JSON, mismo PDF).
- **Reutilizar antes de crear:** apoyarse en lo ya construido (BookReviewOverlay, motor de upscale, sharp, polling de Operations).
- **v1 = 100% manual.** El equipo decide a ojo qué imágenes valen la pena. La arquitectura deja espacio para una "sugerencia AI" futura sin rehacer nada.
- **Versionado de InDesign:** nunca se toca `generate-book_v16.jsx`; se crea `generate-book_v17.jsx`.
- **Supabase:** todo cambio de DDL se entrega como SQL en bloque para correr manualmente (no migraciones destructivas vía MCP).

---

## 3. Decisiones cerradas (resumen)

| Decisión | Resultado |
|---|---|
| Dónde se selecciona | `BookReviewOverlay` (`/admin/books`), toggle por imagen |
| Ubicación en el libro | Sección **"Originals"**, **después de "Items that stay"** → recetas y TOC sin moverse |
| Referencia cruzada | **Número de página exacto**, en ambos sentidos, calculado en una pasada final dentro del `.jsx` |
| Layout del anexo | **Una imagen por página**, con pie automático |
| Modelo de datos | Tabla hija **`recipe_annex_images`** (una fila por imagen) |
| Upscaling | Edge Function gemelo **`upscale-annex-image`** (Replicate Real-ESRGAN 4x), disparo por botón, polling |
| Normalización de formato | **`sharp`** server-side (cualquier formato → PNG) antes de Replicate; PDF fuera de v1 |
| Selección automática (AI) | **Fuera de v1** (manual) |

---

## 4. Flujo end-to-end

```
1. SELECCIÓN  (BookReviewOverlay, manual)
   admin marca foto como "original"  →  fila en recipe_annex_images (status=null)

2. NORMALIZACIÓN + UPSCALE  (botón "Upscale originals")
   ruta server normaliza con sharp (→ PNG limpio) y guarda original_url normalizado
   → webhook en recipe_annex_images → Edge Function upscale-annex-image
   → Replicate Real-ESRGAN 4x → escribe print_url + upscale_status + image_dimensions
   → el front hace polling de upscale_status (mismo patrón que Operations)

3. PACKAGE / FETCH
   package route + fetch-book.js bajan print_url (fallback original_url)
   → image_assets/{groupId}/annex/{recipeId}_{n}.png
   → agregan "annex_images" por receta al JSON

4. INDESIGN  (generate-book_v17.jsx, gated)
   recetas igual que hoy → "Items that stay" → sección "Originals" (1 img/página)
   → pasada final lee números de página reales y rellena:
       · footer izq de la receta:  "My Chicken Paste — Original note on p.82"
       · pie en la página Originals: "Pollo de la abuela · by María · p.14"
```

---

## 5. Arquitectura por pieza

### Pieza 1 — Base de datos: `recipe_annex_images`

Tabla hija nueva, una fila por imagen seleccionada como original.

```
recipe_annex_images
  id               uuid    PK   default gen_random_uuid()
  recipe_id        uuid    FK → guest_recipes(id) ON DELETE CASCADE, NOT NULL
  group_id         uuid    (denormalizado para filtrar/fetch por libro), NOT NULL
  source_url       text    NOT NULL   -- la entrada original de document_urls que el admin eligió
  original_url     text               -- el PNG normalizado (lo escribe la ruta de normalización)
  print_url        text               -- la versión escalada (la escribe el Edge Function)
  upscale_status   text               -- null | 'pending' | 'processing' | 'ready' | 'error'
  image_dimensions jsonb              -- {width,height,original_width,original_height,upscaled,upscale_factor} o {error}
  position         int     NOT NULL default 0   -- orden dentro de la receta y del anexo
  created_at       timestamptz NOT NULL default now()
  updated_at       timestamptz NOT NULL default now()

  UNIQUE (recipe_id, source_url)   -- idempotencia: no duplicar la misma imagen
```

**Índices:** `(group_id)`, `(recipe_id)`.

**RLS:** solo admin (service role / email admin) puede SELECT/INSERT/UPDATE/DELETE. Sin acceso público ni anónimo. Mismo criterio que el resto de tablas admin-only.

**Notas:**
- `source_url` = lo que el admin tocó. `original_url` = PNG normalizado (input limpio para Replicate). `print_url` = salida del upscale. El pipeline usa `print_url` con fallback a `original_url`.
- `ON DELETE CASCADE`: si la receta se borra (hard delete), sus originals se van con ella. El soft-delete de recetas (`deleted_at`) no borra filas, pero el fetch ya filtra recetas activas, así que un original de receta archivada simplemente no entra al libro.

**Entrega:** SQL en bloque para correr manual (DDL + RLS + índices).

---

### Pieza 2 — Edge Function `upscale-annex-image` + webhook

Gemelo de la Edge Function existente `upscale-image`, adaptado a la tabla nueva.

**Diferencias respecto a `upscale-image`:**
- Disparada por **Database Webhook sobre `recipe_annex_images`** (UPDATE cuando `upscale_status` pasa a `'pending'`, o el patrón que el plan defina).
- Lee `record.id` y `record.original_url` (el PNG normalizado — input limpio garantizado).
- Mismo motor: Replicate, modelo Real-ESRGAN versión `f121d640bd286e1fdc67f9799164c1d5be36ff74576ee11c803ae5b665dd46aa`, `scale: 4`, `face_enhance: false`.
- Sube el PNG escalado a `recipes` en path `print/annex/{groupId}/{recipeId}_{position}.png`.
- Escribe de vuelta en la fila: `print_url`, `upscale_status` (`processing`→`ready`/`error`), `image_dimensions`.

**Reusar tal cual:** `callReplicate`, `extractStoragePath`, `readImageDimensions`, manejo de errores (status `error` + `image_dimensions:{error}`).

---

### Pieza 3 — Admin API

Tres responsabilidades; reutilizar rutas existentes donde se pueda.

1. **Marcar / desmarcar una imagen como original**
   - Extiende el `PATCH /api/v1/admin/books/[groupId]` existente (ya maneja review de recetas) **o** ruta dedicada `POST/DELETE /api/v1/admin/books/[groupId]/annex`.
   - Toggle ON → INSERT en `recipe_annex_images` (idempotente vía UNIQUE). Toggle OFF → DELETE de la fila.

2. **Normalizar + disparar upscale (botón "Upscale originals")**
   - Ruta server (Node, sharp disponible). Para cada fila `pending`/sin `original_url` del libro:
     - Baja `source_url`, corre `sharp` → PNG, sube como `original_url` (path `print/annex/{groupId}/{recipeId}_{position}_src.png` o convención que el plan fije).
     - Marca `upscale_status='pending'` → dispara el webhook → Edge Function.
   - Excluir PDFs (no elegibles) y formatos que sharp no decodifique → `upscale_status='error'`.

3. **Polling de status**
   - GET que devuelve las filas `recipe_annex_images` del libro con su `upscale_status`/`print_url`. El front hace polling cada 2s (reusar el patrón de `/admin/operations`).

---

### Pieza 4 — Admin UI (`BookReviewOverlay`)

El overlay ya revisa receta por receta y ya muestra la foto original (toggle "P", que lee `document_urls`).

- **Toggle por imagen:** "Include as original". Si la receta trae N fotos, se ven las N y se marcan las que pesen. Solo imágenes (jpg/png/webp); PDFs no son elegibles.
- **Indicador de status por imagen:** `pending`/`processing`/`ready`/`error` (reusar el patrón visual de Operations).
- **Botón "Upscale originals"** (a nivel libro): dispara la pieza 3.2 para todas las marcadas; el front entra en polling hasta estado terminal.
- (Opcional, fase posterior) reflejar conteo de originals en `BookDetailSheet`.

---

### Pieza 5 — Pipeline (`package` route + `fetch-book.js`)

- Por cada receta con filas en `recipe_annex_images` (`upscale_status='ready'`), bajar `print_url` (fallback `original_url`) a `image_assets/{groupId}/annex/{recipeId}_{position}.png`.
- Agregar al JSON, por receta, un bloque nuevo:
  ```json
  "annex_images": [
    { "local_image_path": "image_assets/.../annex/{recipeId}_0.png", "position": 0 }
  ]
  ```
- **Garantía de cero-regresión:** si ninguna receta tiene originals, el JSON es **idéntico** al de hoy (no se agrega la clave, o se agrega vacía sin efectos en v16/v17).

---

### Pieza 6 — InDesign `generate-book_v17.jsx`

Copia completa de `v16` (regla de versionado), con dos añadidos. **`v16` no se toca.**

**Gate de cero-regresión:** al inicio, detectar si algún recipe tiene `annex_images`. Si no hay → comportamiento **idéntico a v16** (no genera sección, no toca footers).

**A. Sección "Originals" (después de "Items that stay")**
- Las recetas se siguen moviendo BEFORE "Items that stay" (igual que hoy) → numeración y TOC de recetas **idénticos**.
- La sección "Originals" se genera **al final de todo** (después de "Items that stay"), reutilizando el patrón de duplicar template AT_END + mover a posición.
- **Una imagen por página**, pie automático: `{recipe_name} · by {guest_name} · p.{página de la receta}`.
- Si una receta tiene varias originals → páginas consecutivas; el footer de la receta apunta a la **primera**.

**B. Pasada final de números de página**
- Mantener un mapa `recipeId → spread de receta` (extender el `generatedSpreads[]` que ya existe) y `recipeId → spread(s) de Originals`.
- **Hasta el final de todo** (después de mover spreads, borrar templates, quitar blank, recalcular TOC y limpiar INDEX_OVERFLOW — cuando la numeración ya es estable), leer `spread.pages[0].name` de cada lado y rellenar:
  - Footer izquierdo de la receta (frame label `originalNoteFooter`): `{recipe_name} — Original note on p.{página de Originals}`. Solo si la receta tiene originals.
  - Pie de la página Originals: incluir `p.{página de la receta}`.

**Trabajo de diseño en el `.indd` (fuera de código):**
- Crear el **template del spread "Originals"** (marco de imagen + marco de pie), con estilos de párrafo que **el TOC NO levante** (para no contaminar el índice).
- Agregar el frame con label **`originalNoteFooter`** en el footer **izquierdo** de los 4 templates de receta (A, A-INGREDIENTS, B, C), vacío por default.

---

## 6. Garantías de cero-riesgo

- **Recetas intactas:** "Originals" va al final → numeración y TOC de recetas idénticos a hoy.
- **Gate total:** libro sin originals → JSON idéntico + v17 corre exacto como v16.
- **Versionado:** v16 nunca se toca; v17 es aislado.
- **Upscale aislado:** tabla + Edge Function propios; no tocan el flujo de recetas ni sus columnas.
- **Input limpio a Replicate:** normalización con sharp antes del upscale.

---

## 7. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Formato de origen (webp/gif/HEIC) | Normalización server-side con `sharp` → PNG antes de Replicate. HEIC crudo además ya se rechaza en el upload de recetas. |
| PDF como origen | Fuera de v1: no elegible como original; el admin lo ve y lo omite. |
| Páginas Originals contaminan el TOC | Estilos de párrafo del template Originals que el TOC no incluye. |
| Referencias de página equivocadas | La pasada de números corre **al final de todo**, cuando la numeración ya es estable. Validar en libros reales. |
| Costo/páginas (una por página) | Aceptado: es "the afterward". |
| Copy del footer fuera de marca | El texto pasa por el check de tono (skill brand-guidelines) antes de fijarse. |
| Upscale falla en una imagen | `upscale_status='error'` visible en el overlay; admin reemplaza o quita. |
| Regresión en v17 | Gate + versionado + prueba en 2-3 libros reales antes de confiar. |

---

## 8. Fuera de alcance (v1)

- Selección automática / sugerencia por AI de qué imágenes son emocionales.
- PDF como origen del anexo.
- Captions manuales / edición del pie por imagen.
- Reordenar originals cross-receta (el orden lo da `position` + orden de receta).

---

## 9. Copy (borrador, sujeto a brand-guidelines)

- Footer de receta: `My Chicken Paste — Original note on p.82`
- Pie en Originals: `Pollo de la abuela · by María · p.14`

(Evitar las palabras prohibidas de marca; validar con la skill antes de fijar.)
