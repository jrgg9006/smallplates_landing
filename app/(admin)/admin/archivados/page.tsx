'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';

type ArchivedBook = {
  id: string;
  name: string;
  archived_at: string | null;
  archived_reason: string | null;
};

export default function ArchivadosPage() {
  const [books, setBooks] = useState<ArchivedBook[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/v1/admin/archived');
    const json = await res.json();
    setBooks(json.archived ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const reactivate = async (groupId: string) => {
    if (!window.confirm('¿Reactivar este libro? Vuelve a aparecer en el radar y en el resto del admin.')) {
      return;
    }
    await fetch('/api/v1/admin/archived', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ groupId }),
    });
    setBooks((b) => b.filter((x) => x.id !== groupId));
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

        <div className="mt-8 overflow-hidden rounded-xl bg-white shadow">
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
