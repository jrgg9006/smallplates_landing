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
