# Implementación: Sección "Tips" para Guests

## Contexto del Negocio

Small Plates & Co. es una startup que crea libros de recetas colaborativos para bodas. Los invitados (guests) contribuyen recetas que luego se imprimen en un libro de alta calidad para la pareja.

### El Problema que Estamos Resolviendo

Tenemos un problema de conversión. Cuando los guests reciben el link para enviar su receta, muchos no completan el proceso. La razón principal no es técnica—es psicológica:

1. **Parálisis por análisis:** "No sé qué receta poner"
2. **Síndrome del impostor:** "Mi receta no es lo suficientemente buena para un libro de bodas"
3. **Página en blanco:** Sin ejemplos concretos, no saben por dónde empezar

### La Solución

Crear una sección de "Tips" que aparezca en el flujo del guest, justo después de que encuentran su nombre y ven la pantalla "You're in!". Esta sección debe:

- Dar **permiso explícito** de que cualquier receta vale
- Ofrecer **ejemplos concretos** que inspiren sin abrumar
- Reducir la ansiedad y hacer que el proceso se sienta fácil

### El Objetivo Medible

Aumentar la tasa de conversión de guests que envían recetas.

---

## Contexto Técnico

Este es un proyecto **Next.js 14+ con App Router**, usando **TypeScript** y **Tailwind CSS**.

### Flujo del Guest

```
1. Guest recibe link → /collect/[token]
2. Busca su nombre en la lista
3. Ve pantalla "You're in!" ← AQUÍ van los tips
4. Selecciona método de envío (texto/foto)
5. Escribe/sube su receta
6. Envía
```

### Archivos Relevantes

- `/components/recipe-journey/RecipeJourneyWrapper.tsx` — Orquesta todo el flujo
- `/components/recipe-journey/steps/WelcomeStep.tsx` — Pantalla "You're in!" (modificar)
- `/components/ui/` — Componentes UI reutilizables (Card, Button, etc.)

---

## Lo Que Necesitas Construir

### 1. Modificar la Pantalla "You're in!"

**Ubicación:** `/components/recipe-journey/steps/WelcomeStep.tsx`

**Actualmente dice:**

> "You're in!"
> "This book isn't about perfect recipes — it's about sharing something of yourself with the people who matter."

**Debe decir:**

> "You're in!"
> "This book isn't about perfect recipes—it's about you being in their kitchen. Forever."
> 
> [Link clickeable]: "Not sure what to send? We've got ideas."

El link debe abrir un modal/drawer con los tips.

---

### 2. Crear el Modal de Tips

**Nuevo archivo:** `/components/recipe-journey/RecipeTipsModal.tsx`

**Estructura de navegación:**

```
Vista Principal
├── Header: "What should I put?"
├── Subheader: "Short answer: anything. Long answer: here's what that actually means."
└── 3 tarjetas clickeables:
    ├── "The easy stuff" → abre vista expandida
    ├── "Borrowed recipes" → abre vista expandida
    └── "The fun stuff" → abre vista expandida
```

Cuando el usuario hace click en una tarjeta, el modal muestra el contenido expandido de esa categoría con un botón "Back" para regresar.

---

### 3. Contenido de Cada Categoría

#### Categoría 1: "The easy stuff"

**Descripción en tarjeta:** "Things you already make. Or order. Or assemble at midnight."

**Intro cuando se expande:** "You don't need a signature dish. You just need something real."

**Ejemplos:**

| Título | Descripción |
|--------|-------------|
| Your order at the taco place. | The one you get every time. That counts. |
| The thing you make when you're tired. | Scrambled eggs at 11pm. Pasta with whatever's in the fridge. That's real cooking. |
| Your morning coffee, exactly how you make it. | Oat milk, half a sugar, that specific mug. A ritual is a recipe. |
| The snack combo that shouldn't work. | Peanut butter and pickles. Cheese and honey. We don't judge. |

**Frase de cierre:** "If you eat it, it's a recipe."

---

#### Categoría 2: "Borrowed recipes"

**Descripción en tarjeta:** "Not yours? Even better."

**Intro cuando se expande:** "Some of the best recipes aren't yours. They're your mom's. Or your roommate's. Or that restaurant you can't stop thinking about."

**Ejemplos:**

| Título | Descripción |
|--------|-------------|
| Your mom's thing. | You know which one. Even without exact measurements—"a handful of this, a splash of that"—is perfect. |
| Something you watched someone make. | Your roommate's Sunday pancakes. Your grandma's sauce. Give them credit. |
| A restaurant dish you'd die for. | Write what you think is in it. They'll figure it out. |

**Frase de cierre:** "Credit the source. Keep the love."

---

#### Categoría 3: "The fun stuff"

**Descripción en tarjeta:** "For when you want to be memorable."

**Intro cuando se expande:** "For when you want your page to be the one they laugh about. Or toast to."

**Ejemplos:**

| Título | Descripción |
|--------|-------------|
| Your hangover cure. | Every kitchen needs one. Yours might save their marriage. |
| A drink that matches your vibe. | The cocktail that says "you." Or the mocktail. Or the very specific way you drink your tea. |
| An inside joke, in recipe form. | They'll know what it means. |
| The thing you bring to every party. | That dip. That thing. You know the one. |

**Frase de cierre:** "Make them smile. Make them hungry. Both is good."

---

## Guía de Estilo

### Colores (usar estos valores exactos)

```css
Honey (accent/CTA):        #D4A854
Warm White (backgrounds):  #FAF7F2
Soft Charcoal (text):      #2D2D2D
Sand (cards/subtle bg):    #E8E0D5
Warm Gray (secondary text): #9A9590
```

### Tipografía

- **Headers principales:** `font-serif` (ya configurado en el proyecto)
- **Body text:** Sans-serif default de Tailwind
- **Links:** Underline sutil, color `#9A9590` que cambia a `#2D2D2D` en hover

### Reglas de Voz (Importante)

- **NO usar emojis** en ningún lugar
- **Palabras prohibidas:** cherish, treasure, memories, special, unique, loved ones, celebrate, journey, curated, perfect, amazing
- **Tono:** Directo, cálido, como un amigo que te da permiso. No como un tutorial o documentación.

---

## Comportamiento del Modal

1. **Abrir:** Click en "Not sure what to send? We've got ideas."
2. **Cerrar:** Click en X, click fuera del modal (backdrop), o tecla Escape
3. **Navegación interna:** Click en tarjeta → muestra contenido expandido. Click en "Back" → regresa a vista principal.
4. **Al cerrar:** Siempre regresa a vista principal para la próxima apertura

---

## Consideraciones Mobile

- El modal debe ser responsive
- En mobile, puede ocupar más altura (hasta 90vh)
- El contenido debe ser scrolleable si excede la altura
- Los touch targets deben ser suficientemente grandes (mínimo 44px)

---

## Orden de Implementación Sugerido

1. Primero, explora la estructura actual de `/components/recipe-journey/` para entender cómo funciona el flujo
2. Crea el componente `RecipeTipsModal.tsx` con toda la lógica y vistas
3. Modifica `WelcomeStep.tsx` para agregar el link y conectar el modal
4. Prueba el flujo completo en el navegador
5. Verifica responsive en mobile

---

## Código de Referencia

A continuación incluyo código de referencia como inspiración. No es necesario copiarlo exactamente—adáptalo a la arquitectura existente del proyecto.

### RecipeTipsModal.tsx - Estructura Sugerida

```tsx
"use client";

import React, { useState, useEffect } from 'react';
import { X, ChevronLeft } from 'lucide-react';

interface RecipeTipsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TipCategory = 'main' | 'easy' | 'borrowed' | 'fun';

export default function RecipeTipsModal({ isOpen, onClose }: RecipeTipsModalProps) {
  const [activeCategory, setActiveCategory] = useState<TipCategory>('main');

  // Reset to main view when modal closes
  useEffect(() => {
    if (!isOpen) {
      setActiveCategory('main');
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          {activeCategory !== 'main' ? (
            <button 
              onClick={() => setActiveCategory('main')}
              className="flex items-center text-[#9A9590] hover:text-[#2D2D2D] transition-colors"
            >
              <ChevronLeft className="w-5 h-5 mr-1" />
              Back
            </button>
          ) : (
            <div />
          )}
          <button 
            onClick={onClose}
            className="text-[#9A9590] hover:text-[#2D2D2D] transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(85vh-80px)]">
          {activeCategory === 'main' && <MainView onSelectCategory={setActiveCategory} />}
          {activeCategory === 'easy' && <EasyStuffView />}
          {activeCategory === 'borrowed' && <BorrowedRecipesView />}
          {activeCategory === 'fun' && <FunStuffView />}
        </div>
      </div>
    </div>
  );
}

// ============================================
// SUB-COMPONENTS
// ============================================

function MainView({ onSelectCategory }: { onSelectCategory: (cat: TipCategory) => void }) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="font-serif text-2xl md:text-3xl font-semibold text-[#2D2D2D]">
          What should I put?
        </h2>
        <p className="text-[#9A9590] mt-2">
          Short answer: anything.<br />
          Long answer: here's what that actually means.
        </p>
      </div>

      {/* Category Cards */}
      <div className="space-y-3 mt-8">
        <CategoryCard
          title="The easy stuff"
          description="Things you already make. Or order. Or assemble at midnight."
          onClick={() => onSelectCategory('easy')}
        />
        <CategoryCard
          title="Borrowed recipes"
          description="Not yours? Even better."
          onClick={() => onSelectCategory('borrowed')}
        />
        <CategoryCard
          title="The fun stuff"
          description="For when you want to be memorable."
          onClick={() => onSelectCategory('fun')}
        />
      </div>
    </div>
  );
}

function CategoryCard({ title, description, onClick }: { 
  title: string; 
  description: string; 
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left p-4 bg-[#FAF7F2] hover:bg-[#E8E0D5] rounded-xl transition-colors group"
    >
      <h3 className="font-semibold text-[#2D2D2D]">
        {title}
      </h3>
      <p className="text-[#9A9590] text-sm mt-1">
        {description}
      </p>
    </button>
  );
}

function TipItem({ title, description }: { title: string; description: string }) {
  return (
    <div className="pl-4 border-l-2 border-[#E8E0D5]">
      <p className="font-medium text-[#2D2D2D]">{title}</p>
      <p className="text-[#9A9590] text-sm mt-1">{description}</p>
    </div>
  );
}

function EasyStuffView() {
  const tips = [
    {
      title: "Your order at the taco place.",
      description: "The one you get every time. That counts."
    },
    {
      title: "The thing you make when you're tired.",
      description: "Scrambled eggs at 11pm. Pasta with whatever's in the fridge. That's real cooking."
    },
    {
      title: "Your morning coffee, exactly how you make it.",
      description: "Oat milk, half a sugar, that specific mug. A ritual is a recipe."
    },
    {
      title: "The snack combo that shouldn't work.",
      description: "Peanut butter and pickles. Cheese and honey. We don't judge."
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl font-semibold text-[#2D2D2D]">
          The easy stuff
        </h2>
        <p className="text-[#9A9590] mt-2">
          You don't need a signature dish. You just need something real.
        </p>
      </div>

      <div className="space-y-4 mt-6">
        {tips.map((tip, index) => (
          <TipItem key={index} title={tip.title} description={tip.description} />
        ))}
      </div>

      <p className="text-[#2D2D2D] font-medium text-center pt-4 border-t border-gray-100">
        If you eat it, it's a recipe.
      </p>
    </div>
  );
}

function BorrowedRecipesView() {
  const tips = [
    {
      title: "Your mom's thing.",
      description: "You know which one. Even without exact measurements—\"a handful of this, a splash of that\"—is perfect."
    },
    {
      title: "Something you watched someone make.",
      description: "Your roommate's Sunday pancakes. Your grandma's sauce. Give them credit."
    },
    {
      title: "A restaurant dish you'd die for.",
      description: "Write what you think is in it. They'll figure it out."
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl font-semibold text-[#2D2D2D]">
          Borrowed recipes
        </h2>
        <p className="text-[#9A9590] mt-2">
          Some of the best recipes aren't yours. They're your mom's. Or your roommate's. Or that restaurant you can't stop thinking about.
        </p>
      </div>

      <div className="space-y-4 mt-6">
        {tips.map((tip, index) => (
          <TipItem key={index} title={tip.title} description={tip.description} />
        ))}
      </div>

      <p className="text-[#2D2D2D] font-medium text-center pt-4 border-t border-gray-100">
        Credit the source. Keep the love.
      </p>
    </div>
  );
}

function FunStuffView() {
  const tips = [
    {
      title: "Your hangover cure.",
      description: "Every kitchen needs one. Yours might save their marriage."
    },
    {
      title: "A drink that matches your vibe.",
      description: "The cocktail that says \"you.\" Or the mocktail. Or the very specific way you drink your tea."
    },
    {
      title: "An inside joke, in recipe form.",
      description: "They'll know what it means."
    },
    {
      title: "The thing you bring to every party.",
      description: "That dip. That thing. You know the one."
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl font-semibold text-[#2D2D2D]">
          The fun stuff
        </h2>
        <p className="text-[#9A9590] mt-2">
          For when you want your page to be the one they laugh about. Or toast to.
        </p>
      </div>

      <div className="space-y-4 mt-6">
        {tips.map((tip, index) => (
          <TipItem key={index} title={tip.title} description={tip.description} />
        ))}
      </div>

      <p className="text-[#2D2D2D] font-medium text-center pt-4 border-t border-gray-100">
        Make them smile. Make them hungry. Both is good.
      </p>
    </div>
  );
}
```

### WelcomeStep.tsx - Modificación Sugerida

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

## Arquitectura Visual del Modal

```
┌─────────────────────────────────────┐
│         YOU'RE IN!                  │
│                                     │
│  This book isn't about perfect      │
│  recipes—it's about you being in    │
│  their kitchen. Forever.            │
│                                     │
│  Not sure what to send?             │
│  We've got ideas.  ← [link]         │
│                                     │
│  [Add your Small Plate]             │
└─────────────────────────────────────┘
                 │
                 ▼ (click en link)
┌─────────────────────────────────────┐
│                              [X]    │
│     WHAT SHOULD I PUT?              │
│                                     │
│  Short answer: anything.            │
│  Long answer: here's what that      │
│  actually means.                    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ The easy stuff              │    │
│  │ Things you already make...  │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ Borrowed recipes            │    │
│  │ Not yours? Even better.     │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ The fun stuff               │    │
│  │ For when you want to be     │    │
│  │ memorable.                  │    │
│  └─────────────────────────────┘    │
└─────────────────────────────────────┘
                 │
                 ▼ (click en tarjeta)
┌─────────────────────────────────────┐
│  [← Back]                    [X]    │
│                                     │
│     THE EASY STUFF                  │
│                                     │
│  You don't need a signature dish.   │
│  You just need something real.      │
│                                     │
│  ┃ Your order at the taco place.    │
│  ┃ The one you get every time...    │
│                                     │
│  ┃ The thing you make when tired.   │
│  ┃ Scrambled eggs at 11pm...        │
│                                     │
│  ┃ Your morning coffee ritual.      │
│  ┃ Oat milk, half a sugar...        │
│                                     │
│  ┃ The snack combo that works.      │
│  ┃ Peanut butter and pickles...     │
│                                     │
│  ─────────────────────────────────  │
│  If you eat it, it's a recipe.      │
│                                     │
└─────────────────────────────────────┘
```

---

## Verificación Final

Cuando termines, verifica:

- [ ] El link aparece en la pantalla "You're in!"
- [ ] El modal abre y cierra correctamente
- [ ] Las 3 categorías son clickeables y muestran su contenido
- [ ] El botón "Back" funciona
- [ ] El modal se cierra con X, backdrop, y Escape
- [ ] Se ve bien en mobile (375px) y desktop
- [ ] Los colores coinciden con la paleta de la marca
- [ ] No hay emojis ni palabras prohibidas en el copy

---

## Notas Adicionales

- Sigue la arquitectura existente del proyecto
- Usa los componentes UI existentes cuando sea posible (`/components/ui/`)
- Mantén el código limpio y bien comentado
- Asegúrate de que el modal sea accesible (manejo de focus, aria labels)