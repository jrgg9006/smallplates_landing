"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import type { CollectionTokenInfo, CollectionGuestSubmission } from '@/lib/types/database';
import { submitGuestRecipe, updateGuestRecipeNotification, updateGuestNotification } from '@/lib/supabase/collection';
import Frame from './Frame';
import IntroInfoStep from './steps/IntroInfoStep';
// inline simple hero step to avoid import resolution issues
import RecipeFormStep, { type RecipeData as FormRecipeData } from './steps/RecipeFormStep';
import SummaryStep from './steps/SummaryStep';
import SuccessStep from './steps/SuccessStep';
import WelcomeStep from './steps/WelcomeStep';
import { journeySteps } from '@/lib/recipe-journey/recipeJourneySteps';

interface GuestData {
  id?: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  existing: boolean;
}

type RecipeData = FormRecipeData;

interface RecipeJourneyWrapperProps {
  tokenInfo: CollectionTokenInfo;
  guestData: GuestData;
  token: string;
}

export default function RecipeJourneyWrapper({ tokenInfo, guestData, token }: RecipeJourneyWrapperProps) {
  const router = useRouter();
  // steps: 0=welcome, 1=introInfo, 2=recipeForm, 3=summary
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [recipeData, setRecipeData] = useState<RecipeData>({
    recipeName: '',
    ingredients: '',
    instructions: '',
    personalNote: '',
    rawRecipeText: undefined
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [autosaveState, setAutosaveState] = useState<'idle' | 'saving' | 'saved'>('idle');
  const isDirtyRef = useRef(false);
  const lastRecipeIdRef = useRef<string | null>(null);
  const lastGuestIdRef = useRef<string | null>(null);
  const guestOptInRef = useRef<boolean>(false);
  const guestOptInEmailRef = useRef<string | null>(null);
  const totalSteps = journeySteps.length;

  // Reset journey: go to form
  const resetJourney = () => {
    setCurrentStepIndex(1);
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
    isDirtyRef.current = false;
  };

  // Get the cookbook creator's name for personalization
  const isPreviewMode = typeof window !== 'undefined' && sessionStorage?.getItem('isPreviewMode') === 'true';
  const creatorName = isPreviewMode ? '[Your Name]' : (tokenInfo.user_name.split(' ')[0] || 'the cookbook creator');

  const getImageUrl = () => {
    // Use collect_1.jpg for collection journey
    return "/images/collect/collect_1.jpg";
  };

  const focusFirstHeading = useCallback(() => {
    // move focus to the first heading in content for a11y
    const h = document.querySelector('main h2, main h1');
    if (h instanceof HTMLElement) h.focus();
  }, []);

  // Navigation functions
  const handleNext = () => {
    if (currentStepIndex < totalSteps - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
      setTimeout(focusFirstHeading, 0);
      
      // Scroll to top on mobile for better UX
      if (typeof window !== 'undefined' && window.innerWidth < 1024) {
        setTimeout(() => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 100);
      }
    }
  };

  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
      setTimeout(focusFirstHeading, 0);
      
      // Scroll to top on mobile for better UX
      if (typeof window !== 'undefined' && window.innerWidth < 1024) {
        setTimeout(() => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 100);
      }
    } else {
      // Check if we're in preview mode
      const isPreviewMode = typeof window !== 'undefined' && sessionStorage.getItem('isPreviewMode') === 'true';
      
      if (isPreviewMode) {
        // In preview mode, go back to the preview search page
        window.history.back();
      } else {
        // Normal mode - go back to the name search landing for this token
        router.push(`/collect/${token}`);
      }
    }
  };

  const handleFormFieldChange = (field: keyof RecipeData, value: string) => {
    isDirtyRef.current = true;
    setRecipeData(prev => ({ ...prev, [field]: value }));
  };

  const handlePasteRecipe = async (rawText: string) => {
    // When user pastes a recipe, skip directly to submission
    isDirtyRef.current = true;
    
    // Submit immediately with the raw text passed as parameter
    await handleSubmitWithRawText(rawText);
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
        ingredients: recipeData.rawRecipeText ? '' : recipeData.ingredients.trim(),
        instructions: recipeData.rawRecipeText ? '' : recipeData.instructions.trim(),
        comments: recipeData.personalNote.trim() || undefined,
        raw_recipe_text: recipeData.rawRecipeText
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
      isDirtyRef.current = false;
      lastRecipeIdRef.current = data?.recipe_id || null;
      lastGuestIdRef.current = data?.guest_id || null;
      guestOptInRef.current = !!data?.guest_notify_opt_in;
      guestOptInEmailRef.current = (data?.guest_notify_email as string | null) || null;
      
      // Clean up localStorage
      localStorage.removeItem('recipeJourneyData');

    } catch (err) {
      console.error('Submit error:', err);
      setSubmitError('An unexpected error occurred. Please try again.');
      setSubmitting(false);
    }
  };

  const handleSubmitWithRawText = async (rawText: string) => {
    if (submitting) return;
    
    setSubmitting(true);
    setSubmitError(null);

    try {
      // Prepare submission data with raw text
      const submission: CollectionGuestSubmission = {
        first_name: guestData.firstName,
        last_name: guestData.lastName,
        email: guestData.email,
        phone: guestData.phone,
        recipe_name: recipeData.recipeName.trim() || 'Full Recipe Received', // Better default for raw mode
        ingredients: '', // Empty for raw mode
        instructions: '', // Empty for raw mode
        comments: recipeData.personalNote.trim() || undefined,
        raw_recipe_text: rawText // Use the passed raw text directly
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
      isDirtyRef.current = false;
      lastRecipeIdRef.current = data?.recipe_id || null;
      lastGuestIdRef.current = data?.guest_id || null;
      guestOptInRef.current = !!data?.guest_notify_opt_in;
      guestOptInEmailRef.current = (data?.guest_notify_email as string | null) || null;
      
      // Clean up localStorage
      localStorage.removeItem('recipeJourneyData');

    } catch (err) {
      console.error('Submit error:', err);
      setSubmitError('An unexpected error occurred. Please try again.');
      setSubmitting(false);
    }
  };

  // Auto-save to localStorage with lightweight feedback
  useEffect(() => {
    setAutosaveState('saving');
    localStorage.setItem('recipeJourneyData', JSON.stringify({
      currentStepIndex,
      recipeData
    }));
    const t = setTimeout(() => setAutosaveState('saved'), 250);
    return () => clearTimeout(t);
  }, [currentStepIndex, recipeData]);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('recipeJourneyData');
    if (saved) {
      try {
        const { currentStepIndex: savedStep, recipeData: savedData } = JSON.parse(saved);
        if (typeof savedStep === 'number' && savedData) {
          setCurrentStepIndex(savedStep);
          setRecipeData(savedData);
        }
      } catch (e) {
        // Ignore parsing errors
      }
    }
  }, []);

  // Confirm before unload if dirty and not submitted
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirtyRef.current && !submitSuccess) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [submitSuccess]);

  const onEditSection = (section: 'title' | 'ingredients' | 'instructions' | 'note') => {
    setCurrentStepIndex(1);
    setTimeout(() => {
      const map: Record<typeof section, string> = {
        title: 'title',
        ingredients: 'ingredients',
        instructions: 'instructions',
        note: 'note',
      };
      const el = document.getElementById(map[section]);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 0);
  };

  const handleAddAnother = () => {
    resetJourney();
    const idx = journeySteps.findIndex(s => s.key === 'recipeForm');
    if (idx !== -1) setCurrentStepIndex(idx);
  };

  const handleDone = () => {
    router.push(`/`);
  };

  const canContinueFromForm = () =>
    recipeData.recipeName.trim().length > 0 &&
    recipeData.ingredients.trim().length > 0 &&
    recipeData.instructions.trim().length > 0;

  const current = journeySteps[currentStepIndex]?.key;

  const bottomNav = (
    <div className="flex items-center justify-between">
      {current !== 'success' ? (
        <button
          type="button"
          onClick={handlePrevious}
          disabled={submitting}
          className="px-5 py-3 rounded-full border border-gray-300 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Back
        </button>
      ) : null}

      {current === 'success' ? (
        <>
          <button
            type="button"
            onClick={handleAddAnother}
            className="px-6 py-3 rounded-full bg-black text-white hover:bg-gray-800"
          >
            Add another recipe
          </button>
          <button
            type="button"
            onClick={handleDone}
            className="px-6 py-3 rounded-full border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Done for now
          </button>
        </>
      ) : currentStepIndex < totalSteps - 2 ? (
        <button
          type="button"
          onClick={handleNext}
          disabled={(current === 'recipeForm' && !canContinueFromForm()) || submitting}
          className="px-8 py-3 rounded-full bg-black text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {journeySteps[currentStepIndex]?.ctaLabel ?? 'Continue'}
        </button>
      ) : (
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting || submitSuccess}
          className="px-8 py-3 rounded-full bg-black text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-busy={submitting}
        >
          {submitting ? 'Submitting…' : submitSuccess ? 'Submitted! 🎉' : 'Submit Recipe 🎉'}
        </button>
      )}
    </div>
  );

  // After submit, move to success screen
  useEffect(() => {
    if (submitSuccess) {
      const idx = journeySteps.findIndex(s => s.key === 'success');
      if (idx !== -1) setCurrentStepIndex(idx);
    }
  }, [submitSuccess]);

  const handleSavePrefs = async (name?: string, email?: string, optedIn?: boolean) => {
    const recipeId = lastRecipeIdRef.current;
    const guestId = lastGuestIdRef.current;
    // Keep recipe-level update for completeness
    if (recipeId) {
      await updateGuestRecipeNotification(recipeId, {
        notify_opt_in: !!optedIn,
        notify_email: email || guestData.email || null,
      });
    }
    // Update guest-level preference so we don't ask again
    if (guestId) {
      await updateGuestNotification(guestId, {
        notify_opt_in: !!optedIn,
        notify_email: email || guestData.email || null,
      });
    }
  };

  return (
    <Frame title={submitError ? 'There was an error' : undefined} bottomNav={bottomNav} showHeaderLogo leftImageSrc={getImageUrl()}>
      <AnimatePresence mode="wait">
        {current === 'welcome' && (
          <motion.div
            key="welcome"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <WelcomeStep creatorName={creatorName} />
          </motion.div>
        )}
        {current === 'introInfo' && (
          <motion.div
            key="introInfo"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <IntroInfoStep onContinue={handleNext} onBack={handlePrevious} />
          </motion.div>
        )}
        {current === 'realBook' && (
          <motion.div
            key="realBook"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <div className="min-h-[calc(100vh-180px)] flex items-center justify-center" role="region" aria-labelledby="printed-book-heading">
              <div className="text-center px-4 md:px-6">
                <h2 id="printed-book-heading" className="font-serif text-3xl md:text-4xl font-semibold text-gray-900">
                  Your recipe will be printed in a real book —<br />
                  write it your way, make it yours -<br /> <span className="opacity-100">have fun!</span>
                </h2>
              </div>
            </div>
          </motion.div>
        )}
        {current === 'recipeForm' && (
          <motion.div
            key="recipeForm"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <RecipeFormStep data={recipeData} onChange={handleFormFieldChange} onContinue={handleNext} onBack={handlePrevious} onPasteRecipe={handlePasteRecipe} autosaveState={autosaveState} />
          </motion.div>
        )}
        {current === 'summary' && (
          <motion.div
            key="summary"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <SummaryStep
              recipeName={recipeData.recipeName}
              ingredients={recipeData.ingredients}
              instructions={recipeData.instructions}
              personalNote={recipeData.personalNote}
              onEditSection={onEditSection}
            />
          </motion.div>
        )}
        {current === 'success' && (
          <motion.div
            key="success"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <SuccessStep
              defaultName={`${guestData.firstName} ${guestData.lastName}`.trim()}
              defaultEmail={guestData.email}
              hasGuestOptIn={guestOptInRef.current}
              guestOptInEmail={guestOptInEmailRef.current || undefined}
              onSavePrefs={handleSavePrefs}
            />
          </motion.div>
        )}
        {submitError && (
          <motion.div
            key="error"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <div className="mt-6 text-center text-red-600" role="alert" aria-live="assertive">{submitError}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </Frame>
  );
}