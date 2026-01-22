/**
 * Onboarding types and interfaces
 * Defines the structure for the multi-step onboarding questionnaire
 */

export interface OnboardingStep {
  id: number;
  title: string;
  description?: string;
}

export interface OnboardingAnswer {
  stepId: number;
  data: Record<string, any>;
}

export interface OnboardingData {
  // Step 1: Planning stage (couples) or Timeline (gift givers)
  step1?: {
    planningStage?: string; // For couples
    timeline?: string; // For gift givers
  };
  // Step 2: Product selection is stored in selectedProductTier, not in answers
  // Step 3: Couple information (couples) or Gift giver + couple info (gift givers)
  step3?: {
    // Couple onboarding fields
    brideFirstName?: string;
    brideLastName?: string;
    partnerFirstName?: string;
    partnerLastName?: string;
    weddingDate?: string;
    dateUndecided?: boolean;
    // Gift giver fields
    giftGiverName?: string;
    firstName?: string;
    relationship?: string;
  };
  // Step 4: Guest count (couples) or email/password (gift givers)
  step4?: {
    guestCount?: string; // For couples
    email?: string; // For gift givers
    password?: string; // For gift givers
  };
  // Step 5: Email/password (couples only)
  step5?: {
    email?: string;
    password?: string;
  };
}

export interface OnboardingState {
  currentStep: number;
  totalSteps: number;
  answers: OnboardingData;
  selectedProductTier: string | null;
  isComplete: boolean;
}

export interface OnboardingContextType {
  state: OnboardingState;
  nextStep: () => void;
  previousStep: () => void;
  updateStepData: (stepId: number, data: Record<string, any>) => Promise<void>;
  updateProductTier: (tierId: string) => void;
  completeOnboarding: (email?: string, password?: string, directData?: Record<string, any>) => Promise<void>;
  resetOnboarding: () => void;
}