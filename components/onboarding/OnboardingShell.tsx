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
  // Reason: small illustration shown beside the title (used on mobile, where the
  // desktop right panel is hidden). Pages opt in per-step.
  titleAccent?: ReactNode;
  onContinue?: () => void | Promise<void>;
  continueLabel?: string;
  continueDisabled?: boolean;
  skipHref?: string;
  skipLabel?: string;
  backHref?: string;
  // Reason: rendered inside the fixed bottom bar next to Continue so an error is
  // always visible at the point of action — never scrolled off-screen on mobile.
  error?: string;
}

export function OnboardingShell({
  title,
  subtitle,
  children,
  imageUrl = "/images/onboarding/onboarding_lemon.png",
  imageAlt = "Small Plates onboarding",
  rightContent,
  titleAccent,
  onContinue,
  continueLabel = "Continue",
  continueDisabled,
  skipHref,
  skipLabel = "Skip for now",
  backHref,
  error,
}: OnboardingShellProps) {
  const hasRightPanel = !!imageUrl || !!rightContent;

  return (
    <div className="min-h-[calc(100vh-3.5rem)] sm:min-h-[calc(100vh-4rem)] bg-white">
      {/* Right panel — desktop only */}
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

      {/* Content */}
      <div className={`min-h-[calc(100vh-3.5rem)] sm:min-h-[calc(100vh-4rem)] flex items-start pt-8 lg:pt-24 pb-32 lg:pb-8 overflow-y-auto ${hasRightPanel ? "lg:mr-[40%]" : ""}`}>
        <div className={`w-full px-5 sm:px-8 lg:pl-28 lg:pr-12 ${hasRightPanel ? "max-w-2xl" : "max-w-4xl"}`}>
          {/* Title */}
          <div className="mb-8 lg:mb-8 flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0 text-left">
              <h1 className="font-serif text-4xl lg:text-[46px] leading-tight font-light text-gray-900 mb-2">
                {title}
              </h1>
              {subtitle && (
                <p className="text-sm sm:text-base text-gray-500 mt-2 lg:mt-3">
                  {subtitle}
                </p>
              )}
            </div>
            {titleAccent && <div className="flex-none">{titleAccent}</div>}
          </div>

          {/* Content */}
          <div className="mb-8 lg:mb-10">{children}</div>

          {/* Navigation — fixed bottom bar on mobile/tablet so Continue is
              always visible; reverts to inline flow on desktop (lg+). Errors
              render inside this bar so they're always visible next to Continue. */}
          <div className="fixed inset-x-0 bottom-0 z-40 bg-white border-t border-gray-100 px-5 py-4 sm:px-8 lg:static lg:z-auto lg:bg-transparent lg:border-0 lg:px-0 lg:py-0">
            {error && (
              <p role="alert" className="text-sm text-red-600 mb-3 lg:mb-4">
                {error}
              </p>
            )}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-6">
            {onContinue && (
              <button
                onClick={onContinue}
                disabled={continueDisabled}
                className="btn btn-lg btn-honey px-14 w-full sm:w-auto order-1 sm:order-2"
              >
                {continueLabel}
              </button>
            )}
            <div className="flex items-center justify-center sm:contents order-2 sm:order-1">
              {backHref && (
                <Link
                  href={backHref}
                  className="px-4 sm:px-6 py-2 sm:py-3 text-sm font-normal text-gray-500 sm:text-base sm:font-medium sm:text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Back
                </Link>
              )}
              {skipHref && (
                <Link
                  href={skipHref}
                  className="text-sm text-gray-500 hover:text-gray-700 underline transition-colors sm:order-3"
                >
                  {skipLabel}
                </Link>
              )}
            </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
