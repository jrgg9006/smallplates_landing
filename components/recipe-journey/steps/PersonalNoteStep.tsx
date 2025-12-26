"use client";

import React from 'react';
import Image from 'next/image';

interface PersonalNoteStepProps {
  personalNote: string;
  onChange: (value: string) => void;
  userName: string;
  coupleImageUrl?: string | null;
}

const MAX_CHARACTERS = 500;

export default function PersonalNoteStep({ personalNote, onChange, userName, coupleImageUrl }: PersonalNoteStepProps) {
  const characterCount = personalNote.length;
  const isNearLimit = characterCount > MAX_CHARACTERS * 0.8; // 80% of limit
  const isOverLimit = characterCount > MAX_CHARACTERS;
  
  // Determine color for character counter
  const getCounterColor = () => {
    if (isOverLimit) return 'text-red-600';
    if (isNearLimit) return 'text-amber-600';
    return 'text-gray-500';
  };

  return (
    <div className="min-h-[calc(100vh-180px)] flex items-center justify-center">
      <div className="w-full space-y-8 px-4 md:px-6">
        {/* Couple Image for mobile only - desktop shows in left panel */}
        {coupleImageUrl && (
          <div className="lg:hidden flex justify-center">
            <div className="relative w-48 h-32 rounded-xl overflow-hidden shadow-md">
              <Image
                src={coupleImageUrl}
                alt="Couple"
                fill
                className="object-cover"
              />
            </div>
          </div>
        )}
        
        <div className="space-y-2 text-center">
          <h2 className="font-serif text-3xl md:text-4xl font-semibold text-[#2D2D2D]">
            Add a note for the couple
          </h2>
        </div>

        <div className="max-w-2xl mx-auto">
          <div className="relative">
            <textarea
              value={personalNote}
              onChange={(e) => onChange(e.target.value)}
              placeholder="A story about this recipe. When to make it. Why it's special."
              rows={6}
              className={`w-full px-4 py-3 border rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-[#D4A854] focus:border-transparent resize-none ${
                isOverLimit ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            <div className={`absolute bottom-3 right-3 text-sm ${getCounterColor()}`}>
              {characterCount}/{MAX_CHARACTERS}
            </div>
          </div>
          <p className="mt-2 text-xs text-gray-500 text-center">
            Your note will live on the page with your recipe. A piece of you in their kitchen.
          </p>
          {isOverLimit && (
            <p className="mt-2 text-xs text-red-600 text-center">
              Keep your note under {MAX_CHARACTERS} characters
            </p>
          )}
        </div>
      </div>
    </div>
  );
}