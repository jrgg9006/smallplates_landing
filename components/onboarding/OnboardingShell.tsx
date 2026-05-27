import Link from "next/link";
import Image from "next/image";
import { ReactNode } from "react";

interface OnboardingShellProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  imageUrl?: string;
  imageAlt?: string;
  rightContent?: ReactNode;
  onContinue?: () => void | Promise<void>;
  continueLabel?: string;
  continueDisabled?: boolean;
  skipHref?: string;
  skipLabel?: string;
  backHref?: string;
}

export function OnboardingShell({
  title,
  subtitle,
  children,
  imageUrl = "/images/onboarding/onboarding_lemon.png",
  imageAlt = "Small Plates onboarding",
  rightContent,
  onContinue,
  continueLabel = "Continue",
  continueDisabled,
  skipHref,
  skipLabel = "Skip for now",
  backHref,
}: OnboardingShellProps) {
  const hasRightPanel = !!imageUrl || !!rightContent;

  return (
    <div className="min-h-screen bg-white">
      {/* Right panel — image, custom content, or nothing */}
      {hasRightPanel && (
        <div className="hidden lg:block fixed right-0 top-16 w-2/5 h-[calc(100vh-4rem)] z-0">
          {rightContent ? (
            <div className="w-full h-full flex items-center justify-center -translate-x-20">
              {rightContent}
            </div>
          ) : imageUrl ? (
            <div className="w-full h-full bg-gray-100 p-2">
              <div className="relative w-full h-full rounded-2xl overflow-hidden bg-white shadow-sm">
                <Image
                  src={imageUrl}
                  alt={imageAlt}
                  fill
                  sizes="40vw"
                  className="object-cover"
                  priority
                />
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* Content — left 60% when right panel, full width when none */}
      <div className={`min-h-screen flex items-start pt-20 lg:pt-24 pb-8 overflow-y-auto ${hasRightPanel ? "lg:mr-[40%]" : ""}`}>
        <div className={`w-full px-8 lg:pl-28 lg:pr-12 ${hasRightPanel ? "max-w-2xl" : "max-w-4xl"}`}>
          {/* Title */}
          <div className="text-left mb-8">
            <h1 className="font-serif text-4xl md:text-[46px] leading-tight font-light text-gray-900 mb-2">
              {title}
            </h1>
            {subtitle && (
              <p className="text-base text-gray-500 mt-3">
                {subtitle}
              </p>
            )}
          </div>

          {/* Content */}
          <div className="mb-10">{children}</div>

          {/* Navigation */}
          <div className="flex items-center gap-6">
            {backHref && (
              <Link
                href={backHref}
                className="px-6 py-3 text-gray-600 font-medium hover:text-gray-900 transition-colors"
              >
                Back
              </Link>
            )}
            {onContinue && (
              <button
                onClick={onContinue}
                disabled={continueDisabled}
                className="btn btn-lg btn-honey px-14"
              >
                {continueLabel}
              </button>
            )}
            {skipHref && (
              <Link
                href={skipHref}
                className="text-sm text-gray-500 hover:text-gray-700 underline transition-colors"
              >
                {skipLabel}
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
