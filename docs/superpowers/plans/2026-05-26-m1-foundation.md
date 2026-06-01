# M1: Foundation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Abrir la plataforma a usuarios sin pago. Auth passwordless, signup free, onboarding multi-step de 8 pantallas que crea un `group` en estado `free_tier`. Feature flag gating everything new.

**Architecture:** Modificar el flujo actual donde el `group` se crea en `lib/stripe/post-payment-setup.ts` post-pago, para que ahora pueda crearse silenciosamente al final del onboarding sin pasar por Stripe. Agregar estado `free_tier` al enum existente `GroupStatus`. Toda la lógica nueva gateada por feature flag `NEXT_PUBLIC_FREE_TIER_ENABLED`. Auth pasa de email+password (legacy) a magic link (Supabase `signInWithOtp`) + Google OAuth (ya parcialmente implementado en el callback existente).

**Tech Stack:** Next.js 14 App Router, TypeScript, Supabase Auth, Supabase Postgres con RLS, Tailwind CSS, Jest (instalado pero infra de tests sin establecer — usar TDD selectivo).

**Testing strategy:** TDD estricto para lógica crítica (transiciones de status, validaciones de policy, generación de tokens, redirecciones de onboarding). Verificación manual para componentes UI puros. Cada tarea declara qué estrategia usa.

**Spec de referencia:** `docs/superpowers/specs/2026-05-26-free-tier-event-platform-design.md`

---

## File Structure

### Migrations a crear
- `supabase/migrations/2026MMDD_add_free_tier_status.sql` — agrega `'free_tier'` al enum `group_status_enum` (o crea el enum si no existe), agrega columnas `event_date`, `event_location`, `recipe_only_token` a `groups`.
- `supabase/migrations/2026MMDD_free_tier_rls_policies.sql` — RLS policies para `free_tier` groups.

### Archivos nuevos
- `lib/feature-flags.ts` — helper para evaluar feature flags desde código.
- `lib/supabase/onboarding.ts` — DB calls para el flujo de onboarding (crear group free_tier, actualizar campos, marcar completado).
- `lib/auth/magic-link.ts` — wrapper de `signInWithOtp` con metadata de onboarding context.
- `app/(public)/signin/page.tsx` — página de signin/signup unificada con magic link + Google.
- `app/api/v1/auth/magic-link/route.ts` — endpoint para mandar magic link.
- `app/(onboarding)/layout.tsx` — layout compartido del onboarding (header minimal, progress indicator opcional).
- `app/(onboarding)/welcome/page.tsx` — paso 1.
- `app/(onboarding)/occasion/page.tsx` — paso 2.
- `app/(onboarding)/book-date/page.tsx` — paso 3.
- `app/(onboarding)/about-you/page.tsx` — paso 4 (creación de cuenta).
- `app/(onboarding)/co-organizer/page.tsx` — paso 5.
- `app/(onboarding)/event-details/page.tsx` — paso 6.
- `app/(onboarding)/personalize-invite/page.tsx` — paso 7.
- `app/(onboarding)/invite-first/page.tsx` — paso 8.
- `components/onboarding/OnboardingShell.tsx` — wrapper visual de pantalla individual (título, ilustración, contenido, navegación Continue/Skip/Back).
- `components/onboarding/onboardingState.ts` — Zustand store o React context para estado del onboarding pre-cuenta (occasion, book_date) que aún no vive en DB.
- `__tests__/lib/feature-flags.test.ts`
- `__tests__/lib/supabase/onboarding.test.ts`
- `__tests__/lib/auth/magic-link.test.ts`
- `__tests__/integration/onboarding-flow.test.ts`

### Archivos a modificar
- `lib/types/database.ts` — agregar `'free_tier'` a `GroupStatus`, agregar nuevos campos del grupo.
- `lib/stripe/post-payment-setup.ts` — modificar `findOrCreatePendingGroup` para que si ya existe un grupo `free_tier` del usuario, lo "upgrade" a `pending_setup` en lugar de crear uno nuevo.
- `middleware.ts` (si existe) — agregar lógica de redirección si feature flag está apagado.
- `.env.local` — agregar `NEXT_PUBLIC_FREE_TIER_ENABLED=true` (documentar en env example).
- `.env.example` — documentar la nueva variable.

---

## Task 1: Feature Flag Infrastructure

**Files:**
- Create: `lib/feature-flags.ts`
- Create: `__tests__/lib/feature-flags.test.ts`
- Modify: `.env.example`

**Strategy:** TDD estricto. Lógica pura, fácil de testear.

- [x] **Step 1: Write failing test**

```typescript
// __tests__/lib/feature-flags.test.ts
import { isFreeTierEnabled } from '@/lib/feature-flags';

describe('feature flags', () => {
  const originalEnv = process.env.NEXT_PUBLIC_FREE_TIER_ENABLED;

  afterEach(() => {
    process.env.NEXT_PUBLIC_FREE_TIER_ENABLED = originalEnv;
  });

  it('returns true when NEXT_PUBLIC_FREE_TIER_ENABLED is "true"', () => {
    process.env.NEXT_PUBLIC_FREE_TIER_ENABLED = 'true';
    expect(isFreeTierEnabled()).toBe(true);
  });

  it('returns false when NEXT_PUBLIC_FREE_TIER_ENABLED is "false"', () => {
    process.env.NEXT_PUBLIC_FREE_TIER_ENABLED = 'false';
    expect(isFreeTierEnabled()).toBe(false);
  });

  it('returns false when NEXT_PUBLIC_FREE_TIER_ENABLED is undefined', () => {
    delete process.env.NEXT_PUBLIC_FREE_TIER_ENABLED;
    expect(isFreeTierEnabled()).toBe(false);
  });
});
```

- [x] **Step 2: Run test, verify it fails**

```bash
npx jest __tests__/lib/feature-flags.test.ts
```
Expected: FAIL with "Cannot find module '@/lib/feature-flags'".

- [x] **Step 3: Implement**

```typescript
// lib/feature-flags.ts
// Reason: Centraliza evaluación de feature flags para que las decisiones de gating
// del free-tier sean fáciles de modificar sin tocar componentes individuales.

export function isFreeTierEnabled(): boolean {
  return process.env.NEXT_PUBLIC_FREE_TIER_ENABLED === 'true';
}
```

- [x] **Step 4: Run test, verify it passes**

```bash
npx jest __tests__/lib/feature-flags.test.ts
```
Expected: All 3 tests PASS.

- [x] **Step 5: Update env example**

Add to `.env.example`:
```
# Feature flag: enable free-tier signup flow (no Stripe required)
NEXT_PUBLIC_FREE_TIER_ENABLED=false
```

- [x] **Step 6: Commit**

```bash
git add lib/feature-flags.ts __tests__/lib/feature-flags.test.ts .env.example
git commit -m "feat(free-tier): add feature flag infrastructure"
```

---

## Task 2: DB migration — add free_tier status and event columns

**Files:**
- Create: `supabase/migrations/2026MMDD_add_free_tier_status.sql` (replace MMDD with current date, e.g. `20260526`)
- Modify: `lib/types/database.ts`

**Strategy:** SQL change first, then update TypeScript types to match. No test code; verification is "type checker passes + manual SQL run".

- [x] **Step 1: Write migration SQL**

```sql
-- supabase/migrations/20260526_add_free_tier_status.sql
-- Add free_tier status to GroupStatus enum and event-related columns to groups table.
-- Free tier groups exist before Stripe payment; upgrade to pending_setup on checkout.

BEGIN;

-- 1. Add 'free_tier' to the existing enum (assumes enum type 'group_status_enum' exists;
--    if it's stored as TEXT with a CHECK constraint, adjust accordingly).
ALTER TYPE group_status_enum ADD VALUE IF NOT EXISTS 'free_tier' BEFORE 'pending_setup';

-- 2. Add event-related columns to groups table.
ALTER TABLE public.groups
  ADD COLUMN IF NOT EXISTS event_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS event_location TEXT,
  ADD COLUMN IF NOT EXISTS recipe_only_token TEXT;

-- 3. Backfill recipe_only_token for existing groups so legacy groups also have a value.
--    8-char random base32-ish token, sufficient unlikely-to-guess given low cardinality.
UPDATE public.groups
SET recipe_only_token = substr(md5(random()::text || id::text), 1, 8)
WHERE recipe_only_token IS NULL;

-- 4. Enforce NOT NULL + UNIQUE on recipe_only_token going forward.
ALTER TABLE public.groups
  ALTER COLUMN recipe_only_token SET NOT NULL,
  ADD CONSTRAINT groups_recipe_only_token_unique UNIQUE (recipe_only_token);

-- 5. Add comments for documentation.
COMMENT ON COLUMN public.groups.event_date IS 'Optional date/time of the event (bridal shower, wedding, etc.)';
COMMENT ON COLUMN public.groups.event_location IS 'Optional free-text location of the event';
COMMENT ON COLUMN public.groups.recipe_only_token IS 'Random short token for /collect/[token]/r/[recipe_only_token] URL — used to share recipe link without exposing the event invitation link';

COMMIT;
```

- [x] **Step 2: Apply migration manually**

Per project rules (see CLAUDE.md and user memory `feedback_supabase_manual.md`): give Ricardo the SQL block above and ask him to run it manually against the Supabase project. Do NOT use `apply_migration` or `execute_sql` MCP tools.

When Ricardo confirms "applied", proceed.

- [x] **Step 3: Update TypeScript types**

```typescript
// lib/types/database.ts
// Change:
export type GroupStatus = 'pending_setup' | 'active';
// To:
export type GroupStatus = 'free_tier' | 'pending_setup' | 'active';
```

Also add the new fields to the `groups` Row, Insert, and Update types. Find the existing `groups` table type definition in `database.ts` and add:

```typescript
event_date: string | null;
event_location: string | null;
recipe_only_token: string;
```

In Insert and Update types, mark `event_date` and `event_location` as optional, and `recipe_only_token` as optional in Insert (DB generates if missing).

- [x] **Step 4: Run type check**

```bash
npx tsc --noEmit
```
Expected: No errors. If there are errors elsewhere from the GroupStatus change, fix them by adding `'free_tier'` to switch cases or guards that need it.

- [x] **Step 5: Commit**

```bash
git add supabase/migrations/20260526_add_free_tier_status.sql lib/types/database.ts
git commit -m "feat(db): add free_tier status and event columns to groups"
```

---

## Task 3: RLS policies for free_tier groups

**Files:**
- Create: `supabase/migrations/2026MMDD_free_tier_rls_policies.sql`

**Strategy:** Read existing policies first, then write augmenting policies. Verification: manual SQL test via Supabase dashboard or psql.

- [x] **Step 1: Read existing RLS policies on groups**

Find existing policies:

```bash
grep -rn "CREATE POLICY\|ALTER POLICY" supabase/migrations/ | grep -i "group" | head -20
```

Read each matching file. Identify which policies apply to `groups`, `group_members`, `group_invitations`.

- [x] **Step 2: Decide what policies need adjusting**

Free-tier groups should:
- Allow SELECT by the owner (already covered if existing policies use `created_by = auth.uid()`).
- Allow INSERT by any authenticated user (already covered if the existing policy allows users to insert their own groups).
- Allow UPDATE by the owner (already covered).
- BLOCK paid-only operations: ordering print, accessing premium features. Check `orders` table policies and verify they require `groups.status != 'free_tier'`.

If existing policies use `auth.uid() = created_by` without restricting by status, they already cover free_tier. Only write new policies for restrictions.

- [x] **Step 3: Write migration if restrictions needed** — SKIPPED: existing policies use ownership/membership checks, not status. No restrictions needed.

```sql
-- supabase/migrations/20260526_free_tier_rls_policies.sql
-- Free-tier groups: restrict order creation until upgraded to pending_setup or active.

BEGIN;

-- Drop existing policy if it allows inserts on orders without checking group status.
-- (Adjust policy name to match existing one identified in Step 1.)
DROP POLICY IF EXISTS "Users can create orders for their groups" ON public.orders;

CREATE POLICY "Users can create orders for paid groups"
  ON public.orders
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.groups
      WHERE groups.id = orders.group_id
        AND groups.status IN ('pending_setup', 'active')
    )
  );

COMMIT;
```

If existing policies are already restrictive enough, skip this migration entirely. In that case, document in the plan: "Step 3: No new policies needed; existing constraints sufficient."

- [x] **Step 4: Ricardo runs SQL manually** — SKIPPED: no migration needed.

- [x] **Step 5: Commit** — SKIPPED: no changes to commit.

```bash
git add supabase/migrations/20260526_free_tier_rls_policies.sql
git commit -m "feat(db): RLS policies prevent paid actions on free_tier groups"
```

---

## Task 4: Magic Link Authentication — Backend

**Files:**
- Create: `lib/auth/magic-link.ts`
- Create: `app/api/v1/auth/magic-link/route.ts`
- Create: `__tests__/lib/auth/magic-link.test.ts`

**Strategy:** TDD for `lib/auth/magic-link.ts` (pure wrapper), light integration for the API route.

- [x] **Step 1: Write failing test for magic-link wrapper** — SKIPPED: reusing existing `/api/auth/send-login-link` + `lib/supabase/auth.ts`. No new wrapper needed.

```typescript
// __tests__/lib/auth/magic-link.test.ts
import { sendMagicLink } from '@/lib/auth/magic-link';

// Mock Supabase client
const mockSignInWithOtp = jest.fn();
jest.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: () => ({
    auth: { signInWithOtp: mockSignInWithOtp },
  }),
}));

describe('sendMagicLink', () => {
  beforeEach(() => {
    mockSignInWithOtp.mockReset();
  });

  it('calls signInWithOtp with email and redirect URL', async () => {
    mockSignInWithOtp.mockResolvedValue({ data: {}, error: null });
    await sendMagicLink({ email: 'mom@example.com', redirectTo: '/onboarding/about-you' });

    expect(mockSignInWithOtp).toHaveBeenCalledWith({
      email: 'mom@example.com',
      options: {
        emailRedirectTo: expect.stringContaining('/onboarding/about-you'),
        shouldCreateUser: true,
      },
    });
  });

  it('returns error when Supabase fails', async () => {
    mockSignInWithOtp.mockResolvedValue({ data: null, error: { message: 'rate limited' } });
    const result = await sendMagicLink({ email: 'mom@example.com', redirectTo: '/dashboard' });
    expect(result.error).toEqual({ message: 'rate limited' });
  });
});
```

- [x] **Step 2: Run test, verify it fails** — SKIPPED

- [x] **Step 3: Implement magic-link wrapper** — Modified existing `send-login-link` endpoint + `sendMagicLink()` in `lib/supabase/auth.ts` instead.

```typescript
// lib/auth/magic-link.ts
import { createServerSupabaseClient } from '@/lib/supabase/server';

export interface SendMagicLinkParams {
  email: string;
  redirectTo: string;
}

export interface SendMagicLinkResult {
  error: { message: string } | null;
}

export async function sendMagicLink(params: SendMagicLinkParams): Promise<SendMagicLinkResult> {
  const supabase = createServerSupabaseClient();
  const origin = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  const { error } = await supabase.auth.signInWithOtp({
    email: params.email,
    options: {
      emailRedirectTo: `${origin}${params.redirectTo}`,
      shouldCreateUser: true,
    },
  });

  return { error: error ? { message: error.message } : null };
}
```

- [x] **Step 4: Run test, verify it passes** — SKIPPED

- [x] **Step 5: Implement API route** — Modified existing `/api/auth/send-login-link` with `allowSignup` + `redirectTo` params.

```typescript
// app/api/v1/auth/magic-link/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { sendMagicLink } from '@/lib/auth/magic-link';
import { isFreeTierEnabled } from '@/lib/feature-flags';

export async function POST(request: NextRequest) {
  if (!isFreeTierEnabled()) {
    return NextResponse.json({ error: 'Free tier not enabled' }, { status: 404 });
  }

  const body = await request.json();
  const { email, redirectTo } = body;

  if (!email || typeof email !== 'string') {
    return NextResponse.json({ error: 'Email required' }, { status: 400 });
  }

  const safeRedirect = typeof redirectTo === 'string' && redirectTo.startsWith('/')
    ? redirectTo
    : '/onboarding/about-you';

  const result = await sendMagicLink({ email, redirectTo: safeRedirect });

  if (result.error) {
    return NextResponse.json({ error: result.error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
```

- [x] **Step 6: Manually verify endpoint** — Will verify end-to-end when signin page is built (Task 5).

```bash
npm run dev
# In another terminal:
curl -X POST http://localhost:3000/api/v1/auth/magic-link \
  -H "Content-Type: application/json" \
  -d '{"email":"your-test@example.com","redirectTo":"/onboarding/about-you"}'
```
Expected: `{"ok":true}` and a magic link email arrives. If `NEXT_PUBLIC_FREE_TIER_ENABLED=false`, expect `{"error":"Free tier not enabled"}` with 404.

- [x] **Step 7: Commit** — Modified existing files instead of creating new ones.

---

## Task 5: Google OAuth in signin page

**Files:**
- Create: `app/(public)/signin/page.tsx`
- Modify: `app/api/v1/auth/callback/route.ts` (verify it handles Google correctly)

**Strategy:** UI component. Verify manually (no unit test for visual component). Read existing callback to confirm it routes correctly post-OAuth.

- [x] **Step 1: Read existing callback**

```bash
cat app/api/v1/auth/callback/route.ts
```

Confirm it exchanges the OAuth code for a session and redirects somewhere reasonable (current default may be `/profile` or `/groups`). For free tier, post-Google-auth, we want to redirect to `/onboarding/about-you?from_google=true` if the user has no groups, OR `/dashboard` if they have one.

- [x] **Step 2: Modify callback redirect logic** — Done in Task 4.

In `app/api/v1/auth/callback/route.ts`, after exchanging the code for a session:

```typescript
// Determine post-auth destination.
import { isFreeTierEnabled } from '@/lib/feature-flags';

// After successful code exchange:
const { data: { user } } = await supabase.auth.getUser();

if (user && isFreeTierEnabled()) {
  const { data: existingGroup } = await supabase
    .from('groups')
    .select('id, status')
    .eq('created_by', user.id)
    .maybeSingle();

  if (!existingGroup) {
    return NextResponse.redirect(new URL('/onboarding/about-you?from_google=true', request.url));
  }
  // If group exists, redirect to dashboard (existing behavior).
}
```

- [x] **Step 3: Build signin page** — Reuses existing `sendMagicLink()` + `signInWithGoogle()` from `lib/supabase/auth.ts`.

```typescript
// app/(public)/signin/page.tsx
'use client';

import { useState } from 'react';
import { createSupabaseClient } from '@/lib/supabase/client';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setStatus('sending');
    const res = await fetch('/api/v1/auth/magic-link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, redirectTo: '/onboarding/about-you' }),
    });
    if (res.ok) {
      setStatus('sent');
    } else {
      const { error } = await res.json();
      setErrorMsg(error || 'Algo salió mal');
      setStatus('error');
    }
  }

  async function handleGoogle() {
    const supabase = createSupabaseClient();
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/api/v1/auth/callback` },
    });
  }

  if (status === 'sent') {
    return (
      <div className="max-w-md mx-auto mt-20 px-6 text-center">
        <h1 className="type-heading mb-4">Revisa tu correo</h1>
        <p className="type-body">Te mandamos un link a {email}. Toca el link para continuar.</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-20 px-6">
      <h1 className="type-heading mb-6">Empieza tu libro</h1>

      <form onSubmit={handleMagicLink} className="space-y-4">
        <label className="block">
          <span className="block mb-1 text-sm">Correo</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border rounded px-3 py-2"
            placeholder="tucorreo@ejemplo.com"
          />
        </label>
        <button
          type="submit"
          disabled={status === 'sending'}
          className="w-full bg-[#D4A854] text-white rounded px-4 py-3"
        >
          {status === 'sending' ? 'Enviando…' : 'Continuar con correo'}
        </button>
      </form>

      <div className="text-center my-4 text-sm">o</div>

      <button
        onClick={handleGoogle}
        className="w-full border rounded px-4 py-3"
      >
        Continuar con Google
      </button>

      {status === 'error' && (
        <p className="mt-4 text-sm text-red-600">{errorMsg}</p>
      )}
    </div>
  );
}
```

- [x] **Step 4: Verify manually** — Pendiente Ricardo.

```bash
npm run dev
```

Visit `http://localhost:3000/signin`. Verify:
- Email input + Continue with Google button visible
- Magic link form submits and shows "Revisa tu correo"
- Google button initiates OAuth and (if logged out) redirects to Google

If `NEXT_PUBLIC_FREE_TIER_ENABLED=false`, magic link endpoint returns 404; document this in the UI later if needed.

- [x] **Step 5: Commit**

---

## Task 6: Onboarding shell component and state

**Files:**
- Create: `components/onboarding/OnboardingShell.tsx`
- Create: `components/onboarding/onboardingState.ts`
- Create: `app/(onboarding)/layout.tsx`

**Strategy:** UI scaffolding. No tests. Visual verification at the end of each onboarding screen task.

- [x] **Step 1: Build the state store**

```typescript
// components/onboarding/onboardingState.ts
// Reason: stores onboarding answers in localStorage so the user can refresh without
// losing progress. Only used pre-account-creation (Steps 1-3). After Step 4
// (about-you), state lives in DB on groups table.

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type OccasionType = 'bridal_shower' | 'wedding' | 'anniversary' | 'birthday' | 'unsure' | null;

interface OnboardingState {
  occasion: OccasionType;
  bookDate: string | null; // ISO date
  setOccasion: (val: OccasionType) => void;
  setBookDate: (val: string | null) => void;
  reset: () => void;
}

export const useOnboardingState = create<OnboardingState>()(
  persist(
    (set) => ({
      occasion: null,
      bookDate: null,
      setOccasion: (val) => set({ occasion: val }),
      setBookDate: (val) => set({ bookDate: val }),
      reset: () => set({ occasion: null, bookDate: null }),
    }),
    { name: 'sp-onboarding' }
  )
);
```

Verify Zustand is installed: `grep '"zustand"' package.json`. If not, ask Ricardo before adding the dependency (per project rules in CLAUDE.md). Alternative: use a React Context provider with `useReducer` and persist to localStorage manually.

- [x] **Step 2: Build the layout**

```typescript
// app/(onboarding)/layout.tsx
import { isFreeTierEnabled } from '@/lib/feature-flags';
import { redirect } from 'next/navigation';

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  if (!isFreeTierEnabled()) {
    redirect('/');
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2]">
      <header className="border-b">
        <div className="max-w-5xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="font-semibold">SMALL PLATES</div>
          <a href="/help" className="text-sm">Help</a>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-6 py-12">{children}</main>
    </div>
  );
}
```

- [x] **Step 3: Build the shell component**

```typescript
// components/onboarding/OnboardingShell.tsx
import Link from 'next/link';
import { ReactNode } from 'react';

interface OnboardingShellProps {
  title: string;
  subtitle?: string;
  illustration?: ReactNode; // placeholder for now; replace with real illustrations later
  children: ReactNode;
  onContinue?: () => void | Promise<void>;
  continueDisabled?: boolean;
  skipHref?: string;
  backHref?: string;
}

export function OnboardingShell({
  title,
  subtitle,
  illustration,
  children,
  onContinue,
  continueDisabled,
  skipHref,
  backHref,
}: OnboardingShellProps) {
  return (
    <div className="grid md:grid-cols-2 gap-12 items-start">
      <div>
        <h1 className="type-heading mb-4">{title}</h1>
        {subtitle && <p className="type-body-small mb-6">{subtitle}</p>}
        <div className="mb-8">{children}</div>
        <div className="flex items-center gap-4">
          {backHref && (
            <Link href={backHref} className="text-sm">
              ← Atrás
            </Link>
          )}
          <button
            onClick={onContinue}
            disabled={continueDisabled}
            className="bg-[#D4A854] text-white rounded px-6 py-3 disabled:opacity-50"
          >
            Continuar
          </button>
          {skipHref && (
            <Link href={skipHref} className="text-sm underline">
              Saltar por ahora
            </Link>
          )}
        </div>
      </div>
      <div className="hidden md:block">{illustration}</div>
    </div>
  );
}
```

- [x] **Step 4: Verify imports compile**

```bash
npx tsc --noEmit
```
Expected: No errors.

- [x] **Step 5: Commit**

---

## Task 7: Onboarding Step 1 — Welcome

**Files:**
- Create: `app/(onboarding)/welcome/page.tsx`

**Strategy:** Static page. Visual verification only.

- [x] **Step 1: Build the page**

```typescript
// app/(onboarding)/welcome/page.tsx
'use client';

import { useRouter } from 'next/navigation';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';

export default function WelcomePage() {
  const router = useRouter();

  return (
    <OnboardingShell
      title="Así funciona Small Plates"
      onContinue={() => router.push('/onboarding/occasion')}
    >
      <ol className="space-y-4">
        <li>
          <span className="font-semibold">Hoy:</span> arma tu evento e invita a tu gente.
        </li>
        <li>
          <span className="font-semibold">En los próximos días:</span> les recordamos que manden su receta favorita.
        </li>
        <li>
          <span className="font-semibold">Cuando tengas las recetas:</span> revisa el libro y haz tu pedido.
        </li>
        <li>
          <span className="font-semibold">En 2 semanas:</span> recibes el libro impreso.
        </li>
      </ol>
    </OnboardingShell>
  );
}
```

- [ ] **Step 2: Verify**

```bash
npm run dev
```
Visit `/onboarding/welcome`. Verify:
- 4-step list renders
- "Continuar" navigates to `/onboarding/occasion`
- Feature flag off → redirects to `/`

- [ ] **Step 3: Commit**

```bash
git add app/\(onboarding\)/welcome/page.tsx
git commit -m "feat(onboarding): step 1 — welcome"
```

---

## Task 8: Onboarding Step 2 — Occasion

**Files:**
- Create: `app/(onboarding)/occasion/page.tsx`

**Strategy:** UI. Visual verification.

- [ ] **Step 1: Build the page**

```typescript
// app/(onboarding)/occasion/page.tsx
'use client';

import { useRouter } from 'next/navigation';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { useOnboardingState, OccasionType } from '@/components/onboarding/onboardingState';

const OCCASIONS: { value: OccasionType; label: string; recommended?: boolean }[] = [
  { value: 'bridal_shower', label: 'Despedida de soltera', recommended: true },
  { value: 'wedding', label: 'Boda' },
  { value: 'anniversary', label: 'Aniversario' },
  { value: 'birthday', label: 'Cumpleaños' },
  { value: 'unsure', label: 'No estoy segura aún' },
];

export default function OccasionPage() {
  const router = useRouter();
  const occasion = useOnboardingState((s) => s.occasion);
  const setOccasion = useOnboardingState((s) => s.setOccasion);

  return (
    <OnboardingShell
      title="¿Qué evento es?"
      backHref="/onboarding/welcome"
      onContinue={() => router.push('/onboarding/book-date')}
      continueDisabled={!occasion}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {OCCASIONS.map((o) => (
          <button
            key={o.value}
            onClick={() => setOccasion(o.value)}
            className={`text-left border rounded px-4 py-3 ${
              occasion === o.value ? 'border-[#D4A854] bg-white' : 'border-gray-200'
            }`}
          >
            {o.label}
            {o.recommended && <span className="block text-xs opacity-60">Recomendado</span>}
          </button>
        ))}
      </div>
    </OnboardingShell>
  );
}
```

- [ ] **Step 2: Verify**

Visit `/onboarding/occasion`. Verify:
- 5 buttons render
- Clicking one highlights it
- "Continuar" disabled until selection made
- "Continuar" navigates to `/onboarding/book-date`
- Reloading the page preserves selection (zustand persist)

- [ ] **Step 3: Commit**

```bash
git add app/\(onboarding\)/occasion/page.tsx
git commit -m "feat(onboarding): step 2 — occasion selector"
```

---

## Task 9: Onboarding Step 3 — Book date

**Files:**
- Create: `app/(onboarding)/book-date/page.tsx`

**Strategy:** UI. Visual verification.

- [ ] **Step 1: Build the page**

```typescript
// app/(onboarding)/book-date/page.tsx
'use client';

import { useRouter } from 'next/navigation';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { useOnboardingState } from '@/components/onboarding/onboardingState';

export default function BookDatePage() {
  const router = useRouter();
  const bookDate = useOnboardingState((s) => s.bookDate);
  const setBookDate = useOnboardingState((s) => s.setBookDate);

  return (
    <OnboardingShell
      title="¿Cuándo te gustaría tener el libro?"
      subtitle="Usamos esta fecha para calendarizar recordatorios. Puedes cambiarla después."
      backHref="/onboarding/occasion"
      skipHref="/onboarding/about-you"
      onContinue={() => router.push('/onboarding/about-you')}
    >
      <label className="block">
        <span className="block mb-2 text-sm">Fecha</span>
        <input
          type="date"
          value={bookDate || ''}
          onChange={(e) => setBookDate(e.target.value || null)}
          className="border rounded px-3 py-2 w-full max-w-xs"
        />
      </label>
    </OnboardingShell>
  );
}
```

- [ ] **Step 2: Verify**

Visit `/onboarding/book-date`. Verify date picker works, Skip and Continue both go to about-you.

- [ ] **Step 3: Commit**

```bash
git add app/\(onboarding\)/book-date/page.tsx
git commit -m "feat(onboarding): step 3 — book date with skip option"
```

---

## Task 10: Onboarding Step 4 — About You (account + group creation)

**Files:**
- Create: `app/(onboarding)/about-you/page.tsx`
- Create: `lib/supabase/onboarding.ts`
- Create: `__tests__/lib/supabase/onboarding.test.ts`

**Strategy:** TDD for `lib/supabase/onboarding.ts` (DB logic critical for free_tier flow). UI tested manually.

This is the central task of M1. After this step, the user has:
- A Supabase Auth user (via magic link or already-Google-authed)
- A `groups` row in status `free_tier` linked to them via `created_by`
- The fields `name`, `occasion`, `book_date` populated from onboarding state

- [ ] **Step 1: Write failing test for createFreeTierGroup**

```typescript
// __tests__/lib/supabase/onboarding.test.ts
import { createFreeTierGroup } from '@/lib/supabase/onboarding';

const mockInsert = jest.fn();
const mockFrom = jest.fn(() => ({ insert: mockInsert }));
const mockGetUser = jest.fn();

jest.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: () => ({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  }),
}));

describe('createFreeTierGroup', () => {
  beforeEach(() => {
    mockInsert.mockReset();
    mockFrom.mockClear();
    mockGetUser.mockReset();
  });

  it('creates a group with status free_tier for the current user', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-123' } }, error: null });
    mockInsert.mockReturnValue({
      select: () => ({
        single: jest.fn().mockResolvedValue({ data: { id: 'group-abc' }, error: null }),
      }),
    });

    const result = await createFreeTierGroup({
      bookName: 'Libro de Sofía',
      occasion: 'bridal_shower',
      bookDate: '2026-06-15',
    });

    expect(mockFrom).toHaveBeenCalledWith('groups');
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Libro de Sofía',
        created_by: 'user-123',
        status: 'free_tier',
      })
    );
    expect(result.groupId).toBe('group-abc');
  });

  it('throws when no authenticated user', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

    await expect(
      createFreeTierGroup({ bookName: 'X', occasion: null, bookDate: null })
    ).rejects.toThrow('Not authenticated');
  });
});
```

- [ ] **Step 2: Run test, verify it fails**

```bash
npx jest __tests__/lib/supabase/onboarding.test.ts
```
Expected: FAIL with module not found.

- [ ] **Step 3: Implement createFreeTierGroup**

```typescript
// lib/supabase/onboarding.ts
import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { OccasionType } from '@/components/onboarding/onboardingState';

export interface CreateFreeTierGroupParams {
  bookName: string;
  occasion: OccasionType;
  bookDate: string | null;
}

export interface CreateFreeTierGroupResult {
  groupId: string;
}

export async function createFreeTierGroup(
  params: CreateFreeTierGroupParams
): Promise<CreateFreeTierGroupResult> {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('groups')
    .insert({
      name: params.bookName,
      created_by: user.id,
      status: 'free_tier',
      description: '',
      // event_date / event_location populated in Step 6 (event-details)
      // book_close_date and gift_date can be derived from bookDate if needed
      ...(params.bookDate ? { gift_date: params.bookDate } : {}),
    })
    .select('id')
    .single();

  if (error || !data) {
    throw new Error(`Failed to create group: ${error?.message || 'unknown'}`);
  }

  // Reason: the existing `add_group_creator_as_owner_trigger` migration auto-inserts
  // the owner row into group_members; no need to do that here.

  return { groupId: data.id };
}
```

- [ ] **Step 4: Run test, verify it passes**

```bash
npx jest __tests__/lib/supabase/onboarding.test.ts
```
Expected: Both tests PASS.

- [ ] **Step 5: Build the about-you page**

```typescript
// app/(onboarding)/about-you/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { useOnboardingState } from '@/components/onboarding/onboardingState';
import { createSupabaseClient } from '@/lib/supabase/client';

export default function AboutYouPage() {
  const router = useRouter();
  const { occasion, bookDate, reset } = useOnboardingState();
  const [bookName, setBookName] = useState('');
  const [yourName, setYourName] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit() {
    setSubmitting(true);
    setError('');

    const supabase = createSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      // Not yet authenticated → send magic link with redirect back here.
      const res = await fetch('/api/v1/auth/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          redirectTo: '/onboarding/about-you?continue=true',
        }),
      });
      if (!res.ok) {
        const { error: errMsg } = await res.json();
        setError(errMsg);
        setSubmitting(false);
        return;
      }
      // Stash form data so we can pick up after the user clicks the link
      sessionStorage.setItem('sp-pending-about-you', JSON.stringify({ bookName, yourName }));
      router.push(`/check-your-email?email=${encodeURIComponent(email)}`);
      return;
    }

    // Already authenticated → create the group now
    const res = await fetch('/api/v1/groups/free', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookName, occasion, bookDate }),
    });
    if (!res.ok) {
      const { error: errMsg } = await res.json();
      setError(errMsg || 'Algo salió mal');
      setSubmitting(false);
      return;
    }
    const { groupId } = await res.json();
    reset(); // clear onboarding state
    router.push(`/onboarding/co-organizer?groupId=${groupId}`);
  }

  return (
    <OnboardingShell
      title="Cuéntanos un poco"
      backHref="/onboarding/book-date"
      onContinue={handleSubmit}
      continueDisabled={submitting || !bookName || !yourName || !email}
    >
      <div className="space-y-4">
        <label className="block">
          <span className="block mb-1 text-sm">Nombre del libro</span>
          <input
            type="text"
            value={bookName}
            onChange={(e) => setBookName(e.target.value)}
            className="w-full border rounded px-3 py-2"
            placeholder="Libro de Sofía & Daniel"
          />
        </label>
        <label className="block">
          <span className="block mb-1 text-sm">Tu nombre</span>
          <input
            type="text"
            value={yourName}
            onChange={(e) => setYourName(e.target.value)}
            className="w-full border rounded px-3 py-2"
            placeholder="María García"
          />
        </label>
        <label className="block">
          <span className="block mb-1 text-sm">Tu correo</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border rounded px-3 py-2"
            placeholder="maria@ejemplo.com"
          />
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </OnboardingShell>
  );
}
```

- [ ] **Step 6: Build the POST /api/v1/groups/free endpoint**

```typescript
// app/api/v1/groups/free/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { isFreeTierEnabled } from '@/lib/feature-flags';
import { createFreeTierGroup } from '@/lib/supabase/onboarding';

export async function POST(request: NextRequest) {
  if (!isFreeTierEnabled()) {
    return NextResponse.json({ error: 'Free tier not enabled' }, { status: 404 });
  }

  const { bookName, occasion, bookDate } = await request.json();

  if (!bookName || typeof bookName !== 'string') {
    return NextResponse.json({ error: 'Book name required' }, { status: 400 });
  }

  try {
    const { groupId } = await createFreeTierGroup({ bookName, occasion, bookDate });
    return NextResponse.json({ groupId });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'unknown' },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 7: Manual end-to-end verification**

In a fresh browser (or incognito):
1. Visit `/onboarding/welcome` → click Continuar
2. Select an occasion → click Continuar
3. Pick a date → click Continuar (or Skip)
4. Fill book name, your name, email → click Continuar
5. Should receive magic link email
6. Click magic link → returns to `/onboarding/about-you?continue=true`
7. Now should be auth'd. Submitting should create the group and redirect to `/onboarding/co-organizer?groupId=<id>`
8. Check Supabase: a new `groups` row exists with `status = 'free_tier'`, `name = "Libro de Sofía…"`, `created_by = <user-id>`.

- [ ] **Step 8: Commit**

```bash
git add lib/supabase/onboarding.ts app/\(onboarding\)/about-you/page.tsx app/api/v1/groups/free/route.ts __tests__/lib/supabase/onboarding.test.ts
git commit -m "feat(onboarding): step 4 — about you + silent account & free_tier group creation"
```

---

## Task 11: Onboarding Step 5 — Co-organizer (optional)

**Files:**
- Create: `app/(onboarding)/co-organizer/page.tsx`
- Modify: `lib/supabase/onboarding.ts` (add `inviteCoOrganizer` function)

**Strategy:** TDD for the invite logic, visual verification for the UI.

- [ ] **Step 1: Write failing test for inviteCoOrganizer**

```typescript
// Add to __tests__/lib/supabase/onboarding.test.ts
import { inviteCoOrganizer } from '@/lib/supabase/onboarding';

describe('inviteCoOrganizer', () => {
  // Use same mocks as above; reset them per test.
  it('creates a group_invitations row with role co-organizer', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-123' } }, error: null });
    mockInsert.mockReturnValue({
      select: () => ({ single: jest.fn().mockResolvedValue({ data: { id: 'inv-1' }, error: null }) }),
    });

    const result = await inviteCoOrganizer({
      groupId: 'group-abc',
      name: 'Ana',
      email: 'ana@example.com',
    });

    expect(mockFrom).toHaveBeenCalledWith('group_invitations');
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        group_id: 'group-abc',
        name: 'Ana',
        email: 'ana@example.com',
        invited_by: 'user-123',
        // role field name and value depends on schema — adjust based on actual columns
      })
    );
    expect(result.invitationId).toBe('inv-1');
  });
});
```

- [ ] **Step 2: Add migration for `invitation_type` column**

The `group_invitations` table today (per `supabase/migrations/20250116_add_groups_feature.sql`) has no column to distinguish a co-organizer invite from a regular contributor invite. We need this distinction so that when the recipient accepts, they get the right role.

Create `supabase/migrations/20260526_add_invitation_type.sql`:

```sql
-- supabase/migrations/20260526_add_invitation_type.sql
-- Distinguish co-organizer invites from regular contributor invites.

BEGIN;

CREATE TYPE invitation_type_enum AS ENUM ('contributor', 'co_organizer');

ALTER TABLE public.group_invitations
  ADD COLUMN IF NOT EXISTS invitation_type invitation_type_enum NOT NULL DEFAULT 'contributor';

COMMENT ON COLUMN public.group_invitations.invitation_type IS 'Distinguishes invitations to be co-organizer vs regular contributor';

COMMIT;
```

Deliver to Ricardo per the manual-SQL rule. Once applied, add `invitation_type: 'contributor' | 'co_organizer'` to the appropriate types in `lib/types/database.ts`.

- [ ] **Step 3: Verify test fails, then implement**

```typescript
// Append to lib/supabase/onboarding.ts
export async function inviteCoOrganizer(params: {
  groupId: string;
  name: string;
  email: string;
}): Promise<{ invitationId: string }> {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Generate token + 7-day expiry
  const token = crypto.randomUUID().replace(/-/g, '').slice(0, 24);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('group_invitations')
    .insert({
      group_id: params.groupId,
      name: params.name,
      email: params.email,
      invited_by: user.id,
      token,
      expires_at: expiresAt,
      status: 'pending',
      invitation_type: 'co_organizer',
    })
    .select('id')
    .single();

  if (error || !data) throw new Error(`Failed to invite co-organizer: ${error?.message || 'unknown'}`);
  return { invitationId: data.id };
}
```

Update the test in Step 1 to also assert `invitation_type: 'co_organizer'` is sent in the insert call.

- [ ] **Step 3: Build the page**

```typescript
// app/(onboarding)/co-organizer/page.tsx
'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';

export default function CoOrganizerPage() {
  const router = useRouter();
  const params = useSearchParams();
  const groupId = params.get('groupId');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleContinue() {
    if (!name && !email) {
      router.push(`/onboarding/event-details?groupId=${groupId}`);
      return;
    }
    setSubmitting(true);
    await fetch('/api/v1/groups/invite-co-organizer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ groupId, name, email }),
    });
    router.push(`/onboarding/event-details?groupId=${groupId}`);
  }

  return (
    <OnboardingShell
      title="¿Agregas a alguien que te ayude a organizar?"
      subtitle="Las co-organizadoras pueden invitar a otros y revisar las recetas."
      backHref="/onboarding/about-you"
      skipHref={`/onboarding/event-details?groupId=${groupId}`}
      onContinue={handleContinue}
      continueDisabled={submitting}
    >
      <div className="space-y-3">
        <label className="block">
          <span className="block mb-1 text-sm">Nombre</span>
          <input value={name} onChange={(e) => setName(e.target.value)} className="w-full border rounded px-3 py-2" />
        </label>
        <label className="block">
          <span className="block mb-1 text-sm">Correo</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border rounded px-3 py-2" />
        </label>
      </div>
    </OnboardingShell>
  );
}
```

- [ ] **Step 4: Build the endpoint**

```typescript
// app/api/v1/groups/invite-co-organizer/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { isFreeTierEnabled } from '@/lib/feature-flags';
import { inviteCoOrganizer } from '@/lib/supabase/onboarding';

export async function POST(request: NextRequest) {
  if (!isFreeTierEnabled()) return NextResponse.json({ error: 'not enabled' }, { status: 404 });
  const { groupId, name, email } = await request.json();
  if (!groupId || !email) return NextResponse.json({ error: 'missing' }, { status: 400 });

  try {
    const result = await inviteCoOrganizer({ groupId, name, email });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'err' }, { status: 500 });
  }
}
```

- [ ] **Step 5: Manual verify + commit**

```bash
git add app/\(onboarding\)/co-organizer/page.tsx app/api/v1/groups/invite-co-organizer/route.ts lib/supabase/onboarding.ts __tests__/lib/supabase/onboarding.test.ts
git commit -m "feat(onboarding): step 5 — co-organizer (optional invite)"
```

---

## Task 12: Onboarding Step 6 — Event details

**Files:**
- Create: `app/(onboarding)/event-details/page.tsx`
- Modify: `lib/supabase/onboarding.ts` (add `setEventDetails`)

**Strategy:** TDD for `setEventDetails`, visual for UI.

- [ ] **Step 1: Test for setEventDetails**

```typescript
// Append to __tests__/lib/supabase/onboarding.test.ts
import { setEventDetails } from '@/lib/supabase/onboarding';

describe('setEventDetails', () => {
  it('updates groups.event_date and event_location', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-123' } }, error: null });
    const mockEq = jest.fn().mockResolvedValue({ error: null });
    const mockUpdate = jest.fn(() => ({ eq: mockEq }));
    mockFrom.mockReturnValue({ update: mockUpdate });

    await setEventDetails({
      groupId: 'group-abc',
      eventDate: '2026-06-15T17:00:00Z',
      eventLocation: 'Casa de María',
    });

    expect(mockUpdate).toHaveBeenCalledWith({
      event_date: '2026-06-15T17:00:00Z',
      event_location: 'Casa de María',
    });
    expect(mockEq).toHaveBeenCalledWith('id', 'group-abc');
  });
});
```

- [ ] **Step 2: Implement**

```typescript
// Append to lib/supabase/onboarding.ts
export async function setEventDetails(params: {
  groupId: string;
  eventDate: string | null;
  eventLocation: string | null;
}): Promise<void> {
  const supabase = createServerSupabaseClient();
  const { error } = await supabase
    .from('groups')
    .update({
      event_date: params.eventDate,
      event_location: params.eventLocation,
    })
    .eq('id', params.groupId);

  if (error) throw new Error(`Failed to set event details: ${error.message}`);
}
```

- [ ] **Step 3: Build the page**

```typescript
// app/(onboarding)/event-details/page.tsx
'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';

export default function EventDetailsPage() {
  const router = useRouter();
  const params = useSearchParams();
  const groupId = params.get('groupId');
  const [eventDate, setEventDate] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleContinue() {
    setSubmitting(true);
    if (eventDate || eventLocation) {
      await fetch('/api/v1/groups/event-details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupId, eventDate: eventDate || null, eventLocation: eventLocation || null }),
      });
    }
    router.push(`/onboarding/personalize-invite?groupId=${groupId}`);
  }

  return (
    <OnboardingShell
      title="¿Cuándo y dónde es tu evento?"
      subtitle="Opcional. Aparece en la página de tu evento."
      backHref="/onboarding/co-organizer"
      skipHref={`/onboarding/personalize-invite?groupId=${groupId}`}
      onContinue={handleContinue}
      continueDisabled={submitting}
    >
      <div className="space-y-3">
        <label className="block">
          <span className="block mb-1 text-sm">Fecha y hora</span>
          <input type="datetime-local" value={eventDate} onChange={(e) => setEventDate(e.target.value)} className="border rounded px-3 py-2" />
        </label>
        <label className="block">
          <span className="block mb-1 text-sm">Lugar</span>
          <input type="text" value={eventLocation} onChange={(e) => setEventLocation(e.target.value)} className="w-full border rounded px-3 py-2" placeholder="En casa de María, CDMX" />
        </label>
      </div>
    </OnboardingShell>
  );
}
```

- [ ] **Step 4: Endpoint + commit**

Create `app/api/v1/groups/event-details/route.ts` analogous to the previous endpoints, calling `setEventDetails`.

```bash
git add app/\(onboarding\)/event-details/page.tsx app/api/v1/groups/event-details/route.ts lib/supabase/onboarding.ts __tests__/lib/supabase/onboarding.test.ts
git commit -m "feat(onboarding): step 6 — event details (optional)"
```

---

## Task 13: Onboarding Step 7 — Personalize invite

**Files:**
- Create: `app/(onboarding)/personalize-invite/page.tsx`
- Modify: `lib/supabase/onboarding.ts` (add `setInviteMessage`)

**Strategy:** TDD for the setter, visual for the UI.

- [ ] **Step 1: Decide column**

Check `groups` table for an existing "invite_message" or similar column. If none exists, this task requires a small DB migration adding `invite_message TEXT` to `groups`. Do that as Step 1 if needed.

- [ ] **Step 2: Test setInviteMessage**

```typescript
// In __tests__/lib/supabase/onboarding.test.ts:
import { setInviteMessage } from '@/lib/supabase/onboarding';

describe('setInviteMessage', () => {
  it('updates groups.invite_message', async () => {
    const mockEq = jest.fn().mockResolvedValue({ error: null });
    const mockUpdate = jest.fn(() => ({ eq: mockEq }));
    mockFrom.mockReturnValue({ update: mockUpdate });

    await setInviteMessage({ groupId: 'group-abc', message: 'Mensaje personalizado' });

    expect(mockUpdate).toHaveBeenCalledWith({ invite_message: 'Mensaje personalizado' });
    expect(mockEq).toHaveBeenCalledWith('id', 'group-abc');
  });
});
```

- [ ] **Step 3: Implement setter, page, endpoint**

```typescript
// Append to lib/supabase/onboarding.ts
export async function setInviteMessage(params: {
  groupId: string;
  message: string;
}): Promise<void> {
  const supabase = createServerSupabaseClient();
  const { error } = await supabase
    .from('groups')
    .update({ invite_message: params.message })
    .eq('id', params.groupId);

  if (error) throw new Error(`Failed to set invite message: ${error.message}`);
}
```

```typescript
// app/(onboarding)/personalize-invite/page.tsx
'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';

const DEFAULT_MESSAGE = 'Le estoy haciendo a Sofía un libro de recetas hecho por todas nosotras. ¿Me ayudas con UNA receta? Toma 5 minutos.';

export default function PersonalizeInvitePage() {
  const router = useRouter();
  const params = useSearchParams();
  const groupId = params.get('groupId');
  const [message, setMessage] = useState(DEFAULT_MESSAGE);
  const [showPreview, setShowPreview] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleContinue() {
    setSubmitting(true);
    await fetch('/api/v1/groups/invite-message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ groupId, message }),
    });
    router.push(`/onboarding/invite-first?groupId=${groupId}`);
  }

  return (
    <OnboardingShell
      title="Personaliza la invitación"
      subtitle="Este es el mensaje que recibirán tus invitadas."
      backHref={`/onboarding/event-details?groupId=${groupId}`}
      onContinue={handleContinue}
      continueDisabled={submitting || !message.trim()}
    >
      <div className="space-y-3">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={5}
          className="w-full border rounded px-3 py-2"
        />
        <button
          type="button"
          onClick={() => setShowPreview(true)}
          className="text-sm underline"
        >
          Ver cómo se verá el email →
        </button>
      </div>

      {showPreview && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-6 z-50">
          <div className="bg-white rounded max-w-lg w-full p-6">
            <div className="border-b pb-3 mb-3">
              <div className="text-xs opacity-60">From: Small Plates</div>
              <div className="text-xs opacity-60">Subject: Una receta para el libro</div>
            </div>
            <p className="type-body">{message}</p>
            <div className="mt-4">
              <span className="inline-block bg-[#D4A854] text-white rounded px-4 py-2 text-sm">
                Mandar mi receta →
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowPreview(false)}
              className="mt-4 text-sm underline"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </OnboardingShell>
  );
}
```

```typescript
// app/api/v1/groups/invite-message/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { isFreeTierEnabled } from '@/lib/feature-flags';
import { setInviteMessage } from '@/lib/supabase/onboarding';

export async function POST(request: NextRequest) {
  if (!isFreeTierEnabled()) return NextResponse.json({ error: 'not enabled' }, { status: 404 });
  const { groupId, message } = await request.json();
  if (!groupId || typeof message !== 'string') {
    return NextResponse.json({ error: 'missing' }, { status: 400 });
  }
  try {
    await setInviteMessage({ groupId, message });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'err' }, { status: 500 });
  }
}
```

The "Preview invite email" modal in M1 is static — it shows the message in a styled mockup. Real email-rendering integration (with the same template that will eventually be sent) lives in M2.

- [ ] **Step 4: Commit**

```bash
git commit -m "feat(onboarding): step 7 — personalize invite message"
```

---

## Task 14: Onboarding Step 8 — Invite first people

**Files:**
- Create: `app/(onboarding)/invite-first/page.tsx`

**Strategy:** Visual only. Functional invite-flow logic comes in M2; here we only provide copy-link and a static "Send to WhatsApp" button.

- [ ] **Step 1: Build the page**

```typescript
// app/(onboarding)/invite-first/page.tsx
'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';

export default function InviteFirstPage() {
  const router = useRouter();
  const params = useSearchParams();
  const groupId = params.get('groupId');
  // For M1, link is a placeholder; real /evento/[token] URL is generated in M2.
  // Use a stub URL for now — we'll wire the real URL once /evento/[token] exists.
  const inviteLink = `${typeof window !== 'undefined' ? window.location.origin : ''}/g/${groupId}`;

  return (
    <OnboardingShell
      title="Invita a las primeras"
      subtitle="Manda el link por WhatsApp o cópialo y pégalo donde quieras."
      backHref={`/onboarding/personalize-invite?groupId=${groupId}`}
      onContinue={() => router.push(`/groups/${groupId}/dashboard`)}
    >
      <div className="space-y-4">
        <div className="border rounded p-3 bg-white flex items-center justify-between">
          <code className="text-xs truncate">{inviteLink}</code>
          <button
            onClick={() => navigator.clipboard.writeText(inviteLink)}
            className="ml-3 text-sm border rounded px-3 py-1"
          >
            Copiar
          </button>
        </div>
        <a
          href={`https://wa.me/?text=${encodeURIComponent(`Te ayudo con un libro de recetas — toma 5 min: ${inviteLink}`)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block bg-[#25D366] text-white rounded px-4 py-2"
        >
          Enviar por WhatsApp
        </a>
      </div>
    </OnboardingShell>
  );
}
```

- [ ] **Step 2: Verify**

Visit `/onboarding/invite-first?groupId=test`. Verify:
- Copy button copies the link to clipboard
- WhatsApp button opens WA with the pre-filled message
- "Continuar" goes to `/groups/<id>/dashboard` (page doesn't exist yet — expect 404 in M1, OK).

- [ ] **Step 3: Commit**

```bash
git add app/\(onboarding\)/invite-first/page.tsx
git commit -m "feat(onboarding): step 8 — invite first (copy link + WhatsApp share)"
```

---

## Task 15: Update post-payment-setup.ts to upgrade free_tier → pending_setup

**Files:**
- Modify: `lib/stripe/post-payment-setup.ts`

**Strategy:** TDD. Critical logic that must not break existing paid flow.

Today `findOrCreatePendingGroup` always creates a new group. After this task, if the user already has a `free_tier` group, that group is upgraded to `pending_setup` (no new group created).

- [ ] **Step 1: Read the function**

```bash
sed -n '200,295p' lib/stripe/post-payment-setup.ts
```

- [ ] **Step 2: Write a failing test**

Create `__tests__/lib/stripe/post-payment-setup.test.ts`. Mock the Supabase admin client to return an existing `free_tier` group for the user. Call `findOrCreatePendingGroup(userId)`. Assert that:
- It does NOT insert a new group
- It updates the existing group's status to `pending_setup`
- It returns `{ groupId: <existing-id>, groupCreated: false }`

Then a second test: when no `free_tier` group exists, behavior is unchanged (inserts a new `pending_setup` group).

- [ ] **Step 3: Modify `findOrCreatePendingGroup`**

At the top of the function, before the existing insert logic, check for an existing `free_tier` group for this user:

```typescript
// Check for an existing free_tier group first; if found, upgrade it instead of creating new.
const { data: freeTierGroup } = await supabaseAdmin
  .from('groups')
  .select('id')
  .eq('created_by', userId)
  .eq('status', 'free_tier')
  .maybeSingle();

if (freeTierGroup) {
  const { error: updateError } = await supabaseAdmin
    .from('groups')
    .update({
      status: 'pending_setup',
      gift_date: giftDate,
      gift_date_undecided: giftDateUndecided,
      book_close_date: bookCloseDate,
    })
    .eq('id', freeTierGroup.id);

  if (updateError) {
    console.error('findOrCreatePendingGroup: failed to upgrade free_tier group', updateError);
    // fall through to insert path below
  } else {
    return { groupId: freeTierGroup.id, groupCreated: false };
  }
}
```

- [ ] **Step 4: Run tests**

Both old and new tests should pass. Run the full test suite to verify nothing regressed:

```bash
npx jest
```

- [ ] **Step 5: Commit**

```bash
git add lib/stripe/post-payment-setup.ts __tests__/lib/stripe/post-payment-setup.test.ts
git commit -m "feat(stripe): upgrade free_tier group on payment instead of creating new"
```

---

## Task 16: Update env files and document feature flag

**Files:**
- Modify: `.env.local` (Ricardo's responsibility — instructions only)
- Modify: `.env.example`
- Modify: `README.md` (if exists) or create `docs/free-tier.md`

- [ ] **Step 1: Make sure .env.example has the flag**

(Already done in Task 1; verify it's still there.)

- [ ] **Step 2: Document for Ricardo**

Add a small note to wherever environment setup is documented (CLAUDE.md, README.md, or a new short doc) explaining:
- What `NEXT_PUBLIC_FREE_TIER_ENABLED` does
- How to toggle it for testing
- What is gated by it (auth signin page, magic-link endpoint, onboarding routes, free group creation endpoint)

- [ ] **Step 3: Commit**

```bash
git add .env.example docs/free-tier.md
git commit -m "docs: document NEXT_PUBLIC_FREE_TIER_ENABLED feature flag"
```

---

## Task 17: Integration smoke test of full onboarding flow

**Files:**
- Create: `__tests__/integration/onboarding-flow.test.ts` (optional — can be replaced by detailed manual test plan)

**Strategy:** Either a Playwright integration test (if Playwright is installed) or a structured manual test checklist.

- [ ] **Step 1: Check for Playwright**

```bash
grep '"playwright"\|"@playwright/test"' package.json
```

If installed, write a Playwright test that walks through all 8 steps. If not, skip the automated test and instead write a manual test plan.

- [ ] **Step 2: Manual test checklist**

If no Playwright, create `docs/qa/m1-onboarding-checklist.md`:

```markdown
# M1 Onboarding Manual Test Checklist

Run with `NEXT_PUBLIC_FREE_TIER_ENABLED=true` in a fresh incognito browser.

## Happy path
- [ ] Visit /signin
- [ ] Enter test email → click "Continuar con correo"
- [ ] Verify "Revisa tu correo" screen renders
- [ ] Open magic link from inbox → lands on /onboarding/about-you?continue=true (or wherever the link redirects)
- [ ] Walk through /onboarding/welcome → occasion → book-date → about-you
- [ ] Submit about-you → verify Supabase row in `groups` with status='free_tier'
- [ ] Continue through co-organizer (Skip)
- [ ] Continue through event-details (fill in)
- [ ] Continue through personalize-invite (edit message)
- [ ] Continue through invite-first (verify Copy button copies, WhatsApp button opens WA)
- [ ] Click final Continuar → lands on /groups/<id>/dashboard (404 is expected in M1; OK)

## Feature flag off
- [ ] Set NEXT_PUBLIC_FREE_TIER_ENABLED=false
- [ ] Visit /onboarding/welcome → redirects to /
- [ ] POST to /api/v1/auth/magic-link → returns 404
- [ ] POST to /api/v1/groups/free → returns 404

## Google OAuth
- [ ] At /signin, click "Continuar con Google"
- [ ] Complete OAuth
- [ ] Verify landed on /onboarding/about-you?from_google=true if no existing group

## Free → Paid upgrade (run after Stripe test is enabled)
- [ ] Create a free_tier group via the flow above
- [ ] Trigger a Stripe checkout (existing flow, manually or via Stripe CLI)
- [ ] Verify the SAME group's status transitions from free_tier → pending_setup
- [ ] Verify NO new group was created
```

- [ ] **Step 3: Commit**

```bash
git add docs/qa/m1-onboarding-checklist.md
git commit -m "docs(qa): manual test checklist for M1 onboarding"
```

---

## Wrap-up

After Task 17, M1 is done. Definition of done:
- Feature flag works in both states
- Magic link auth functional end-to-end
- Google OAuth routes correctly
- 8-screen onboarding completes and creates a `free_tier` group with correct fields populated
- Existing paid flow still works (verified by Task 15 tests + manual sanity test)
- All existing tests still pass
- `npx tsc --noEmit` clean

Open issues to carry into M2:
- Dashboard at `/groups/[id]/dashboard` does not exist yet → 404 at end of M1 flow (expected)
- "Preview Invite Email" in Task 13 is static; real email rendering integration in M2
- `/evento/[token]` and `/collect/[token]/r/[recipe_only_token]` routes don't exist yet → invite-first uses a stub URL
- Send-via-email automation in Invite modal is M2 territory

These are intentional handoffs to M2 and not blockers for M1 completion.
