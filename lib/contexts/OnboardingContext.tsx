"use client";

import React, { useEffect } from "react";
import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
} from "react";
import { useRouter } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase/client";
import {
  OnboardingState,
  OnboardingContextType,
} from "@/lib/types/onboarding";
import { generateGumroadLink } from "@/lib/payments/gumroad";

// Total steps: 5 for couples, 4 for gift givers
const TOTAL_STEPS_COUPLE = 5;
const TOTAL_STEPS_GIFT = 4;

const getInitialState = (userType: 'couple' | 'gift_giver'): OnboardingState => ({
  currentStep: 1,
  totalSteps: userType === 'couple' ? TOTAL_STEPS_COUPLE : TOTAL_STEPS_GIFT,
  answers: {},
  selectedProductTier: null,
  isComplete: false,
});

/**
 * Get localStorage key for onboarding state
 */
const getStorageKey = (userType: 'couple' | 'gift_giver'): string => {
  return `onboarding_state_${userType}`;
};

/**
 * Load onboarding state from localStorage
 */
const loadStateFromStorage = (userType: 'couple' | 'gift_giver'): OnboardingState | null => {
  if (typeof window === 'undefined') return null;
  
  try {
    const saved = localStorage.getItem(getStorageKey(userType));
    if (saved) {
      const parsed = JSON.parse(saved);
      // Validate that it has the expected structure
      if (parsed && typeof parsed === 'object' && 'currentStep' in parsed) {
        return parsed as OnboardingState;
      }
    }
  } catch (e) {
    // Ignore parsing errors
    console.warn('Failed to load onboarding state from localStorage:', e);
  }
  
  return null;
};

/**
 * Save onboarding state to localStorage
 */
const saveStateToStorage = (userType: 'couple' | 'gift_giver', state: OnboardingState): void => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(getStorageKey(userType), JSON.stringify(state));
  } catch (e) {
    console.warn('Failed to save onboarding state to localStorage:', e);
  }
};

/**
 * Clear onboarding state from localStorage
 */
const clearStateFromStorage = (userType: 'couple' | 'gift_giver'): void => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(getStorageKey(userType));
  } catch (e) {
    console.warn('Failed to clear onboarding state from localStorage:', e);
  }
};

const OnboardingContext = createContext<OnboardingContextType | undefined>(
  undefined
);

interface OnboardingProviderProps {
  children: ReactNode;
  userType?: 'couple' | 'gift_giver';
  skipAuth?: boolean;
  existingUserId?: string;
}

/**
 * Onboarding Provider component to manage questionnaire state
 *
 * Args:
 *   children (ReactNode): Child components
 *   userType (string): Type of user - 'couple' or 'gift_giver'
 */
export function OnboardingProvider({ children, userType = 'couple', skipAuth = false, existingUserId }: OnboardingProviderProps) {
  // Initialize with default state first (to avoid hydration mismatch)
  const [state, setState] = useState<OnboardingState>(() => getInitialState(userType));
  const [isHydrated, setIsHydrated] = useState(false);
  const router = useRouter();

  // Load from localStorage after hydration (client-side only)
  useEffect(() => {
    const saved = loadStateFromStorage(userType);
    if (saved && !saved.isComplete) {
      // Restore saved state, but ensure totalSteps matches current userType
      setState({
        ...saved,
        totalSteps: userType === 'couple' ? TOTAL_STEPS_COUPLE : TOTAL_STEPS_GIFT,
      });
    }
    setIsHydrated(true);
  }, [userType]);

  // Save state to localStorage whenever it changes (only after hydration)
  useEffect(() => {
    if (isHydrated && !state.isComplete) {
      saveStateToStorage(userType, state);
    }
  }, [state, userType, isHydrated]);

  /**
   * Navigate to the next step
   */
  const nextStep = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentStep: Math.min(prev.currentStep + 1, prev.totalSteps),
    }));
  }, []);

  /**
   * Navigate to the previous step
   */
  const previousStep = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentStep: Math.max(prev.currentStep - 1, 1),
    }));
  }, []);

  /**
   * Update data for a specific step
   *
   * Args:
   *   stepId (number): The step number
   *   data (Record<string, any>): The data to store for this step
   */
  const updateStepData = useCallback(
    (stepId: number, data: Record<string, any>) => {
      return new Promise<void>((resolve) => {
        setState((prev) => ({
          ...prev,
          answers: {
            ...prev.answers,
            [`step${stepId}`]: data,
          },
        }));
        // Use setTimeout to ensure state update has completed
        setTimeout(resolve, 0);
      });
    },
    []
  );

  /**
   * Update selected product tier
   */
  const updateProductTier = useCallback((tierId: string) => {
    setState((prev) => ({
      ...prev,
      selectedProductTier: tierId,
    }));
  }, []);

  /**
   * Generate Gumroad payment link and redirect
   * Account creation will happen after payment confirmation (webhook)
   * @param email - Email for account creation (stored in metadata)
   * @param password - Password for account creation (stored in metadata, will be used after payment)
   * @param directData - Optional data to merge with state.answers
   */
  const completeOnboarding = useCallback(
    async (email?: string, password?: string, directData?: Record<string, any>) => {
      try {
        if (!state.selectedProductTier) {
          throw new Error("Please select a product tier to continue");
        }

        let finalEmail = email;
          let finalPassword = password;
          
        // Get email/password from state if not provided
          if (!finalEmail || !finalPassword) {
          const emailStep = userType === 'couple' ? state.answers.step5 : state.answers.step4;
            finalEmail = finalEmail || emailStep?.email;
            finalPassword = finalPassword || emailStep?.password;
          }

          if (!finalEmail || !finalPassword) {
          throw new Error("Email and password are required to complete purchase");
        }

        // Merge directData with state.answers
        const mergedAnswers = directData 
          ? { ...state.answers, ...directData }
          : state.answers;

        // Extract couple names from answers
        // For couples: step3 has couple info, step4 has celebration details
        // For gift givers: step3 has gift giver + couple info
        let coupleNames: { brideFirstName?: string; brideLastName?: string; partnerFirstName?: string; partnerLastName?: string } | undefined;
        
        if (userType === 'couple') {
          const coupleInfo = mergedAnswers.step3 as {
            brideFirstName?: string;
            brideLastName?: string;
            partnerFirstName?: string;
            partnerLastName?: string;
          } | undefined;
          
          if (coupleInfo) {
            coupleNames = {
              brideFirstName: coupleInfo.brideFirstName,
              brideLastName: coupleInfo.brideLastName,
              partnerFirstName: coupleInfo.partnerFirstName,
              partnerLastName: coupleInfo.partnerLastName,
            };
          }
        } else {
          const giftInfo = mergedAnswers.step3 as {
            firstName?: string;
            partnerFirstName?: string;
          } | undefined;
          
          if (giftInfo) {
            coupleNames = {
              brideFirstName: giftInfo.firstName,
              partnerFirstName: giftInfo.partnerFirstName,
            };
          }
        }

        // Generate Gumroad link with metadata
        const gumroadLink = generateGumroadLink(state.selectedProductTier, {
          email: finalEmail,
            userType: userType,
          coupleNames: coupleNames,
          giftGiverName: userType === 'gift_giver' ? (mergedAnswers.step3 as { giftGiverName?: string } | undefined)?.giftGiverName : undefined,
          weddingDate: userType === 'couple' ? (mergedAnswers.step3 as { weddingDate?: string } | undefined)?.weddingDate : undefined,
          guestCount: userType === 'couple' ? (mergedAnswers.step4 as { guestCount?: string } | undefined)?.guestCount : undefined,
          planningStage: userType === 'couple' ? (mergedAnswers.step1 as { planningStage?: string } | undefined)?.planningStage : undefined,
          timeline: userType === 'gift_giver' ? (mergedAnswers.step1 as { timeline?: string } | undefined)?.timeline : undefined,
          relationship: userType === 'gift_giver' ? (mergedAnswers.step3 as { relationship?: string } | undefined)?.relationship : undefined,
        });

        // Store onboarding data temporarily (for webhook to use later)
        // TODO: Store in database or session storage for webhook retrieval
        // For now, metadata is passed in URL params

        // Clear localStorage before redirecting
        clearStateFromStorage(userType);

        // Redirect to Gumroad
        window.location.href = gumroadLink;

      } catch (err) {
        console.error("Onboarding completion error:", err);
        alert(err instanceof Error ? err.message : "Failed to complete purchase");
        throw err;
      }
    },
    [state.answers, state.selectedProductTier, userType]
  );

  /**
   * Reset onboarding state to initial values
   */
  const resetOnboarding = useCallback(() => {
    clearStateFromStorage(userType);
    setState(getInitialState(userType));
  }, [userType]);

  const value: OnboardingContextType = {
    state,
    nextStep,
    previousStep,
    updateStepData,
    updateProductTier,
    completeOnboarding,
    resetOnboarding,
  };

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
}

/**
 * Hook to use onboarding context
 *
 * Returns:
 *   OnboardingContextType: Onboarding context with state and methods
 */
export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error("useOnboarding must be used within an OnboardingProvider");
  }
  return context;
}
