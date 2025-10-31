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
import { createSupabaseClient } from "@/lib/supabase/client";
import {
  OnboardingState,
  OnboardingContextType,
} from "@/lib/types/onboarding";
import { FEATURES, ROUTES } from "@/lib/config/features";

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
        const step1Data = state.answers.step1;

        if (!step2Data?.email) {
          throw new Error("Email is required to complete onboarding");
        }

        // WAITLIST MODE: Just save data locally (no redirect, user closes modal manually)
        if (FEATURES.WAITLIST_MODE) {
          console.log('📋 Waitlist mode: Saving user data for future processing');
          console.log('User data:', {
            email: step2Data.email,
            firstName: step2Data.firstName,
            lastName: step2Data.lastName,
            recipeCount: step1Data?.recipeCount,
          });
          
          // TODO: Send to waitlist service/database when implemented
          // For now, just mark as complete (user stays on success screen)
          
          setState(prev => ({ ...prev, isComplete: true }));
          console.log('✅ Waitlist signup complete - user can close modal');
          return;
        }

        // FULL PAYMENT FLOW (preserved for when WAITLIST_MODE = false)
        const supabase = createSupabaseClient();
        const redirectUrl = typeof window !== 'undefined'
          ? `${window.location.origin}/reset-password`
          : `http://localhost:3000/reset-password`;

        // Zero-friction flow (like Notion, Linear, Vercel):
        // 1. Create user with temp password
        // 2. User stays LOGGED IN (no signOut)
        // 3. Create profile
        // 4. Send password setup email (user can change it later)
        // 5. Redirect to profile immediately

        console.log('🚀 Starting zero-friction onboarding...');

        // Step 1: Create user with signUp (user will be auto-logged in)
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: step2Data.email,
          password: `temp_${Math.random().toString(36).substring(2, 15)}`, // Random temp password
          options: {
            emailRedirectTo: redirectUrl,
            data: {
              firstName: step2Data.firstName,
              lastName: step2Data.lastName,
            }
          }
        });

        if (signUpError || !signUpData.user) {
          throw new Error(signUpError?.message || "Failed to create user account");
        }

        console.log('✅ User created and logged in:', signUpData.user.id);

        // Step 2: Create profile using API
        const response = await fetch('/api/create-profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: signUpData.user.id,
            userData: { ...step2Data, recipeCount: step1Data?.recipeCount || '40-or-less' }
          })
        });

        if (!response.ok) {
          console.error('⚠️ Failed to create profile, but user was created');
        } else {
          console.log('✅ Profile created successfully');
        }

        // Step 3: Send password setup email (user can change password later)
        // This runs in the background, doesn't block the user experience
        console.log('📧 Sending password setup email...');
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(
          step2Data.email,
          { redirectTo: redirectUrl }
        );

        if (resetError) {
          console.error('⚠️ Failed to send password setup email:', resetError);
          // Don't throw error - user is already logged in and can use the app
        } else {
          console.log('✅ Password setup email sent');
        }

        setState(prev => ({ ...prev, isComplete: true }));

        // Step 4: Redirect to profile immediately (user is already logged in!)
        console.log('🎉 Redirecting to profile...');
        router.push(ROUTES.AFTER_ONBOARDING);

      } catch (err) {
        console.error("Onboarding completion error:", err);
        alert(err instanceof Error ? err.message : "Failed to complete onboarding");
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
