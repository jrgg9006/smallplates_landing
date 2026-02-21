'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, Check, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { BookReviewStatus } from '@/lib/types/database';

interface ReviewRecipe {
  id: string;
  recipe_name: string;
  ingredients: string;
  instructions: string;
  comments: string | null;
  guest_name: string;
  image_url: string | null;
  generated_image_url: string | null;
  generated_image_url_print: string | null;
  has_print_ready: boolean;
  print_ready: {
    recipe_name_clean: string;
    ingredients_clean: string;
    instructions_clean: string;
    note_clean: string | null;
  } | null;
  book_review_status: string;
  book_review_notes: string | null;
}

interface BookReviewOverlayProps {
  groupId: string;
  coupleName: string;
  recipes: ReviewRecipe[];
  onClose: () => void;
  onReviewComplete: () => void;
}

export default function BookReviewOverlay({
  groupId,
  coupleName,
  recipes,
  onClose,
  onReviewComplete,
}: BookReviewOverlayProps) {
  // Reason: local copy so we can update review status in-memory without refetching
  const [localRecipes, setLocalRecipes] = useState<ReviewRecipe[]>(recipes);
  const [currentIndex, setCurrentIndex] = useState(() => {
    const firstPending = recipes.findIndex(r => r.book_review_status === 'pending');
    return firstPending >= 0 ? firstPending : 0;
  });
  const [showSummary, setShowSummary] = useState(false);
  const [showNotesInput, setShowNotesInput] = useState(false);
  const [notesValue, setNotesValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [markingReviewed, setMarkingReviewed] = useState(false);
  const notesInputRef = useRef<HTMLInputElement>(null);

  const recipe = localRecipes[currentIndex];
  const total = localRecipes.length;

  const approvedCount = localRecipes.filter(r => r.book_review_status === 'approved').length;
  const revisionCount = localRecipes.filter(r => r.book_review_status === 'needs_revision').length;
  const pendingCount = localRecipes.filter(r => r.book_review_status === 'pending').length;
  const allApproved = approvedCount === total && total > 0;

  const saveReview = useCallback(async (
    recipeId: string,
    status: BookReviewStatus,
    notes?: string | null,
  ) => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/admin/books/${groupId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipe_reviews: [{ recipe_id: recipeId, book_review_status: status, book_review_notes: notes }],
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save review');
      }
      // Update local state
      setLocalRecipes(prev => prev.map(r =>
        r.id === recipeId
          ? { ...r, book_review_status: status, book_review_notes: status === 'approved' ? null : (notes || null) }
          : r
      ));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
      return false;
    } finally {
      setSaving(false);
    }
  }, [groupId]);

  const advanceToNext = useCallback(() => {
    // Find next pending recipe after current
    const afterCurrent = localRecipes.findIndex(
      (r, i) => i > currentIndex && r.book_review_status === 'pending'
    );
    if (afterCurrent >= 0) {
      setCurrentIndex(afterCurrent);
      return;
    }
    // Wrap around: find any pending before current
    const beforeCurrent = localRecipes.findIndex(
      r => r.book_review_status === 'pending'
    );
    if (beforeCurrent >= 0 && beforeCurrent !== currentIndex) {
      setCurrentIndex(beforeCurrent);
      return;
    }
    // No pending left — show summary
    setShowSummary(true);
  }, [localRecipes, currentIndex]);

  const handleApprove = useCallback(async () => {
    if (!recipe || saving) return;
    const ok = await saveReview(recipe.id, 'approved');
    if (ok) advanceToNext();
  }, [recipe, saving, saveReview, advanceToNext]);

  const handleNeedsRevision = useCallback(async () => {
    if (!showNotesInput) {
      setShowNotesInput(true);
      setNotesValue(recipe?.book_review_notes || '');
      setTimeout(() => notesInputRef.current?.focus(), 50);
      return;
    }
    if (!recipe || saving) return;
    const ok = await saveReview(recipe.id, 'needs_revision', notesValue);
    if (ok) {
      setShowNotesInput(false);
      setNotesValue('');
      advanceToNext();
    }
  }, [showNotesInput, recipe, saving, saveReview, notesValue, advanceToNext]);

  const handleMarkReviewed = async () => {
    setMarkingReviewed(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/admin/books/${groupId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ book_status: 'reviewed' }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to mark as reviewed');
      }
      onReviewComplete();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark as reviewed');
    } finally {
      setMarkingReviewed(false);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (showSummary) return;

      if (e.key === 'Escape') {
        if (showNotesInput) {
          setShowNotesInput(false);
          setNotesValue('');
        } else {
          onClose();
        }
        return;
      }

      if (showNotesInput) {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          handleNeedsRevision();
        }
        return;
      }

      if (e.key === 'ArrowLeft' && currentIndex > 0) {
        setCurrentIndex(i => i - 1);
      } else if (e.key === 'ArrowRight' && currentIndex < total - 1) {
        setCurrentIndex(i => i + 1);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleApprove();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [showSummary, showNotesInput, currentIndex, total, onClose, handleApprove, handleNeedsRevision]);

  // Reset notes input when navigating
  useEffect(() => {
    setShowNotesInput(false);
    setNotesValue('');
    setError(null);
  }, [currentIndex]);

  const progressPercent = total > 0 ? ((total - pendingCount) / total) * 100 : 0;

  // Use clean/print-ready versions when available
  const displayName = recipe?.print_ready?.recipe_name_clean || recipe?.recipe_name || '';
  const displayIngredients = recipe?.print_ready?.ingredients_clean || recipe?.ingredients || '';
  const displayInstructions = recipe?.print_ready?.instructions_clean || recipe?.instructions || '';
  const displayNote = recipe?.print_ready?.note_clean ?? recipe?.comments ?? null;
  const displayImage = recipe?.generated_image_url_print || recipe?.generated_image_url || null;

  return (
    <div className="fixed inset-0 z-[100] bg-gray-900 flex flex-col">
      {/* Top bar */}
      <div className="bg-gray-800 px-6 py-3 flex items-center justify-between shrink-0">
        <h2 className="text-white font-medium truncate">
          Book Review: {coupleName}
        </h2>
        <div className="flex items-center gap-4">
          {!showSummary && (
            <span className="text-gray-400 text-sm tabular-nums">
              {currentIndex + 1} / {total}
            </span>
          )}
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-gray-700 shrink-0">
        <div
          className="h-full bg-green-500 transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {showSummary ? (
        <SummaryView
          recipes={localRecipes}
          approvedCount={approvedCount}
          revisionCount={revisionCount}
          pendingCount={pendingCount}
          allApproved={allApproved}
          onRecipeClick={(i) => { setCurrentIndex(i); setShowSummary(false); }}
          onMarkReviewed={handleMarkReviewed}
          markingReviewed={markingReviewed}
          error={error}
          onClose={onClose}
        />
      ) : recipe ? (
        <>
          {/* Book spread */}
          <div className="flex-1 flex overflow-hidden">
            {/* Left page — recipe text */}
            <div className="flex-1 bg-[#FAF7F2] overflow-y-auto p-8 lg:p-12">
              <div className="max-w-xl mx-auto">
                <p className="text-xs uppercase tracking-[0.2em] text-gray-400 font-serif mb-2">
                  {recipe.guest_name}
                </p>
                <h1 className="text-3xl lg:text-4xl font-serif text-gray-900 mb-4 leading-tight">
                  {displayName}
                </h1>
                {displayNote && (
                  <p className="text-sm italic text-gray-500 font-serif mb-6">
                    &ldquo;{displayNote}&rdquo;
                  </p>
                )}
                <div className="border-t border-gray-200 my-6" />
                <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-6">
                  <div className="min-w-0">
                    <h3 className="text-xs uppercase tracking-[0.15em] text-gray-500 font-semibold mb-3">
                      Ingredients
                    </h3>
                    <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed font-serif">
                      {displayIngredients}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-xs uppercase tracking-[0.15em] text-gray-500 font-semibold mb-3">
                      Instructions
                    </h3>
                    <div className="text-sm text-gray-700 font-serif leading-[1.6]">
                      {displayInstructions?.split('\n').map((line, i) => (
                        line.trim() === ''
                          ? <div key={i} className="h-[2em]" />
                          : <p key={i} className="m-0">{line}</p>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right page — recipe image */}
            <div className="flex-1 bg-gray-100 flex items-center justify-center overflow-hidden">
              {displayImage ? (
                <img
                  src={displayImage}
                  alt={displayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-gray-400 text-sm">No image available</div>
              )}
            </div>
          </div>

          {/* Bottom action bar */}
          <div className="bg-gray-800 px-6 py-3 flex items-center justify-between shrink-0">
            {/* Left: prev */}
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-white hover:bg-gray-700"
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex(i => i - 1)}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </Button>

            {/* Center: status badge */}
            <div className="flex items-center gap-2">
              <ReviewBadge status={recipe.book_review_status} />
              {recipe.book_review_notes && recipe.book_review_status === 'needs_revision' && (
                <span className="text-xs text-amber-300 max-w-[200px] truncate">
                  {recipe.book_review_notes}
                </span>
              )}
            </div>

            {/* Right: actions */}
            <div className="flex items-center gap-2">
              {showNotesInput && (
                <input
                  ref={notesInputRef}
                  type="text"
                  value={notesValue}
                  onChange={e => setNotesValue(e.target.value)}
                  placeholder="What needs to be fixed?"
                  className="bg-gray-700 text-white text-sm px-3 py-1.5 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-amber-500 w-64"
                  onKeyDown={e => {
                    if (e.key === 'Escape') {
                      setShowNotesInput(false);
                      setNotesValue('');
                    }
                  }}
                />
              )}
              <Button
                variant="outline"
                size="sm"
                className="border-amber-500 text-amber-400 hover:bg-amber-500/20 hover:text-amber-300"
                onClick={handleNeedsRevision}
                disabled={saving}
              >
                {saving && showNotesInput ? (
                  <Loader2 className="w-3 h-3 animate-spin mr-1" />
                ) : (
                  <AlertTriangle className="w-3 h-3 mr-1" />
                )}
                {showNotesInput ? 'Submit' : 'Needs Revision'}
              </Button>
              <Button
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={handleApprove}
                disabled={saving}
              >
                {saving && !showNotesInput ? (
                  <Loader2 className="w-3 h-3 animate-spin mr-1" />
                ) : (
                  <Check className="w-3 h-3 mr-1" />
                )}
                Approve
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-white hover:bg-gray-700"
                disabled={currentIndex >= total - 1}
                onClick={() => setCurrentIndex(i => i + 1)}
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>

          {/* Error inline */}
          {error && (
            <div className="bg-red-900/80 text-red-200 text-sm px-6 py-2 text-center">
              {error}
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}

function ReviewBadge({ status }: { status: string }) {
  if (status === 'approved') {
    return (
      <span className="text-xs px-2 py-1 rounded bg-green-600/20 text-green-400 font-medium">
        Approved
      </span>
    );
  }
  if (status === 'needs_revision') {
    return (
      <span className="text-xs px-2 py-1 rounded bg-red-600/20 text-red-400 font-medium">
        Needs Revision
      </span>
    );
  }
  return (
    <span className="text-xs px-2 py-1 rounded bg-gray-600/20 text-gray-400 font-medium">
      Pending
    </span>
  );
}

function SummaryView({
  recipes,
  approvedCount,
  revisionCount,
  pendingCount,
  allApproved,
  onRecipeClick,
  onMarkReviewed,
  markingReviewed,
  error,
  onClose,
}: {
  recipes: ReviewRecipe[];
  approvedCount: number;
  revisionCount: number;
  pendingCount: number;
  allApproved: boolean;
  onRecipeClick: (index: number) => void;
  onMarkReviewed: () => void;
  markingReviewed: boolean;
  error: string | null;
  onClose: () => void;
}) {
  const total = recipes.length;

  return (
    <div className="flex-1 overflow-y-auto flex items-start justify-center py-12 px-6">
      <div className="max-w-lg w-full space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-white mb-2">Review Summary</h2>
          <p className="text-gray-400">
            {approvedCount}/{total} approved
          </p>
        </div>

        {/* Approved */}
        {approvedCount > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-green-400 uppercase tracking-wide mb-2">
              Approved ({approvedCount})
            </h3>
            <div className="space-y-1">
              {recipes.map((r, i) => r.book_review_status === 'approved' && (
                <button
                  key={r.id}
                  onClick={() => onRecipeClick(i)}
                  className="w-full text-left px-3 py-2 rounded bg-green-900/20 hover:bg-green-900/30 text-green-300 text-sm flex items-center gap-2"
                >
                  <Check className="w-3 h-3 shrink-0" />
                  <span className="truncate">{r.print_ready?.recipe_name_clean || r.recipe_name}</span>
                  <span className="text-green-500/60 text-xs ml-auto shrink-0">by {r.guest_name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Needs revision */}
        {revisionCount > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-red-400 uppercase tracking-wide mb-2">
              Needs Revision ({revisionCount})
            </h3>
            <div className="space-y-1">
              {recipes.map((r, i) => r.book_review_status === 'needs_revision' && (
                <button
                  key={r.id}
                  onClick={() => onRecipeClick(i)}
                  className="w-full text-left px-3 py-2 rounded bg-red-900/20 hover:bg-red-900/30 text-red-300 text-sm"
                >
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-3 h-3 shrink-0" />
                    <span className="truncate">{r.print_ready?.recipe_name_clean || r.recipe_name}</span>
                    <span className="text-red-500/60 text-xs ml-auto shrink-0">by {r.guest_name}</span>
                  </div>
                  {r.book_review_notes && (
                    <p className="text-xs text-red-400/70 mt-1 ml-5">{r.book_review_notes}</p>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Pending */}
        {pendingCount > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-2">
              Pending ({pendingCount})
            </h3>
            <div className="space-y-1">
              {recipes.map((r, i) => r.book_review_status === 'pending' && (
                <button
                  key={r.id}
                  onClick={() => onRecipeClick(i)}
                  className="w-full text-left px-3 py-2 rounded bg-gray-800 hover:bg-gray-700 text-gray-400 text-sm flex items-center gap-2"
                >
                  <span className="w-3 h-3 rounded-full border border-gray-600 shrink-0" />
                  <span className="truncate">{r.print_ready?.recipe_name_clean || r.recipe_name}</span>
                  <span className="text-gray-600 text-xs ml-auto shrink-0">by {r.guest_name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {error && (
          <p className="text-red-400 text-sm text-center">{error}</p>
        )}

        <div className="flex gap-3 pt-4">
          <Button
            variant="outline"
            className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800"
            onClick={onClose}
          >
            Close
          </Button>
          <Button
            className="flex-1 bg-green-600 hover:bg-green-700 text-white disabled:opacity-40"
            disabled={!allApproved || markingReviewed}
            onClick={onMarkReviewed}
          >
            {markingReviewed ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Check className="w-4 h-4 mr-2" />
            )}
            Mark as Reviewed
          </Button>
        </div>
        {!allApproved && (
          <p className="text-xs text-gray-500 text-center">
            All recipes must be approved before marking the book as reviewed
          </p>
        )}
      </div>
    </div>
  );
}
