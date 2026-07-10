// app/(admin)/admin/delete/components/EntityTab.tsx
"use client";

import { useState, useEffect, useCallback } from 'react';
import { Search } from 'lucide-react';
import type { DeletableEntity } from '@/lib/admin/deletion/types';

export interface EntityListItem {
  id: string;
  label: string;
  sublabel: string;
  badges: string[];
  created_at: string;
}

const BADGE_STYLES: Record<string, string> = {
  PAID: 'bg-green-100 text-green-700',
  TEST: 'bg-purple-100 text-purple-700',
  HIDDEN: 'bg-gray-200 text-gray-600',
};

const BADGE_LABELS: Record<string, string> = {
  PAID: '🛡️ PAID',
  TEST: '🧪 TEST',
  HIDDEN: '👻 quitada del producto',
};

interface EntityTabProps {
  type: DeletableEntity;
  initialQuery: string;
  onSelect: (item: EntityListItem) => void;
}

export default function EntityTab({ type, initialQuery, onSelect }: EntityTabProps) {
  const [items, setItems] = useState<EntityListItem[]>([]);
  const [query, setQuery] = useState(initialQuery);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // Reason: AbortController evita que una respuesta lenta y vieja pise una búsqueda más reciente
  const load = useCallback(async (q: string, signal: AbortSignal) => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/v1/admin/delete/entities?type=${type}&q=${encodeURIComponent(q)}`,
        { signal }
      );
      const result = await res.json();
      if (res.ok && result.success) {
        setItems(result.data);
        setHasMore(Boolean(result.hasMore));
      } else alert(`Error: ${result.error}`);
      setLoading(false);
    } catch (err) {
      if (!(err instanceof DOMException && err.name === 'AbortError')) setLoading(false);
    }
  }, [type]);

  // Reason: paginación por offset — trae la siguiente página y la anexa
  const loadMore = useCallback(async () => {
    setLoadingMore(true);
    try {
      const res = await fetch(
        `/api/v1/admin/delete/entities?type=${type}&q=${encodeURIComponent(query)}&offset=${items.length}`
      );
      const result = await res.json();
      if (res.ok && result.success) {
        setItems((prev) => [...prev, ...result.data]);
        setHasMore(Boolean(result.hasMore));
      } else alert(`Error: ${result.error}`);
    } finally {
      setLoadingMore(false);
    }
  }, [type, query, items.length]);

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => load(query, controller.signal), 300);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, load]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 bg-white rounded-lg shadow p-3">
        <Search className="h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder={`Buscar ${type}s…`}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 px-2 py-1 text-sm border-0 focus:outline-none"
        />
      </div>
      <div className="bg-white rounded-lg shadow divide-y divide-gray-100">
        {loading ? (
          <div className="p-8 text-center text-gray-500 text-sm">Cargando…</div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">Sin resultados</div>
        ) : (
          items.map((item) => (
            <button
              key={item.id}
              onClick={() => onSelect(item)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 text-left"
            >
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-900">{item.label}</span>
                <span className="text-xs text-gray-500">{item.sublabel}</span>
              </div>
              <div className="flex items-center gap-2">
                {item.badges.map((b) => (
                  <span key={b} className={`text-xs px-2 py-0.5 rounded-full font-medium ${BADGE_STYLES[b] || 'bg-gray-100 text-gray-600'}`}>
                    {BADGE_LABELS[b] || b}
                  </span>
                ))}
                <span className="text-xs text-gray-400">
                  {new Date(item.created_at).toLocaleDateString()}
                </span>
              </div>
            </button>
          ))
        )}
        {!loading && hasMore && (
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="w-full px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
          >
            {loadingMore ? 'Cargando…' : `Cargar 50 más (mostrando ${items.length})`}
          </button>
        )}
      </div>
    </div>
  );
}
