"use client";

import Image from "next/image";
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

// Reason: ink illustration shown in the desktop right panel when its occasion
// is selected. All render stacked with opacity toggled so the cross-fade is
// smooth and every image is preloaded after first paint.
const OCCASION_IMAGES: Record<string, { src: string; alt: string }> = {
  bridal_shower: {
    src: "/images/onboarding/occasions/occasion-bridal-shower.png",
    alt: "Ink drawing of a bride-to-be sash",
  },
  wedding: {
    src: "/images/onboarding/occasions/occasion-wedding.png",
    alt: "Ink drawing of two wedding rings",
  },
  anniversary: {
    src: "/images/onboarding/occasions/occasion-anniversary.png",
    alt: "Ink drawing of two champagne glasses toasting",
  },
  birthday: {
    src: "/images/onboarding/occasions/occasion-birthday.png",
    alt: "Ink drawing of a birthday cake with candles",
  },
  unsure: {
    src: "/images/onboarding/occasions/occasion-other.png",
    alt: "Ink drawing of a gift box with a bow",
  },
};

function OccasionIllustration({ selected }: { selected: OccasionType }) {
  // Reason: fixed overlay instead of the shell's right panel — the panel
  // reserves 40% of the width and squeezes the selection cards. Floating in
  // the page's natural whitespace keeps the layout identical to no-image.
  // lg+ only: with the card grid capped at max-w-lg, the right 40% is clear
  // whitespace from 1024px up, so the overlay never covers a card.
  return (
    <div
      aria-hidden="true"
      className="hidden lg:flex fixed right-0 top-16 w-2/5 h-[calc(100vh-4rem)] items-center justify-center pointer-events-none z-0"
    >
      <div className="relative w-72 h-72">
        {Object.entries(OCCASION_IMAGES).map(([value, img]) => (
          <Image
            key={value}
            src={img.src}
            alt=""
            fill
            sizes="288px"
            quality={95}
            className={`object-contain transition-all duration-500 ease-out ${
              selected === value ? "opacity-100 scale-100" : "opacity-0 scale-90"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

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
      <OccasionIllustration selected={occasion} />
      {/* Reason: 3 columns by default (original layout); below xl the grid
          narrows to 2 columns so the fixed illustration overlay never sits
          on top of the third card. */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 max-w-lg xl:max-w-none">
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
