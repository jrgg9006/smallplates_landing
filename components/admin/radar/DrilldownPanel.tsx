'use client';

import { Fragment, useState } from 'react';
import type { DetailItem } from '@/lib/radar/types';
import { feedDayLabel, feedTime } from './timeAgo';

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
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

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
          {items.map((item, i) => {
            const label = feedDayLabel(item.at);
            const showDivider = i === 0 || label !== feedDayLabel(items[i - 1].at);
            return (
              <Fragment key={item.id}>
                {showDivider && (
                  <li className="flex items-center gap-2 pt-2 first:pt-0">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                      {label}
                    </span>
                    <span className="h-px flex-1 bg-gray-200" />
                  </li>
                )}
                {item.recipes ? (
                  <li className="text-sm">
                    <p className="text-gray-800">
                      {item.text} ·{' '}
                      {item.recipes.length === 0 ? (
                        <span className="text-gray-400">sin recetas</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => toggle(item.id)}
                          className="text-gray-600 underline decoration-gray-300 decoration-dotted underline-offset-2 hover:decoration-gray-500"
                        >
                          {item.recipes.length === 1 ? '1 receta' : `${item.recipes.length} recetas`}{' '}
                          {expanded.has(item.id) ? '▾' : '▸'}
                        </button>
                      )}
                    </p>
                    <p className="text-xs text-gray-400">{feedTime(item.at)}</p>
                    {expanded.has(item.id) && item.recipes.length > 0 && (
                      <ul className="mt-1.5 space-y-1 border-l-2 border-gray-100 pl-3">
                        {item.recipes.map((r) => (
                          <li key={r.id}>
                            <button
                              type="button"
                              onClick={() => onOpenRecipe(r.id)}
                              className="text-left text-gray-700 underline decoration-gray-300 decoration-dotted underline-offset-2 hover:decoration-gray-500"
                            >
                              {r.name}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ) : item.recipeId ? (
                  <li className="text-sm">
                    <button
                      type="button"
                      onClick={() => onOpenRecipe(item.recipeId!)}
                      className="text-left"
                    >
                      <p className="text-gray-800 underline decoration-gray-300 decoration-dotted underline-offset-2 hover:decoration-gray-500">
                        {item.text}
                      </p>
                      <p className="text-xs text-gray-400">{feedTime(item.at)}</p>
                    </button>
                  </li>
                ) : (
                  <li className="text-sm">
                    <p className="text-gray-800">{item.text}</p>
                    <p className="text-xs text-gray-400">{feedTime(item.at)}</p>
                  </li>
                )}
              </Fragment>
            );
          })}
        </ul>
      )}
    </div>
  );
}
