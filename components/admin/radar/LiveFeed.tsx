'use client';

import type { FeedItem, FeedKind } from '@/lib/radar/types';
import { InfoTip } from './InfoTip';
import { timeAgo } from './timeAgo';

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

export function LiveFeed({ items }: { items: FeedItem[] }) {
  return (
    <div className="rounded-xl bg-white p-5 shadow-lg">
      <div className="mb-3 flex items-center text-sm font-semibold uppercase tracking-wide text-gray-700">
        Feed en vivo
        <InfoTip text="Las últimas 50 acciones de usuarios en la plataforma, de todas las fuentes, más reciente primero. Se actualiza cada 60 segundos." />
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-gray-400">Sin actividad reciente.</p>
      ) : (
        <ul className="max-h-[70vh] space-y-3 overflow-y-auto pr-1">
          {items.map((item) => (
            <li key={item.id} className="flex items-start gap-2.5 text-sm">
              <span className="mt-0.5 text-base leading-none">{KIND_ICON[item.kind]}</span>
              <div className="min-w-0">
                <p className="text-gray-800">{item.text}</p>
                <p className="text-xs text-gray-400">{timeAgo(item.at)}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
