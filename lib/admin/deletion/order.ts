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
