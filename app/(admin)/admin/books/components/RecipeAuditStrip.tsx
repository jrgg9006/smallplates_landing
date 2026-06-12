'use client';

import { useState } from 'react';
import { Check, AlertTriangle, Eye, ChevronDown, ChevronRight, Plus, Minus, ArrowRight, Info } from 'lucide-react';
import type { RecipeAudit, RenderToken, SectionKey } from '@/lib/recipe-audit';

const SECTION_LABEL: Record<SectionKey, string> = {
  name: 'Título',
  ingredients: 'Ingredientes',
  instructions: 'Instrucciones',
  note: 'Nota',
};

/** Subtle (i) with a hover legend explaining the highlight colors. */
function ColorLegend() {
  return (
    <span className="group/legend relative mr-2 flex shrink-0 items-center">
      <Info className="h-3.5 w-3.5 cursor-help text-amber-600/70 hover:text-amber-800" />
      <span className="pointer-events-none absolute right-0 top-6 z-50 hidden w-64 rounded-lg border border-gray-200 bg-white p-3 text-left font-normal normal-case shadow-lg group-hover/legend:block">
        <span className="mb-2 block text-[11px] font-semibold text-gray-700">
          Al comparar (tecla O), el resaltado:
        </span>
        <span className="mb-1.5 flex items-center gap-2 text-xs text-gray-600">
          <span className="inline-block h-3 w-4 shrink-0 rounded-sm bg-emerald-200/70" />
          Se agregó (está en la limpia, no en el original)
        </span>
        <span className="mb-1.5 flex items-center gap-2 text-xs text-gray-600">
          <span className="inline-block h-3 w-4 shrink-0 rounded-sm bg-red-200/70" />
          Se quitó (estaba en el original)
        </span>
        <span className="flex items-center gap-2 text-xs text-gray-600">
          <span className="inline-block h-3 w-4 shrink-0 rounded-sm bg-gray-200/60" />
          Solo formato (mayúsculas, fracciones)
        </span>
      </span>
    </span>
  );
}

/**
 * Thin, non-intrusive audit banner shown above each recipe in Book Review.
 * Collapsed by default. Green/quiet when safe, amber + expandable when the
 * cleaner changed actual content.
 */
export function RecipeAuditStrip({ audit }: { audit: RecipeAudit | null }) {
  const [open, setOpen] = useState(false);

  if (!audit) return null;

  if (audit.severity === 'no-clean') return null;

  if (audit.severity === 'manual') {
    return (
      <div className="mb-4 flex items-center gap-2 rounded border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs text-sky-700">
        <Eye className="h-3.5 w-3.5 shrink-0" />
        <span>Sin comparación automática — original es imagen o texto pegado. Verifica a mano.</span>
      </div>
    );
  }

  if (audit.severity !== 'content') {
    // identical or cosmetic — quiet, reassuring, takes almost no space
    return (
      <div className="mb-4 flex items-center gap-2 text-xs text-emerald-600">
        <Check className="h-3.5 w-3.5 shrink-0" />
        <span>Sin cambios de contenido{audit.severity === 'cosmetic' ? ' (solo formato)' : ''}</span>
      </div>
    );
  }

  const contentSections = audit.sections.filter((s) => s.changes.length > 0);

  return (
    <div className="mb-4 overflow-hidden rounded border border-amber-300 bg-amber-50">
      <div className="flex items-center">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex flex-1 items-center gap-2 px-3 py-2 text-left text-xs font-medium text-amber-800 hover:bg-amber-100/60"
        >
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          <span className="flex-1">
            Revisar · {audit.contentCount} {audit.contentCount === 1 ? 'cambio' : 'cambios'} en{' '}
            {contentSections.map((s) => SECTION_LABEL[s.section]).join(', ')}
          </span>
          {open ? <ChevronDown className="h-4 w-4 shrink-0" /> : <ChevronRight className="h-4 w-4 shrink-0" />}
        </button>
        <ColorLegend />
      </div>

      {open && (
        <div className="border-t border-amber-200 px-3 py-2">
          {contentSections.map((s) => (
            <div key={s.section} className="mb-2 last:mb-0">
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
                {SECTION_LABEL[s.section]}
              </p>
              <ul className="space-y-1">
                {s.changes.map((c, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-xs text-gray-700">
                    {c.kind === 'added' && <Plus className="mt-0.5 h-3 w-3 shrink-0 text-emerald-600" />}
                    {c.kind === 'removed' && <Minus className="mt-0.5 h-3 w-3 shrink-0 text-red-600" />}
                    {c.kind === 'changed' && <ArrowRight className="mt-0.5 h-3 w-3 shrink-0 text-amber-600" />}
                    {c.kind === 'added' && <span>Se agregó: <span className="font-medium">&ldquo;{c.after}&rdquo;</span></span>}
                    {c.kind === 'removed' && <span>Se quitó: <span className="font-medium">&ldquo;{c.before}&rdquo;</span></span>}
                    {c.kind === 'changed' && (
                      <span>
                        <span className="line-through text-gray-400">&ldquo;{c.before}&rdquo;</span>
                        {' → '}
                        <span className="font-medium">&ldquo;{c.after}&rdquo;</span>
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const MARK_CLASS: Record<RenderToken['mark'], string> = {
  equal: '',
  insert: 'bg-emerald-200/70 rounded-sm',
  delete: 'bg-red-200/70 rounded-sm',
  cosmetic: 'bg-gray-200/60 rounded-sm',
};

/**
 * Renders a section's text with word-level diff highlighting. Used inside the
 * side-by-side compare view so the eye jumps straight to what changed.
 * Newlines are preserved via whitespace-pre-wrap.
 */
export function HighlightedText({ tokens }: { tokens: RenderToken[] }) {
  return (
    <span className="whitespace-pre-wrap">
      {tokens.map((t, i) =>
        t.mark === 'equal'
          ? <span key={i}>{t.text}</span>
          : <span key={i} className={MARK_CLASS[t.mark]}>{t.text}</span>,
      )}
    </span>
  );
}
