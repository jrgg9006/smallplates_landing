# Small Plates & Co. — Wedding Recipe Books Platform

Guests contribute recipes → we produce a premium hardcover cookbook for the couple.
Brand essence: cool on the outside, emotional on the inside.

## Core Philosophy - READ THIS FIRST
- **SIMPLE BUT POWERFUL**: Always prefer surgical, minimal changes over complex rewrites
- **Modify before create**: Search existing code FIRST, only create new files as last resort
- **Ask before assuming**: If uncertain, ask. Don't guess.

## Stack

- Next.js 14 (App Router), TypeScript strict, Tailwind CSS
- Supabase (PostgreSQL + RLS + Auth + Storage + Edge Functions)
- Vercel (frontend), Railway (Python AI agents)
- Postmark (transactional email), OpenAI GPT-4o (recipe cleaning)
- Brand colors: Honey #D4A854, Warm White #FAF7F2, Soft Charcoal #2D2D2D, Sand #E8E0D5

## Structure

- `app/` — Pages, layouts, API routes (App Router)
- `components/` — React components (ui/, recipe-journey/, profile/)
- `lib/` — Utilities, Supabase client, helpers
- `lib/types/database.ts` — Database schema reference (use this instead of querying Supabase)
- `brand_wedding/` — All brand strategy docs. See @brand_wedding/tone-of-voice.md for voice rules
- `supabase/migrations/` — Database migrations

## Commands

- `npm run dev` — Dev server
- `npm run build` — Production build
- `npm run lint` — ESLint
- `npx tsc --noEmit` — Type check (run after TypeScript changes)
- Single test: `npx jest path/to/file.test.ts`

## Code Rules

- Modify existing files before creating new ones. Search first.
- No `any` types. Functional components with hooks. Early returns over nesting.
- Keep files under 300 lines. Refactor if approaching this.
- No new dependencies without asking.
- No refactoring unrelated code while fixing something else.
- No console.logs in production code.
- Comment non-obvious logic with `// Reason:` explaining WHY.
- After finishing a series of TypeScript changes, run: `npx tsc --noEmit`

### What NOT to Do
- Don't create new components if an existing one can be modified
- Don't install new dependencies without asking
- Don't refactor unrelated code while fixing something else
- Don't make "improvements" I didn't ask for
- Don't run `npm run build` for small changes

## Supabase Rules

NEVER execute INSERT, UPDATE, DELETE, or DROP without explicit confirmation.
Show me the exact query first and wait for "CONFIRMED".
Do NOT explore schema via MCP exhaustively — use `lib/types/database.ts` as reference.
Always check RLS policies exist for new tables.

## Brand Voice (for any user-facing text)

NEVER use these words: cherish, treasure, memories, special, unique, loved ones, celebrate, journey, curated, perfect, amazing.
USE these words: kitchen, table, people, real, actually, just, done, finally.
For detailed guidelines, see .claude/skills/brand-guidelines/

## Workflow

- Explore first, then plan, then code. Propose the minimal change that solves the problem.
- For features touching 3+ files, use plan mode before implementing.
- Ask before assuming. If uncertain about intent, ask.