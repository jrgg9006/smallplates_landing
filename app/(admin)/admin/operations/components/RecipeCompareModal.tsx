"use client";

import { useState } from 'react';

interface CompareRecipe {
  id: string;
  recipe_name: string;
  ingredients: string;
  instructions: string;
  comments: string | null;
  recipe_print_ready: {
    recipe_name_clean: string;
    ingredients_clean: string;
    instructions_clean: string;
    note_clean?: string | null;
    needs_regeneration?: boolean | null;
  } | null;
}

interface RecipeCompareModalProps {
  recipe: CompareRecipe;
  onClose: () => void;
  // Reason: lets the parent update selectedRecipe + refresh the list after a save
  onSaved: (cleaned: { recipe_name_clean: string; ingredients_clean: string; instructions_clean: string; note_clean: string }) => void;
}

export default function RecipeCompareModal({ recipe, onClose, onSaved }: RecipeCompareModalProps) {
  // Original = the guest's submission (right side, never edited)
  const originalNotes = recipe.comments || '';
  const originalIngredients = recipe.ingredients || '';
  const originalInstructions = recipe.instructions || '';

  // Clean = print-ready version (left side, editable). Seed from original if none exists yet.
  const hasClean = !!(
    recipe.recipe_print_ready?.ingredients_clean ||
    recipe.recipe_print_ready?.instructions_clean ||
    recipe.recipe_print_ready?.note_clean
  );
  const initialTitle = recipe.recipe_print_ready?.recipe_name_clean || recipe.recipe_name || '';
  const initialNotes = recipe.recipe_print_ready?.note_clean || originalNotes;
  const initialIngredients = recipe.recipe_print_ready?.ingredients_clean || originalIngredients;
  const initialInstructions = recipe.recipe_print_ready?.instructions_clean || originalInstructions;

  const [title, setTitle] = useState(initialTitle);
  const [notes, setNotes] = useState(initialNotes);
  const [ingredients, setIngredients] = useState(initialIngredients);
  const [instructions, setInstructions] = useState(initialInstructions);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasChanges =
    title !== initialTitle ||
    notes !== initialNotes ||
    ingredients !== initialIngredients ||
    instructions !== initialInstructions;

  const handleClose = () => {
    if (hasChanges && !window.confirm('You have unsaved changes. Discard them?')) return;
    onClose();
  };

  const handleSave = async () => {
    if (!hasChanges) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/admin/operations/recipes/${recipe.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          printReady: {
            recipe_name_clean: title,
            ingredients_clean: ingredients,
            instructions_clean: instructions,
            note_clean: notes,
          },
          markNeedsReview: true,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save changes');
      }
      onSaved({ recipe_name_clean: title, ingredients_clean: ingredients, instructions_clean: instructions, note_clean: notes });
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const originalTitle = recipe.recipe_name || 'Untitled Recipe';

  return (
    <div className="fixed inset-0 z-[80] bg-white flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 bg-white flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <h2 className="text-xl font-bold text-gray-900 truncate">{originalTitle}</h2>
          <span className="text-xs text-gray-500 hidden sm:inline">Compare &amp; edit the clean version</span>
        </div>
        <div className="flex items-center gap-3">
          {error && <span className="text-sm text-red-600">{error}</span>}
          <button
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className="px-4 py-2 text-sm font-medium text-white bg-black rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving ? (
              <>
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Saving…</span>
              </>
            ) : (
              <span>Save changes</span>
            )}
          </button>
          <button
            onClick={handleClose}
            aria-label="Close"
            className="text-gray-400 hover:text-gray-600 text-2xl font-light w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Explainer banner — makes it unmistakable for interns what this does.
          When the original was edited after cleaning, escalate: saving here is
          what clears the stale flag, so the reviewer must check ALL fields. */}
      {recipe.recipe_print_ready?.needs_regeneration ? (
        <div className="px-6 py-3 bg-red-50 border-b border-red-200 flex items-start gap-3 flex-shrink-0">
          <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M5.07 19h13.86c1.54 0 2.5-1.67 1.73-3L13.73 4a2 2 0 00-3.46 0L3.34 16c-.77 1.33.19 3 1.73 3z" />
          </svg>
          <p className="text-sm text-red-800 leading-relaxed">
            <span className="font-semibold">The guest edited the original AFTER this clean version was made.</span> The original (right) is the newest text — the clean version (left) may be outdated. Review <span className="font-semibold">ALL fields</span> against the original and update the clean version. When you&apos;re done, untick &quot;Needs Review&quot; — that&apos;s what clears the flag.
          </p>
        </div>
      ) : (
        <div className="px-6 py-3 bg-amber-50 border-b border-amber-200 flex items-start gap-3 flex-shrink-0">
          <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-amber-800 leading-relaxed">
            You&apos;re creating/updating the <span className="font-semibold">clean version</span> (left) — the final text that gets printed in the book. The guest&apos;s <span className="font-semibold">original (right) stays untouched</span>. Use the original as your reference while you fix the clean version.
          </p>
        </div>
      )}

      {/* Two columns */}
      <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-2">
        {/* CLEAN — editable */}
        <div className="overflow-y-auto border-r border-gray-200 p-6 space-y-5">
          <div className="flex items-center gap-2">
            <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded font-medium">
              ✓ Clean version (editable)
            </span>
            {!hasClean && (
              <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded font-medium">
                seeded from original — not cleaned yet
              </span>
            )}
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Title</div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 text-2xl font-serif text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              placeholder="Recipe title..."
            />
          </div>

          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Notes</div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full min-h-[100px] px-3 py-2 text-sm text-gray-800 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent font-sans resize-y"
              placeholder="Enter notes..."
            />
          </div>

          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Ingredients</div>
            <textarea
              value={ingredients}
              onChange={(e) => setIngredients(e.target.value)}
              className="w-full min-h-[220px] px-3 py-2 text-sm text-gray-800 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent font-sans resize-y"
              placeholder="Enter ingredients..."
            />
          </div>

          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Steps</div>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              className="w-full min-h-[220px] px-3 py-2 text-sm text-gray-800 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent font-sans resize-y"
              placeholder="Enter steps..."
            />
          </div>
        </div>

        {/* ORIGINAL — read-only */}
        <div className="overflow-y-auto p-6 space-y-5 bg-amber-50/30">
          <div className="flex items-center gap-2">
            <span className="text-xs px-2 py-1 bg-amber-100 text-amber-800 rounded font-medium">
              Original (read-only)
            </span>
          </div>
          <h3 className="text-2xl font-serif text-gray-900">{originalTitle}</h3>

          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Notes</div>
            <div className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed select-text font-sans">
              {originalNotes || 'No notes provided'}
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Ingredients</div>
            <div className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed select-text font-sans">
              {originalIngredients || 'No ingredients provided'}
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Steps</div>
            <div className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed select-text font-sans">
              {originalInstructions || 'No instructions provided'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
