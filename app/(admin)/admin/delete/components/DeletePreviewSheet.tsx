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
        const result = await res.json();
        if (res.ok && result.success) setSnapshot(result.data);
        else {
          alert(`Error: ${result.error}`);
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
    <Dialog open onOpenChange={(open) => !open && (steps ? finish() : onClose())}>
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
