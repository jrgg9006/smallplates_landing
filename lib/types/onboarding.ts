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
  step1?: {
    recipeCount: string;
  };
  step2?: {
    useCase: string;
  };
  step3?: {
    firstName: string;
    lastName: string;
    email: string;
    hasPartner?: boolean;
    partnerFirstName?: string;
    partnerLastName?: string;
  };
  step4?: {
    paymentComplete?: boolean;
    stripeSessionId?: string;
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
