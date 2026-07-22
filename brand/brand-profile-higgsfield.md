# Small Plates & Co. — Brand Profile

*Auto-extracted from this repository for downstream use (Higgsfield Brand Kit + Meta ad image prompts). Every fact is cited to a repo file. Values are copied verbatim; nothing is invented. Legacy `brand_wedding/` content was ignored as instructed. Where `brand/` docs and code tokens diverge, the divergence is flagged.*

---

## 1. IDENTITY

- **Name:** Small Plates & Co. — `brand/brand-idea.md:62`, `brand/manifesto.md:13`
- **One-line description:** "A gift that brings people together through the one thing everyone has: food." — `brand/brand-idea.md:95`
- **What it does (2-3 sentences):** "Small Plates & Co. makes collaborative recipe books: one hardcover, written by the people who love someone. The organizer starts it free and shares a link; people send a recipe and a note. We design, print, and deliver the book with every contributor in it; payment happens once, when it goes to print." — `brand/brand-idea.md:81`
- **Category / industry:** Collaborative physical recipe books / group gifting for milestone occasions (wedding, retirement, graduation, new baby, milestone birthday). Not stated as a formal industry label; derived from `brand/brand-idea.md:41` and `brand/brand-idea.md:95-102`.
- **What "& Co." means:** "the company of people. Whoever's in your life that matters: still here, still at the table." — `brand/brand-idea.md:63-65`, `brand/manifesto.md:15`
- **Primary website URL:** `https://www.smallplatesandcompany.com` — NOT FOUND in `brand/`; sourced from `app/layout.tsx:32,37`.
- **Contact emails:** `team@smallplatesandcompany.com`, `hello@smallplatesandcompany.com` — NOT FOUND in `brand/`; sourced from `app/(auth)/activate/[token]/page.tsx:150` and `app/(platform)/event-invite/page.tsx:720`.
- **Social handles:** X/Twitter `@smallplatesandco` (`app/(public)/collect/[token]/page.tsx:81`). Instagram / TikTok / Facebook public handles: **NOT FOUND** (a `facebook-domain-verification` meta tag exists at `app/layout.tsx:54`, and an internal admin TikTok tool exists, but no public handle is declared in the repo).

---

## 2. COLORS

Canonical palette from `brand/visual-identity.md`, reconciled with the implemented CSS custom properties in `app/globals.css` (which carry the exact hex in code comments). HEX values are copied verbatim.

| Token | HEX | Usage | Source file |
|---|---|---|---|
| Honey (Primary Accent) | #D4A854 | CTAs, buttons, highlights, moments of energy | `brand/visual-identity.md:17`, `app/globals.css:72` |
| Honey Dark | #C49C4A | Honey hover state (desaturated, not darkened) | `app/globals.css:93` |
| Warm White · Airy | #FAF9F7 | Canvas in product register / layer in brand register; default `--brand-warm-white` alias | `brand/visual-identity.md:27`, `app/globals.css:64` |
| Warm White · Warm | #FAF7F2 | Canvas in brand register / layer in product register | `brand/visual-identity.md:28`, `app/globals.css:65` |
| White | #FFFFFF | Cards, pure white surfaces, button text | `app/globals.css:71` |
| Soft Charcoal (Primary Dark) | #2D2D2D | Primary text, logo | `brand/visual-identity.md:18`, `app/globals.css:73` |
| Deep Charcoal | #1A1A1A | Headlines needing more contrast; elevated emphasis (btn-dark hover) | `brand/visual-identity.md:71`, `app/globals.css:74` |
| Warm Gray | #8A8780 | Secondary text, captions (implemented token) | `app/globals.css:75` |
| Warm Gray Dark | #6B6966 | Darker secondary/muted text | `app/globals.css:76` |
| Warm Gray Light | #9A9590 | Lighter secondary text/captions (matches doc "Warm Gray") | `brand/visual-identity.md:70`, `app/globals.css:77` |
| Sand (Soft Neutral) | #E8E0D5 | Subtle backgrounds, cards, borders | `brand/visual-identity.md:61`, `app/globals.css:78` |
| Cream | #F5F1EB | Alternative light background | `brand/visual-identity.md:69`, `app/globals.css:90` |
| Olive (Cool Accent) | #6B7B5E | Organic feel, secondary moments | `brand/visual-identity.md:59`, `app/globals.css:91` |
| Terracotta (Warm Accent) | #C4856C | Secondary accent, warmth (also `--destructive`) | `brand/visual-identity.md:59`, `app/globals.css:92` |
| Border / Decorative Line | #D4D0C8 | Outline-button border, dividers, decorative separators | `app/globals.css:84-85` |
| Hero Gradient Start | #E8E4DC | Hero gradient start | `app/globals.css:86` |
| Hero Gradient End | #D4CFC4 | Hero gradient end | `app/globals.css:87` |

**Ratio Rule:** "Warmth dominates. Honey is the spice, not the dish. Secondary colors (Terracotta, Olive) appear rarely, in small doses." — `brand/visual-identity.md:91`

**Color don'ts:** No pure black `#000000` (always Soft/Deep Charcoal); no pinks, blues, or purples ("they break the warmth"); no Honey for large background areas. — `brand/visual-identity.md:85-87`

**Conflicts / flags:**
- **Warm White primary value.** `brand/visual-identity.md:17` labels **Warm White = #FAF9F7** as the "Primary Neutral" body/canvas. The root `CLAUDE.md` instead lists Warm White as `#FAF7F2`. Per instruction, `brand/` is canonical: the default warm-white alias in code resolves to **Airy #FAF9F7** (`app/globals.css:70`). Both whites are real and intentional (the two-tone system); do not collapse them.
- **Terracotta render drift (known).** The token is authored as #C4856C (`app/globals.css:92`) but, per project memory, `--brand-terracotta` actually renders ~#C37B65 in-browser due to the HSL rounding; the founder decided **not** to correct it (it feeds `--destructive`). Use **#C4856C** as the canonical brand value for design work.

---

## 3. TYPOGRAPHY

| Role | Font family | Weights | Source | Source file |
|---|---|---|---|---|
| Heading / display / emotional / the book | **Minion Pro** (serif; families `minion-pro`, `minion-pro-display`, `minion-pro-caption`, `minion-pro-subhead`) | Regular + Italic + Display (self-hosted `.otf` files are weight 400, italic 400); **no thin/light weights** | Self-hosted `.otf` in repo; also references Adobe Fonts (`minion-pro`) for web | `brand/visual-identity.md:107-111`, `tailwind.config.ts:11-35`, `app/globals.css:4-24` |
| Body / UI / functional / captions | **Inter** | Loaded via `next/font/google` (variable `--font-inter`); default variable weights | Google Fonts (`next/font/google`) | `brand/visual-identity.md:113-117`, `app/layout.tsx:2,15-18`, `tailwind.config.ts:36-41` |
| Secondary sans (product/UI, present in code) | **DM Sans** | via `next/font/google` (variable `--font-dm-sans`) | Google Fonts | `app/layout.tsx:2`, `tailwind.config.ts:42-46` |

**Font files in repo:** Yes for the serif. `public/fonts/` contains: `MinionPro-Display.otf`, `MinionPro-DisplayItalic.otf`, `MinionPro-Italic.otf`, `MinionPro-Regular.otf`. Registered via `@font-face` in `app/globals.css:4-24`. Note (`app/globals.css:40`): "Minion Pro requires Adobe Fonts subscription — fallback to serif stack." Serif fallback stack: `'Minion Pro', 'Georgia', 'Times New Roman', serif` (`app/globals.css:108`). Inter and DM Sans are **not** in the repo; they load from Google Fonts at runtime.

**Type rules** (`brand/visual-identity.md:121-133`): serif for emotion, sans for function; generous line height and heading spacing; italic Minion Pro for quotes/emphasis. Don't: all-caps for long text (short labels OK), script for body, more than these three typefaces, or thin/light weights ("they feel weak").

**Implemented type scale** (`tailwind.config.ts:48-141`): fluid `display` (36→72px), `heading` (30→48px), `subheading` (24→30px), `body` (16px), `body-lead` (18→24px), `body-small` (14px), `caption` (12px), `eyebrow` (11px, ALL CAPS, `0.15em` tracking), `action` (15px), plus platform tokens (`modal-title`, `form-label`, etc.). Marketing/landing copy must use the `type-*` utility classes, never raw Tailwind font utilities (`CLAUDE.md`).

---

## 4. VOICE & TONE

Source: `brand/voice.md`.

**Tone descriptors (as written):**
- **Specific** — "specific beats general." (`voice.md` §2)
- **Dry** (`voice.md` §2)
- **Direct** (`voice.md` §2)
- **Warm without performing it** — "We don't tell you this is emotional. You'll figure that out." (`voice.md` §2)
- Overall pattern: "specific beats general. Earned beats announced. Short beats long."

**The one filter — Margot / The Room Test:** "Would Margot, glass of natural wine in hand at a dinner party that got real at 11pm, say this out loud? If she'd roll her eyes → rewrite. If she'd say it with a knowing smile → ship it." (`voice.md` §1)

**Hard rules (verbatim):**
- "Never numbers of guests." A specific guest count "breaks the moment the reader's table has twelve." (`voice.md` §3)
- "Never 'showed up.' It implies a physical event with attendance." Say "your people," "the people who love you." (`voice.md` §3)
- "No long dashes. No em dashes, anywhere. Use a period, a comma, or a colon. Short sentences beat clever punctuation." (`voice.md` §3)
- "If you're not sure, cut the last sentence." (`voice.md`, closing)
- Exclamation points: no more than once per piece. (`voice.md` §3)

**Prohibited words/phrases (absolute, no exceptions):** cherish · treasure · memories · special · unique · loved ones · celebrate · journey · curated · perfect · amazing · magical · timeless · forever · blessed / so blessed · dreamy · heartwarming · unforgettable · heartfelt · keepsake · meaningful · yummy. Plus reflexes: "I'm obsessed," "literally dying." (`voice.md` §3)

**Preferred words/phrases:** kitchen · table · counter · people · real · actually · just · done · finally · stays · here · Tuesday · Wednesday · handwriting · stained · open. (`voice.md` §3)

**Say / Don't-say pairs** (`voice.md` §3): the people (not loved ones) · the people in your life (not your nearest and dearest) · the book lives in the kitchen (not a timeless keepsake) · the afterward (not forever/always) · she pulled it off (not she created something special) · at the table (not cherish/treasure) · Wednesday (not your special day / your big moment).

**Do / Don't example lines** (`voice.md` §4):
- Hero — Right: "Everyone you love has one recipe they're known for. Now they're all in a book in your kitchen." / Wrong: "Celebrate life's most precious moments with a curated book of memories."
- Product — Right: "A hardcover cookbook written by your people: for a wedding, a retirement, a new baby, a goodbye. Bound and printed. Lives in the kitchen. Gets stained. That's the point." / Wrong: "A beautiful, heartfelt gift that captures your special day."
- Landing — Right: "The internet promised belonging and delivered notifications. We make something you hold." / Wrong: "We believe in the power of gathering people together in meaningful ways."

---

## 5. VISUAL / ART DIRECTION

Source: `brand/visual-identity.md` (Photography, lines 95-99) and palette philosophy.

- **Mood / color grading:** "The palette is built on warmth with sophistication: colors that feel like candlelight dinners and honey in the sun. Not cold. Not corporate. Not predictable." (`visual-identity.md:7`) Atmosphere words attached to the warm white canvas: "kitchen-warm, candle-warm, dinner-table-warm." (`visual-identity.md:35`)
- **What to show:** "Show the book in use: stained, open, on counters, in real kitchens. Never styled and pristine." (`visual-identity.md:97`)
- **Composition / protagonist rule:** "The person the book is for is never the visual protagonist. The contributors are, through their handwriting and recipes." (`visual-identity.md:98`)
- **Context / realism:** "Real domestic contexts. No stock imagery, no light-and-airy category defaults." (`visual-identity.md:99`)
- **Let photography carry color:** "Let photography bring additional color naturally." (`visual-identity.md:82`)
- **Editorial references (for tonal counterpoint, not photography per se):** Kinfolk, Apartamento, Cherry Bombe. (`visual-identity.md:51`)
- **Physicality cues from the brand idea** (usable as art direction): "The weight of it… You can open it in front of people and watch them look for their own name. It passes from hand to hand. It gets stained and stays on the counter." (`brand/brand-idea.md:53`)

**Avoid:** styled/pristine product shots, stock imagery, generic "light-and-airy" gifting-category defaults, and making the honoree/receiver the visual hero.

---

## 6. PRODUCT TRUTHS (claims copy must not violate)

From `brand/brand-idea.md`, `brand/characters.md`, `brand/manifesto.md`:

- The book is **collaborative**: written by "the people who love someone," not bought by one person. (`brand-idea.md:99`)
- **Starting is free; payment happens once, when the book goes to print.** ("The organizer starts it free… payment happens once, when it goes to print." — `brand-idea.md:41,81`)
- Format is **one hardcover book**, designed/printed/bound by Small Plates. ("We clean, design, print, and bind." — `brand-idea.md:41`)
- The flow: **one link**, contributors send a recipe + a note from wherever they are; "recipes come back cleaned, automatically." (`brand-idea.md:41`, `characters.md:45`)
- **A real person reads every page before it prints.** (`characters.md:47`)
- **Do NOT promise automated reminders.** The "automated reminders" claim was explicitly vetoed (July 2026) and removed from `characters.md`. (`characters.md:88`)
- **No guest counts** ever in copy (see Voice). The group is "your people," reader fills in the count. (`voice.md` §3)
- Occasions are **multi-occasion**, not wedding-only: wedding, retirement, graduation, new baby, milestone birthday, a goodbye. (`brand-idea.md:41`, `voice.md` §4)
- **Price is a feature, not an apology:** "A cheap book would undermine the signal… The price says: these people were worth it." (`brand-idea.md:57`)
- **The value is the artifact of everyone taking part**, not the recipes themselves. ("The value is not the recipes." — `brand-idea.md:55`)
- **Organizer motivation = the receiver's happiness, not credit/status/glory.** "To make them happy. That's the engine. Not credit, not status." "glory without grief" was retired. (`characters.md:31`, `characters.md:88`)
- This is "the first thing we make. It won't be the last." — do not frame the book as the company's sole/permanent scope. (`brand-idea.md:45`)

---

## 7. MACHINE BLOCK

```json
{
  "brand_name": "Small Plates & Co.",
  "tagline": "There's always another way to love the people you love.",
  "short_description": "Collaborative hardcover recipe books written by the people who love someone, for a wedding, retirement, graduation, new baby, or milestone birthday.",
  "business_overview": "The organizer starts a book free and shares one link; contributors send a recipe and a note from wherever they are. Small Plates cleans, designs, prints, and binds one hardcover with every contributor in it. Payment happens once, when the book goes to print. It lives in the kitchen.",
  "industry": "Collaborative physical gifting / custom recipe books for milestone occasions",
  "company_type": "Direct-to-consumer product company (physical goods + software platform)",
  "website_url": "https://www.smallplatesandcompany.com",
  "colors": [
    {"hex": "#D4A854", "usage": "primary accent / CTAs, buttons, highlights"},
    {"hex": "#C49C4A", "usage": "honey hover state"},
    {"hex": "#FAF9F7", "usage": "warm white airy — product canvas / brand layer"},
    {"hex": "#FAF7F2", "usage": "warm white warm — brand canvas / product layer"},
    {"hex": "#FFFFFF", "usage": "cards, pure white surfaces, button text"},
    {"hex": "#2D2D2D", "usage": "primary text, logo (soft charcoal)"},
    {"hex": "#1A1A1A", "usage": "high-contrast headlines, deep charcoal"},
    {"hex": "#8A8780", "usage": "secondary text, captions (warm gray)"},
    {"hex": "#6B6966", "usage": "muted text (warm gray dark)"},
    {"hex": "#9A9590", "usage": "lighter secondary text (warm gray light)"},
    {"hex": "#E8E0D5", "usage": "subtle backgrounds, cards, borders (sand)"},
    {"hex": "#F5F1EB", "usage": "alternative light background (cream)"},
    {"hex": "#6B7B5E", "usage": "cool accent, organic moments (olive)"},
    {"hex": "#C4856C", "usage": "warm accent / destructive (terracotta)"},
    {"hex": "#D4D0C8", "usage": "borders, dividers, decorative lines"}
  ],
  "fonts": [
    {"name": "Minion Pro", "type": "heading", "usage": "headlines, titles, emotional moments, the book itself; italic for quotes"},
    {"name": "Inter", "type": "body", "usage": "body text, UI, functional copy, captions"},
    {"name": "DM Sans", "type": "accent", "usage": "secondary sans in product/UI (implemented in code)"}
  ],
  "brand_values": [
    "real things over forgettable ones",
    "physical and permanent over digital and disposable",
    "made by the group, not bought by one person",
    "connection through food",
    "warmth without performing it"
  ],
  "brand_aesthetics": [
    "warm editorial",
    "candlelight and honey warmth",
    "kitchen-warm, lived-in",
    "editorial restraint (Kinfolk / Apartamento / Cherry Bombe)",
    "book in use: stained, open, on the counter",
    "no stock, no pristine styling"
  ],
  "tone_of_voice": ["specific", "dry", "direct", "warm without performing it"],
  "keywords": ["kitchen", "table", "counter", "people", "real", "actually", "just", "done", "finally", "stays", "here", "Tuesday", "Wednesday", "handwriting", "stained", "open"],
  "products_or_services": [
    "Collaborative hardcover recipe book (one per group, per occasion)",
    "Organizer dashboard + shareable contribution link",
    "Automated recipe cleaning, professional design, printing and binding, human page review before print"
  ],
  "social_links": {"instagram": null, "tiktok": null, "facebook": null, "twitter": "@smallplatesandco"}
}
```

---

## GAPS (missing from the repo — a human must provide)

1. **Instagram / TikTok / Facebook public handles** — not declared in the repo (only an internal admin TikTok tool and a Facebook domain-verification token). Only X/Twitter `@smallplatesandco` was found.
2. **Formal industry / category label** and legal company type — inferred, never stated in `brand/`.
3. **Official tagline designation** — the manifesto's opening line ("There's always another way to love the people you love.") reads as the de facto tagline but is not labeled "tagline" anywhere. Confirm.
4. **Logo files / lockups, spacing, clear-space rules** — no logo asset or usage spec found in `brand/`.
5. **Photography reference images** — the photography section gives rules but the repo contains no reference-image library or shot list for ad production.
6. **Minion Pro licensing for web** — code notes it needs an Adobe Fonts subscription and falls back to a serif stack; confirm which environments actually render Minion Pro vs. Georgia fallback before generating ad assets.
7. **Canonical Warm White value** — reconcile `brand/visual-identity.md` (#FAF9F7 as primary) vs. root `CLAUDE.md` (#FAF7F2). Flagged in §2.
```
