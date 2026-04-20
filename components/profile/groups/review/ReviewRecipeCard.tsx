"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Pencil, ImageIcon } from "lucide-react";
import type { RecipeForReview } from "@/lib/types/database";

interface ReviewRecipeCardProps {
  recipe: RecipeForReview;
  index: number;
  total: number;
  onSave: (recipeId: string, data: {
    recipe_name: string;
    ingredients: string;
    instructions: string;
    note: string;
  }) => Promise<void>;
}

export function ReviewRecipeCard({ recipe, index, total, onSave }: ReviewRecipeCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const pr = recipe.print_ready;
  const isImageUpload = recipe.upload_method === "image" && !pr;

  // Reason: Show cleaned version if available, otherwise fall back to original
  const displayName = pr?.recipe_name_clean || recipe.recipe_name || "Untitled Recipe";
  const displayIngredients = pr?.ingredients_clean || recipe.ingredients || "";
  const displayInstructions = pr?.instructions_clean || recipe.instructions || "";
  const displayNote = pr?.note_clean ?? recipe.comments ?? "";

  const [editName, setEditName] = useState(displayName);
  const [editIngredients, setEditIngredients] = useState(displayIngredients);
  const [editInstructions, setEditInstructions] = useState(displayInstructions);
  const [editNote, setEditNote] = useState(displayNote);

  const guest = recipe.guests;
  const guestName = guest
    ? (guest.printed_name || `${guest.first_name} ${guest.last_name || ""}`.trim())
    : "Unknown Guest";

  const handleStartEdit = () => {
    setEditName(displayName);
    setEditIngredients(displayIngredients);
    setEditInstructions(displayInstructions);
    setEditNote(displayNote);
    setIsEditing(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(recipe.id, {
        recipe_name: editName,
        ingredients: editIngredients,
        instructions: editInstructions,
        note: editNote,
      });
      setIsEditing(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-[#FAF7F2] rounded-xl shadow-sm border border-gray-100 mx-auto w-full max-w-3xl h-full flex flex-col">
      {/* Scrollable content area — matches BookReviewOverlay left page */}
      <div className="p-8 lg:p-12 flex-1 overflow-y-auto">
        <div>
          {/* Top row: guest name + edit link */}
          <div className="flex items-start justify-between mb-2">
            <p className="text-xs uppercase tracking-[0.2em] text-gray-400 font-serif">
              {guestName}
            </p>
            {!isImageUpload && !isEditing && (
              <button
                onClick={handleStartEdit}
                className="text-xs text-gray-400 hover:text-brand-honey transition-colors flex items-center gap-1"
              >
                <Pencil className="h-3 w-3" /> Edit
              </button>
            )}
            {!isImageUpload && isEditing && (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsEditing(false)}
                  disabled={saving}
                  className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="text-xs text-brand-honey hover:text-[#c49a4a] font-medium transition-colors"
                >
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            )}
          </div>

          {/* Recipe title */}
          {isEditing ? (
            <input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full text-3xl lg:text-4xl font-serif text-gray-900 mb-4 leading-tight bg-white border border-gray-200 rounded px-3 py-2 focus:outline-none focus:border-brand-honey"
            />
          ) : (
            <h1 className="text-3xl lg:text-4xl font-serif text-gray-900 mb-4 leading-tight">
              {displayName}
            </h1>
          )}

          {/* Personal note */}
          {isEditing ? (
            <textarea
              value={editNote}
              onChange={(e) => setEditNote(e.target.value)}
              placeholder="Personal note (optional)"
              rows={2}
              className="w-full text-sm italic text-gray-500 font-serif mb-6 bg-white border border-gray-200 rounded px-3 py-2 focus:outline-none focus:border-brand-honey resize-none"
            />
          ) : displayNote.trim() ? (
            <p className="text-sm italic text-gray-500 font-serif mb-6">
              &ldquo;{displayNote}&rdquo;
            </p>
          ) : null}

          {/* Divider */}
          <div className="border-t border-gray-200 my-6" />

          {/* Image-upload info */}
          {isImageUpload && (
            <div className="rounded-lg bg-brand-honey/10 border border-brand-honey/30 p-4 mb-6">
              <div className="flex items-start gap-3">
                <ImageIcon className="h-5 w-5 text-brand-honey mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-brand-charcoal">
                    This recipe was uploaded as an image.
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    We will manually format it after book closure. No action needed from you.
                  </p>
                </div>
              </div>
              {recipe.document_urls && recipe.document_urls.length > 0 && (
                <div className="mt-4 flex gap-3 overflow-x-auto">
                  {recipe.document_urls.map((url, i) => (
                    <div key={i} className="relative w-32 h-32 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                      <Image src={url} alt="Uploaded recipe" fill className="object-cover" sizes="128px" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {!isImageUpload && (
            <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-6">
              {/* Ingredients */}
              <div className="min-w-0">
                <h3 className="text-xs uppercase tracking-[0.15em] text-gray-500 font-semibold mb-3">
                  Ingredients
                </h3>
                {isEditing ? (
                  <textarea
                    value={editIngredients}
                    onChange={(e) => setEditIngredients(e.target.value)}
                    rows={10}
                    className="w-full text-sm text-gray-700 font-serif leading-relaxed bg-white border border-gray-200 rounded px-3 py-2 resize-y focus:outline-none focus:border-brand-honey"
                  />
                ) : displayIngredients.trim() ? (
                  <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed font-serif">
                    {displayIngredients}
                  </p>
                ) : (
                  <p className="text-sm text-gray-400 italic">No ingredients provided</p>
                )}
              </div>

              {/* Instructions */}
              <div>
                <h3 className="text-xs uppercase tracking-[0.15em] text-gray-500 font-semibold mb-3">
                  Instructions
                </h3>
                {isEditing ? (
                  <textarea
                    value={editInstructions}
                    onChange={(e) => setEditInstructions(e.target.value)}
                    rows={14}
                    className="w-full text-sm text-gray-700 font-serif leading-[1.6] bg-white border border-gray-200 rounded px-3 py-2 resize-y focus:outline-none focus:border-brand-honey"
                  />
                ) : displayInstructions.trim() ? (
                  <div className="text-sm text-gray-700 font-serif leading-[1.6]">
                    {displayInstructions.split('\n').map((line, i) => (
                      line.trim() === ''
                        ? <div key={i} className="h-[2em]" />
                        : <p key={i} className="m-0">{line}</p>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 italic">No instructions provided</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Book page footer — always pinned to bottom */}
      <div className="flex justify-between items-center px-8 lg:px-12 py-3 border-t border-gray-100 flex-shrink-0">
        <span className="text-xs text-gray-400">{index + 1}</span>
        <span className="text-xs text-gray-400 tracking-wide">Small Plates & Company</span>
        <span className="text-xs text-gray-400">{total} recipes</span>
      </div>
    </div>
  );
}
