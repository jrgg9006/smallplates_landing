'use client';

import { useState, useEffect } from 'react';

interface PromptEvaluationSectionProps {
  recipeId: string;
  promptText: string | null;
  midjourneyImageUrl: string | null;
  dishCategory: string | null;
  agentMetadata: any;
  onEvaluationSaved?: () => void;
}

interface ExistingEvaluation {
  id: string;
  rating: number;
  what_worked: string | null;
  what_failed: string | null;
  notes: string | null;
  was_edited: boolean | null;
  edited_prompt: string | null;
  created_at: string;
}

export default function PromptEvaluationSection({
  recipeId,
  promptText,
  midjourneyImageUrl,
  dishCategory,
  agentMetadata,
  onEvaluationSaved,
}: PromptEvaluationSectionProps) {
  const [rating, setRating] = useState<number>(0);
  const [whatWorked, setWhatWorked] = useState('');
  const [whatFailed, setWhatFailed] = useState('');
  const [notes, setNotes] = useState('');
  const [wasEdited, setWasEdited] = useState(false);
  const [editedPrompt, setEditedPrompt] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existingEvaluation, setExistingEvaluation] = useState<ExistingEvaluation | null>(null);
  const [loading, setLoading] = useState(true);

  // Load existing evaluation if any
  useEffect(() => {
    const loadExistingEvaluation = async () => {
      try {
        const response = await fetch(`/api/v1/admin/prompt-evaluations?recipe_id=${recipeId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.evaluation) {
            setExistingEvaluation(data.evaluation);
            setRating(data.evaluation.rating);
            setWhatWorked(data.evaluation.what_worked || '');
            setWhatFailed(data.evaluation.what_failed || '');
            setNotes(data.evaluation.notes || '');
            setWasEdited(data.evaluation.was_edited || false);
            setEditedPrompt(data.evaluation.edited_prompt || promptText || '');
          }
        }
      } catch (err) {
        console.error('Error loading evaluation:', err);
      } finally {
        setLoading(false);
      }
    };

    if (recipeId) {
      loadExistingEvaluation();
    }
    // Reason: promptText is used as fallback for editedPrompt when no saved evaluation exists
  }, [recipeId, promptText]);

  const handleSave = async () => {
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/v1/admin/prompt-evaluations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipe_id: recipeId,
          prompt_text: promptText,
          midjourney_image_url: midjourneyImageUrl,
          rating,
          what_worked: whatWorked.trim() || null,
          what_failed: whatFailed.trim() || null,
          notes: notes.trim() || null,
          was_edited: wasEdited,
          edited_prompt: wasEdited ? editedPrompt.trim() || null : null,
          dish_category: dishCategory,
          hero_element: agentMetadata?.hero_element || null,
          container_used: agentMetadata?.container || null,
          agent_version: agentMetadata?.generator_version || '2.1.0',
          generation_duration_ms: agentMetadata?.total_duration_ms || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save evaluation');
      }

      const data = await response.json();
      setExistingEvaluation(data.evaluation);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      
      if (onEvaluationSaved) {
        onEvaluationSaved();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  // Don't show if no prompt
  if (!promptText) {
    return null;
  }

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-48 mb-4"></div>
        <div className="h-32 bg-gray-100 rounded"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xl font-semibold text-gray-900">
          Evaluate Prompt
        </h3>
        {existingEvaluation && (
          <span className="text-sm text-green-600 flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Evaluated on {new Date(existingEvaluation.created_at).toLocaleDateString()}
          </span>
        )}
      </div>
      
      <div className="bg-gray-50 border border-gray-200 p-6 rounded-lg shadow-sm space-y-5">
        {/* Rating Stars */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Rating <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className={`text-3xl transition-colors ${
                  star <= rating ? 'text-yellow-400' : 'text-gray-300'
                } hover:text-yellow-400`}
              >
                ★
              </button>
            ))}
            <span className="ml-2 text-sm text-gray-500 self-center">
              {rating === 0 && 'Select rating'}
              {rating === 1 && 'Poor - Major issues'}
              {rating === 2 && 'Below Average'}
              {rating === 3 && 'Average - Acceptable'}
              {rating === 4 && 'Good - Minor tweaks'}
              {rating === 5 && 'Excellent - Perfect!'}
            </span>
          </div>
        </div>

        {/* What Worked - Show for ratings 3+ */}
        {rating >= 3 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              What worked well?
            </label>
            <textarea
              value={whatWorked}
              onChange={(e) => setWhatWorked(e.target.value)}
              placeholder="e.g., The yolk break looked amazing, lighting was perfect..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              rows={2}
            />
          </div>
        )}

        {/* What Failed - Show for ratings 3 or less */}
        {rating > 0 && rating <= 3 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              What Failed?
              <span className="text-gray-400 font-normal ml-1">(helps improve the AI)</span>
            </label>
            <textarea
              value={whatFailed}
              onChange={(e) => setWhatFailed(e.target.value)}
              placeholder="e.g., Muy genérico, no describe la textura del pan crujiente..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              rows={2}
            />
          </div>
        )}

        {/* Separator */}
        {rating > 0 && (
          <div className="border-t border-gray-200 pt-5">
            {/* Edit Prompt Toggle */}
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">
                Did you edit the prompt manually?
              </label>
              <button
                type="button"
                onClick={() => {
                  setWasEdited(!wasEdited);
                  if (!wasEdited) {
                    setEditedPrompt(promptText || '');
                  }
                }}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  wasEdited ? 'bg-black' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    wasEdited ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Edited Prompt Textarea - Show when toggle is ON */}
            {wasEdited && (
              <div className="space-y-3">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-sm text-yellow-800">
                    <strong>💡 Tip:</strong> Paste your edited prompt below.
                  </p>
                </div>
                <textarea
                  value={editedPrompt}
                  onChange={(e) => setEditedPrompt(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent resize-none font-mono text-sm"
                  rows={4}
                  placeholder="Paste your edited prompt here..."
                />
              </div>
            )}
          </div>
        )}

        {/* Additional Details - Collapsible */}
        {rating > 0 && (
          <details className="border border-gray-200 rounded-lg">
            <summary className="px-4 py-3 cursor-pointer text-sm font-medium text-gray-700 hover:bg-gray-50">
              ▸ Additional Details (optional)
            </summary>
            <div className="px-4 py-3 border-t border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any other observations..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                rows={2}
              />
            </div>
          </details>
        )}

        {/* Error Message */}
        {error && (
          <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
            {error}
          </div>
        )}

        {/* Save Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving || rating === 0}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              saving || rating === 0
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-black text-white hover:bg-gray-800'
            }`}
          >
            {saving ? (
              <>
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Saving...</span>
              </>
            ) : (
              <span>{existingEvaluation ? 'Update Evaluation' : 'Save Evaluation'}</span>
            )}
          </button>
          
          {saved && (
            <span className="text-sm text-green-600 flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Saved!
            </span>
          )}
        </div>
      </div>
    </div>
  );
}