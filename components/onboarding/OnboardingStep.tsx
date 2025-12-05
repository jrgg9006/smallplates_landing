import { ReactNode, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface OnboardingStepProps {
  stepNumber: number;
  totalSteps: number;
  title: string;
  description?: string;
  children: ReactNode;
  imageUrl?: string;
  imageAlt?: string;
  imagePosition?: 'left' | 'right';
  imageCaption?: string;
}

/**
 * Reusable onboarding step component with optional side image
 * Displays progress indicator and step content
 *
 * Args:
 *   stepNumber (number): Current step number
 *   totalSteps (number): Total number of steps
 *   title (string): Step title
 *   description (string, optional): Step description
 *   children (ReactNode): Step content
 *   imageUrl (string, optional): URL for side image
 *   imageAlt (string, optional): Alt text for image
 *   imagePosition (string, optional): Position of image (left or right)
 *   imageCaption (string, optional): Caption overlay on image
 */
export default function OnboardingStep({
  stepNumber,
  totalSteps,
  title,
  description,
  children,
  imageUrl,
  imageAlt = "Onboarding step image",
  imagePosition = 'left',
  imageCaption,
}: OnboardingStepProps) {
  const router = useRouter();

  // Form content component - memoized to prevent unnecessary re-renders
  const FormContent = useMemo(() => (
    <div className="w-full px-6 lg:px-12 py-8 lg:py-12">
      {/* Close button - visible on mobile and desktop */}
      <button
        onClick={() => router.push("/")}
        className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors z-10"
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

      {/* Progress Indicator - Extra top margin on mobile to avoid X overlap */}
      <div className="mb-8 mt-16 lg:mt-8">
        <div className="flex items-center justify-center gap-2 mb-4">
          {Array.from({ length: totalSteps }, (_, index) => {
            const stepNum = index + 1;
            const isActive = stepNum === stepNumber;
            const isCompleted = stepNum < stepNumber;

            return (
              <div key={stepNum} className="flex items-center">
                <div
                  className={`w-8 h-8 lg:w-10 lg:h-10 rounded-full flex items-center justify-center text-xs lg:text-sm font-semibold transition-colors ${
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
                    className={`w-8 lg:w-12 h-0.5 mx-1 ${
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
  ), [stepNumber, totalSteps, title, description, children, router]);

  // Image component
  const ImageSection = () => (
    <div className="hidden lg:block relative bg-gray-100 h-screen p-2">
      {imageUrl ? (
        <div className="relative w-full h-full rounded-2xl overflow-hidden bg-white shadow-sm">
          <Image
            src={imageUrl}
            alt={imageAlt}
            fill
            sizes="40vw"
            className="object-contain"
            priority
          />
          {imageCaption && (
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end">
              <p className="text-white text-2xl lg:text-3xl font-serif p-8 lg:p-12">
                {imageCaption}
              </p>
            </div>
          )}
        </div>
      ) : (
        // Placeholder for image
        <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
          <div className="text-center">
            <div className="w-32 h-32 bg-gray-300 rounded-lg mx-auto mb-4"></div>
            <p className="text-gray-500">Image Placeholder</p>
          </div>
        </div>
      )}
    </div>
  );

  // If no image URL is provided, render the original single column layout
  if (!imageUrl) {
    return (
      <div className="w-full max-w-2xl mx-auto relative">
        {FormContent}
      </div>
    );
  }

  // Render two-column layout with image
  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {imagePosition === 'left' ? (
        <>
          {/* Image on left for desktop, hidden on mobile - 40% width */}
          <div className="lg:w-2/5 lg:flex-shrink-0 border-r border-gray-200">
            <ImageSection />
          </div>
          {/* Form content on right - 60% width */}
          <div className="lg:w-3/5 flex items-center justify-center relative">
            <div className="w-full max-w-lg">
              {FormContent}
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Form content on left - 60% width */}
          <div className="lg:w-3/5 flex items-center justify-center relative">
            <div className="w-full max-w-lg">
              {FormContent}
            </div>
          </div>
          {/* Image on right for desktop, hidden on mobile - 40% width */}
          <div className="lg:w-2/5 lg:flex-shrink-0 border-l border-gray-200">
            <ImageSection />
          </div>
        </>
      )}
    </div>
  );
}