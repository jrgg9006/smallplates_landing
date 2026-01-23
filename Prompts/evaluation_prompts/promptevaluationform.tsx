"use client";

import React, { useState, useEffect } from 'react';

interface PromptEvaluation {
  id?: string;
  recipe_id: string;
  prompt_text: string;
  rating: number;
  what_worked: string | null;
  what_failed: string | null;
  notes: string | null;
  was_edited: boolean;
  edited_prompt: string | null;
  midjourney_image_url: string | null;
  dish_category: string | null;
  hero_element: string | null;
  container_used: string | null;
}

interface PromptEvaluationFormProps {
  recipeId: string;
  originalPrompt: string;
  dishCategory?: string | null;
  generatedImageUrl?: string | null;
  existingEvaluation?: PromptEvaluation | null;
  onSaved?: () => void;
}

export function PromptEvaluationForm({
  recipeId,
  originalPrompt,
  dishCategory,
  generatedImageUrl,
  existingEvaluation,
  onSaved,
}: PromptEvaluationFormProps) {
  // Form state
  const [rating, setRating] = useState<number>(existingEvaluation?.rating || 0);
  const [whatWorked, setWhatWorked] = useState(existingEvaluation?.what_worked || '');
  const [whatFailed, setWhatFailed] = useState(existingEvaluation?.what_failed || '');
  const [notes, setNotes] = useState(existingEvaluation?.notes || '');
  const [isEditing, setIsEditing] = useState(existingEvaluation?.was_edited || false);
  const [editedPrompt, setEditedPrompt] = useState(existingEvaluation?.edited_prompt || originalPrompt);
  const [heroElement, setHeroElement] = useState(existingEvaluation?.hero_element || '');
  const [containerUsed, setContainerUsed] = useState(existingEvaluation?.container_used || '');
  
  // UI state
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [hoveredStar, setHoveredStar] = useState(0);

  // Reset form when recipe changes
  useEffect(() => {
    if (existingEvaluation) {
      setRating(existingEvaluation.rating);
      setWhatWorked(existingEvaluation.what_worked || '');
      setWhatFailed(existingEvaluation.what_failed || '');
      setNotes(existingEvaluation.notes || '');
      setIsEditing(existingEvaluation.was_edited);
      setEditedPrompt(existingEvaluation.edited_prompt || originalPrompt);
      setHeroElement(existingEvaluation.hero_element || '');
      setContainerUsed(existingEvaluation.container_used || '');
    } else {
      setRating(0);
      setWhatWorked('');
      setWhatFailed('');
      setNotes('');
      setIsEditing(false);
      setEditedPrompt(originalPrompt);
      setHeroElement('');
      setContainerUsed('');
    }
    setSuccess(false);
    setError(null);
  }, [recipeId, existingEvaluation, originalPrompt]);

  const handleSave = async () => {
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const payload = {
        recipe_id: recipeId,
        prompt_text: originalPrompt,
        rating,
        what_worked: whatWorked || null,
        what_failed: whatFailed || null,
        notes: notes || null,
        was_edited: isEditing,
        edited_prompt: isEditing ? editedPrompt : null,
        midjourney_image_url: generatedImageUrl || null,
        dish_category: dishCategory || null,
        hero_element: heroElement || null,
        container_used: containerUsed || null,
      };

      const method = existingEvaluation?.id ? 'PATCH' : 'POST';
      const url = existingEvaluation?.id 
        ? `/api/v1/admin/operations/recipes/${recipeId}/evaluation/${existingEvaluation.id}`
        : `/api/v1/admin/operations/recipes/${recipeId}/evaluation`;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save evaluation');
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      
      if (onSaved) {
        onSaved();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const StarRating = () => (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => setRating(star)}
          onMouseEnter={() => setHoveredStar(star)}
          onMouseLeave={() => setHoveredStar(0)}
          className="p-1 transition-transform hover:scale-110"
        >
          <svg
            className={`w-8 h-8 ${
              star <= (hoveredStar || rating)
                ? 'text-yellow-400 fill-yellow-400'
                : 'text-gray-300'
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
            />
          </svg>
        </button>
      ))}
      <span className="ml-2 text-sm text-gray-500">
        {rating === 0 && 'Select rating'}
        {rating === 1 && 'Poor - Major issues'}
        {rating === 2 && 'Below Average'}
        {rating === 3 && 'Average - Acceptable'}
        {rating === 4 && 'Good - Minor tweaks'}
        {rating === 5 && 'Excellent - Perfect!'}
      </span>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Rating */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Rating <span className="text-red-500">*</span>
        </label>
        <StarRating />
      </div>

      {/* What Worked - Show when rating >= 3 */}
      {rating >= 3 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            What Worked? 
            <span className="text-gray-400 font-normal ml-1">(optional)</span>
          </label>
          <textarea
            value={whatWorked}
            onChange={(e) => setWhatWorked(e.target.value)}
            placeholder="e.g., 'Great texture description', 'Perfect portion size', 'Loved the lighting suggestion'..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent resize-none"
            rows={2}
          />
        </div>
      )}

      {/* What Failed - Show when rating <= 3 */}
      {rating > 0 && rating <= 3 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            What Failed?
            <span className="text-gray-400 font-normal ml-1">(helps improve the AI)</span>
          </label>
          <textarea
            value={whatFailed}
            onChange={(e) => setWhatFailed(e.target.value)}
            placeholder="e.g., 'Too generic', 'Wrong container suggested', 'Missing key ingredient'..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent resize-none"
            rows={2}
          />
        </div>
      )}

      {/* Edit Prompt Toggle */}
      <div className="border-t border-gray-200 pt-4">
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-medium text-gray-700">
            Did you edit the prompt manually?
          </label>
          <button
            type="button"
            onClick={() => {
              setIsEditing(!isEditing);
              if (!isEditing) {
                setEditedPrompt(originalPrompt);
              }
            }}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              isEditing ? 'bg-black' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                isEditing ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {isEditing && (
          <div className="space-y-3">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800">
                <strong>💡 Tip:</strong> Paste your edited prompt below. This helps the AI learn what works better.
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

      {/* Additional Metadata (collapsible) */}
      <details className="border border-gray-200 rounded-lg">
        <summary className="px-4 py-3 cursor-pointer text-sm font-medium text-gray-700 hover:bg-gray-50">
          Additional Details (optional)
        </summary>
        <div className="px-4 py-3 border-t border-gray-200 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hero Element
            </label>
            <input
              type="text"
              value={heroElement}
              onChange={(e) => setHeroElement(e.target.value)}
              placeholder="e.g., 'melted cheese', 'golden crust', 'fresh herbs'"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Container Used
            </label>
            <input
              type="text"
              value={containerUsed}
              onChange={(e) => setContainerUsed(e.target.value)}
              placeholder="e.g., 'small ceramic plate', 'wooden board', 'glass bowl'"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any other observations..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent resize-none text-sm"
              rows={2}
            />
          </div>
        </div>
      </details>

      {/* Error/Success Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <p className="text-sm text-green-700">✓ Evaluation saved successfully!</p>
        </div>
      )}

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving || rating === 0}
          className="px-6 py-2.5 text-sm font-medium text-white bg-black rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>{existingEvaluation?.id ? 'Update Evaluation' : 'Save Evaluation'}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}