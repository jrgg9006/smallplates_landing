# Prompt 1.3: Agregar Social Proof en Landing de Collection

## Contexto

Small Plates es una plataforma donde invitados de boda suben recetas para crear un libro colaborativo. Cuando un invitado llega a la página de collection (`/collect/[token]`), ve un mensaje personal y un formulario para buscar su nombre.

**Problema identificado:** Los invitados no saben si otros ya participaron. Es como entrar a un restaurante vacío — genera incertidumbre. No hay prueba social de que esto es algo real y activo.

**Solución:** Mostrar una línea de social proof que indique cuántas recetas ya se han enviado. Esto valida que otros ya participaron y crea momentum ("el libro se está llenando").

---

## Comportamiento

**Regla crítica sobre groupId:**
- Si hay `groupId` → Contar SOLO recetas de ese grupo
- Si NO hay `groupId` → **NO mostrar social proof** (fail safe, nunca debería pasar)

**Lógica de visualización:**

| Recetas del grupo | Qué mostrar |
|-------------------|-------------|
| 0-2 | **Nada** (evitar "restaurante vacío") |
| 3-9 | 📖 Recipes are coming in. |
| 10+ | 📖 X recipes and counting. |

---

## Archivos a Crear/Modificar

| Archivo | Acción |
|---------|--------|
| `lib/supabase/collection.ts` | Agregar función `getCollectionSocialProof` |
| `components/recipe-journey/SocialProofBanner.tsx` | **CREAR** |
| `app/(public)/collect/[token]/page.tsx` | Agregar import, estado, fetch, y render del banner |

---

## 1. MODIFICAR: lib/supabase/collection.ts

Agregar esta nueva función al final del archivo:

```typescript
/**
 * Get social proof data for a collection (recipe count for a specific group)
 * Used to show "X recipes and counting" on the collection landing page
 * 
 * IMPORTANT: groupId is required. If not provided, returns null (fail safe).
 */
export async function getCollectionSocialProof(
  groupId: string | null | undefined
): Promise<{
  data: { count: number } | null;
  error: string | null;
}> {
  // If no groupId, don't show social proof (fail safe)
  if (!groupId) {
    return { data: null, error: null };
  }
  
  try {
    const supabase = createSupabaseClient();
    
    // Count recipes for this specific group only
    const { count, error } = await supabase
      .from('guest_recipes')
      .select('*', { count: 'exact', head: true })
      .eq('group_id', groupId)
      .eq('submission_status', 'submitted');
    
    if (error) {
      console.error('Error fetching social proof:', error);
      return { data: null, error: error.message };
    }
    
    return {
      data: { count: count || 0 },
      error: null
    };
  } catch (err) {
    console.error('Error in getCollectionSocialProof:', err);
    return { data: null, error: 'Failed to fetch social proof data' };
  }
}
```

---

## 2. CREAR: components/recipe-journey/SocialProofBanner.tsx

Crear el archivo `components/recipe-journey/SocialProofBanner.tsx`:

```tsx
"use client";

import React from 'react';

interface SocialProofBannerProps {
  count: number;
}

export default function SocialProofBanner({ count }: SocialProofBannerProps) {
  // Don't render anything if fewer than 3 recipes (avoid "empty restaurant" effect)
  if (count < 3) {
    return null;
  }
  
  // Determine the message based on count
  const message = count >= 10 
    ? `${count} recipes and counting.`
    : 'Recipes are coming in.';
  
  return (
    <div className="flex items-center gap-2 mb-4">
      <span className="text-base" aria-hidden="true">📖</span>
      <span className="text-[#2D2D2D] text-sm font-medium">
        {message}
      </span>
    </div>
  );
}
```

---

## 3. MODIFICAR: app/(public)/collect/[token]/page.tsx

Este archivo requiere varios cambios pequeños:

### 3.1 Agregar import

Al inicio del archivo, agregar el import de la nueva función y componente:

**Buscar la línea:**
```typescript
import { validateCollectionToken, searchGuestInCollection } from '@/lib/supabase/collection';
```

**Reemplazar con:**
```typescript
import { validateCollectionToken, searchGuestInCollection, getCollectionSocialProof } from '@/lib/supabase/collection';
import SocialProofBanner from '@/components/recipe-journey/SocialProofBanner';
```

### 3.2 Agregar estado para social proof

Dentro del componente `CollectionForm`, después de los otros estados (cerca de `const [showNameEntry, setShowNameEntry] = useState(false);`), agregar:

```typescript
// Social proof state
const [socialProofCount, setSocialProofCount] = useState<number>(0);
```

### 3.3 Fetch social proof después de validar token

Dentro del `useEffect` que valida el token, agregar el fetch de social proof después de que el token se valida exitosamente.

**Buscar este bloque:**
```typescript
if (error || !data) {
  addDebugLog('❌ Token validation failed: ' + error);
  setError(error || 'Invalid collection link');
} else {
  addDebugLog('✅ Token validation success');
  setTokenInfo(data);
}
```

**Reemplazar con:**
```typescript
if (error || !data) {
  addDebugLog('❌ Token validation failed: ' + error);
  setError(error || 'Invalid collection link');
} else {
  addDebugLog('✅ Token validation success');
  setTokenInfo(data);
  
  // Fetch social proof data (only if groupId exists)
  if (groupId) {
    const { data: proofData } = await getCollectionSocialProof(groupId);
    if (proofData) {
      setSocialProofCount(proofData.count);
    }
  }
}
```

### 3.4 Renderizar el banner de social proof

Agregar el componente `SocialProofBanner` entre el mensaje personal y el texto "Find your name...".

**Buscar este bloque:**
```tsx
<div className="text-sm text-gray-500 mb-6">
  Find your name. Add your recipe. Done.
</div>
```

**Agregar ANTES de ese div:**
```tsx
{/* Social Proof Banner */}
<SocialProofBanner count={socialProofCount} />

<div className="text-sm text-gray-500 mb-6">
  Find your name. Add your recipe. Done.
</div>
```

---

## Estructura Visual Esperada

### Con 3-9 recetas:
```
A Personal Note:

You're adding a recipe to Ana & Pedro's wedding cookbook...

📖 Recipes are coming in.

Find your name. Add your recipe. Done.

[First initial] [Last name______] [Search]
```

### Con 10+ recetas:
```
A Personal Note:

You're adding a recipe to Ana & Pedro's wedding cookbook...

📖 12 recipes and counting.

Find your name. Add your recipe. Done.

[First initial] [Last name______] [Search]
```

### Con 0-2 recetas:
```
A Personal Note:

You're adding a recipe to Ana & Pedro's wedding cookbook...

Find your name. Add your recipe. Done.

[First initial] [Last name______] [Search]
```
(Banner no aparece)

---

## Colores de Marca (Referencia)

- **Soft Charcoal** (texto): `#2D2D2D`
- Emoji 📖 como indicador visual
- `text-sm font-medium` para el mensaje

---

## Verificación Post-Implementación

1. [ ] El banner NO aparece cuando no hay `groupId`
2. [ ] El banner NO aparece cuando hay 0-2 recetas
3. [ ] El banner muestra "Recipes are coming in." cuando hay 3-9 recetas
4. [ ] El banner muestra "X recipes and counting." cuando hay 10+ recetas
5. [ ] Solo cuenta recetas del grupo específico (no todas las del cookbook)
6. [ ] El banner se posiciona entre el mensaje personal y "Find your name..."
7. [ ] Se ve bien en móvil y desktop (igual en ambos)
8. [ ] No hay errores en la consola