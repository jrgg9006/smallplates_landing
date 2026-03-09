# Claude Code Prompt — Import Guests from Zola / The Knot (Phase 1)

## Context

You are working on **Small Plates & Co.** (`smallplatesandcompany.com`), a Next.js 14 + TypeScript + Tailwind + Supabase application where wedding guests contribute recipes to a collaborative hardcover book.

The current stack:
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Supabase (database + auth)
- The brand palette: Warm White `#FAF7F2`, Honey `#D4A854`, Soft Charcoal `#2D2D2D`, Terracotta `#C4856C`, Sand `#E8E0D5`

---

## Objective

Add a guest import feature that allows the book organizer to upload their guest list from **Zola** or **The Knot** (CSV or Excel), select which guests to include, and save them to Supabase — all without leaving the existing Guests modal.

---

## File to Modify

```
components/profile/guests/GuestNavigationSheet.tsx
```

This is the existing "Manage Guests" modal/sheet. **Do not break anything that currently exists.** Only add the new import button and wire it to the new component.

---

## New File to Create

```
components/profile/guests/ImportGuestsModal.tsx
```

This is a self-contained modal component with its own internal state machine managing three steps.

---

## Step 1 — Add Import Button to GuestNavigationSheet.tsx

Inside `GuestNavigationSheet.tsx`, locate the bottom section where the `+ Add Guest` button lives.

**Add a new button ABOVE the existing `+ Add Guest` button.** The two buttons should stack vertically like this:

```
[ ↑ Import guests from  [Zola logo]  [The Knot logo] ]   ← NEW (secondary style)
[ + Add Guest ]                                     ← EXISTING (unchanged)
```

### Import Button Specs:
- **Full width**, same width as "Add Guest"
- **Background:** `#FAF7F2` (Warm White) with a `1.5px dashed border` in `#D4A854` (Honey)
- **Text:** `"Import guests from"` in `#2D2D2D`, font size `14px`, font weight `500`
- **Followed by two inline logos:** Zola logo + The Knot logo, each `20px` tall, displayed inline with `6px` gap between them
- **Border radius:** same as existing buttons in the file (match existing style)
- **Padding:** `12px 16px`
- **Hover state:** background shifts to `#E8E0D5` (Sand), border becomes solid

### Logo implementation:
Use these official CDN-hosted SVG/PNG logos:
- **Zola:** Use the text "Zola" in their brand font color `#000000` with a small heart icon, OR use `https://www.zola.com/favicon.ico` as a fallback 16x16 img
- **The Knot:** Use the text "The Knot" in `#810031` (their brand red) 
- If logos fail to load, gracefully fall back to plain text: `"Zola"` and `"The Knot"`

> Note: If you can find the actual SVG logos embedded inline, prefer that. Otherwise use text with brand colors — do NOT use broken image icons.

### On click:
```tsx
onClick={() => setShowImportModal(true)}
```

Add `const [showImportModal, setShowImportModal] = useState(false)` to the component.

Render `<ImportGuestsModal>` conditionally at the bottom of the sheet when `showImportModal === true`, passing the required props (see below).

---

## Step 2 — Build ImportGuestsModal.tsx

This is a **modal that layers on top of the existing GuestNavigationSheet** (z-index higher). It has its own backdrop (`bg-black/50`) and is centered on screen.

### Props interface:
```tsx
interface ImportGuestsModalProps {
  groupId: string              // The current book/group ID
  onClose: () => void          // Closes this modal
  onImportComplete: () => void // Triggers guest list refresh in parent
}
```

### Internal state:
```tsx
type Step = 'select-source' | 'upload-file' | 'select-guests'
type Source = 'zola' | 'the_knot' | null

const [step, setStep] = useState<Step>('select-source')
const [source, setSource] = useState<Source>(null)
const [parsedGuests, setParsedGuests] = useState<ParsedGuest[]>([])
const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
const [isLoading, setIsLoading] = useState(false)
const [error, setError] = useState<string | null>(null)
```

### ParsedGuest type:
```tsx
interface ParsedGuest {
  id: string          // temp UUID for selection tracking (crypto.randomUUID())
  first_name: string
  last_name: string
  email: string
  phone: string
  alreadyExists?: boolean  // true if email already in Supabase for this group
}
```

---

## Modal Visual Design

### Modal container:
- `max-width: 520px`, `width: 100%`
- `border-radius: 16px`
- `background: #FAF7F2`
- `padding: 32px`
- `box-shadow: 0 20px 60px rgba(0,0,0,0.15)`

### Header (all steps):
- Title: `"Import Guests"` — font size `20px`, weight `600`, color `#2D2D2D`
- Subtitle changes per step (see below)
- X close button top-right, `24px`, color `#2D2D2D`, hover `#C4856C`

### Step indicator (small, subtle):
Show `Step 1 of 3`, `Step 2 of 3`, `Step 3 of 3` in `12px`, color `#999`, below the title.

---

## STEP 1 — Select Source (`select-source`)

**Subtitle:** `"Where is your guest list from?"`

Show two large selectable cards side by side:

```
┌─────────────────┐  ┌─────────────────┐
│                 │  │                 │
│   Zola          │  │   The Knot      │
│   [logo/text]   │  │   [logo/text]   │
│                 │  │                 │
└─────────────────┘  └─────────────────┘
```

### Card specs:
- `width: 50%` each, `gap: 12px`
- `border: 1.5px solid #E8E0D5`
- `border-radius: 12px`
- `padding: 24px 16px`
- `text-align: center`
- `cursor: pointer`
- **Selected state:** `border-color: #D4A854`, `background: #FFF8EC`
- **Hover state:** `border-color: #D4A854` (lighter)

### Below cards:
Small helper text: `"Export your guest list from your registry account, then upload it here."` — `12px`, `#999`

### CTA button:
- `"Continue →"` — full width, `background: #D4A854`, `color: white`, `border-radius: 8px`, `padding: 14px`
- Disabled (opacity 50%) until a source is selected
- On click: `setStep('upload-file')`

---

## STEP 2 — Upload File (`upload-file`)

**Subtitle:** Dynamic based on source:
- Zola: `"Upload your Zola guest list (CSV or Excel)"`
- The Knot: `"Upload your The Knot guest list (CSV or Excel)"`

### How to export helper (collapsible, small):
A small `"How do I export my list?"` link in `#D4A854` that expands to show:
- **Zola:** `"Go to Guest List → click 'Export' → download CSV"`
- **The Knot:** `"Go to Guest List → click 'Export Guest List' → download Excel"`

### File upload zone:
```
┌─────────────────────────────────────┐
│                                     │
│   📄  Drop your file here           │
│       or click to browse            │
│                                     │
│   Accepts .csv and .xlsx files      │
│                                     │
└─────────────────────────────────────┘
```

- `border: 2px dashed #D4A854`
- `border-radius: 12px`
- `padding: 40px 24px`
- `background: #FDFBF8`
- `text-align: center`
- `cursor: pointer`
- **Drag-over state:** `background: #FFF8EC`, `border-color: #C4856C`
- On file select: immediately parse, then `setStep('select-guests')`

### Accept: `.csv, .xlsx, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`

### Back button:
Small `"← Back"` text link above the upload zone, color `#999`, on click `setStep('select-source')`

---

## STEP 2 — File Parsing Logic

Install and use the `xlsx` library (already likely in the project, if not: `npm install xlsx`).

```tsx
import * as XLSX from 'xlsx'

async function parseFile(file: File, source: Source): Promise<ParsedGuest[]> {
  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'array' })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { defval: '' })
  
  return rows.map(row => ({
    id: crypto.randomUUID(),
    first_name: extractColumn(row, source === 'zola' 
      ? ['First Name', 'first_name', 'FirstName'] 
      : ['First Name', 'first_name', 'FirstName']),
    last_name: extractColumn(row, source === 'zola'
      ? ['Last Name', 'last_name', 'LastName']
      : ['Last Name', 'last_name', 'LastName']),
    email: extractColumn(row, source === 'zola'
      ? ['Email Address', 'Email', 'email']
      : ['Email', 'email', 'Email Address']),
    phone: extractColumn(row, source === 'zola'
      ? ['Phone Number', 'Phone', 'phone']
      : ['Phone', 'phone', 'Phone Number']),
  })).filter(g => g.first_name.trim() !== '') // Remove empty rows
}

function extractColumn(row: Record<string, string>, candidates: string[]): string {
  for (const key of candidates) {
    if (row[key] !== undefined && row[key] !== '') return String(row[key]).trim()
  }
  return ''
}
```

### Wedding Date (The Knot only):
After parsing, if `source === 'the_knot'`:
1. Check if any row has a column matching `Wedding Day`, `Wedding Date`, or `WeddingDay`
2. If found and has a value, extract it (take first non-empty value found)
3. Try to parse it as a valid date
4. If valid: check the `groups` table for the current `groupId` — if `wedding_date` is null, update it via Supabase: 
   ```ts
   await supabase.from('groups').update({ wedding_date: parsedDate }).eq('id', groupId)
   ```
5. Do this silently in the background — no UI feedback needed for this

### Deduplication check:
After parsing all guests, query Supabase for existing emails in this group:
```ts
const { data: existing } = await supabase
  .from('guests')
  .select('email')
  .eq('group_id', groupId)

const existingEmails = new Set(existing?.map(g => g.email?.toLowerCase()))

return parsedGuests.map(g => ({
  ...g,
  alreadyExists: existingEmails.has(g.email?.toLowerCase())
}))
```

---

## STEP 3 — Select Guests (`select-guests`)

**Subtitle:** `"Select who to add to your book"`

### Header bar (inside modal, above list):
```
[✓ Select All]                    [X of Y selected]
```
- "Select All" is a checkbox + label, left-aligned
- Counter is right-aligned, `14px`, color `#999`
- When all are selected, "Select All" becomes "Deselect All"

### Guest list:
- Scrollable container, `max-height: 320px`, `overflow-y: auto`
- Each row: `48px` tall, `border-bottom: 1px solid #E8E0D5`
- Layout per row:
  ```
  [checkbox]  [Full Name]          [email — truncated]   [ALREADY ADDED badge?]
  ```
- Checkbox: `18px`, accent color `#D4A854`
- Full Name: `14px`, weight `500`, color `#2D2D2D`
- Email: `13px`, color `#999`, max-width `160px`, truncated with ellipsis
- **Already exists badge:** Small pill `"Already added"` in `#E8E0D5` background, `#999` text, `10px`, non-interactive, checkbox is disabled and unchecked for these

### Guests with no email:
Show them in the list but add a small warning icon `⚠` next to their name with tooltip `"No email — they can still be added"`. They are still selectable.

### CTA button:
- `"Add [X] guests to Small Plates"` — updates count dynamically
- `background: #D4A854`, `color: white`, full width, `border-radius: 8px`, `padding: 14px`
- Disabled if 0 guests selected
- Shows spinner during loading

### Back button:
Small `"← Back"` text link above list, on click `setStep('upload-file')`

---

## STEP 3 — Save to Supabase

On "Add X guests" click:

```tsx
async function handleImport() {
  setIsLoading(true)
  
  const toInsert = parsedGuests
    .filter(g => selectedIds.has(g.id) && !g.alreadyExists)
    .map(g => ({
      group_id: groupId,
      first_name: g.first_name,
      last_name: g.last_name || null,
      email: g.email || null,
      phone: g.phone || null,
      status: 'pending',
      source: source === 'zola' ? 'zola' : 'the_knot',
      number_of_recipes: 0,
      recipes_received: 0,
      is_archived: false,
      is_self: false,
      notify_opt_in: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }))

  const { error } = await supabase.from('guests').insert(toInsert)

  if (error) {
    setError('Something went wrong. Please try again.')
    setIsLoading(false)
    return
  }

  onImportComplete() // Refresh guest list in parent
  onClose()         // Close this modal
}
```

### Success state:
No separate success screen needed. The modal closes and the guests appear in the Manage Guests list behind it. The parent should refresh the guest list on `onImportComplete`.

### Error state:
If Supabase returns an error, show a red inline message below the CTA: `"Something went wrong. Please try again."` — do not close the modal.

---

## Integration in GuestNavigationSheet.tsx

```tsx
<ImportGuestsModal
  groupId={currentGroupId}  // however groupId is currently accessed in this file
  onClose={() => setShowImportModal(false)}
  onImportComplete={() => {
    // trigger whatever function currently refreshes the guest list
    // likely something like: refetchGuests() or setRefreshKey(k => k+1)
    setShowImportModal(false)
  }}
/>
```

---

## Important Constraints

1. **Do not modify any existing functionality** in `GuestNavigationSheet.tsx` — only add the button and the conditional render of `<ImportGuestsModal>`
2. **Use the existing Supabase client** already configured in the project — do not create a new one
3. **Use Tailwind classes** wherever possible, only use inline styles for values not available in Tailwind
4. **The modal must be mobile-friendly** — on screens < 640px it should be full-width with `border-radius: 0` on the bottom
5. **No external UI libraries** — build from scratch with Tailwind
6. **TypeScript strict** — no `any` types, proper interfaces for everything
7. **The `xlsx` library** handles both `.csv` and `.xlsx` — no need for a separate CSV parser

---

## Definition of Done

- [ ] New "Import from Zola / The Knot" button appears in GuestNavigationSheet, above "Add Guest"
- [ ] Button shows recognizable Zola and The Knot branding (logos or styled text)
- [ ] Clicking opens ImportGuestsModal without breaking the existing sheet
- [ ] User can select Zola or The Knot as source
- [ ] User can upload `.csv` or `.xlsx` file via click or drag-and-drop
- [ ] File is parsed correctly for both Zola and The Knot column naming conventions
- [ ] Parsed guests appear in a scrollable list with checkboxes
- [ ] "Already added" guests are shown but not selectable
- [ ] Select All / Deselect All works correctly
- [ ] Counter updates in real time
- [ ] "Add X guests" inserts correctly into Supabase `guests` table with all required fields
- [ ] Wedding date is auto-populated if The Knot CSV has it and group has no date yet
- [ ] On success: modal closes, guest list in parent refreshes
- [ ] On error: inline error message, modal stays open
- [ ] Mobile responsive