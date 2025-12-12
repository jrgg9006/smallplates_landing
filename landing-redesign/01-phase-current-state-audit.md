# Phase 1: Current State Audit

## Objetivo

Document every component on the current Cookbook Main Page, identify brand friction points, and create a clear inventory for redesign decisions.

---

## Pasos

### 1. **Component Inventory**

**Descripción:** Map every UI element visible on the main cookbook page and its modals.

**Deliverable(s):** Component list with current specifications and brand alignment score.

---

#### Header Zone

| Component | Current Implementation | Brand Alignment | Action |
|-----------|----------------------|-----------------|--------|
| Logo | "Small Plates & Co." — serif + sans combo | ✓ Good | Keep, verify typeface |
| Navigation | "My Books" link | Okay, but lonely | Review IA |
| User Avatar | Circle with image | ✓ Functional | Keep |

---

#### Hero/Title Zone

| Component | Current Implementation | Brand Alignment | Action |
|-----------|----------------------|-----------------|--------|
| Type Label | "NOT A COOKBOOK" (all caps, gray) | ✗ Unclear purpose, reads as error | Remove or rethink |
| Book Title | "Ana y Ric Team SmallPlates" + edit icon | ✓ Good prominence | Apply Minion Pro |
| Subtitle | "Add recipes and invite friends to build your Book" | ✓ Clear purpose | Refine copy |
| Book Selector | Dropdown with book name | ✓ Functional | Style to brand |
| Print Book Button | Black pill, book icon | ✗ Black doesn't match palette | Change to Honey or outline |

---

#### Action Zone (Top Right)

| Component | Current Implementation | Brand Alignment | Action |
|-----------|----------------------|-----------------|--------|
| Members Button | Outline pill "Members (2)" | ✓ Clear | Style refinement |
| More Menu | "..." icon | ✓ Standard | Keep |
| FAB (+) | Large teal circle with white + | ✗ Teal is not brand color, generic pattern | **Major change needed** |

---

#### Recipe List Zone

| Component | Current Implementation | Brand Alignment | Action |
|-----------|----------------------|-----------------|--------|
| Section Title | "My Small Plates" (bold serif + sans) | ✓ Has voice | Keep concept |
| Search | Standard input with icon | ✓ Functional | Style to brand |
| Recipe Row | Numbered badge, name, chef avatar, "Added by You" tag, Edit/Delete | ✗ Spreadsheet energy | **Major change needed** |
| Drag Handle | Six-dot icon | ✓ Functional | Keep |
| Number Badge | Black circle with white number | ✗ Cold, administrative | Consider removing or softening |

---

#### Recipe Detail Panel (Side Drawer)

| Component | Current Implementation | Brand Alignment | Action |
|-----------|----------------------|-----------------|--------|
| Header | "Recipe Details" | ✗ Generic | Rewrite |
| Contributor Info | Avatar + name + "(Collected from link)" + date | ✓ Good information | Style refinement |
| Recipe Name | Large serif | ✓ Good | Apply Minion Pro |
| "Shared by" | Attribution line | ✓ Good | Keep |
| Note Field | "Noe Optional" label, text area | ✗ Typo ("Noe"?), label unclear | Fix and clarify |
| Uploaded Files | Gray placeholder box | ✗ Empty state is sad | Design proper empty state |

---

#### Members Dropdown

| Component | Current Implementation | Brand Alignment | Action |
|-----------|----------------------|-----------------|--------|
| Header | "Cookbook Memberss" (typo) | ✗ Typo | Fix |
| Member Row | Name, role badge, email, join date | ✓ Complete info | Style refinement |
| Owner Badge | Crown icon, golden text | ✓ Nice detail | Keep |
| Invite CTA | "Invite a friend to this Book" | ✓ Clear | Keep |

---

#### Add Menu (FAB Dropdown)

| Component | Current Implementation | Brand Alignment | Action |
|-----------|----------------------|-----------------|--------|
| Option 1 | "Add a saved plate" | ✓ Clear | Keep |
| Option 2 | "Create a new plate" | ✓ Clear | Keep |
| Option 3 | "Collection link - Get Plates" | ✓ Clear | Out of scope |
| Option 4 | "Invite a friend to this Book" | ✓ Clear | Keep |

---

#### Add Recipe Modal

| Component | Current Implementation | Brand Alignment | Action |
|-----------|----------------------|-----------------|--------|
| Title | "Add a Small Plate" | ✓ Uses brand language | Keep |
| Guest Selector | Dropdown "Select a guest" | ✓ Functional | Style to brand |
| Checkbox | "This is my own plate" | ✓ Good option | Keep |
| Plate Type Toggle | Text / Images buttons | ✗ Black/white, generic | Style with brand colors |
| Name Input | "Small Plate Name" placeholder | ✓ Good | Keep |
| Note Field | "Add a Note!" with "(optional...but encouraged!)" | ✗ Exclamation marks, eager tone | Rewrite |
| Ingredients | "(Optional) List the ingredients..." | ✓ Clear | Keep |
| Instructions | "List the steps needed..." | ✓ Clear | Style refinement |
| Save Button | Full-width black button | ✗ Black, heavy | Change to Honey |

---

#### Invite Friend Modal

| Component | Current Implementation | Brand Alignment | Action |
|-----------|----------------------|-----------------|--------|
| Title | "Add a friend to this book" | ✓ Clear | Keep |
| Context | "Inviting to: [Book Name]" | ✓ Good context | Keep |
| Name Input | Standard text field | ✓ Functional | Style to brand |
| Email Input | Standard text field | ✓ Functional | Style to brand |
| Helper Text | "An invitation to join will be sent to this email" | ✓ Clear | Keep |
| Link Option | "Or share invite link" with copy button | ✓ Good alternative | Keep |
| Buttons | Cancel (outline) + Send Invite (teal) | ✗ Teal is not brand | Change to Honey |

---

### 2. **Friction Map Summary**

**Descripción:** Categorize issues by severity and type.

**Deliverable(s):** Priority matrix for redesign.

---

#### Critical (Must Fix)

| Issue | Impact |
|-------|--------|
| Teal accent color throughout | Entire interface feels off-brand |
| Recipe list feels like spreadsheet | Core experience lacks warmth |
| Black buttons | Cold, corporate, not Small Plates |
| Generic FAB pattern | Every app has this. Not distinctive. |

#### High (Should Fix)

| Issue | Impact |
|-------|--------|
| No visual representation of the book | User never sees what they're building |
| "NOT A COOKBOOK" label confusion | Unclear, potentially negative |
| Exclamation marks in copy | Too eager, not Margot |
| Typography not applied (Minion Pro + Inter) | Missing editorial feel |

#### Medium (Nice to Fix)

| Issue | Impact |
|-------|--------|
| Typos ("Noe", "Memberss") | Quality perception |
| Pure white background | Should be Warm White |
| Empty states need design | Currently sad gray boxes |
| Number badges | Administrative feel |

---

### 3. **Key Questions for Next Phase**

1. Should the recipe list become a card grid instead of rows?
2. Should there be a persistent book visualization on desktop (like Dots has on mobile)?
3. What's the right metaphor for the FAB — should it be a "+" or something more aligned with "passing a plate"?
4. Should we show recipe previews (images) in the list, or keep it text-focused?

---

## Referencias

- Screenshots analyzed: 7 desktop captures
- Documents consulted: `visual-identity.md`, `tone-of-voice.md`, `brand-character-profile.md`

---

## Status

✓ **Phase 1 Complete**

**Next:** Phase 2 — Information Architecture (hierarchy decisions, layout zones)

---

*Document created: December 2025*