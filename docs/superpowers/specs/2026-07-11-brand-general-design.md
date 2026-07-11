# Brand General Folder (`brand/`) — Design Spec

**Date:** 2026-07-11
**Status:** Approved by Ricardo (design conversation, July 11 2026)
**Replaces as canon:** `brand_wedding/` (which stays frozen as legacy)

---

## Goal

Create a new `brand/` folder that is the single canonical brand system for Small Plates & Co. as it exists today: a multi-occasion, free-to-start platform — not a wedding-only, pay-upfront product. Condense the 7 docs of `brand_wedding/` into 5, removing the repetition that accumulated across them.

## Why now

`brand_wedding/` was built in April 2026 and has not been touched since April 29. Since then the business changed underneath it:

1. **Multi-occasion.** The free-tier platform (June 2026) generalized the product to any occasion (wedding, shower, birthday, graduation, retirement, Thanksgiving). Copy rule already in force: never assume wedding as the only case; composed lists OK, wedding-only framing not.
2. **Free-tier model.** Create an event free, guests contribute, pay only at print. The old docs assume the upfront-payment product.
3. **Stale claims.** `characters.md` promises "automated reminders (she doesn't chase anyone)" — vetoed July 2026; no automated guest reminders exist. Docs also use "80 people" throughout, violating the no-guest-numbers copy rule.
4. **Repetition.** The same concepts live in 3+ docs: banned vocabulary (tone-of-voice, margot, category-rules), "& Co. means the company of people" (brand-idea, manifesto), buyer=organizer (brand-idea, characters, category-rules), "internet promised belonging and delivered notifications" (brand-idea, manifesto, tone-of-voice).

## Decisions (made with Ricardo, July 11 2026)

| Decision | Choice |
|---|---|
| Fate of `brand_wedding/` | Frozen legacy. Not archived, not deleted. Each doc gets a one-line header note: *"Superseded by `brand/` (July 2026). Kept as legacy reference."* |
| Structure | 5 docs: `brand-idea.md`, `manifesto.md`, `characters.md`, `voice.md`, `visual-identity.md`. Margot + tone-of-voice fuse into `voice.md`. Category-rules is absorbed into `brand-idea.md`, compressed and generalized. |
| Emotional anchor | The table, no occasion. The anchor is "the people who show up" and the kitchen/table as the place. Occasions appear only as interchangeable composed lists. Not wedding-as-origin, not Thanksgiving-as-new-anchor. |
| Language | English (same as current brand docs; product copy and ads are English). |

## Governing rule: one home per concept

Each concept lives in exactly ONE doc; other docs reference it in a single line. The only exception is `manifesto.md`, which as the public-facing piece may echo ideas — it is the interpretation of the brand, not a copy of the strategy doc.

Canonical homes:

| Concept | Lives in |
|---|---|
| Banned / preferred vocabulary | `voice.md` only |
| Buyer = organizer psychology | `characters.md` only |
| "& Co." meaning | `brand-idea.md` (manifesto may echo) |
| Positioning / category ruptures | `brand-idea.md` (HOW WE POSITION section) |
| Product-truth claims for copy | `voice.md` ("What copy must never claim") |
| Palette + typography | `visual-identity.md` only |

---

## Doc-by-doc design

### 1. `brand/brand-idea.md` — strategy + positioning

**Inherits nearly intact** (already category-agnostic by design):
- THE IDEA — "People you love shouldn't disappear from your life."
- THE ENEMY — The Forgettable.
- WHY WE EXIST, WHY NOW.
- WHAT "SMALL PLATES & CO." MEANS.

**Changes:**
- **WHAT WE MAKE** — rewritten: a collaborative recipe book for any occasion. The organizer creates the event free; guests contribute a recipe and a note through a link; we design, print, and bind; payment happens only at print. The free-tier is part of the brand identity: "start free" removes the organizer's Ineptitude fear at the door.
- **WHY PHYSICAL** — same argument (the object is proof of coordination), rewritten without "80 people" → "a whole group of people" / "everyone who showed up".
- **HOW TO EXPLAIN IT** — 5-sentence pitch rewritten multi-occasion.
- **WHO WE SERVE** — one line + pointer to `characters.md` (no repetition).
- **NEW: HOW WE POSITION** (~30 lines, compresses the 121-line `wedding-category-rules.md`):
  - The five core ruptures, generalized from wedding-industry framing to occasion/gifting-industry framing:
    1. We reject the occasion industry's verbal playbook (vocabulary ruptures — reference `voice.md`, do not repeat the list).
    2. The buyer is the organizer, not the honoree.
    3. The gift is collective, not individual.
    4. Value activates in the afterward, not on the day.
    5. The only gift that activates socially when opened (guests crowd around, look for their own recipe — structural viral coefficient).
  - Deliberate deviations kept: editorial typography (not occasion-stationery), photography of the book in use (stained, open, on counters), real domestic contexts, honoree not the visual protagonist.
  - Deliberately respected rules kept: warm earth-tone palette (not ownable — differentiate elsewhere), rectangular bound book (no gimmick formats).
  - **Cut:** category B (ignored rules) — inventory, not decisions. Risk list compressed to one line each where still relevant ("hyper-personalization" language, "timeless" framing, light-and-airy product photography).
- **THE SYSTEM** — lists the 5 new docs.

### 2. `brand/manifesto.md` — the public declaration

Keeps the three-movement architecture:
- **Movement 1** (the digital drift: "the group chat goes quiet… designed to be seen once and forgotten") — survives nearly verbatim; already occasion-free.
- **Movement 2** — rewritten from "the people who love you came to that wedding" to the table anchor: the people who show up, for whatever it is they're showing up for (composed list, e.g., a wedding, a retirement, a new baby, a goodbye). Same emotional mechanics: they drove from other cities, they meant it.
- **Movement 3** ("We build for the Wednesday", the risotto, the grandmother's handwriting) — survives nearly intact; already occasion-agnostic. "& Co." explanation stays here as the public echo.

No guest numbers anywhere.

### 3. `brand/characters.md` — the cast

- **The Organizer — The Buyer.** Full psychology inherited (behavioral not demographic; the three fears: Ineptitude, Subjugation, Depletion; "glory without grief"). Subjugation fear rephrased: "the bride never knows" → "the person it's for never knows".
  - **Mandatory correction:** delete "automated reminders (she doesn't chase anyone)". Replace "What Small Plates gives her" with what is true today: a link she shares once; a dashboard that shows progress; recipes cleaned automatically as they arrive; professional design; a real person reads every page before it prints; emotional credit.
- **The Receiver** (was The Bride) — generalized: the couple, the retiring dad, the graduate, the whole family. Same psychology: "Will this mean something when it's over?" / "They didn't just show up for me. They know me."
- Closing system line kept: *The receiver gets the gift. The organizer gets the glory. Both feel seen.*

### 4. `brand/voice.md` — Margot + tone of voice, fused

- **Who Margot is** (compressed): 28, Brooklyn, Creative Director, strong taste she doesn't announce. Pointer to full character study in legacy archive.
- **The two tests:** Room Test (unchanged). Ojai Test generalized — the organizer who found Small Plates at 2am on TikTok: does this feel made for her, or for her mom? Keep the rule: *the brand travels daughter to mother, never the other way.*
- **The four words with proof:** specific, dry, direct, warm without performing it. Proof examples rewritten multi-occasion, no guest numbers.
- **The canonical vocabulary list** (single home): banned words (cherish, treasure, memories, special, unique, loved ones, celebrate, journey, curated, perfect, amazing, so blessed, yummy, heartfelt, keepsake, meaningful, timeless) + preferred words (kitchen, table, people, real, actually, just, done, finally) + we say / we don't say table, generalized.
- **Rewrites section:** wrong/right pairs rewritten multi-occasion (hero headline, product description, mid-flow email, landing support copy).
- **NEW: "What copy must never claim"** — product-truth guardrails:
  - Recipes are cleaned automatically at upload (say "cleaned"); a real person reads every page after payment, before print (never "reviewed the moment it arrives").
  - Dish images are generated from the recipe itself, post-payment (never claim "no AI").
  - No automated guest reminders exist — never promise "we handle the reminders / no chasing anyone down".
  - The owner never sees the designed book — it arrives as a surprise, by design. Never promise a preview.
  - Never use specific guest numbers ("80 people").
- **Closing:** "Cut the last sentence" principle, kept.

### 5. `brand/visual-identity.md` — near-verbatim copy

Already 100% general (zero wedding mentions). Copy with minimal changes: update cross-references to the new doc system. Palette (including two-tone warm white system + Canvas-vs-Layer rule), typography (Minion Pro + Inter), and all Do/Don't rules carry over unchanged.

---

## Out of scope

- Editing any content in `brand_wedding/` beyond the one-line "superseded" header notes.
- Updating product copy, landing pages, or `CLAUDE.md` references — separate follow-up.
- Updating the Claude Desktop project sync — Ricardo does that manually after the folder exists.
- New brand concepts not already validated in conversation (no new taglines, no new enemy, no repositioning beyond generalization).

## Success criteria

1. `brand/` contains exactly 5 docs, total meaningfully shorter than the 7 legacy docs. Target: ~2 pages per doc (`brand-idea.md` may run to ~3 since it absorbs positioning).
2. Zero occurrences of wedding-only framing as the sole case (composed lists allowed); zero specific guest numbers; zero vetoed claims (automated reminders, upfront-payment assumptions).
3. Each shared concept has exactly one home; other docs reference, not repeat (manifesto excepted).
4. A cold reader (or Claude Desktop project) reading only `brand/` gets the current business: multi-occasion, free to start, pay at print, organizer as buyer.
5. Every legacy doc in `brand_wedding/` carries the superseded note.

## Implementation order

1. `voice.md` (canonical vocabulary home — other docs reference it)
2. `brand-idea.md` (strategy + positioning)
3. `characters.md`
4. `manifesto.md` (written last of the prose docs; it interprets the others)
5. `visual-identity.md` (near-copy)
6. Superseded notes on the 7 `brand_wedding/` docs
7. Voice audit pass with the brand-editor skill before commit
