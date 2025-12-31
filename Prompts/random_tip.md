# Prompt 1.1: Agregar Tip Aleatorio Visible en WelcomeStep

## Contexto

Small Plates es una plataforma donde invitados de boda suben recetas para crear un libro colaborativo. Actualmente, en el paso "You're in!" (WelcomeStep), hay un link que dice "Not sure what to send? We've got ideas" que abre un modal con tips.

**Problema:** Los usuarios que más necesitan ver los tips son los que menos hacen clic en el link. Están paralizados por la decisión de qué receta compartir.

**Solución:** Mostrar UN tip aleatorio de forma visible en la pantalla, sin necesidad de hacer clic. Esto reduce la parálisis de elección al dar permiso explícito de que cualquier receta es válida.

---

## Objetivo

Modificar el componente `WelcomeStep.tsx` para mostrar un tip aleatorio visible entre el texto principal y el link existente.

---

## Archivo a modificar

```
components/recipe-journey/steps/WelcomeStep.tsx
```

---

## Código actual del componente

```tsx
"use client";

import React, { useState } from 'react';
import RecipeTipsModal from '../RecipeTipsModal';

interface WelcomeStepProps {
  creatorName: string;
}

export default function WelcomeStep({ creatorName }: WelcomeStepProps) {
  const [showTips, setShowTips] = useState(false);

  return (
    <>
      <div className="min-h-[calc(100vh-180px)] flex items-center justify-center" role="region" aria-labelledby="welcome-heading">
        <div className="text-left px-4 md:px-6">
          <h1 id="welcome-heading" className="font-serif text-3xl md:text-4xl font-semibold text-[#2D2D2D]">
            You&apos;re in!
          </h1>
          <p className="text-gray-700 text-lg md:text-xl leading-relaxed font-light mt-4">
            This book isn&apos;t about perfect recipes—<br />
            it&apos;s about you being in their kitchen. Forever.
          </p>
          
          <button 
            onClick={() => setShowTips(true)}
            className="text-[#9A9590] hover:text-[#2D2D2D] text-base mt-6 underline underline-offset-4 decoration-1 transition-colors"
          >
            Not sure what to send? We&apos;ve got ideas.
          </button>
        </div>
      </div>

      <RecipeTipsModal 
        isOpen={showTips} 
        onClose={() => setShowTips(false)} 
      />
    </>
  );
}
```

---

## Cambios requeridos

### 1. Agregar array de tips

Crear un array constante con 5 tips aprobados por la marca. Estos tips deben dar "permiso" al usuario de compartir recetas simples:

```typescript
const RANDOM_TIPS = [
  "Your mom's pasta counts. Even if you've never made it yourself.",
  "The thing you make when you're tired? That's a recipe.",
  "Your Uber Eats order is valid. Seriously.",
  "Cheese and crackers at midnight counts.",
  "The dish you always bring to parties? Perfect."
];
```

### 2. Seleccionar tip aleatorio al montar

Usar `useState` con una función de inicialización para seleccionar un tip aleatorio una sola vez cuando el componente se monta:

```typescript
const [randomTip] = useState(() => 
  RANDOM_TIPS[Math.floor(Math.random() * RANDOM_TIPS.length)]
);
```

### 3. Agregar el recuadro de tip visible

Insertar un nuevo elemento entre el párrafo principal y el botón existente. El diseño debe ser:

- Fondo: `#FAF7F2` (Warm White de la marca)
- Border radius: `8px`
- Padding: `16px`
- Icono: emoji 💡 al inicio
- Texto del tip: Inter Regular, 15px, color `#2D2D2D`
- Margin top: `24px` (mt-6)

### 4. Modificar el link existente

Cambiar el texto del link de:
- **Antes:** "Not sure what to send? We've got ideas."
- **Después:** "More ideas →"

Colocar este link DENTRO del recuadro del tip, alineado a la derecha.

---

## Estructura visual esperada

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│  You're in!                                         │
│                                                     │
│  This book isn't about perfect recipes—             │
│  it's about you being in their kitchen. Forever.   │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │ 💡 Your mom's pasta counts. Even if you've  │   │
│  │    never made it yourself.                   │   │
│  │                              More ideas →    │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## Código final esperado

```tsx
"use client";

import React, { useState } from 'react';
import RecipeTipsModal from '../RecipeTipsModal';

interface WelcomeStepProps {
  creatorName: string;
}

const RANDOM_TIPS = [
  "Your mom's pasta counts. Even if you've never made it yourself.",
  "The thing you make when you're tired? That's a recipe.",
  "Your Uber Eats order is valid. Seriously.",
  "Cheese and crackers at midnight counts.",
  "The dish you always bring to parties? Perfect."
];

export default function WelcomeStep({ creatorName }: WelcomeStepProps) {
  const [showTips, setShowTips] = useState(false);
  const [randomTip] = useState(() => 
    RANDOM_TIPS[Math.floor(Math.random() * RANDOM_TIPS.length)]
  );

  return (
    <>
      <div className="min-h-[calc(100vh-180px)] flex items-center justify-center" role="region" aria-labelledby="welcome-heading">
        <div className="text-left px-4 md:px-6 max-w-md">
          <h1 id="welcome-heading" className="font-serif text-3xl md:text-4xl font-semibold text-[#2D2D2D]">
            You&apos;re in!
          </h1>
          <p className="text-gray-700 text-lg md:text-xl leading-relaxed font-light mt-4">
            This book isn&apos;t about perfect recipes—<br />
            it&apos;s about you being in their kitchen. Forever.
          </p>
          
          {/* Random Tip Box */}
          <div className="mt-6 bg-[#FAF7F2] rounded-lg p-4">
            <div className="flex items-start gap-3">
              <span className="text-base flex-shrink-0" aria-hidden="true">💡</span>
              <div className="flex-1 min-w-0">
                <p className="text-[15px] text-[#2D2D2D] leading-relaxed">
                  {randomTip}
                </p>
                <button 
                  onClick={() => setShowTips(true)}
                  className="text-[#D4A854] hover:text-[#b8923a] text-sm mt-2 font-medium transition-colors"
                >
                  More ideas →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <RecipeTipsModal 
        isOpen={showTips} 
        onClose={() => setShowTips(false)} 
      />
    </>
  );
}
```

---

## Notas importantes

1. **Colores de marca:**
   - Warm White (fondo del tip): `#FAF7F2`
   - Soft Charcoal (texto): `#2D2D2D`
   - Honey (link "More ideas"): `#D4A854`
   - Honey hover: `#b8923a`

2. **No modificar** el componente `RecipeTipsModal`. Solo reutilizarlo.

3. **Accesibilidad:** El emoji tiene `aria-hidden="true"` porque es decorativo.

4. **El prop `creatorName`** no se usa actualmente en el componente pero debe mantenerse en la interface por compatibilidad.

5. **Se agregó `max-w-md`** al contenedor interno para controlar el ancho máximo del contenido y que el tip box no se extienda demasiado en pantallas grandes.

---

## Verificación post-implementación

Después de implementar, verificar:

1. [ ] El tip aparece correctamente en la pantalla "You're in!"
2. [ ] El tip cambia aleatoriamente al recargar la página
3. [ ] El botón "More ideas →" abre el modal de tips existente
4. [ ] El modal se cierra correctamente
5. [ ] Los colores coinciden con la identidad de marca
6. [ ] Se ve bien en móvil (responsive)
7. [ ] No hay errores en la consola