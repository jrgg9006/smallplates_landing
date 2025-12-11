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
  // Couple onboarding
  step1?: {
    planningStage?: string;
    timeline?: string;
  };
  step2?: {
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
  step3?: {
    guestCount?: string;
    email?: string;
    password?: string;
  };
  step4?: {
    email?: string;
    password?: string;
  };
}

export interface OnboardingState {
  currentStep: number;
  totalSteps: number;
  answers: OnboardingData;
  isComplete: boolean;
}

export interface OnboardingContextType {
  state: OnboardingState;
  nextStep: () => void;
  previousStep: () => void;
  updateStepData: (stepId: number, data: Record<string, any>) => void;
  completeOnboarding: () => Promise<void>;
  resetOnboarding: () => void;
}