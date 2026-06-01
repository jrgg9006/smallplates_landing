"use client";

import { useRouter } from "next/navigation";
import { OnboardingShell } from "@/components/onboarding/OnboardingShell";
import { SelectionCard } from "@/components/onboarding/SelectionCard";
import { useOnboardingState, type OccasionType } from "@/components/onboarding/onboardingState";

const OCCASIONS: { value: OccasionType; label: string }[] = [
  { value: "bridal_shower", label: "Bridal shower" },
  { value: "wedding", label: "Wedding" },
  { value: "anniversary", label: "Anniversary" },
  { value: "birthday", label: "Birthday" },
  { value: "unsure", label: "Other" },
];

export default function OccasionPage() {
  const router = useRouter();
  const occasion = useOnboardingState((s) => s.occasion);
  const setOccasion = useOnboardingState((s) => s.setOccasion);

  return (
    <OnboardingShell
      title="What's the occasion?"
      imageUrl=""
      backHref="/onboarding/welcome"
      onContinue={() => router.push("/onboarding/book-date")}
      continueDisabled={!occasion}
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {OCCASIONS.map((o) => (
          <SelectionCard
            key={o.value!}
            value={o.value!}
            label={o.label}
            isSelected={occasion === o.value}
            onClick={() => setOccasion(o.value)}
          />
        ))}
      </div>
    </OnboardingShell>
  );
}
