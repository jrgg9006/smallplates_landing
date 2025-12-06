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
          <h2 className="text-gray-700 text-lg md:text-xl leading-relaxed font-light text-center">
            Small Plate Title
          </h2>
        </div>

        <div className="max-w-2xl mx-auto">
          <input
            value={recipeName}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Lazy Sunday Passover Plate"
            className="w-full text-center font-serif text-3xl font-semibold text-gray-900 leading-tight border-0 border-b border-gray-300 px-0 py-2 focus:outline-none focus:border-gray-500 bg-transparent placeholder:text-gray-400"
            autoFocus
          />
        </div>
      </div>
    </div>
  );
}