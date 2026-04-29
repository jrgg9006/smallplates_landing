"use client";

import React from 'react';

export interface RecipeTypeOption {
  id: string;
  emoji: string;
  label: string;
  hint: string; // Used as placeholder hint in RecipeTitleStep
}

export const RECIPE_TYPE_OPTIONS: RecipeTypeOption[] = [
  {
    id: 'crowd-favorite',
    emoji: '🍳',
    label: 'Something people always ask me to make',
    hint: 'Your crowd favorite'
  },
  {
    id: 'late-night',
    emoji: '🌙',
    label: 'What I make when I get home late',
    hint: 'Your late-night go-to'
  },
  {
    id: 'passed-down',
    emoji: '👵',
    label: 'A recipe someone taught me',
    hint: 'A recipe passed down to you'
  },
  {
    id: 'delivery-order',
    emoji: '📱',
    label: 'My favorite delivery order',
    hint: 'Your favorite order'
  },
  {
    id: 'invented',
    emoji: '✨',
    label: 'I have something else in mind',
    hint: 'Your original creation'
  }
];

interface RecipeTypeStepProps {
  onSelectType: (type: RecipeTypeOption | null) => void;
  selectedType: RecipeTypeOption | null;
}

export default function RecipeTypeStep({ onSelectType, selectedType }: RecipeTypeStepProps) {
  
  const handleSelectType = (type: RecipeTypeOption) => {
    onSelectType(type);
  };

  const handleSkip = () => {
    onSelectType(null);
  };

  return (
    <div className="min-h-[calc(100vh-180px)] flex items-center justify-center">
      <div className="w-full space-y-8 px-4 md:px-6">
        {/* Header */}
        <div className="space-y-3 text-center">
          <h2 className="font-serif text-3xl md:text-4xl font-semibold text-brand-charcoal">
            What are you bringing to the table?
          </h2>
          <p className="text-base text-gray-600">
            Doesn&apos;t have to be fancy. Just has to be yours.
          </p>
        </div>

        {/* Options */}
        <div className="max-w-lg mx-auto space-y-3 mt-8">
          {RECIPE_TYPE_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => handleSelectType(option)}
              className={`
                w-full p-4 rounded-xl border-2 transition-all duration-200 bg-white text-left
                flex items-center gap-4
                ${selectedType?.id === option.id
                  ? 'border-brand-honey bg-brand-warm-white-warm'
                  : 'border-gray-200 hover:border-brand-honey hover:bg-brand-warm-white-warm'
                }
              `}
            >
              <span className="text-2xl flex-shrink-0" aria-hidden="true">
                {option.emoji}
              </span>
              <span className="text-brand-charcoal text-base">
                {option.label}
              </span>
            </button>
          ))}
        </div>

        {/* Skip option */}
      </div>
    </div>
  );
}