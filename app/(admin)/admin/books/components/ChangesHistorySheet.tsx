'use client';

import { useEffect, useState } from 'react';
import { Loader2, History, User, UserCog, Sparkles } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { auditRecipe, type SectionKey } from '@/lib/recipe-audit';
import { HighlightedText } from './RecipeAuditStrip';
import type { EditHistoryRow } from '@/components/admin/radar/RecipeDiffView';

// Reason: the shared EditHistoryRow type omits edit_reason, but the endpoint
// returns it — we need it to tell guest reassignments apart from text edits.
type HistoryRow = EditHistoryRow & { edit_reason?: string | null };

// The guest's original submission (immutable) and the current clean version.
type OriginalRecipe = {
  recipe_name: string | null;
  ingredients: string | null;
  instructions: string | null;
  comments: string | null;
  upload_method: string | null;
  document_urls: string[] | null;
  raw_recipe_text: string | null;
};
type CleanVersion = {
  recipe_name_clean: string | null;
  ingredients_clean: string | null;
  instructions_clean: string | null;
  note_clean: string | null;
} | null;

type Snapshot = { name: string; ingredients: string; instructions: string; note: string | null };

// Reason: guest reassignments are logged with this reason prefix. They are NOT
// content edits, so we render them as a one-line note instead of a fake diff.
const GUEST_CHANGE_PREFIX = 'Guest changed:';

const SECTION_LABEL: Record<SectionKey, string> = {
  name: 'Nombre',
  ingredients: 'Ingredientes',
  instructions: 'Preparación',
  note: 'Nota',
};

// Reason: an edit can double-write ~2 identical rows (DB trigger + logRecipeEdit).
// Collapse adjacent rows with the same editor + identical before/after content so
// one save reads as one entry, not two.
const DUP_WINDOW_MS = 10 * 1000;

function rowContentKey(r: EditHistoryRow): string {
  return [
    r.edited_by ?? '',
    r.recipe_name_before, r.ingredients_before, r.instructions_before, r.comments_before,
    r.recipe_name_after, r.ingredients_after, r.instructions_after, r.comments_after,
  ].join('');
}

function dedupe(rows: HistoryRow[]): HistoryRow[] {
  const out: HistoryRow[] = [];
  for (const r of rows) {
    const prev = out[out.length - 1];
    if (
      prev &&
      rowContentKey(prev) === rowContentKey(r) &&
      Math.abs(new Date(prev.edited_at).getTime() - new Date(r.edited_at).getTime()) <= DUP_WINDOW_MS
    ) {
      continue;
    }
    out.push(r);
  }
  return out;
}

// Reason: reuse the exact word-level diff from Book Review — before vs after.
// Same green/red/gray marks, zero new diff logic. Returns the audit (for severity
// checks like "manual") plus only the sections that actually differ.
function diffBetween(before: Snapshot, after: Snapshot, isManualOriginal = false) {
  const audit = auditRecipe({ hasPrintReady: true, isManualOriginal, original: before, clean: after });
  return { audit, changed: audit.sections.filter((s) => s.severity !== 'identical') };
}

function changedSections(r: EditHistoryRow) {
  return diffBetween(
    {
      name: r.recipe_name_before ?? '',
      ingredients: r.ingredients_before ?? '',
      instructions: r.instructions_before ?? '',
      note: r.comments_before,
    },
    {
      name: r.recipe_name_after ?? '',
      ingredients: r.ingredients_after ?? '',
      instructions: r.instructions_after ?? '',
      note: r.comments_after,
    },
  ).changed;
}

type DiffSection = ReturnType<typeof changedSections>[number];

// Reason: reconstruct the AI's clean output. It isn't stored immutably — human
// edits overwrite recipe_print_ready — so we recover it from the audit trail:
// the "before" of the EARLIEST clean edit is the clean as it was before any human
// touched it (= the AI output). If nobody edited the clean, the current clean
// still IS the AI output. Returns null when no clean exists yet.
function reconstructAiClean(rows: HistoryRow[], clean: CleanVersion): Snapshot | null {
  const printReadyRows = rows
    .filter((r) => r.edit_target === 'print_ready')
    .sort((a, b) => a.edited_at.localeCompare(b.edited_at));

  if (printReadyRows.length > 0) {
    const oldest = printReadyRows[0];
    return {
      name: oldest.recipe_name_before ?? '',
      ingredients: oldest.ingredients_before ?? '',
      instructions: oldest.instructions_before ?? '',
      note: oldest.comments_before,
    };
  }
  if (clean) {
    return {
      name: clean.recipe_name_clean ?? '',
      ingredients: clean.ingredients_clean ?? '',
      instructions: clean.instructions_clean ?? '',
      note: clean.note_clean,
    };
  }
  return null;
}

// Reason: the AI baseline must compare the original AS THE AI SAW IT, not the
// current guest_recipes — the owner can edit the original AFTER cleaning, and
// using the current value would wrongly fold those owner edits into the AI diff.
// So recover the pristine original: the "before" of the EARLIEST 'original' edit
// (excluding guest reassignments, which carry no real content change). If the
// original was never edited, the current value IS pristine.
function reconstructPristineOriginal(rows: HistoryRow[], current: OriginalRecipe | null): Snapshot | null {
  if (!current) return null;
  const originalRows = rows
    .filter(
      (r) => r.edit_target === 'original' && !(r.edit_reason ?? '').startsWith(GUEST_CHANGE_PREFIX),
    )
    .sort((a, b) => a.edited_at.localeCompare(b.edited_at));

  if (originalRows.length > 0) {
    const oldest = originalRows[0];
    return {
      name: oldest.recipe_name_before ?? '',
      ingredients: oldest.ingredients_before ?? '',
      instructions: oldest.instructions_before ?? '',
      note: oldest.comments_before,
    };
  }
  return {
    name: current.recipe_name ?? '',
    ingredients: current.ingredients ?? '',
    instructions: current.instructions ?? '',
    note: current.comments,
  };
}

function formatWhen(iso: string): string {
  try {
    return new Date(iso).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return iso;
  }
}

/** Side-by-side before/after blocks for each changed section. Shared by human
 *  edits and the AI baseline entry. */
function DiffSections({ changed }: { changed: DiffSection[] }) {
  return (
    <div className="space-y-5">
      {changed.map((s) => (
        <div key={s.section}>
          <h4 className="mb-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-gray-500">
            {SECTION_LABEL[s.section]}
          </h4>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="rounded-md border border-red-100 bg-red-50/40 p-3">
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-red-400">Antes</p>
              <p className="font-serif text-sm leading-relaxed text-gray-700">
                <HighlightedText tokens={s.originalTokens} />
              </p>
            </div>
            <div className="rounded-md border border-emerald-100 bg-emerald-50/40 p-3">
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-500">Después</p>
              <p className="font-serif text-sm leading-relaxed text-gray-700">
                <HighlightedText tokens={s.cleanTokens} />
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ChangesHistorySheet({
  open,
  onClose,
  recipeId,
  recipeName,
}: {
  open: boolean;
  onClose: () => void;
  recipeId: string | null;
  recipeName?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<HistoryRow[]>([]);
  const [original, setOriginal] = useState<OriginalRecipe | null>(null);
  const [clean, setClean] = useState<CleanVersion>(null);

  // Reason: lazy — only hit the endpoint when the panel actually opens.
  useEffect(() => {
    if (!open || !recipeId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setRows([]);
    setOriginal(null);
    setClean(null);
    fetch(`/api/v1/admin/content/recipes/${recipeId}`, { cache: 'no-store' })
      .then((res) => {
        if (!res.ok) throw new Error('No se pudo cargar el historial');
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        setRows(Array.isArray(data.history) ? data.history : []);
        setOriginal(data.recipe ?? null);
        setClean(data.print_ready ?? null);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : 'Error al cargar el historial');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, recipeId]);

  // Reason: collapse system double-writes, then keep guest reassignments and any
  // edit with a real text change — dropping no-op rows (e.g. a clean re-save that
  // changed nothing). Guest changes skip the diff: before/after are identical and
  // the meaning lives in the reason, not in a content diff.
  const entries = dedupe(rows)
    .map((r) => {
      const reason = r.edit_reason ?? '';
      const isGuestChange = reason.startsWith(GUEST_CHANGE_PREFIX);
      return {
        row: r,
        isGuestChange,
        guestSummary: isGuestChange ? reason.slice(GUEST_CHANGE_PREFIX.length).trim() : '',
        changed: isGuestChange ? [] : changedSections(r),
      };
    })
    .filter((e) => e.isGuestChange || e.changed.length > 0);

  // Reason: the first "big change" — what the AI did when it cleaned the guest's
  // submission. Reconstructed from the trail (see reconstructAiClean). Shown at
  // the very bottom because it's the oldest event in the timeline.
  const isManualOriginal = !!original && (
    (original.upload_method === 'image' && !!original.document_urls && original.document_urls.length > 0)
    || !!original.raw_recipe_text
  );
  const pristineOriginal = reconstructPristineOriginal(rows, original);
  const aiClean = original ? reconstructAiClean(rows, clean) : null;
  const aiDiff = pristineOriginal && aiClean
    ? diffBetween(pristineOriginal, aiClean, isManualOriginal)
    : null;

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      {/* Reason: book overlay sits at z-[100]; lift the panel above it. Wide enough
          for the before/after columns to sit side by side like the radar. */}
      <SheetContent side="right" className="z-[110] w-full overflow-y-auto sm:max-w-4xl">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <History className="h-4 w-4" /> Historial de cambios
          </SheetTitle>
          <SheetDescription>
            {recipeName ? `"${recipeName}" — ` : ''}del original del invitado a la versión final: quién cambió qué y cuándo.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {loading && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Cargando…
            </div>
          )}

          {!loading && error && <p className="text-sm text-red-600">{error}</p>}

          {!loading && !error && entries.length === 0 && (
            <p className="text-sm text-gray-400">
              Sin ediciones manuales encima de la limpieza. Abajo, lo que hizo la IA.
            </p>
          )}

          {!loading &&
            !error &&
            entries.map(({ row, changed, isGuestChange, guestSummary }) => {
              const editor = row.profiles?.full_name || row.profiles?.email || 'Alguien';
              return (
                <div key={row.id} className="rounded-lg border border-gray-200 p-4">
                  {/* Reason: who + when, clearly, at the top of every change. */}
                  <div className="mb-4 flex items-center justify-between gap-2 border-b border-gray-100 pb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500">
                        {isGuestChange ? <UserCog className="h-4 w-4" /> : <User className="h-4 w-4" />}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-gray-800">
                          {isGuestChange ? 'Cambio de invitado por ' : 'Editado por '}
                          {editor}
                        </p>
                        <p className="text-xs text-gray-400">
                          {formatWhen(row.edited_at)}
                          {!isGuestChange && (
                            <>
                              {' · '}
                              {row.edit_target === 'print_ready'
                                ? 'versión limpia'
                                : 'original del invitado'}
                            </>
                          )}
                        </p>
                      </div>
                    </div>
                    <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500">
                      {isGuestChange
                        ? 'Invitado'
                        : `${changed.length} ${changed.length === 1 ? 'cambio' : 'cambios'}`}
                    </span>
                  </div>
                  {isGuestChange ? (
                    <p className="text-sm text-gray-700">
                      Reasignó el invitado:{' '}
                      <span className="font-medium">{guestSummary || '—'}</span>
                    </p>
                  ) : (
                    <DiffSections changed={changed} />
                  )}
                </div>
              );
            })}

          {/* The first big change: original del invitado → limpieza IA. Always at
              the bottom (oldest event). */}
          {!loading && !error && original && (
            <div className="rounded-lg border border-violet-200 bg-violet-50/30 p-4">
              <div className="mb-4 flex items-center justify-between gap-2 border-b border-violet-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-600">
                    <Sparkles className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-gray-800">Limpieza automática (IA)</p>
                    <p className="text-xs text-gray-400">Original del invitado → versión limpia</p>
                  </div>
                </div>
                <span className="shrink-0 rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-medium text-violet-600">
                  {!aiClean || isManualOriginal
                    ? 'IA'
                    : aiDiff && aiDiff.changed.length > 0
                      ? `${aiDiff.changed.length} ${aiDiff.changed.length === 1 ? 'cambio' : 'cambios'}`
                      : 'Sin cambios'}
                </span>
              </div>

              {!aiClean ? (
                <p className="text-sm text-gray-500">
                  Aún no se ha generado la versión limpia con IA para esta receta.
                </p>
              ) : isManualOriginal ? (
                <p className="text-sm text-gray-500">
                  El original es una foto o texto pegado — sin comparación automática. Verifica a mano.
                </p>
              ) : aiDiff && aiDiff.changed.length > 0 ? (
                <DiffSections changed={aiDiff.changed} />
              ) : (
                <p className="text-sm text-gray-500">
                  Sin cambios — la IA dejó la receta tal como la subió el invitado.
                </p>
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
