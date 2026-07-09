// app/(admin)/admin/delete/components/TrashTab.tsx
"use client";

import { useState, useEffect, useCallback } from 'react';
import { RotateCcw, Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TrashItem {
  id: string;
  entity_type: string;
  entity_label: string;
  counts: Record<string, number>;
  status: 'trashed' | 'restored' | 'purged';
  deleted_at: string;
  purgeAllowed: boolean;
}

export default function TrashTab() {
  const [items, setItems] = useState<TrashItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/admin/delete/trash-list');
      const result = await res.json();
      if (res.ok && result.success) setItems(result.data);
      else alert(`Error: ${result.error}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleRestore = async (item: TrashItem) => {
    if (!confirm(`¿Restaurar "${item.entity_label}"? Se re-insertan todas las filas del snapshot.`)) return;
    setBusy(item.id);
    try {
      const res = await fetch('/api/v1/admin/delete/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trashId: item.id }),
      });
      const result = await res.json();
      if (res.ok && result.success) {
        const conflictNote = result.conflicts?.length
          ? `\n\nConflictos omitidos (ya existían vivos): ${result.conflicts.map((c: { table: string; ids: string[] }) => `${c.table}:${c.ids.length}`).join(', ')}`
          : '';
        alert(`✅ Restaurado:\n${result.steps.join('\n')}${conflictNote}`);
        await load();
      } else {
        alert(`❌ ${result.error}`);
      }
    } finally {
      setBusy(null);
    }
  };

  const handlePurge = async (item: TrashItem) => {
    const typed = prompt(
      `PURGA DEFINITIVA de "${item.entity_label}".\n\nEsto NO se puede deshacer. Escribe el nombre exacto para confirmar:`
    );
    if (typed === null) return;
    setBusy(item.id);
    try {
      const res = await fetch('/api/v1/admin/delete/purge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trashId: item.id, confirmLabel: typed.trim() }),
      });
      const result = await res.json();
      if (res.ok && result.success) {
        alert('🔥 Purgado definitivamente. El registro de auditoría se conserva.');
        await load();
      } else {
        alert(`❌ ${result.error}`);
      }
    } finally {
      setBusy(null);
    }
  };

  const summarize = (counts: Record<string, number>) =>
    Object.entries(counts).map(([t, n]) => `${n} ${t}`).join(' · ') || 'vacío';

  return (
    <div className="bg-white rounded-lg shadow divide-y divide-gray-100">
      {loading ? (
        <div className="p-8 text-center text-gray-500 text-sm">Cargando papelera…</div>
      ) : items.length === 0 ? (
        <div className="p-8 text-center text-gray-500 text-sm">La papelera está vacía</div>
      ) : (
        items.map((item) => (
          <div key={item.id} className="flex items-center justify-between px-4 py-3">
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-mono">
                  {item.entity_type}
                </span>
                <span className="text-sm font-medium text-gray-900 truncate">{item.entity_label}</span>
                {item.status !== 'trashed' && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                    {item.status}
                  </span>
                )}
              </div>
              <span className="text-xs text-gray-500 truncate">
                {summarize(item.counts)} · {new Date(item.deleted_at).toLocaleString()}
              </span>
            </div>
            {item.status === 'trashed' && (
              <div className="flex items-center gap-2 flex-shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRestore(item)}
                  disabled={busy === item.id}
                >
                  <RotateCcw className="h-3.5 w-3.5 mr-1" /> Restaurar
                </Button>
                <Button
                  size="sm"
                  onClick={() => handlePurge(item)}
                  disabled={busy === item.id || !item.purgeAllowed}
                  title={item.purgeAllowed ? 'Purga definitiva' : 'Solo TEST sin pagos se puede purgar'}
                  className="bg-red-600 text-white hover:bg-red-700 disabled:bg-red-200"
                >
                  <Flame className="h-3.5 w-3.5 mr-1" /> Purgar
                </Button>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
