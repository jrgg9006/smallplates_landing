# Originals — Botón de upscale a nivel libro + aviso antes de generar

**Fecha:** 2026-06-19
**Estado:** Diseño aprobado (pendiente de plan de implementación)
**Branch:** `feature/originals-annex`
**Relación:** Cierra el riesgo operativo del feature Originals (M2): que un original marcado se imprima sin upscale. Complementa el marcador (`...-review-marker`) y el descarte (`...-dismiss`).

---

## 1. Problema

Hoy el upscale de originals es manual y vive en el header del overlay de review. Dos problemas:

1. **Ubicación:** el botón debería estar a nivel libro (donde se genera/exporta), no dentro del overlay de cada receta.
2. **Riesgo grande:** si marcas una foto como "incluir como original" pero se te olvida correr el upscale, se imprime en baja resolución (la foto cruda del invitado) y se ve horrible. No hay nada que lo evite. En palabras del fundador:

> "Si le dimos a al menos 1 en 'incluir como original'… TIENE sí o sí que darse upscale. Siempre. Todas. Sino se van a ver horribles… que aparezca un mensaje que NO permita avanzar hacia Copy Fetch Command sin hacer upscale. Nos podemos meter en un riesgo grande innecesario."

**Objetivo:** mover el disparo del upscale al nivel del libro y avisar (no bloquear) antes de generar el libro si hay originals sin procesar.

---

## 2. Principios y restricciones

- **Reutilizar:** la ruta `POST /annex/upscale` y `GET /annex` ya existen (M2); el conteo usa `upscale_status` que ya se devuelve. Reutilizar el patrón de modal del repo (`ArchiveRecipeModal`).
- **Aviso, no bloqueo:** el fundador prefiere no tener bloqueos duros. "Copy Fetch Command" siempre se puede ejecutar; si faltan originals, sale un modal de confirmación con opción de avanzar igual.
- **No tocar "Move to Printed":** queda sin candado ni aviso.
- **Cero regresión:** libro sin originals marcados → ni botón ni modal; "Copy Fetch Command" se comporta como hoy.
- **Sin dependencias nuevas. No `any`. Archivos < 300 líneas. Sin console.log en producción.**
- **Copy (admin interno, español).**

---

## 3. Decisiones cerradas (resumen)

| Decisión | Resultado |
|---|---|
| Ubicación del botón | Barra inferior del `BookDetailSheet`, **ocultando "Download Book Package"** |
| Disparo + polling | Se mueven del overlay al `BookDetailSheet` |
| Overlay | Pierde el botón del header; **conserva** los badges de status por foto |
| Garantía | **Aviso (modal), no bloqueo**, al dar "Copy Fetch Command" si hay originals no `ready` |
| "Move to Printed" | Sin cambios |
| Re-correr upscale | Solo procesa pendientes/fallidos (`null`/`error`); las `ready` no se re-tocan (ya es así) |

---

## 4. Definición de "no listo"

Un original marcado está "no listo" si su fila en `recipe_annex_images` tiene `upscale_status` distinto de `'ready'` (es decir `null` | `pending` | `processing` | `error`).

```
selectedOriginals = filas de recipe_annex_images del grupo
notReady = selectedOriginals.filter(s => s.upscale_status !== 'ready')
```

El botón y el aviso se basan en `notReady.length`.

---

## 5. Arquitectura por pieza

### Pieza 1 — Botón "Upscale originals" en `BookDetailSheet`

- Quitar el botón **"Download Book Package"** (bloque `currentStatus === 'ready_to_print'` que llama a `/package`).
- Añadir botón **"Upscale originals"**, visible cuando `selectedOriginals.length > 0`:
  - `notReady > 0` y sin procesar → `Upscale originals ({notReady})`.
  - procesando → `Procesando… ({ready}/{total})` (deshabilitado, spinner).
  - todos `ready` → `✓ Originals listos` (deshabilitado, verde).
  - con error → el conteo de `notReady` incluye los `error`; al click reintenta (la ruta solo re-encola `null`/`error`).
- Click → `POST /api/v1/admin/books/[groupId]/annex/upscale` → arranca polling.

### Pieza 2 — Estado + polling en `BookDetailSheet`

- Cargar las filas de anexo del libro vía `GET /api/v1/admin/books/[groupId]/annex` al abrir el detalle y tras disparar el upscale.
- Polling cada 2s (máx 90s) mientras haya filas `pending`/`processing`; se detiene cuando todas son terminales (`ready`/`error`). Mismo patrón que el overlay (M2) y `/admin/operations`.
- Derivar `selectedCount`, `readyCount`, `notReadyCount`, `processingCount` para el botón y el aviso.

### Pieza 3 — Aviso (modal) en "Copy Fetch Command"

- El handler de "Copy Fetch Command" deja de copiar directo. Nuevo comportamiento:
  - Si `notReadyCount === 0` → copia el comando igual que hoy.
  - Si `notReadyCount > 0` → abre un **modal de advertencia** (estilo `ArchiveRecipeModal`):
    - Título: `Originals sin procesar`
    - Cuerpo: `Hay {notReadyCount} foto(s) marcada(s) como original que todavía no pasaron por upscale (alta resolución). Si generas el libro ahora, esas imágenes saldrán en baja calidad o no se incluirán. Te recomiendo correr "Upscale originals" antes.`
    - Botones: `Cancelar` (cierra) · `Avanzar de todos modos` (copia el comando y cierra).
- "Move to Printed" no se toca.

### Pieza 4 — Limpieza del overlay (`BookReviewOverlay`)

- Quitar el botón "Upscale originals" del header y el estado/efectos que solo le servían (`annexUpscaling`, `annexPolling`, `triggerUpscale`, los dos `useEffect` de polling, `selectedAnnexCount`).
- **Conservar** `annexStatusByUrl`, `loadAnnexStatus` (al montar) y `renderAnnexStatus` para que los badges por foto sigan mostrando "Listo para imprimir"/"Procesando"/"Error".

---

## 6. Flujo end-to-end

```
1. En el overlay marcas fotos como "Incluir como original" (status null).
2. Cierras el overlay → en el detalle del libro ves "Upscale originals (N)".
3. Click → normaliza (sharp) + upscale (Real-ESRGAN) → polling → "✓ Originals listos".
4. "Copy Fetch Command":
   - todo ready → copia directo.
   - faltan → modal "Originals sin procesar" → Cancelar / Avanzar de todos modos.
```

---

## 7. Garantías y límites

- **Aviso, no bloqueo:** el equipo siempre puede avanzar; el modal hace consciente el riesgo (la decisión es suya).
- **Sin doble costo:** re-correr solo procesa `null`/`error`.
- **Cero regresión:** sin originals marcados, nada cambia.
- **Límite (v1):** el aviso solo cuelga de "Copy Fetch Command" (el punto donde producción jala las imágenes). "Download Book Package" se oculta (no se usa); si se reactivara en el futuro, habría que ponerle el mismo aviso.

---

## 8. Fuera de alcance

- Bloqueos duros.
- Aviso en "Move to Printed".
- Upscale automático al marcar (se evaluó y se prefirió disparo manual + aviso).

---

## 9. Copy (admin interno, español)

- Botón: `Upscale originals ({n})` / `Procesando… ({x}/{y})` / `✓ Originals listos`
- Modal título: `Originals sin procesar`
- Modal cuerpo: `Hay {n} foto(s) marcada(s) como original que todavía no pasaron por upscale (alta resolución). Si generas el libro ahora, esas imágenes saldrán en baja calidad o no se incluirán. Te recomiendo correr "Upscale originals" antes.`
- Modal botones: `Cancelar` · `Avanzar de todos modos`

---

## 10. Verificación

Screenshot del fundador: (1) el botón "Upscale originals (N)" en la barra del libro, su transición a "✓ Originals listos"; (2) el modal de advertencia al dar "Copy Fetch Command" con originals sin procesar, y que "Avanzar de todos modos" copia el comando.
