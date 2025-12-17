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
    <div className="space-y-8 max-w-4xl mx-auto" role="region" aria-labelledby="summary-heading">
      <div>
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
        
        {/* Recipe Title - Large serif like in AddAPlate */}
        <div className="relative group">
          <h1 className="font-serif text-4xl md:text-5xl font-semibold text-[#2D2D2D] leading-tight">
            {recipeName || 'Untitled Recipe'}
          </h1>
          {/* Guest signature - exactly like in AddASmallPlate modal */}
          {guestName && (
            <p className="font-serif italic text-gray-500 text-2xl mt-6">
              Shared by {guestName}
            </p>
          )}
        </div>
      </div>

      {/* Personal Note - if exists */}
      {personalNote && personalNote.trim() && (
        <div className="relative group mb-16">
          <p className="text-gray-600 text-base leading-relaxed">
            {personalNote}
          </p>
        </div>
      )}

      {/* Two column layout for ingredients and instructions */}
      <div className="grid md:grid-cols-[35%_1fr] gap-8 md:gap-12 pt-6">
        {/* Left column - Ingredients */}
        <div className="relative group">
          <div className="space-y-2">
            {ingredients ? (
              ingredients.split('\n').filter(line => line.trim()).map((line, index) => (
                <p key={index} className="text-gray-600 leading-relaxed">
                  {line}
                </p>
              ))
            ) : (
              <p className="text-gray-400 italic">No ingredients listed</p>
            )}
          </div>
        </div>

        {/* Right column - Instructions */}
        <div className="relative group">
          <div className="space-y-3">
            {instructions ? (
              instructions.split('\n').filter(line => line.trim()).map((line, index) => {
                // Check if line already has numbering
                const hasNumber = line.trim().match(/^\d+\./) || line.trim().match(/^•/);
                return (
                  <p key={index} className="text-gray-600 leading-relaxed font-serif text-lg">
                    {hasNumber ? line : `${index + 1}. ${line}`}
                  </p>
                );
              })
            ) : (
              <p className="text-gray-400 italic">No instructions provided</p>
            )}
          </div>
        </div>
      </div>

      {/* Visual separator */}
      <div className="border-t border-[#D4A854]/20 mt-12"></div>
    </div>
  );
}

