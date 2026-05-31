"use client";

import { useRouter } from "next/navigation";
import { OnboardingShell } from "@/components/onboarding/OnboardingShell";

export default function WelcomePage() {
  const router = useRouter();

  return (
    <OnboardingShell
      title="How it works"
      imageUrl=""
      onContinue={() => router.push("/onboarding/occasion")}
    >
      <div className="text-left space-y-4">
        <p className="text-xl font-light text-gray-700 leading-relaxed">
          Collect recipes from your people and turn them into a real cookbook.
        </p>
        <p className="text-base font-light text-gray-500 leading-relaxed">
          You share a link. They send a recipe. We design, print, and ship the book.
        </p>
      </div>
    </OnboardingShell>
  );
}
