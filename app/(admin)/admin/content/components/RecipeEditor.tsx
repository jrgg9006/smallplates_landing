"use client";

import { useState, useEffect } from 'react';
import { AlertCircle, Loader2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import EditHistoryPanel, { type EditHistoryEntry } from './EditHistoryPanel';

type EditTarget = 'original' | 'print_ready';

interface RecipeEditorProps {
  recipeId: string | null;
  onClose: () => void;
  onSaved: () => void;
}

interface PrintReadyData {
  recipe_name_clean: string;
  ingredients_clean: string;
  instructions_clean: string;
  detected_language: string | null;
  cleaning_version: number;
  updated_at: string;
}

export default function RecipeEditor({ recipeId, onClose, onSaved }: RecipeEditorProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [activeTarget, setActiveTarget] = useState<EditTarget>('original');
  const [showHistory, setShowHistory] = useState(false);

  // Original fields
  const [recipeName, setRecipeName] = useState('');
  const [ingredients, setIngredients] = useState('');
  const [instructions, setInstructions] = useState('');
  const [comments, setComments] = useState('');

  // Print-ready fields
  const [prRecipeName, setPrRecipeName] = useState('');
  const [prIngredients, setPrIngredients] = useState('');
  const [prInstructions, setPrInstructions] = useState('');
  const [hasPrintReady, setHasPrintReady] = useState(false);
  const [prMeta, setPrMeta] = useState<{ language: string | null; version: number; updated: string } | null>(null);

  const [editReason, setEditReason] = useState('');
  const [guestInfo, setGuestInfo] = useState('');
  const [history, setHistory] = useState<EditHistoryEntry[]>([]);

  useEffect(() => {
    if (recipeId) {
      setActiveTarget('original');
      setShowHistory(false);
      fetchRecipe(recipeId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipeId]);

  const fetchRecipe = async (id: string) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch(`/api/v1/admin/content/recipes/${id}`);
      if (!res.ok) throw new Error('Failed to load recipe');

      const data = await res.json();
      const recipe = data.recipe;
      const pr: PrintReadyData | null = data.print_ready;

      // Original
      setRecipeName(recipe.recipe_name);
      setIngredients(recipe.ingredients);
      setInstructions(recipe.instructions);
      setComments(recipe.comments || '');

      // Print-ready
      if (pr) {
        setHasPrintReady(true);
        setPrRecipeName(pr.recipe_name_clean);
        setPrIngredients(pr.ingredients_clean);
        setPrInstructions(pr.instructions_clean);
        setPrMeta({
          language: pr.detected_language,
          version: pr.cleaning_version,
          updated: pr.updated_at,
        });
      } else {
        setHasPrintReady(false);
        setPrRecipeName('');
        setPrIngredients('');
        setPrInstructions('');
        setPrMeta(null);
      }

      setEditReason('');
      setHistory(data.history || []);

      if (recipe.guests) {
        setGuestInfo(`${recipe.guests.first_name} ${recipe.guests.last_name} (${recipe.guests.email})`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load recipe');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    const isOriginal = activeTarget === 'original';
    const name = isOriginal ? recipeName : prRecipeName;
    const ing = isOriginal ? ingredients : prIngredients;
    const inst = isOriginal ? instructions : prInstructions;

    if (!recipeId || !name.trim() || !ing.trim() || !inst.trim()) {
      setError('Recipe name, ingredients, and instructions are required');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const payload: Record<string, unknown> = {
        recipe_name: name,
        ingredients: ing,
        instructions: inst,
        edit_reason: editReason || null,
        target: activeTarget,
      };

      if (isOriginal) {
        payload.comments = comments || null;
      }

      const res = await fetch(`/api/v1/admin/content/recipes/${recipeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save');
      }

      setSuccess(true);
      setEditReason('');
      await fetchRecipe(recipeId);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const isOriginal = activeTarget === 'original';

  return (
    <Sheet open={!!recipeId} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-[70vw] flex flex-col overflow-hidden">
        <SheetHeader className="flex-shrink-0">
          <SheetTitle>Edit Recipe</SheetTitle>
          <SheetDescription>
            {guestInfo && <span>Guest: {guestInfo}</span>}
          </SheetDescription>
        </SheetHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : (
          <>
            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto flex flex-col gap-4 mt-4 pb-4">
              {/* Version Toggle */}
              <div className="flex rounded-lg border overflow-hidden">
                <button
                  type="button"
                  onClick={() => { setActiveTarget('original'); setError(null); setSuccess(false); }}
                  className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors ${
                    isOriginal
                      ? 'bg-gray-900 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Original
                  <span className="block text-xs font-normal opacity-70">
                    What the user sees
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => { setActiveTarget('print_ready'); setError(null); setSuccess(false); }}
                  className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors border-l ${
                    !isOriginal
                      ? 'bg-gray-900 text-white'
                      : hasPrintReady
                        ? 'bg-white text-gray-600 hover:bg-gray-50'
                        : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  Print Ready
                  <span className="block text-xs font-normal opacity-70">
                    {hasPrintReady ? 'What gets printed' : 'Not available yet'}
                  </span>
                </button>
              </div>

              {/* Metadata row: print-ready info + edit history count */}
              <div className="text-xs text-gray-500 flex gap-3">
                {!isOriginal && hasPrintReady && prMeta && (
                  <>
                    {prMeta.language && <span>Language: {prMeta.language}</span>}
                    <span>Version: {prMeta.version}</span>
                    <span>Updated: {new Date(prMeta.updated).toLocaleDateString()}</span>
                    <span className="text-gray-300">|</span>
                  </>
                )}
                {history.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => setShowHistory(!showHistory)}
                    className="underline hover:text-gray-700 transition-colors"
                  >
                    {history.length} edit{history.length > 1 ? 's' : ''} {showHistory ? '(hide)' : '(show)'}
                  </button>
                ) : (
                  <span>No edits yet</span>
                )}
              </div>

              {showHistory && history.length > 0 && (
                <EditHistoryPanel history={history} />
              )}

              {/* No print-ready warning */}
              {!isOriginal && !hasPrintReady && (
                <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-700">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  This recipe has not been cleaned yet. No print-ready version exists.
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              {success && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
                  {isOriginal ? 'Original' : 'Print-ready'} recipe saved successfully
                </div>
              )}

              {/* Form fields — show original or print-ready */}
              {(isOriginal || hasPrintReady) && (
                <>
                  <div>
                    <Label className="text-sm font-medium">Recipe Name</Label>
                    <Input
                      value={isOriginal ? recipeName : prRecipeName}
                      onChange={(e) => isOriginal ? setRecipeName(e.target.value) : setPrRecipeName(e.target.value)}
                      className="mt-1"
                    />
                  </div>

                  {/* Comments only for original — print_ready has no comments */}
                  {isOriginal && (
                    <div>
                      <Label className="text-sm font-medium">Comments</Label>
                      <textarea
                        value={comments}
                        onChange={(e) => setComments(e.target.value)}
                        rows={3}
                        className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent resize-y"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-[2fr_3fr] gap-4 flex-1 min-h-0">
                    <div className="flex flex-col">
                      <Label className="text-sm font-medium flex-shrink-0">Ingredients</Label>
                      <textarea
                        value={isOriginal ? ingredients : prIngredients}
                        onChange={(e) => isOriginal ? setIngredients(e.target.value) : setPrIngredients(e.target.value)}
                        className="mt-1 w-full flex-1 min-h-[200px] rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent resize-y"
                      />
                    </div>
                    <div className="flex flex-col">
                      <Label className="text-sm font-medium flex-shrink-0">Instructions</Label>
                      <textarea
                        value={isOriginal ? instructions : prInstructions}
                        onChange={(e) => isOriginal ? setInstructions(e.target.value) : setPrInstructions(e.target.value)}
                        className="mt-1 w-full flex-1 min-h-[200px] rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent resize-y"
                      />
                    </div>
                  </div>
                </>
              )}

            </div>

            {/* Sticky bottom bar */}
            {(isOriginal || hasPrintReady) && (
              <div className="flex-shrink-0 border-t bg-white pt-3 pb-2 space-y-3">
                <div>
                  <Label className="text-sm font-medium">Edit Reason (optional)</Label>
                  <Input
                    value={editReason}
                    onChange={(e) => setEditReason(e.target.value)}
                    placeholder="e.g., Fixed formatting, corrected ingredient amounts"
                    className="mt-1"
                  />
                </div>
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save {isOriginal ? 'Original' : 'Print Ready'}
                </Button>
              </div>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
