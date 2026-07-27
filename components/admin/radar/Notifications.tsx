'use client';
import { useCallback, useEffect, useState } from 'react';
import type { RadarNotificationRow } from '@/lib/radar/monitor-types';

const RANK: Record<string, number> = { high: 0, medium: 1, low: 2 };
type Row = RadarNotificationRow & { groups?: { name: string } | null };

export default function NotificationsDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/v1/admin/radar/notifications');
    const json = await res.json();
    const list: Row[] = json.notifications ?? [];
    list.sort(
      (a, b) =>
        RANK[a.priority] - RANK[b.priority] ||
        (b.signals?.client_coldness_days ?? 0) - (a.signals?.client_coldness_days ?? 0)
    );
    setRows(list);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const patch = async (id: string, status: 'attended' | 'dismissed') => {
    await fetch('/api/v1/admin/radar/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    });
    setRows((r) => r.filter((x) => x.id !== id));
  };

  const regenerate = async () => {
    setBusy(true);
    await fetch('/api/v1/admin/radar/notifications/regenerate', { method: 'POST' });
    await load();
    setBusy(false);
  };

  const count = rows.length;
  const hasHigh = rows.some((r) => r.priority === 'high');
  const badgeColor = hasHigh && count > 0 ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-700';

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setIsOpen(true)}
        className="relative flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 shadow transition-colors hover:bg-gray-50"
        aria-label="Abrir notificaciones"
      >
        <span className="text-base">🔔</span>
        <span
          className={`min-w-[1.25rem] rounded-full px-1.5 py-0.5 text-center text-xs font-semibold ${badgeColor}`}
        >
          {count}
        </span>
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-49 bg-black/40"
          style={{ zIndex: 49 }}
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed right-0 top-0 z-50 flex h-screen w-[380px] max-w-[90vw] flex-col bg-white shadow-2xl transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Drawer header */}
        <div className="flex flex-shrink-0 items-center gap-3 border-b border-gray-100 p-4">
          <h2 className="flex-1 text-sm font-semibold uppercase tracking-wide text-gray-500">
            Notificaciones
          </h2>
          <span
            className={`min-w-[1.25rem] rounded-full px-1.5 py-0.5 text-center text-xs font-semibold ${badgeColor}`}
          >
            {count}
          </span>
          <button
            onClick={() => void regenerate()}
            disabled={busy}
            className="text-sm text-gray-500 hover:text-gray-900 disabled:opacity-50"
          >
            {busy ? 'Regenerando…' : 'Regenerar ahora'}
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="ml-1 rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        {/* Drawer body */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <p className="text-sm text-gray-400">Cargando…</p>
          ) : rows.length === 0 ? (
            <p className="text-sm text-gray-400">Todo en orden. Ningún libro en riesgo hoy.</p>
          ) : (
            <ul className="space-y-3">
              {rows.map((n) => (
                <NotificationCard
                  key={n.id}
                  n={n}
                  onAttend={() => void patch(n.id, 'attended')}
                  onDismiss={() => void patch(n.id, 'dismissed')}
                />
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}

function NotificationCard({
  n,
  onAttend,
  onDismiss,
}: {
  n: Row;
  onAttend: () => void;
  onDismiss: () => void;
}) {
  const [open, setOpen] = useState(false);
  const color =
    n.priority === 'high'
      ? 'bg-red-100 text-red-700'
      : n.priority === 'medium'
        ? 'bg-amber-100 text-amber-700'
        : 'bg-gray-100 text-gray-600';

  return (
    <li className="rounded-xl border border-gray-100 p-4">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-3 text-left"
      >
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${color}`}>
          {n.priority}
        </span>
        <span className="flex-1 text-sm font-medium text-gray-900">{n.headline}</span>
        <span className="text-xs text-gray-400">{n.groups?.name}</span>
      </button>
      {open && (
        <div className="mt-3 space-y-3 text-sm text-gray-700">
          <p>{n.interpretation}</p>
          <p className="text-gray-500">
            <strong className="text-gray-700">Qué haría:</strong> {n.recommended_action}
          </p>
          <div className="rounded-lg bg-gray-50 p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs uppercase tracking-wide text-gray-400">Borrador</span>
              <button
                onClick={() => void navigator.clipboard.writeText(n.draft_message)}
                className="text-xs text-gray-500 hover:text-gray-900"
              >
                Copiar
              </button>
            </div>
            <p className="whitespace-pre-wrap text-gray-800">{n.draft_message}</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={onAttend}
              className="rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-medium text-white"
            >
              Marcar atendido
            </button>
            <button
              onClick={onDismiss}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-600"
            >
              Descartar
            </button>
          </div>
        </div>
      )}
    </li>
  );
}
