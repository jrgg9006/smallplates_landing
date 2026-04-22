> **⚠️ Scope note — read this first.**
>
> This document only covers the **color** layer of the token system. 
> It was drafted on April 22, 2026 before a recon revealed that radius, 
> shadows, spacing, and shadcn integration still have unintentional 
> drift (see `docs/token-migration-followups.md`, section 
> "Phase 2 scope — Design system cleanup").
>
> **Do not treat this as the complete design system doctrine.** 
> The full `token-philosophy.md` will be written after Phase 2 closes 
> and will incorporate this file's content as its color section.
>
> If you are Claude Design onboarding against this repo: this file 
> is incomplete. Do not use it as authoritative. The brief pack 
> as a whole is paused (see `design-system-brief/PAUSED.md`).

---

# Token Philosophy

This document explains *why* the Small Plates token system looks the way
it does. It complements — does not replace — the actual implementation in
`tailwind.config.ts` and `app/globals.css`.

Read this before extracting or extending color, typography, or spacing
tokens. The code can tell you *what* the tokens are. Only this document
can tell you which apparent inconsistencies are deliberate.

---

## The two warm whites are deliberate

Small Plates uses two warm whites that sit two shades apart:

- `--brand-warm-white` / `--brand-background` = `#FAF9F7` — base surface,
  body backgrounds, shadcn defaults. Airy.
- Warm-white accent = `#FAF7F2` — used intentionally for ~59 large-surface
  fills: landing sections, `/collect` funnel pages, text on dark CTAs.

**This is not an accident and should not be consolidated.**

In April 2026, a commit (`8a6a126`) collapsed both values into a single
warm-white token. The result felt beige and heavy — a single-tone
application loses the rhythm that defines the Small Plates
visual language. The commit was reverted.

The two-tone contrast is a direct expression of the Kinfolk editorial
rhythm described in the brand docs: large surfaces do not all share the
same value, because quiet variation is what makes the composition feel
composed rather than flat.

**Implementation rule:** The accent warm-white (`#FAF7F2`) is kept as
literal hex in source, not tokenized. Tokenizing it would invite future
refactors that collapse it back into the base. The literal hex is a
deliberate speed bump.

---

## Permanent token exclusions

Certain contexts render outside the browser. CSS variables do not resolve
there. Code in these paths must use literal hex values, not tokens:

- `lib/postmark.ts`, `lib/email/**`, `scripts/email/**` — email clients
  do not support CSS variables consistently.
- `app/api/v1/admin/showcase/preview/` and any `next/og` / satori routes —
  server-rendered images resolve CSS differently than the browser.
- `scripts/indesign/**` tendScript for book production. No CSS at all.
- `Prompts/`, `docs/`, `tailwind.config.ts` — reference material and config;
  tokens are defined here, not consumed.
- Literal hex inside `/* CSS comments */` or inside markdown prose in
  strings — these are documentation, not live values.

**Do not try to migrate these to tokens.** They are permanent exclusions,
documented during the April 2026 token migration (~990 hex literals
converted; these were explicitly kept).

---

## How the token system is structured

The system has two layers:

1. **Primitives** — raw color values (`--color-warm-white-50`, etc.),
   typography scales, spacing ramps. Defined in `tailwind.config.ts`.
2. **Semantic tokens** — purpose-bound references (`--brand-background`,
   `--surface-elevated`). Defined in `app/globals.css`.

When generating new components, prefer semantic tokens over primitives
whenever the purpose is clear. Reach for primitives only when no
existing semantic token matches the intent.

`app/globals.css` al role: it defines CSS variables *and*
contains `@apply` utility classes that consume tokens. When auditing
token usage, sweep both sections.

---

## What is still in motion

The token system is not frozen. `docs/token-migration-followups.md`
is the living record of deferred work, Lote C UNKNOWNs, structural gaps
(`charcoal-hover`, the cream accent cluster, additional semantic tokens
not yet named), and product decisions still pending.

When extending the system:

1. Check `token-migration-followups.md` first — the gap you're filling
   may already be scoped.
2. Do not retroactively rename existing tokens. Add new ones alongside.
3. Semantic token names should describe purpose, not appearance
   (`--surface-subtle`, not `--cream-2`).

---

## The mental model

The token system exists to make the product *composable without losing
coherence.* Every value in it earns its place. When a hex literal persists
outside the token system, either:

- it is a permanent exclusion (listed above), or
- it is an intentional speed bump (the warm-white accent), or
- it is a gap waiting to be closed (tracked in `token-migration-followups.md`).

There is no fourth category. If you encounter a literal hex that fits
none of the above, it is a bug or a drift — flag it rather than
preserve it.
