# TAREA: Añadir tracking de atribución a Collection Links (inviter_id)

## CONTEXTO CRÍTICO — LEER ANTES DE TOCAR NADA

Los Collection Links son el canal #1 de adquisición de Small Plates. 
Si se rompen, se rompe el negocio. Esta tarea tiene UN solo criterio 
de éxito: añadir tracking SIN tocar el flujo existente de submit de 
recetas. Si en algún momento dudas, NO ejecutes el cambio y pregunta.

## REGLAS DURAS (no negociables)

1. NO modifiques ninguna llamada a Supabase.
2. NO modifiques ninguna lógica de validación del form.
3. NO modifiques el manejo de estado del form (useState, react-hook-form, etc).
4. NO cambies firmas de funciones existentes.
5. NO toques el backend, API routes, ni edge functions.
6. NO añadas dependencias nuevas al package.json.
7. NO cambies el comportamiento cuando la URL NO trae `inviter_id` — 
   el flujo debe funcionar idéntico a hoy para ese caso.
8. Todo el código nuevo debe ser ADITIVO: solo añade, no reemplaza.
9. Si ves que un cambio requiere refactorizar algo existente, PARA y 
   avísame en vez de hacerlo.

## FASE 1 — LECTURA (no escribir nada todavía)

Lee y muéstrame en un resumen corto:

1. El archivo de la ruta `/collect/[id]` (probablemente 
   `app/collect/[id]/page.tsx` o similar). Identifica:
   - Dónde se lee la URL / searchParams
   - Dónde está el botón/acción de "Start" (empezar a añadir receta)
   - Dónde está el handler de submit de la receta
   - Dónde exactamente se confirma que el submit fue exitoso 
     (antes de router.push, antes de mostrar success UI, etc)

2. Cómo está configurado Google Analytics (buscar `gtag`, 
   `GoogleAnalytics`, `NEXT_PUBLIC_GA_ID`, o `@next/third-parties/google`). 
   Confirma que ya hay un GA ID activo en producción.

3. Si ya existe algún archivo `lib/analytics.ts` o similar. Si existe, 
   lo extenderemos; si no, lo crearemos.

Cuando tengas esto, ENSÉÑAME el resumen y espera mi confirmación 
antes de continuar a la Fase 2.

## FASE 2 — IMPLEMENTACIÓN (solo después de que yo confirme Fase 1)

### Paso 2.1 — Crear `lib/analytics.ts` (o extenderlo si existe)

Este archivo aísla TODA la lógica de tracking. Debe ser defensivo: 
ningún error aquí puede propagarse al caller.
```typescript
// lib/analytics.ts

const STORAGE_PREFIX = 'sp_inviter_';

type TrackParams = Record<string, string | number | undefined>;

/**
 * Fire-and-forget event tracking. NEVER throws, NEVER blocks.
 * Safe to call from anywhere, including SSR.
 */
export function trackEvent(name: string, params: TrackParams = {}): void {
  try {
    if (typeof window === 'undefined') return;
    const gtag = (window as any).gtag;
    if (typeof gtag !== 'function') return;
    
    // Clean undefined values
    const cleanParams: Record<string, string | number> = {};
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== '') {
        cleanParams[k] = v;
      }
    }
    
    gtag('event', name, cleanParams);
  } catch {
    // Silent fail. Tracking must never break the app.
  }
}

/**
 * Capture inviter_id and UTM params from URL, scoped by bookId.
 * Safe to call from useEffect on mount. NEVER throws.
 */
export function captureAttribution(bookId: string): void {
  try {
    if (typeof window === 'undefined') return;
    if (!bookId) return;
    
    const params = new URLSearchParams(window.location.search);
    const inviterId = params.get('inviter_id');
    const utmSource = params.get('utm_source');
    const utmMedium = params.get('utm_medium');
    const utmCampaign = params.get('utm_campaign');
    
    // Only store if we actually got something — don't overwrite with nulls
    if (inviterId || utmSource || utmMedium || utmCampaign) {
      const data = {
        inviter_id: inviterId || undefined,
        utm_source: utmSource || undefined,
        utm_medium: utmMedium || undefined,
        utm_campaign: utmCampaign || undefined,
        captured_at: Date.now(),
      };
      try {
        localStorage.setItem(STORAGE_PREFIX + bookId, JSON.stringify(data));
      } catch {
        // localStorage can throw in Safari private mode, quota errors, etc.
        // Silent fail — tracking is optional.
      }
    }
  } catch {
    // Silent fail.
  }
}

/**
 * Read stored attribution for a given bookId.
 * Returns empty object on any failure. NEVER throws.
 */
export function getAttribution(bookId: string): TrackParams {
  try {
    if (typeof window === 'undefined') return {};
    if (!bookId) return {};
    const raw = localStorage.getItem(STORAGE_PREFIX + bookId);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return {
      inviter_id: parsed.inviter_id,
      utm_source: parsed.utm_source,
      utm_medium: parsed.utm_medium,
      utm_campaign: parsed.utm_campaign,
    };
  } catch {
    return {};
  }
}
```

### Paso 2.2 — Llamar `captureAttribution` en el mount de /collect/[id]

En el componente de la página `/collect/[id]`, dentro de un `useEffect` 
que corra UNA sola vez al montar, llamar `captureAttribution(bookId)`.

NO cambies nada más del componente. Solo añade:
- El import de `captureAttribution` desde `lib/analytics`.
- Un `useEffect` nuevo (adicional, no modificar los existentes).
```typescript
useEffect(() => {
  captureAttribution(params.id); // o como se llame el bookId en scope
}, [params.id]);
```

### Paso 2.3 — Añadir tracking de `start_recipe`

Localiza el handler del botón "Start" (o equivalente). NO modifiques 
su lógica. Solo AÑADE una línea al inicio del handler:
```typescript
const handleStartRecipe = () => {
  trackEvent('start_recipe', { 
    book_id: bookId,
    ...getAttribution(bookId)
  });
  // ... TODO el código existente queda idéntico, sin cambios
};
```

### Paso 2.4 — Añadir tracking de `submit_recipe`

ESTO ES LO MÁS DELICADO. La regla:

- El `trackEvent('submit_recipe', ...)` DEBE ir DESPUÉS de la línea 
  donde se confirma que el submit a Supabase/API fue exitoso.
- DEBE ir ANTES de cualquier `router.push` o redirect (para que el 
  evento se dispare antes de que cambie la página).
- NO lo metas dentro de un `try` que pueda afectar el flujo — 
  `trackEvent` ya es try/catch internamente, no necesita envoltura.
- Si hay un `.catch()` en el submit, NO dispares el evento ahí.

Ejemplo (ajustar a la estructura real del código):
```typescript
const handleSubmit = async (data) => {
  // ... todo el código existente sin cambios ...
  const { error } = await supabase.from('recipes').insert(...);
  if (error) {
    // manejo de error existente, sin cambios
    return;
  }
  
  // 🆕 ÚNICA LÍNEA NUEVA — después del success, antes del redirect
  trackEvent('submit_recipe', { 
    book_id: bookId,
    ...getAttribution(bookId)
  });
  
  // ... router.push o lo que siga, sin cambios
};
```

## FASE 3 — VERIFICACIÓN (obligatoria antes de commit)

Antes de darme por terminado, confirma PUNTO POR PUNTO:

1. [ ] El flujo de submit de receta funciona idéntico si el guest 
      NO trae `inviter_id` en la URL. Probado mentalmente leyendo el código.
2. [ ] Si `window.gtag` no existe, NADA se rompe. `trackEvent` hace return temprano.
3. [ ] Si `localStorage` tira excepción, NADA se rompe. Todo envuelto en try.
4. [ ] `trackEvent('submit_recipe')` solo se llama en el camino de éxito, 
      nunca en el catch del submit.
5. [ ] No se tocó ninguna llamada a Supabase.
6. [ ] No se cambió ninguna firma de función existente.
7. [ ] No se añadió ninguna dependencia.
8. [ ] El diff es puramente aditivo (solo insertar líneas, no borrar ni modificar existentes — 
      excepto las líneas nuevas de `trackEvent` dentro de handlers existentes).

Muéstrame el diff completo antes de cualquier commit. No hagas push.

## FASE 4 — LO QUE YO HARÉ MANUALMENTE (no lo hagas tú)

Yo me encargo de:
- Crear la custom definition `inviter_id` en GA4 Admin.
- Crear custom definitions `utm_source`, `utm_medium`, `utm_campaign`, `book_id`.
- Marcar `submit_recipe` como conversion.
- Probar en producción con un link real.

Tú no toques nada en GA.