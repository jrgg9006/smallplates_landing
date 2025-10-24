"use client";

import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
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
  onReset: () => void;
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
  onReset,
  canGoNext,
  canGoPrevious,
  isLastStep,
  submitting = false,
  submitSuccess = false,
  submitError = null
}: StepCardProps) {
  const router = useRouter();

  // Get image URL based on step number (cycling through onboarding images)
  const getImageUrl = () => {
    const imageMap = {
      1: "/images/onboarding/onboarding_step_1.jpg",
      2: "/images/onboarding/onboarding_step_2.jpg", 
      3: "/images/onboarding/onboarding_step_3.jpg"
    };
    // Cycle through images if more than 3 steps
    const imageIndex = ((step - 1) % 3) + 1;
    return imageMap[imageIndex as keyof typeof imageMap];
  };

  const renderContent = () => {
    switch (content.type) {
      case 'welcome':
        return (
          <div className="space-y-6">
            <div className="text-6xl text-center">{content.icon}</div>
            <h1 className="font-serif text-3xl md:text-4xl font-semibold text-gray-900 mb-3">
              {content.title}
            </h1>
            <p className="text-lg text-gray-600 max-w-xl mx-auto">
              {content.subtitle}
            </p>
          </div>
        );

      case 'story':
        return (
          <div className="space-y-6">
            <div className="text-6xl text-center">{content.icon}</div>
            <h1 className="font-serif text-3xl md:text-4xl font-semibold text-gray-900 mb-3">
              {content.title}
            </h1>
            <p className="text-lg text-gray-600 max-w-xl mx-auto">
              {content.subtitle}
            </p>
            <p className="text-base text-gray-700 max-w-xl mx-auto leading-relaxed">
              {content.description}
            </p>
          </div>
        );

      case 'inspiration':
        return (
          <div className="space-y-6">
            <h1 className="font-serif text-3xl md:text-4xl font-semibold text-gray-900 mb-3">
              {content.title}
            </h1>
            <div className="space-y-4 max-w-xl mx-auto">
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
          <div className="space-y-6">
            <div className="text-6xl text-center">{content.icon}</div>
            <h1 className="font-serif text-3xl md:text-4xl font-semibold text-gray-900 mb-3">
              {content.title}
            </h1>
            <p className="text-lg text-gray-600 max-w-xl mx-auto">
              {content.subtitle}
            </p>
            <p className="text-base text-gray-700 max-w-xl mx-auto leading-relaxed">
              {content.description}
            </p>
          </div>
        );

      case 'form':
        const fieldValue = content.field ? recipeData[content.field] : '';
        return (
          <div className="space-y-6 max-w-lg mx-auto">
            <div className="text-center space-y-4">
              <h1 className="font-serif text-3xl md:text-4xl font-semibold text-gray-900 mb-3">
                {content.title}
              </h1>
              <p className="text-lg text-gray-600">
                {content.subtitle}
              </p>
              {content.description && (
                <p className="text-sm text-gray-500">
                  {content.description}
                </p>
              )}
            </div>
            
            <div className="space-y-4">
              {content.isTextarea ? (
                <textarea
                  value={fieldValue}
                  onChange={(e) => content.field && onFormFieldChange(content.field, e.target.value)}
                  placeholder={content.placeholder}
                  rows={content.rows || 6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent resize-vertical"
                />
              ) : (
                <Input
                  value={fieldValue}
                  onChange={(e) => content.field && onFormFieldChange(content.field, e.target.value)}
                  placeholder={content.placeholder}
                  className="w-full px-4 py-3 text-base h-14 focus:ring-black border-gray-300 rounded-xl"
                />
              )}
            </div>
          </div>
        );

      case 'summary':
        if (submitSuccess) {
          return (
            <div className="space-y-6 text-center">
              <div className="text-6xl">🎉</div>
              <h1 className="font-serif text-3xl md:text-4xl font-semibold text-gray-900 mb-3">
                That&apos;s it... Enjoy & Connect through Food!
              </h1>
            </div>
          );
        }

        return (
          <div className="space-y-6 w-full max-w-lg mx-auto pt-12">
            <div className="text-center space-y-4">
              <h1 className="font-serif text-3xl md:text-4xl font-semibold text-gray-900 mb-3">
                {content.title}
              </h1>
              <p className="text-lg text-gray-600">
                {content.subtitle}
              </p>
            </div>
            
            {/* Recipe Summary */}
            <div className="space-y-6 text-left w-full">
              <h2 className="text-2xl font-semibold text-gray-900 text-center mb-6">
                {recipeData.recipeName || 'Your Recipe'}
              </h2>
              
              {recipeData.ingredients && (
                <div className="border-l-4 border-gray-200 pl-6">
                  <h3 className="font-semibold text-gray-700 mb-2">Ingredients:</h3>
                  <p className="text-gray-600 whitespace-pre-line">
                    {recipeData.ingredients}
                  </p>
                </div>
              )}
              
              {recipeData.instructions && (
                <div className="border-l-4 border-gray-200 pl-6">
                  <h3 className="font-semibold text-gray-700 mb-2">Instructions:</h3>
                  <p className="text-gray-600 whitespace-pre-line">
                    {recipeData.instructions}
                  </p>
                </div>
              )}
              
              {recipeData.personalNote && (
                <div className="border-l-4 border-gray-200 pl-6">
                  <h3 className="font-semibold text-gray-700 mb-2">Your Note:</h3>
                  <p className="text-gray-600 whitespace-pre-line italic">
                    {recipeData.personalNote}
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
      if (submitSuccess) return 'Share Another Recipe';
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

  // Form content component - memoized to prevent unnecessary re-renders (EXACT COPY from OnboardingStep)
  const FormContent = useMemo(() => {
    // Allow scroll only for summary type when NOT in success state
    const allowScroll = content.type === 'summary' && !submitSuccess;
    
    if (allowScroll) {
      // Summary layout - scrollable with centered content
      return (
        <div className="w-full min-h-screen flex justify-center px-6 lg:px-12 py-16 lg:py-20">
          {/* Close button - visible on mobile and desktop */}
          <button
            onClick={() => router.push("/")}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors z-10"
            aria-label="Close recipe journey"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          <div className="max-w-lg">
            {/* Recipe Journey Content */}
            <div className="text-center mb-8">
              {renderContent()}
            </div>

            {/* Navigation Buttons */}
            <div className={`flex mt-8 ${step === 1 ? 'justify-center' : 'justify-between'} pb-8`}>
            {/* Only show Previous button if not on first step */}
            {step > 1 && (
              <button
                onClick={onPrevious}
                disabled={!canGoPrevious}
                className="flex items-center space-x-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 bg-transparent border-none cursor-pointer disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
                <span className="text-lg">Previous</span>
              </button>
            )}
            
            <button
              onClick={submitSuccess ? onReset : (isLastStep ? onSubmit : onNext)}
              disabled={!canProceed() || (!isLastStep && !canGoNext) || submitting}
              className="flex items-center space-x-3 bg-black hover:bg-gray-800 text-white px-10 py-4 rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-lg font-medium"
            >
              {submitting && (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              )}
              <span>{getNextButtonText()}</span>
              {!isLastStep && !submitting && <ChevronRight className="w-5 h-5" />}
            </button>
            </div>
          </div>
        </div>
      );
    }

    // Default centered layout for other content types
    return (
      <div className="w-full h-full flex flex-col justify-center px-6 lg:px-12 py-8 lg:py-12">
        {/* Close button - visible on mobile and desktop */}
        <button
          onClick={() => router.push("/")}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors z-10"
          aria-label="Close recipe journey"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        <div className="flex-1 flex flex-col justify-center">
          {/* Recipe Journey Content */}
          <div className="text-center mb-8">
            {renderContent()}
          </div>

          {/* Navigation Buttons */}
          <div className={`flex mt-8 ${step === 1 ? 'justify-center' : 'justify-between'}`}>
            {/* Only show Previous button if not on first step */}
            {step > 1 && (
              <button
                onClick={onPrevious}
                disabled={!canGoPrevious}
                className="flex items-center space-x-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 bg-transparent border-none cursor-pointer disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
                <span className="text-lg">Previous</span>
              </button>
            )}
            
            <button
              onClick={submitSuccess ? onReset : (isLastStep ? onSubmit : onNext)}
              disabled={!canProceed() || (!isLastStep && !canGoNext) || submitting}
              className="flex items-center space-x-3 bg-black hover:bg-gray-800 text-white px-10 py-4 rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-lg font-medium"
            >
              {submitting && (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              )}
              <span>{getNextButtonText()}</span>
              {!isLastStep && !submitting && <ChevronRight className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>
    );
  }, [step, content, recipeData, onPrevious, onNext, onSubmit, onReset, canGoNext, canGoPrevious, isLastStep, submitting, submitSuccess, submitError, router, canProceed, getNextButtonText, renderContent]);

  // Image component (EXACT COPY from OnboardingStep)
  const ImageSection = () => (
    <div className="hidden lg:block relative bg-gray-100 h-screen p-2">
      <div className="relative w-full h-full rounded-2xl overflow-hidden bg-white shadow-sm">
        <Image
          src={getImageUrl()}
          alt="Recipe journey step image"
          fill
          sizes="40vw"
          className="object-contain"
          priority
        />
      </div>
    </div>
  );

  // Render two-column layout with image (EXACT COPY from OnboardingStep)
  return (
    <div className={`min-h-screen flex flex-col lg:flex-row relative ${content.type === 'summary' ? 'overflow-hidden' : ''}`}>
      {/* Image on left for desktop, hidden on mobile - 40% width */}
      <div className="lg:w-2/5 lg:flex-shrink-0 border-r border-gray-200">
        <ImageSection />
      </div>
      {/* Form content on right - 60% width */}
      <div className={`lg:w-3/5 relative ${content.type === 'summary' && !submitSuccess ? 'h-screen overflow-y-scroll' : 'flex items-center justify-center min-h-screen lg:min-h-0'}`}>
        {/* Small Plates Logo - Fixed at top center of content area */}
        <div className="fixed top-4 left-1/2 lg:left-[70%] transform -translate-x-1/2 z-20 pointer-events-none">
          <Image
            src="/images/SmallPlates_logo_horizontal.png"
            alt="Small Plates & Co"
            width={160}
            height={32}
            className="opacity-80"
            priority
          />
        </div>
        
        <div className={`w-full max-w-lg ${content.type === 'summary' && !submitSuccess ? '' : 'h-full'}`}>
          {FormContent}
        </div>
      </div>
    </div>
  );
}