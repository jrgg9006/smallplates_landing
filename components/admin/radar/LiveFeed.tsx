'use client';

import { Fragment } from 'react';
import type { FeedItem, FeedKind } from '@/lib/radar/types';
import { InfoTip } from './InfoTip';
import { feedDayLabel, feedTime } from './timeAgo';

const KIND_ICON: Record<FeedKind, string> = {
  signup: '👋',
  book_created: '📖',
  recipe_created: '🍲',
  recipe_edited: '✏️',
  recipe_deleted: '🗑️',
  guest_added: '👤',
  email_sent: '✉️',
  order: '💰',
  share: '🔗',
  couple_image: '📸',
};

export function LiveFeed({
  items,
  onOpenRecipe,
}: {
  items: FeedItem[];
  onOpenRecipe: (recipeId: string, editId?: string) => void;
}) {
  return (
    <div className="rounded-xl bg-white p-5 shadow-lg">
      <div className="mb-3 flex items-center text-sm font-semibold uppercase tracking-wide text-gray-700">
        Feed en vivo
        <InfoTip text="Las últimas 100 acciones de usuarios en la plataforma, de todas las fuentes, más reciente primero. Se actualiza cada 60 segundos." />
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-gray-400">Sin actividad reciente.</p>
      ) : (
        <ul className="max-h-[150vh] space-y-3 overflow-y-auto pr-1">
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
                <li className="flex items-start gap-2.5 text-sm">
                  <span className="mt-0.5 text-base leading-none">{KIND_ICON[item.kind]}</span>
                  {item.recipeId ? (
                    <button
                      type="button"
                      onClick={() => onOpenRecipe(item.recipeId!, item.editId)}
                      className="min-w-0 text-left"
                    >
                      <p className="text-gray-800 underline decoration-gray-300 decoration-dotted underline-offset-2 hover:decoration-gray-500">
                        {item.text}
                      </p>
                      <p className="text-xs text-gray-400">{feedTime(item.at)}</p>
                    </button>
                  ) : (
                    <div className="min-w-0">
                      <p className="text-gray-800">{item.text}</p>
                      <p className="text-xs text-gray-400">{feedTime(item.at)}</p>
                    </div>
                  )}
                </li>
              </Fragment>
            );
          })}
        </ul>
      )}
    </div>
  );
}
