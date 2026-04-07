# Claude Code Prompt — Tips for Success (Knowledge Center)
## Small Plates & Co.

---

## BEFORE YOU WRITE A SINGLE LINE OF CODE

1. **Read the existing codebase first.** Explore the `/app`, `/components`, and `/lib` directories to understand the current folder structure, naming conventions, import patterns, and how existing pages and layouts are organized.
2. **Present a plan** — file list, component tree, data structure, routing — and wait for approval before implementing.
3. **Do not rewrite or touch any existing file** unless it is strictly necessary (e.g., adding a nav link). If you need to modify an existing file, flag it explicitly before doing so.
4. **One task at a time.** Do not jump ahead.

---

## WHAT WE ARE BUILDING

A **"Tips for Success" knowledge center** — a help/guide section accessible from the user's account dashboard. This is an internal product page (not a marketing page), available only to logged-in users who are organizing a book.

Think: Zendesk Help Center meets Notion Docs. Minimal, white, editorial, professional. Very easy to navigate for non-technical users (including someone's 60-year-old mother).

The reference design is in the HTML file at:
`/[wherever this prompt is stored]/tips-knowledge-center.html`

Open it in a browser to see the exact design and interactions before starting.

---

## ROUTING & LOCATION IN THE APP

- **Route:** Follow best patterns for components and sectinos.
- **Navigation:** Add a "Tips & Guides" link in the account/dashboard sidebar or menu, wherever other account links live. Use the same nav component that other dashboard pages use. Do not create a new nav component.
- **Auth:** This page should be behind the same auth guard as the rest of the dashboard. Do not add new auth logic — just follow the existing pattern.
- **Layout:** Use the existing dashboard layout wrapper (header, sidebar, etc.) if one exists. The knowledge center content sits inside that layout.

---

## VISUAL DESIGN — EXACT SPEC

The design preliminary idea is already built and tested in the HTML reference file. Translate it faithfully into React + Tailwind. Make it beautiful.

### Color tokens (map to Tailwind or CSS vars — check if these already exist in `tailwind.config`)

```
Honey (primary accent):      #C9982A  → use for links, CTAs, active states, left-border accents
Honey BG (light fill):       #FBF6EA  → callout backgrounds
Honey Pill:                  #F3E8C8  → "Essential" badge background
Charcoal (primary text):     #1C1917
Mid gray (body text):        #78716C
Soft gray (labels, meta):    #A8A29E
Border:                      #E8E4DF
Background (page):           #FAFAF9
White (cards):               #FFFFFF
Terracotta (accent):         #B5715A
Terracotta BG:               #FBF0EC
```

If these colors already exist in the Tailwind config under brand tokens, use those. Otherwise, use inline styles or extend the config — but flag the decision.

### Typography

- **Serif (headings, article titles):** Use whatever serif font is already configured in the project (likely Minion Pro or a Google Fonts equivalent like Lora). Check `tailwind.config` and `layout.tsx`/`_app.tsx` for font definitions.
- **Sans (body, UI):** Inter or whatever sans-serif is already in the project.
- Do NOT add new font imports if the project already has suitable fonts loaded.

---

## ARCHITECTURE — COMPONENT TREE

```
/app/...(follow best patterns)                ← Main page, manages navigation state
  
/components/tips/
  TipsLayout.tsx            ← Wrapper: hero header + breadcrumb + view switcher
  TipsHome.tsx              ← Category grid + "Most helpful" quick links list
  TipsCategory.tsx          ← Category detail: icon header + article list
  TipsArticle.tsx           ← Article detail: main content column + related sidebar
  
/lib/tips/
  content.ts                ← ALL content data (categories, articles) as typed constants
  types.ts                  ← TypeScript interfaces: Category, Article, ArticleTag
```

### State management

Navigation state (home / category / article) lives in the **page-level component** (`page.tsx`) as `useState`. No router push — this is a SPA-style in-page navigation to avoid page reloads. The URL does NOT need to change when navigating between articles (no nested dynamic routes needed for v1).

```typescript
type View = 
  | { type: 'home' }
  | { type: 'category'; catId: string }
  | { type: 'article'; catId: string; artId: string }
```

Pass `onNavigate(view: View)` as a prop down to child components.

---

## DATA STRUCTURE

Define all content in `/lib/tips/content.ts`. **Do not hardcode content inside components.**

```typescript
// /lib/tips/types.ts

export type ArticleTag = 'essential' | 'quick' | null

export interface Article {
  id: string
  catId: string
  tag: ArticleTag
  title: string
  shortDesc: string        // One sentence — shown in article list rows
  body: ArticleBody[]      // Structured content blocks (see below)
  relatedIds: string[]     // IDs of related articles for sidebar
}

export interface ArticleBody {
  type: 'paragraph' | 'callout' | 'note' | 'steps' | 'imagePlaceholder'
  content?: string         // HTML string for paragraph/callout/note (safe subset)
  calloutTitle?: string    // Bold label inside callout boxes
  steps?: string[]         // Array of step strings for ordered lists
  placeholderType?: string // e.g. "Screenshot", "Diagram", "Mockup"
  placeholderDesc?: string // Description of what image goes here
}

export interface Category {
  id: string
  name: string
  shortDesc: string        // One sentence — shown under category name in hero
  iconType: 'layers' | 'users' | 'bell' | 'book' | 'people'
  colorVariant: 'amber' | 'terra' | 'sage' | 'blue' | 'slate'
  articleIds: string[]
}
```

### Content to include

Copy all 5 categories and 14 articles **exactly** from the HTML reference file. The copy is already final — do not paraphrase or simplify.

**Categories (in order):**
1. `setup` — Getting started (3 articles)
2. `recipes` — Getting more recipes (4 articles)
3. `captains` — Your captains (2 articles)
4. `reminders` — Reminders (3 articles)
5. `closing` — Closing the book (2 articles)

**Articles (by category):**

`setup`:
- `setup-1` — Add the couple's photo to your invitation link [Essential]
- `setup-2` — Set your deadline two weeks earlier than you think [Essential]
- `setup-3` — Import your guest list from Zola or The Knot [Quick]

`recipes`:
- `rec-1` — Share the link on WhatsApp — not just by email [Essential]
- `rec-2` — Personalize the invitation message [Essential]
- `rec-3` — Tell them it takes 5 minutes [Quick]
- `rec-4` — Give them recipe ideas [Quick]

`captains`:
- `cap-1` — What is a captain and why you need one
- `cap-2` — How to invite captains and what to ask them

`reminders`:
- `rem-1` — The 3-reminder plan that actually works [Essential]
- `rem-2` — Use the "Remind" button — don't do it by hand [Quick]
- `rem-3` — Message the key people directly

`closing`:
- `close-1` — Review your progress before closing [Essential]
- `close-2` — What happens after you close the book

All full article body content is in the HTML reference file. Copy it faithfully.

**"Most helpful" quick links (shown on homepage):** `setup-1`, `setup-2`, `rec-1`, `rem-1`, `cap-1` — in that order.

---

## COMPONENT SPECS

### `TipsLayout.tsx`

Wraps everything. Contains:
- **Hero section** (top): eyebrow dot + "Small Plates & Co." label, dynamic H1 title, dynamic subtitle, search input (UI only — no search logic in v1, just the visual)
- **Breadcrumb bar**: below hero, above content. Shows current path. Updates dynamically.
- **Content slot**: renders `TipsHome`, `TipsCategory`, or `TipsArticle` based on view state.

Hero title and subtitle update based on current view:
- Home: "How can we help?" / long subtitle
- Category: category name / category short desc
- Article: article title / article short desc

Breadcrumb logic:
- Home: plain text "Help Center" (not a link)
- Category: "Help Center [link] › Category Name"
- Article: "Help Center [link] › Category Name [link] › Article Title"

### `TipsHome.tsx`

Two sections:

**1. Category grid** (`Browse by topic`)
- 3-column grid (responsive: 2-col on mobile)
- Each tile: colored icon square + category name + article count + "Read →" arrow
- Entire tile is clickable → navigates to category view
- Hover: subtle background change (`#FAFAF9`)
- The 5 tiles share a single border (the grid itself has a border + 1px gap between cells in the grid background — see HTML for exact implementation)

**2. Most helpful list** (`Most helpful`)
- Flat bordered list, no card chrome
- Each row: small dot + article title + optional tag badge + chevron arrow
- Entire row clickable → navigates directly to article view
- "Essential" badge: honey background + dark honey text
- "Quick" badge: green background + dark green text

### `TipsCategory.tsx`

Props: `category: Category`, `articles: Article[]`, `onNavigate`

- Category hero: icon (sized up to 44px) + category name (serif) + desc
- Article list: one row per article, same row style as "Most helpful" on home
- Each row shows: title + optional tag + one-line short desc + chevron

### `TipsArticle.tsx`

Props: `article: Article`, `category: Category`, `relatedArticles: Article[]`, `onNavigate`

Two-column layout:
- **Left column** (main): article body content
- **Right column** (sidebar, 220px fixed): "Related articles" label + list of related article links

**Body content renderer** — render `article.body[]` array:

| Block type | Visual |
|---|---|
| `paragraph` | Regular prose `<p>` |
| `callout` | Honey left-border box, bold uppercase label on top, body text below |
| `note` | Light gray bordered box, no accent |
| `steps` | Ordered list with circular dark numbered bullets |
| `imagePlaceholder` | Dashed border box, centered: icon + type label (uppercase) + description text |

Image placeholder is a **real visual component** — it signals to us that a screenshot or diagram will go here in a future version. It should look designed, not like a broken image.

### Icons

Use `lucide-react` (already in the project presumably — check first). Map `iconType` in Category to Lucide icons:
- `layers` → `<Layers />` — Getting started
- `users` → `<Users />` — Getting more recipes / Your captains
- `bell` → `<Bell />` — Reminders
- `book` → `<BookOpen />` — Closing the book

---

## SEARCH INPUT

Render the search input in the hero (UI only). No functionality in v1. Placeholder text: `"Search — captains, reminders, Zola…"`. Style: pill shape (full border-radius), `#FAFAF9` background, 1.5px border, honey border on focus. Include a search icon on the left using Lucide `<Search />`.

Add a TODO comment: `// TODO: wire up search filtering against article titles and body content`

---

## RESPONSIVE BEHAVIOR

- **Desktop (≥768px):** 3-col category grid, 2-col article layout (content + sidebar)
- **Mobile (<768px):** 2-col category grid, 1-col article layout (sidebar hidden), all padding reduced to 1.25rem

---

## WHAT NOT TO BUILD (v1 scope)

- ❌ No actual search/filtering logic
- ❌ No URL-based deep linking to articles (no `[articleId]` dynamic routes)
- ❌ No Supabase reads — all content is static in `content.ts`
- ❌ No analytics or tracking
- ❌ No user feedback / "Was this helpful?" widget
- ❌ No markdown parsing — body content is structured typed objects

---

## QUALITY CHECKLIST — before saying you're done

- [ ] Page renders correctly at `/dashboard/tips` (or equivalent route)
- [ ] Nav link appears in the dashboard menu and is active when on this page
- [ ] All 5 categories show on home with correct icons and article counts
- [ ] All 5 "Most helpful" links are present and navigate correctly
- [ ] Clicking a category shows its article list
- [ ] Clicking an article shows full body content with all block types rendering
- [ ] Callout boxes have left honey border + bold uppercase label
- [ ] Note boxes have gray border, no accent
- [ ] Steps render as numbered circles with dark background
- [ ] Image placeholders render as designed (dashed border, icon, type, desc)
- [ ] Related articles sidebar renders and links work
- [ ] Breadcrumbs update correctly at every level
- [ ] Hero title and subtitle update correctly at every level
- [ ] Back navigation works (breadcrumb links)
- [ ] No TypeScript errors
- [ ] No `any` types
- [ ] Tailwind classes used wherever possible (no inline styles except for colors not in config)
- [ ] Mobile layout is correct (test by narrowing browser)
- [ ] No console errors or warnings

---

## NOTES FOR THE AGENT

- The content is **final copy** — do not rephrase, simplify, or "improve" any article text.
- The design is **final** — do not add animations, transitions beyond subtle hover states, or any visual elements not in the reference HTML.
- If you are unsure about where a file should live or how something is named in this project, **ask before assuming**.
- If an existing utility, hook, or component already does something you need, use it. Do not duplicate.
- Comments in code should explain *why*, not *what*.

---

## DELIVERABLES

1. All files listed in the architecture section above, complete and working
2. A one-line addition to the dashboard nav pointing to this page
3. A brief summary of any decisions you made that deviated from this spec, and why