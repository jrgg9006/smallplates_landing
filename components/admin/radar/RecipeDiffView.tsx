'use client';

import { auditRecipe, type SectionKey } from '@/lib/recipe-audit';
import { HighlightedText } from '@/app/(admin)/admin/books/components/RecipeAuditStrip';

export interface EditHistoryRow {
  id: string;
  edited_at: string;
  edited_by: string | null;
  edit_target?: 'original' | 'print_ready' | null;
  recipe_name_before: string | null;
  ingredients_before: string | null;
  instructions_before: string | null;
  comments_before: string | null;
  recipe_name_after: string | null;
  ingredients_after: string | null;
  instructions_after: string | null;
  comments_after: string | null;
  profiles: { email: string | null; full_name: string | null } | null;
}

// Reason: must match the feed's collapse window so the diff shows the same
// edit "session" the feed counted (Karla editó "Lasagna" ×3).
const WINDOW_MS = 30 * 60 * 1000;

const SECTION_LABEL: Record<SectionKey, string> = {
  name: 'Nombre',
  ingredients: 'Ingredientes',
  instructions: 'Preparación',
  note: 'Nota',
};

export function RecipeDiffView({ history, editId }: { history: EditHistoryRow[]; editId: string }) {
  const clicked = history.find((h) => h.id === editId) ?? history[0];
  if (!clicked) {
    return <p className="text-sm text-gray-400">No hay historial de esta edición.</p>;
  }

  // Reason: net change of the session — earliest "before" → latest "after" among
  // edits by the same person within the window ending at the clicked edit.
  const tEnd = new Date(clicked.edited_at).getTime();
  const session = history
    .filter(
      (h) =>
        h.edited_by === clicked.edited_by &&
        new Date(h.edited_at).getTime() <= tEnd &&
        tEnd - new Date(h.edited_at).getTime() <= WINDOW_MS
    )
    .sort((a, b) => a.edited_at.localeCompare(b.edited_at));
  const first = session[0] ?? clicked;
  const last = session[session.length - 1] ?? clicked;

  // Reason: reuse the exact word-level diff from Book Production — before = "original",
  // after = "clean". Same green/red/gray marks, zero new diff logic.
  const audit = auditRecipe({
    hasPrintReady: true,
    isManualOriginal: false,
    original: {
      name: first.recipe_name_before ?? '',
      ingredients: first.ingredients_before ?? '',
      instructions: first.instructions_before ?? '',
      note: first.comments_before,
    },
    clean: {
      name: last.recipe_name_after ?? '',
      ingredients: last.ingredients_after ?? '',
      instructions: last.instructions_after ?? '',
      note: last.comments_after,
    },
  });
  const changed = audit.sections.filter((s) => s.severity !== 'identical');
  const editorName = clicked.profiles?.full_name || clicked.profiles?.email || 'Alguien';

  return (
    <div className="space-y-6">
      {/* Reason: count the fields that actually differ — not history rows, which the
          edit pipeline double-writes (one save → ~2 rows would read as "2 cambios"). */}
      <p className="text-sm text-gray-500">
        Editado por {editorName}
        {changed.length > 0 &&
          ` · ${changed.length} ${changed.length === 1 ? 'campo cambiado' : 'campos cambiados'}`}
      </p>
      {changed.length === 0 ? (
        <p className="text-sm text-gray-400">
          No se detectaron cambios de texto en esta edición — pudo ser una doble escritura del
          sistema.
        </p>
      ) : (
        changed.map((s) => (
          <div key={s.section}>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.15em] text-gray-500">
              {SECTION_LABEL[s.section]}
            </h3>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="rounded-lg border border-red-100 bg-red-50/40 p-3">
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-red-400">
                  Antes
                </p>
                <p className="font-serif text-sm leading-relaxed text-gray-700">
                  <HighlightedText tokens={s.originalTokens} />
                </p>
              </div>
              <div className="rounded-lg border border-emerald-100 bg-emerald-50/40 p-3">
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-500">
                  Después
                </p>
                <p className="font-serif text-sm leading-relaxed text-gray-700">
                  <HighlightedText tokens={s.cleanTokens} />
                </p>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
