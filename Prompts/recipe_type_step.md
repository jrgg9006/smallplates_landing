# Prompt 1.2: Agregar Selector de Tipo de Receta (RecipeTypeStep)

## Contexto

Small Plates es una plataforma donde invitados de boda suben recetas para crear un libro colaborativo. 

**Problema identificado:** Los usuarios experimentan "parálisis de elección" al no saber qué receta compartir. Tienen muchas opciones y ninguna les parece "suficientemente buena".

**Solución:** Agregar un paso que les presente categorías de recetas para elegir. Esto reduce la parálisis al:
1. Dar "permiso" de que cualquier receta es válida
2. Convertir una decisión abierta en una selección de opciones
3. Crear un micro-compromiso que facilita continuar

---

## Cambio en el Flujo

**Antes:**
```
welcome → uploadMethod → recipeTitle → ...
```

**Después:**
```
welcome → recipeType (NUEVO) → uploadMethod → recipeTitle (con hint) → ...
```

---

## Archivos a Modificar/Crear

| Archivo | Acción |
|---------|--------|
| `components/recipe-journey/steps/RecipeTypeStep.tsx` | **CREAR** |
| `lib/recipe-journey/recipeJourneySteps.ts` | Modificar |
| `components/recipe-journey/RecipeJourneyWrapper.tsx` | Modificar |
| `components/recipe-journey/steps/RecipeTitleStep.tsx` | Modificar |

---

## 1. CREAR: RecipeTypeStep.tsx

Crear el archivo `components/recipe-journey/steps/RecipeTypeStep.tsx`:

```tsx
"use client";

import React from 'react';

export interface RecipeTypeOption {
  id: string;
  emoji: string;
  label: string;
  hint: string; // Used as placeholder hint in RecipeTitleStep
}

export const RECIPE_TYPE_OPTIONS: RecipeTypeOption[] = [
  {
    id: 'crowd-favorite',
    emoji: '🍳',
    label: 'Something people always ask me to make',
    hint: 'Your crowd favorite'
  },
  {
    id: 'late-night',
    emoji: '🌙',
    label: 'What I make when I get home late',
    hint: 'Your late-night go-to'
  },
  {
    id: 'passed-down',
    emoji: '👵',
    label: 'A recipe someone taught me',
    hint: 'A recipe passed down to you'
  },
  {
    id: 'delivery-order',
    emoji: '📱',
    label: 'My favorite delivery order',
    hint: 'Your favorite order'
  },
  {
    id: 'invented',
    emoji: '✨',
    label: 'Something I completely made up',
    hint: 'Your original creation'
  }
];

interface RecipeTypeStepProps {
  onSelectType: (type: RecipeTypeOption | null) => void;
  selectedType: RecipeTypeOption | null;
}

export default function RecipeTypeStep({ onSelectType, selectedType }: RecipeTypeStepProps) {
  
  const handleSelectType = (type: RecipeTypeOption) => {
    onSelectType(type);
  };

  const handleSkip = () => {
    onSelectType(null);
  };

  return (
    <div className="min-h-[calc(100vh-180px)] flex items-center justify-center">
      <div className="w-full space-y-8 px-4 md:px-6">
        {/* Header */}
        <div className="space-y-3 text-center">
          <h2 className="font-serif text-3xl md:text-4xl font-semibold text-[#2D2D2D]">
            What are you sharing today?
          </h2>
          <p className="text-base text-gray-600">
            Doesn&apos;t have to be fancy. Just has to be yours.
          </p>
        </div>

        {/* Options */}
        <div className="max-w-lg mx-auto space-y-3 mt-8">
          {RECIPE_TYPE_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => handleSelectType(option)}
              className={`
                w-full p-4 rounded-xl border-2 transition-all duration-200 bg-white text-left
                flex items-center gap-4
                ${selectedType?.id === option.id
                  ? 'border-[#D4A854] bg-[#FAF7F2]'
                  : 'border-gray-200 hover:border-[#D4A854] hover:bg-[#FAF7F2]'
                }
              `}
            >
              <span className="text-2xl flex-shrink-0" aria-hidden="true">
                {option.emoji}
              </span>
              <span className="text-[#2D2D2D] text-base">
                {option.label}
              </span>
            </button>
          ))}
        </div>

        {/* Skip option */}
        <div className="text-center mt-6">
          <button
            type="button"
            onClick={handleSkip}
            className="text-[#9A9590] hover:text-[#2D2D2D] text-sm transition-colors underline underline-offset-4 decoration-1"
          >
            I have something else in mind →
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

## 2. MODIFICAR: recipeJourneySteps.ts

Actualizar el archivo `lib/recipe-journey/recipeJourneySteps.ts`:

**Cambios:**
1. Agregar `'recipeType'` al tipo `JourneyStepKey`
2. Agregar el nuevo step al array `journeySteps` (después de 'welcome')

```typescript
export type JourneyStepKey = 'welcome' | 'recipeType' | 'introInfo' | 'realBook' | 'uploadMethod' | 'recipeForm' | 'recipeTitle' | 'imageUpload' | 'personalNote' | 'summary' | 'success';

export interface JourneyStepConfig {
  key: JourneyStepKey;
  title?: string;
  ctaLabel?: string;
}

export const journeySteps: JourneyStepConfig[] = [
  { key: 'welcome', title: 'Welcome', ctaLabel: "Add your Small Plate" },
  { key: 'recipeType', title: 'Recipe type', ctaLabel: 'Continue' },
  { key: 'introInfo', title: 'How it works', ctaLabel: 'Got it!' },
  { key: 'realBook', title: 'Printed book', ctaLabel: 'Start writing' },
  { key: 'uploadMethod', title: 'Choose format', ctaLabel: 'Continue' },
  { key: 'recipeForm', title: 'Your recipe', ctaLabel: 'Add my creation' },
  { key: 'recipeTitle', title: 'Recipe name', ctaLabel: 'Next' },
  { key: 'imageUpload', title: 'Upload images', ctaLabel: 'Continue' },
  { key: 'personalNote', title: 'Personal note', ctaLabel: 'Submit Plate' },
  { key: 'summary', title: 'Review' },
  { key: 'success', title: 'Thanks' },
];
```

---

## 3. MODIFICAR: RecipeJourneyWrapper.tsx

Este archivo requiere varios cambios. Los detallo por sección:

### 3.1 Agregar import

Agregar al inicio del archivo, junto a los otros imports de steps:

```typescript
import RecipeTypeStep, { RecipeTypeOption } from './steps/RecipeTypeStep';
```

### 3.2 Agregar estado para el tipo de receta seleccionado

Dentro del componente `RecipeJourneyWrapper`, agregar nuevo estado después de los otros estados:

```typescript
const [selectedRecipeType, setSelectedRecipeType] = useState<RecipeTypeOption | null>(null);
```

### 3.3 Modificar la función handleNext

Buscar la función `handleNext` y modificar el manejo del paso 'welcome' para ir a 'recipeType' en lugar de 'uploadMethod':

**Buscar este bloque:**
```typescript
// Special handling for welcome step - skip to uploadMethod directly (hiding introInfo and realBook)
if (currentStep?.key === 'welcome') {
  const uploadMethodIndex = journeySteps.findIndex(s => s.key === 'uploadMethod');
  setCurrentStepIndex(uploadMethodIndex);
  // ... resto del código
  return;
}
```

**Reemplazar con:**
```typescript
// Special handling for welcome step - go to recipeType
if (currentStep?.key === 'welcome') {
  const recipeTypeIndex = journeySteps.findIndex(s => s.key === 'recipeType');
  setCurrentStepIndex(recipeTypeIndex);
  setTimeout(focusFirstHeading, 0);
  if (typeof window !== 'undefined' && window.innerWidth < 1024) {
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  }
  return;
}

// Special handling for recipeType step - go to uploadMethod
if (currentStep?.key === 'recipeType') {
  const uploadMethodIndex = journeySteps.findIndex(s => s.key === 'uploadMethod');
  setCurrentStepIndex(uploadMethodIndex);
  setTimeout(focusFirstHeading, 0);
  if (typeof window !== 'undefined' && window.innerWidth < 1024) {
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  }
  return;
}
```

### 3.4 Modificar la función handlePrevious

Buscar la función `handlePrevious` y agregar manejo para el nuevo paso.

**Buscar este bloque:**
```typescript
// Special handling for uploadMethod - go back to welcome directly (skipping introInfo and realBook)
if (currentStep?.key === 'uploadMethod') {
  const welcomeIndex = journeySteps.findIndex(s => s.key === 'welcome');
  setCurrentStepIndex(welcomeIndex);
  // ... resto del código
  return;
}
```

**Reemplazar con:**
```typescript
// Special handling for recipeType - go back to welcome
if (currentStep?.key === 'recipeType') {
  const welcomeIndex = journeySteps.findIndex(s => s.key === 'welcome');
  setCurrentStepIndex(welcomeIndex);
  setTimeout(focusFirstHeading, 0);
  if (typeof window !== 'undefined' && window.innerWidth < 1024) {
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  }
  return;
}

// Special handling for uploadMethod - go back to recipeType
if (currentStep?.key === 'uploadMethod') {
  const recipeTypeIndex = journeySteps.findIndex(s => s.key === 'recipeType');
  setCurrentStepIndex(recipeTypeIndex);
  setTimeout(focusFirstHeading, 0);
  if (typeof window !== 'undefined' && window.innerWidth < 1024) {
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  }
  return;
}
```

### 3.5 Agregar handler para selección de tipo

Agregar esta nueva función después de `handleUploadMethodSelect`:

```typescript
const handleRecipeTypeSelect = (type: RecipeTypeOption | null) => {
  setSelectedRecipeType(type);
  // Auto-advance to next step after selection
  const uploadMethodIndex = journeySteps.findIndex(s => s.key === 'uploadMethod');
  setCurrentStepIndex(uploadMethodIndex);
  setTimeout(focusFirstHeading, 0);
  if (typeof window !== 'undefined' && window.innerWidth < 1024) {
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  }
};
```

### 3.6 Agregar el render del nuevo step

Dentro del `<AnimatePresence>`, agregar el render del nuevo paso DESPUÉS del bloque de 'welcome' y ANTES del bloque de 'introInfo':

```tsx
{current === 'recipeType' && (
  <motion.div
    key="recipeType"
    initial={{ opacity: 0, x: 16 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -16 }}
    transition={{ duration: 0.2, ease: 'easeOut' }}
  >
    <RecipeTypeStep 
      onSelectType={handleRecipeTypeSelect}
      selectedType={selectedRecipeType}
    />
  </motion.div>
)}
```

### 3.7 Actualizar el render de RecipeTitleStep

Buscar el bloque donde se renderiza `RecipeTitleStep` y agregar el prop `recipeTypeHint`:

**Buscar:**
```tsx
{current === 'recipeTitle' && (
  <motion.div
    key="recipeTitle"
    initial={{ opacity: 0, x: 16 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -16 }}
    transition={{ duration: 0.2, ease: 'easeOut' }}
  >
    <RecipeTitleStep 
      recipeName={recipeData.recipeName}
      onChange={(value) => setRecipeData(prev => ({ ...prev, recipeName: value }))}
    />
  </motion.div>
)}
```

**Reemplazar con:**
```tsx
{current === 'recipeTitle' && (
  <motion.div
    key="recipeTitle"
    initial={{ opacity: 0, x: 16 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -16 }}
    transition={{ duration: 0.2, ease: 'easeOut' }}
  >
    <RecipeTitleStep 
      recipeName={recipeData.recipeName}
      onChange={(value) => setRecipeData(prev => ({ ...prev, recipeName: value }))}
      recipeTypeHint={selectedRecipeType?.hint}
    />
  </motion.div>
)}
```

### 3.8 Limpiar el tipo seleccionado en resetJourney

Buscar la función `resetJourney` y agregar la limpieza del estado:

**Buscar el final de la función resetJourney y agregar:**
```typescript
setSelectedRecipeType(null);
```

La función completa debería quedar:
```typescript
const resetJourney = () => {
  setCurrentStepIndex(1);
  setRecipeData({
    recipeName: '',
    ingredients: '',
    instructions: '',
    personalNote: '',
    rawRecipeText: undefined,
    uploadMethod: 'text',
    documentUrls: [],
    audioUrl: undefined
  });
  setSubmitSuccess(false);
  setSubmitError(null);
  setSubmitting(false);
  setSelectedFiles([]);
  setUploadingImages(false);
  setUploadProgress(0);
  setSelectedRecipeType(null); // <-- Agregar esta línea
  // Clear localStorage
  localStorage.removeItem('recipeJourneyData');
  isDirtyRef.current = false;
};
```

---

## 4. MODIFICAR: RecipeTitleStep.tsx

Actualizar el archivo `components/recipe-journey/steps/RecipeTitleStep.tsx` para mostrar el hint:

```tsx
"use client";

import React from 'react';

interface RecipeTitleStepProps {
  recipeName: string;
  onChange: (value: string) => void;
  recipeTypeHint?: string;
}

export default function RecipeTitleStep({ recipeName, onChange, recipeTypeHint }: RecipeTitleStepProps) {
  // Generate placeholder based on hint or use default
  const placeholder = recipeTypeHint 
    ? `e.g., "${recipeTypeHint === 'Your crowd favorite' ? "Mom's Famous Lasagna" : 
               recipeTypeHint === 'Your late-night go-to' ? 'Midnight Quesadilla' :
               recipeTypeHint === 'A recipe passed down to you' ? "Grandma's Sunday Sauce" :
               recipeTypeHint === 'Your favorite order' ? 'The Usual from Thai Place' :
               recipeTypeHint === 'Your original creation' ? 'The Thing I Invented in College' :
               'Lazy Sunday Passover Plate'}"`
    : 'Lazy Sunday Passover Plate';

  return (
    <div className="min-h-[calc(100vh-180px)] flex items-center justify-center">
      <div className="w-full space-y-8 px-4 md:px-6">
        <div className="space-y-2 text-center">
          {recipeTypeHint ? (
            <p className="text-gray-500 text-base mb-2">
              {recipeTypeHint}
            </p>
          ) : null}
          <h2 className="text-gray-700 text-lg md:text-xl leading-relaxed font-light text-center">
            Recipe Title
          </h2>
        </div>

        <div className="max-w-2xl mx-auto">
          <input
            value={recipeName}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full text-center font-serif text-3xl font-semibold text-[#2D2D2D] leading-tight border-0 border-b border-gray-300 px-0 py-2 focus:outline-none focus:border-[#D4A854] bg-transparent placeholder:text-gray-400"
            autoFocus
          />
        </div>
      </div>
    </div>
  );
}
```

---

## Resumen de Cambios

| Archivo | Tipo | Descripción |
|---------|------|-------------|
| `components/recipe-journey/steps/RecipeTypeStep.tsx` | CREAR | Nuevo componente con 5 opciones + skip |
| `lib/recipe-journey/recipeJourneySteps.ts` | MODIFICAR | Agregar 'recipeType' al tipo y array |
| `components/recipe-journey/RecipeJourneyWrapper.tsx` | MODIFICAR | Import, estado, navegación, render |
| `components/recipe-journey/steps/RecipeTitleStep.tsx` | MODIFICAR | Agregar prop y mostrar hint |

---

## Colores de Marca (Referencia)

- **Warm White** (fondo hover/selected): `#FAF7F2`
- **Soft Charcoal** (texto): `#2D2D2D`
- **Honey** (border selected): `#D4A854`
- **Warm Gray** (texto secundario): `#9A9590`
- **Gray 200** (border default): `border-gray-200`

---

## Comportamiento Esperado

1. Usuario llega a "You're in!" (WelcomeStep) con el tip visible
2. Hace clic en "Add your Small Plate"
3. Ve "What are you sharing today?" con 5 opciones
4. Hace clic en una opción (ej: "Something people always ask me to make")
5. Automáticamente avanza a UploadMethodStep
6. Elige texto o foto
7. Llega a RecipeTitleStep y ve:
   - Pequeño texto gris: "Your crowd favorite"
   - Label: "Recipe Title"  
   - Placeholder contextual: `e.g., "Mom's Famous Lasagna"`
8. Si el usuario hace clic en "I have something else in mind →", avanza sin hint

---

## Verificación Post-Implementación

1. [ ] El nuevo paso aparece después de "You're in!"
2. [ ] Las 5 opciones se muestran correctamente con emojis
3. [ ] Hacer clic en una opción avanza automáticamente
4. [ ] "I have something else in mind →" también avanza (sin hint)
5. [ ] El botón "Back" desde UploadMethod regresa a RecipeType
6. [ ] El botón "Back" desde RecipeType regresa a Welcome
7. [ ] El hint aparece en RecipeTitleStep si se seleccionó una opción
8. [ ] El placeholder del input cambia según el hint
9. [ ] Si no se seleccionó opción, el placeholder es genérico
10. [ ] Los colores coinciden con la identidad de marca
11. [ ] Se ve bien en móvil (responsive)
12. [ ] No hay errores en la consola