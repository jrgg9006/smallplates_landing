"use client";

import React from 'react';
import { Input } from '@/components/ui/input';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface RecipeData {
  recipeName: string;
  ingredients: string;
  instructions: string;
  personalNote: string;
}

interface StepContent {
  type: 'welcome' | 'story' | 'inspiration' | 'encouragement' | 'form' | 'summary';
  title: React.ReactNode;
  subtitle?: string;
  description?: string;
  icon?: string;
  field?: keyof RecipeData;
  placeholder?: string;
  isTextarea?: boolean;
  rows?: number;
  optional?: boolean;
  items?: Array<{
    icon: string;
    text: string;
    description: string;
  }>;
}

interface StepCardProps {
  step: number;
  content: StepContent;
  recipeData: RecipeData;
  onFormFieldChange: (field: keyof RecipeData, value: string) => void;
  onNext: () => void;
  onPrevious: () => void;
  onSubmit: () => void;
  canGoNext: boolean;
  canGoPrevious: boolean;
  isLastStep: boolean;
  submitting?: boolean;
  submitSuccess?: boolean;
  submitError?: string | null;
}

export default function StepCard({
  step,
  content,
  recipeData,
  onFormFieldChange,
  onNext,
  onPrevious,
  onSubmit,
  canGoNext,
  canGoPrevious,
  isLastStep,
  submitting = false,
  submitSuccess = false,
  submitError = null
}: StepCardProps) {
  
  const renderContent = () => {
    switch (content.type) {
      case 'welcome':
        return (
          <div className="text-center space-y-6">
            <div className="text-4xl mb-2">{content.icon}</div>
            <h1 className="text-3xl md:text-4xl font-semibold text-gray-900 leading-tight">
              {content.title}
            </h1>
            <p className="text-xl text-gray-600 max-w-lg">
              {content.subtitle}
            </p>
          </div>
        );

      case 'story':
        return (
          <div className="text-center space-y-6">
            <div className="text-4xl mb-2">{content.icon}</div>
            <h1 className="text-3xl md:text-4xl font-semibold text-gray-900">
              {content.title}
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl">
              {content.subtitle}
            </p>
            <p className="text-lg text-gray-700 max-w-3xl leading-relaxed">
              {content.description}
            </p>
          </div>
        );

      case 'inspiration':
        return (
          <div className="text-center space-y-8">
            <h1 className="text-3xl md:text-4xl font-semibold text-gray-900">
              {content.title}
            </h1>
            <div className="space-y-6 max-w-3xl mx-auto">
              {content.items?.map((item, index) => (
                <div key={index} className="text-left border-l-4 border-gray-200 pl-6 py-4">
                  <div className="flex items-start space-x-4">
                    <div className="text-3xl">{item.icon}</div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        {item.text}
                      </h3>
                      <p className="text-gray-600">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'encouragement':
        return (
          <div className="text-center space-y-6">
            <div className="text-4xl mb-2">{content.icon}</div>
            <h1 className="text-3xl md:text-4xl font-semibold text-gray-900">
              {content.title}
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl">
              {content.subtitle}
            </p>
            <p className="text-lg text-gray-700 max-w-3xl leading-relaxed">
              {content.description}
            </p>
          </div>
        );

      case 'form':
        const fieldValue = content.field ? recipeData[content.field] : '';
        return (
          <div className="space-y-6 max-w-2xl mx-auto">
            <div className="text-center space-y-4">
              <h1 className="text-3xl md:text-4xl font-semibold text-gray-900">
                {content.title}
              </h1>
              <p className="text-xl text-gray-600">
                {content.subtitle}
              </p>
              {content.description && (
                <p className="text-sm text-gray-500">
                  {content.description}
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              {content.isTextarea ? (
                <textarea
                  value={fieldValue}
                  onChange={(e) => content.field && onFormFieldChange(content.field, e.target.value)}
                  placeholder={content.placeholder}
                  rows={content.rows || 6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-vertical"
                />
              ) : (
                <Input
                  value={fieldValue}
                  onChange={(e) => content.field && onFormFieldChange(content.field, e.target.value)}
                  placeholder={content.placeholder}
                  className="w-full px-4 py-3 text-lg h-14 focus:ring-emerald-500"
                />
              )}
            </div>
          </div>
        );

      case 'summary':
        if (submitSuccess) {
          return (
            <div className="text-center space-y-6">
              <div className="text-6xl mb-4">🎉</div>
              <h1 className="text-3xl md:text-4xl font-semibold text-gray-900">
                Thank you! Your recipe has been submitted!
              </h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Your delicious contribution will be a wonderful addition to the cookbook. 
                You'll be redirected shortly.
              </p>
            </div>
          );
        }

        return (
          <div className="space-y-8 max-w-3xl mx-auto">
            <div className="text-center space-y-4">
              <div className="text-6xl mb-4">🎊</div>
              <h1 className="text-3xl md:text-4xl font-semibold text-gray-900">
                {content.title}
              </h1>
              <p className="text-xl text-gray-600">
                {content.subtitle}
              </p>
            </div>
            
            {/* Recipe Summary */}
            <div className="space-y-6 text-left max-w-2xl mx-auto">
              <h2 className="text-2xl font-semibold text-gray-900 text-center mb-8">
                {recipeData.recipeName || 'Your Recipe'}
              </h2>
              
              {recipeData.ingredients && (
                <div className="border-l-4 border-gray-200 pl-6">
                  <h3 className="font-semibold text-gray-700 mb-2">Ingredients:</h3>
                  <p className="text-gray-600 whitespace-pre-line">
                    {recipeData.ingredients.slice(0, 150)}
                    {recipeData.ingredients.length > 150 && '...'}
                  </p>
                </div>
              )}
              
              {recipeData.instructions && (
                <div className="border-l-4 border-gray-200 pl-6">
                  <h3 className="font-semibold text-gray-700 mb-2">Instructions:</h3>
                  <p className="text-gray-600 whitespace-pre-line">
                    {recipeData.instructions.slice(0, 150)}
                    {recipeData.instructions.length > 150 && '...'}
                  </p>
                </div>
              )}
              
              {recipeData.personalNote && (
                <div className="border-l-4 border-gray-200 pl-6">
                  <h3 className="font-semibold text-gray-700 mb-2">Your Note:</h3>
                  <p className="text-gray-600 whitespace-pre-line italic">
                    {recipeData.personalNote.slice(0, 100)}
                    {recipeData.personalNote.length > 100 && '...'}
                  </p>
                </div>
              )}
            </div>

            {/* Error Message */}
            {submitError && (
              <div className="text-center mt-6">
                <p className="text-red-600">{submitError}</p>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  const getNextButtonText = () => {
    if (content.type === 'form' && content.optional) {
      return 'Continue';
    }
    if (isLastStep) {
      if (submitting) return 'Submitting...';
      if (submitSuccess) return 'Submitted! 🎉';
      return 'Submit Recipe 🎉';
    }
    if (step <= 4) {
      return 'Continue';
    }
    return 'Next';
  };

  const canProceed = () => {
    if (content.type === 'form' && content.field && !content.optional) {
      return recipeData[content.field].trim().length > 0;
    }
    return true;
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col h-screen overflow-hidden">
      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-4 max-h-[calc(100vh-120px)]">
        {renderContent()}
      </div>
      
      {/* Navigation - Fixed at bottom */}
      <div className="flex justify-between items-center p-4 pb-8">
          <button
            onClick={onPrevious}
            disabled={!canGoPrevious}
            className="flex items-center space-x-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 bg-transparent border-none cursor-pointer disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>
          
          <div></div>
          
          <button
            onClick={isLastStep ? onSubmit : onNext}
            disabled={!canProceed() || (!isLastStep && !canGoNext) || submitting || submitSuccess}
            className="flex items-center space-x-2 bg-gray-900 hover:bg-gray-800 text-white px-8 py-3 rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            )}
            <span>{getNextButtonText()}</span>
            {!isLastStep && !submitting && <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
    </div>
  );
}