'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createSupabaseClient } from '@/lib/supabase/client';
import { isAdminEmail } from '@/lib/config/admin';
import BookSelector, { type BookOption } from './components/BookSelector';
import PdfUploader from './components/PdfUploader';
import ReviewProgress from './components/ReviewProgress';
import ReviewReport from './components/ReviewReport';
import type { QAStatus } from '@/lib/qa-review/types';

type Phase = 'select_book' | 'upload' | 'processing' | 'complete' | 'failed';

export default function QAReviewPage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const [phase, setPhase] = useState<Phase>('select_book');
  const [selectedBook, setSelectedBook] = useState<BookOption | null>(null);
  const [reviewId, setReviewId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const supabase = createSupabaseClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || !isAdminEmail(user.email)) {
        router.push('/');
        return;
      }
      setIsAdmin(true);
      setLoading(false);
    })();
  }, [router]);

  const reset = () => {
    setPhase('select_book');
    setSelectedBook(null);
    setReviewId(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Checking access...</p>
        </div>
      </div>
    );
  }
  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">QA Review</h1>
            <p className="text-gray-600">
              Sube el PDF final del libro y el agente lo revisa contra los datos del grupo.
            </p>
          </div>
          <Link
            href="/admin"
            className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium transition-colors"
          >
            ← Admin
          </Link>
        </div>

        {/* Step indicator */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2 mb-6 flex">
          {(
            [
              { key: 'select_book', label: '1. Libro' },
              { key: 'upload', label: '2. PDF' },
              { key: 'processing', label: '3. Revisión' },
              { key: 'complete', label: '4. Resultado' },
            ] as { key: Phase; label: string }[]
          ).map((step, i, arr) => {
            const isActive = phase === step.key || (phase === 'failed' && step.key === 'processing');
            const isPast = arr.findIndex((s) => s.key === phase) > i && phase !== 'failed';
            return (
              <div
                key={step.key}
                className={`flex-1 text-center py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-brand-honey text-white'
                    : isPast
                    ? 'text-gray-900'
                    : 'text-gray-400'
                }`}
              >
                {step.label}
              </div>
            );
          })}
        </div>

        {/* Phase content */}
        {phase === 'select_book' && (
          <BookSelector
            onSelect={(book) => {
              setSelectedBook(book);
              setPhase('upload');
            }}
          />
        )}

        {phase === 'upload' && selectedBook && (
          <PdfUploader
            book={selectedBook}
            onCancel={reset}
            onUploaded={(id) => {
              setReviewId(id);
              setPhase('processing');
            }}
          />
        )}

        {(phase === 'processing' || phase === 'complete' || phase === 'failed') && reviewId && (
          <ReviewProgress
            reviewId={reviewId}
            onComplete={(status: QAStatus) => {
              if (status === 'complete') setPhase('complete');
              else if (status === 'failed') setPhase('failed');
            }}
          />
        )}

        {(phase === 'complete' || phase === 'failed') && reviewId && (
          <ReviewReport reviewId={reviewId} onDone={reset} />
        )}
      </div>
    </div>
  );
}
