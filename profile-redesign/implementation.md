# Small Plates — Cookbook Page Implementation Guide

## Overview

Este documento es la guía de implementación para el rediseño de la página principal del cookbook (dashboard del Captain). Contiene todas las especificaciones visuales, decisiones de producto, y copy necesarios para la implementación.

### Principios de Diseño

1. **Margot Cole Test** — "¿Una mujer de 28 años en Nueva York, con champagne en la mano en un rooftop, diría esto?" Si rodaría los ojos → reescribir. Si lo diría con una sonrisa → ship it.

2. **Cool on the outside, emotional on the inside** — No lideramos con lágrimas; las ganamos.

3. **Editorial, no app** — Más revista que software. Tipografía hace el trabajo. Espacio blanco es diseño.

4. **Restraint** — Un solo color de acento (honey). El resto es neutral.

### Referencia Visual

- Componente React: `cookbook-page-v3.jsx`
- Inspiración: Dots app, Kinfolk magazine, The New Yorker online

---

## Especificaciones Visuales

### Colores

| Nombre | Hex | Uso |
|--------|-----|-----|
| Background | `#FAF9F7` | Fondo principal de la página |
| White | `#FFFFFF` | Cards, header, dropdowns |
| Honey | `#D4A854` | ÚNICO botón primario (Collect Recipes) |
| Charcoal | `#2D2D2D` | Texto principal, avatares |
| Warm Gray | `#8A8780` | Texto secundario, metadata |
| Light Gray | `#6B6966` | Texto terciario |
| Border | `#F0EDE8` | Bordes de cards, líneas divisoras |
| Border Button | `#D4D0C8` | Bordes de botones secundarios |
| Decorative Line | `#D4D0C8` | Línea en recipe cards |
| Hero Gradient Start | `#E8E4DC` | Imagen hero placeholder |
| Hero Gradient End | `#D4CFC4` | Imagen hero placeholder |

### Tipografía

| Elemento | Font | Size | Weight | Style | Color |
|----------|------|------|--------|-------|-------|
| Logo "Small Plates" | Georgia, serif | 18px | 400 | normal | `#2D2D2D` |
| Logo "& Co." | system-ui | 13px | 400 | normal | `#8A8780` |
| Page Title (Ana & Ric) | Georgia, serif | 28px | 400 | normal | `#2D2D2D` |
| Metadata | system-ui | 14px | 400 | normal | `#8A8780` |
| Recipe Name | Georgia, serif | 18px | 400 | italic | `#2D2D2D` |
| Recipe Attribution | system-ui | 13px | 400 | normal | `#8A8780` |
| Button Primary | system-ui | 14px | 500 | normal | `#FFFFFF` |
| Button Secondary | system-ui | 14px | 500 | normal | `#2D2D2D` |
| Button Tertiary | system-ui | 14px | 400 | normal | `#6B6966` |

### Border Radius

| Elemento | Radius |
|----------|--------|
| Botones (todos) | `50px` (pill shape) |
| Hero Image | `16px` |
| Recipe Cards | `8px` |
| Dropdowns | `16px` |
| Avatar | `50%` (círculo) |

### Spacing

| Elemento | Valor |
|----------|-------|
| Header height | `56px` |
| Header padding horizontal | `40px` |
| Main content max-width | `1000px` |
| Main content padding horizontal | `40px` |
| Hero image height | `200px` |
| Hero image margin-top | `24px` |
| Title section margin-top | `24px` |
| Action bar margin-top | `20px` |
| Action bar padding-bottom | `24px` |
| Action bar gap | `12px` |
| Recipe grid margin-top | `32px` |
| Recipe grid gap | `20px` |
| Recipe card padding | `32px 24px` |
| Recipe card min-height | `180px` |

### Shadows

| Elemento | Estado | Shadow |
|----------|--------|--------|
| Recipe Card | Default | `0 1px 3px rgba(45,45,45,0.06)` |
| Recipe Card | Hover | `0 4px 20px rgba(45,45,45,0.1)` |
| Dropdown | - | `0 4px 24px rgba(45,45,45,0.12)` |

### Transitions

| Elemento | Transition |
|----------|------------|
| Recipe Card | `all 0.2s ease` |
| Recipe Card Hover | `transform: translateY(-2px)` |

---

## Componentes

### 1. Header

```
┌──────────────────────────────────────────────────────────────┐
│  Small Plates & Co.                         My Books    [A]  │
└──────────────────────────────────────────────────────────────┘
```

- Altura: 56px
- Background: `#FFFFFF`
- Border bottom: `1px solid #F0EDE8`
- Position: sticky, top: 0, z-index: 50
- Logo: "Small Plates" (Georgia) + "& Co." (system-ui, gray)
- Avatar: 32px círculo, charcoal background, letra blanca

---

### 2. Hero Image

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│                    [Image icon]                              │
│                Click to add your photo                       │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**Estado: Sin imagen (placeholder)**
- Height: 200px
- Border radius: 16px
- Background: `linear-gradient(135deg, #E8E4DC 0%, #D4CFC4 100%)`
- Icono: 48x48px, stroke `#9A958C`
- Texto: "Click to add your photo", 13px, `#9A958C`

**Estado: Con imagen**
- Mismas dimensiones
- `object-fit: cover`
- La imagen será proporcionada por el usuario o una default de pareja cocinando

---

### 3. Title Section

```
Ana & Ric
December 25, 2025 · 9 recipes from 9 people
```

- Título: Georgia serif, 28px, `#2D2D2D`
- Metadata: system-ui, 14px, `#8A8780`
- Formato metadata: `[Fecha] · [N] recipes from [N] people`

---

### 4. Action Bar

```
[Collect Recipes]  [Add Your Own]  [Captains ▼]  [⋯]
     (honey)         (outline)       (outline)   (outline)
```

**Jerarquía de botones:**

| Botón | Tipo | Background | Border | Color | Padding |
|-------|------|------------|--------|-------|---------|
| Collect Recipes | Primary | `#D4A854` | none | `#FFFFFF` | `12px 24px` |
| Add Your Own | Secondary | none | `1px solid #D4D0C8` | `#2D2D2D` | `12px 24px` |
| Captains | Tertiary | none | `1px solid #D4D0C8` | `#6B6966` | `12px 20px` |
| More (⋯) | Tertiary | none | `1px solid #D4D0C8` | `#8A8780` | `12px 14px` |

**Decisión de producto:** "Collect Recipes" es primario porque la acción principal es pedir recetas a otros, no agregar una propia. El libro se trata de las personas que contribuyen.

---

### 5. Recipe Cards

```
┌─────────────────────────────┐
│                             │
│      "Sunday Pasta"         │  ← Georgia italic, con comillas
│                             │
│          ─────              │  ← Línea decorativa 24px
│                             │
│       From Roberto          │  ← system-ui, gray
│                             │
│                             │
│      [Edit]  [Remove]       │  ← Solo en hover
│                             │
└─────────────────────────────┘
```

**Grid:**
- `grid-template-columns: repeat(3, 1fr)`
- Gap: 20px

**Card:**
- Background: `#FFFFFF`
- Border: `1px solid #F0EDE8`
- Border radius: 8px
- Padding: 32px 24px
- Min-height: 180px
- Text-align: center
- Display: flex, flex-direction: column, align-items: center, justify-content: center

**Recipe Name:**
- Con comillas: `"Sunday Pasta"`
- Font: Georgia, serif
- Style: italic
- Size: 18px
- Color: `#2D2D2D`

**Decorative Line:**
- Width: 24px
- Height: 1px
- Background: `#D4D0C8`
- Margin: 16px 0

**Attribution:**
- Text: "From [Nombre]"
- Font: system-ui
- Size: 13px
- Color: `#8A8780`

**Hover State:**
- Shadow: `0 4px 20px rgba(45,45,45,0.1)`
- Transform: `translateY(-2px)`
- Mostrar botones Edit / Remove en la parte inferior
  - Edit: `#8A8780`
  - Remove: `#B5A89A`

---

### 6. Captains Dropdown

```
┌─────────────────────────────┐
│  Captains                   │
├─────────────────────────────┤
│  [A] Ana Martínez           │
│      Creator                │
│  ─────────────────────────  │
│  [R] Ricardo García         │
│      Captain                │
├─────────────────────────────┤
│  + Invite Captain           │  ← border dashed
└─────────────────────────────┘
```

- Position: absolute, debajo del botón
- Background: `#FFFFFF`
- Border radius: 16px
- Border: `1px solid #F0EDE8`
- Shadow: `0 4px 24px rgba(45,45,45,0.12)`
- Padding: 12px
- Min-width: 220px

**Avatar en dropdown:**
- Creator: background `#2D2D2D`, text white
- Captain: background `#E8E6E1`, text `#6B6966`

**Invite Captain button:**
- Border: `1px dashed #D4D0C8`
- Border radius: 20px

---

## Estados

### Empty State (Sin Recetas)

Cuando el libro está recién creado y no hay ninguna receta:

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│                    [Hero Image]                              │
│                                                              │
│  Ana & Ric                                                   │
│  December 25, 2025 · 0 recipes                               │
│                                                              │
│  [Collect Recipes]  [Add Your Own]  [Captains ▼]  [⋯]       │
│                                                              │
│  ──────────────────────────────────────────────────────────  │
│                                                              │
│                                                              │
│                                                              │
│              No recipes yet. That's about to change.         │
│                                                              │
│                                                              │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**Copy del empty state:**
- Texto: "No recipes yet. That's about to change."
- Font: system-ui, 16px, `#8A8780`
- Centered en el área donde iría el grid
- Sin ilustraciones — mantener minimalista

**Decisión de producto:** El copy es directo, confiado, con un hint de personalidad. Margot lo diría con una sonrisa.

---

### Con Recetas

- Mostrar el grid de recipe cards
- Metadata actualizada: "9 recipes from 9 people"

---

### Hover States

| Elemento | Hover Effect |
|----------|--------------|
| Recipe Card | Lift + shadow + show Edit/Remove |
| Buttons | Cursor pointer (no otros efectos por ahora) |
| "My Books" link | Cursor pointer |
| Avatar | Cursor pointer |

---

## Copy & Microcopy

### Textos Principales

| Elemento | Copy |
|----------|------|
| Botón primario | "Collect Recipes" |
| Botón secundario | "Add Your Own" |
| Botón captains | "Captains" |
| Metadata con recetas | "[Fecha] · [N] recipes from [N] people" |
| Metadata sin recetas | "[Fecha] · 0 recipes" |
| Empty state | "No recipes yet. That's about to change." |
| Hero placeholder | "Click to add your photo" |
| Invite captain | "+ Invite Captain" |
| Card hover - edit | "Edit" |
| Card hover - remove | "Remove" |

### Formato de Nombres en Cards

- Con comillas e itálica: `"Sunday Pasta"`
- Attribution: `From [Nombre]`
- El nombre es solo el primer nombre o apodo, no nombre completo

---

## Decisiones de Producto

### 1. ¿Por qué "Collect Recipes" es el botón primario?

El producto se trata de que **otros** contribuyan recetas. La novia/bridesmaid viene a:
1. Ver progreso
2. Mandar links para pedir recetas
3. Ocasionalmente agregar una propia

"Collect Recipes" refleja la acción más común e importante.

### 2. ¿Por qué no mostramos el contenido de las recetas?

Por ahora, las cards no abren un detalle al hacer click. Razones:
- Mantener algo de sorpresa para la novia
- Simplificar el MVP
- El contenido real se verá en el libro impreso

**Futuro:** Podríamos agregar un panel lateral para Captains que necesiten revisar/editar. Pero no es prominente.

### 3. ¿Por qué la imagen hero?

Dots usa una imagen del evento como ancla emocional. Nosotros hacemos lo mismo:
- Default: imagen de pareja cocinando (proporcionada por Small Plates)
- El usuario puede cambiarla si quiere
- Crea contexto de "esto es sobre ellos" inmediatamente

### 4. ¿Por qué solo UN color honey?

Margot aprecia el restraint. Usar honey en todo lo "gasta". Un solo uso (el botón primario) lo hace especial y guía la atención.

---

## Responsive (Para Futuro)

Este documento cubre **desktop**. Mobile será especificación separada.

Breakpoints sugeridos:
- Desktop: > 1000px (3 columnas)
- Tablet: 768px - 1000px (2 columnas)
- Mobile: < 768px (1 columna, layout vertical)

---

## Archivos de Referencia

| Archivo | Descripción |
|---------|-------------|
| `cookbook-page-v3.jsx` | Componente React con el diseño final |
| `brand-personality.md` | Personalidad de marca y Margot Cole |
| `tone-of-voice.md` | Guía de voz y tono |
| `visual-identity-brief.md` | Identidad visual completa |

---

## Changelog

| Fecha | Cambio |
|-------|--------|
| Dec 12, 2025 | Versión inicial del documento |
| Dec 12, 2025 | Botones redondeados (pill shape) para consistencia con landing |
| Dec 12, 2025 | "Collect Recipes" como primario, "Add Your Own" como secundario |
| Dec 12, 2025 | Empty state definido: "No recipes yet. That's about to change." |

---

## Pendientes

- [ ] Imagen hero default (generar en Midjourney)
- [ ] Flujo de "Collect Recipes" (modal de compartir)
- [ ] Flujo de "Add Your Own" (modal de agregar receta)
- [ ] Mobile responsive
- [ ] Panel de detalle de receta (si se decide implementar)