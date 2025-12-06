'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export interface RecipeData {
  recipeName: string;
  ingredients: string;
  instructions: string;
  personalNote: string;
}

interface FirstRecipeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: RecipeData) => void;
  isFirstRecipe?: boolean;
}

export function FirstRecipeModal({ isOpen, onClose, onSubmit, isFirstRecipe = true }: FirstRecipeModalProps) {
  const [formData, setFormData] = useState<RecipeData>({
    recipeName: '',
    ingredients: '',
    instructions: '',
    personalNote: ''
  });

  const handleFieldChange = (field: keyof RecipeData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.recipeName && formData.ingredients && formData.instructions) {
      onSubmit(formData);
      // Reset form
      setFormData({
        recipeName: '',
        ingredients: '',
        instructions: '',
        personalNote: ''
      });
    }
  };

  const isFormValid = formData.recipeName && formData.ingredients && formData.instructions;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className={isFirstRecipe ? "sr-only" : "text-2xl font-semibold"}>
            {isFirstRecipe ? "Your First Recipe" : "Add Recipe"}
          </DialogTitle>
          
          {/* Special header for first recipe */}
          {isFirstRecipe && (
            <div className="text-center mb-6 bg-amber-50 p-6 rounded-lg">
              <h2 className="text-2xl font-light mb-2">
                Your First Recipe ✨
              </h2>
              <p className="text-gray-600">
                Don&apos;t worry about perfection. 
                Write as if you were telling a friend.
              </p>
            </div>
          )}
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Recipe Title */}
          <div className="space-y-2">
            <label htmlFor="recipeName" className="text-sm font-medium text-gray-700">
              Small Plate title
            </label>
            <Input
              id="recipeName"
              value={formData.recipeName}
              onChange={(e) => handleFieldChange('recipeName', e.target.value)}
              placeholder="Grandma's Secret Chocolate Chip Cookies"
              className="h-12"
              required
            />
          </div>

          {/* Ingredients */}
          <div className="space-y-2">
            <label htmlFor="ingredients" className="text-sm font-medium text-gray-700">
              Ingredients
            </label>
            <textarea
              id="ingredients"
              value={formData.ingredients}
              onChange={(e) => handleFieldChange('ingredients', e.target.value)}
              placeholder={"• The last box of pasta\n• A suspicious amount of garlic\n• Good olive oil\n• Chili flakes\n• Cheese of questionable origin\n• Hunger"}
              rows={6}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent resize-vertical"
              required
            />
          </div>

          {/* Instructions */}
          <div className="space-y-2">
            <label htmlFor="instructions" className="text-sm font-medium text-gray-700">
              Instructions
            </label>
            <textarea
              id="instructions"
              value={formData.instructions}
              onChange={(e) => handleFieldChange('instructions', e.target.value)}
              placeholder={"1. Preheat the oven to 350°F\n2. Mix dry ingredients in a bowl\n3. Bake for 12–15 minutes"}
              rows={8}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent resize-vertical"
              required
            />
          </div>

          {/* Personal Note */}
          <div className="space-y-2">
            <label htmlFor="personalNote" className="text-sm font-medium text-gray-700">
              Personal note (optional)
            </label>
            <textarea
              id="personalNote"
              value={formData.personalNote}
              onChange={(e) => handleFieldChange('personalNote', e.target.value)}
              placeholder="This recipe always reminds me of Sunday mornings with my family..."
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent resize-vertical"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!isFormValid}
              className="bg-black text-white hover:bg-gray-800"
            >
              {isFirstRecipe ? 'Save my first recipe ✨' : 'Save recipe'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}