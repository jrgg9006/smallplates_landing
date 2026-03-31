"use client";

import React, { useEffect } from "react";
import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
} from "react";
import {
  OnboardingState,
  OnboardingContextType,
  ShippingCountry,
} from "@/lib/types/onboarding";

// Reason: Bump this when the step order changes to invalidate stale localStorage
const STATE_VERSION = 4;

const TOTAL_STEPS_COUPLE = 4;
// Reason: Couple flow is now 1. Date → 2. Copies → 3. Payment → 4. Setup (same as gift)
const TOTAL_STEPS_GIFT = 4;

const getInitialState = (userType: 'couple' | 'gift_giver'): OnboardingState => ({
  currentStep: 1,
  totalSteps: userType === 'couple' ? TOTAL_STEPS_COUPLE : TOTAL_STEPS_GIFT,
  answers: {},
  selectedProductTier: null,
  bookQuantity: 1,
  shippingCountry: null,
  isComplete: false,
  paymentIntentId: null,
  clientSecret: null,
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
      // Validate structure and version — discard stale state from old step layouts
      if (parsed && typeof parsed === 'object' && 'currentStep' in parsed && parsed._version === STATE_VERSION) {
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
    localStorage.setItem(getStorageKey(userType), JSON.stringify({ ...state, _version: STATE_VERSION }));
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

  // Load from localStorage after hydration (client-side only)
  // Reason: Skip loading saved state for add-book mode (skipAuth) - always start fresh
  useEffect(() => {
    if (!skipAuth) {
      const saved = loadStateFromStorage(userType);
      if (saved && !saved.isComplete) {
        const totalSteps = userType === 'couple' ? TOTAL_STEPS_COUPLE : TOTAL_STEPS_GIFT;
        // Reason: If payment already completed and user was past step 3, resume there.
        // Don't force-jump if user was still on steps 1-3 with a stale paymentIntentId.
        const restoredStep = saved.currentStep;

        setState({
          ...saved,
          totalSteps,
          currentStep: restoredStep,
          // Reason: Migrate old localStorage state that lacks new fields
          bookQuantity: saved.bookQuantity ?? 1,
          shippingCountry: saved.shippingCountry ?? null,
          paymentIntentId: saved.paymentIntentId ?? null,
          clientSecret: saved.clientSecret ?? null,
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
   * Store Stripe payment intent info after creating a PI
   */
  const setPaymentInfo = useCallback((paymentIntentId: string, clientSecret: string) => {
    setState((prev) => ({
      ...prev,
      paymentIntentId,
      clientSecret,
    }));
  }, []);

  /**
   * Update book quantity and shipping country selection
   */
  const updateBookSelection = useCallback((quantity: number, country: ShippingCountry) => {
    setState((prev) => ({
      ...prev,
      bookQuantity: quantity,
      shippingCountry: country,
      // Reason: Keep selectedProductTier in sync with book selection
      selectedProductTier: 'the-book',
    }));
  }, []);

  /**
   * Legacy completeOnboarding — payment is now handled inline.
   * Kept for interface compatibility.
   */
  const completeOnboarding = useCallback(
    async () => {
      clearStateFromStorage(userType);
      setState(prev => ({ ...prev, isComplete: true }));
    },
    [userType]
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
    updateBookSelection,
    setPaymentInfo,
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
