"use client";

import { useRouter } from "next/navigation";
import { OnboardingShell } from "@/components/onboarding/OnboardingShell";

export default function WelcomePage() {
  const router = useRouter();

  return (
    <OnboardingShell
      title="How it works"
      onContinue={() => router.push("/onboarding/occasion")}
    >
      <div className="space-y-4 text-left">
        <p className="text-xl font-light text-gray-700 leading-relaxed">
          Collect recipes from your people and turn them into a real cookbook.
        </p>
        <p className="text-xl font-light text-gray-700 leading-relaxed">
          You send the invite, they submit their recipe. We design, print, and ship the book.
        </p>
      </div>
    </OnboardingShell>
  );
}
