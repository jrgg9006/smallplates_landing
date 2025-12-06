"use client";

import React from 'react';

interface PersonalNoteStepProps {
  personalNote: string;
  onChange: (value: string) => void;
  userName: string;
}

const MAX_CHARACTERS = 500;

export default function PersonalNoteStep({ personalNote, onChange, userName }: PersonalNoteStepProps) {
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
        <div className="space-y-2 text-center">
          <h2 className="font-serif text-3xl md:text-4xl font-semibold text-gray-900">
            Share a Note to {userName}
          </h2>
          <p className="mt-3 text-base text-gray-600">
            Add a memory, story, or message to be printed with this recipe
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          <div className="relative">
            <textarea
              value={personalNote}
              onChange={(e) => onChange(e.target.value)}
              placeholder="(Optional) This is what I make when I miss home. Or when I need something simple and warm...."
              rows={6}
              className={`w-full px-4 py-3 border rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent resize-none ${
                isOverLimit ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            <div className={`absolute bottom-3 right-3 text-sm ${getCounterColor()}`}>
              {characterCount}/{MAX_CHARACTERS}
            </div>
          </div>
          <p className="mt-2 text-xs text-gray-500 text-center">
            This personal note will be printed alongside your recipe in the cookbook
          </p>
          {isOverLimit && (
            <p className="mt-2 text-xs text-red-600 text-center">
              Please keep your message under {MAX_CHARACTERS} characters
            </p>
          )}
        </div>
      </div>
    </div>
  );
}