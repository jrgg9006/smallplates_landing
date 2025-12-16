# Phase 2: Information Architecture

## Objetivo

Define the content hierarchy, primary user actions, and layout zones for the redesigned Cookbook Main Page.

---

## Pasos

### 1. **User Intent Analysis**

**Descripción:** Understand what Captains come to this page to do.

**Deliverable(s):** Prioritized action list.

---

#### Primary Actions (Must be Obvious)

| Action | Frequency | Current Visibility | Target Visibility |
|--------|-----------|-------------------|-------------------|
| **See progress on the book** | Every visit | Low (just a recipe count) | High (visual book preview) |
| **Add a recipe** | Frequent | Medium (FAB menu) | High (prominent, inviting) |
| **Share link to collect recipes** | Frequent | Low (buried in FAB menu) | *Out of scope for now* |
| **Invite another captain** | Occasional | Medium (FAB menu) | Medium (accessible but not primary) |

#### Secondary Actions (Should be Accessible)

| Action | Frequency | Current Visibility |
|--------|-----------|-------------------|
| Edit a recipe | As needed | Good (per-row action) |
| Delete a recipe | Rare | Good (per-row action) |
| Search recipes | As scale grows | Good |
| Reorder recipes | Occasional | Good (drag handles) |
| View recipe details | Moderate | Good (click row) |

#### Tertiary Actions (Available but Not Prominent)

| Action | Frequency |
|--------|-----------|
| Print/Preview Book | End of process |
| Switch between books | If user has multiple |
| Edit book settings | Rare |

---

### 2. **Hierarchy Decisions**

**Descripción:** Define what's primary, secondary, tertiary in the visual hierarchy.

**Deliverable(s):** Hierarchy framework.

---

#### Level 1: Primary Focus

> **"The Book"** — The user should always see what they're building.

**Proposal:** A persistent book visualization (left side on desktop) showing:
- Book cover with couple's names
- Recipe count / progress indicator
- Thumbnails of recent recipes (optional)

**Rationale:** 
- Current interface has no visual representation of the final product
- The book IS the product — it should be present
- Creates emotional connection to the outcome
- Inspired by Dots showing the album prominently

---

#### Level 2: Action Zone

> **"Build the Book"** — The primary CTA area.

**Proposal:** Clear action hierarchy:
1. **Add Recipe** — Primary (Honey button)
2. **Invite Contributor** — Secondary (text link or subtle button)

**Kill:** The generic teal FAB. Replace with intentional, branded CTAs.

---

#### Level 3: Content Zone

> **"The Recipes"** — What's been collected so far.

**Proposal:** Recipe cards (not rows) showing:
- Recipe name (prominent)
- Contributor name + avatar
- Photo thumbnail (if uploaded)
- Quick actions on hover/tap

**Rationale:**
- Cards feel more tactile, more like "pages in a book"
- Grid layout scales better visually
- Allows for photos when available
- More aligned with editorial aesthetic

---

#### Level 4: Utility Zone

> **Navigation, Search, Settings** — Necessary but not featured.

**Keep functional but quiet:**
- Book selector dropdown
- Search
- Members list
- Settings/More menu

---

### 3. **Layout Zones (Desktop)**

**Descripción:** Define the spatial organization of the page.

**Deliverable(s):** Zone map.

---

```
┌─────────────────────────────────────────────────────────────────────────┐
│  HEADER                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │  Logo                                    Nav · User Avatar          ││
│  └─────────────────────────────────────────────────────────────────────┘│
├───────────────────────────┬─────────────────────────────────────────────┤
│                           │                                             │
│  BOOK ZONE (30%)          │  CONTENT ZONE (70%)                         │
│  ─────────────────        │  ─────────────────────                      │
│                           │                                             │
│  ┌───────────────────┐    │  ┌─────────────────────────────────────────┐│
│  │                   │    │  │  Book Title                    [Actions]││
│  │   BOOK PREVIEW    │    │  │  Subtitle                               ││
│  │                   │    │  └─────────────────────────────────────────┘│
│  │   "Ana & Ric"     │    │                                             │
│  │                   │    │  ┌─────────────────────────────────────────┐│
│  │   12 recipes      │    │  │  ACTION BAR                             ││
│  │                   │    │  │  [+ Add Recipe]  [Invite Captain]       ││
│  └───────────────────┘    │  └─────────────────────────────────────────┘│
│                           │                                             │
│  Progress: 12/50          │  ┌─────────────────────────────────────────┐│
│                           │  │  RECIPE GRID                            ││
│  [Print Preview]          │  │                                         ││
│                           │  │  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐       ││
│                           │  │  │     │ │     │ │     │ │     │       ││
│                           │  │  │ R1  │ │ R2  │ │ R3  │ │ R4  │       ││
│                           │  │  │     │ │     │ │     │ │     │       ││
│                           │  │  └─────┘ └─────┘ └─────┘ └─────┘       ││
│                           │  │                                         ││
│                           │  │  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐       ││
│                           │  │  │     │ │     │ │     │ │     │       ││
│                           │  │  │ R5  │ │ R6  │ │ R7  │ │ R8  │       ││
│                           │  │  │     │ │     │ │     │ │     │       ││
│                           │  │  └─────┘ └─────┘ └─────┘ └─────┘       ││
│                           │  │                                         ││
│                           │  └─────────────────────────────────────────┘│
│                           │                                             │
└───────────────────────────┴─────────────────────────────────────────────┘
```

---

### 4. **Component Decisions**

**Descripción:** Key decisions about component structure.

**Deliverable(s):** Decision log.

---

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Recipe display | **Card grid** (not rows) | More tactile, editorial, allows photos |
| Book visualization | **Persistent left panel** | Book is the product; should be visible |
| Primary CTA | **"Add Recipe" button** (not FAB) | More intentional, less generic |
| Number badges | **Remove** | They're administrative, not emotional |
| Recipe reordering | **Keep drag-drop** | Useful for captains curating order |
| Search | **Keep, but secondary** | Useful at scale, not primary action |

---

### 5. **Empty States**

**Descripción:** What users see when content is missing.

**Deliverable(s):** Empty state requirements.

---

#### No Recipes Yet

**Current:** Empty list (nothing)

**Proposed:**
> "No recipes yet—but that's about to change.
> 
> [Add your first recipe] or [Invite someone to contribute]"

**Tone:** Encouraging, not sad. Forward motion.

---

#### No Photo Uploaded (on recipe card)

**Current:** Gray placeholder box

**Proposed:** 
- Warm-toned placeholder with icon
- Or: Just show text content, no placeholder (cleaner)

---

## Referencias

- Inspiration: Dots calendar-based navigation, album-centric view
- Documents consulted: `brand-personality.md`, `visual-identity.md`

---

## Status

✓ **Phase 2 Complete**

**Key Decisions Made:**
1. Add persistent book visualization on left
2. Replace FAB with intentional branded buttons
3. Switch from recipe rows to recipe cards
4. Remove administrative elements (number badges)

**Next:** Phase 3 — Visual Design Direction (color/type application, component styles)

---

*Document created: December 2025*