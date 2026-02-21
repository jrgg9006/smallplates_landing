"use client";

import { useState, useEffect, useRef } from 'react';
import { AlertCircle, ChevronLeft, ChevronRight, Loader2, Save } from 'lucide-react';
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

/** Textarea that shows visual spacing for blank lines when not focused */
function VisualTextarea({
  value,
  onChange,
  className = '',
}: {
  value: string;
  onChange: (val: string) => void;
  className?: string;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isEditing]);

  if (isEditing) {
    return (
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={() => setIsEditing(false)}
        className={className}
      />
    );
  }

  const lines = value.split('\n');

  return (
    <div
      onClick={() => setIsEditing(true)}
      className={`${className} cursor-text overflow-y-auto`}
    >
      {!value ? (
        <span className="text-gray-400 italic">Click to edit...</span>
      ) : (
        lines.map((line, i) =>
          line.trim() === '' ? (
            <div key={i} className="h-6 flex items-center my-1">
              <div className="w-full border-t-2 border-dashed border-amber-300/70" />
            </div>
          ) : (
            <div key={i} className="leading-relaxed">{line}</div>
          )
        )
      )}
    </div>
  );
}

interface RecipeEditorProps {
  recipeId: string | null;
  recipeIds?: string[];
  onClose: () => void;
  onSaved: () => void;
  onNavigate?: (recipeId: string) => void;
}

interface PrintReadyData {
  recipe_name_clean: string;
  ingredients_clean: string;
  instructions_clean: string;
  note_clean: string | null;
  detected_language: string | null;
  cleaning_version: number;
  updated_at: string;
}

export default function RecipeEditor({ recipeId, recipeIds = [], onClose, onSaved, onNavigate }: RecipeEditorProps) {
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
  const [prNoteClean, setPrNoteClean] = useState('');
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
        setPrNoteClean(pr.note_clean || '');
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
        setPrNoteClean('');
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
      } else {
        payload.note_clean = prNoteClean || null;
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
      <SheetContent className="w-full sm:max-w-[95vw] h-[95vh] flex flex-col overflow-hidden">
        {/* Compact header with navigation */}
        <SheetHeader className="flex-shrink-0 pb-2">
          <div className="flex items-center justify-center gap-6">
            <div className="flex items-baseline gap-3">
              <SheetTitle className="text-lg">Edit Recipe</SheetTitle>
              {guestInfo && (
                <SheetDescription className="text-sm">
                  Guest: {guestInfo}
                </SheetDescription>
              )}
            </div>
            {recipeIds.length > 1 && onNavigate && recipeId && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">
                  {recipeIds.indexOf(recipeId) + 1} / {recipeIds.length}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const idx = recipeIds.indexOf(recipeId);
                    if (idx > 0) onNavigate(recipeIds[idx - 1]);
                  }}
                  disabled={recipeIds.indexOf(recipeId) === 0}
                  className="p-1.5 rounded-md border hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const idx = recipeIds.indexOf(recipeId);
                    if (idx < recipeIds.length - 1) onNavigate(recipeIds[idx + 1]);
                  }}
                  disabled={recipeIds.indexOf(recipeId) === recipeIds.length - 1}
                  className="p-1.5 rounded-md border hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </SheetHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : (
          <div className="flex-1 flex gap-4 min-h-0">
            {/* LEFT: Main form area */}
            <div className="flex-1 flex flex-col gap-3 min-h-0 min-w-0">
              {/* Alerts */}
              {!isOriginal && !hasPrintReady && (
                <div className="flex items-center gap-2 p-2.5 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-700 flex-shrink-0">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  This recipe has not been cleaned yet. No print-ready version exists.
                </div>
              )}
              {error && (
                <div className="flex items-center gap-2 p-2.5 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex-shrink-0">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}
              {success && (
                <div className="p-2.5 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 flex-shrink-0">
                  {isOriginal ? 'Original' : 'Print-ready'} recipe saved successfully
                </div>
              )}

              {(isOriginal || hasPrintReady) && (
                <>
                  {/* Recipe Name — compact row */}
                  <div className="flex-shrink-0">
                    <Label className="text-sm font-medium">Recipe Name</Label>
                    <Input
                      value={isOriginal ? recipeName : prRecipeName}
                      onChange={(e) => isOriginal ? setRecipeName(e.target.value) : setPrRecipeName(e.target.value)}
                      className="mt-1"
                    />
                  </div>

                  {/* Comments / Note — medium */}
                  <div className="flex-shrink-0">
                    <Label className="text-sm font-medium">{isOriginal ? 'Comments' : 'Note (clean)'}</Label>
                    <VisualTextarea
                      value={isOriginal ? comments : prNoteClean}
                      onChange={(val) => isOriginal ? setComments(val) : setPrNoteClean(val)}
                      className="mt-1 w-full min-h-[80px] max-h-[150px] rounded-md border border-gray-300 px-3 py-2 text-sm"
                    />
                  </div>

                  {/* Ingredients + Instructions — fill all remaining space */}
                  <div className="grid grid-cols-[2fr_3fr] gap-4 flex-1 min-h-0">
                    <div className="flex flex-col min-h-0">
                      <Label className="text-sm font-medium flex-shrink-0">Ingredients</Label>
                      <VisualTextarea
                        value={isOriginal ? ingredients : prIngredients}
                        onChange={(val) => isOriginal ? setIngredients(val) : setPrIngredients(val)}
                        className="mt-1 w-full flex-1 min-h-0 rounded-md border border-gray-300 px-3 py-2 text-sm"
                      />
                    </div>
                    <div className="flex flex-col min-h-0">
                      <Label className="text-sm font-medium flex-shrink-0">Instructions</Label>
                      <VisualTextarea
                        value={isOriginal ? instructions : prInstructions}
                        onChange={(val) => isOriginal ? setInstructions(val) : setPrInstructions(val)}
                        className="mt-1 w-full flex-1 min-h-0 rounded-md border border-gray-300 px-3 py-2 text-sm"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* RIGHT: Sidebar — tabs, metadata, save */}
            <div className="w-48 flex-shrink-0 flex flex-col gap-3 border-l pl-4">
              {/* Version Toggle — stacked */}
              <div className="flex flex-col rounded-lg border overflow-hidden">
                <button
                  type="button"
                  onClick={() => { setActiveTarget('original'); setError(null); setSuccess(false); }}
                  className={`px-3 py-2.5 text-sm font-medium transition-colors text-left ${
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
                  className={`px-3 py-2.5 text-sm font-medium transition-colors border-t text-left ${
                    !isOriginal
                      ? 'bg-gray-900 text-white'
                      : hasPrintReady
                        ? 'bg-white text-gray-600 hover:bg-gray-50'
                        : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  Print Ready
                  <span className="block text-xs font-normal opacity-70">
                    {hasPrintReady ? 'What gets printed' : 'Not available'}
                  </span>
                </button>
              </div>

              {/* Metadata */}
              <div className="text-xs text-gray-500 space-y-1">
                {!isOriginal && hasPrintReady && prMeta && (
                  <>
                    {prMeta.language && <div>Lang: {prMeta.language}</div>}
                    <div>Version: {prMeta.version}</div>
                    <div>Updated: {new Date(prMeta.updated).toLocaleDateString()}</div>
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
                <div className="overflow-y-auto max-h-40">
                  <EditHistoryPanel history={history} />
                </div>
              )}

              {/* Spacer */}
              <div className="flex-1" />

              {/* Edit Reason + Save — pinned to bottom */}
              {(isOriginal || hasPrintReady) && (
                <div className="space-y-2">
                  <div>
                    <Label className="text-xs font-medium">Edit Reason</Label>
                    <Input
                      value={editReason}
                      onChange={(e) => setEditReason(e.target.value)}
                      placeholder="optional"
                      className="mt-1 text-sm"
                    />
                  </div>
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full"
                    size="sm"
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-1" />
                    ) : (
                      <Save className="w-4 h-4 mr-1" />
                    )}
                    Save {isOriginal ? 'Original' : 'Print Ready'}
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
