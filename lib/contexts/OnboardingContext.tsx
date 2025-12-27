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

const TOTAL_STEPS = 4;

const initialState: OnboardingState = {
  currentStep: 1,
  totalSteps: TOTAL_STEPS,
  answers: {},
  isComplete: false,
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
   * Complete the onboarding process and create user account
   * When skipAuth=true, uses existingUserId instead of creating a new account
   * @param email - Optional email for account creation
   * @param password - Optional password for account creation
   * @param directData - Optional data to merge with state.answers (useful when state hasn't updated yet)
   */
  const completeOnboarding = useCallback(
    async (email?: string, password?: string, directData?: Record<string, any>) => {
      try {
        let userId: string;
        let finalEmail = email;

        if (skipAuth && existingUserId) {
          // User already authenticated - skip signup
          // console.log removed for production
          userId = existingUserId;
          
          // Get email from current session if not provided
          if (!finalEmail) {
            const supabase = createSupabaseClient();
            const { data: { user } } = await supabase.auth.getUser();
            finalEmail = user?.email;
          }
        } else {
          // Normal flow - create new account
          let finalPassword = password;
          
          if (!finalEmail || !finalPassword) {
            // Fallback to state if parameters not provided
            const emailStep = userType === 'couple' ? state.answers.step4 : state.answers.step3;
            finalEmail = finalEmail || emailStep?.email;
            finalPassword = finalPassword || emailStep?.password;
          }

          // console.log removed for production
          // console.log removed for production
          // console.log removed for production
          // console.log removed for production
          // console.log removed for production
          // console.log removed for production
          // console.log removed for production

          if (!finalEmail || !finalPassword) {
            throw new Error("Email and password are required to complete onboarding");
          }

          const supabase = createSupabaseClient();

          // console.log removed for production

          // Create user with signUp (user will be auto-logged in)
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: finalEmail,
            password: finalPassword,
            options: {
              data: {
                user_type: userType
              }
            }
          });

          if (signUpError || !signUpData.user) {
            throw new Error(signUpError?.message || "Failed to create user account");
          }

          // console.log removed for production
          userId = signUpData.user.id;
        }

        // Reason: Merge directData with state.answers to handle async state updates
        const mergedAnswers = directData 
          ? { ...state.answers, ...directData }
          : state.answers;

        // Create profile/group using API
        const response = await fetch('/api/v1/create-wedding-profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: userId,
            userData: mergedAnswers,
            userType: userType,
            userEmail: finalEmail,
            isAdditionalBook: skipAuth // Reason: tells API this is an additional book, not first-time setup
          })
        });

        const responseData = await response.json();

        if (!response.ok) {
          console.error('⚠️ Failed to create profile/book');
          throw new Error(responseData.error || 'Failed to create profile');
        } else {
          // console.log removed for production
        }

        // Send verification email only for new users (not skipAuth)
        if (!skipAuth && responseData.data?.emailVerificationToken) {
          try {
            const emailResponse = await fetch('/api/v1/send-verification-email', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email: finalEmail,
                token: responseData.data.emailVerificationToken,
                userType: userType,
                userName: responseData.data.profile?.full_name
              })
            });

            if (!emailResponse.ok) {
              console.error('⚠️ Failed to send verification email, but profile was created');
            } else {
              // console.log removed for production
            }
          } catch (emailError) {
            console.error('Error sending verification email:', emailError);
          }
        }

        setState(prev => ({ ...prev, isComplete: true }));

        // Redirect to profile
        // console.log removed for production
        router.push("/profile/groups");

      } catch (err) {
        console.error("Onboarding completion error:", err);
        alert(err instanceof Error ? err.message : "Failed to complete onboarding");
      }
    },
    [router, state.answers, userType, skipAuth, existingUserId]
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
