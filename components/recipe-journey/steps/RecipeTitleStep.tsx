"use client";

import React from 'react';

interface RecipeTitleStepProps {
  recipeName: string;
  onChange: (value: string) => void;
  recipeTypeHint?: string;
}

const MAX_TITLE_LENGTH = 100;

export default function RecipeTitleStep({ recipeName, onChange, recipeTypeHint }: RecipeTitleStepProps) {
  const [pasteWarning, setPasteWarning] = React.useState(false);
  // Generate placeholder based on hint or use default
  const placeholder = recipeTypeHint
    ? `e.g., "${recipeTypeHint === 'Your crowd favorite' ? "My Famous Lasagna" :
               recipeTypeHint === 'Your late-night go-to' ? 'Midnight Quesadilla' :
               recipeTypeHint === 'A recipe passed down to you' ? "Grandma's Sunday Sauce" :
               recipeTypeHint === 'Your favorite order' ? 'The Usual from Thai Place' :
               recipeTypeHint === 'Your original creation' ? 'The Thing I Invented in College' :
               'Lazy Sunday Passover Plate'}"`
    : 'Lazy Sunday Passover Plate';

  const charCount = recipeName.length;
  const showCounter = charCount >= MAX_TITLE_LENGTH * 0.8;
  const isAtLimit = charCount >= MAX_TITLE_LENGTH;

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
            onChange={(e) => onChange(e.target.value.slice(0, MAX_TITLE_LENGTH))}
            onPaste={(e) => {
              const pasted = e.clipboardData.getData('text');
              if (pasted.length > MAX_TITLE_LENGTH) {
                setPasteWarning(true);
                setTimeout(() => setPasteWarning(false), 5000);
              }
            }}
            maxLength={MAX_TITLE_LENGTH}
            placeholder={placeholder}
            className="w-full text-center font-serif text-3xl font-semibold text-[#2D2D2D] leading-tight border-0 border-b border-gray-300 px-0 py-2 focus:outline-none focus:border-[#D4A854] bg-transparent placeholder:text-gray-400"
            autoFocus
          />
          <p className="text-gray-400 text-sm font-light text-center mt-3">
            In any language. However you&apos;d say it at the table.
          </p>
          {pasteWarning ? (
            <p className="text-sm text-center mt-3 text-[#D4A854]">
              Just the title here — you&apos;ll add the full recipe in the next steps
            </p>
          ) : showCounter && (
            <p className={`text-xs text-center mt-2 transition-opacity ${
              isAtLimit ? 'text-red-400' : 'text-gray-400'
            }`}>
              {charCount}/{MAX_TITLE_LENGTH}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}