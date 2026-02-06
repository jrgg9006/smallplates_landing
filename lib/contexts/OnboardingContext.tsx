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
// Reason: Gumroad redirect disabled for soft launch - using purchase_intents table instead
// import { generateGumroadLink } from "@/lib/payments/gumroad";
import { createGroup } from "@/lib/supabase/groups";

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

  // Reason: Store existingUserId for use in completeOnboarding to skip password requirement
  const existingUserIdRef = React.useRef(existingUserId);

  // Load from localStorage after hydration (client-side only)
  // Reason: Skip loading saved state for add-book mode (skipAuth) - always start fresh
  useEffect(() => {
    if (!skipAuth) {
      const saved = loadStateFromStorage(userType);
      if (saved && !saved.isComplete) {
        // Restore saved state, but ensure totalSteps matches current userType
        setState({
          ...saved,
          totalSteps: userType === 'couple' ? TOTAL_STEPS_COUPLE : TOTAL_STEPS_GIFT,
        });
      }
    }
    setIsHydrated(true);
  }, [userType, skipAuth]);

  // Save state to localStorage whenever it changes (only after hydration)
  // Reason: Don't save add-book mode state to localStorage to avoid overwriting normal flow progress
  useEffect(() => {
    if (isHydrated && !state.isComplete && !skipAuth) {
      saveStateToStorage(userType, state);
    }
  }, [state, userType, isHydrated, skipAuth]);

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

        // Reason: For existing users (add-book mode), skip the purchase_intents flow
        const isExistingUser = !!existingUserIdRef.current;

        // Get email from state if not provided
        // Reason: Password not required for soft launch - accounts created manually after payment
        if (!finalEmail) {
          const emailStep = userType === 'couple' ? state.answers.step5 : state.answers.step4;
          finalEmail = finalEmail || emailStep?.email;
        }

        if (!finalEmail) {
          throw new Error("Email is required to complete purchase");
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

        // Reason: For existing users (add-book mode), create book directly without payment
        // TODO: Re-enable Gumroad payment after setup is complete
        if (isExistingUser && existingUserIdRef.current) {
          // Create the group directly
          const groupName = coupleNames?.brideFirstName && coupleNames?.partnerFirstName
            ? `${coupleNames.brideFirstName} & ${coupleNames.partnerFirstName}`
            : "New Book";

          const step3Data = mergedAnswers.step3 as {
            relationship?: string;
            firstName?: string;
            partnerFirstName?: string;
          } | undefined;

          const { error: groupError } = await createGroup({
            name: groupName,
            description: `A wedding recipe book for ${coupleNames?.brideFirstName || ''} & ${coupleNames?.partnerFirstName || ''}`,
            couple_first_name: coupleNames?.brideFirstName,
            partner_first_name: coupleNames?.partnerFirstName,
            relationship_to_couple: step3Data?.relationship as "friend" | "family" | "bridesmaid" | "wedding-planner" | "other" | null | undefined,
            created_by: existingUserIdRef.current,
          });

          if (groupError) {
            throw new Error(groupError);
          }

          // Clear localStorage and redirect to the groups page
          clearStateFromStorage(userType);
          router.push('/profile/groups');
          return;
        }

        // Reason: Soft launch flow - save to purchase_intents table instead of Gumroad
        // Manual payment via Venmo, then manual account creation
        const supabase = createSupabaseClient();

        // Extract data for purchase_intents table
        const step3Data = mergedAnswers.step3 as {
          weddingDate?: string;
          dateUndecided?: boolean;
          giftGiverName?: string;
          relationship?: string;
        } | undefined;

        // Extract shipping destination from checkout step (step5 for couples, step4 for gift givers)
        const checkoutStepData = userType === 'couple'
          ? mergedAnswers.step5 as { shippingDestination?: string } | undefined
          : mergedAnswers.step4 as { shippingDestination?: string } | undefined;

        const purchaseIntentData = {
          email: finalEmail,
          selected_tier: state.selectedProductTier,
          user_type: userType,
          couple_first_name: coupleNames?.brideFirstName || null,
          couple_last_name: coupleNames?.brideLastName || null,
          partner_first_name: coupleNames?.partnerFirstName || null,
          partner_last_name: coupleNames?.partnerLastName || null,
          wedding_date: userType === 'couple' && step3Data?.weddingDate && step3Data.weddingDate !== 'undecided'
            ? step3Data.weddingDate
            : null,
          wedding_date_undecided: userType === 'couple' ? (step3Data?.dateUndecided || false) : false,
          planning_stage: userType === 'couple'
            ? (mergedAnswers.step1 as { planningStage?: string } | undefined)?.planningStage || null
            : null,
          guest_count: userType === 'couple'
            ? (mergedAnswers.step4 as { guestCount?: string } | undefined)?.guestCount || null
            : null,
          gift_giver_name: userType === 'gift_giver' ? step3Data?.giftGiverName || null : null,
          relationship: userType === 'gift_giver' ? step3Data?.relationship || null : null,
          timeline: userType === 'gift_giver'
            ? (mergedAnswers.step1 as { timeline?: string } | undefined)?.timeline || null
            : null,
          shipping_destination: checkoutStepData?.shippingDestination || null,
        };

        const { error: insertError } = await supabase
          .from('purchase_intents')
          .insert(purchaseIntentData);

        if (insertError) {
          console.error('Error saving purchase intent:', insertError);
          throw new Error('Failed to save your information. Please try again.');
        }

        // Clear localStorage and mark as complete to show success screen
        clearStateFromStorage(userType);
        setState(prev => ({ ...prev, isComplete: true }));

      } catch (err) {
        console.error("Onboarding completion error:", err);
        alert(err instanceof Error ? err.message : "Failed to complete purchase");
        throw err;
      }
    },
    [state.answers, state.selectedProductTier, userType, router]
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
