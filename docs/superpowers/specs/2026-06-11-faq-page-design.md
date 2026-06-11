# FAQ Page (`/faq`) — Design Spec

**Date:** 2026-06-11
**Status:** Draft — pending Ricardo's review
**Inspiration:** Remento's FAQ page (structure, depth, patience with non-technical readers) — translated to Small Plates voice and the free-tier model.

---

## 1. Goal

A dedicated `/faq` page that answers, in one organized place, everything a not-very-technical organizer (maid of honor, mom, sister) needs to feel safe starting a book. Today the site only has short FAQ sections inside landings; there is no destination for "I have questions before I commit."

**Decisions already made with Ricardo:**
- Dedicated `/faq` page; existing landing FAQ sections stay as-is (main landing gets a "See all FAQs" link; `/regalos` and `/regalos-usa` untouched).
- Content describes the **free-tier model** (free until print, per-person declining pricing).
- **English**, consistent with the main site.

## 2. Page structure (mirrors Remento)

1. **Hero** — `type-display` headline + one `type-body` line. No drama.
   - H1: `Questions, answered.`
   - Sub: `Everything about how the book gets made — from the first invite to the hardcover in the kitchen.`
2. **Most common questions** — accordion (native `<details>/<summary>`, styled) with the 6 questions that most often block the decision:
   - How much does it cost?
   - When do I pay?
   - Do guests need an app or account?
   - What if some guests don't cook?
   - How long does it take?
   - Can I see the book before it prints?
   - (Answers reused verbatim from the Complete FAQ below — single source in the data file.)
3. **Complete FAQ** — all questions **open** (no accordions; better for SEO and for readers who don't know to click), grouped in cards per category, like Remento's "Complete FAQ".
4. **Jump to a section** — sticky sidebar on desktop (anchor links per category); on mobile, a horizontally scrollable row of pills above the content.
5. **Closing CTA** — soft: `Still wondering about something?` → mailto `team@smallplatesandcompany.com` + secondary CTA `Start your book — it's free` → `/onboarding/welcome`.

## 3. Categories (7)

1. About Small Plates
2. Pricing & payment
3. Collecting recipes
4. The book
5. Gifting
6. Shipping & delivery
7. Privacy & support

## 4. Content draft (full)

Voice rules applied: tone-of-voice.md (specific, dry, direct, warm without performing), no banned words, no specific guest counts, no pressure language, dignity protected. Facts pulled from `lib/stripe/pricing.ts`, the free-tier spec, and existing site copy.

> ⚠️ = fact Ricardo must confirm before this answer ships.

### About Small Plates

**What is Small Plates?**
A hardcover cookbook written by the people who came to the wedding. Each guest sends a recipe and a note. We collect them, design the book, print it, and ship it. It lives in the kitchen and gets stained. That's the point.

**Who organizes the book?**
Usually one person — the maid of honor, the sister, the mom, a friend. You don't need design skills or free time: you share a link and the rest happens on its own. Couples can also run it for their own wedding.

**How does it work, start to finish?**
1. Create your event. It's free and takes a couple of minutes.
2. Share the collection link with the guests.
3. Each guest submits a recipe and a note — about five minutes each.
4. We clean everything up and design the book.
5. You review every page, then send it to print.
6. The hardcover shows up at your door.

**Do I need to be good with technology?**
No. If you can send a text, you can do this. There's no app to download and no password to remember — we send you a sign-in link by email. Guests just tap a link.

**Is this like a wedding guest book?**
A guest book gets signed once and goes in a box. This one gets opened on a random Tuesday because someone wants the lasagna recipe. Same people, different shelf life.

### Pricing & payment

**How much does it cost?**
Starting is free — creating the event, inviting people, collecting recipes, watching them come in. You pay only when you print. One copy is $169. The price per copy drops as your group orders more: $129 each for 2 copies, $113 for 3, $103 for 4, $95 for 5, and $89 each from 6 on. Shipping to one address is included.

**When do I pay?**
At the very end, when you close the book and send it to print. Not before. No deposit, no subscription, no card on file.

**What exactly is free?**
Everything except the printed book: the event page, the collection link, reminders to guests, and a free sample PDF so you can see how the first recipes look designed before you decide anything.

**Can we split the cost as a group?**
That's how the price is built. The book is usually a group gift — several people chip in and each keeps a copy. The per-person number you see is exactly what each person puts in. One person checks out; the group settles up however it normally does.

**What if we collect recipes and never print?**
Then you pay nothing. The recipes stay saved in your account in case you change your mind later. ⚠️ (confirm: no auto-deletion of free-tier events)

**Can I order more copies after the book is printed?**
Yes. Single copies later are $129 plus $14 shipping. It's cheaper to order them with the main print run, where copies drop to as low as $89 each.

### Collecting recipes

**How do guests send their recipe?**
They tap a link, type the recipe and a short note, and they're done. About five minutes. No app, no account, no password. It works on any phone, tablet, or computer — including your aunt's iPad.

**What if some guests don't cook?**
Even better. They can send the takeout order they'd defend with their life, or the sandwich they get every single time. It's not about being a chef — it's about being in the book.

**What if people don't send their recipes?**
Some won't on the first ask. That's normal, not a reflection on you. Your dashboard shows who's in, and you can send a reminder with one click. Most books fill up after the second nudge. ⚠️ (confirm the "second nudge" claim feels right)

**How many recipes do we need?**
At least 25 to print. Most books land between 30 and 50. If you invite everyone who'd want to be in it, you'll get there.

**Can recipes be in other languages?**
Yes, any language. Abuela's recipe stays in Spanish if that's how she wrote it.

**Do guests need to photograph their dish?**
No. Just the recipe. We create every image in the book — that's what makes it look like one book instead of fifty screenshots.

**Can I add recipes myself?**
Yes. If someone hands you a recipe at dinner or texts it to you, you can add it for them from your dashboard. ⚠️ (confirm organizer can add on behalf of guests in free-tier)

**Can I fix typos or edit recipes before printing?**
Yes. You review every recipe before the book prints, and you can edit anything. Nothing goes to print until you've seen it. ⚠️ (confirm editing scope in review step)

### The book

**What does the finished book look like?**
A hardcover, professionally printed in full color. Every recipe gets its own page with the contributor's name and note, plus an image we create for it. Built to live on a counter, not a shelf. ⚠️ (add exact size/specs if you want them public)

**Who designs it?**
We do. Recipes arrive messy — half-remembered amounts, "a pinch of this." We clean them up and lay them out so the whole thing reads like one book, without flattening how each person actually talks.

**Can I see the book before it prints?**
Yes, twice. Early on you get a free sample PDF with five finished recipes, so you can see the design with your group's actual food. Before printing, you review the full book page by page. Nothing prints until you say so.

**What if a recipe comes in incomplete?**
Expected. Half of home cooking is "until it looks right." We edit for clarity and keep the voice. Anything we can't resolve, you can fix yourself in the review step.

### Gifting

**Is the book a gift, or something the couple makes?**
Both happen. Most books are organized as a gift — by the maid of honor, the mom, the sister. Some couples run it themselves. Same book either way.

**When do people give it?**
The shower, the bachelorette, the rehearsal dinner — any moment where the people are actually in the room. It lands harder when she can pass it around the table.

**How far ahead should I start?**
Give yourself six to eight weeks before the day you want to hand it over. Collecting takes a few weeks — people need a nudge or two — and printing and shipping take the rest. Starting earlier never hurts.

**Can we keep it a surprise from the couple?**
Yes. The link goes to the guests, not the couple. Whether you tell her is up to you — plenty of groups keep it quiet until the shower. ⚠️ (confirm nothing in the flow emails the couple)

### Shipping & delivery

**Where do you ship?**
United States, all of the European Union, and Mexico.

**How long does the whole thing take?**
From the first invite to the hardcover in hand, four to six weeks. Most of that is collecting — printing and shipping happen at the end. ⚠️ (confirm print+ship portion if you want to state it separately)

**How much is shipping?**
Included for the main order, shipped to one address. Single copies ordered later ship for $14.

### Privacy & support

**Who can see the recipes?**
Only your group. The book isn't public, there's no feed, and we don't post anything. The only people who ever see it are the ones you invited.

**What do you do with guests' emails?**
We use them to send the invitation and reminders for your book. That's it. No newsletter, no marketing. ⚠️ (confirm this matches actual email behavior)

**Can I delete my event and everything in it?**
Yes. Write to us and we'll delete the event and all its recipes. ⚠️ (confirm process — manual via support?)

**What if I need help?**
Email team@smallplatesandcompany.com. A person answers. ⚠️ (add response-time claim only if you want to commit to one)

## 5. Technical design

**New files** (pattern mirrors `/regalos` with `_components/`):

| File | Purpose |
|---|---|
| `app/(public)/faq/page.tsx` | Server component. Hero, top-questions accordion, category cards, closing CTA. Page `metadata` + JSON-LD `FAQPage` schema for Google rich results. |
| `app/(public)/faq/_components/faq-data.ts` | Types (`FaqItem`, `FaqCategory`) + all content. Single source: top questions reference items by id. If it crosses ~300 lines, split into `faq-data.ts` (types + categories) and per-category content stays inline — judged at implementation. |
| `app/(public)/faq/_components/JumpNav.tsx` | Client component: sticky sidebar (desktop) / horizontal pill row (mobile). Anchor links + active-section highlight via IntersectionObserver. |

**Modified files:**
- `components/landing/FAQ.tsx` — add a "See all FAQs →" link to `/faq` at the bottom. Main landing only; `/regalos*` untouched.

**Implementation notes:**
- Top-questions accordion: native `<details>/<summary>` styled with brand classes — no framer-motion, works without JS.
- Complete FAQ rendered fully open (SEO + non-technical readers).
- Typography: `type-*` classes only. Colors: brand tokens (Warm White background, white cards, Sand borders, Honey accents).
- Layout: `lg:grid lg:grid-cols-[260px_1fr]` with sticky sidebar; stacked on mobile.
- CTAs: `/onboarding/welcome` (never the old `/onboarding`); mailto `team@smallplatesandcompany.com`.
- No new dependencies.

**Out of scope:** touching `/regalos` and `/regalos-usa` FAQs; header nav changes (can add a footer/nav link later if wanted); Spanish version.

## 6. Testing / verification

- `npx tsc --noEmit` after the TypeScript work.
- Visual check via Ricardo's screenshots (desktop + mobile) — no headless setup.
- Validate JSON-LD with Google's Rich Results test (Ricardo can paste the URL post-deploy).
