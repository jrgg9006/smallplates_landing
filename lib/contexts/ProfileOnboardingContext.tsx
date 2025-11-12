'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { createSupabaseClient } from '@/lib/supabase/client';

export enum OnboardingSteps {
  FIRST_RECIPE = 'first_recipe',
  FIRST_GUEST = 'first_guest',
  CUSTOMIZE_COLLECTOR = 'customize_collector'
}

export interface OnboardingStep {
  id: OnboardingSteps;
  completed: boolean;
}

interface OnboardingState {
  has_seen_welcome: boolean;
  welcome_dismissed_at: string | null;
  completed_steps: string[];
  last_onboarding_shown: string | null;
  dismissal_count: number;
  first_recipe_showcase_sent: boolean;
}

interface ProfileOnboardingContextType {
  // State
  isFirstTimeUser: boolean;
  showWelcomeOverlay: boolean;
  showOnboardingResume: boolean;
  completedSteps: OnboardingSteps[];
  currentStep: number;
  
  // Actions
  dismissWelcome: () => void;
  completeStep: (stepId: OnboardingSteps) => void;
  skipOnboarding: () => void;
  resumeOnboarding: () => void;
  permanentlyDismissOnboarding: () => void;
  
  // Helpers
  shouldShowOnboarding: boolean;
  getNextStep: () => OnboardingStep | null;
}

const ProfileOnboardingContext = createContext<ProfileOnboardingContextType | null>(null);

export const useProfileOnboarding = () => {
  const context = useContext(ProfileOnboardingContext);
  if (!context) {
    throw new Error('useProfileOnboarding must be used within ProfileOnboardingProvider');
  }
  return context;
};

interface ProfileOnboardingProviderProps {
  children: ReactNode;
}

export function ProfileOnboardingProvider({ children }: ProfileOnboardingProviderProps) {
  const { user } = useAuth();
  const [onboardingState, setOnboardingState] = useState<OnboardingState>({
    has_seen_welcome: false,
    welcome_dismissed_at: null,
    completed_steps: [],
    last_onboarding_shown: null,
    dismissal_count: 0,
    first_recipe_showcase_sent: false
  });
  const [guestCount, setGuestCount] = useState(0);
  const [recipeCount, setRecipeCount] = useState(0);
  const [showOnboardingCards, setShowOnboardingCards] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showOnboardingResume, setShowOnboardingResume] = useState(false);

  // Load onboarding state from user data
  useEffect(() => {
    if (user?.id) {
      if (user?.onboarding_state && typeof user.onboarding_state === 'object') {
        console.log('Loading onboarding state from user:', user.onboarding_state);
        setOnboardingState(user.onboarding_state);
      } else {
        // User exists but has no onboarding state - this is a first-time user
        console.log('User has no onboarding state, treating as first-time user');
        // Keep the initial state which has has_seen_welcome: false
      }
    }
  }, [user?.id, user?.onboarding_state]);

  // Load guest and recipe counts and determine what to show
  useEffect(() => {
    const loadCounts = async () => {
      if (!user?.id) return;

      const supabase = createSupabaseClient();

      // Get guest count
      const { count: guestTotal } = await supabase
        .from('guests')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // Get recipe count
      const { count: recipeTotal } = await supabase
        .from('recipes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      const gCount = guestTotal || 0;
      const rCount = recipeTotal || 0;
      
      setGuestCount(gCount);
      setRecipeCount(rCount);

      // Determine what to show based on counts and onboarding state
      const isEmpty = gCount === 0;
      const hasSeenWelcome = onboardingState.has_seen_welcome;
      const completedSteps = onboardingState.completed_steps.length;
      const dismissalCount = onboardingState.dismissal_count;
      const hasCompletedOnboarding = completedSteps === 3;
      const hasBeenDismissedTooManyTimes = dismissalCount >= 3;
      
      if (isEmpty && !hasSeenWelcome) {
        // First time user - show welcome
        setShowWelcome(true);
        setShowOnboardingCards(false);
        setShowOnboardingResume(false);
      } else if (isEmpty && hasSeenWelcome && dismissalCount === 0) {
        // User has seen welcome but hasn't dismissed - show onboarding cards
        setShowWelcome(false);
        setShowOnboardingCards(true);
        setShowOnboardingResume(false);
      } else if (isEmpty && hasSeenWelcome && !hasCompletedOnboarding && !hasBeenDismissedTooManyTimes) {
        // User dismissed but can resume - show resume component
        setShowWelcome(false);
        setShowOnboardingCards(false);
        setShowOnboardingResume(true);
      } else {
        // User has guests, completed onboarding, or dismissed too many times - show normal interface
        setShowWelcome(false);
        setShowOnboardingCards(false);
        setShowOnboardingResume(false);
      }
    };

    loadCounts();
  }, [user?.id, onboardingState.has_seen_welcome, onboardingState.dismissal_count, onboardingState.completed_steps.length]);

  // Update onboarding state in database
  const updateOnboardingState = useCallback(async (newState: Partial<OnboardingState>) => {
    if (!user?.id) return;

    const updatedState = { ...onboardingState, ...newState };
    setOnboardingState(updatedState);

    try {
      const supabase = createSupabaseClient();
      const { error } = await supabase
        .from('profiles')
        .update({ onboarding_state: updatedState })
        .eq('id', user.id);

      if (error) {
        console.error('Failed to update onboarding state:', error);
        // Don't revert the local state - the user can still continue
        // but log that the database update failed
      } else {
        console.log('Successfully updated onboarding state:', updatedState);
      }
    } catch (err) {
      console.error('Error updating onboarding state:', err);
    }
  }, [user?.id, onboardingState]);

  // Simple state - use our local state instead of complex logic
  const shouldShowOnboarding = showOnboardingCards;
  const showWelcomeOverlay = showWelcome;
  const isFirstTimeUser = guestCount === 0 && recipeCount === 0;

  // Debug logging with more detail
  useEffect(() => {
    console.log('=== ONBOARDING DEBUG ===');
    console.log('User ID:', user?.id);
    console.log('Guest Count:', guestCount);
    console.log('Recipe Count:', recipeCount);
    console.log('Onboarding State:', onboardingState);
    console.log('Has Seen Welcome:', onboardingState.has_seen_welcome);
    console.log('Welcome Dismissed At:', onboardingState.welcome_dismissed_at);
    console.log('Show Welcome:', showWelcome);
    console.log('Show Onboarding Cards:', showOnboardingCards);
    console.log('Show Onboarding Resume:', showOnboardingResume);
    console.log('Should Show Onboarding:', shouldShowOnboarding);
    console.log('Is First Time User:', isFirstTimeUser);
    console.log('Show Welcome Overlay:', showWelcomeOverlay);
    console.log('========================');
  }, [guestCount, recipeCount, onboardingState, isFirstTimeUser, showWelcomeOverlay, user?.id, showWelcome, showOnboardingCards, showOnboardingResume, shouldShowOnboarding]);

  const dismissWelcome = useCallback(() => {
    console.log('Dismissing welcome overlay...');
    
    // Simply switch states
    setShowWelcome(false);
    setShowOnboardingCards(true);
    
    // Update database in background
    updateOnboardingState({
      has_seen_welcome: true,
      welcome_dismissed_at: new Date().toISOString(),
      last_onboarding_shown: new Date().toISOString()
    });
  }, [updateOnboardingState]);

  const completeStep = useCallback((stepId: OnboardingSteps) => {
    if (!onboardingState.completed_steps.includes(stepId)) {
      updateOnboardingState({
        completed_steps: [...onboardingState.completed_steps, stepId]
      });
    }
  }, [onboardingState.completed_steps, updateOnboardingState]);

  const skipOnboarding = useCallback(() => {
    console.log('Skipping onboarding...');
    
    // Hide onboarding cards and show resume component
    setShowOnboardingCards(false);
    setShowOnboardingResume(true);
    
    // Update database to track dismissal
    updateOnboardingState({
      dismissal_count: onboardingState.dismissal_count + 1,
      last_onboarding_shown: new Date().toISOString()
    });
  }, [onboardingState.dismissal_count, updateOnboardingState]);

  const resumeOnboarding = useCallback(() => {
    console.log('Resuming onboarding...');
    
    // Show onboarding cards and hide resume component
    setShowOnboardingResume(false);
    setShowOnboardingCards(true);
  }, []);

  const permanentlyDismissOnboarding = useCallback(() => {
    console.log('Permanently dismissing onboarding...');
    
    // Hide resume component
    setShowOnboardingResume(false);
    
    // Update database to track permanent dismissal
    updateOnboardingState({
      dismissal_count: onboardingState.dismissal_count + 1,
      last_onboarding_shown: new Date().toISOString()
    });
  }, [onboardingState.dismissal_count, updateOnboardingState]);

  const getNextStep = useCallback((): OnboardingStep | null => {
    const allSteps = [
      OnboardingSteps.FIRST_RECIPE,
      OnboardingSteps.FIRST_GUEST,
      OnboardingSteps.CUSTOMIZE_COLLECTOR
    ];

    for (const step of allSteps) {
      if (!onboardingState.completed_steps.includes(step)) {
        return {
          id: step,
          completed: false
        };
      }
    }

    return null;
  }, [onboardingState.completed_steps]);

  const currentStep = onboardingState.completed_steps.length;
  const completedSteps = onboardingState.completed_steps as OnboardingSteps[];

  const value: ProfileOnboardingContextType = {
    isFirstTimeUser,
    showWelcomeOverlay,
    showOnboardingResume,
    completedSteps,
    currentStep,
    dismissWelcome,
    completeStep,
    skipOnboarding,
    resumeOnboarding,
    permanentlyDismissOnboarding,
    shouldShowOnboarding,
    getNextStep
  };

  return (
    <ProfileOnboardingContext.Provider value={value}>
      {children}
    </ProfileOnboardingContext.Provider>
  );
}