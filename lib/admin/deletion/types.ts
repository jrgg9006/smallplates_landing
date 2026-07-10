export type DeletableEntity = 'profile' | 'group' | 'guest' | 'recipe';

export type SnapshotTables = Record<string, Record<string, unknown>[]>;

export interface Protection {
  blocked: boolean;
  reasons: string[];
  warnings: string[];
  purgeAllowed: boolean;
  memberChoiceRequired: boolean;
}

// Reason: curated_examples referencia prompt_evaluations con FK NO ACTION pero es
// autocontenido — al borrar se desliga (origin_eval_id = null) y al restaurar se re-liga
export interface CuratedLink {
  id: string;
  origin_eval_id: string;
}

export interface DeletionSnapshot {
  entityType: DeletableEntity;
  entityId: string;
  entityLabel: string;
  tables: SnapshotTables;
  counts: Record<string, number>;
  protection: Protection;
  curatedLinks: CuratedLink[];
}

export interface RestorePlan {
  inserts: { table: string; rows: Record<string, unknown>[] }[];
  conflicts: { table: string; ids: string[] }[];
}
