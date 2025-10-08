import { ReactNode } from "react";
import { useRouter } from "next/navigation";

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
  const router = useRouter();

  return (
    <div className="w-full max-w-2xl mx-auto px-6 relative">
      {/* Close button */}
      <button
        onClick={() => router.push("/")}
        className="absolute -top-8 right-0 text-gray-500 hover:text-gray-700 transition-colors"
        aria-label="Close onboarding"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>

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
