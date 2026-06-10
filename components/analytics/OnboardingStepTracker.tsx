"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { EVENTS, trackEvent, captureLandingUtms } from "@/lib/analytics";
import { useOnboardingState } from "@/components/onboarding/onboardingState";

// Reason: one onboarding_step_view per page is enough for GA4 funnels —
// "completed step N" ≡ "viewed step N+1". event-details is excluded (orphan page).
const STEP_MAP: Record<string, { num: number; name: string }> = {
  "/onboarding/welcome": { num: 1, name: "welcome" },
  "/onboarding/occasion": { num: 2, name: "occasion" },
  "/onboarding/book-date": { num: 3, name: "book_date" },
  "/onboarding/about-you": { num: 4, name: "about_you" },
  "/onboarding/co-organizer": { num: 5, name: "co_organizer" },
  "/onboarding/personalize-invite": { num: 6, name: "personalize_invite" },
  "/onboarding/invite-first": { num: 7, name: "invite_first" },
};

/**
 * Mounted once in app/onboarding/layout.tsx. Fires onboarding_step_view on
 * every step navigation (client-side push and hard refresh alike).
 */
export function OnboardingStepTracker() {
  const pathname = usePathname();
  const occasion = useOnboardingState((s) => s.occasion);

  useEffect(() => {
    const step = STEP_MAP[pathname];
    if (!step) return;
    trackEvent(EVENTS.ONBOARDING_STEP_VIEW, {
      flow: "free_tier",
      step_number: step.num,
      step_name: step.name,
      occasion: occasion ?? undefined,
    });
    // Reason: only re-fire on navigation, not when occasion changes mid-step.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return null;
}

/**
 * Mounted once in the root layout. Stores landing UTMs in sessionStorage so
 * they survive client-side navigation and can be attached to sign_up.
 */
export function UtmCapture() {
  useEffect(() => {
    captureLandingUtms();
  }, []);

  return null;
}
