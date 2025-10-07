import { ReactNode } from "react";

interface OnboardingStepProps {
  stepNumber: number;
  totalSteps: number;
  title: string;
  description?: string;
  children: ReactNode;
}

/**
 * Reusable onboarding step component
 * Displays progress indicator and step content
 *
 * Args:
 *   stepNumber (number): Current step number
 *   totalSteps (number): Total number of steps
 *   title (string): Step title
 *   description (string, optional): Step description
 *   children (ReactNode): Step content
 */
export default function OnboardingStep({
  stepNumber,
  totalSteps,
  title,
  description,
  children,
}: OnboardingStepProps) {
  return (
    <div className="w-full max-w-2xl mx-auto px-6">
      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-center gap-2 mb-4">
          {Array.from({ length: totalSteps }, (_, index) => {
            const stepNum = index + 1;
            const isActive = stepNum === stepNumber;
            const isCompleted = stepNum < stepNumber;

            return (
              <div key={stepNum} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                    isActive
                      ? "bg-black text-white"
                      : isCompleted
                      ? "bg-gray-800 text-white"
                      : "bg-gray-200 text-gray-600"
                  }`}
                  aria-current={isActive ? "step" : undefined}
                >
                  {stepNum}
                </div>
                {stepNum < totalSteps && (
                  <div
                    className={`w-12 h-0.5 mx-1 ${
                      isCompleted ? "bg-gray-800" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
        <p className="text-center text-sm text-gray-600">
          Step {stepNumber} of {totalSteps}
        </p>
      </div>

      {/* Step Content */}
      <div className="text-center mb-8">
        <h1 className="font-serif text-3xl md:text-4xl font-semibold text-gray-900 mb-3">
          {title}
        </h1>
        {description && (
          <p className="text-lg text-gray-600 max-w-xl mx-auto">
            {description}
          </p>
        )}
      </div>

      {/* Step Form/Content Area */}
      <div className="mb-8">{children}</div>
    </div>
  );
}
