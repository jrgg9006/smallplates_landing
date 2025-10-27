"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { CollectionTokenInfo, CollectionGuestSubmission } from '@/lib/types/database';
import { submitGuestRecipe } from '@/lib/supabase/collection';
import StepCard from './StepCard';

interface GuestData {
  id?: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  existing: boolean;
}

interface RecipeData {
  recipeName: string;
  ingredients: string;
  instructions: string;
  personalNote: string;
}

interface RecipeJourneyWrapperProps {
  tokenInfo: CollectionTokenInfo;
  guestData: GuestData;
  token: string;
}

export default function RecipeJourneyWrapper({ tokenInfo, guestData, token }: RecipeJourneyWrapperProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [recipeData, setRecipeData] = useState<RecipeData>({
    recipeName: '',
    ingredients: '',
    instructions: '',
    personalNote: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const totalSteps = 9;

  // Reset journey function - skip intro and go directly to recipe form
  const resetJourney = () => {
    setCurrentStep(5); // Jump directly to "What's the name of your recipe?" step
    setRecipeData({
      recipeName: '',
      ingredients: '',
      instructions: '',
      personalNote: ''
    });
    setSubmitSuccess(false);
    setSubmitError(null);
    setSubmitting(false);
    // Clear localStorage
    localStorage.removeItem('recipeJourneyData');
  };

  // Get the cookbook creator's name for personalization
  const creatorName = tokenInfo.user_name.split(' ')[0] || 'the cookbook creator';

  // Step content configuration
  const stepContent: Record<number, any> = {
    1: {
      type: 'welcome',
      title: (
        <>
          Congratulations! You&apos;ll be part of{' '}
          <span className="font-serif text-5xl font-bold text-black mx-1">
            {creatorName}&apos;s
          </span>{' '}
          amazing Cookbook!
        </>
      ),
      subtitle: "",
      icon: ''
    },
    2: {
      type: 'story',
      title: 'We all have a recipe to share, but remember it is not only about the recipe itself...',
      subtitle: "",
      description: "(There are plenty of cool recipes in TikTok already)",
      icon: '❤️'
    },
    3: {
      type: 'inspiration',
      title: 'Think of your recipe as:',
      items: [
        { icon: '👤', text: 'Something that only YOU eat', description: '' },
        { icon: '📖', text: 'A Shared memory or story through Food', description: '' },
        { icon: '✨', text: 'Something unique that transmits your humor and style', description: '' }
      ]
    },
    4: {
      type: 'encouragement',
      title: "That's it... Enjoy & Connect through Food!",
      subtitle: "",
      description: "",
      icon: '🍽️'
    },
    5: {
      type: 'form',
      field: 'recipeName',
      title: "What's the name of your recipe?",
      subtitle: "Give it a name that makes people curious",
      placeholder: "e.g., Grandma's Secret Chocolate Chip Cookies",
      description: ""
    },
    6: {
      type: 'form',
      field: 'ingredients',
      title: "What are the ingredients?",
      subtitle: "List everything needed to make your recipe",
      placeholder: "• 2 cups all-purpose flour\n• 1 cup brown sugar\n• 1/2 cup butter, softened\n• 2 large eggs\n• 1 tsp vanilla extract",
      description: "",
      isTextarea: true,
      rows: 8
    },
    7: {
      type: 'form',
      field: 'instructions',
      title: "How do you make it?",
      subtitle: "Share the steps to create your recipe",
      placeholder: "1. Preheat oven to 375°F\n2. Mix dry ingredients in a large bowl\n3. In separate bowl, cream butter and sugar\n4. Add eggs and vanilla to butter mixture\n5. Gradually mix in dry ingredients\n6. Bake for 12-15 minutes until golden",
      description: "Write it like you're telling a friend how to make it. They'll figure it out!",
      isTextarea: true,
      rows: 10
    },
    8: {
      type: 'form',
      field: 'personalNote',
      title: `Add your personal note for ${creatorName}`,
      subtitle: "this is optional, but it's what makes your recipe truly special!",
      placeholder: "This recipe reminds me of Sunday mornings at my grandmother's house. She always said the secret was to not overmix the batter, and to bake them until they're just barely golden...",
      description: "",
      isTextarea: true,
      rows: 6,
      optional: true
    },
    9: {
      type: 'summary',
      title: "Perfect! Ready to share your recipe?",
      subtitle: ``
    }
  };

  // Navigation functions
  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFormFieldChange = (field: keyof RecipeData, value: string) => {
    setRecipeData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (submitting) return;
    
    setSubmitting(true);
    setSubmitError(null);

    try {
      // Prepare submission data
      const submission: CollectionGuestSubmission = {
        first_name: guestData.firstName,
        last_name: guestData.lastName,
        email: guestData.email,
        phone: guestData.phone,
        recipe_name: recipeData.recipeName.trim(),
        ingredients: recipeData.ingredients.trim(),
        instructions: recipeData.instructions.trim(),
        comments: recipeData.personalNote.trim() || undefined,
      };

      // Submit the recipe
      const { data, error } = await submitGuestRecipe(token, submission);

      if (error) {
        setSubmitError(error);
        setSubmitting(false);
        return;
      }

      // Success! Show success state
      setSubmitSuccess(true);
      setSubmitting(false);
      
      // Clean up localStorage
      localStorage.removeItem('recipeJourneyData');

    } catch (err) {
      console.error('Submit error:', err);
      setSubmitError('An unexpected error occurred. Please try again.');
      setSubmitting(false);
    }
  };

  // Auto-save to localStorage
  useEffect(() => {
    localStorage.setItem('recipeJourneyData', JSON.stringify({
      currentStep,
      recipeData
    }));
  }, [currentStep, recipeData]);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('recipeJourneyData');
    if (saved) {
      try {
        const { currentStep: savedStep, recipeData: savedData } = JSON.parse(saved);
        if (savedStep && savedData) {
          setCurrentStep(savedStep);
          setRecipeData(savedData);
        }
      } catch (e) {
        // Ignore parsing errors
      }
    }
  }, []);

  return (
    <div className="h-screen bg-white overflow-hidden">
      {/* Main Content */}
      <div className="h-full">
        <StepCard
          step={currentStep}
          content={stepContent[currentStep]}
          recipeData={recipeData}
          onFormFieldChange={handleFormFieldChange}
          onNext={handleNext}
          onPrevious={handlePrevious}
          onSubmit={handleSubmit}
          onReset={resetJourney}
          canGoNext={currentStep < totalSteps}
          canGoPrevious={currentStep > 1}
          isLastStep={currentStep === totalSteps}
          submitting={submitting}
          submitSuccess={submitSuccess}
          submitError={submitError}
        />
      </div>
    </div>
  );
}