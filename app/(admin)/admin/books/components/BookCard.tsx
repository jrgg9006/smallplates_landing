'use client';

import { EyeOff, RotateCcw } from 'lucide-react';
import type { BookStatus } from '@/lib/types/database';

export interface BookSummary {
  id: string;
  name: string;
  couple_display_name: string;
  wedding_date: string | null;
  book_status: BookStatus;
  book_notes: string | null;
  book_reviewed_at: string | null;
  contributor_count: number;
  recipe_count: number;
  print_ready_count: number;
  owner_names: string[];
  created_at: string;
}

const STATUS_BORDER: Record<BookStatus, string> = {
  active: 'border-l-blue-500',
  reviewed: 'border-l-amber-500',
  ready_to_print: 'border-l-green-500',
  printed: 'border-l-gray-400',
  inactive: 'border-l-gray-300',
};

interface BookCardProps {
  book: BookSummary;
  onClick: (book: BookSummary) => void;
  onStatusChange?: (bookId: string, newStatus: BookStatus) => void;
}

export default function BookCard({ book, onClick, onStatusChange }: BookCardProps) {
  const weddingDate = book.wedding_date
    ? new Date(book.wedding_date).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric'
      })
    : 'No date set';

  const isInactive = book.book_status === 'inactive';

  const handleQuickAction = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onStatusChange) return;
    onStatusChange(book.id, isInactive ? 'active' : 'inactive');
  };

  return (
    <div
      onClick={() => onClick(book)}
      className={`bg-white rounded-lg border-l-4 ${STATUS_BORDER[book.book_status]} shadow-sm hover:shadow-md transition-shadow cursor-pointer p-4 ${
        isInactive ? 'opacity-60' : ''
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-semibold text-sm text-gray-900 leading-tight">
          {book.couple_display_name}
        </h3>
        <div className="flex items-center gap-1.5 ml-2 shrink-0">
          <span className="text-[10px] font-mono text-gray-400">
            {book.id.slice(0, 8)}
          </span>
          {onStatusChange && (
            <button
              onClick={handleQuickAction}
              className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
              title={isInactive ? 'Reactivate' : 'Mark inactive'}
            >
              {isInactive
                ? <RotateCcw className="w-3.5 h-3.5" />
                : <EyeOff className="w-3.5 h-3.5" />
              }
            </button>
          )}
        </div>
      </div>

      <p className="text-xs text-gray-500 mb-3">{weddingDate}</p>

      <div className="flex items-center gap-3 text-xs text-gray-600">
        <span>{book.recipe_count} recipes</span>
        <span className="text-gray-300">|</span>
        <span>{book.contributor_count} contributors</span>
      </div>

      <div className="mt-2 text-xs">
        <span className={
          book.print_ready_count === book.recipe_count && book.recipe_count > 0
            ? 'text-green-600' : 'text-amber-600'
        }>
          {book.print_ready_count}/{book.recipe_count} print-ready
        </span>
      </div>

      {book.owner_names.length > 0 && (
        <p className="mt-2 text-[11px] text-gray-400 truncate">
          {book.owner_names.join(', ')}
        </p>
      )}
    </div>
  );
}
