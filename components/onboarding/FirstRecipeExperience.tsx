'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RecipeData } from '@/components/profile/FirstRecipeModal';

interface FirstRecipeExperienceProps {
  onSubmit: (data: RecipeData) => void;
  onSkip: () => void;
}

export function FirstRecipeExperience({ onSubmit, onSkip }: FirstRecipeExperienceProps) {
  const [formData, setFormData] = useState<RecipeData>({
    recipeName: '',
    ingredients: '',
    instructions: '',
    personalNote: ''
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFieldChange = (field: keyof RecipeData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.recipeName && formData.ingredients && formData.instructions) {
      setIsSubmitting(true);
      setError(null);
      try {
        await onSubmit(formData);
        setIsSubmitted(true);
      } catch (error) {
        console.error('Error submitting recipe:', error);
        setError(error instanceof Error ? error.message : 'Failed to save recipe. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const isFormValid = formData.recipeName && formData.ingredients && formData.instructions;

  return (
    <div className="fixed inset-0 z-50 bg-white/90 backdrop-blur-sm overflow-y-auto">
      <div className="min-h-full py-8 px-4 flex items-center justify-center">
        <div className="max-w-6xl mx-auto w-full">
          {/* Logo */}
          <div className="mb-4 text-center">
            <Image 
              src="/images/SmallPlates_logo_horizontal.png" 
              alt="Small Plates"
              width={120} 
              height={24} 
              className="mx-auto opacity-80" 
            />
          </div>

          {/* Skip button */}
          <div className="text-right mb-6">
            <button 
              onClick={onSkip}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors border-b border-transparent hover:border-gray-400"
            >
              Skip for now
            </button>
          </div>

          {isSubmitted ? (
            /* Confirmation message */
            <div className="text-center py-12">
              <div className="max-w-md mx-auto">
                <div className="mb-6">
                  <div className="text-6xl mb-4">✨</div>
                  <h2 className="font-light text-3xl md:text-4xl mb-4 tracking-tight">
                    Enviado
                  </h2>
                </div>
                <p className="text-lg text-gray-700 leading-relaxed mb-8">
                  Te enviaremos cómo se ve tu receta a tu correo pronto.
                </p>
                <Button
                  onClick={onSkip}
                  className="bg-black text-white px-8 py-4 text-lg hover:bg-gray-800 transition-colors"
                >
                  Continuar
                </Button>
              </div>
            </div>
          ) : (
            /* Main content - two columns */
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12">
              {/* Left column - Instructions */}
              <div className="flex flex-col lg:col-span-2">
                <p className="text-sm font-medium text-gray-500 mb-2">
                  STEP 1
                </p>
                <h1 className="font-light text-4xl md:text-5xl mb-6 tracking-tight">
                  Your First Recipe
                </h1>
                <div className="text-lg md:text-xl text-gray-700 leading-relaxed mb-8 max-w-xl mx-auto">
                  <p className="mb-6">
                    Don&apos;t overthink it! Just keep it simple.
                  </p>
                  <p className="mb-6">
                    What did you have for breakfast yesterday? What&apos;s your favorite dinner? A simple bar drink you love?
                  </p>
                  <p className="text-gray-600">
                    We&apos;ll show you how this recipe looks in your book printed with an image. It&apos;s magical!
                  </p>
                </div>
              </div>

              {/* Right column - Form */}
              <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 lg:col-span-3">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Recipe Name */}
                  <div className="space-y-2">
                    <label htmlFor="recipeName" className="text-sm font-medium text-gray-700">
                      Name of the Recipe
                    </label>
                    <Input
                      id="recipeName"
                      value={formData.recipeName}
                      onChange={(e) => handleFieldChange('recipeName', e.target.value)}
                      placeholder="My favorite breakfast"
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
                      placeholder="• 2 eggs\n• 1 slice of bread\n• Butter"
                      rows={5}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent resize-vertical"
                      required
                    />
                  </div>

                  {/* Steps */}
                  <div className="space-y-2">
                    <label htmlFor="instructions" className="text-sm font-medium text-gray-700">
                      Steps
                    </label>
                    <textarea
                      id="instructions"
                      value={formData.instructions}
                      onChange={(e) => handleFieldChange('instructions', e.target.value)}
                      placeholder="1. Heat the pan\n2. Fry the eggs\n3. Toast the bread"
                      rows={6}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent resize-vertical"
                      required
                    />
                  </div>

                  {/* Notes */}
                  <div className="space-y-2">
                    <label htmlFor="personalNote" className="text-sm font-medium text-gray-700">
                      Notes (optional)
                    </label>
                    <textarea
                      id="personalNote"
                      value={formData.personalNote}
                      onChange={(e) => handleFieldChange('personalNote', e.target.value)}
                      placeholder="This always reminds me of Sunday mornings..."
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent resize-vertical"
                    />
                  </div>

                  {/* Error message */}
                  {error && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                      {error}
                    </div>
                  )}

                  {/* Submit button */}
                  <Button
                    type="submit"
                    disabled={!isFormValid || isSubmitting}
                    className="w-full bg-black text-white py-4 text-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Enviando...' : 'Submit my recipe ✨'}
                  </Button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

