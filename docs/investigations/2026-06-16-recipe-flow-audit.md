# Auditoría pre-producción — Flujo de recetas (clean version)

**Fecha:** 2026-06-16
**Rama:** `feature/clean-version-dashboard`
**Alcance:** cómo llega una receta, cómo se muestra, cómo se edita y cómo se guarda.

---

## Veredicto (TL;DR)

✅ **El flujo de recetas que tocamos está sólido y listo.** Build de producción pasa (exit 0), `tsc` y lint limpios, cada cambio fue revisado (spec + calidad), y el **intake/limpieza NO se tocó** (sigue igual que hoy).

⚠️ **PERO no mandes la rama tal cual sin decidir 2 cosas:**
1. La rama **mezcla el trabajo del Anexo M1** (no revisado en esta auditoría). Mergear esta rama = mandar también eso.
2. Hay **imágenes borradas** sin commitear en el árbol (no rompen nada, pero hay que decidir).

---

## Lo que cambiamos (mi feature)

| Archivo | Qué hace |
|---|---|
| `lib/recipes/cleanVersionState.ts` (+test) | Lógica pura de estado: cleaned / processing / fallback (timeout 60s). TDD, 4/4 tests. |
| `app/api/v1/recipes/[recipeId]/clean/route.ts` | Endpoint GET/PATCH (admin client + check creador-o-miembro) para leer/escribir `recipe_print_ready` + audita en `recipe_edit_history`. |
| `components/profile/recipes/RecipeDetailsModal.tsx` | 3 estados, fetch/polling, **siempre guarda en print_ready** (nunca el original), label dinámico, (i) explicativo, dropdown, etc. |
| `lib/supabase/groupRecipes.ts` + `RecipeCardGrid.tsx` + `database.ts` | Tarjetas del dashboard muestran el título limpio (embed de print_ready, fallback al original). |

---

## Auditoría por etapa del ciclo de vida

### 1. Llega la receta (intake) — ✅ intacto
- `lib/supabase/collection.ts` crea la fila en `guest_recipes` y dispara la limpieza async (cola de imágenes / `generate-prompt` a Railway). **No lo tocamos.** Confirmado por `git diff` (collection, ai-engine, image_processing_queue, midjourney = sin cambios).
- Conclusión: la recepción de recetas se comporta exactamente igual que en producción hoy. Sin riesgo de regresión.

### 2. Limpieza automática — ✅ intacto
- Railway escribe `recipe_print_ready` (cleaning_version=2). **No lo tocamos.**
- Si la limpieza falla, no hay fila → el sistema cae al original (comportamiento de hoy, preservado).

### 3. Display en el dashboard (tarjetas) — ✅ arreglado
- Antes: la tarjeta mostraba `recipe_name` (original) → quedaba viejo tras editar.
- Ahora: `getGroupRecipes` hace embed de `recipe_print_ready`; la tarjeta prefiere `recipe_name_clean`, con fallback al original.
- **RLS:** se amplió la política SELECT de `recipe_print_ready` a miembros del grupo (policy "Group members can view group print-ready recipes", verificada activa) → dueño **y** capitanes ven el título limpio.
- Si no hay fila / RLS niega → embed devuelve null → fallback al original. **No rompe.**

### 4. Display en el modal (Recipe Details) — ✅
- 3 estados derivados de "¿existe print_ready?" + edad de la receta:
  - **cleaned:** muestra/edita la versión limpia (source of truth).
  - **processing:** spinner ~60s con polling (3s).
  - **fallback:** muestra el original editable + banner.
- Lee la versión limpia vía el endpoint server (admin client) → funciona para dueño y capitanes.

### 5. Edición y guardado — ✅
- **Siempre** guarda en `recipe_print_ready` vía el endpoint; **nunca** escribe el original (`guest_recipes`) salvo reasignar invitado (`guest_id`).
- Si la receta nunca tuvo limpia, el endpoint **crea** la fila y la marca `needs_regeneration = true` (para que Operations sepa que no pasó por IA).
- **INSERT seguro:** verifiqué los defaults de `recipe_print_ready` — las únicas columnas NOT NULL sin default (`recipe_id`, `recipe_name_clean`) siempre las provee el endpoint. No truena.
- Audita cada edición en `recipe_edit_history` (`edit_target='print_ready'`).
- Reasignar invitado: mueve contadores `recipes_received` entre invitados + registra en historial (comportamiento existente, intacto).

### 6. Review / Book production — ✅ intacto
- El flujo de Book Review ya escribía en `recipe_print_ready` (no lo tocamos). Consistente con el modal: una sola fuente de verdad para lo que se imprime.

---

## Verificaciones corridas

- ✅ **Build de producción** (`npm run build`): exit 0, sin errores, manifiesto completo.
- ✅ **`tsc --noEmit`**: limpio (corrido múltiples veces).
- ✅ **Lint** del modal: sin warnings/errores.
- ✅ **RLS** `recipe_print_ready`: SELECT (dueño + miembros), UPDATE (creador o miembro), defaults de columnas verificados.
- ✅ **Sin `console.log`** nuevos en mis archivos.
- ✅ Cada tarea pasó revisión de cumplimiento de spec + revisión de calidad (subagentes).

---

## Riesgos / decisiones ANTES de producción

1. **🔴 La rama mezcla el Anexo M1 (no auditado aquí).**
   La rama incluye commits del anexo de originales — `BookReviewOverlay.tsx`, `app/api/v1/admin/books/[groupId]/route.ts`, tipos de `database.ts`, migración `recipe_annex_images`, docs. **Si mergeas esta rama, se va también el anexo.**
   - Decidir: ¿separar el clean-version en su propio PR, o mandar todo junto?
   - Si va junto: el anexo M1 necesita su propia verificación, y confirmar que su **migración SQL ya está aplicada en la DB de prod** (si el código del anexo lee `recipe_annex_images` y la tabla no existe en prod, eso sí truena).

2. **🟡 Imágenes borradas sin commitear.** Hay `public/images/**` marcadas como borradas en el árbol. **No están referenciadas en código** (no rompen build/sitio), pero son borrados sin commitear. Decidir: restaurar (`git checkout -- public/images/`) o dejar.

3. **🟡 Estados processing/fallback sin verificación visual.** Solo se verificó visualmente el estado **cleaned** (con screenshots). Processing y fallback son lógicamente correctos y compilan, pero no se han visto en vivo. Recomendado: forzar el timeout corto 2 min y capturar ambos antes de prod.

4. **🟢 Capitanes:** cubierto por la política RLS añadida. Idealmente confirmar con una cuenta de capitán que ve el título limpio.

---

## Recomendación

El **flujo de recetas (clean version) está listo para producción** por sí mismo. Antes de desplegar:
1. Decide separar vs. juntar con el Anexo M1 (y si va junto, audita el anexo + su migración).
2. Resuelve las imágenes borradas.
3. (Opcional pero recomendado) screenshot de processing/fallback.

Nada del intake ni la limpieza cambió, así que las recetas que están entrando ahora **no corren riesgo** por estos cambios.
