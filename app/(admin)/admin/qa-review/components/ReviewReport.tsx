'use client';

import { useEffect, useState } from 'react';
import type { QAFinding, QAReviewRow, QASeverity } from '@/lib/qa-review/types';

interface Props {
  reviewId: string;
  onDone: () => void;
}

const SEVERITY_META: Record<
  QASeverity,
  { label: string; rowBg: string; pillBg: string; pillText: string }
> = {
  critical: {
    label: 'Crítico',
    rowBg: 'border-red-200 bg-red-50',
    pillBg: 'bg-red-100',
    pillText: 'text-red-700',
  },
  warning: {
    label: 'Warning',
    rowBg: 'border-amber-200 bg-amber-50',
    pillBg: 'bg-amber-100',
    pillText: 'text-amber-700',
  },
  info: {
    label: 'Info',
    rowBg: 'border-gray-200 bg-gray-50',
    pillBg: 'bg-gray-200',
    pillText: 'text-gray-700',
  },
};

function categoryLabel(category: string): string {
  return category.replace(/_/g, ' ');
}

export default function ReviewReport({ reviewId, onDone }: Props) {
  const [review, setReview] = useState<QAReviewRow | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/v1/admin/qa-review/${reviewId}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as QAReviewRow;
        setReview(data);
      } catch (err) {
        setError((err as Error).message);
      }
    })();
  }, [reviewId]);

  async function retry() {
    setRetrying(true);
    try {
      const res = await fetch(`/api/v1/admin/qa-review/${reviewId}/retry`, { method: 'POST' });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error || 'Retry falló');
      }
      // Bounce back to the polling phase
      onDone();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setRetrying(false);
    }
  }

  async function discard() {
    if (!confirm('¿Descartar esta revisión? Se borra el reporte y el PDF.')) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/v1/admin/qa-review/${reviewId}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error || 'Delete falló');
      }
      onDone();
    } catch (err) {
      setError((err as Error).message);
      setDeleting(false);
    }
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-red-200 p-6">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }
  if (!review) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <p className="text-gray-500">Cargando reporte…</p>
      </div>
    );
  }

  if (review.status === 'failed') {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-red-200 p-6">
        <h2 className="text-xl font-semibold text-red-700 mb-2">La revisión falló</h2>
        <p className="text-sm text-gray-700 whitespace-pre-wrap">
          {review.error_message || 'Sin detalle.'}
        </p>
        <p className="text-xs text-gray-500 mt-3">
          El PDF que subiste sigue en Storage. Puedes reintentar sin volver a subirlo.
        </p>
        <div className="flex gap-3 mt-6">
          <button
            onClick={retry}
            disabled={retrying || deleting}
            className="px-4 py-2 bg-brand-honey text-white rounded-lg font-medium disabled:opacity-50"
          >
            {retrying ? 'Reintentando…' : 'Reintentar'}
          </button>
          <button
            onClick={discard}
            disabled={retrying || deleting}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium disabled:opacity-50"
          >
            {deleting ? 'Descartando…' : 'Descartar'}
          </button>
        </div>
      </div>
    );
  }

  const findings = (review.findings || []) as QAFinding[];
  const grouped: Record<QASeverity, QAFinding[]> = {
    critical: findings.filter((f) => f.severity === 'critical'),
    warning: findings.filter((f) => f.severity === 'warning'),
    info: findings.filter((f) => f.severity === 'info'),
  };

  return (
    <div className="space-y-4">
      {/* Summary card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Reporte de QA</h2>
          <div className="text-sm text-gray-500">
            {review.pdf_page_count != null ? `${review.pdf_page_count} pp · ` : ''}
            {review.duration_ms != null ? `${(review.duration_ms / 1000).toFixed(1)}s · ` : ''}
            {review.cost_usd != null ? `$${review.cost_usd.toFixed(4)}` : ''}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4">
          {(['critical', 'warning', 'info'] as QASeverity[]).map((sev) => (
            <div key={sev} className={`rounded-lg border p-3 ${SEVERITY_META[sev].rowBg}`}>
              <div className="text-2xl font-bold text-gray-900">{grouped[sev].length}</div>
              <div className="text-xs uppercase tracking-wide text-gray-600">
                {SEVERITY_META[sev].label}
              </div>
            </div>
          ))}
        </div>

        {review.human_summary && (
          <div className="prose prose-sm max-w-none whitespace-pre-wrap text-gray-700">
            {review.human_summary}
          </div>
        )}

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onDone}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-700"
          >
            Cerrar y revisar otro libro
          </button>
          <button
            onClick={discard}
            disabled={deleting}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium disabled:opacity-50"
          >
            {deleting ? 'Descartando…' : 'Descartar revisión'}
          </button>
        </div>
      </div>

      {/* Findings list */}
      {findings.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-green-200 p-6 text-center">
          <div className="text-4xl mb-2">✅</div>
          <p className="text-gray-700">
            No encontré problemas. El libro se ve bien según el agente.
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Esto NO reemplaza el preflight de InDesign ni el ojo humano final.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {(['critical', 'warning', 'info'] as QASeverity[]).map((sev) =>
            grouped[sev].length === 0 ? null : (
              <div key={sev}>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-700 mb-2">
                  {SEVERITY_META[sev].label} ({grouped[sev].length})
                </h3>
                <ul className="space-y-2">
                  {grouped[sev].map((finding, i) => (
                    <li
                      key={`${sev}-${i}`}
                      className={`rounded-lg border p-4 ${SEVERITY_META[sev].rowBg}`}
                    >
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span
                          className={`text-xs px-2 py-0.5 rounded uppercase tracking-wide ${SEVERITY_META[sev].pillBg} ${SEVERITY_META[sev].pillText}`}
                        >
                          {categoryLabel(finding.category)}
                        </span>
                        {finding.page != null && (
                          <span className="text-xs px-2 py-0.5 rounded bg-white border border-gray-200 text-gray-700">
                            página {finding.page}
                          </span>
                        )}
                        <span className="text-xs text-gray-500">
                          {finding.source === 'deterministic' ? 'DB cross-check' : 'visión Gemini'}
                          {finding.confidence != null
                            ? ` · ${Math.round(finding.confidence * 100)}% confianza`
                            : ''}
                        </span>
                      </div>
                      <div className="text-gray-900">{finding.description}</div>
                      {finding.suggestion && (
                        <div className="text-sm text-gray-600 mt-1">
                          <span className="font-medium">Sugerencia:</span> {finding.suggestion}
                        </div>
                      )}
                      {(finding.db_value || finding.pdf_value) && (
                        <div className="grid md:grid-cols-2 gap-3 mt-3 text-xs">
                          {finding.db_value && (
                            <div className="bg-white rounded border border-gray-200 p-2">
                              <div className="font-semibold text-gray-500 uppercase tracking-wide mb-1">
                                Esperado (DB)
                              </div>
                              <div className="whitespace-pre-wrap text-gray-800">
                                {finding.db_value}
                              </div>
                            </div>
                          )}
                          {finding.pdf_value && (
                            <div className="bg-white rounded border border-gray-200 p-2">
                              <div className="font-semibold text-gray-500 uppercase tracking-wide mb-1">
                                En el PDF
                              </div>
                              <div className="whitespace-pre-wrap text-gray-800">
                                {finding.pdf_value}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ),
          )}
        </div>
      )}
    </div>
  );
}
