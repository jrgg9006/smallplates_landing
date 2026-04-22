# Paused

This brief pack is incomplete. Setup was paused on April 22, 2026 
partway through preparation.

## Why

During preparation, a recon of the codebase revealed unintentional 
drift in radius, shadows, spacing, and shadcn integration. Onboarding 
Claude Design against the codebase in its current state would encode 
that drift as doctrine — every future generated component would 
replicate inconsistencies the team already knows are wrong.

## What was completed before pausing

- Folder scaffolding for the full brief pack.
- `01-brand-core/` — all 10 brand docs copied from `brand_wedding/`.
- `README.md` — master doc for Claude Design onboarding.
- `02-design-philosophy/token-philosophy-color-only.md` — partial 
  doc covering only the color layer (two warm whites, permanent 
  exclusions). Contains a scope-note header explaining its limitations. 
  Will become the color section of the full `token-philosophy.md` 
  when Phase 2 closes.

## What needs to happen before resuming

Phase 2 design system cleanup must close first. Scope is documented 
in `docs/token-migration-followups.md` under 
"Phase 2 scope — Design system cleanup".

After Phase 2 closes:
1. Write `02-design-philosophy/token-philosophy.md` based on the now-
   intentional system.
2. Take product screenshots for `03-product-screenshots/` 
   (post-cleanup visuals).
3. Curate aspirational references for `04-aspirational-refs/`.
4. Curate anti-patterns for `05-anti-patterns/`.
5. Final review. Merge this branch to main. 
   Run Claude Design onboarding against the clean codebase.

## Do not merge this branch to main until the checklist above is complete.
