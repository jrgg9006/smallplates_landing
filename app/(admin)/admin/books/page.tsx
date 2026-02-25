'use client';

import { useEffect, useState, useCallback } from 'react';
import { createSupabaseClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { isAdminEmail } from '@/lib/config/admin';
import Link from 'next/link';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import type { BookStatus } from '@/lib/types/database';
import BookCard, { type BookSummary } from './components/BookCard';
import BookDetailSheet from './components/BookDetailSheet';

const COLUMNS: { status: BookStatus; label: string; color: string; bgColor: string }[] = [
  { status: 'active', label: 'Active', color: 'text-blue-700', bgColor: 'bg-blue-50 border-blue-200' },
  { status: 'reviewed', label: 'In Review', color: 'text-amber-700', bgColor: 'bg-amber-50 border-amber-200' },
  { status: 'ready_to_print', label: 'Ready to Print', color: 'text-green-700', bgColor: 'bg-green-50 border-green-200' },
  { status: 'printed', label: 'Printed', color: 'text-gray-600', bgColor: 'bg-gray-50 border-gray-200' },
];

export default function AdminBooksPage() {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [books, setBooks] = useState<BookSummary[]>([]);
  const [selectedBook, setSelectedBook] = useState<BookSummary | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [showInactive, setShowInactive] = useState(false);
  const router = useRouter();

  useEffect(() => {
    checkAdminAndLoad();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkAdminAndLoad = async () => {
    const supabase = createSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !isAdminEmail(user.email)) {
      router.push('/');
      return;
    }

    setIsAdmin(true);
    await fetchBooks();
    setLoading(false);
  };

  const fetchBooks = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/admin/books');
      if (res.ok) {
        const data = await res.json();
        setBooks(data);
      }
    } catch {
      // Silently fail — user can refresh
    }
  }, []);

  const handleCardClick = (book: BookSummary) => {
    setSelectedBook(book);
    setSheetOpen(true);
  };

  const handleStatusChange = () => {
    fetchBooks();
  };

  const handleQuickStatusChange = async (bookId: string, newStatus: BookStatus) => {
    try {
      const res = await fetch(`/api/v1/admin/books/${bookId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ book_status: newStatus }),
      });
      if (res.ok) fetchBooks();
    } catch {
      // Silently fail
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!isAdmin) return null;

  const booksByStatus = (status: BookStatus) =>
    books.filter(b => b.book_status === status);

  const inactiveBooks = booksByStatus('inactive');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Book Production</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Review and approve books before printing
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowInactive(!showInactive)}
              className={`flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${
                showInactive
                  ? 'bg-gray-200 text-gray-700'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              {showInactive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              Inactive ({inactiveBooks.length})
            </button>
            <Link
              href="/admin"
              className="text-sm text-gray-600 hover:text-gray-900 font-medium"
            >
              Back to Admin
            </Link>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="max-w-[1600px] mx-auto px-6 py-6">
        <div className="grid grid-cols-4 gap-4 min-h-[calc(100vh-200px)]">
          {COLUMNS.map(col => {
            const columnBooks = booksByStatus(col.status);
            return (
              <div key={col.status} className="flex flex-col">
                {/* Column Header */}
                <div className={`rounded-t-lg border px-4 py-3 ${col.bgColor}`}>
                  <div className="flex items-center justify-between">
                    <h2 className={`font-semibold text-sm ${col.color}`}>
                      {col.label}
                    </h2>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${col.color} bg-white/60`}>
                      {columnBooks.length}
                    </span>
                  </div>
                </div>

                {/* Column Body */}
                <div className="flex-1 border border-t-0 rounded-b-lg bg-white/50 p-3 space-y-3 overflow-y-auto">
                  {columnBooks.map(book => (
                    <BookCard
                      key={book.id}
                      book={book}
                      onClick={handleCardClick}
                      onStatusChange={handleQuickStatusChange}
                    />
                  ))}
                  {columnBooks.length === 0 && (
                    <p className="text-xs text-gray-400 text-center py-8">
                      No books
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Inactive Section */}
        {showInactive && (
          <div className="mt-6">
            <div className="rounded-lg border border-gray-200 bg-gray-50">
              <div className="px-4 py-3 border-b border-gray-200">
                <h2 className="font-semibold text-sm text-gray-500">
                  Inactive ({inactiveBooks.length})
                </h2>
              </div>
              <div className="p-3">
                {inactiveBooks.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-4">No inactive books</p>
                ) : (
                  <div className="grid grid-cols-4 gap-3">
                    {inactiveBooks.map(book => (
                      <BookCard
                        key={book.id}
                        book={book}
                        onClick={handleCardClick}
                        onStatusChange={handleQuickStatusChange}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Detail Sheet */}
      <BookDetailSheet
        book={selectedBook}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
}
