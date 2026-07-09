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
