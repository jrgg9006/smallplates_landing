"use client";

import React from 'react';

interface RecipeTitleStepProps {
  recipeName: string;
  onChange: (value: string) => void;
  recipeTypeHint?: string;
}

export default function RecipeTitleStep({ recipeName, onChange, recipeTypeHint }: RecipeTitleStepProps) {
  // Generate placeholder based on hint or use default
  const placeholder = recipeTypeHint 
    ? `e.g., "${recipeTypeHint === 'Your crowd favorite' ? "My Famous Lasagna" : 
               recipeTypeHint === 'Your late-night go-to' ? 'Midnight Quesadilla' :
               recipeTypeHint === 'A recipe passed down to you' ? "Grandma's Sunday Sauce" :
               recipeTypeHint === 'Your favorite order' ? 'The Usual from Thai Place' :
               recipeTypeHint === 'Your original creation' ? 'The Thing I Invented in College' :
               'Lazy Sunday Passover Plate'}"`
    : 'Lazy Sunday Passover Plate';

  return (
    <div className="min-h-[calc(100vh-180px)] flex items-center justify-center">
      <div className="w-full space-y-8 px-4 md:px-6">
        <div className="space-y-2 text-center">
          {recipeTypeHint ? (
            <p className="text-gray-500 text-base mb-2">
              {recipeTypeHint}
            </p>
          ) : null}
          <h2 className="text-gray-700 text-lg md:text-xl leading-relaxed font-light text-center">
            Recipe Title
          </h2>
        </div>

        <div className="max-w-2xl mx-auto">
          <input
            value={recipeName}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full text-center font-serif text-3xl font-semibold text-[#2D2D2D] leading-tight border-0 border-b border-gray-300 px-0 py-2 focus:outline-none focus:border-[#D4A854] bg-transparent placeholder:text-gray-400"
            autoFocus
          />
        </div>
      </div>
    </div>
  );
}