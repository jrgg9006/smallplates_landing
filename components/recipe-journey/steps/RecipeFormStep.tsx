"use client";

import React, { useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

export interface RecipeData {
  recipeName: string;
  ingredients: string;
  instructions: string;
  personalNote: string;
  rawRecipeText?: string;
  uploadMethod?: 'text' | 'audio' | 'image';
  documentUrls?: string[];
  audioUrl?: string;
}

interface RecipeFormStepProps {
  data: RecipeData;
  onChange: (field: keyof RecipeData, value: string) => void;
  onContinue: () => void;
  onBack: () => void;
  onPasteRecipe?: (rawText: string) => void;
  autosaveState?: 'saving' | 'saved' | 'idle';
}

export default function RecipeFormStep({ data, onChange, onContinue, onPasteRecipe, autosaveState }: RecipeFormStepProps) {
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

  const [showPasteModal, setShowPasteModal] = useState(false);
  const [pastedText, setPastedText] = useState('');


  return (
    <div className="space-y-8" role="form" aria-labelledby="recipe-form-heading">
      <div className="space-y-2">
        <h2 id="recipe-form-heading" className="font-serif text-3xl md:text-4xl font-semibold text-gray-900">
          Your recipe
        </h2>
        <p className="mt-3 text-sm text-gray-600">
          <button type="button" onClick={() => setShowPasteModal(true)} className="underline underline-offset-2 hover:text-gray-700">
            💡 Have everything written already? Just paste your full recipe here — we’ll format it for you.
          </button>
        </p>
      </div>


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

      {/* Paste full recipe modal */}
      <Dialog open={showPasteModal} onOpenChange={setShowPasteModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Paste your full recipe below</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <textarea
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              rows={14}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent resize-vertical"
              placeholder={"Paste your entire recipe text here"}
            />
            <p className="text-xs text-gray-500">
              <button type="button" className="underline underline-offset-2" onClick={() => setShowPasteModal(false)}>
                Back to structured form
              </button>
            </p>
          </div>
          <DialogFooter>
            <button
              type="button"
              onClick={() => {
                if (pastedText.trim().length > 0) {
                  // Extract recipe name from first line if possible
                  const lines = pastedText.trim().split('\n');
                  const firstLine = lines[0]?.trim() || 'Pasted Recipe';
                  
                  // Call the paste handler if provided, otherwise fallback to old behavior
                  if (onPasteRecipe) {
                    onChange('recipeName', firstLine);
                    onChange('rawRecipeText', pastedText);
                    onPasteRecipe(pastedText);
                  } else {
                    onChange('recipeName', firstLine);
                    onChange('instructions', pastedText);
                    onContinue();
                  }
                }
                setShowPasteModal(false);
              }}
              className="px-6 py-2 rounded-full bg-black text-white hover:bg-gray-800"
            >
              Continue
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


