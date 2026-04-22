# Design System Brief — Small Plates & Co.

Small Plates makes collaborative wedding recipe books. Guests contribute recipes.
We turn them into a hardcover gift for the couple. The product is a book, but
the brand is an editorial position: cool on the outside, emotional on the inside.

This folder is the brief you read during onboarding. It exists because generic,
on-brand-looking output is the failure mode we care about most.

Read the folders in order. They are numbered intentionally.

---

## How to use this folder


| Folder                    | What it contains                                                                                                                                          | How to weight it                                                                                                                                             |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `01-brand-core/`          | Ten .md files defining brand strategy, voice, positioning, and audience. Source of truth for tone, messaging, and conceptual decisions.                   | **Highest weight for voice and copy.** When generating text, headlines, or microcopy, these files override any default tendencies toward generic UX writing. |
| `02-design-philosophy/`   | Short written docs explaining the *why* behind specific design decisions that are not obvious from code alone (e.g., why two warm whites instead of one). | **Read before extracting tokens from code.** These docs explain intent that the code cannot express on its own.                                              |
| `03-product-screenshots/` | Curated captures of the live product: landing page, collection flow, dashboard, modals, emails, and the physical book.                                    | **Highest weight for visual rhythm and layout.** This is what Small Plates actually looks like in production. When in doubt, match the feel of these.        |
| `04-aspirational-refs/`   | Screenshots of brands in Small Plates' aesthetic neighborhood                                                                                             | **Second-tier visual weight.** Use to understand the editorial register — type pairing, whitespace, photography mood. Do not copy these brands directly.     |
| `05-anti-patterns/`       | Screenshots of brands Small Plates is *not* — wedding industry complex, Hallmark sentimentality, pastel wedding marketplaces.                             | **Contrastive signal.** Anything that looks like these references is failing the brief. This folder is what `cultural-enemy` looks like visually.            |


---

## Non-negotiable brand rules

These are absolute. They apply across every output — landing sections, modals,
emails, decks, print. If a rule here conflicts with a default pattern, the rule wins.

### Voice

- Cool on the outside, emotional on the inside. Never lead with tears; earn them.
- Direct, not blunt. Respect the reader's time.
- Warm, with edge. Caring but not soft.
- Moving, not pushing. Create momentum without pressure.

### Words to use

kitchen, table, people, real, actually, just, done, finally

### Words to avoid

cherish, treasure, memories, special, unique, loved ones, celebrate, journey,
curated, perfect, amazing

### The 28-year-old rule

Before shipping any copy: would a 28-year-old editorial director from Brooklyn,
champagne in hand on a rooftop, say this? If she would roll her eyes, rewrite.
If she would say it with a knowing smile, ship it. Her name is Margot. The full
persona lives in `01-brand-core/margot.md`.

### Visual

- Two warm whites, not one. The base (`#FAF9F7`) and the accent (`#FAF7F2`) are
deliberately separate. A single-tone application reads as beige and heavy.
Details in `02-design-philosophy/`.
- No faces in photography. Anonymity creates universality.
- Generous whitespace. Editorial rhythm, not marketing density.
- Serif + sans pairing. No script, no decorative italics.
- No emojis, no hearts, no stock photography, no pastel wedding palettes.

---

## What "on-brand" means for Small Plates

The brand lives in a specific cultural gap: it treats a wedding gift with the
editorial seriousness of a cookbook, not the sentimentality of a wedding
marketplace. Output should feel like it belongs next to *Kinfolk*, *Cereal*,
and *The Infatuation* — not next to *The Knot*, *Zola*, or *Minted*.

The product is a kitchen book, not a keepsake. It is meant to be used, stained,
and lived in. Design should reflect that: functional, sturdy, editorial.
Not precious.

---

## What lives outside this folder

This brief pack is self-contained but the repo has other relevant context:

- `/brand_wedding/` — the original brand docs (source of truth; `01-brand-core/`
here is a synced copy).
- `/tailwind.config.ts` and `/app/globals.css` — the actual implemented tokens.
- `/app/` — the live Next.js codebase. Components here are the working
reference for any new component you generate.
- `/docs/token-migration-followups.md` — living document of token system work
in progress. Read if extending the color or spacing system.

---

## Maintenance

This brief pack is versioned alongside the rest of the repo. When brand docs,
product screenshots, or design philosophy change, update this folder in the
same PR as the underlying change. Drift between this folder and the rest of
the repo is the single biggest risk to output quality.