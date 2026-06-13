'use client';

import type { DetailItem } from '@/lib/radar/types';
import { timeAgo } from './timeAgo';

export function DrilldownPanel({
  title,
  items,
  onClose,
  onOpenRecipe,
}: {
  title: string;
  items: DetailItem[];
  onClose: () => void;
  onOpenRecipe: (recipeId: string) => void;
}) {
  return (
    <div className="rounded-xl bg-white p-5 shadow-lg ring-2 ring-[#D4A854]/40">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-semibold uppercase tracking-wide text-gray-700">
          {title} <span className="text-gray-400">({items.length})</span>
        </span>
        <button
          onClick={onClose}
          aria-label="Cerrar"
          className="rounded-md px-2 py-0.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
        >
          ✕
        </button>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-gray-400">Nada en este periodo.</p>
      ) : (
        <ul className="max-h-[60vh] space-y-2.5 overflow-y-auto pr-1">
          {items.map((item) =>
            item.recipeId ? (
              <li key={item.id} className="text-sm">
                <button
                  type="button"
                  onClick={() => onOpenRecipe(item.recipeId!)}
                  className="text-left"
                >
                  <p className="text-gray-800 underline decoration-gray-300 decoration-dotted underline-offset-2 hover:decoration-gray-500">
                    {item.text}
                  </p>
                  <p className="text-xs text-gray-400">{timeAgo(item.at)}</p>
                </button>
              </li>
            ) : (
              <li key={item.id} className="text-sm">
                <p className="text-gray-800">{item.text}</p>
                <p className="text-xs text-gray-400">{timeAgo(item.at)}</p>
              </li>
            )
          )}
        </ul>
      )}
    </div>
  );
}
