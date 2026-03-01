"use client";

import React from 'react';
import { Edit3 } from 'lucide-react';

interface SummaryStepProps {
  recipeName: string;
  ingredients: string;
  instructions: string;
  personalNote?: string;
  guestName?: string;
  onEditSection?: (section: 'title' | 'ingredients' | 'instructions' | 'note') => void;
}

export default function SummaryStep({ recipeName, ingredients, instructions, personalNote, guestName, onEditSection }: SummaryStepProps) {
  return (
    <div className="max-w-4xl mx-auto" role="region" aria-labelledby="summary-heading">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 id="summary-heading" className="text-[#2D2D2D] text-lg md:text-xl leading-relaxed font-light font-serif">Review your recipe</h2>
        {onEditSection && (
          <button
            type="button"
            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 hover:border-gray-400 rounded-lg transition-colors"
            onClick={() => onEditSection('title')}
          >
            <Edit3 className="w-4 h-4" />
            Edit
          </button>
        )}
      </div>

      {/* Guest name — small caps above recipe title */}
      {guestName && (
        <p className="text-sm uppercase tracking-[0.2em] text-gray-400 font-serif mb-2">
          {guestName}
        </p>
      )}

      {/* Recipe title */}
      <h1 className="font-serif text-3xl md:text-4xl font-semibold text-[#2D2D2D] leading-tight mb-4">
        {recipeName || 'Untitled Recipe'}
      </h1>

      {/* Personal note */}
      {personalNote && personalNote.trim() && (
        <p className="text-base italic text-gray-500 font-serif mb-6">
          &ldquo;{personalNote}&rdquo;
        </p>
      )}

      <div className="border-t border-gray-200 my-6" />

      {/* Two column layout — matches print layout */}
      <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-6">
        {/* Ingredients */}
        <div>
          <h3 className="text-xs uppercase tracking-[0.15em] text-gray-500 font-semibold mb-3">
            Ingredients
          </h3>
          <div className="space-y-1">
            {ingredients ? (
              ingredients.split('\n').filter(line => line.trim()).map((line, index) => (
                <p key={index} className="text-base text-gray-700 leading-relaxed font-serif">
                  {line}
                </p>
              ))
            ) : (
              <p className="text-gray-400 italic text-sm">No ingredients listed</p>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div>
          <h3 className="text-xs uppercase tracking-[0.15em] text-gray-500 font-semibold mb-3">
            Instructions
          </h3>
          <div className="space-y-2">
            {instructions ? (
              instructions.split('\n').filter(line => line.trim()).map((line, index) => {
                const hasNumber = line.trim().match(/^\d+\./) || line.trim().match(/^•/);
                return (
                  <p key={index} className="text-base text-gray-700 font-serif leading-[1.6]">
                    {hasNumber ? line : `${index + 1}. ${line}`}
                  </p>
                );
              })
            ) : (
              <p className="text-gray-400 italic text-sm">No instructions provided</p>
            )}
          </div>
        </div>
      </div>

      <div className="border-t border-[#D4A854]/20 mt-8"></div>
    </div>
  );
}

