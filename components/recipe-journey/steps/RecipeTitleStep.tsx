"use client";

import React from 'react';
import { Input } from '@/components/ui/input';

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
          <p className="mt-3 text-base text-gray-600">
            What&apos;s the name of this recipe?
          </p>
        </div>

        <div className="max-w-md mx-auto">
          <Input
            value={recipeName}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Grandma&apos;s Secret Chocolate Chip Cookies"
            className="h-12 text-center text-lg"
            autoFocus
          />
        </div>
      </div>
    </div>
  );
}