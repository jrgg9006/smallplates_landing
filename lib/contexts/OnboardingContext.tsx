"use client";

import React from "react";
import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
} from "react";
import { useRouter } from "next/navigation";
import { signUpWithEmail } from "@/lib/supabase/auth";
import { saveOnboardingData } from "@/lib/supabase/onboarding";
import {
  OnboardingState,
  OnboardingContextType,
  OnboardingData,
} from "@/lib/types/onboarding";

const TOTAL_STEPS = 3;

const initialState: OnboardingState = {
  currentStep: 1,
  totalSteps: TOTAL_STEPS,
  answers: {},
  isComplete: false,
};

const OnboardingContext = createContext<OnboardingContextType | undefined>(
  undefined
);

/**
 * Onboarding Provider component to manage questionnaire state
 *
 * Args:
 *   children (ReactNode): Child components
 */
export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<OnboardingState>(initialState);
  const router = useRouter();

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
   *   stepId (number): The step number (1, 2, or 3)
   *   data (Record<string, any>): The data to store for this step
   */
  const updateStepData = useCallback(
    (stepId: number, data: Record<string, any>) => {
      setState((prev) => ({
        ...prev,
        answers: {
          ...prev.answers,
          [`step${stepId}`]: data,
        },
      }));
    },
    []
  );

  /**
   * Complete the onboarding process and create user account
   */
  const completeOnboarding = useCallback(
    async () => {
      try {
        const step2Data = state.answers.step2;
        if (!step2Data?.email) {
          throw new Error("Email is required to complete onboarding");
        }

        // For now, create account without password (they can set it later)
        // TODO: Integrate with Stripe and create account after payment
        const { user, error } = await signUpWithEmail(step2Data.email, "tempPassword123!");

        if (error) {
          throw new Error(error);
        }

        // Save onboarding answers to database
        const saveResult = await saveOnboardingData(user.id, state.answers);
        
        if (saveResult.error) {
          console.error('Failed to save onboarding data:', saveResult.error);
          // Continue anyway - don't block the user flow
        }

        // Mark onboarding as complete
        setState((prev) => ({
          ...prev,
          isComplete: true,
        }));

        // Redirect to profile
        router.push("/profile");
      } catch (err) {
        console.error("Onboarding completion error:", err);
        throw err;
      }
    },
    [router, state.answers]
  );

  /**
   * Reset onboarding state to initial values
   */
  const resetOnboarding = useCallback(() => {
    setState(initialState);
  }, []);

  const value: OnboardingContextType = {
    state,
    nextStep,
    previousStep,
    updateStepData,
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
