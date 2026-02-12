# Small Plates - Wedding Recipe Books Platform

## 🎯 Core Philosophy - READ THIS FIRST
- **SIMPLE BUT POWERFUL**: Always prefer surgical, minimal changes over complex rewrites
- **Modify before create**: Search existing code FIRST, only create new files as last resort
- **Ask before assuming**: If uncertain, ask. Don't guess.

## 📋 Project Context
Small Plates helps couples create collaborative wedding recipe books where guests contribute recipes that are compiled into hardcover books.

### Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL + RLS)
- **Auth**: Supabase Auth
- **Hosting**: Vercel
- **Image Processing**: Background jobs via Supabase Edge Functions

### Key Directories
- `app/` - Next.js App Router pages and API routes
- `components/` - Reusable React components
- `lib/` - Utilities, Supabase client, helpers
- `supabase/migrations/` - Database migrations

## 🔧 How I Want You to Work

### Before Making Changes
1. **Explore first**: Search for existing components/functions that do something similar
2. **Understand the pattern**: Look at how similar things are implemented in this codebase
3. **Propose the minimal change**: What's the smallest edit that solves the problem?
4. **Only then implement**: Make surgical, precise changes

### Code Style
- Keep files under 300 lines (refactor if approaching this)
- Use TypeScript strictly - no `any` types
- Components: functional with hooks
- Prefer early returns over nested conditionals
- Name things clearly - no abbreviations

### What NOT to Do
- Don't create new components if an existing one can be modified
- Don't install new dependencies without asking
- Don't refactor unrelated code while fixing something else
- Don't make "improvements" I didn't ask for
- Don't run `npm run build` for small changes

## 🗄️ Database Rules (Supabase MCP)
- **NEVER** execute INSERT, UPDATE, DELETE, or DROP without my explicit confirmation
- Before modifying data, show me the exact query first
- For destructive operations, wait for me to write "CONFIRMED"
- When in doubt, run SELECT first to show me affected data
- Always check RLS policies exist for new tables
- **NO exploración masiva de DB**: NO uses el MCP ni agentes para leer tablas, columnas o schema de Supabase de forma exhaustiva. Eso gasta muchos tokens. En su lugar, dame el SQL query y pídeme que yo lo corra en Supabase. Yo te paso el resultado. Usa `lib/types/database.ts` como referencia rápida del schema.

## ✅ Task Management
- Check `TASK.md` before starting work
- Add new tasks discovered during development
- Mark tasks complete when done

## 🧪 Testing
- Add tests for new features in `/tests`
- Update existing tests when logic changes
- At minimum: 1 happy path, 1 edge case, 1 failure case

## 📝 After Completing Work
- Update README.md if setup steps changed
- Comment non-obvious code with `// Reason:` explaining WHY
- Don't leave console.logs in production code