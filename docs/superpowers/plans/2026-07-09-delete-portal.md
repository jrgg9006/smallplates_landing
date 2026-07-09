# Delete Portal — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Portal admin `/admin/delete` para borrar profiles, books, guests y recipes con papelera física (`deleted_items`), preview de cascada y protecciones duras.

**Architecture:** Snapshot JSONB de la cascada completa → archivo en `deleted_items` → DELETE real (cascadas FK atómicas). Restore re-inserta padres-primero con detección de conflictos. Lógica pura en `lib/admin/deletion/` (testeable), I/O en rutas API admin, UI en tabs.

**Tech Stack:** Next.js 14 App Router, TypeScript strict, Supabase service-role client, Jest.

**Spec:** `docs/superpowers/specs/2026-07-09-delete-portal-design.md` — leerla antes de empezar.

## Global Constraints

- NUNCA ejecutar INSERT/UPDATE/DELETE/DDL en Supabase directamente: todo SQL se entrega en bloque a Ricardo para que lo corra manualmente y confirme (regla del proyecto).
- No `any` types. Archivos < 300 líneas. Sin console.logs nuevos en producción.
- Admin/dashboard UI puede usar Tailwind crudo (excepción del sistema tipográfico — esto es admin).
- No verificar UI con Playwright/headless: pedir screenshot a Ricardo.
- `npx tsc --noEmit` al final de cada task con cambios TS (no después de cada edit).
- Rutas admin: `requireAdminAuth()` de `@/lib/auth/admin` + `createSupabaseAdminClient()` de `@/lib/supabase/admin`.
- Purga definitiva solo si `protection.purgeAllowed` (owner TEST + cero orders pagadas), guardado en el snapshot al momento del trash.

---

### Task 1: Migración DB — `deleted_items`, comments, `guest_recipes.deleted_by`

**Files:**
- Create: `supabase/migrations/20260709000000_delete_portal.sql`
- Modify: `lib/types/database.ts` (agregar tipos)

**Interfaces:**
- Produces: tabla `deleted_items` en Supabase; tipos `DeletedItemRow`, `DeletedItemInsert` en database.ts; columna `guest_recipes.deleted_by`.

- [ ] **Step 1: Escribir la migración**

```sql
-- supabase/migrations/20260709000000_delete_portal.sql
-- Delete Portal: papelera física (capa 2) + semántica capa 1

create table public.deleted_items (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type in ('profile','group','guest','recipe')),
  entity_id uuid not null,
  entity_label text not null,
  payload jsonb,
  counts jsonb not null default '{}'::jsonb,
  status text not null default 'trashed' check (status in ('trashed','restored','purged')),
  deleted_by uuid references public.profiles(id) on delete set null,
  deleted_at timestamptz not null default now(),
  restored_at timestamptz,
  purged_at timestamptz
);

-- RLS sin policies a propósito: solo el service role (rutas admin) puede tocarla
alter table public.deleted_items enable row level security;

create index deleted_items_status_idx on public.deleted_items (status, deleted_at desc);

comment on table public.deleted_items is
  'Admin trash (Delete Portal): snapshot JSONB completo de entidades borradas físicamente. Capa 2. Solo service-role.';

-- Capa 1: audit de quién quita recetas del producto
alter table public.guest_recipes
  add column deleted_by uuid references public.profiles(id) on delete set null;

-- Capa 1: comentarios de semántica (matan la ambigüedad sin renombrar)
comment on column public.guest_recipes.deleted_at is
  'Product-level soft delete: receta oculta del libro. La escribe el dueño (dashboard) o el admin (Operations archive). NO es la papelera admin (deleted_items).';
comment on column public.guest_recipes.deleted_by is
  'Quién puso deleted_at (dueño o admin). Audit agregado jul 2026.';
comment on column public.guests.is_archived is
  'Product-level: guest oculto de la lista del dueño. Reversible en producto. NO es la papelera admin.';
comment on column public.profiles.deleted_at is
  'Cuenta desactivada: admin soft delete o auto-borrado del usuario (users/me/delete). NO es la papelera admin (deleted_items).';
comment on column public.group_recipes.removed_at is
  'Audit product-level: receta quitada de un grupo. NO es la papelera admin.';
```

- [ ] **Step 2: Entregar el SQL a Ricardo en bloque y ESPERAR confirmación**

Pegar el SQL completo en el chat y pedir que lo corra en el SQL editor de Supabase. NO usar apply_migration/execute_sql. No continuar hasta que confirme que corrió OK.

- [ ] **Step 3: Agregar tipos a `lib/types/database.ts`**

Dentro del objeto `Tables` (orden alfabético aproximado, junto a las demás tablas), agregar:

```typescript
      deleted_items: {
        Row: {
          id: string;
          entity_type: 'profile' | 'group' | 'guest' | 'recipe';
          entity_id: string;
          entity_label: string;
          payload: Json | null;
          counts: Json;
          status: 'trashed' | 'restored' | 'purged';
          deleted_by: string | null;
          deleted_at: string;
          restored_at: string | null;
          purged_at: string | null;
        };
        Insert: {
          id?: string;
          entity_type: 'profile' | 'group' | 'guest' | 'recipe';
          entity_id: string;
          entity_label: string;
          payload?: Json | null;
          counts?: Json;
          status?: 'trashed' | 'restored' | 'purged';
          deleted_by?: string | null;
          deleted_at?: string;
          restored_at?: string | null;
          purged_at?: string | null;
        };
        Update: {
          payload?: Json | null;
          status?: 'trashed' | 'restored' | 'purged';
          restored_at?: string | null;
          purged_at?: string | null;
        };
      };
```

Y en `guest_recipes` Row/Insert/Update agregar `deleted_by: string | null;` (opcional en Insert/Update), con comentario:

```typescript
          // Reason: capa 1 (product-level). deleted_at = receta oculta del libro
          // (dueño o admin). La papelera admin es deleted_items (capa 2).
          deleted_by: string | null;
```

- [ ] **Step 4: Verificar y commitear**

Run: `npx tsc --noEmit` — Expected: sin errores.

```bash
git add supabase/migrations/20260709000000_delete_portal.sql lib/types/database.ts
git commit -m "feat(delete-portal): tabla deleted_items + semantica capa 1 (comments, deleted_by)"
```

---

### Task 2: Tipos + helpers puros (`order.ts`) con TDD

**Files:**
- Create: `lib/admin/deletion/types.ts`
- Create: `lib/admin/deletion/order.ts`
- Test: `lib/admin/deletion/order.test.ts`

**Interfaces:**
- Produces:
  - `type DeletableEntity = 'profile' | 'group' | 'guest' | 'recipe'`
  - `type SnapshotTables = Record<string, Record<string, unknown>[]>`
  - `interface Protection { blocked: boolean; reasons: string[]; warnings: string[]; purgeAllowed: boolean }`
  - `interface DeletionSnapshot { entityType: DeletableEntity; entityId: string; entityLabel: string; tables: SnapshotTables; counts: Record<string, number>; protection: Protection }`
  - `RESTORE_ORDER: readonly string[]` (padres primero)
  - `buildCounts(tables: SnapshotTables): Record<string, number>`
  - `mergeTables(a: SnapshotTables, b: SnapshotTables): SnapshotTables` (dedupe por id o clave compuesta)
  - `rowKey(row: Record<string, unknown>): string`

- [ ] **Step 1: Escribir `types.ts`**

```typescript
// lib/admin/deletion/types.ts
export type DeletableEntity = 'profile' | 'group' | 'guest' | 'recipe';

export type SnapshotTables = Record<string, Record<string, unknown>[]>;

export interface Protection {
  blocked: boolean;
  reasons: string[];
  warnings: string[];
  purgeAllowed: boolean;
}

export interface DeletionSnapshot {
  entityType: DeletableEntity;
  entityId: string;
  entityLabel: string;
  tables: SnapshotTables;
  counts: Record<string, number>;
  protection: Protection;
}

export interface RestorePlan {
  inserts: { table: string; rows: Record<string, unknown>[] }[];
  conflicts: { table: string; ids: string[] }[];
}
```

- [ ] **Step 2: Escribir el test que falla**

```typescript
// lib/admin/deletion/order.test.ts
import { RESTORE_ORDER, buildCounts, mergeTables, rowKey } from './order';

describe('RESTORE_ORDER', () => {
  it('inserta padres antes que hijos', () => {
    const idx = (t: string) => RESTORE_ORDER.indexOf(t);
    expect(idx('profiles')).toBeLessThan(idx('groups'));
    expect(idx('groups')).toBeLessThan(idx('guests'));
    expect(idx('guests')).toBeLessThan(idx('guest_recipes'));
    expect(idx('groups')).toBeLessThan(idx('cookbooks'));
    expect(idx('cookbooks')).toBeLessThan(idx('cookbook_recipes'));
    expect(idx('guest_recipes')).toBeLessThan(idx('cookbook_recipes'));
    expect(idx('guest_recipes')).toBeLessThan(idx('recipe_print_ready'));
  });
});

describe('buildCounts', () => {
  it('cuenta filas por tabla, omitiendo tablas vacías', () => {
    expect(buildCounts({ guests: [{ id: 'a' }, { id: 'b' }], orders: [] }))
      .toEqual({ guests: 2 });
  });
});

describe('mergeTables', () => {
  it('concatena y dedupea por id', () => {
    const merged = mergeTables(
      { guests: [{ id: 'a' }] },
      { guests: [{ id: 'a' }, { id: 'b' }], groups: [{ id: 'g1' }] }
    );
    expect(merged.guests).toHaveLength(2);
    expect(merged.groups).toHaveLength(1);
  });

  it('dedupea filas sin id por clave compuesta', () => {
    const row = { group_id: 'g', profile_id: 'p' };
    const merged = mergeTables({ group_members: [row] }, { group_members: [{ ...row }] });
    expect(merged.group_members).toHaveLength(1);
  });
});

describe('rowKey', () => {
  it('usa id si existe, si no una clave compuesta estable', () => {
    expect(rowKey({ id: 'x', group_id: 'g' })).toBe('x');
    expect(rowKey({ group_id: 'g', profile_id: 'p' }))
      .toBe(rowKey({ profile_id: 'p', group_id: 'g' }));
  });
});
```

- [ ] **Step 3: Correr el test — debe fallar**

Run: `npx jest lib/admin/deletion/order.test.ts`
Expected: FAIL — "Cannot find module './order'"

- [ ] **Step 4: Implementar `order.ts`**

```typescript
// lib/admin/deletion/order.ts
import type { SnapshotTables } from './types';

// Reason: orden de re-inserción padres-primero según el mapa FK verificado
// en la spec (docs/superpowers/specs/2026-07-09-delete-portal-design.md)
export const RESTORE_ORDER = [
  'profiles',
  'groups',
  'guests',
  'cookbooks',
  'guest_recipes',
  'group_members',
  'group_invitations',
  'group_recipes',
  'cookbook_recipes',
  'communication_log',
  'book_qa_reviews',
  'recipe_annex_images',
  'recipe_edit_history',
  'recipe_print_ready',
  'recipe_production_status',
  'image_processing_queue',
  'midjourney_prompts',
  'prompt_evaluations',
] as const;

export function rowKey(row: Record<string, unknown>): string {
  if (typeof row.id === 'string') return row.id;
  // Reason: tablas junction sin id (ej. group_members) — clave compuesta estable
  return Object.keys(row)
    .filter((k) => k.endsWith('_id'))
    .sort()
    .map((k) => `${k}=${String(row[k])}`)
    .join('|');
}

export function buildCounts(tables: SnapshotTables): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const [table, rows] of Object.entries(tables)) {
    if (rows.length > 0) counts[table] = rows.length;
  }
  return counts;
}

export function mergeTables(a: SnapshotTables, b: SnapshotTables): SnapshotTables {
  const merged: SnapshotTables = {};
  for (const table of new Set([...Object.keys(a), ...Object.keys(b)])) {
    const seen = new Set<string>();
    const rows: Record<string, unknown>[] = [];
    for (const row of [...(a[table] || []), ...(b[table] || [])]) {
      const key = rowKey(row);
      if (!seen.has(key)) {
        seen.add(key);
        rows.push(row);
      }
    }
    merged[table] = rows;
  }
  return merged;
}
```

- [ ] **Step 5: Correr el test — debe pasar**

Run: `npx jest lib/admin/deletion/order.test.ts`
Expected: PASS (6 tests)

- [ ] **Step 6: Commit**

```bash
git add lib/admin/deletion/types.ts lib/admin/deletion/order.ts lib/admin/deletion/order.test.ts
git commit -m "feat(delete-portal): tipos + RESTORE_ORDER + merge/counts helpers (TDD)"
```

---

### Task 3: Protecciones puras (`protection.ts`) con TDD

**Files:**
- Create: `lib/admin/deletion/protection.ts`
- Test: `lib/admin/deletion/protection.test.ts`

**Interfaces:**
- Consumes: `Protection`, `DeletableEntity` de `./types`
- Produces: `evaluateProtection(input: ProtectionInput): Protection` donde:

```typescript
export interface ProtectionInput {
  entityType: DeletableEntity;
  orderCount: number;        // cualquier order bloquea (FK NO ACTION)
  paidOrderCount: number;    // pagado = purga jamás
  shippingCount: number;     // solo group: FK NO ACTION
  qaReviewCount: number;     // solo profile: FK NO ACTION en created_by
  isTestOwner: boolean;      // profiles.is_test_account del dueño
  otherMemberCount: number;  // members ajenos en grupos afectados
}
```

- [ ] **Step 1: Escribir el test que falla**

```typescript
// lib/admin/deletion/protection.test.ts
import { evaluateProtection } from './protection';

const base = {
  entityType: 'group' as const,
  orderCount: 0,
  paidOrderCount: 0,
  shippingCount: 0,
  qaReviewCount: 0,
  isTestOwner: true,
  otherMemberCount: 0,
};

describe('evaluateProtection', () => {
  it('sin nada raro: no bloqueado, purga permitida si owner es test', () => {
    const p = evaluateProtection(base);
    expect(p.blocked).toBe(false);
    expect(p.purgeAllowed).toBe(true);
  });

  it('orders bloquean el trash (FK NO ACTION)', () => {
    const p = evaluateProtection({ ...base, orderCount: 2, paidOrderCount: 2 });
    expect(p.blocked).toBe(true);
    expect(p.reasons.join(' ')).toContain('order');
  });

  it('shipping addresses bloquean el trash de un group', () => {
    const p = evaluateProtection({ ...base, shippingCount: 1 });
    expect(p.blocked).toBe(true);
  });

  it('qa reviews bloquean el trash de un profile', () => {
    const p = evaluateProtection({ ...base, entityType: 'profile', qaReviewCount: 1 });
    expect(p.blocked).toBe(true);
  });

  it('owner no-test: trash OK pero purga NO', () => {
    const p = evaluateProtection({ ...base, isTestOwner: false });
    expect(p.blocked).toBe(false);
    expect(p.purgeAllowed).toBe(false);
  });

  it('pagado = purga jamás, aunque sea test', () => {
    // Reason: no debería llegar a papelera con orders (blocked), pero la regla
    // "pagado > test flag" se evalúa igual por si el snapshot es viejo
    const p = evaluateProtection({ ...base, paidOrderCount: 1, orderCount: 0 });
    expect(p.purgeAllowed).toBe(false);
  });

  it('members ajenos generan warning, no bloqueo', () => {
    const p = evaluateProtection({ ...base, entityType: 'profile', otherMemberCount: 1 });
    expect(p.blocked).toBe(false);
    expect(p.warnings.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Correr — debe fallar**

Run: `npx jest lib/admin/deletion/protection.test.ts`
Expected: FAIL — "Cannot find module './protection'"

- [ ] **Step 3: Implementar**

```typescript
// lib/admin/deletion/protection.ts
import type { DeletableEntity, Protection } from './types';

export interface ProtectionInput {
  entityType: DeletableEntity;
  orderCount: number;
  paidOrderCount: number;
  shippingCount: number;
  qaReviewCount: number;
  isTestOwner: boolean;
  otherMemberCount: number;
}

export function evaluateProtection(input: ProtectionInput): Protection {
  const reasons: string[] = [];
  const warnings: string[] = [];

  if (input.orderCount > 0) {
    reasons.push(`Tiene ${input.orderCount} order(s) — la base bloquea el borrado (FK NO ACTION)`);
  }
  if (input.shippingCount > 0) {
    reasons.push(`Tiene ${input.shippingCount} shipping address(es) — la base bloquea el borrado`);
  }
  if (input.entityType === 'profile' && input.qaReviewCount > 0) {
    reasons.push(`Creó ${input.qaReviewCount} QA review(s) — la base bloquea el borrado`);
  }
  if (input.otherMemberCount > 0) {
    warnings.push(
      `Hay ${input.otherMemberCount} miembro(s) ajeno(s) en grupos afectados — elige transferir o borrar completo`
    );
  }

  return {
    blocked: reasons.length > 0,
    reasons,
    warnings,
    // Reason: pagado > test flag (regla de la spec). Purga solo TEST y sin pagos.
    purgeAllowed: input.isTestOwner && input.paidOrderCount === 0,
  };
}
```

- [ ] **Step 4: Correr — debe pasar**

Run: `npx jest lib/admin/deletion/protection.test.ts`
Expected: PASS (7 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/admin/deletion/protection.ts lib/admin/deletion/protection.test.ts
git commit -m "feat(delete-portal): evaluateProtection — reglas pagado/test/FK (TDD)"
```

---

### Task 4: Plan de restore puro (`restore-plan.ts`) con TDD

**Files:**
- Create: `lib/admin/deletion/restore-plan.ts`
- Test: `lib/admin/deletion/restore-plan.test.ts`

**Interfaces:**
- Consumes: `SnapshotTables`, `RestorePlan` de `./types`; `RESTORE_ORDER`, `rowKey` de `./order`
- Produces: `planRestore(tables: SnapshotTables, existingIds: Record<string, Set<string>>): RestorePlan` — ordena inserts padres-primero y separa conflictos (ids que ya existen vivos, se omiten).

- [ ] **Step 1: Test que falla**

```typescript
// lib/admin/deletion/restore-plan.test.ts
import { planRestore } from './restore-plan';

describe('planRestore', () => {
  const tables = {
    guest_recipes: [{ id: 'r1' }, { id: 'r2' }],
    groups: [{ id: 'g1' }],
    recipe_print_ready: [{ id: 'pr1', recipe_id: 'r1' }],
  };

  it('ordena los inserts padres-primero', () => {
    const plan = planRestore(tables, {});
    const order = plan.inserts.map((i) => i.table);
    expect(order.indexOf('groups')).toBeLessThan(order.indexOf('guest_recipes'));
    expect(order.indexOf('guest_recipes')).toBeLessThan(order.indexOf('recipe_print_ready'));
  });

  it('separa conflictos y no los incluye en inserts', () => {
    const plan = planRestore(tables, { guest_recipes: new Set(['r1']) });
    const recipes = plan.inserts.find((i) => i.table === 'guest_recipes');
    expect(recipes?.rows.map((r) => r.id)).toEqual(['r2']);
    expect(plan.conflicts).toEqual([{ table: 'guest_recipes', ids: ['r1'] }]);
  });

  it('omite tablas vacías y desconocidas sin romper', () => {
    const plan = planRestore({ unknown_table: [{ id: 'x' }], orders: [] }, {});
    expect(plan.inserts.find((i) => i.table === 'orders')).toBeUndefined();
    // Reason: tabla fuera de RESTORE_ORDER se inserta al final, no se pierde
    expect(plan.inserts.find((i) => i.table === 'unknown_table')).toBeDefined();
  });
});
```

- [ ] **Step 2: Correr — debe fallar**

Run: `npx jest lib/admin/deletion/restore-plan.test.ts`
Expected: FAIL — "Cannot find module './restore-plan'"

- [ ] **Step 3: Implementar**

```typescript
// lib/admin/deletion/restore-plan.ts
import type { RestorePlan, SnapshotTables } from './types';
import { RESTORE_ORDER, rowKey } from './order';

export function planRestore(
  tables: SnapshotTables,
  existingIds: Record<string, Set<string>>
): RestorePlan {
  const known = tables ? Object.keys(tables) : [];
  // Reason: tablas fuera de RESTORE_ORDER (futuras) van al final en vez de perderse
  const ordered = [
    ...RESTORE_ORDER.filter((t) => known.includes(t)),
    ...known.filter((t) => !(RESTORE_ORDER as readonly string[]).includes(t)),
  ];

  const inserts: RestorePlan['inserts'] = [];
  const conflicts: RestorePlan['conflicts'] = [];

  for (const table of ordered) {
    const rows = tables[table] || [];
    if (rows.length === 0) continue;
    const existing = existingIds[table] || new Set<string>();
    const fresh = rows.filter((r) => !existing.has(rowKey(r)));
    const clashed = rows.filter((r) => existing.has(rowKey(r)));
    if (fresh.length > 0) inserts.push({ table, rows: fresh });
    if (clashed.length > 0) conflicts.push({ table, ids: clashed.map(rowKey) });
  }

  return { inserts, conflicts };
}
```

- [ ] **Step 4: Correr — debe pasar**

Run: `npx jest lib/admin/deletion/restore-plan.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/admin/deletion/restore-plan.ts lib/admin/deletion/restore-plan.test.ts
git commit -m "feat(delete-portal): planRestore — orden padres-primero + conflictos (TDD)"
```

---

### Task 5: Snapshot builders (`snapshot.ts`)

**Files:**
- Create: `lib/admin/deletion/snapshot.ts`

**Interfaces:**
- Consumes: tipos de `./types`; `buildCounts`, `mergeTables` de `./order`; `evaluateProtection` de `./protection`; `SupabaseClient` de `@supabase/supabase-js`
- Produces: `buildSnapshot(admin: SupabaseClient, entityType: DeletableEntity, entityId: string): Promise<DeletionSnapshot>` — lanza `Error('Not found')` si la raíz no existe.

Sin test unitario (es I/O puro contra Supabase); se verifica en el ensayo E2E (Task 14). Mantener < 300 líneas.

- [ ] **Step 1: Implementar**

```typescript
// lib/admin/deletion/snapshot.ts
import type { SupabaseClient } from '@supabase/supabase-js';
import type { DeletableEntity, DeletionSnapshot, SnapshotTables } from './types';
import { buildCounts, mergeTables } from './order';
import { evaluateProtection } from './protection';

// Reason: tablas hijas de guest_recipes con FK CASCADE (mapa verificado en la spec)
const RECIPE_CHILD_TABLES = [
  'cookbook_recipes',
  'group_recipes',
  'image_processing_queue',
  'midjourney_prompts',
  'prompt_evaluations',
  'recipe_annex_images',
  'recipe_edit_history',
  'recipe_print_ready',
  'recipe_production_status',
] as const;

type Row = Record<string, unknown>;

async function fetchAll(
  admin: SupabaseClient,
  table: string,
  column: string,
  values: string[]
): Promise<Row[]> {
  if (values.length === 0) return [];
  const { data, error } = await admin.from(table).select('*').in(column, values);
  if (error) throw new Error(`snapshot ${table}: ${error.message}`);
  return (data as Row[]) || [];
}

async function recipeChildren(admin: SupabaseClient, recipeIds: string[]): Promise<SnapshotTables> {
  const tables: SnapshotTables = {};
  for (const table of RECIPE_CHILD_TABLES) {
    tables[table] = await fetchAll(admin, table, 'recipe_id', recipeIds);
  }
  return tables;
}

async function groupContent(admin: SupabaseClient, groupIds: string[]): Promise<SnapshotTables> {
  let tables: SnapshotTables = {
    guests: await fetchAll(admin, 'guests', 'group_id', groupIds),
    guest_recipes: await fetchAll(admin, 'guest_recipes', 'group_id', groupIds),
    group_members: await fetchAll(admin, 'group_members', 'group_id', groupIds),
    group_invitations: await fetchAll(admin, 'group_invitations', 'group_id', groupIds),
    group_recipes: await fetchAll(admin, 'group_recipes', 'group_id', groupIds),
    cookbooks: await fetchAll(admin, 'cookbooks', 'group_id', groupIds),
    book_qa_reviews: await fetchAll(admin, 'book_qa_reviews', 'group_id', groupIds),
    recipe_annex_images: await fetchAll(admin, 'recipe_annex_images', 'group_id', groupIds),
  };
  const recipeIds = tables.guest_recipes.map((r) => String(r.id));
  tables = mergeTables(tables, await recipeChildren(admin, recipeIds));
  const cookbookIds = tables.cookbooks.map((c) => String(c.id));
  tables = mergeTables(tables, {
    cookbook_recipes: await fetchAll(admin, 'cookbook_recipes', 'cookbook_id', cookbookIds),
  });
  return tables;
}

async function ownerIsTest(admin: SupabaseClient, profileId: string | null): Promise<boolean> {
  if (!profileId) return false;
  const { data } = await admin
    .from('profiles')
    .select('is_test_account')
    .eq('id', profileId)
    .maybeSingle();
  return Boolean(data?.is_test_account);
}

async function countOrders(
  admin: SupabaseClient,
  column: 'group_id' | 'user_id',
  values: string[]
): Promise<{ total: number; paid: number }> {
  if (values.length === 0) return { total: 0, paid: 0 };
  const rows = await fetchAll(admin, 'orders', column, values);
  const paid = rows.filter((o) => o.status === 'paid' || o.status === 'completed').length;
  return { total: rows.length, paid };
}

export async function buildSnapshot(
  admin: SupabaseClient,
  entityType: DeletableEntity,
  entityId: string
): Promise<DeletionSnapshot> {
  if (entityType === 'recipe') return snapshotRecipe(admin, entityId);
  if (entityType === 'guest') return snapshotGuest(admin, entityId);
  if (entityType === 'group') return snapshotGroup(admin, entityId);
  return snapshotProfile(admin, entityId);
}

async function root(admin: SupabaseClient, table: string, id: string): Promise<Row> {
  const { data, error } = await admin.from(table).select('*').eq('id', id).maybeSingle();
  if (error) throw new Error(`snapshot ${table}: ${error.message}`);
  if (!data) throw new Error('Not found');
  return data as Row;
}

async function snapshotRecipe(admin: SupabaseClient, id: string): Promise<DeletionSnapshot> {
  const recipe = await root(admin, 'guest_recipes', id);
  const tables = mergeTables({ guest_recipes: [recipe] }, await recipeChildren(admin, [id]));
  const protection = evaluateProtection({
    entityType: 'recipe',
    orderCount: 0,
    paidOrderCount: 0,
    shippingCount: 0,
    qaReviewCount: 0,
    isTestOwner: await ownerIsTest(admin, recipe.user_id ? String(recipe.user_id) : null),
    otherMemberCount: 0,
  });
  return {
    entityType: 'recipe',
    entityId: id,
    entityLabel: String(recipe.recipe_name || 'Untitled recipe'),
    tables,
    counts: buildCounts(tables),
    protection,
  };
}

async function snapshotGuest(admin: SupabaseClient, id: string): Promise<DeletionSnapshot> {
  const guest = await root(admin, 'guests', id);
  let tables: SnapshotTables = {
    guests: [guest],
    guest_recipes: await fetchAll(admin, 'guest_recipes', 'guest_id', [id]),
    communication_log: await fetchAll(admin, 'communication_log', 'guest_id', [id]),
  };
  const recipeIds = tables.guest_recipes.map((r) => String(r.id));
  tables = mergeTables(tables, await recipeChildren(admin, recipeIds));
  const protection = evaluateProtection({
    entityType: 'guest',
    orderCount: 0,
    paidOrderCount: 0,
    shippingCount: 0,
    qaReviewCount: 0,
    isTestOwner: await ownerIsTest(admin, guest.user_id ? String(guest.user_id) : null),
    otherMemberCount: 0,
  });
  const name = [guest.first_name, guest.last_name].filter(Boolean).join(' ');
  return {
    entityType: 'guest',
    entityId: id,
    entityLabel: name || String(guest.email || 'Unnamed guest'),
    tables,
    counts: buildCounts(tables),
    protection,
  };
}

async function snapshotGroup(admin: SupabaseClient, id: string): Promise<DeletionSnapshot> {
  const group = await root(admin, 'groups', id);
  const tables = mergeTables({ groups: [group] }, await groupContent(admin, [id]));
  const orders = await countOrders(admin, 'group_id', [id]);
  const shipping = await fetchAll(admin, 'shipping_addresses', 'group_id', [id]);
  const ownerId = group.created_by ? String(group.created_by) : null;
  const otherMembers = (tables.group_members || []).filter(
    (m) => String(m.profile_id) !== ownerId
  );
  const protection = evaluateProtection({
    entityType: 'group',
    orderCount: orders.total,
    paidOrderCount: orders.paid,
    shippingCount: shipping.length,
    qaReviewCount: 0,
    isTestOwner: await ownerIsTest(admin, ownerId),
    otherMemberCount: otherMembers.length,
  });
  return {
    entityType: 'group',
    entityId: id,
    entityLabel: String(group.name || 'Unnamed group'),
    tables,
    counts: buildCounts(tables),
    protection,
  };
}

async function snapshotProfile(admin: SupabaseClient, id: string): Promise<DeletionSnapshot> {
  const profile = await root(admin, 'profiles', id);
  const ownedGroups = await fetchAll(admin, 'groups', 'created_by', [id]);
  const groupIds = ownedGroups.map((g) => String(g.id));
  let tables: SnapshotTables = mergeTables(
    { profiles: [profile], groups: ownedGroups },
    await groupContent(admin, groupIds)
  );
  tables = mergeTables(tables, {
    guests: await fetchAll(admin, 'guests', 'user_id', [id]),
    guest_recipes: await fetchAll(admin, 'guest_recipes', 'user_id', [id]),
    cookbooks: await fetchAll(admin, 'cookbooks', 'user_id', [id]),
    cookbook_recipes: await fetchAll(admin, 'cookbook_recipes', 'user_id', [id]),
    communication_log: await fetchAll(admin, 'communication_log', 'user_id', [id]),
    group_members: await fetchAll(admin, 'group_members', 'profile_id', [id]),
    group_invitations: await fetchAll(admin, 'group_invitations', 'invited_by', [id]),
    group_recipes: await fetchAll(admin, 'group_recipes', 'added_by', [id]),
  });
  const extraRecipeIds = (tables.guest_recipes || []).map((r) => String(r.id));
  tables = mergeTables(tables, await recipeChildren(admin, extraRecipeIds));

  const ordersByUser = await countOrders(admin, 'user_id', [id]);
  const ordersByGroup = await countOrders(admin, 'group_id', groupIds);
  const qaReviews = await fetchAll(admin, 'book_qa_reviews', 'created_by', [id]);
  const otherMembers = (tables.group_members || []).filter((m) => String(m.profile_id) !== id);

  const protection = evaluateProtection({
    entityType: 'profile',
    orderCount: ordersByUser.total + ordersByGroup.total,
    paidOrderCount: ordersByUser.paid + ordersByGroup.paid,
    shippingCount: 0,
    qaReviewCount: qaReviews.length,
    isTestOwner: Boolean(profile.is_test_account),
    otherMemberCount: otherMembers.length,
  });
  return {
    entityType: 'profile',
    entityId: id,
    entityLabel: String(profile.email || 'Unknown profile'),
    tables,
    counts: buildCounts(tables),
    protection,
  };
}
```

- [ ] **Step 2: Verificar y commitear**

Run: `npx tsc --noEmit` — Expected: sin errores.
Run: `npx jest lib/admin/deletion` — Expected: PASS (tests de tasks 2-4 siguen verdes).

```bash
git add lib/admin/deletion/snapshot.ts
git commit -m "feat(delete-portal): snapshot builders por entidad con cascada completa"
```

---

### Task 6: API — preview y búsqueda de entidades

**Files:**
- Create: `app/api/v1/admin/delete/preview/route.ts`
- Create: `app/api/v1/admin/delete/entities/route.ts`

**Interfaces:**
- Consumes: `buildSnapshot`, `DeletableEntity`
- Produces:
  - `GET /api/v1/admin/delete/preview?type=<entity>&id=<uuid>` → `{ success: true, data: DeletionSnapshot }` (tables recortadas a 50 filas por tabla para la UI; counts completos)
  - `GET /api/v1/admin/delete/entities?type=<entity>&q=<texto>` → `{ success: true, data: EntityListItem[] }` con `{ id, label, sublabel, badges: string[], created_at }`

- [ ] **Step 1: Implementar preview**

```typescript
// app/api/v1/admin/delete/preview/route.ts
import { NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth/admin';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { buildSnapshot } from '@/lib/admin/deletion/snapshot';
import type { DeletableEntity, SnapshotTables } from '@/lib/admin/deletion/types';

const VALID_TYPES: DeletableEntity[] = ['profile', 'group', 'guest', 'recipe'];
const PREVIEW_ROW_LIMIT = 50;

export async function GET(request: Request) {
  try {
    await requireAdminAuth();
    const url = new URL(request.url);
    const type = url.searchParams.get('type') as DeletableEntity | null;
    const id = url.searchParams.get('id');

    if (!type || !VALID_TYPES.includes(type) || !id) {
      return NextResponse.json({ error: 'type and id are required' }, { status: 400 });
    }

    const admin = createSupabaseAdminClient();
    const snapshot = await buildSnapshot(admin, type, id);

    // Reason: el payload completo puede ser enorme; la UI solo necesita muestras
    const trimmed: SnapshotTables = {};
    for (const [table, rows] of Object.entries(snapshot.tables)) {
      if (rows.length > 0) trimmed[table] = rows.slice(0, PREVIEW_ROW_LIMIT);
    }

    return NextResponse.json({ success: true, data: { ...snapshot, tables: trimmed } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal error';
    const status = message === 'Not found' ? 404 : message.includes('Admin') ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
```

- [ ] **Step 2: Implementar búsqueda de entidades**

```typescript
// app/api/v1/admin/delete/entities/route.ts
import { NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth/admin';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import type { DeletableEntity } from '@/lib/admin/deletion/types';

interface EntityListItem {
  id: string;
  label: string;
  sublabel: string;
  badges: string[];
  created_at: string;
}

export async function GET(request: Request) {
  try {
    await requireAdminAuth();
    const url = new URL(request.url);
    const type = url.searchParams.get('type') as DeletableEntity | null;
    const q = (url.searchParams.get('q') || '').trim();
    const admin = createSupabaseAdminClient();

    let items: EntityListItem[] = [];

    if (type === 'profile') {
      let query = admin
        .from('profiles')
        .select('id, email, full_name, is_test_account, deleted_at, created_at')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(50);
      if (q) query = query.or(`email.ilike.%${q}%,full_name.ilike.%${q}%`);
      const { data, error } = await query;
      if (error) throw new Error(error.message);
      items = (data || []).map((p) => ({
        id: p.id,
        label: p.email,
        sublabel: p.full_name || '—',
        badges: p.is_test_account ? ['TEST'] : [],
        created_at: p.created_at,
      }));
    } else if (type === 'group') {
      let query = admin
        .from('groups')
        .select('id, name, occasion, status, created_at, created_by')
        .order('created_at', { ascending: false })
        .limit(50);
      if (q) query = query.ilike('name', `%${q}%`);
      const { data, error } = await query;
      if (error) throw new Error(error.message);
      const groupIds = (data || []).map((g) => g.id);
      // Reason: un solo query para marcar badges PAID en la lista
      const { data: orderRows } = groupIds.length
        ? await admin.from('orders').select('group_id').in('group_id', groupIds)
        : { data: [] };
      const paidGroups = new Set((orderRows || []).map((o) => o.group_id));
      items = (data || []).map((g) => ({
        id: g.id,
        label: g.name,
        sublabel: `${g.occasion || '—'} · ${g.status || '—'}`,
        badges: paidGroups.has(g.id) ? ['PAID'] : [],
        created_at: g.created_at,
      }));
    } else if (type === 'guest') {
      let query = admin
        .from('guests')
        .select('id, first_name, last_name, email, status, created_at, groups(name)')
        .order('created_at', { ascending: false })
        .limit(50);
      if (q) query = query.or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%,email.ilike.%${q}%`);
      const { data, error } = await query;
      if (error) throw new Error(error.message);
      items = (data || []).map((g) => {
        const groupName = (g.groups as { name?: string } | null)?.name;
        return {
          id: g.id,
          label: [g.first_name, g.last_name].filter(Boolean).join(' ') || g.email || '—',
          sublabel: `${groupName || 'sin grupo'} · ${g.status}`,
          badges: [],
          created_at: g.created_at,
        };
      });
    } else if (type === 'recipe') {
      let query = admin
        .from('guest_recipes')
        .select('id, recipe_name, submission_status, deleted_at, created_at, guests(first_name, last_name)')
        .order('created_at', { ascending: false })
        .limit(50);
      if (q) query = query.ilike('recipe_name', `%${q}%`);
      const { data, error } = await query;
      if (error) throw new Error(error.message);
      items = (data || []).map((r) => {
        const guest = r.guests as { first_name?: string; last_name?: string } | null;
        const guestName = [guest?.first_name, guest?.last_name].filter(Boolean).join(' ');
        return {
          id: r.id,
          label: r.recipe_name || 'Untitled',
          sublabel: `${guestName || 'sin guest'} · ${r.submission_status}`,
          // Reason: 👻 = capa 1, receta ya oculta del producto por el dueño/admin
          badges: r.deleted_at ? ['HIDDEN'] : [],
          created_at: r.created_at,
        };
      });
    } else {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: items });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal error';
    return NextResponse.json({ error: message }, { status: message.includes('Admin') ? 401 : 500 });
  }
}
```

- [ ] **Step 3: Verificar y commitear**

Run: `npx tsc --noEmit` — Expected: sin errores.

```bash
git add app/api/v1/admin/delete/preview/route.ts app/api/v1/admin/delete/entities/route.ts
git commit -m "feat(delete-portal): API preview de cascada + busqueda de entidades"
```

---

### Task 7: API — trash (snapshot + borrado real)

**Files:**
- Create: `app/api/v1/admin/delete/trash/route.ts`

**Interfaces:**
- Consumes: `buildSnapshot`; tabla `deleted_items`
- Produces: `POST /api/v1/admin/delete/trash` body `{ entityType, entityId, confirmLabel, memberGroupsAction? }` → `{ success: true, trashId, steps: string[] }`.
  - `confirmLabel` debe coincidir con `entityLabel` (confirmación escrita se valida también server-side).
  - `memberGroupsAction: 'transfer' | 'delete'` — obligatorio si el snapshot trae warnings de members ajenos (solo profile/group).

- [ ] **Step 1: Implementar**

```typescript
// app/api/v1/admin/delete/trash/route.ts
import { NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth/admin';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { buildSnapshot } from '@/lib/admin/deletion/snapshot';
import type { DeletableEntity } from '@/lib/admin/deletion/types';

const VALID_TYPES: DeletableEntity[] = ['profile', 'group', 'guest', 'recipe'];

// Reason: ban de facto permanente — el auth user se conserva para que restore
// recupere la cuenta con su password; solo purge lo borra de verdad
const BAN_FOREVER = '876000h';

export async function POST(request: Request) {
  try {
    const adminUser = await requireAdminAuth();
    const body = await request.json();
    const entityType = body.entityType as DeletableEntity;
    const entityId = String(body.entityId || '');
    const confirmLabel = String(body.confirmLabel || '');
    const memberGroupsAction = body.memberGroupsAction as 'transfer' | 'delete' | undefined;

    if (!VALID_TYPES.includes(entityType) || !entityId) {
      return NextResponse.json({ error: 'entityType and entityId are required' }, { status: 400 });
    }

    const admin = createSupabaseAdminClient();
    const steps: string[] = [];

    // Transferir grupos con members ajenos ANTES del snapshot: así el snapshot
    // ya no los incluye y sobreviven fuera del borrado.
    if (memberGroupsAction === 'transfer' && (entityType === 'profile' || entityType === 'group')) {
      const groupFilter =
        entityType === 'profile'
          ? admin.from('groups').select('id, created_by').eq('created_by', entityId)
          : admin.from('groups').select('id, created_by').eq('id', entityId);
      const { data: groups } = await groupFilter;
      for (const group of groups || []) {
        const { data: others } = await admin
          .from('group_members')
          .select('profile_id')
          .eq('group_id', group.id)
          .neq('profile_id', group.created_by)
          .limit(1);
        if (others && others.length > 0) {
          const newOwner = String(others[0].profile_id);
          await admin.from('groups').update({ created_by: newOwner }).eq('id', group.id);
          await admin
            .from('group_members')
            .update({ role: 'owner' })
            .eq('group_id', group.id)
            .eq('profile_id', newOwner);
          steps.push(`🔄 Grupo transferido a otro miembro (${group.id})`);
        }
      }
      if (entityType === 'group') {
        return NextResponse.json({ success: true, trashId: null, steps });
      }
    }

    const snapshot = await buildSnapshot(admin, entityType, entityId);

    if (snapshot.entityLabel !== confirmLabel) {
      return NextResponse.json({ error: 'La confirmación escrita no coincide' }, { status: 400 });
    }
    if (snapshot.protection.blocked) {
      return NextResponse.json(
        { error: `Protegido: ${snapshot.protection.reasons.join('; ')}` },
        { status: 403 }
      );
    }
    if (snapshot.protection.warnings.length > 0 && !memberGroupsAction) {
      return NextResponse.json(
        { error: 'Hay miembros ajenos: manda memberGroupsAction transfer|delete', warnings: snapshot.protection.warnings },
        { status: 409 }
      );
    }
    steps.push(`📸 Snapshot de ${Object.values(snapshot.counts).reduce((a, b) => a + b, 0)} filas`);

    const { data: trashRow, error: archiveError } = await admin
      .from('deleted_items')
      .insert({
        entity_type: snapshot.entityType,
        entity_id: snapshot.entityId,
        entity_label: snapshot.entityLabel,
        payload: { tables: snapshot.tables, protection: snapshot.protection },
        counts: snapshot.counts,
        deleted_by: adminUser.id,
      })
      .select('id')
      .single();
    if (archiveError || !trashRow) {
      return NextResponse.json({ error: `Archivado falló: ${archiveError?.message}` }, { status: 500 });
    }
    steps.push('🗄️ Archivado en papelera');

    // Borrado real. Cada DELETE de raíz es atómico (las cascadas FK van en el
    // mismo statement). Si falla, limpiamos la fila de papelera huérfana.
    const fail = async (message: string) => {
      await admin.from('deleted_items').delete().eq('id', trashRow.id);
      return NextResponse.json({ error: message }, { status: 500 });
    };

    if (entityType === 'profile') {
      const { error: banError } = await admin.auth.admin.updateUserById(entityId, {
        ban_duration: BAN_FOREVER,
      });
      if (banError) return fail(`Ban del auth user falló: ${banError.message}`);
      steps.push('🚫 Auth user baneado (email reservado, restore posible)');
    }

    if (entityType === 'group') {
      // Reason: guests.group_id es SET NULL — se borran explícitamente
      // para no dejarlos huérfanos (decisión de la spec)
      const { error: guestsError } = await admin.from('guests').delete().eq('group_id', entityId);
      if (guestsError) return fail(`Borrado de guests falló: ${guestsError.message}`);
      steps.push('🗑️ Guests del grupo borrados');
    }

    const ROOT_TABLE: Record<DeletableEntity, string> = {
      profile: 'profiles',
      group: 'groups',
      guest: 'guests',
      recipe: 'guest_recipes',
    };
    const { error: deleteError } = await admin.from(ROOT_TABLE[entityType]).delete().eq('id', entityId);
    if (deleteError) {
      if (entityType === 'profile') {
        await admin.auth.admin.updateUserById(entityId, { ban_duration: 'none' });
      }
      return fail(`DELETE bloqueado o falló: ${deleteError.message}`);
    }
    steps.push(`🗑️ ${ROOT_TABLE[entityType]} borrado (cascada atómica)`);

    return NextResponse.json({ success: true, trashId: trashRow.id, steps });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal error';
    return NextResponse.json({ error: message }, { status: message.includes('Admin') ? 401 : 500 });
  }
}
```

- [ ] **Step 2: Verificar y commitear**

Run: `npx tsc --noEmit` — Expected: sin errores.

```bash
git add app/api/v1/admin/delete/trash/route.ts
git commit -m "feat(delete-portal): API trash — snapshot + archivado + DELETE atomico"
```

---

### Task 8: API — trash-list y restore

**Files:**
- Create: `app/api/v1/admin/delete/trash-list/route.ts`
- Create: `app/api/v1/admin/delete/restore/route.ts`

**Interfaces:**
- Produces:
  - `GET /api/v1/admin/delete/trash-list` → `{ success: true, data: TrashListItem[] }` con `{ id, entity_type, entity_label, counts, status, deleted_at, purgeAllowed }`
  - `POST /api/v1/admin/delete/restore` body `{ trashId }` → `{ success: true, steps, conflicts }` o `409` si falta el padre.

- [ ] **Step 1: Implementar trash-list**

```typescript
// app/api/v1/admin/delete/trash-list/route.ts
import { NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth/admin';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  try {
    await requireAdminAuth();
    const admin = createSupabaseAdminClient();
    // Reason: payload->protection->purgeAllowed sin traer el payload completo
    const { data, error } = await admin
      .from('deleted_items')
      .select('id, entity_type, entity_id, entity_label, counts, status, deleted_by, deleted_at, restored_at, purged_at, payload->protection->purgeAllowed')
      .order('deleted_at', { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    const items = (data || []).map((row) => ({
      ...row,
      purgeAllowed: Boolean((row as { purgeAllowed?: boolean }).purgeAllowed),
    }));
    return NextResponse.json({ success: true, data: items });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal error';
    return NextResponse.json({ error: message }, { status: message.includes('Admin') ? 401 : 500 });
  }
}
```

- [ ] **Step 2: Implementar restore**

```typescript
// app/api/v1/admin/delete/restore/route.ts
import { NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth/admin';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { planRestore } from '@/lib/admin/deletion/restore-plan';
import { rowKey } from '@/lib/admin/deletion/order';
import type { SnapshotTables } from '@/lib/admin/deletion/types';

export async function POST(request: Request) {
  try {
    await requireAdminAuth();
    const { trashId } = await request.json();
    if (!trashId) {
      return NextResponse.json({ error: 'trashId is required' }, { status: 400 });
    }
    const admin = createSupabaseAdminClient();

    const { data: item, error: itemError } = await admin
      .from('deleted_items')
      .select('*')
      .eq('id', trashId)
      .eq('status', 'trashed')
      .maybeSingle();
    if (itemError || !item) {
      return NextResponse.json({ error: 'No está en papelera (o ya fue restaurado/purgado)' }, { status: 404 });
    }
    const payload = item.payload as { tables: SnapshotTables } | null;
    if (!payload?.tables) {
      return NextResponse.json({ error: 'Snapshot vacío — no se puede restaurar' }, { status: 500 });
    }

    // Padre faltante: recipe necesita su group/guest vivos; guest necesita su group
    const missing: string[] = [];
    if (item.entity_type === 'recipe' || item.entity_type === 'guest') {
      const rootTable = item.entity_type === 'recipe' ? 'guest_recipes' : 'guests';
      const rootRow = payload.tables[rootTable]?.find((r) => String(r.id) === item.entity_id);
      const groupId = rootRow?.group_id ? String(rootRow.group_id) : null;
      if (groupId) {
        const { data: parentGroup } = await admin.from('groups').select('id').eq('id', groupId).maybeSingle();
        if (!parentGroup) missing.push(`groups/${groupId}`);
      }
      if (item.entity_type === 'recipe' && rootRow?.guest_id) {
        const { data: parentGuest } = await admin
          .from('guests').select('id').eq('id', String(rootRow.guest_id)).maybeSingle();
        if (!parentGuest) missing.push(`guests/${String(rootRow.guest_id)}`);
      }
    }
    if (missing.length > 0) {
      return NextResponse.json(
        { error: `Padre faltante: ${missing.join(', ')}. Restaura el padre primero (si está en papelera) o aborta.` },
        { status: 409 }
      );
    }

    // Conflictos: ids que ya existen vivos se omiten (nunca sobreescribimos)
    const existingIds: Record<string, Set<string>> = {};
    for (const [table, rows] of Object.entries(payload.tables)) {
      if (rows.length === 0) continue;
      const ids = rows.map((r) => r.id).filter((v): v is string => typeof v === 'string');
      if (ids.length === 0) continue;
      const { data: existing } = await admin.from(table).select('id').in('id', ids);
      existingIds[table] = new Set((existing || []).map((r) => rowKey(r as Record<string, unknown>)));
    }

    const plan = planRestore(payload.tables, existingIds);
    const steps: string[] = [];

    if (item.entity_type === 'profile') {
      const { error: unbanError } = await admin.auth.admin.updateUserById(item.entity_id, {
        ban_duration: 'none',
      });
      if (unbanError) {
        return NextResponse.json({ error: `Unban falló: ${unbanError.message}` }, { status: 500 });
      }
      steps.push('✅ Auth user desbaneado');
    }

    for (const { table, rows } of plan.inserts) {
      const { error: insertError } = await admin.from(table).insert(rows);
      if (insertError) {
        return NextResponse.json(
          { error: `Insert en ${table} falló: ${insertError.message}. Filas ya insertadas quedan vivas — reintenta (los conflictos se omiten).`, steps },
          { status: 500 }
        );
      }
      steps.push(`✅ ${rows.length} fila(s) → ${table}`);
    }

    await admin
      .from('deleted_items')
      .update({ status: 'restored', restored_at: new Date().toISOString() })
      .eq('id', trashId);
    steps.push('🗄️ Papelera: marcado como restaurado');

    return NextResponse.json({ success: true, steps, conflicts: plan.conflicts });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal error';
    return NextResponse.json({ error: message }, { status: message.includes('Admin') ? 401 : 500 });
  }
}
```

- [ ] **Step 3: Verificar y commitear**

Run: `npx tsc --noEmit` — Expected: sin errores.

```bash
git add app/api/v1/admin/delete/trash-list/route.ts app/api/v1/admin/delete/restore/route.ts
git commit -m "feat(delete-portal): API trash-list + restore con plan padres-primero"
```

---

### Task 9: API — purge

**Files:**
- Create: `app/api/v1/admin/delete/purge/route.ts`

**Interfaces:**
- Produces: `POST /api/v1/admin/delete/purge` body `{ trashId, confirmLabel }` → `{ success: true }`. Guardas: item `trashed`, `payload.protection.purgeAllowed === true`, `confirmLabel === entity_label`.

- [ ] **Step 1: Implementar**

```typescript
// app/api/v1/admin/delete/purge/route.ts
import { NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth/admin';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  try {
    await requireAdminAuth();
    const { trashId, confirmLabel } = await request.json();
    if (!trashId || !confirmLabel) {
      return NextResponse.json({ error: 'trashId and confirmLabel are required' }, { status: 400 });
    }
    const admin = createSupabaseAdminClient();

    const { data: item, error: itemError } = await admin
      .from('deleted_items')
      .select('id, entity_type, entity_id, entity_label, status, payload->protection->purgeAllowed')
      .eq('id', trashId)
      .maybeSingle();
    if (itemError || !item) {
      return NextResponse.json({ error: 'No encontrado en papelera' }, { status: 404 });
    }
    if (item.status !== 'trashed') {
      return NextResponse.json({ error: `Ya está ${item.status}` }, { status: 400 });
    }
    if (!(item as { purgeAllowed?: boolean }).purgeAllowed) {
      return NextResponse.json(
        { error: 'Purga no permitida: el dueño no es TEST o hay pagos. Vive en papelera.' },
        { status: 403 }
      );
    }
    if (item.entity_label !== confirmLabel) {
      return NextResponse.json({ error: 'La confirmación escrita no coincide' }, { status: 400 });
    }

    // Reason: al purgar un profile por fin se borra el auth user → email reusable
    if (item.entity_type === 'profile') {
      const { error: authError } = await admin.auth.admin.deleteUser(item.entity_id);
      if (authError && !authError.message.includes('not found')) {
        return NextResponse.json({ error: `Borrado de auth falló: ${authError.message}` }, { status: 500 });
      }
    }

    const { error: purgeError } = await admin
      .from('deleted_items')
      .update({ payload: null, status: 'purged', purged_at: new Date().toISOString() })
      .eq('id', trashId);
    if (purgeError) {
      return NextResponse.json({ error: purgeError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal error';
    return NextResponse.json({ error: message }, { status: message.includes('Admin') ? 401 : 500 });
  }
}
```

- [ ] **Step 2: Verificar y commitear**

Run: `npx tsc --noEmit` — Expected: sin errores.

```bash
git add app/api/v1/admin/delete/purge/route.ts
git commit -m "feat(delete-portal): API purge — solo TEST sin pagos, audit permanente"
```

---

### Task 10: UI — shell con tabs + EntityTab

**Files:**
- Create: `app/(admin)/admin/delete/page.tsx`
- Create: `app/(admin)/admin/delete/components/EntityTab.tsx`

**Interfaces:**
- Consumes: `GET /api/v1/admin/delete/entities`, patrón admin-check de `app/(admin)/admin/users/page.tsx`
- Produces: página `/admin/delete?tab=&q=`; `EntityTab` props `{ type: DeletableEntity; initialQuery: string; onSelect: (item: EntityListItem) => void }`; export `interface EntityListItem { id: string; label: string; sublabel: string; badges: string[]; created_at: string }` desde `EntityTab.tsx`.

- [ ] **Step 1: Implementar `EntityTab.tsx`**

```typescript
// app/(admin)/admin/delete/components/EntityTab.tsx
"use client";

import { useState, useEffect, useCallback } from 'react';
import { Search } from 'lucide-react';
import type { DeletableEntity } from '@/lib/admin/deletion/types';

export interface EntityListItem {
  id: string;
  label: string;
  sublabel: string;
  badges: string[];
  created_at: string;
}

const BADGE_STYLES: Record<string, string> = {
  PAID: 'bg-green-100 text-green-700',
  TEST: 'bg-purple-100 text-purple-700',
  HIDDEN: 'bg-gray-200 text-gray-600',
};

const BADGE_LABELS: Record<string, string> = {
  PAID: '🛡️ PAID',
  TEST: '🧪 TEST',
  HIDDEN: '👻 quitada del producto',
};

interface EntityTabProps {
  type: DeletableEntity;
  initialQuery: string;
  onSelect: (item: EntityListItem) => void;
}

export default function EntityTab({ type, initialQuery, onSelect }: EntityTabProps) {
  const [items, setItems] = useState<EntityListItem[]>([]);
  const [query, setQuery] = useState(initialQuery);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (q: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/admin/delete/entities?type=${type}&q=${encodeURIComponent(q)}`);
      const result = await res.json();
      if (res.ok && result.success) setItems(result.data);
      else alert(`Error: ${result.error}`);
    } finally {
      setLoading(false);
    }
  }, [type]);

  useEffect(() => {
    const timer = setTimeout(() => load(query), 300);
    return () => clearTimeout(timer);
  }, [query, load]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 bg-white rounded-lg shadow p-3">
        <Search className="h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder={`Buscar ${type}s…`}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 px-2 py-1 text-sm border-0 focus:outline-none"
        />
      </div>
      <div className="bg-white rounded-lg shadow divide-y divide-gray-100">
        {loading ? (
          <div className="p-8 text-center text-gray-500 text-sm">Cargando…</div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">Sin resultados</div>
        ) : (
          items.map((item) => (
            <button
              key={item.id}
              onClick={() => onSelect(item)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 text-left"
            >
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-900">{item.label}</span>
                <span className="text-xs text-gray-500">{item.sublabel}</span>
              </div>
              <div className="flex items-center gap-2">
                {item.badges.map((b) => (
                  <span key={b} className={`text-xs px-2 py-0.5 rounded-full font-medium ${BADGE_STYLES[b] || 'bg-gray-100 text-gray-600'}`}>
                    {BADGE_LABELS[b] || b}
                  </span>
                ))}
                <span className="text-xs text-gray-400">
                  {new Date(item.created_at).toLocaleDateString()}
                </span>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Implementar `page.tsx`**

```typescript
// app/(admin)/admin/delete/page.tsx
"use client";

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createSupabaseClient } from '@/lib/supabase/client';
import { isAdminEmail } from '@/lib/config/admin';
import type { DeletableEntity } from '@/lib/admin/deletion/types';
import EntityTab, { EntityListItem } from './components/EntityTab';
import DeletePreviewSheet from './components/DeletePreviewSheet';
import TrashTab from './components/TrashTab';

type Tab = DeletableEntity | 'trash';

const TABS: { key: Tab; label: string }[] = [
  { key: 'group', label: 'Books' },
  { key: 'profile', label: 'Profiles' },
  { key: 'guest', label: 'Guests' },
  { key: 'recipe', label: 'Recipes' },
  { key: 'trash', label: '🗑️ Papelera' },
];

function DeletePortal() {
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<Tab>((searchParams.get('tab') as Tab) || 'group');
  const [selected, setSelected] = useState<{ type: DeletableEntity; item: EntityListItem } | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const check = async () => {
      const supabase = createSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!isAdminEmail(user?.email)) {
        router.push('/');
        return;
      }
      setIsAdmin(true);
    };
    check();
  }, [router]);

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-1">Delete Portal</h1>
            <p className="text-gray-600 text-sm">
              El único lugar donde se borra. Todo pasa por papelera primero.
            </p>
          </div>
          <Link href="/admin" className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium">
            ← Back to Admin
          </Link>
        </div>

        <div className="flex gap-1 mb-6 bg-white rounded-lg shadow p-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                tab === t.key ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'trash' ? (
          <TrashTab key={refreshKey} />
        ) : (
          <EntityTab
            key={`${tab}-${refreshKey}`}
            type={tab}
            initialQuery={searchParams.get('q') || ''}
            onSelect={(item) => setSelected({ type: tab, item })}
          />
        )}

        {selected && (
          <DeletePreviewSheet
            entityType={selected.type}
            entityId={selected.item.id}
            onClose={() => setSelected(null)}
            onTrashed={() => {
              setSelected(null);
              setRefreshKey((k) => k + 1);
            }}
          />
        )}
      </div>
    </div>
  );
}

export default function AdminDeletePage() {
  // Reason: useSearchParams exige Suspense boundary en App Router
  return (
    <Suspense fallback={null}>
      <DeletePortal />
    </Suspense>
  );
}
```

- [ ] **Step 3: Stubs temporales para compilar**

`DeletePreviewSheet` y `TrashTab` se implementan en Tasks 11-12. Crear stubs mínimos que se reemplazan completos en esas tasks:

```typescript
// app/(admin)/admin/delete/components/DeletePreviewSheet.tsx (STUB — Task 11 lo reemplaza)
"use client";
import type { DeletableEntity } from '@/lib/admin/deletion/types';

interface Props {
  entityType: DeletableEntity;
  entityId: string;
  onClose: () => void;
  onTrashed: () => void;
}

export default function DeletePreviewSheet(_props: Props) {
  return null;
}
```

```typescript
// app/(admin)/admin/delete/components/TrashTab.tsx (STUB — Task 12 lo reemplaza)
"use client";

export default function TrashTab() {
  return null;
}
```

- [ ] **Step 4: Verificar y commitear**

Run: `npx tsc --noEmit` — Expected: sin errores.

```bash
git add "app/(admin)/admin/delete"
git commit -m "feat(delete-portal): shell /admin/delete con tabs + EntityTab"
```

---

### Task 11: UI — DeletePreviewSheet (preview de cascada + confirmación + checklist)

**Files:**
- Modify: `app/(admin)/admin/delete/components/DeletePreviewSheet.tsx` (reemplazar stub completo)

**Interfaces:**
- Consumes: `GET /api/v1/admin/delete/preview`, `POST /api/v1/admin/delete/trash`; `Dialog*` de `@/components/ui/dialog`; `Button` de `@/components/ui/button`
- Produces: modal con preview por tabla (nombres), warnings con radio transfer/delete, confirmación escrita, y checklist de pasos post-trash.

- [ ] **Step 1: Reemplazar el stub con la implementación completa**

```typescript
// app/(admin)/admin/delete/components/DeletePreviewSheet.tsx
"use client";

import { useState, useEffect } from 'react';
import { Flame } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { DeletableEntity, DeletionSnapshot } from '@/lib/admin/deletion/types';

interface Props {
  entityType: DeletableEntity;
  entityId: string;
  onClose: () => void;
  onTrashed: () => void;
}

// Reason: campos legibles por tabla para pintar nombres, no solo números
const DISPLAY_FIELDS: Record<string, string[]> = {
  guests: ['first_name', 'last_name', 'email', 'status'],
  guest_recipes: ['recipe_name', 'submission_status'],
  groups: ['name', 'occasion', 'status'],
  profiles: ['email', 'full_name'],
  cookbooks: ['name'],
  group_members: ['profile_id', 'role'],
  group_invitations: ['email', 'status'],
};

function rowLabel(table: string, row: Record<string, unknown>): string {
  const fields = DISPLAY_FIELDS[table] || ['id'];
  return fields.map((f) => String(row[f] ?? '')).filter(Boolean).join(' · ') || String(row.id ?? '');
}

export default function DeletePreviewSheet({ entityType, entityId, onClose, onTrashed }: Props) {
  const [snapshot, setSnapshot] = useState<DeletionSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmText, setConfirmText] = useState('');
  const [memberAction, setMemberAction] = useState<'transfer' | 'delete' | ''>('');
  const [busy, setBusy] = useState(false);
  const [steps, setSteps] = useState<string[] | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/v1/admin/delete/preview?type=${entityType}&id=${entityId}`);
        const result = await res.json();
        if (res.ok && result.success) setSnapshot(result.data);
        else {
          alert(`Error: ${result.error}`);
          onClose();
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [entityType, entityId, onClose]);

  const handleTrash = async () => {
    if (!snapshot) return;
    setBusy(true);
    try {
      const res = await fetch('/api/v1/admin/delete/trash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entityType,
          entityId,
          confirmLabel: confirmText.trim(),
          ...(memberAction ? { memberGroupsAction: memberAction } : {}),
        }),
      });
      const result = await res.json();
      if (res.ok && result.success) {
        setSteps(result.steps);
      } else {
        alert(`❌ ${result.error}`);
      }
    } finally {
      setBusy(false);
    }
  };

  const needsMemberChoice = (snapshot?.protection.warnings.length ?? 0) > 0;
  const canTrash =
    !!snapshot &&
    !snapshot.protection.blocked &&
    confirmText.trim() === snapshot.entityLabel &&
    (!needsMemberChoice || memberAction !== '');

  return (
    <Dialog open onOpenChange={(open) => !open && (steps ? onTrashed() : onClose())}>
      <DialogContent className="sm:max-w-[640px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl font-semibold">
            {steps ? 'Enviado a papelera' : `Borrar ${entityType}`}
          </DialogTitle>
          <DialogDescription>{snapshot?.entityLabel}</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-center text-sm text-gray-500">Cargando preview de cascada…</div>
        ) : steps ? (
          <div className="py-4 space-y-2">
            {steps.map((s, i) => (
              <div key={i} className="text-sm text-gray-800 font-mono">{s} ✓</div>
            ))}
            <p className="text-xs text-gray-500 pt-2">Restaurable desde la Papelera cuando quieras.</p>
          </div>
        ) : snapshot ? (
          <div className="py-4 space-y-4">
            {snapshot.protection.blocked && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-sm font-semibold text-green-900">🛡️ Protegido — no se puede borrar</p>
                {snapshot.protection.reasons.map((r, i) => (
                  <p key={i} className="text-xs text-green-800 mt-1">{r}</p>
                ))}
              </div>
            )}

            <div className="bg-red-50 border border-red-200 rounded-lg p-3 space-y-3">
              <p className="text-xs font-semibold text-red-900 uppercase tracking-wide">
                Esto se lleva a la papelera:
              </p>
              {Object.entries(snapshot.tables).map(([table, rows]) => (
                <div key={table}>
                  <p className="text-xs font-mono font-bold text-red-900">
                    {table} ({snapshot.counts[table] ?? rows.length})
                  </p>
                  <ul className="ml-3 mt-1 space-y-0.5">
                    {rows.slice(0, 10).map((row, i) => (
                      <li key={i} className="text-xs text-red-800">• {rowLabel(table, row)}</li>
                    ))}
                    {(snapshot.counts[table] ?? 0) > 10 && (
                      <li className="text-xs text-red-600 italic">
                        …y {(snapshot.counts[table] ?? 0) - 10} más
                      </li>
                    )}
                  </ul>
                </div>
              ))}
            </div>

            {needsMemberChoice && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 space-y-2">
                {snapshot.protection.warnings.map((w, i) => (
                  <p key={i} className="text-sm text-yellow-900 font-medium">⚠️ {w}</p>
                ))}
                <label className="flex items-center gap-2 text-sm text-yellow-900">
                  <input type="radio" name="memberAction" checked={memberAction === 'transfer'}
                    onChange={() => setMemberAction('transfer')} />
                  Transferir esos grupos a otro miembro (sobreviven)
                </label>
                <label className="flex items-center gap-2 text-sm text-yellow-900">
                  <input type="radio" name="memberAction" checked={memberAction === 'delete'}
                    onChange={() => setMemberAction('delete')} />
                  Borrar los grupos completos (incluye a los otros miembros)
                </label>
              </div>
            )}

            {!snapshot.protection.blocked && (
              <div>
                <p className="text-sm text-gray-700">
                  Escribe <strong className="text-red-700">{snapshot.entityLabel}</strong> para confirmar:
                </p>
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  autoComplete="off"
                />
              </div>
            )}
          </div>
        ) : null}

        <DialogFooter>
          {steps ? (
            <Button onClick={onTrashed} className="bg-gray-900 text-white">Listo</Button>
          ) : (
            <>
              <Button variant="outline" onClick={onClose} disabled={busy}>Cancelar</Button>
              <Button
                onClick={handleTrash}
                disabled={!canTrash || busy}
                className="bg-red-600 text-white hover:bg-red-700 disabled:bg-red-300"
              >
                <Flame className="h-4 w-4 mr-1" />
                {busy ? 'Borrando…' : 'Mandar a papelera'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: Verificar y commitear**

Run: `npx tsc --noEmit` — Expected: sin errores.

```bash
git add "app/(admin)/admin/delete/components/DeletePreviewSheet.tsx"
git commit -m "feat(delete-portal): DeletePreviewSheet — cascada con nombres + confirmacion + checklist"
```

---

### Task 12: UI — TrashTab (restaurar / purgar)

**Files:**
- Modify: `app/(admin)/admin/delete/components/TrashTab.tsx` (reemplazar stub completo)

**Interfaces:**
- Consumes: `GET /api/v1/admin/delete/trash-list`, `POST /api/v1/admin/delete/restore`, `POST /api/v1/admin/delete/purge`

- [ ] **Step 1: Reemplazar el stub**

```typescript
// app/(admin)/admin/delete/components/TrashTab.tsx
"use client";

import { useState, useEffect, useCallback } from 'react';
import { RotateCcw, Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TrashItem {
  id: string;
  entity_type: string;
  entity_label: string;
  counts: Record<string, number>;
  status: 'trashed' | 'restored' | 'purged';
  deleted_at: string;
  purgeAllowed: boolean;
}

export default function TrashTab() {
  const [items, setItems] = useState<TrashItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/admin/delete/trash-list');
      const result = await res.json();
      if (res.ok && result.success) setItems(result.data);
      else alert(`Error: ${result.error}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleRestore = async (item: TrashItem) => {
    if (!confirm(`¿Restaurar "${item.entity_label}"? Se re-insertan todas las filas del snapshot.`)) return;
    setBusy(item.id);
    try {
      const res = await fetch('/api/v1/admin/delete/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trashId: item.id }),
      });
      const result = await res.json();
      if (res.ok && result.success) {
        const conflictNote = result.conflicts?.length
          ? `\n\nConflictos omitidos (ya existían vivos): ${result.conflicts.map((c: { table: string; ids: string[] }) => `${c.table}:${c.ids.length}`).join(', ')}`
          : '';
        alert(`✅ Restaurado:\n${result.steps.join('\n')}${conflictNote}`);
        await load();
      } else {
        alert(`❌ ${result.error}`);
      }
    } finally {
      setBusy(null);
    }
  };

  const handlePurge = async (item: TrashItem) => {
    const typed = prompt(
      `PURGA DEFINITIVA de "${item.entity_label}".\n\nEsto NO se puede deshacer. Escribe el nombre exacto para confirmar:`
    );
    if (typed === null) return;
    setBusy(item.id);
    try {
      const res = await fetch('/api/v1/admin/delete/purge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trashId: item.id, confirmLabel: typed.trim() }),
      });
      const result = await res.json();
      if (res.ok && result.success) {
        alert('🔥 Purgado definitivamente. El registro de auditoría se conserva.');
        await load();
      } else {
        alert(`❌ ${result.error}`);
      }
    } finally {
      setBusy(null);
    }
  };

  const summarize = (counts: Record<string, number>) =>
    Object.entries(counts).map(([t, n]) => `${n} ${t}`).join(' · ') || 'vacío';

  return (
    <div className="bg-white rounded-lg shadow divide-y divide-gray-100">
      {loading ? (
        <div className="p-8 text-center text-gray-500 text-sm">Cargando papelera…</div>
      ) : items.length === 0 ? (
        <div className="p-8 text-center text-gray-500 text-sm">La papelera está vacía</div>
      ) : (
        items.map((item) => (
          <div key={item.id} className="flex items-center justify-between px-4 py-3">
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-mono">
                  {item.entity_type}
                </span>
                <span className="text-sm font-medium text-gray-900 truncate">{item.entity_label}</span>
                {item.status !== 'trashed' && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                    {item.status}
                  </span>
                )}
              </div>
              <span className="text-xs text-gray-500 truncate">
                {summarize(item.counts)} · {new Date(item.deleted_at).toLocaleString()}
              </span>
            </div>
            {item.status === 'trashed' && (
              <div className="flex items-center gap-2 flex-shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRestore(item)}
                  disabled={busy === item.id}
                >
                  <RotateCcw className="h-3.5 w-3.5 mr-1" /> Restaurar
                </Button>
                <Button
                  size="sm"
                  onClick={() => handlePurge(item)}
                  disabled={busy === item.id || !item.purgeAllowed}
                  title={item.purgeAllowed ? 'Purga definitiva' : 'Solo TEST sin pagos se puede purgar'}
                  className="bg-red-600 text-white hover:bg-red-700 disabled:bg-red-200"
                >
                  <Flame className="h-3.5 w-3.5 mr-1" /> Purgar
                </Button>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verificar y commitear**

Run: `npx tsc --noEmit` — Expected: sin errores.

```bash
git add "app/(admin)/admin/delete/components/TrashTab.tsx"
git commit -m "feat(delete-portal): TrashTab — restaurar y purgar con guardas"
```

---

### Task 13: Integración — /admin/users apunta al portal + capa 1 `deleted_by` + link en admin

**Files:**
- Modify: `app/(admin)/admin/users/page.tsx` (botones de borrar → portal)
- Modify: `lib/supabase/recipes.ts` (deleteRecipe escribe `deleted_by`)
- Modify: `app/api/v1/admin/operations/recipes/[recipeId]/route.ts` (archive escribe `deleted_by`)
- Modify: `app/(admin)/admin/page.tsx` (card/link al portal — localizar la lista de secciones existente y agregar una entrada consistente con el patrón que ya usa la página)

- [ ] **Step 1: En `app/(admin)/admin/users/page.tsx`, reemplazar los handlers de borrado por navegación al portal**

Quitar `handleSoftDelete`, `openHardDeleteModal`, `handleHardDeleteConfirm`, `downloadBackup`, el modal de hard delete y sus estados (`hardDeleteModalOpen`, `userToHardDelete`, `hardDeleteConfirmText`, `hardDeletePreview`, `loadingPreview`, `deleting`). Los botones Trash2/Flame de la fila y del modal de detalles se sustituyen por uno solo:

```typescript
<button
  onClick={() => router.push(`/admin/delete?tab=profile&q=${encodeURIComponent(user.email)}`)}
  className="inline-flex items-center gap-1 px-2 py-1 text-xs text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
  title="Borrar en el Delete Portal"
>
  <Trash2 className="h-3.5 w-3.5" />
</button>
```

Y en el `DialogFooter` del modal de detalles, reemplazar los botones Soft/Hard Delete por:

```typescript
<Button
  onClick={() => selectedUser && router.push(`/admin/delete?tab=profile&q=${encodeURIComponent(selectedUser.email)}`)}
  className="bg-red-600 text-white hover:bg-red-700"
>
  Borrar en Delete Portal →
</Button>
```

Nota: la sección "If Deleted, This Will Be Soft Deleted" del modal se elimina (el preview real vive en el portal). El endpoint `DELETE /api/v1/admin/users/[userId]` y `hard-delete-preview` quedan sin UI que los llame — NO se borran en esta task (limpieza aparte cuando el portal esté validado).

- [ ] **Step 2: `deleted_by` en los dos writers de capa 1**

En `lib/supabase/recipes.ts` → `deleteRecipe()`, en el update del Step 2:

```typescript
  // Step 2: the soft-delete itself.
  const { error: deleteError } = await supabase
    .from('guest_recipes')
    .update({ deleted_at: nowIso, deleted_by: user.id })
    .eq('id', recipeId);
```

En `app/api/v1/admin/operations/recipes/[recipeId]/route.ts`, localizar el `.update({ deleted_at: nowIso })` (hay dos: archive y fullySoftDeleted) y agregar `deleted_by` con el id del admin autenticado (la ruta ya resuelve el user de sesión; usar esa variable).

- [ ] **Step 3: Link en el índice admin**

En `app/(admin)/admin/page.tsx`, agregar una entrada "🗑️ Delete Portal" apuntando a `/admin/delete`, siguiendo el patrón de las entradas existentes (leer el archivo primero y copiar el formato de una card/link existente).

- [ ] **Step 4: Verificar y commitear**

Run: `npx tsc --noEmit` — Expected: sin errores.
Run: `npm run lint` — Expected: sin errores nuevos.

```bash
git add "app/(admin)/admin/users/page.tsx" lib/supabase/recipes.ts "app/api/v1/admin/operations/recipes/[recipeId]/route.ts" "app/(admin)/admin/page.tsx"
git commit -m "feat(delete-portal): integracion users page + deleted_by capa 1 + link admin"
```

---

### Task 14: Ensayo E2E con el caso real (`test@smallplatesandcompany.com`)

**Files:** ninguno (verificación manual con Ricardo).

Checklist guiado — pedir a Ricardo screenshots en cada paso (regla del proyecto: NO Playwright):

- [ ] **Step 1:** `npm run dev` y abrir `/admin/delete`. Screenshot de los 5 tabs.
- [ ] **Step 2:** Tab Profiles → buscar `test@smallplatesandcompany.com` → abrir preview. Verificar que el preview muestra: el grupo "Richi's Birthday!", los 5 guests POR NOMBRE (Ana Banana, Danielte, Robertote, Lilythte, JaimeTe), y el warning de member ajeno (Ana Orozco).
- [ ] **Step 3:** Elegir "Borrar los grupos completos", escribir el email, Mandar a papelera. Verificar checklist de pasos.
- [ ] **Step 4:** Verificar desaparición: el profile ya no sale en `/admin/users` ni el grupo en el dashboard.
- [ ] **Step 5:** Papelera → Restaurar. Verificar con SQL de solo lectura (o en la UI) que grupo, guests y membresías volvieron completos.
- [ ] **Step 6:** Marcar el profile como TEST (matraz en `/admin/users`) si no lo está → repetir trash → Purgar. Confirmar que el email queda reusable (signup de prueba) y que la fila de auditoría queda como `purged`.
- [ ] **Step 7:** Commit final de cualquier ajuste que salga del ensayo.

---

## Self-Review (ejecutada)

1. **Cobertura de spec:** tabla `deleted_items` (T1), semántica capa 1 comments + `deleted_by` (T1, T13), snapshot con cascada verificada (T5), protecciones pagado/test/FK (T3, T7, T9), guests explícitos en group trash (T7), transfer-or-delete para members ajenos (T7, T11), ban/unban auth en profile trash/restore (T7, T8), purga solo TEST+sin pagos con audit permanente (T9), UI 5 tabs con preview por nombres y checklist (T10-12), integración users page (T13), ensayo E2E con test@ (T14), Storage fuera de alcance (ninguna task lo toca — correcto).
2. **Placeholders:** ninguno — todo step de código tiene el código.
3. **Consistencia de tipos:** `DeletionSnapshot`/`Protection`/`RestorePlan` definidos en T2 y consumidos con los mismos nombres en T5-T12; `purgeAllowed` viaja en `payload.protection` (T7) y se lee igual (T8, T9).
