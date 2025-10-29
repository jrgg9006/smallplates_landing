"use client";

import React, { useMemo } from 'react';
import { Input } from '@/components/ui/input';

export interface RecipeData {
  recipeName: string;
  ingredients: string;
  instructions: string;
  personalNote: string;
}

interface RecipeFormStepProps {
  data: RecipeData;
  onChange: (field: keyof RecipeData, value: string) => void;
  onContinue: () => void;
  onBack: () => void;
  autosaveState?: 'saving' | 'saved' | 'idle';
}

export default function RecipeFormStep({ data, onChange, autosaveState }: RecipeFormStepProps) {
  const autosaveLabel = useMemo(() => {
    switch (autosaveState) {
      case 'saving':
        return 'Guardando…';
      case 'saved':
        return 'Guardado';
      default:
        return undefined;
    }
  }, [autosaveState]);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="space-y-8" role="form" aria-labelledby="recipe-form-heading">
      <div className="flex items-center justify-between">
        <h2 id="recipe-form-heading" className="font-serif text-2xl md:text-3xl font-semibold text-gray-900">
          Your recipe
        </h2>
        {autosaveLabel && (
          <span className="text-xs text-gray-500" aria-live="polite">{autosaveLabel}</span>
        )}
      </div>

      {/* Mini index */}
      <nav aria-label="Recipe sections" className="flex flex-wrap gap-2">
        {[
          { id: 'title', label: 'Título' },
          { id: 'ingredients', label: 'Ingredientes' },
          { id: 'instructions', label: 'Pasos' },
          { id: 'note', label: 'Nota' },
        ].map((s) => (
          <button
            key={s.id}
            type="button"
            className="px-3 py-1.5 rounded-full border border-gray-300 text-sm text-gray-700 hover:bg-gray-50"
            onClick={() => scrollTo(s.id)}
          >
            {s.label}
          </button>
        ))}
      </nav>

      {/* Title */}
      <section id="title" aria-labelledby="title-label" className="space-y-2">
        <label id="title-label" htmlFor="recipeName" className="text-sm font-medium text-gray-700">
          Recipe title
        </label>
        <Input
          id="recipeName"
          value={data.recipeName}
          onChange={(e) => onChange('recipeName', e.target.value)}
          placeholder="Grandma's Secret Chocolate Chip Cookies"
          aria-describedby="title-help"
          className="h-12"
        />
        <p id="title-help" className="text-xs text-gray-500">A short, clear name.</p>
      </section>

      {/* Ingredients */}
      <section id="ingredients" aria-labelledby="ingredients-label" className="space-y-2">
        <label id="ingredients-label" htmlFor="ingredients-input" className="text-sm font-medium text-gray-700">
          Ingredients
        </label>
        <textarea
          id="ingredients-input"
          value={data.ingredients}
          onChange={(e) => onChange('ingredients', e.target.value)}
          placeholder={"• 2 cups all-purpose flour\n• 1 cup brown sugar\n• 1/2 cup butter, softened"}
          rows={8}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent resize-vertical"
          aria-describedby="ingredients-help"
        />
        <p id="ingredients-help" className="text-xs text-gray-500">One item per line with quantities.</p>
      </section>

      {/* Instructions */}
      <section id="instructions" aria-labelledby="instructions-label" className="space-y-2">
        <label id="instructions-label" htmlFor="instructions-input" className="text-sm font-medium text-gray-700">
          Instructions
        </label>
        <textarea
          id="instructions-input"
          value={data.instructions}
          onChange={(e) => onChange('instructions', e.target.value)}
          placeholder={"1. Preheat the oven\n2. Mix dry ingredients\n3. Bake 12–15 minutes"}
          rows={10}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent resize-vertical"
          aria-describedby="instructions-help"
        />
        <p id="instructions-help" className="text-xs text-gray-500">Explain it like to a friend.</p>
      </section>

      {/* Personal Note */}
      <section id="note" aria-labelledby="note-label" className="space-y-2">
        <label id="note-label" htmlFor="note-input" className="text-sm font-medium text-gray-700">
          Personal note (optional)
        </label>
        <textarea
          id="note-input"
          value={data.personalNote}
          onChange={(e) => onChange('personalNote', e.target.value)}
          placeholder={"A short story or tip that makes it yours."}
          rows={6}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent resize-vertical"
        />
      </section>
    </div>
  );
}


