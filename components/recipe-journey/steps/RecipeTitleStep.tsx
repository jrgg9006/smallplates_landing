"use client";

import React from 'react';

interface RecipeTitleStepProps {
  recipeName: string;
  onChange: (value: string) => void;
}

export default function RecipeTitleStep({ recipeName, onChange }: RecipeTitleStepProps) {
  return (
    <div className="min-h-[calc(100vh-180px)] flex items-center justify-center">
      <div className="w-full space-y-8 px-4 md:px-6">
        <div className="space-y-2 text-center">
          <h2 className="font-serif text-3xl md:text-4xl font-semibold text-gray-900">
            Recipe Title
          </h2>
        </div>

        <div className="max-w-md mx-auto">
          <input
            value={recipeName}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Grandma&apos;s Secret Chocolate Chip Cookies"
            className="w-full h-12 px-4 border border-gray-300 rounded-xl text-left text-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            autoFocus
          />
        </div>
      </div>
    </div>
  );
}