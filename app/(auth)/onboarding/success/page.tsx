"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import OnboardingStep from "@/components/onboarding/OnboardingStep";
import { CheckCircle } from "lucide-react";

function SuccessContent() {
  const searchParams = useSearchParams();
  // Reason: Stripe Elements redirect includes payment_intent and redirect_status params
  const redirectStatus = searchParams.get("redirect_status");
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    // Stripe Elements redirects with ?payment_intent=...&redirect_status=succeeded
    if (redirectStatus === "succeeded") {
      setVerified(true);
    }

    // Clear localStorage onboarding state
    try {
      localStorage.removeItem("onboarding_state_couple");
      localStorage.removeItem("onboarding_state_gift_giver");
    } catch {
      // Ignore
    }
  }, [redirectStatus]);

  if (!verified) {
    return (
      <OnboardingStep
        stepNumber={4}
        totalSteps={4}
        title="Confirming your payment..."
        imageUrl="/images/onboarding/onboarding_lemon.png"
        imageAlt="Loading"
        hideProgress={true}
      >
        <div className="max-w-sm mx-auto text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-honey mx-auto mb-8"></div>
          <p className="text-brand-charcoal/60 font-light">
            If this takes too long, reach out at{" "}
            <a
              href="mailto:team@smallplatesandcompany.com"
              className="text-brand-charcoal/50 hover:text-brand-honey transition-colors"
            >
              team@smallplatesandcompany.com
            </a>
          </p>
        </div>
      </OnboardingStep>
    );
  }

  return (
    <OnboardingStep
      stepNumber={4}
      totalSteps={4}
      title="It's happening."
      imageUrl="/images/onboarding/onboarding_lemon.png"
      imageAlt="Success"
      hideProgress={true}
    >
      <div className="max-w-sm mx-auto text-center">
        {/* Success Icon */}
        <div className="w-16 h-16 mx-auto mb-12 rounded-full bg-brand-honey/10 flex items-center justify-center">
          <CheckCircle className="w-8 h-8 text-brand-honey" />
        </div>

        {/* Email notification */}
        <p className="text-brand-charcoal/60 font-light mb-4">
          Check your email for a link to access your dashboard.
        </p>

        {/* Tagline */}
        <p className="text-brand-honey font-medium text-lg mb-16">
          You just started something real.
        </p>

        {/* Contact */}
        <p className="text-sm text-brand-charcoal/40 font-light">
          Questions?{" "}
          <a
            href="mailto:team@smallplatesandcompany.com"
            className="text-brand-charcoal/50 hover:text-brand-honey transition-colors"
          >
            team@smallplatesandcompany.com
          </a>
        </p>
      </div>
    </OnboardingStep>
  );
}

export default function SuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-honey"></div>
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
