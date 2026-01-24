# Integración de Evaluación de Prompts

## Archivos Creados

### 1. `app/(admin)/admin/operations/components/PromptEvaluationForm.tsx`
Componente de UI con:
- ⭐ Rating con estrellas (1-5)
- 📝 "What Worked" (aparece cuando rating >= 3)
- ❌ "What Failed" (aparece cuando rating <= 3)
- ✏️ Toggle para editar prompt manualmente
- 📋 Detalles adicionales (hero element, container, notas)

### 2. `app/api/v1/admin/operations/recipes/[recipeId]/evaluation/route.ts`
- `POST` - Crear nueva evaluación (o update si ya existe)
- `GET` - Obtener evaluación existente

### 3. `app/api/v1/admin/operations/recipes/[recipeId]/evaluation/[evaluationId]/route.ts`
- `PATCH` - Actualizar evaluación específica
- `DELETE` - Eliminar evaluación

---

## Cómo Integrar en tu página de Operations

En tu archivo `app/(admin)/admin/operations/page.tsx`, necesitas:

### Paso 1: Importar el componente

```tsx
import { PromptEvaluationForm } from './components/PromptEvaluationForm';
```

### Paso 2: Agregar estado para la evaluación

Agrega estos estados cerca de los otros estados:

```tsx
const [existingEvaluation, setExistingEvaluation] = useState<any>(null);
const [loadingEvaluation, setLoadingEvaluation] = useState(false);
```

### Paso 3: Cargar evaluación cuando se selecciona una receta

Agrega este useEffect:

```tsx
// Load evaluation when recipe is selected
useEffect(() => {
  const loadEvaluation = async () => {
    if (!selectedRecipe?.id) {
      setExistingEvaluation(null);
      return;
    }
    
    setLoadingEvaluation(true);
    try {
      const response = await fetch(`/api/v1/admin/operations/recipes/${selectedRecipe.id}/evaluation`);
      if (response.ok) {
        const { data } = await response.json();
        setExistingEvaluation(data);
      }
    } catch (error) {
      console.error('Error loading evaluation:', error);
    } finally {
      setLoadingEvaluation(false);
    }
  };
  
  loadEvaluation();
}, [selectedRecipe?.id]);
```

### Paso 4: Agregar el componente en la UI

Busca la sección `{/* Evaluate Prompt */}` (donde se muestra "Rating") y reemplázala con:

```tsx
{/* Evaluate Prompt Section */}
{selectedRecipe.midjourney_prompts && (
  <div>
    <h3 className="text-xl font-semibold text-gray-900 mb-4">
      Evaluate Prompt
    </h3>
    <div className="bg-gray-50 border border-gray-200 p-6 rounded-lg shadow-sm">
      {loadingEvaluation ? (
        <div className="flex items-center justify-center py-8">
          <svg className="w-6 h-6 animate-spin text-gray-400" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      ) : (
        <PromptEvaluationForm
          recipeId={selectedRecipe.id}
          originalPrompt={selectedRecipe.midjourney_prompts.generated_prompt}
          dishCategory={selectedRecipe.dish_category}
          generatedImageUrl={selectedRecipe.generated_image_url}
          existingEvaluation={existingEvaluation}
          onSaved={() => {
            // Recargar evaluación después de guardar
            fetch(`/api/v1/admin/operations/recipes/${selectedRecipe.id}/evaluation`)
              .then(res => res.json())
              .then(({ data }) => setExistingEvaluation(data))
              .catch(console.error);
          }}
        />
      )}
    </div>
  </div>
)}
```

---

## Flujo de Uso

```
┌─────────────────────────────────────────────────────────────────┐
│                         FLUJO DE USO                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Seleccionas una receta (ej: "Midnight Sanwichito")          │
│                                                                  │
│  2. Ves el prompt generado en "Midjourney Prompt"               │
│                                                                  │
│  3. Bajas a "Evaluate Prompt"                                   │
│                                                                  │
│  4. Das rating con estrellas:                                   │
│     ⭐⭐ (2 estrellas) = Malo                                    │
│                                                                  │
│  5. Aparece "What Failed?" → escribes la razón                  │
│     "Muy genérico, no describe la textura del pan"              │
│                                                                  │
│  6. Si editaste el prompt manualmente:                          │
│     - Activas el toggle "Did you edit the prompt manually?"     │
│     - Pegas tu versión mejorada                                 │
│                                                                  │
│  7. Click "Save Evaluation"                                     │
│                                                                  │
│  ✅ Se guarda en prompt_evaluations:                            │
│     - prompt_text = el original                                 │
│     - was_edited = TRUE                                         │
│     - edited_prompt = tu versión                                │
│     - rating = 2                                                │
│     - what_failed = "Muy genérico..."                           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Beneficios para el Aprendizaje del AI

Con esta data puedes:

1. **Comparar prompts originales vs editados** para mejorar el agente
2. **Identificar patrones** de qué falla frecuentemente
3. **Entrenar con ejemplos** de prompts que sí funcionaron
4. **Analizar por categoría** qué tipos de platos tienen más problemas