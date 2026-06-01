"use client";

import { useRouter } from "next/navigation";
import { OnboardingShell } from "@/components/onboarding/OnboardingShell";
import { HowItWorksStepper } from "@/components/onboarding/HowItWorksStepper";

export default function WelcomePage() {
  const router = useRouter();

  return (
    <OnboardingShell
      title="How it works"
      imageUrl=""
      rightContent={<HowItWorksStepper />}
      onContinue={() => router.push("/onboarding/occasion")}
    >
      <div className="text-left space-y-4">
        <p className="text-lg sm:text-xl font-light text-gray-700 leading-relaxed">
          Collect recipes from your people and turn them into a real cookbook.
        </p>
        {/* Mobile-only: the shell's right panel is hidden below lg, so the
            stepper is rendered here too for small screens. */}
        <HowItWorksStepper className="lg:hidden pt-4" />
      </div>
    </OnboardingShell>
  );
}
