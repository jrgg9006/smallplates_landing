# Phase 4: Layout Proposal

## Objetivo

Define the specific layout, component placement, and interaction patterns for the redesigned Cookbook Main Page (Desktop).

---

## Pasos

### 1. **Desktop Layout — Full Specification**

**Descripción:** Detailed wireframe with all zones and components.

**Deliverable(s):** Annotated layout diagram with specifications.

---

#### Full Page Layout

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│  HEADER BAR (height: 64px, background: #FFFFFF, border-bottom: 1px #E8E0D5)          │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐│
│  │                                                                                  ││
│  │  [LOGO]                                           My Books    [Avatar ▾]        ││
│  │  Small Plates & Co.                                                              ││
│  │                                                                                  ││
│  └──────────────────────────────────────────────────────────────────────────────────┘│
├────────────────────────────┬─────────────────────────────────────────────────────────┤
│                            │                                                         │
│  BOOK ZONE                 │  CONTENT ZONE                                           │
│  width: 320px              │  flex: 1                                                │
│  padding: 32px             │  padding: 48px                                          │
│  background: #F5F1EB       │  background: #FAF7F2                                    │
│                            │                                                         │
│  ┌────────────────────┐    │  ┌─────────────────────────────────────────────────────┐│
│  │                    │    │  │  HEADER SECTION                                     ││
│  │  ┌──────────────┐  │    │  │                                                     ││
│  │  │              │  │    │  │  [dropdown: Ana y Ric ▾]     [Members (2)]  [⋯]    ││
│  │  │  BOOK COVER  │  │    │  │                                                     ││
│  │  │              │  │    │  │  ─────────────────────────────────────────────────  ││
│  │  │   Ana & Ric  │  │    │  │                                                     ││
│  │  │              │  │    │  │  Ana & Ric's Book                                   ││
│  │  │  ───────────  │  │    │  │  Recipes from the people who love you.             ││
│  │  │              │  │    │  │                                                     ││
│  │  │  A cookbook  │  │    │  └─────────────────────────────────────────────────────┘│
│  │  │  by everyone │  │    │                                                         │
│  │  │  who loves   │  │    │  ┌─────────────────────────────────────────────────────┐│
│  │  │  you         │  │    │  │  ACTION BAR                                         ││
│  │  │              │  │    │  │                                                     ││
│  │  └──────────────┘  │    │  │  [+ Add a Recipe]      Invite a Captain             ││
│  │                    │    │  │   (Honey btn)           (text link)                 ││
│  │  12 recipes        │    │  │                                                     ││
│  │  ══════════░░░░░░  │    │  └─────────────────────────────────────────────────────┘│
│  │                    │    │                                                         │
│  │  [Preview Book →]  │    │  ┌─────────────────────────────────────────────────────┐│
│  │                    │    │  │  RECIPE SECTION                                     ││
│  └────────────────────┘    │  │                                                     ││
│                            │  │  Recipes (12)                         [🔍 Search]   ││
│                            │  │                                                     ││
│                            │  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐   ││
│                            │  │  │ ░░░░░░░ │ │ ░░░░░░░ │ │ ░░░░░░░ │ │ ░░░░░░░ │   ││
│                            │  │  │         │ │         │ │         │ │         │   ││
│                            │  │  │ Sunday  │ │ Nana's  │ │ Tomato  │ │ Lemon   │   ││
│                            │  │  │ Pasta   │ │ Cookies │ │ Soup    │ │ Tart    │   ││
│                            │  │  │         │ │         │ │         │ │         │   ││
│                            │  │  │ [○] Rob │ │ [○] Ana │ │ [○] Mom │ │ [○] Ric │   ││
│                            │  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘   ││
│                            │  │                                                     ││
│                            │  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐   ││
│                            │  │  │ ░░░░░░░ │ │ ░░░░░░░ │ │ ░░░░░░░ │ │ ░░░░░░░ │   ││
│                            │  │  │         │ │         │ │         │ │         │   ││
│                            │  │  │ Paella  │ │ Bread   │ │ Salad   │ │ Chicken │   ││
│                            │  │  │         │ │         │ │         │ │         │   ││
│                            │  │  │ [○] Tía │ │ [○] Dad │ │ [○] Mia │ │ [○] Jon │   ││
│                            │  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘   ││
│                            │  │                                                     ││
│                            │  └─────────────────────────────────────────────────────┘│
│                            │                                                         │
└────────────────────────────┴─────────────────────────────────────────────────────────┘
```

---

### 2. **Zone Specifications**

**Descripción:** Detailed specs for each zone.

---

#### Header Bar

| Property | Value |
|----------|-------|
| Height | 64px |
| Background | #FFFFFF |
| Border | 1px solid #E8E0D5 (bottom) |
| Padding | 0 48px |
| Position | Fixed top |

| Component | Position | Specs |
|-----------|----------|-------|
| Logo | Left | Minion Pro 20px + Inter 14px "&Co." |
| Navigation | Right | Inter 15px, #2D2D2D |
| User Avatar | Right | 36px circle, dropdown on click |

---

#### Book Zone (Left Panel)

| Property | Value |
|----------|-------|
| Width | 320px (fixed) |
| Background | #F5F1EB (Cream) |
| Padding | 32px |
| Min-height | calc(100vh - 64px) |

| Component | Specs |
|-----------|-------|
| Book Cover | White card (#FFFFFF), 24px border-radius, shadow, centered |
| Book Title | Minion Pro 24px, centered |
| Subtitle | Inter 14px, #9A9590, centered |
| Recipe Count | Inter 14px, #9A9590, "12 recipes" |
| Progress Bar | 8px height, #E8E0D5 track, #D4A854 fill |
| Preview Link | Inter 14px Medium, #D4A854, "Preview Book →" |

---

#### Content Zone (Right Panel)

| Property | Value |
|----------|-------|
| Flex | 1 (fills remaining space) |
| Background | #FAF7F2 (Warm White) |
| Padding | 48px |
| Max-width | 1200px |
| Overflow-y | Auto |

---

#### Header Section (within Content Zone)

| Component | Specs |
|-----------|-------|
| Book Selector | Dropdown, Inter 14px, outline style |
| Members Button | Pill button, outline, Inter 14px |
| More Menu | "⋯" icon, 36px touch target |
| Book Title | Minion Pro 32px, #2D2D2D |
| Subtitle | Inter 16px, #9A9590 |

---

#### Action Bar (within Content Zone)

| Component | Specs |
|-----------|-------|
| Add Recipe Button | Primary style (Honey), Inter 15px Medium |
| Invite Captain Link | Text link, Inter 14px, #D4A854 |
| Gap | 24px between elements |

---

#### Recipe Section (within Content Zone)

| Property | Value |
|----------|-------|
| Grid | 4 columns, 24px gap |
| Column min-width | 220px |
| Responsive | 3 cols at 1200px, 2 cols at 900px |

| Component | Specs |
|-----------|-------|
| Section Title | Inter 14px Medium, #9A9590, "Recipes (12)" |
| Search | Input field, right-aligned |

---

### 3. **Recipe Card — Detail Specification**

**Descripción:** Complete specs for the recipe card component.

**Principio clave:** El texto ES el diseño. No dependemos de imágenes. El nombre de la receta es el protagonista visual, como un menú elegante de restaurante.

---

#### Default Card (Text-First — Most Common)

```
┌────────────────────────────────────────┐
│                                        │
│                                        │
│  Sunday Pasta                          │  Recipe Name
│                                        │  Minion Pro 20px, #2D2D2D
│  ────────────────────────────────────  │  Decorative line (1px, #E8E0D5)
│                                        │
│  [○] Roberto García                    │  Contributor
│                                        │  Avatar 28px + Inter 14px #9A9590
│                                        │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │
│                                        │  Hover State: shows actions
│  [Edit]              [Remove]          │  Inter 13px, icons + text
│                                        │
└────────────────────────────────────────┘
```

**Este es el estado principal.** La mayoría de las recetas no tendrán imagen (el guest sube texto, la imagen bella se crea después en InDesign para impresión). El card debe verse hermoso SIN imagen.

---

#### Card With Image (Bonus — When Guest Uploads Photo)

```
┌────────────────────────────────────────┐
│                                        │
│  ┌──────────────────────────────────┐  │
│  │                                  │  │  Image Zone (ONLY if uploaded)
│  │         GUEST PHOTO              │  │  aspect-ratio: 4/3
│  │                                  │  │  border-radius: 8px
│  └──────────────────────────────────┘  │  object-fit: cover
│                                        │
│  Sunday Pasta                          │  Recipe Name (smaller when image)
│                                        │  Inter 18px Medium, #2D2D2D
│                                        │
│  [○] Roberto García                    │  Contributor
│                                        │
└────────────────────────────────────────┘
```

**Solo aparece si el guest subió una foto.** No hay placeholder, no hay espacio vacío, no hay ícono triste.

---

**Card Specs:**

| Property | Value |
|----------|-------|
| Background | #FFFFFF |
| Border-radius | 12px |
| Padding | 24px |
| Min-height | 120px |
| Shadow (default) | 0 1px 3px rgba(45,45,45,0.08) |
| Shadow (hover) | 0 4px 12px rgba(45,45,45,0.12) |
| Transition | all 0.2s ease |

**Typography Priority (Text-First Card):**

| Element | Font | Size | Weight | Color |
|---------|------|------|--------|-------|
| Recipe Name | Minion Pro | 20px | Regular | #2D2D2D |
| Contributor | Inter | 14px | Regular | #9A9590 |
| Decorative Line | — | 1px | — | #E8E0D5 |

---

### 4. **Interaction Patterns**

**Descripción:** Define hover, click, and transition behaviors.

---

#### Recipe Card

| State | Behavior |
|-------|----------|
| Default | Static, subtle shadow |
| Hover | Lift (translateY -2px), deeper shadow, show action buttons |
| Click | Open recipe detail drawer (right panel) |
| Drag | Show drag handle on left edge, reduce opacity to 80% |

#### Primary Button (Add Recipe)

| State | Behavior |
|-------|----------|
| Default | Honey background (#D4A854) |
| Hover | Darker honey (#B8923E) |
| Active | Scale 0.98 |
| Focus | Honey ring outline |

#### Book Preview

| State | Behavior |
|-------|----------|
| Default | Static |
| Hover on "Preview" | Underline |
| Click "Preview" | Open print preview modal |

---

### 5. **Responsive Breakpoints**

**Descripción:** How layout adapts to screen sizes.

---

| Breakpoint | Layout Change |
|------------|---------------|
| > 1400px | Full layout as specified |
| 1200-1400px | Recipe grid: 3 columns |
| 900-1200px | Recipe grid: 2 columns |
| < 900px | Book Zone collapses to top banner; single column grid |
| < 768px | Switch to mobile layout (separate spec) |

---

## Referencias

- Phase 2: Information Architecture (zone definitions)
- Phase 3: Visual Design Direction (component styles)

---

## Status

✓ **Phase 4 Complete**

**Deliverables Created:**
- Full page layout wireframe
- Zone specifications
- Recipe card detail specification
- Interaction patterns
- Responsive breakpoints

**Next:** Phase 5 — Micro-copy Rewrite (all labels, buttons, empty states)

---

*Document created: December 2025*