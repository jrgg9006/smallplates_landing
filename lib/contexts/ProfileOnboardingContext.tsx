'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { createSupabaseClient } from '@/lib/supabase/client';
import { getCurrentProfile } from '@/lib/supabase/profiles';

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
  // Reason: new SetupChecklist tracking — both are KEYED BY GROUP_ID because
  // a user can have multiple groups and each one needs its own checklist state.
  // shared_to_whatsapp_at_by_group: marks "Share in WhatsApp" done per group when
  // the user copies that group's link. checklist_dismissed_at_by_group: collapses
  // the checklist per group when the user clicks "Hide for now" on that group.
  // checklist_permanently_dismissed_at_by_group: user clicked "I've got it from here"
  // — the pill and modal are fully hidden until restored from Account Settings.
  shared_to_whatsapp_at_by_group?: Record<string, string>;
  checklist_dismissed_at_by_group?: Record<string, string>;
  checklist_permanently_dismissed_at_by_group?: Record<string, string>;
}

interface ProfileOnboardingContextType {
  // State
  isFirstTimeUser: boolean;
  showWelcomeOverlay: boolean;
  showOnboardingResume: boolean;
  showFirstRecipeExperience: boolean;
  completedSteps: OnboardingSteps[];
  currentStep: number;
  
  // Actions
  dismissWelcome: () => void;
  skipAllOnboarding: () => void;
  startFirstRecipeExperience: () => void;
  skipFirstRecipeExperience: () => void;
  completeStep: (stepId: OnboardingSteps) => void;
  skipOnboarding: () => void;
  resumeOnboarding: () => void;
  permanentlyDismissOnboarding: () => void;
  
  // Helpers
  shouldShowOnboarding: boolean;
  getNextStep: () => OnboardingStep | null;

  // SetupChecklist API (new) — per-group
  getSharedToWhatsappAt: (groupId: string) => string | null;
  markSharedToWhatsapp: (groupId: string) => void;
  isChecklistDismissed: (groupId: string) => boolean;
  dismissChecklist: (groupId: string) => void;
  restoreChecklist: (groupId: string) => void;

  // Permanent dismissal ("I've got it from here") — hides the pill/modal entirely
  // for that group until restored from Account Settings.
  isChecklistPermanentlyDismissed: (groupId: string) => boolean;
  permanentlyDismissChecklist: (groupId: string) => void;
  restoreAllDismissedChecklists: () => void;
  permanentlyDismissedGroupIds: string[];
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
  // Reason: legacy onboarding (cards / first-recipe / resume) is no longer used in
  // /profile/groups. Keep the API surface alive for backward-compat (the deprecated
  // /profile redirect page and tests still import the enum), but enable the welcome
  // overlay so the new SetupChecklist flow can show the welcome screen on first visit.
  const ONBOARDING_PAUSED = false;
  
  const { user } = useAuth();
  const [onboardingState, setOnboardingState] = useState<OnboardingState>({
    has_seen_welcome: false,
    welcome_dismissed_at: null,
    completed_steps: [],
    last_onboarding_shown: null,
    dismissal_count: 0,
    first_recipe_showcase_sent: false,
    shared_to_whatsapp_at_by_group: {},
    checklist_dismissed_at_by_group: {},
    checklist_permanently_dismissed_at_by_group: {},
  });
  const [guestCount, setGuestCount] = useState(0);
  const [showOnboardingCards, setShowOnboardingCards] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showOnboardingResume, setShowOnboardingResume] = useState(false);
  const [showFirstRecipeExperience, setShowFirstRecipeExperience] = useState(false);
  const hasLoadedStateRef = useRef(false);

  // Load onboarding state from database (only once when user loads)
  useEffect(() => {
    if (!user?.id || hasLoadedStateRef.current) return;
    
    let cancelled = false;
    
    const loadState = async () => {
      const { data: profile, error } = await getCurrentProfile();
      
      if (cancelled) return;
      
      if (error) {
        console.error('Failed to load onboarding state:', error);
        hasLoadedStateRef.current = true; // Mark as loaded even on error to prevent infinite retries
        return;
      }
      
      // Type assertion needed because Profile type doesn't include onboarding_state in TypeScript
      const profileWithOnboarding = profile as any;
      if (profileWithOnboarding?.onboarding_state && typeof profileWithOnboarding.onboarding_state === 'object') {
        const dbState = profileWithOnboarding.onboarding_state as OnboardingState;
        // console.log removed for production
        setOnboardingState(dbState);
      } else {
        // console.log removed for production
      }
      
      hasLoadedStateRef.current = true;
    };
    
    loadState();
    return () => { cancelled = true; };
  }, [user?.id]);

  // Update onboarding state in database
  const updateOnboardingState = useCallback(async (updates: Partial<OnboardingState>) => {
    if (!user?.id) return;
    
    setOnboardingState(prev => {
      const updated = { ...prev, ...updates };
      
      // Save to database (fire and forget, but log errors)
      const supabase = createSupabaseClient();
      void supabase
        .from('profiles')
        .update({ onboarding_state: updated })
        .eq('id', user.id)
        .then(({ error }) => {
          if (error) {
            console.error('Failed to save onboarding state:', error);
          } else {
            // console.log removed for production
          }
        });
      
      return updated;
    });
  }, [user?.id]);

  // Simple helper function to check if user has guests (excluding self)
  const checkHasGuests = useCallback(async (userId: string): Promise<boolean> => {
    const supabase = createSupabaseClient();
    const { count } = await supabase
      .from('guests')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_self', false)
      .eq('is_archived', false);
    return (count || 0) > 0;
  }, []);

  // Simple helper function to check if user has their own recipe
  const checkHasOwnRecipe = useCallback(async (userId: string): Promise<boolean> => {
    const supabase = createSupabaseClient();
    const { data: selfGuest, error } = await supabase
      .from('guests')
      .select('id, recipes_received')
      .eq('user_id', userId)
      .eq('is_self', true)
      .eq('is_archived', false)
      .maybeSingle();

    if (error || !selfGuest) {
      return false;
    }

    return (selfGuest.recipes_received || 0) > 0;
  }, []);

  // Auto-sync: Check reality and complete steps accordingly
  useEffect(() => {
    const syncOnboardingState = async () => {
      if (!user?.id || !hasLoadedStateRef.current) return; // Wait for initial state load

      const currentCompletedSteps = onboardingState.completed_steps;
      const hasCompletedOnboarding = currentCompletedSteps.length === 3;

      // Early return: if onboarding is complete, just load counts for UI
      if (hasCompletedOnboarding) {
        const supabase = createSupabaseClient();
        const { count: guestTotal } = await supabase
          .from('guests')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('is_archived', false);
        
        setGuestCount(guestTotal || 0);
        setShowWelcome(false);
        // Don't automatically hide onboarding cards - let user explicitly exit
        // Only hide if user has explicitly dismissed it
        const dismissalCount = onboardingState.dismissal_count;
        if (dismissalCount > 0) {
          setShowOnboardingCards(false);
          setShowOnboardingResume(false);
        } else {
          // Keep showing cards even if all steps are complete, until user exits
          setShowOnboardingCards(true);
          setShowOnboardingResume(false);
        }
        return;
      }

      // Check reality and auto-complete steps
      const stepsToComplete: OnboardingSteps[] = [];
      
      // Check if user has their own recipe
      if (!currentCompletedSteps.includes(OnboardingSteps.FIRST_RECIPE)) {
        const hasRecipe = await checkHasOwnRecipe(user.id);
        if (hasRecipe) {
          stepsToComplete.push(OnboardingSteps.FIRST_RECIPE);
        }
      }
      
      // Check if user has guests (excluding self)
      if (!currentCompletedSteps.includes(OnboardingSteps.FIRST_GUEST)) {
        const hasGuests = await checkHasGuests(user.id);
        if (hasGuests) {
          stepsToComplete.push(OnboardingSteps.FIRST_GUEST);
        }
      }

      // Auto-complete steps if needed
      if (stepsToComplete.length > 0) {
        const updatedSteps = [...currentCompletedSteps, ...stepsToComplete];
        updateOnboardingState({
          completed_steps: updatedSteps
        });
      }

      // Load guest count for UI
      const supabase = createSupabaseClient();
      const { count: guestTotal } = await supabase
        .from('guests')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_archived', false);
      
      setGuestCount(guestTotal || 0);

      // Determine what to show based on onboarding completion
      const finalCompletedSteps = stepsToComplete.length > 0 
        ? [...currentCompletedSteps, ...stepsToComplete]
        : currentCompletedSteps;
      
      const hasSeenWelcome = onboardingState.has_seen_welcome;
      const finalCompletedCount = finalCompletedSteps.length;
      const dismissalCount = onboardingState.dismissal_count;
      const finalHasCompletedOnboarding = finalCompletedCount === 3;
      const hasBeenDismissedTooManyTimes = dismissalCount >= 5;
      
      if (!hasSeenWelcome) {
        setShowWelcome(true);
        setShowOnboardingCards(false);
        setShowOnboardingResume(false);
      } else if (hasSeenWelcome && dismissalCount === 0) {
        // Show onboarding cards as long as user hasn't dismissed, even if steps are completed
        setShowWelcome(false);
        setShowOnboardingCards(true);
        setShowOnboardingResume(false);
      } else if (hasSeenWelcome && !finalHasCompletedOnboarding && !hasBeenDismissedTooManyTimes) {
        setShowWelcome(false);
        setShowOnboardingCards(false);
        setShowOnboardingResume(true);
      } else {
        setShowWelcome(false);
        setShowOnboardingCards(false);
        setShowOnboardingResume(false);
      }
    };

    syncOnboardingState();
  }, [user?.id, onboardingState.has_seen_welcome, onboardingState.dismissal_count, onboardingState.completed_steps, checkHasGuests, checkHasOwnRecipe, updateOnboardingState]);

  // Simple state - use our local state instead of complex logic
  const shouldShowOnboarding = showOnboardingCards;
  const showWelcomeOverlay = showWelcome;
  const isFirstTimeUser = guestCount === 0;

  // Debug logging with more detail
  useEffect(() => {
    // console.log removed for production
    // console.log removed for production
    // console.log removed for production
    // console.log removed for production
    // console.log removed for production
    // console.log removed for production
    // console.log removed for production
    // console.log removed for production
    // console.log removed for production
    // console.log removed for production
    // console.log removed for production
    // console.log removed for production
    // console.log removed for production
  }, [guestCount, onboardingState, isFirstTimeUser, showWelcomeOverlay, user?.id, showWelcome, showOnboardingCards, showOnboardingResume, shouldShowOnboarding]);

  const dismissWelcome = useCallback(() => {
    // console.log removed for production
    
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

  const startFirstRecipeExperience = useCallback(() => {
    // console.log removed for production
    
    // Switch to first recipe experience
    setShowWelcome(false);
    setShowOnboardingCards(false);
    setShowFirstRecipeExperience(true);
    
    // Update database in background
    updateOnboardingState({
      has_seen_welcome: true,
      welcome_dismissed_at: new Date().toISOString(),
      last_onboarding_shown: new Date().toISOString()
    });
  }, [updateOnboardingState]);

  const skipFirstRecipeExperience = useCallback(() => {
    // console.log removed for production
    
    // Go back to onboarding cards
    setShowFirstRecipeExperience(false);
    setShowOnboardingCards(true);
  }, []);

  const skipAllOnboarding = useCallback(() => {
    // console.log removed for production
    
    // Hide all onboarding components
    setShowWelcome(false);
    setShowOnboardingCards(false);
    setShowFirstRecipeExperience(false);
    
    // Update database to mark onboarding as dismissed
    updateOnboardingState({
      has_seen_welcome: true,
      welcome_dismissed_at: new Date().toISOString(),
      last_onboarding_shown: new Date().toISOString(),
      dismissal_count: onboardingState.dismissal_count + 1
    });
  }, [updateOnboardingState, onboardingState.dismissal_count]);

  const completeStep = useCallback((stepId: OnboardingSteps) => {
    setOnboardingState(prev => {
      // Only update if step is not already completed
      if (prev.completed_steps.includes(stepId)) {
        return prev;
      }
      
      const updatedSteps = [...prev.completed_steps, stepId];
      updateOnboardingState({
        completed_steps: updatedSteps
      });
      
      return {
        ...prev,
        completed_steps: updatedSteps
      };
    });
  }, [updateOnboardingState]);

  const skipOnboarding = useCallback(() => {
    // console.log removed for production
    
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
    // console.log removed for production
    
    // Show onboarding cards and hide resume component
    setShowOnboardingResume(false);
    setShowOnboardingCards(true);
  }, []);

  const permanentlyDismissOnboarding = useCallback(() => {
    // console.log removed for production
    
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

  // SetupChecklist methods — all per-group
  const getSharedToWhatsappAt = useCallback((groupId: string): string | null => {
    return onboardingState.shared_to_whatsapp_at_by_group?.[groupId] ?? null;
  }, [onboardingState.shared_to_whatsapp_at_by_group]);

  const markSharedToWhatsapp = useCallback((groupId: string) => {
    if (!groupId) return;
    const current = onboardingState.shared_to_whatsapp_at_by_group ?? {};
    if (current[groupId]) return;
    updateOnboardingState({
      shared_to_whatsapp_at_by_group: { ...current, [groupId]: new Date().toISOString() },
    });
  }, [onboardingState.shared_to_whatsapp_at_by_group, updateOnboardingState]);

  const isChecklistDismissed = useCallback((groupId: string): boolean => {
    return !!onboardingState.checklist_dismissed_at_by_group?.[groupId];
  }, [onboardingState.checklist_dismissed_at_by_group]);

  const dismissChecklist = useCallback((groupId: string) => {
    if (!groupId) return;
    const current = onboardingState.checklist_dismissed_at_by_group ?? {};
    updateOnboardingState({
      checklist_dismissed_at_by_group: { ...current, [groupId]: new Date().toISOString() },
    });
  }, [onboardingState.checklist_dismissed_at_by_group, updateOnboardingState]);

  const restoreChecklist = useCallback((groupId: string) => {
    if (!groupId) return;
    const current = { ...(onboardingState.checklist_dismissed_at_by_group ?? {}) };
    delete current[groupId];
    updateOnboardingState({ checklist_dismissed_at_by_group: current });
  }, [onboardingState.checklist_dismissed_at_by_group, updateOnboardingState]);

  // Permanent dismissal — "I've got it from here"
  const isChecklistPermanentlyDismissed = useCallback((groupId: string): boolean => {
    return !!onboardingState.checklist_permanently_dismissed_at_by_group?.[groupId];
  }, [onboardingState.checklist_permanently_dismissed_at_by_group]);

  const permanentlyDismissChecklist = useCallback((groupId: string) => {
    if (!groupId) return;
    const current = onboardingState.checklist_permanently_dismissed_at_by_group ?? {};
    updateOnboardingState({
      checklist_permanently_dismissed_at_by_group: { ...current, [groupId]: new Date().toISOString() },
    });
  }, [onboardingState.checklist_permanently_dismissed_at_by_group, updateOnboardingState]);

  const restoreAllDismissedChecklists = useCallback(() => {
    updateOnboardingState({ checklist_permanently_dismissed_at_by_group: {} });
  }, [updateOnboardingState]);

  const permanentlyDismissedGroupIds = Object.keys(
    onboardingState.checklist_permanently_dismissed_at_by_group ?? {}
  );

  const value: ProfileOnboardingContextType = {
    isFirstTimeUser,
    // When onboarding is paused, hide all onboarding UI elements
    showWelcomeOverlay: ONBOARDING_PAUSED ? false : showWelcomeOverlay,
    showOnboardingResume: ONBOARDING_PAUSED ? false : showOnboardingResume,
    showFirstRecipeExperience: ONBOARDING_PAUSED ? false : showFirstRecipeExperience,
    completedSteps,
    currentStep,
    dismissWelcome,
    skipAllOnboarding,
    startFirstRecipeExperience,
    skipFirstRecipeExperience,
    completeStep,
    skipOnboarding,
    resumeOnboarding,
    permanentlyDismissOnboarding,
    shouldShowOnboarding: ONBOARDING_PAUSED ? false : shouldShowOnboarding,
    getNextStep,
    getSharedToWhatsappAt,
    markSharedToWhatsapp,
    isChecklistDismissed,
    dismissChecklist,
    restoreChecklist,
    isChecklistPermanentlyDismissed,
    permanentlyDismissChecklist,
    restoreAllDismissedChecklists,
    permanentlyDismissedGroupIds,
  };

  return (
    <ProfileOnboardingContext.Provider value={value}>
      {children}
    </ProfileOnboardingContext.Provider>
  );
}