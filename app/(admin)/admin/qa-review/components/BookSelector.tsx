'use client';

import { useEffect, useMemo, useState } from 'react';

export interface BookOption {
  id: string;
  couple_display_name: string;
  wedding_date: string | null;
  book_status: string;
  recipe_count: number;
  contributor_count: number;
}

interface AdminBookRow {
  id: string;
  couple_display_name: string;
  wedding_date: string | null;
  book_status: string;
  recipe_count: number;
  contributor_count: number;
}

interface Props {
  onSelect: (book: BookOption) => void;
}

const PRIORITY_STATUSES = ['ready_to_print', 'reviewed'];

export default function BookSelector({ onSelect }: Props) {
  const [books, setBooks] = useState<BookOption[] | null>(null);
  const [query, setQuery] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/v1/admin/books');
        if (!res.ok) {
          setError(`No pude cargar los libros (HTTP ${res.status})`);
          return;
        }
        const data = (await res.json()) as AdminBookRow[];
        setBooks(
          data.map((b) => ({
            id: b.id,
            couple_display_name: b.couple_display_name,
            wedding_date: b.wedding_date,
            book_status: b.book_status,
            recipe_count: b.recipe_count,
            contributor_count: b.contributor_count,
          })),
        );
      } catch (err) {
        setError((err as Error).message);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    if (!books) return [];
    const q = query.trim().toLowerCase();
    let list = books;
    if (!showAll) {
      list = list.filter((b) => PRIORITY_STATUSES.includes(b.book_status));
    }
    if (q) {
      list = list.filter((b) => b.couple_display_name.toLowerCase().includes(q));
    }
    return list;
  }, [books, query, showAll]);

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-red-200 p-6">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-1">Elige el libro</h2>
      <p className="text-sm text-gray-500 mb-4">
        Por default solo muestro los libros listos para imprimir o ya revisados. Activa &ldquo;mostrar todos&rdquo; si necesitas otro.
      </p>

      <div className="flex gap-3 mb-4">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nombre de la pareja…"
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-honey"
        />
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={showAll}
            onChange={(e) => setShowAll(e.target.checked)}
          />
          Mostrar todos
        </label>
      </div>

      {books === null ? (
        <p className="text-gray-500">Cargando…</p>
      ) : filtered.length === 0 ? (
        <p className="text-gray-500">
          No hay libros que coincidan. Activa &ldquo;mostrar todos&rdquo; o ajusta la búsqueda.
        </p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {filtered.map((book) => (
            <li key={book.id}>
              <button
                onClick={() => onSelect(book)}
                className="w-full flex items-center justify-between py-3 px-2 hover:bg-gray-50 rounded-lg text-left transition-colors"
              >
                <div>
                  <div className="font-medium text-gray-900">{book.couple_display_name}</div>
                  <div className="text-sm text-gray-500">
                    {book.recipe_count} recetas · {book.contributor_count} contributors
                    {book.wedding_date && ` · ${book.wedding_date}`}
                  </div>
                </div>
                <span className="text-xs uppercase tracking-wide px-2 py-1 rounded bg-gray-100 text-gray-600">
                  {book.book_status}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
