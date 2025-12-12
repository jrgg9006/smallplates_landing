# Phase 3: Visual Design Direction

## Objetivo

Define the visual language for the redesigned Cookbook Main Page: colors, typography, spacing, and component styles that align with Small Plates brand identity.

---

## Pasos

### 1. **Color Application**

**Descripción:** Map brand colors to specific UI elements.

**Deliverable(s):** Color specification table.

---

#### Background Colors

| Element | Color | Hex | Notes |
|---------|-------|-----|-------|
| Page background | Warm White | #FAF7F2 | Never pure white |
| Book preview zone | Cream | #F5F1EB | Subtle differentiation |
| Recipe cards | White | #FFFFFF | Slight elevation over Warm White |
| Modal overlays | Warm White | #FAF7F2 | With shadow |
| Modal backdrop | Soft Charcoal | #2D2D2D @ 50% opacity | Warm, not cold gray |

---

#### Text Colors

| Element | Color | Hex | Notes |
|---------|-------|-----|-------|
| Primary text | Soft Charcoal | #2D2D2D | Headlines, recipe names |
| Secondary text | Warm Gray | #9A9590 | Dates, helper text, labels |
| Interactive text | Honey | #D4A854 | Links, hover states |
| Disabled text | Warm Gray | #9A9590 @ 50% opacity | |

---

#### Accent Colors

| Element | Color | Hex | Notes |
|---------|-------|-----|-------|
| Primary CTA | Honey | #D4A854 | "Add Recipe" button |
| Primary CTA hover | Honey Dark | #B8923E | 15% darker |
| Secondary CTA | Transparent | — | Outline or text only |
| Success indicator | Olive | #6B7B5E | Subtle, not aggressive green |
| Warning/Delete | Terracotta | #C4856C | Warm, not harsh red |

---

#### Decorative Colors

| Element | Color | Hex | Notes |
|---------|-------|-----|-------|
| Progress indicator | Honey | #D4A854 | |
| Avatar ring (captain) | Honey | #D4A854 | Distinguish captains from guests |
| Card border (hover) | Sand | #E8E0D5 | Subtle lift |

---

### 2. **Typography Application**

**Descripción:** Map typefaces to specific UI elements.

**Deliverable(s):** Typography specification table.

---

#### Type Scale

| Level | Font | Weight | Size | Line Height | Use Case |
|-------|------|--------|------|-------------|----------|
| **Display** | Minion Pro | Regular | 32px | 1.2 | Book title on preview |
| **H1** | Minion Pro | Regular | 28px | 1.3 | Page title (Book name) |
| **H2** | Minion Pro | Regular | 22px | 1.3 | Section headers |
| **H3** | Inter | Medium | 18px | 1.4 | Recipe names in cards |
| **Body** | Inter | Regular | 16px | 1.5 | General text |
| **Body Small** | Inter | Regular | 14px | 1.5 | Helper text, dates |
| **Caption** | Inter | Medium | 12px | 1.4 | Labels, badges |
| **Button** | Inter | Medium | 15px | 1 | CTAs |

---

#### Font Loading

```css
/* Primary editorial serif */
@import url('https://use.typekit.net/[your-kit-id].css'); /* Minion Pro */

/* Or fallback if Minion Pro unavailable */
font-family: 'Minion Pro', 'Georgia', 'Times New Roman', serif;

/* UI sans-serif */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');
font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
```

---

### 3. **Spacing System**

**Descripción:** Define consistent spacing values.

**Deliverable(s):** Spacing scale.

---

#### Base Unit: 8px

| Token | Value | Use Case |
|-------|-------|----------|
| `space-1` | 4px | Tight (icon padding) |
| `space-2` | 8px | Small (between related items) |
| `space-3` | 16px | Medium (card padding) |
| `space-4` | 24px | Large (section spacing) |
| `space-5` | 32px | XL (zone separation) |
| `space-6` | 48px | XXL (major sections) |
| `space-7` | 64px | Page margins |

---

#### Layout Spacing

| Element | Spacing |
|---------|---------|
| Page margin (desktop) | 48px |
| Book zone width | 30% (min 320px, max 400px) |
| Content zone width | 70% |
| Zone gap | 48px |
| Card gap | 24px |
| Card padding | 20px |

---

### 4. **Component Styles**

**Descripción:** Define styles for reusable components.

**Deliverable(s):** Component specifications.

---

#### Buttons

**Primary Button (Add Recipe)**
```css
.btn-primary {
  background: #D4A854;
  color: #FFFFFF;
  font-family: 'Inter', sans-serif;
  font-weight: 500;
  font-size: 15px;
  padding: 12px 24px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  transition: background 0.2s ease;
}

.btn-primary:hover {
  background: #B8923E;
}
```

**Secondary Button (Invite Captain)**
```css
.btn-secondary {
  background: transparent;
  color: #2D2D2D;
  font-family: 'Inter', sans-serif;
  font-weight: 500;
  font-size: 15px;
  padding: 12px 24px;
  border-radius: 8px;
  border: 1px solid #E8E0D5;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-secondary:hover {
  border-color: #D4A854;
  color: #D4A854;
}
```

**Text Link**
```css
.text-link {
  color: #D4A854;
  font-family: 'Inter', sans-serif;
  font-weight: 500;
  font-size: 14px;
  text-decoration: none;
  cursor: pointer;
}

.text-link:hover {
  text-decoration: underline;
}
```

---

#### Recipe Card

```css
.recipe-card {
  background: #FFFFFF;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(45, 45, 45, 0.08);
  transition: all 0.2s ease;
  cursor: pointer;
}

.recipe-card:hover {
  box-shadow: 0 4px 12px rgba(45, 45, 45, 0.12);
  transform: translateY(-2px);
}

.recipe-card__title {
  font-family: 'Inter', sans-serif;
  font-weight: 500;
  font-size: 18px;
  color: #2D2D2D;
  margin-bottom: 8px;
}

.recipe-card__contributor {
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  color: #9A9590;
  display: flex;
  align-items: center;
  gap: 8px;
}

.recipe-card__avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  object-fit: cover;
}
```

---

#### Book Preview Panel

```css
.book-preview {
  background: #F5F1EB;
  border-radius: 16px;
  padding: 32px;
  text-align: center;
}

.book-preview__cover {
  background: #FFFFFF;
  border-radius: 8px;
  padding: 40px 32px;
  box-shadow: 
    0 2px 4px rgba(45, 45, 45, 0.08),
    0 8px 24px rgba(45, 45, 45, 0.12);
  margin-bottom: 24px;
}

.book-preview__title {
  font-family: 'Minion Pro', Georgia, serif;
  font-size: 28px;
  color: #2D2D2D;
  margin-bottom: 8px;
}

.book-preview__subtitle {
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  color: #9A9590;
}

.book-preview__progress {
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  color: #9A9590;
  margin-top: 16px;
}

.book-preview__progress-count {
  font-weight: 500;
  color: #D4A854;
}
```

---

#### Modal

```css
.modal-backdrop {
  background: rgba(45, 45, 45, 0.5);
}

.modal {
  background: #FAF7F2;
  border-radius: 16px;
  padding: 32px;
  max-width: 480px;
  box-shadow: 0 24px 48px rgba(45, 45, 45, 0.2);
}

.modal__title {
  font-family: 'Minion Pro', Georgia, serif;
  font-size: 24px;
  color: #2D2D2D;
  margin-bottom: 8px;
}

.modal__subtitle {
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  color: #9A9590;
  margin-bottom: 24px;
}
```

---

#### Input Fields

```css
.input-field {
  width: 100%;
  padding: 12px 16px;
  font-family: 'Inter', sans-serif;
  font-size: 15px;
  color: #2D2D2D;
  background: #FFFFFF;
  border: 1px solid #E8E0D5;
  border-radius: 8px;
  transition: border-color 0.2s ease;
}

.input-field:focus {
  outline: none;
  border-color: #D4A854;
}

.input-field::placeholder {
  color: #9A9590;
}

.input-label {
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  font-weight: 500;
  color: #2D2D2D;
  margin-bottom: 8px;
  display: block;
}
```

---

### 5. **Iconography**

**Descripción:** Define icon style and usage.

**Deliverable(s):** Icon guidelines.

---

#### Style Guidelines

- **Library:** Use Lucide or Phosphor icons (consistent, clean)
- **Stroke:** 1.5px stroke width
- **Size:** 20px default, 16px small, 24px large
- **Color:** Inherits text color

#### Icon Usage

| Action | Icon | Notes |
|--------|------|-------|
| Add | Plus | Simple, clear |
| Edit | Pencil | Or "PencilSimple" |
| Delete | Trash | Use Terracotta on hover |
| Drag | GripVertical | Six dots |
| Close | X | Modals, panels |
| Search | MagnifyingGlass | |
| Members | Users | |
| Link | Link | For copy link actions |
| Book | Book | For print/preview |

---

## Referencias

- Documents consulted: `visual-identity.md` (complete color specs)
- Typography: Minion Pro (Adobe Fonts) + Inter (Google Fonts)

---

## Status

✓ **Phase 3 Complete**

**Deliverables Created:**
- Color application map
- Typography scale
- Spacing system
- Component style specifications (CSS)
- Icon guidelines

**Next:** Phase 4 — Layout Proposal (wireframe with brand principles applied)

---

*Document created: December 2025*