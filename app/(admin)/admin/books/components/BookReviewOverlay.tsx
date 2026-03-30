'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, Check, AlertTriangle, Loader2, Pencil } from 'lucide-react';
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
  imageCacheBuster?: number;
  initialIndex?: number;
  onClose: () => void;
  onReviewComplete: () => void;
}

export default function BookReviewOverlay({
  groupId,
  coupleName,
  recipes,
  imageCacheBuster,
  initialIndex,
  onClose,
  onReviewComplete,
}: BookReviewOverlayProps) {
  // Reason: local copy so we can update review status in-memory without refetching
  const [localRecipes, setLocalRecipes] = useState<ReviewRecipe[]>(recipes);
  const [currentIndex, setCurrentIndex] = useState(() => {
    // Reason: if initialIndex provided, jump directly to that recipe
    if (initialIndex !== undefined && initialIndex >= 0 && initialIndex < recipes.length) return initialIndex;
    // Reason: prioritize pending, then needs_revision, so the admin lands on the first recipe needing attention
    const firstPending = recipes.findIndex(r => r.book_review_status === 'pending');
    if (firstPending >= 0) return firstPending;
    const firstRevision = recipes.findIndex(r => r.book_review_status === 'needs_revision');
    return firstRevision >= 0 ? firstRevision : 0;
  });
  const [showSummary, setShowSummary] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  const [showNotesInput, setShowNotesInput] = useState(false);
  const [notesValue, setNotesValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [markingReviewed, setMarkingReviewed] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editIngredients, setEditIngredients] = useState('');
  const [editInstructions, setEditInstructions] = useState('');
  const [editNote, setEditNote] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
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
    // Reason: look for any non-approved recipe (pending OR needs_revision) so the admin
    // can flow through all recipes that still need attention without jumping to summary
    const needsAttention = (r: ReviewRecipe) => r.book_review_status !== 'approved';

    // Find next non-approved recipe after current
    const afterCurrent = localRecipes.findIndex(
      (r, i) => i > currentIndex && needsAttention(r)
    );
    if (afterCurrent >= 0) {
      setCurrentIndex(afterCurrent);
      return;
    }
    // Wrap around: find any non-approved before current
    const beforeCurrent = localRecipes.findIndex(
      (r, i) => i !== currentIndex && needsAttention(r)
    );
    if (beforeCurrent >= 0) {
      setCurrentIndex(beforeCurrent);
      return;
    }
    // All approved — show summary
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

  const handleMarkReadyToPrint = async () => {
    setMarkingReviewed(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/admin/books/${groupId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ book_status: 'ready_to_print' }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to mark as ready to print');
      }
      onReviewComplete();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark as ready to print');
    } finally {
      setMarkingReviewed(false);
    }
  };

  const handleStartEdit = useCallback(() => {
    if (!recipe) return;
    // Reason: use clean version if available, fall back to original so we can edit even without a clean version
    setEditName(recipe.print_ready?.recipe_name_clean || recipe.recipe_name);
    setEditIngredients(recipe.print_ready?.ingredients_clean || recipe.ingredients);
    setEditInstructions(recipe.print_ready?.instructions_clean || recipe.instructions);
    setEditNote(recipe.print_ready?.note_clean || recipe.comments || '');
    setShowOriginal(false);
    setIsEditing(true);
  }, [recipe]);

  const handleCancelEdit = useCallback(() => {
    setIsEditing(false);
  }, []);

  const handleSaveEdit = useCallback(async () => {
    if (!recipe || savingEdit) return;
    setSavingEdit(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/admin/content/recipes/${recipe.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipe_name: editName,
          ingredients: editIngredients,
          instructions: editInstructions,
          note_clean: editNote || null,
          edit_reason: 'Edited during book review',
          target: 'print_ready',
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save edit');
      }
      // Reason: update local state so the review continues with the corrected text
      setLocalRecipes(prev => prev.map(r =>
        r.id === recipe.id
          ? {
              ...r,
              has_print_ready: true,
              print_ready: {
                recipe_name_clean: editName,
                ingredients_clean: editIngredients,
                instructions_clean: editInstructions,
                note_clean: editNote || null,
              },
            }
          : r
      ));
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save edit');
    } finally {
      setSavingEdit(false);
    }
  }, [recipe, savingEdit, editName, editIngredients, editInstructions, editNote]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (showSummary) return;

      // Reason: block all shortcuts when editing text, only allow Escape to cancel
      if (isEditing) {
        if (e.key === 'Escape') handleCancelEdit();
        return;
      }

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

      if (e.key === 'o' || e.key === 'O') {
        setShowOriginal(v => !v);
        return;
      }

      if (e.key === 'e' || e.key === 'E') {
        handleStartEdit();
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
  }, [showSummary, showNotesInput, isEditing, currentIndex, total, onClose, handleApprove, handleNeedsRevision, handleStartEdit, handleCancelEdit, recipe]);

  // Reset notes input when navigating
  useEffect(() => {
    setShowOriginal(false);
    setIsEditing(false);
    setShowNotesInput(false);
    setNotesValue('');
    setError(null);
  }, [currentIndex]);

  const progressPercent = total > 0 ? ((total - pendingCount) / total) * 100 : 0;

  // Reason: Left panel always shows clean version. When showOriginal is on, right panel shows original instead of image.
  const displayName = recipe?.print_ready?.recipe_name_clean || recipe?.recipe_name || '';
  const displayIngredients = recipe?.print_ready?.ingredients_clean || recipe?.ingredients || '';
  const displayInstructions = recipe?.print_ready?.instructions_clean || recipe?.instructions || '';
  const displayNote = recipe?.print_ready?.note_clean ?? recipe?.comments ?? null;

  // Original versions for side-by-side comparison
  const originalName = recipe?.recipe_name || '';
  const originalIngredients = recipe?.ingredients || '';
  const originalInstructions = recipe?.instructions || '';
  const originalNote = recipe?.comments ?? null;
  const rawImage = recipe?.generated_image_url_print || recipe?.generated_image_url || null;
  // Reason: append cache buster so browser fetches fresh image after re-upload in operations
  const displayImage = rawImage && imageCacheBuster ? `${rawImage}?v=${imageCacheBuster}` : rawImage;

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
          onMarkReviewed={handleMarkReadyToPrint}
          markingReviewed={markingReviewed}
          error={error}
          onClose={onClose}
        />
      ) : recipe ? (
        <>
          {/* Book spread */}
          <div className="flex-1 flex overflow-hidden">
            {/* Left page — recipe text */}
            <div className={`flex-1 overflow-y-auto p-8 lg:p-12 transition-colors duration-200 ${
              isEditing ? 'bg-blue-50' : 'bg-[#FAF7F2]'
            }`}>
              <div className="max-w-xl mx-auto">
                {showOriginal && (
                  <div className="mb-4 px-3 py-1.5 bg-green-200/60 text-green-800 text-xs font-medium rounded inline-block">
                    Clean Version
                  </div>
                )}
                {isEditing && (
                  <div className="mb-4 px-3 py-1.5 bg-blue-200/60 text-blue-800 text-xs font-medium rounded inline-block">
                    Editing Print Ready
                  </div>
                )}
                <p className="text-xs uppercase tracking-[0.2em] text-gray-400 font-serif mb-2">
                  {recipe.guest_name}
                </p>
                {isEditing ? (
                  <input
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    className="w-full text-3xl lg:text-4xl font-serif text-gray-900 mb-4 leading-tight bg-white border border-blue-200 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                ) : (
                  <h1 className="text-3xl lg:text-4xl font-serif text-gray-900 mb-4 leading-tight">
                    {displayName}
                  </h1>
                )}
                {isEditing ? (
                  <input
                    value={editNote}
                    onChange={e => setEditNote(e.target.value)}
                    placeholder="Personal note (optional)"
                    className="w-full text-sm italic text-gray-500 font-serif mb-6 bg-white border border-blue-200 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                ) : displayNote ? (
                  <p className="text-sm italic text-gray-500 font-serif mb-6">
                    &ldquo;{displayNote}&rdquo;
                  </p>
                ) : null}
                <div className="border-t border-gray-200 my-6" />
                <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-6">
                  <div className="min-w-0">
                    <h3 className="text-xs uppercase tracking-[0.15em] text-gray-500 font-semibold mb-3">
                      Ingredients
                    </h3>
                    {isEditing ? (
                      <textarea
                        value={editIngredients}
                        onChange={e => setEditIngredients(e.target.value)}
                        rows={10}
                        className="w-full text-sm text-gray-700 font-serif leading-relaxed bg-white border border-blue-200 rounded px-3 py-2 resize-y focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
                    ) : (
                      <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed font-serif">
                        {displayIngredients}
                      </p>
                    )}
                  </div>
                  <div>
                    <h3 className="text-xs uppercase tracking-[0.15em] text-gray-500 font-semibold mb-3">
                      Instructions
                    </h3>
                    {isEditing ? (
                      <textarea
                        value={editInstructions}
                        onChange={e => setEditInstructions(e.target.value)}
                        rows={14}
                        className="w-full text-sm text-gray-700 font-serif leading-[1.6] bg-white border border-blue-200 rounded px-3 py-2 resize-y focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
                    ) : (
                      <div className="text-sm text-gray-700 font-serif leading-[1.6]">
                        {displayInstructions?.split('\n').map((line, i) => (
                          line.trim() === ''
                            ? <div key={i} className="h-[2em]" />
                            : <p key={i} className="m-0">{line}</p>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right page — image or original text for comparison */}
            {showOriginal ? (
              <div className="flex-1 overflow-y-auto p-8 lg:p-12 bg-amber-50">
                <div className="max-w-xl mx-auto">
                  <div className="mb-4 px-3 py-1.5 bg-amber-200/60 text-amber-800 text-xs font-medium rounded inline-block">
                    Original
                  </div>
                  <p className="text-xs uppercase tracking-[0.2em] text-gray-400 font-serif mb-2">
                    {recipe.guest_name}
                  </p>
                  <h1 className="text-3xl lg:text-4xl font-serif text-gray-900 mb-4 leading-tight">
                    {originalName}
                  </h1>
                  {originalNote && (
                    <p className="text-sm italic text-gray-500 font-serif mb-6">
                      &ldquo;{originalNote}&rdquo;
                    </p>
                  )}
                  <div className="border-t border-gray-200 my-6" />
                  <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-6">
                    <div className="min-w-0">
                      <h3 className="text-xs uppercase tracking-[0.15em] text-gray-500 font-semibold mb-3">Ingredients</h3>
                      <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed font-serif">
                        {originalIngredients}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-xs uppercase tracking-[0.15em] text-gray-500 font-semibold mb-3">Instructions</h3>
                      <div className="text-sm text-gray-700 font-serif leading-[1.6]">
                        {originalInstructions?.split('\n').map((line, i) => (
                          line.trim() === ''
                            ? <div key={i} className="h-[2em]" />
                            : <p key={i} className="m-0">{line}</p>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
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
            )}
          </div>

          {/* Bottom action bar */}
          <div className="bg-gray-800 px-6 py-3 flex items-center justify-between shrink-0">
            {isEditing ? (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-white hover:bg-gray-700"
                  onClick={handleCancelEdit}
                  disabled={savingEdit}
                >
                  Cancel
                </Button>
                <span className="text-xs text-blue-400 font-medium">Editing Print Ready</span>
                <Button
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={handleSaveEdit}
                  disabled={savingEdit}
                >
                  {savingEdit ? (
                    <Loader2 className="w-3 h-3 animate-spin mr-1" />
                  ) : (
                    <Check className="w-3 h-3 mr-1" />
                  )}
                  Save
                </Button>
              </>
            ) : (
              <>
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

                {/* Center: status badge + original toggle + edit */}
                <div className="flex items-center gap-2">
                  <ReviewBadge status={recipe.book_review_status} />
                  {recipe.has_print_ready && (
                    <button
                      onClick={() => setShowOriginal(v => !v)}
                      className={`text-xs px-2 py-1 rounded transition-colors ${
                        showOriginal
                          ? 'bg-amber-500/30 text-amber-300'
                          : 'bg-gray-700 text-gray-400 hover:text-gray-300'
                      }`}
                    >
                      {showOriginal ? 'Show Clean Version' : 'Show Original'} <kbd className="text-[9px] opacity-40 ml-1.5 px-1 py-0.5 rounded border border-gray-600">O</kbd>
                    </button>
                  )}
                  {!recipe.has_print_ready && (
                    <span className="text-xs px-2 py-1 rounded bg-red-500/20 text-red-300">
                      No clean version — showing original
                    </span>
                  )}
                  <button
                    onClick={handleStartEdit}
                    className="text-xs px-2 py-1 rounded bg-gray-700 text-gray-400 hover:text-gray-300 transition-colors flex items-center gap-1"
                  >
                    <Pencil className="w-3 h-3" /> Edit Recipe <kbd className="text-[9px] opacity-40 ml-1 px-1 py-0.5 rounded border border-gray-600">E</kbd>
                  </button>
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
                  {recipe.book_review_status === 'needs_revision' ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-amber-500 bg-amber-500/20 text-amber-300"
                      onClick={() => handleApprove()}
                      disabled={saving}
                      title={recipe.book_review_notes || undefined}
                    >
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      Flagged{recipe.book_review_notes ? `: ${recipe.book_review_notes}` : ''}
                      <span className="ml-1.5 text-[9px] opacity-60">— click to clear</span>
                    </Button>
                  ) : (
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
                      {showNotesInput ? 'Submit' : 'Flag for Revision'}
                    </Button>
                  )}
                  {recipe.book_review_status === 'approved' ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-green-500 bg-green-500/20 text-green-300 hover:bg-red-500/20 hover:text-red-300 hover:border-red-400"
                      onClick={async () => {
                        if (!recipe || saving) return;
                        await saveReview(recipe.id, 'pending');
                      }}
                      disabled={saving}
                    >
                      <Check className="w-3 h-3 mr-1" />
                      Approved — click to undo
                    </Button>
                  ) : (
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
                  )}
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
              </>
            )}
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
      Pending Review
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
            Mark Ready to Print
          </Button>
        </div>
        {!allApproved && (
          <p className="text-xs text-gray-500 text-center">
            All recipes must be approved before marking the book as ready to print
          </p>
        )}
      </div>
    </div>
  );
}
