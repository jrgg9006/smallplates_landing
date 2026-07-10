// app/(admin)/admin/delete/components/DeletePreviewSheet.tsx
"use client";

import { useState, useEffect, useRef } from 'react';
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

// Reason: tablas de plomería (junctions, pipelines de imagen, estados de producción)
// — se borran igual, pero van colapsadas para que el ojo caiga en lo importante
const TECHNICAL_TABLES = new Set([
  'cookbook_recipes',
  'group_recipes',
  'group_invitations',
  'communication_log',
  'book_qa_reviews',
  'image_processing_queue',
  'midjourney_prompts',
  'prompt_evaluations',
  'recipe_annex_images',
  'recipe_edit_history',
  'recipe_print_ready',
  'recipe_production_status',
]);

function rowLabel(table: string, row: Record<string, unknown>): string {
  const fields = DISPLAY_FIELDS[table] || ['id'];
  const label = fields.map((f) => String(row[f] ?? '')).filter(Boolean).join(' · ');
  if (label) return label;
  if (typeof row.id === 'string') return row.id;
  // Reason: junctions sin id (group_recipes, group_members) — mostrar la clave compuesta
  return Object.entries(row)
    .filter(([k, v]) => k.endsWith('_id') && v)
    .map(([k, v]) => `${k}: ${String(v).slice(0, 8)}…`)
    .join(' · ') || '(fila)';
}

type PreviewData = DeletionSnapshot & { context?: Record<string, string> };

export default function DeletePreviewSheet({ entityType, entityId, onClose, onTrashed }: Props) {
  const [snapshot, setSnapshot] = useState<PreviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmText, setConfirmText] = useState('');
  const [memberAction, setMemberAction] = useState<'transfer' | 'delete' | ''>('');
  const [busy, setBusy] = useState(false);
  // Reason: guardamos trashId además de steps para distinguir entre "enviado a
  // papelera" (trashId !== null) y "grupo transferido" (trashId === null).
  const [result, setResult] = useState<{ steps: string[]; trashId: string | null } | null>(null);

  // Reason: refs para callbacks del padre — evita re-fetch si el padre pasa
  // funciones inline (nueva referencia en cada render) y double-call de onTrashed
  const onCloseRef = useRef(onClose);
  const onTrashedRef = useRef(onTrashed);
  onCloseRef.current = onClose;
  onTrashedRef.current = onTrashed;
  const finishedRef = useRef(false);

  const finish = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    onTrashedRef.current();
  };

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/v1/admin/delete/preview?type=${entityType}&id=${entityId}`);
        const data = await res.json();
        if (res.ok && data.success) setSnapshot(data.data);
        else {
          alert(`Error: ${data.error}`);
          onCloseRef.current();
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [entityType, entityId]);

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
      const data = await res.json();
      if (res.ok && data.success) {
        setResult({ steps: data.steps, trashId: data.trashId ?? null });
      } else {
        alert(`❌ ${data.error}`);
      }
    } finally {
      setBusy(false);
    }
  };

  // Reason: memberChoiceRequired indica que hay grupos con miembros ajenos que
  // requieren una decisión explícita; un warning de libro en producción no bloquea.
  const needsMemberChoice = snapshot?.protection.memberChoiceRequired ?? false;
  const canTrash =
    !!snapshot &&
    !snapshot.protection.blocked &&
    confirmText.trim() === snapshot.entityLabel &&
    (!needsMemberChoice || memberAction !== '');

  return (
    <Dialog open onOpenChange={(open) => !open && (result ? finish() : onClose())}>
      <DialogContent className="sm:max-w-[640px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl font-semibold">
            {result
              ? result.trashId
                ? 'Enviado a papelera'
                : 'Grupo transferido'
              : `Borrar ${entityType}`}
          </DialogTitle>
          <DialogDescription>{snapshot?.entityLabel}</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-center text-sm text-gray-500">Cargando preview de cascada…</div>
        ) : result ? (
          <div className="py-4 space-y-2">
            {result.steps.map((s, i) => (
              <div key={i} className="text-sm text-gray-800 font-mono">{s} ✓</div>
            ))}
            {result.trashId ? (
              <p className="text-xs text-gray-500 pt-2">Restaurable desde la Papelera cuando quieras.</p>
            ) : (
              <p className="text-xs text-gray-500 pt-2">El grupo sobrevive con otro dueño — nada se borró.</p>
            )}
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

            {snapshot.context && Object.keys(snapshot.context).length > 0 && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-1">
                <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Contexto</p>
                {Object.entries(snapshot.context).map(([label, value]) => (
                  <div key={label} className="flex justify-between gap-3 text-xs">
                    <span className="text-gray-500">{label}:</span>
                    <span className="text-gray-900 font-medium text-right">{value}</span>
                  </div>
                ))}
              </div>
            )}

            {(() => {
              const entries = Object.entries(snapshot.tables);
              const main = entries.filter(([t]) => !TECHNICAL_TABLES.has(t));
              const technical = entries.filter(([t]) => TECHNICAL_TABLES.has(t));
              const technicalRows = technical.reduce(
                (sum, [t, rows]) => sum + (snapshot.counts[t] ?? rows.length), 0
              );
              const renderTable = ([table, rows]: [string, Record<string, unknown>[]]) => (
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
              );
              return (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 space-y-3">
                  <p className="text-xs font-semibold text-red-900 uppercase tracking-wide">
                    Esto se lleva a la papelera:
                  </p>
                  {main.map(renderTable)}
                  {technical.length > 0 && (
                    <div className="border-t border-red-200 pt-2 space-y-3">
                      <p className="text-xs text-red-700 font-medium">Tablas técnicas</p>
                      {technical.map(renderTable)}
                    </div>
                  )}
                </div>
              );
            })()}

            {snapshot.protection.warnings.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 space-y-2">
                {snapshot.protection.warnings.map((w, i) => (
                  <p key={i} className="text-sm text-yellow-900 font-medium">⚠️ {w}</p>
                ))}
                {needsMemberChoice && (
                  <>
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
                  </>
                )}
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
          {result ? (
            <Button onClick={finish} className="bg-gray-900 text-white">Listo</Button>
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
