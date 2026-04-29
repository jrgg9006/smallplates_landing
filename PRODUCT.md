# Product

## Register

brand

Register default is brand (marketing, landing, editorial, showcase email). Platform surfaces (organizer dashboard, guest submission flow, transactional email) override to product per task.

## Users

**Organizer** (primary buyer, primary acquisition target): behavioral character, not demographic role. She can be the maid of honor, sister, mother, aunt, or friend — the label is irrelevant; what matters is the behavior. She's the proactive one who opens group chats, sends reminders, follows up. She is not the bride. The couple receives the book; the organizer makes it happen.

Context: organizing or supporting a wedding, already overwhelmed, looking for a gift that feels considered without adding another item to her to-do list. Found via word-of-mouth, organic, future editorial coverage. Aesthetics-literate. She passes the Margot test (see The Margot Filter section) — she'd actually use this language, not roll her eyes at it.

Why she actually buys (insight from early-adopter interviews — load this with high weight; it changes how every output should be written): she's not buying a gift. She's making sure the recipient — usually the bride — knows, undeniably, how many people love her. The book is the proof. 80 contributions are harder to dismiss than a card, a toast, or a feeling. The product turns "they love you" into something countable, holdable, impossible to wave off.

This is the deeper motivator behind every step she takes — sending the link, chasing reminders, choosing extra copies. Copy, design, and product decisions across all surfaces must honor this rule: never declare love; prove it by quantifying contribution. "80 people came to your wedding. Now they're all in a book in your kitchen" is the canonical example. "A heartfelt gift from those who love you" is the canonical failure.

**Wedding guests** (platform users, not buyers): 80+ people who receive a link and submit a recipe. Age range 18–75+. Tech literacy varies widely. Devices: current iPhones to older Androids. Job to be done: submit a recipe without friction or instructions, while leaving with a clear sense of what they contributed to. Each guest is a future organizer; the showcase email is where that conversion happens. Submission is invisible; the showcase is not.

**Future customer (PR/SEO target):** someone who discovers the product post-wedding, or a guest who wants to organize one. Zero paid ads — all organic, word-of-mouth, future editorial coverage.

## Product Purpose

Guests contribute recipes via a link. Small Plates designs and prints a premium hardcover cookbook. The couple receives the book. The organizer does nothing except send the link.

The book lives in the kitchen. It gets stained. That's the point.

Success: the organizer feels she pulled something off that looked effortless. The couple opens the book at the kitchen counter two years later and reads a name they haven't thought about since the wedding.

## Brand Personality

**Specific, dry, earned.**

- **Specific:** concrete over abstract. Named over described. "80 people, one book" over "a meaningful gathering."
- **Dry:** wit over earnestness. Restraint over exclamation. Trust the reader to feel it.
- **Earned:** show, don't announce. The warmth, the meaning, the craft surface through specifics — never through self-description. The brand never tells the reader the product is meaningful, beautiful, or special. The reader concludes that on their own.

## References

**Primary:**
- **Aesop** — voice, copy discipline, retail restraint. Long-form product descriptions that actually read. Trust-the-reader posture. Spaces that feel like libraries. Anchors how the brand sounds.
- **Diaspora Co.** — founder-voice, food photographed in real kitchens (not studio), copy that leads with origin and people, premium positioning without exclusivity. Anchors the "premium but used, not preserved" tension.
- **Kinfolk** — editorial atmosphere and layout. Generous whitespace that feels considered, not empty. Warm cream/bone/oak palette. Food as it actually arrives at a table: imperfect plates, natural light. Serif at scale. Anchors the mood.

**Secondary:**
- **Brightland** — one dimension only: color-saturated product photography (mustard, terracotta, deep gold) treating a consumable object as a still life. Reference point for accent color saturation — not for brand voice.

## Anti-references

**Direct competitors (named, with pattern):**
- **vinst.me** — AI-as-hero copy, "made fast and beautiful" value prop, full banned-vocabulary surface. Pattern: cookbook-as-AI-tool. The user does the work; AI is the value driver.
- **createmycookbook.com** — DIY framing, multi-vertical dilution, race-to-bottom pricing, spiral-bound institutional signal. Pattern: cookbook-as-template.
- Shared anti-pattern: cookbook-as-tool. The user makes the cookbook. Small Plates is the inverse: 80 guests make the cookbook; the organizer sends the link.

**Wedding industry (whole category to avoid):**
- Brands: The Knot, Zola, Brides.com, Martha Stewart Weddings, Minted, Paperless Post (wedding line)
- Typography: Playfair Display + script calligraphy as a pairing. Banned across the system.
- Photography: "light and airy" — golden hour, orchestrated candid, couples with mouths open in joy, drone venue shots, first-look reveals
- Aesthetic clusters: mason jar / barn / fairy lights / rustic chic; chalkboard signage; "her and him" his-and-hers framing
- Copy: "your special day," "your perfect moment," "forever starts here," "celebrate your love"

**Generic SaaS / AI tool aesthetic:**
- Purple gradients, glassmorphism, "Boost your X" value props
- Stock illustrations of people on laptops
- Lottie animations as decoration
- "Hyper-personalization" as marketing language

**The named test:** if it could plausibly appear on The Knot, vinst.me, or a generic AI SaaS landing page — it's wrong.

**Banned vocabulary:** cherish · treasure · memories · special · unique · loved ones · celebrate · journey · curated · perfect · amazing · so blessed · yummy · heartfelt keepsake · meaningful · timeless

**Canonical Small Plates vocabulary** (affirmative reference, from tone-of-voice.md's "We say / We don't say" table — use these instead of the banned terms above):
the people · everyone who showed up · the book lives in the kitchen · who came · the afterward · 80 guests, one book · she pulled it off · at the table · Wednesday · the people in her life

## Design Principles

1. **Specifics do the emotional work.** Never tell the reader what to feel. "80 people came to your wedding. Now they're all in a book in your kitchen." Not: "A deeply personal gift for your loved ones."

2. **The inverse workflow.** The organizer sends a link. 80 people do the rest. Brand surfaces show the outcome. Platform surfaces disappear into the process.

3. **Premium but used, not preserved.** The book gets stained. That's how it succeeds. Design signals durability and real use, not museum archival.

4. **Editorial weight on brand surfaces; friction-free on platform surfaces.** The landing page can afford slowness, texture, weight. The submission form cannot. Wrong register is a lost guest.

5. **Honey is the spice.** The warm amber accent earns its appearance through scarcity. Secondary palette (Terracotta, Olive) appears even more rarely. Warm white is the dish.

6. **The organizer is behavioral, not demographic.** Never address her by role (MOH, bridesmaid, sister, mom). Address her by behavior — the friend who carries the logistics, the one who opens the group chat, the one who shows up. Demographic targeting collapses the audience; behavioral targeting expands it.

## The Margot Filter

Every output passes one test before shipping: would a Brooklyn creative director — partnered, not married, glass of natural wine, dinner party at 11pm that got real — say this out loud, without irony?

If she'd roll her eyes → rewrite.
If she'd say it with a knowing smile → ship it.

Full character study: `brand_wedding/margot.md`.

## Accessibility & Inclusion

**Target:** WCAG 2.2 AA across all surfaces. Reduced motion handling already implemented.

**Platform surfaces** (submission flow, organizer dashboard):
- Touch targets: minimum 44pt (iOS) / 48dp (Android), no exceptions
- Forms must survive autofill, paste-from-notes, paste-from-voice-to-text
- Bilingual ES/EN: no idioms or culturally specific language that fails in either market
- Functionality works without JavaScript where technically possible

**Brand/marketing surfaces:** Editorial premium positioning is intentional and a feature. Plain-language cognitive accessibility is not a target.

**Hard color rules:**
- Honey `#D4A854` on Warm White `#FAF9F7` fails AA (~2.1:1). Honey is accent only — never body text, never any text conveying critical information at ≤18pt bold.
- Charcoal `#2D2D2D` on Warm White `#FAF9F7` passes AA at ~14:1. Canonical body text pair.
- Color blindness (deuteranopia): Honey, Terracotta, and Olive are hard to distinguish. Color is never the sole signal for UI state, error, or differentiation. Always paired with text, icon, or shape.

**Not targeted:** WCAG AAA, IE11, pre-2020 Safari.
