# Product

*Context file for design work (read by the impeccable skill). Brand strategy, voice, and characters live in `brand/`; this file holds only what design work needs and `brand/` doesn't cover. When they conflict, `brand/` wins.*

## Register

brand

Register default is brand (marketing, landing, editorial, showcase email). Platform surfaces (organizer dashboard, contributor submission flow, transactional email) override to product per task.

## Users

- **The organizer** (buyer): full psychology in `brand/characters.md`. Her engine is making the receiver happy with something they'll actually use. Not credit, not status. Behavioral, not demographic: never address her by role.
- **Contributors** (platform users, not buyers): any age, 18 to 75+. Tech literacy varies widely; devices range from current iPhones to older Androids. Job to be done: send a recipe without friction or instructions, from wherever they are. Each contributor is a future organizer; the showcase email is where that conversion happens.
- **The receiver**: gets the book, never sees it before it arrives. The surprise is by design.
- **Occasions**: any (a wedding, a retirement, a graduation, a new baby, a birthday that matters). Never design or write as if weddings were the only case.

## Business model (design-relevant)

Free to start; payment happens once, when the book goes to print. Early steps of the flow must never feel gated by payment. Pricing lives in `lib/stripe/pricing.ts`, not here.

## Voice

All copy rules live in `brand/voice.md`: the vocabulary, the Room Test, no guest numbers, no "showed up," no em dashes.

Canonical example: "Everyone you love has one recipe they're known for. Now they're all in a book in your kitchen."
Canonical failure: "A heartfelt gift from those who love you."

## References

**Primary:**
- **Aesop**: voice, copy discipline, retail restraint. Long-form product descriptions that actually read. Trust-the-reader posture. Anchors how the brand sounds.
- **Diaspora Co.**: founder-voice, food photographed in real kitchens (not studio), copy that leads with origin and people, premium positioning without exclusivity. Anchors the "premium but used, not preserved" tension.
- **Kinfolk**: editorial atmosphere and layout. Generous whitespace that feels considered, not empty. Warm cream/bone/oak palette. Food as it actually arrives at a table. Serif at scale. Anchors the mood.

**Secondary:**
- **Brightland**: one dimension only: color-saturated product photography treating a consumable object as a still life. Reference for accent color saturation, not for voice.

## Anti-references

**Direct competitors (named, with pattern):**
- **vinst.me**: AI-as-hero copy, "made fast and beautiful" value prop. Pattern: cookbook-as-AI-tool.
- **createmycookbook.com**: DIY framing, race-to-bottom pricing, spiral-bound institutional signal. Pattern: cookbook-as-template.
- Shared anti-pattern: cookbook-as-tool, where the user does the work. Small Plates is the inverse: the group makes the book; the organizer sends a link.

**Occasion-industry clichés (avoid across all occasions, wedding included):**
- Typography: Playfair Display + script calligraphy as a pairing. Banned across the system.
- Photography: "light and airy," golden hour, orchestrated candid, drone venue shots, faces of honorees front and center.
- Copy: "your special day," "your perfect moment," "forever starts here."

**Generic SaaS / AI tool aesthetic:**
- Purple gradients, glassmorphism, "Boost your X" value props, stock illustrations of people on laptops, Lottie animations as decoration.

**The named test:** if it could plausibly appear on The Knot, vinst.me, or a generic AI SaaS landing page, it's wrong.

## Design Principles

1. **Specifics do the emotional work.** Never tell the reader what to feel. Named over described.
2. **The inverse workflow.** The organizer sends a link. The group does the rest. Brand surfaces show the outcome; platform surfaces disappear into the process.
3. **Premium but used, not preserved.** The book gets stained. That's how it succeeds. Design signals durability and real use, not museum archival.
4. **Editorial weight on brand surfaces; friction-free on platform surfaces.** The landing page can afford slowness, texture, weight. The submission form cannot. Wrong register is a lost contributor.
5. **Honey is the spice.** Full color and typography system in `brand/visual-identity.md`.
6. **Free-to-start is part of the experience.** The first session should feel like starting, not like shopping.

## Accessibility & Inclusion

**Target:** WCAG 2.2 AA across all surfaces. Reduced motion handling already implemented.

**Platform surfaces** (submission flow, organizer dashboard):
- Touch targets: minimum 44pt (iOS) / 48dp (Android), no exceptions
- Forms must survive autofill, paste-from-notes, paste-from-voice-to-text
- Bilingual ES/EN: no idioms or culturally specific language that fails in either market
- Functionality works without JavaScript where technically possible

**Brand/marketing surfaces:** Editorial premium positioning is intentional and a feature. Plain-language cognitive accessibility is not a target.

**Hard color rules:**
- Honey `#D4A854` on Warm White `#FAF9F7` fails AA (~2.1:1). Honey is accent only: never body text, never any text conveying critical information at ≤18pt bold.
- Charcoal `#2D2D2D` on Warm White `#FAF9F7` passes AA at ~14:1. Canonical body text pair.
- Color blindness (deuteranopia): Honey, Terracotta, and Olive are hard to distinguish. Color is never the sole signal for UI state, error, or differentiation. Always paired with text, icon, or shape.

**Not targeted:** WCAG AAA, IE11, pre-2020 Safari.

---

*Rewritten July 2026 against the `brand/` system (multi-occasion, free-to-start). Replaces the April 2026 wedding-era version: old motivation model, guest counts, wedding-only users, and duplicated vocabulary removed; brand content now referenced from `brand/` instead of copied.*
