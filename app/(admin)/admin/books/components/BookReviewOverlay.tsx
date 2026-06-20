'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { X, ChevronLeft, ChevronRight, Check, AlertTriangle, Loader2, Pencil, Trash2, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { BookReviewStatus } from '@/lib/types/database';
import { ArchiveRecipeModal } from './ArchiveRecipeModal';
import { auditRecipe, type RecipeAudit, type SectionKey } from '@/lib/recipe-audit';
import { RecipeAuditStrip, HighlightedText } from './RecipeAuditStrip';
import { eligibleAnnexImages } from '@/lib/annex/selection';

// Reason: explains to the reviewer what marking an "original" actually does downstream.
const ANNEX_HELP =
  'Al dar clic, esta imagen se incluye tal cual en el libro impreso, en una sección de anexos al final llamada "Originals".';

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
  document_urls: string[] | null;
  upload_method: string | null;
  raw_recipe_text: string | null;
  has_print_ready: boolean;
  print_ready: {
    recipe_name_clean: string;
    ingredients_clean: string;
    instructions_clean: string;
    note_clean: string | null;
  } | null;
  book_review_status: string;
  book_review_notes: string | null;
  annex_source_urls?: string[];
  annex_reviewed?: boolean;
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
  // Reason: dedicated toggle to view the guest's uploaded photo(s) on the right panel,
  // independent of the generated image and the clean-vs-original text comparison.
  const [showPhoto, setShowPhoto] = useState(false);
  const [showNotesInput, setShowNotesInput] = useState(false);
  const [notesValue, setNotesValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Reason: which source_url is currently being toggled as an "original", to disable its button.
  const [annexBusy, setAnnexBusy] = useState<string | null>(null);
  // Reason: M2 — per-image upscale status keyed by source_url, plus batch-upscale + polling state.
  const [annexStatusByUrl, setAnnexStatusByUrl] = useState<
    Record<string, { upscale_status: string | null; print_url: string | null }>
  >({});
  const [markingReviewed, setMarkingReviewed] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editIngredients, setEditIngredients] = useState('');
  const [editInstructions, setEditInstructions] = useState('');
  const [editNote, setEditNote] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [archiveLoading, setArchiveLoading] = useState(false);
  const notesInputRef = useRef<HTMLInputElement>(null);

  const recipe = localRecipes[currentIndex];
  const total = localRecipes.length;

  const approvedCount = localRecipes.filter(r => r.book_review_status === 'approved').length;
  const revisionCount = localRecipes.filter(r => r.book_review_status === 'needs_revision').length;
  const pendingCount = localRecipes.filter(r => r.book_review_status === 'pending').length;
  const allApproved = approvedCount === total && total > 0;

  // Reason: deterministic audit (original vs clean) runs in-browser, instantly,
  // for every recipe. No API, no tokens, no cost. Recomputed only when recipes change.
  const audits = useMemo<RecipeAudit[]>(() => localRecipes.map((r) => {
    const isManualOriginal =
      (r.upload_method === 'image' && !!r.document_urls && r.document_urls.length > 0)
      || !!r.raw_recipe_text;
    return auditRecipe({
      hasPrintReady: r.has_print_ready,
      isManualOriginal,
      original: {
        name: r.recipe_name || '',
        ingredients: r.ingredients || '',
        instructions: r.instructions || '',
        note: r.comments,
      },
      clean: {
        name: r.print_ready?.recipe_name_clean || '',
        ingredients: r.print_ready?.ingredients_clean || '',
        instructions: r.print_ready?.instructions_clean || '',
        note: r.print_ready?.note_clean ?? null,
      },
    });
  }), [localRecipes]);

  const currentAudit = audits[currentIndex] ?? null;
  const auditFlaggedCount = audits.filter((a) => a.severity === 'content').length;
  const sectionAudit = (key: SectionKey) => currentAudit?.sections.find((s) => s.section === key) ?? null;

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

  const handleArchiveConfirm = useCallback(async () => {
    if (!recipe || archiveLoading) return;
    setArchiveLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/admin/operations/recipes/${recipe.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archive: true, archiveGroupId: groupId }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to archive recipe');
      }
      // Reason: remove from local state and adjust currentIndex so navigation stays consistent
      const archivedId = recipe.id;
      const removedIndex = currentIndex;
      const newRecipes = localRecipes.filter(r => r.id !== archivedId);
      setLocalRecipes(newRecipes);
      setArchiveOpen(false);
      if (newRecipes.length === 0) {
        onReviewComplete();
        onClose();
      } else if (removedIndex >= newRecipes.length) {
        setCurrentIndex(newRecipes.length - 1);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to archive');
    } finally {
      setArchiveLoading(false);
    }
  }, [recipe, archiveLoading, groupId, currentIndex, localRecipes, onClose, onReviewComplete]);

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
    setShowPhoto(false);
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
        setShowPhoto(false);
        return;
      }

      if (e.key === 'p' || e.key === 'P') {
        setShowPhoto(v => !v);
        setShowOriginal(false);
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
    setShowPhoto(false);
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

  // Reason: the original files the guest uploaded (photos/PDFs). Photos live in document_urls;
  // fall back to image_url. Drives the "Foto original" toggle so the admin can compare the clean
  // text against the actual submission without leaving the screen. Independent of upload_method.
  const originalFiles = recipe?.document_urls && recipe.document_urls.length > 0
    ? recipe.document_urls
    : (recipe?.image_url ? [recipe.image_url] : []);
  const hasOriginalPhoto = originalFiles.length > 0;

  const toggleAnnex = useCallback(async (sourceUrl: string) => {
    if (!recipe) return;
    const isSelected = (recipe.annex_source_urls ?? []).includes(sourceUrl);
    setAnnexBusy(sourceUrl);
    setError(null);
    try {
      const res = await fetch(`/api/v1/admin/books/${groupId}/annex`, {
        method: isSelected ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipe_id: recipe.id, source_url: sourceUrl }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j.error || 'No se pudo actualizar el original');
        return;
      }
      setLocalRecipes((prev) =>
        prev.map((r) => {
          if (r.id !== recipe.id) return r;
          const current = r.annex_source_urls ?? [];
          const next = isSelected
            ? current.filter((u) => u !== sourceUrl)
            : [...current, sourceUrl];
          return { ...r, annex_source_urls: next };
        })
      );
      // Reason: keep the M2 status map in sync so badges react instantly to (un)marking.
      setAnnexStatusByUrl((prev) => {
        if (isSelected) {
          const nextMap = { ...prev };
          delete nextMap[sourceUrl];
          return nextMap;
        }
        return { ...prev, [sourceUrl]: { upscale_status: null, print_url: null } };
      });
    } finally {
      setAnnexBusy(null);
    }
  }, [recipe, groupId]);

  const toggleAnnexReviewed = useCallback(async (next: boolean) => {
    if (!recipe) return;
    setAnnexBusy('__reviewed__');
    setError(null);
    try {
      const res = await fetch(`/api/v1/admin/books/${groupId}/annex`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipe_id: recipe.id, annex_reviewed: next }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j.error || 'No se pudo actualizar el estado');
        return;
      }
      setLocalRecipes((prev) =>
        prev.map((r) => (r.id === recipe.id ? { ...r, annex_reviewed: next } : r))
      );
    } finally {
      setAnnexBusy(null);
    }
  }, [recipe, groupId]);

  // Reason: the annex GET (M1) returns each row's live upscale_status/print_url; we key it
  // by source_url so each image's badge can read it. Polling refreshes this same map.
  const loadAnnexStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/v1/admin/books/${groupId}/annex`);
      if (!res.ok) return;
      const { annex_images } = (await res.json()) as {
        annex_images: { source_url: string; upscale_status: string | null; print_url: string | null }[];
      };
      const map: Record<string, { upscale_status: string | null; print_url: string | null }> = {};
      for (const row of annex_images ?? []) {
        map[row.source_url] = {
          upscale_status: row.upscale_status ?? null,
          print_url: row.print_url ?? null,
        };
      }
      setAnnexStatusByUrl(map);
    } catch {
      // Swallow transient errors; polling/next load will retry.
    }
  }, [groupId]);

  useEffect(() => {
    loadAnnexStatus();
  }, [loadAnnexStatus]);

  // Reason: one small badge per image reflecting its upscale lifecycle. null = selected but
  // not yet processed (no badge — the toggle already shows "✓ Original incluido").
  const renderAnnexStatus = (url: string) => {
    const st = annexStatusByUrl[url]?.upscale_status ?? null;
    if (st === 'pending' || st === 'processing') {
      return (
        <span className="mt-1 inline-flex items-center gap-1 text-xs text-amber-600">
          <Loader2 className="w-3 h-3 animate-spin" /> Procesando…
        </span>
      );
    }
    if (st === 'ready') {
      return (
        <span className="mt-1 inline-flex items-center gap-1 text-xs text-emerald-600">
          <Check className="w-3 h-3" /> Listo para imprimir
        </span>
      );
    }
    if (st === 'error') {
      return (
        <span className="mt-1 inline-flex items-center gap-1 text-xs text-red-600">
          <AlertTriangle className="w-3 h-3" /> Error al procesar
        </span>
      );
    }
    return null;
  };

  return (
    <div className="fixed inset-0 z-[100] bg-gray-900 flex flex-col">
      {/* Top bar */}
      <div className="bg-gray-800 px-6 py-3 flex items-center justify-between shrink-0">
        <h2 className="text-white font-medium truncate">
          Book Review: {coupleName}
        </h2>
        <div className="flex items-center gap-4">
          {!showSummary && auditFlaggedCount > 0 && (
            <span className="flex items-center gap-1 rounded bg-amber-500/20 px-2 py-0.5 text-xs font-medium text-amber-300">
              <AlertTriangle className="h-3 w-3" />
              {auditFlaggedCount} a revisar
            </span>
          )}
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
              isEditing ? 'bg-blue-50' : 'bg-brand-warm-white-warm'
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
                {!isEditing && <RecipeAuditStrip audit={currentAudit} />}
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
                    {displayNote}
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
                        {showOriginal && sectionAudit('ingredients')
                          ? <HighlightedText tokens={sectionAudit('ingredients')!.cleanTokens} />
                          : displayIngredients}
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
                        {showOriginal && sectionAudit('instructions') ? (
                          <HighlightedText tokens={sectionAudit('instructions')!.cleanTokens} />
                        ) : (
                          displayInstructions?.split('\n').map((line, i) => (
                            line.trim() === ''
                              ? <div key={i} className="h-[2em]" />
                              : <p key={i} className="m-0">{line}</p>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right page — uploaded photo, original text, or generated image */}
            {/* Reason: while editing, force the original onto the right side so admin can compare against the source */}
            {showPhoto && hasOriginalPhoto && !isEditing ? (
              <div className="flex-1 overflow-y-auto p-8 lg:p-12 bg-gray-50">
                <div className="max-w-xl mx-auto">
                  <div className="mb-4 flex items-center gap-3">
                    <span className="text-xs font-semibold uppercase tracking-wide text-sky-700">
                      Foto original del invitado
                    </span>
                    {/* Reason: single-image is the common case — show the annex toggle here next to
                        the label so the admin doesn't have to scroll past a tall photo to find it.
                        Multiple images keep a per-image button below (rendered further down). */}
                    {originalFiles.length === 1 && !originalFiles[0].toLowerCase().split('?')[0].endsWith('.pdf') && (() => {
                      const url = originalFiles[0];
                      const selected = (recipe?.annex_source_urls ?? []).includes(url);
                      return (
                        <span className="inline-flex flex-col items-start">
                          <button
                            type="button"
                            title={ANNEX_HELP}
                            onClick={() => toggleAnnex(url)}
                            disabled={annexBusy === url}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded border transition-colors disabled:opacity-50 ${
                              selected
                                ? 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700'
                                : 'bg-white text-gray-700 border-gray-300 hover:border-emerald-500'
                            }`}
                          >
                            {selected ? '✓ Original incluido' : 'Incluir como original'}
                            <Info className="w-3.5 h-3.5 opacity-60" />
                          </button>
                          {renderAnnexStatus(url)}
                        </span>
                      );
                    })()}
                    {(() => {
                      const selectedCount = (recipe?.annex_source_urls ?? []).length;
                      const hasEligible =
                        eligibleAnnexImages(recipe?.document_urls ?? null, recipe?.image_url ?? null).length > 0;
                      // Reason: dismiss is only meaningful when there's a photo and nothing marked
                      // (a marked original already resolves the recipe to green).
                      if (!hasEligible || selectedCount > 0) return null;
                      const dismissed = recipe?.annex_reviewed === true;
                      return dismissed ? (
                        <span className="inline-flex items-center gap-2 text-xs text-gray-500">
                          ⊘ Revisada · sin original
                          <button
                            type="button"
                            onClick={() => toggleAnnexReviewed(false)}
                            disabled={annexBusy === '__reviewed__'}
                            className="px-2 py-1 rounded border border-gray-300 text-gray-600 hover:border-gray-500 disabled:opacity-50"
                          >
                            Deshacer
                          </button>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => toggleAnnexReviewed(true)}
                          disabled={annexBusy === '__reviewed__'}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded border border-gray-300 bg-white text-gray-700 hover:border-gray-500 transition-colors disabled:opacity-50"
                        >
                          No incluir (revisada)
                        </button>
                      );
                    })()}
                  </div>
                  <p className="text-xs uppercase tracking-[0.2em] text-gray-400 font-serif mb-4">
                    {recipe.guest_name}
                  </p>
                  <div className="flex flex-col gap-4">
                    {originalFiles.map((url, i) => {
                      // Reason: PDFs can't render inline — a link to open in a new tab is enough.
                      const isPdf = url.toLowerCase().split('?')[0].endsWith('.pdf');
                      return isPdf ? (
                        <a
                          key={url}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block rounded border border-gray-200 bg-white px-4 py-3 text-sm text-sky-700 hover:border-sky-400 hover:text-sky-800 transition-colors"
                        >
                          Abrir PDF {i + 1} de {originalFiles.length} en otra pestaña ↗
                        </a>
                      ) : (
                        <div key={url}>
                          {originalFiles.length > 1 && (
                            <p className="text-xs uppercase tracking-[0.15em] text-gray-500 font-semibold mb-2">
                              Imagen {i + 1} de {originalFiles.length}
                            </p>
                          )}
                          <a href={url} target="_blank" rel="noopener noreferrer" className="block">
                            <img
                              src={url}
                              alt={`Foto original ${i + 1}`}
                              className="w-full rounded border border-gray-200 hover:border-gray-400 transition-colors"
                            />
                          </a>
                          {originalFiles.length > 1 && (() => {
                            const selected = (recipe?.annex_source_urls ?? []).includes(url);
                            return (
                              <>
                                <button
                                  type="button"
                                  title={ANNEX_HELP}
                                  onClick={() => toggleAnnex(url)}
                                  disabled={annexBusy === url}
                                  className={`mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded border transition-colors disabled:opacity-50 ${
                                    selected
                                      ? 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700'
                                      : 'bg-white text-gray-700 border-gray-300 hover:border-emerald-500'
                                  }`}
                                >
                                  {selected ? '✓ Original incluido' : 'Incluir como original'}
                                  <Info className="w-3.5 h-3.5 opacity-60" />
                                </button>
                                <div>{renderAnnexStatus(url)}</div>
                              </>
                            );
                          })()}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (showOriginal || isEditing) ? (
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
                      {originalNote}
                    </p>
                  )}
                  <div className="border-t border-gray-200 my-6" />
                  {/* Reason: when the guest uploaded photos instead of typing, the text fields hold placeholders. Show the actual images so admin can verify the clean version against what was submitted. */}
                  {recipe.upload_method === 'image' && recipe.document_urls && recipe.document_urls.length > 0 ? (
                    <div className="flex flex-col gap-4">
                      {recipe.document_urls.map((url, i) => (
                        <div key={url}>
                          <p className="text-xs uppercase tracking-[0.15em] text-gray-500 font-semibold mb-2">
                            Image {i + 1} of {recipe.document_urls!.length}
                          </p>
                          <a href={url} target="_blank" rel="noopener noreferrer" className="block">
                            <img
                              src={url}
                              alt={`Original recipe image ${i + 1}`}
                              className="w-full rounded border border-gray-200 hover:border-gray-400 transition-colors"
                            />
                          </a>
                        </div>
                      ))}
                    </div>
                  ) : recipe.raw_recipe_text ? (
                    /* Reason: when the guest pasted the full recipe as a single block, ingredients/instructions are placeholders. Show the raw paste so admin can verify the clean version. */
                    <div>
                      <h3 className="text-xs uppercase tracking-[0.15em] text-gray-500 font-semibold mb-3">Pasted Recipe</h3>
                      <div className="text-sm text-gray-700 font-serif leading-[1.6] whitespace-pre-wrap">
                        {recipe.raw_recipe_text}
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-6">
                      <div className="min-w-0">
                        <h3 className="text-xs uppercase tracking-[0.15em] text-gray-500 font-semibold mb-3">Ingredients</h3>
                        <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed font-serif">
                          {sectionAudit('ingredients')
                            ? <HighlightedText tokens={sectionAudit('ingredients')!.originalTokens} />
                            : originalIngredients}
                        </p>
                      </div>
                      <div>
                        <h3 className="text-xs uppercase tracking-[0.15em] text-gray-500 font-semibold mb-3">Instructions</h3>
                        <div className="text-sm text-gray-700 font-serif leading-[1.6]">
                          {sectionAudit('instructions') ? (
                            <HighlightedText tokens={sectionAudit('instructions')!.originalTokens} />
                          ) : (
                            originalInstructions?.split('\n').map((line, i) => (
                              line.trim() === ''
                                ? <div key={i} className="h-[2em]" />
                                : <p key={i} className="m-0">{line}</p>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  )}
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
                  {/* Reason: when approved, the right-side "Approved — click to undo" button already
                      states the status, so the badge would duplicate it. Show it only for the
                      pending / needs_revision states where the action button doesn't say it plainly. */}
                  {recipe.book_review_status !== 'approved' && (
                    <ReviewBadge status={recipe.book_review_status} />
                  )}
                  {recipe.has_print_ready && (
                    <button
                      onClick={() => { setShowOriginal(v => !v); setShowPhoto(false); }}
                      className={`text-xs px-2 py-1 rounded transition-colors ${
                        showOriginal
                          ? 'bg-amber-500/30 text-amber-300'
                          : 'bg-gray-700 text-gray-400 hover:text-gray-300'
                      }`}
                    >
                      {showOriginal ? 'Show Clean Version' : 'Show Original'} <kbd className="text-[9px] opacity-40 ml-1.5 px-1 py-0.5 rounded border border-gray-600">O</kbd>
                    </button>
                  )}
                  {hasOriginalPhoto && (
                    // Reason: this button only renders when the recipe actually has a guest photo,
                    // so it stays visually loud (sky accent) to flag "there's an original to look at"
                    // — easy to spot against the other muted toolbar buttons.
                    <button
                      onClick={() => { setShowPhoto(v => !v); setShowOriginal(false); }}
                      className={`text-xs px-2 py-1 rounded font-medium transition-colors ${
                        showPhoto
                          ? 'bg-sky-500 text-white'
                          : 'bg-sky-500/20 text-sky-200 ring-1 ring-inset ring-sky-400/60 hover:bg-sky-500/30'
                      }`}
                    >
                      📷 {showPhoto ? 'Ocultar foto' : 'Foto original'} <kbd className="text-[9px] opacity-50 ml-1.5 px-1 py-0.5 rounded border border-sky-300/40">P</kbd>
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
                  <button
                    onClick={() => setArchiveOpen(true)}
                    disabled={saving || archiveLoading}
                    className="text-xs p-1.5 rounded bg-gray-700 text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors flex items-center disabled:opacity-50"
                    title="Quitar esta receta del libro (reversible)"
                    aria-label="Quitar del libro"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
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

      <ArchiveRecipeModal
        isOpen={archiveOpen}
        recipeName={recipe?.recipe_name || ''}
        bookName={coupleName}
        onClose={() => !archiveLoading && setArchiveOpen(false)}
        onConfirm={handleArchiveConfirm}
        loading={archiveLoading}
      />
    </div>
  );
}

function ReviewBadge({ status }: { status: string }) {
  // Reason: this is a status label, not an action — render as plain text (no chip/background)
  // so only actionable controls in the toolbar read as buttons.
  if (status === 'approved') {
    return <span className="text-xs font-medium text-green-400">Approved</span>;
  }
  if (status === 'needs_revision') {
    return <span className="text-xs font-medium text-red-400">Needs Revision</span>;
  }
  return <span className="text-xs font-medium text-gray-400">Pending Review</span>;
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
          <p className="text-secondary-sm text-gray-500 text-center">
            All recipes must be approved before marking the book as ready to print
          </p>
        )}
      </div>
    </div>
  );
}
