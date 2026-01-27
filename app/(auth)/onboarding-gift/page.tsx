"use client";

import React, { Suspense } from "react";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { OnboardingProvider, useOnboarding } from "@/lib/contexts/OnboardingContext";
import { useAuth } from "@/lib/contexts/AuthContext";
import OnboardingStep from "@/components/onboarding/OnboardingStep";
import { SelectionCard } from "@/components/onboarding/SelectionCard";
import { CustomDropdown } from "@/components/onboarding/CustomDropdown";
import { ProductSelectionStep } from "@/components/onboarding/ProductSelectionStep";
import { CheckoutSummary } from "@/components/onboarding/CheckoutSummary";
import { CheckCircle } from "lucide-react";


/**
 * Step 1 Component - Wedding Timeline
 */
function Step1({ isAddBookMode = false }: { isAddBookMode?: boolean }) {
  const { nextStep, previousStep, updateStepData, state } = useOnboarding();
  
  // Initialize from saved state if available
  const savedData = state.answers.step1 as {
    timeline?: string;
  } | undefined;

  const [selectedTimeline, setSelectedTimeline] = useState<string>(savedData?.timeline || "");

  const timelineOptions = [
    { 
      value: "6-plus-months", 
      label: "6+ months away",
      subtext: "Perfect timing! We'll coordinate everything smoothly."
    },
    { 
      value: "3-6-months", 
      label: "3-6 months",
      subtext: "Ideal window. She'll have time to enjoy anticipating this."
    },
    { 
      value: "1-3-months", 
      label: "1-3 months", 
      subtext: "We've got you covered. This will be ready in plenty of time."
    },
    { 
      value: "less-than-month", 
      label: "Less than 1 month",
      subtext: "Let's make this happen quickly. Still time for something meaningful."
    },
    { 
      value: "already-happened", 
      label: "Already happened",
      subtext: "A beautiful keepsake for newlyweds. They'll love having this."
    },
  ];

  const handleSelection = (value: string) => {
    setSelectedTimeline(value);
    updateStepData(1, { timeline: value });
  };

  const handleContinue = () => {
    if (selectedTimeline) {
      nextStep();
    }
  };

  return (
    <OnboardingStep
      stepNumber={1}
      totalSteps={isAddBookMode ? 3 : 4}
      title="When's the big day?"
      imageUrl="/images/onboarding/onboarding_lemon.png"
      imageAlt="Wedding planning essentials"
    >
      <div className="max-w-lg mx-auto">
        {/* Question */}
        <div className="text-center mb-8">
          <h2 className="text-lg font-medium text-[#2D2D2D] mb-0">
            What&apos;s the timeline?
          </h2>
          <p className="text-[#2D2D2D]/60 font-light">
            We&apos;ll make sure everything arrives beautifully and on time.
          </p>
        </div>

        {/* Selection Cards */}
        {/* Reason: Subtext messages hidden for soft launch - may re-enable later */}
        <div className="space-y-3 mb-8">
          {timelineOptions.map((option) => (
            <SelectionCard
              key={option.value}
              value={option.value}
              label={option.label}
              isSelected={selectedTimeline === option.value}
              onClick={handleSelection}
            />
          ))}
        </div>
        
        {/* Gift Flow Link */}
        <div className="text-center">
          <a 
            href="/onboarding"
            className="text-sm text-[#2D2D2D]/50 hover:text-[#D4A854] transition-colors font-light"
          >
            Are you the couple getting married?
          </a>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between mt-8">
        <button
          type="button"
          onClick={() => window.history.back()}
          className="px-6 py-3 text-gray-600 font-medium hover:text-gray-900 transition-colors"
        >
          Back
        </button>
        <button
          type="button"
          onClick={handleContinue}
          disabled={!selectedTimeline}
          className={`px-8 py-3 rounded-xl font-semibold transition-colors ${
            selectedTimeline
              ? "bg-[#D4A854] text-white hover:bg-[#c49b4a]"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          Continue
        </button>
      </div>
    </OnboardingStep>
  );
}

/**
 * Step 2 Component - Product Selection
 */
function Step2Product({ isAddBookMode = false }: { isAddBookMode?: boolean }) {
  const { nextStep, previousStep, updateProductTier, state } = useOnboarding();

  const handleSelection = (tierId: string) => {
    updateProductTier(tierId);
  };

  const handleContinue = () => {
    if (state.selectedProductTier) {
      nextStep();
    }
  };

  return (
    <OnboardingStep
      stepNumber={2}
      totalSteps={isAddBookMode ? 3 : 4}
      title="Choose your collection."
      imageUrl="/images/onboarding/onboarding_lemon.png"
      imageAlt="Product selection"
    >
      <ProductSelectionStep
        selectedTierId={state.selectedProductTier}
        onSelect={handleSelection}
      />

      {/* Navigation */}
      <div className="flex justify-between mt-8">
        <button
          type="button"
          onClick={previousStep}
          className="px-6 py-3 text-gray-600 font-medium hover:text-gray-900 transition-colors"
        >
          Back
        </button>
        <button
          type="button"
          onClick={handleContinue}
          disabled={!state.selectedProductTier}
          className={`px-8 py-3 rounded-xl font-semibold transition-colors ${
            state.selectedProductTier
              ? "bg-[#D4A854] text-white hover:bg-[#c49b4a]"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          Continue
        </button>
      </div>
    </OnboardingStep>
  );
}

/**
 * Step 3 Component - Contact & Gift Setup
 */
function Step3({ isAddBookMode = false }: { isAddBookMode?: boolean }) {
  const { state, nextStep, previousStep, updateStepData, completeOnboarding } = useOnboarding();
  const { user } = useAuth();
  
  // Initialize from saved state if available
  const savedData = state.answers.step3 as {
    giftGiverName?: string;
    firstName?: string;
    partnerFirstName?: string;
    relationship?: string;
  } | undefined;

  const [giftGiverName, setGiftGiverName] = useState(savedData?.giftGiverName || "");
  const [firstName, setFirstName] = useState(savedData?.firstName || "");
  const [partnerFirstName, setPartnerFirstName] = useState(savedData?.partnerFirstName || "");
  const [relationship, setRelationship] = useState(savedData?.relationship || "");
  const [loading, setLoading] = useState(false);


  const handleContinue = async () => {
    // Reason: Skip giftGiverName validation when user is already authenticated
    if ((!isAddBookMode && !giftGiverName.trim()) || !firstName.trim() || !partnerFirstName.trim() || !relationship) {
      return;
    }

    // Build step3 data
    const step3Data = {
      ...(isAddBookMode ? {} : { giftGiverName: giftGiverName.trim() }),
      firstName: firstName.trim(),
      partnerFirstName: partnerFirstName.trim(),
      relationship: relationship
    };

    // Store gift info in context
    await updateStepData(3, step3Data);
    
    // Reason: If add-book mode, complete onboarding directly (skip Step4 account creation)
    if (isAddBookMode) {
      setLoading(true);
      try {
        // Pass step1 and step3 data directly to avoid async state timing issues
        // Use existing user's email since they're already authenticated
        await completeOnboarding(user?.email, undefined, {
          step1: state.answers.step1,
          step3: step3Data
        });
      } finally {
        setLoading(false);
      }
    } else {
      nextStep();
    }
  };

  // Reason: Skip giftGiverName validation when user is already authenticated
  const isFormValid = (isAddBookMode || giftGiverName.trim()) && firstName.trim() && partnerFirstName.trim() && relationship;

  return (
    <OnboardingStep
      stepNumber={3}
      totalSteps={isAddBookMode ? 3 : 4}
      title="Almost there."
      imageUrl="/images/onboarding/onboarding_lemon.png"
      imageAlt="Wedding planning essentials"
    >
      <div className="max-w-lg mx-auto">
        {/* Personalized Message */}
        <div className="text-center mb-8">
          <h2 className="text-lg font-medium text-[#2D2D2D] mb-0">
            Just a few details and you&apos;re all set.
          </h2>
          <p className="text-[#2D2D2D]/60 font-light">
            The hardest part is done.
          </p>
        </div>

        {/* Gift Setup Form */}
        <div className="space-y-6 mb-8">
              {/* Hide "Your name" for authenticated users creating additional books */}
              {!isAddBookMode && (
                <div>
                  <label htmlFor="giftGiverName" className="block text-sm font-medium text-[#2D2D2D] mb-1">
                    Your name
                  </label>
                  <input
                    id="giftGiverName"
                    type="text"
                    required
                    value={giftGiverName}
                    onChange={(e) => setGiftGiverName(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#D4A854] focus:border-transparent outline-none transition-all"
                    placeholder="Your name"
                  />
                </div>
              )}

              {/* Couple Names */}
              <div>
                <p className="block text-sm font-medium text-[#2D2D2D] mb-3">Who&apos;s getting married?</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="block text-xs font-medium text-[#2D2D2D]/70 mb-1">
                      First name
                    </label>
                  <input
                    id="firstName"
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#D4A854] focus:border-transparent outline-none transition-all"
                    placeholder="First name"
                  />
                </div>
                  <div>
                    <label htmlFor="partnerFirstName" className="block text-xs font-medium text-[#2D2D2D]/70 mb-1">
                      Partner&apos;s first name
                    </label>
                  <input
                    id="partnerFirstName"
                    type="text"
                    required
                    value={partnerFirstName}
                    onChange={(e) => setPartnerFirstName(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#D4A854] focus:border-transparent outline-none transition-all"
                    placeholder="Partner's name"
                  />
                  </div>
                </div>
              </div>

              {/* Relationship */}
              <CustomDropdown
                label="How do you know them?"
                placeholder="Select your relationship"
                value={relationship}
                onChange={setRelationship}
                options={[
                  { value: "friend", label: "I'm a friend" },
                  { value: "family", label: "I'm family" },
                  { value: "bridesmaid", label: "I'm a bridesmaid" },
                  { value: "wedding-planner", label: "I'm a wedding planner" },
                  { value: "other", label: "Other" }
                ]}
              />

            </div>

            {/* Confidence building message */}
            <div className="text-center text-sm text-[#2D2D2D]/50 font-light mb-8">
              More than a cookbook. A collection of love.
            </div>

            {/* Navigation */}
            <div className="flex justify-between items-center">
              <button
                type="button"
                onClick={previousStep}
                disabled={loading}
                className="px-6 py-3 text-gray-600 font-medium hover:text-gray-900 transition-colors disabled:opacity-50"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleContinue}
                disabled={!isFormValid || loading}
                className={`px-8 py-3 rounded-xl font-semibold transition-colors ${
                  isFormValid && !loading
                    ? "bg-[#D4A854] text-white hover:bg-[#c49b4a]"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                {loading ? (
                  <>
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block"></span>
                    Creating...
                  </>
                ) : isAddBookMode ? (
                  "Create Book"
                ) : (
                  "Continue"
                )}
              </button>
            </div>
      </div>
    </OnboardingStep>
  );
}

/**
 * Step 4 Component - Checkout & Account Creation
 * Reason: Password removed for soft launch - accounts created manually after Venmo payment
 */
function Step4() {
  const { previousStep, completeOnboarding, updateStepData, state } = useOnboarding();

  // Initialize from saved state if available
  const savedData = state.answers.step4 as {
    email?: string;
  } | undefined;

  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState(savedData?.email || "");
  const [emailError, setEmailError] = useState("");

  // Email validation
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailBlur = () => {
    if (email.trim() && !validateEmail(email.trim())) {
      setEmailError("Please enter a valid email address");
    } else {
      setEmailError("");
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (emailError) {
      setEmailError("");
    }
  };

  const handleCompletePurchase = async () => {
    if (!validateEmail(email.trim())) {
      return;
    }

    setLoading(true);

    try {
      // Store email in context
      await updateStepData(4, {
        email: email.trim(),
      });

      // Save to purchase_intents and show success screen
      await completeOnboarding(email.trim());

      // Note: completeOnboarding sets isComplete=true, which triggers success screen
      setLoading(false);
    } catch (err) {
      console.error("Error in handleCompletePurchase:", err);
      setLoading(false);
    }
  };

  const isFormValid = validateEmail(email.trim()) && !emailError;

  // Get gift giver and couple info from step 3 (gift giver info step)
  const step3Data = state.answers.step3 as {
    giftGiverName?: string;
    firstName?: string;
    partnerFirstName?: string;
    relationship?: string;
  } | undefined;
  
  const giftGiverName = step3Data?.giftGiverName;
  const coupleNames = step3Data
    ? {
        brideFirstName: step3Data.firstName,
        partnerFirstName: step3Data.partnerFirstName,
      }
    : undefined;

  return (
    <OnboardingStep
      stepNumber={4}
      totalSteps={4}
      title="Complete your purchase."
      imageUrl="/images/onboarding/onboarding_lemon.png"
      imageAlt="Checkout"
    >
      <div className="max-w-lg mx-auto">
        <CheckoutSummary
          selectedTierId={state.selectedProductTier}
          coupleNames={coupleNames}
          giftGiverName={giftGiverName}
          email={email}
          emailError={emailError}
          loading={loading}
          onEmailChange={handleEmailChange}
          onEmailBlur={handleEmailBlur}
          onCompletePurchase={handleCompletePurchase}
          isFormValid={isFormValid}
        />

        {/* Navigation */}
        <div className="flex justify-between items-center mt-8">
          <button
            type="button"
            onClick={previousStep}
            disabled={loading}
            className="px-6 py-3 text-gray-600 font-medium hover:text-gray-900 transition-colors disabled:opacity-50"
          >
            Back
          </button>
          <button
            type="button"
            onClick={handleCompletePurchase}
            disabled={!isFormValid || loading}
            className={`px-12 py-4 rounded-2xl text-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              isFormValid
                ? "bg-[#D4A854] text-white hover:bg-[#c49b4a]"
                : "bg-gray-300 text-gray-500"
            }`}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2 inline-block"></div>
                Processing...
              </>
            ) : (
              "Reserve Your Book"
            )}
          </button>
        </div>
      </div>
    </OnboardingStep>
  );
}

/**
 * Success Screen Component - Shown after completing soft launch checkout
 * Uses OnboardingStep for consistent styling and X button to close
 */
function SuccessScreen() {
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
        <div className="w-16 h-16 mx-auto mb-12 rounded-full bg-[#D4A854]/10 flex items-center justify-center">
          <CheckCircle className="w-8 h-8 text-[#D4A854]" />
        </div>

        {/* Single Line */}
        <p className="text-[#2D2D2D]/60 font-light mb-12">
          We&apos;ll be in touch within 24 hours.
        </p>

        {/* Tagline */}
        <p className="text-[#D4A854] font-medium text-lg mb-16">
          You&apos;re about to be the MVP of this wedding.
        </p>

        {/* Contact */}
        <p className="text-sm text-[#2D2D2D]/40 font-light">
          Questions?{" "}
          <a
            href="mailto:team@smallplatesandcompany.com"
            className="text-[#2D2D2D]/50 hover:text-[#D4A854] transition-colors"
          >
            team@smallplatesandcompany.com
          </a>
        </p>
      </div>
    </OnboardingStep>
  );
}

/**
 * Main Gift Onboarding Page Component
 * Manages the 4-step gift giver flow
 */
function GiftOnboardingContent({ isAddBookMode }: { isAddBookMode: boolean }) {
  const { state } = useOnboarding();

  // Show success screen when onboarding is complete
  if (state.isComplete) {
    return <SuccessScreen />;
  }

  return (
    <div className="min-h-screen bg-white">
      {state.currentStep === 1 && <Step1 isAddBookMode={isAddBookMode} />}
      {state.currentStep === 2 && <Step2Product isAddBookMode={isAddBookMode} />}
      {state.currentStep === 3 && <Step3 isAddBookMode={isAddBookMode} />}
      {state.currentStep === 4 && !isAddBookMode && <Step4 />}
    </div>
  );
}

/**
 * Inner component that uses useSearchParams (requires Suspense boundary)
 */
function GiftOnboardingPageInner() {
  const searchParams = useSearchParams();
  const { user, loading } = useAuth();

  // Reason: add-book mode only applies when user is already authenticated
  const wantsAddBookMode = searchParams.get('mode') === 'add-book';
  const isAddBookMode = wantsAddBookMode && !!user;

  // Reason: Wait for auth to load before rendering if user wants add-book mode
  // This prevents flash of wrong content and ensures user state is known
  if (wantsAddBookMode && loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D4A854]"></div>
      </div>
    );
  }

  return (
    <OnboardingProvider
      userType="gift_giver"
      skipAuth={isAddBookMode}
      existingUserId={user?.id}
    >
      <GiftOnboardingContent isAddBookMode={isAddBookMode} />
    </OnboardingProvider>
  );
}

/**
 * Page wrapper with Suspense boundary for useSearchParams
 */
export default function GiftOnboardingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center">Loading...</div>}>
      <GiftOnboardingPageInner />
    </Suspense>
  );
}