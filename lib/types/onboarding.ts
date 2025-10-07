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
  step1?: Record<string, any>;
  step2?: Record<string, any>;
  step3?: Record<string, any>;
  email?: string;
  password?: string;
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
  completeOnboarding: (email: string, password: string) => Promise<void>;
  resetOnboarding: () => void;
}
