'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';

type ArchivedBook = {
  id: string;
  name: string;
  archived_at: string | null;
  archived_reason: string | null;
};
type ArchivableBook = { id: string; name: string };

export default function ArchivadosPage() {
  const [books, setBooks] = useState<ArchivedBook[]>([]);
  const [archivable, setArchivable] = useState<ArchivableBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState('');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/v1/admin/archived');
    const json = await res.json();
    setBooks(json.archived ?? []);
    setArchivable(json.archivable ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const archive = async () => {
    if (!selectedId) return;
    setBusy(true);
    const res = await fetch('/api/v1/admin/archived', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ groupId: selectedId, reason }),
    });
    setBusy(false);
    if (!res.ok) {
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      window.alert(j.error ?? 'No se pudo archivar.');
      return;
    }
    setSelectedId('');
    setReason('');
    await load();
  };

  const reactivate = async (groupId: string) => {
    if (!window.confirm('¿Reactivar este libro? Vuelve a aparecer en el radar y en el resto del admin.')) {
      return;
    }
    await fetch('/api/v1/admin/archived', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ groupId }),
    });
    await load();
  };

  const formatDate = (iso: string | null) =>
    iso
      ? new Date(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })
      : '—';

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-4xl">
        <Link href="/admin" className="text-sm text-gray-500 hover:text-gray-900">
          ← Back to Admin
        </Link>
        <h1 className="mt-2 text-3xl font-bold text-gray-900">🪦 Archivados</h1>
        <p className="mt-1 text-gray-600">
          Libros dados por muerto. No se borra nada: están escondidos de todos los paneles y puedes
          reactivarlos cuando quieras.
        </p>

        {/* Archive a book from here */}
        <div className="mt-8 rounded-xl bg-white p-5 shadow">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
            Dar por muerto un libro
          </h2>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="min-w-0 flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800"
            >
              <option value="">Selecciona un libro…</option>
              {archivable.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Razón (opcional)"
              className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800"
            />
            <button
              onClick={() => void archive()}
              disabled={!selectedId || busy}
              className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
            >
              {busy ? 'Archivando…' : 'Dar por muerto'}
            </button>
          </div>
          <p className="mt-2 text-xs text-gray-400">
            Los libros que ya pagaron no aparecen como opción de borrado y no se pueden archivar.
          </p>
        </div>

        <div className="mt-6 overflow-hidden rounded-xl bg-white shadow">
          {loading ? (
            <p className="p-6 text-sm text-gray-400">Cargando…</p>
          ) : books.length === 0 ? (
            <p className="p-6 text-sm text-gray-400">No hay libros archivados.</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-400">
                <tr>
                  <th className="px-6 py-3 font-semibold">Libro</th>
                  <th className="px-6 py-3 font-semibold">Cuándo</th>
                  <th className="px-6 py-3 font-semibold">Razón</th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody>
                {books.map((b) => (
                  <tr key={b.id} className="border-b border-gray-50 last:border-0">
                    <td className="px-6 py-4 font-medium text-gray-900">{b.name}</td>
                    <td className="px-6 py-4 text-gray-500">{formatDate(b.archived_at)}</td>
                    <td className="px-6 py-4 text-gray-600">
                      {b.archived_reason || <span className="text-gray-300">sin nota</span>}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => void reactivate(b.id)}
                        className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                      >
                        Reactivar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
