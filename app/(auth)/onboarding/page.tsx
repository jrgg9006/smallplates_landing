"use client";

import React from "react";
import { useState } from "react";
import { OnboardingProvider, useOnboarding } from "@/lib/contexts/OnboardingContext";
import OnboardingStep from "@/components/onboarding/OnboardingStep";
import { SelectionCard } from "@/components/onboarding/SelectionCard";
import { ProductSelectionStep } from "@/components/onboarding/ProductSelectionStep";
import { CheckoutSummary } from "@/components/onboarding/CheckoutSummary";
import { CheckCircle } from "lucide-react";

/**
 * Step 1 Component - Recipe Count Question
 */
function Step1() {
  const { nextStep, updateStepData, state } = useOnboarding();
  
  // Initialize from saved state if available
  const savedData = state.answers.step1 as {
    planningStage?: string;
  } | undefined;

  const [selectedPlanningStage, setSelectedPlanningStage] = useState<string>(savedData?.planningStage || "");

  const planningStageOptions = [
    { value: "just-engaged", label: "Just got engaged" },
    { value: "deep-planning", label: "Deep in planning mode" },
    { value: "almost-done", label: "Almost done (please help)" },
    { value: "just-exploring", label: "Just exploring for now" },
  ];

  const handleSelection = (value: string) => {
    setSelectedPlanningStage(value);
    // Store the answer in onboarding context
    updateStepData(1, { planningStage: value });
  };

  const handleContinue = () => {
    if (selectedPlanningStage) {
      nextStep();
    }
  };

  return (
    <OnboardingStep
      stepNumber={1}
      totalSteps={5}
      title={
        <>
          Congratulations!
          <br />
          Let&apos;s start with the basics.
        </>
      }
      imageUrl="/images/onboarding/onboarding_lemon.png"
      imageAlt="Wedding planning essentials"
    >
      <div className="max-w-lg mx-auto">
        {/* Question */}
        <div className="text-center mb-8 mt-6">
          <h2 className="text-base font-medium text-[#2D2D2D] mb-1">
            Where are you in the wedding planning?
          </h2>
          <p className="text-sm text-[#2D2D2D]/60 font-light">
            This helps us create the perfect timeline for your book.
          </p>
        </div>

        {/* Selection Cards */}
        <div className="space-y-3 mb-8">
          {planningStageOptions.map((option) => (
            <SelectionCard
              key={option.value}
              value={option.value}
              label={option.label}
              isSelected={selectedPlanningStage === option.value}
              onClick={handleSelection}
            />
          ))}
        </div>
        
        {/* Gift Flow Link */}
        <div className="text-center">
          <a 
            href="/onboarding-gift"
            className="text-sm text-[#2D2D2D]/50 hover:text-[#D4A854] transition-colors font-light underline underline-offset-2"
          >
            Giving this as a gift?
          </a>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between mt-6">
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
          disabled={!selectedPlanningStage}
          className={`px-8 py-3 rounded-xl font-semibold transition-colors ${
            selectedPlanningStage
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
function Step2() {
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
      totalSteps={5}
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
 * Step 3 Component - Couple Information
 */
function Step3() {
  const { nextStep, previousStep, updateStepData, state } = useOnboarding();
  
  // Initialize from saved state if available
  const savedData = state.answers.step3 as {
    brideFirstName?: string;
    brideLastName?: string;
    partnerFirstName?: string;
    partnerLastName?: string;
    weddingDate?: string;
    dateUndecided?: boolean;
  } | undefined;

  const [brideFirstName, setBrideFirstName] = useState<string>(savedData?.brideFirstName || "");
  const [brideLastName, setBrideLastName] = useState<string>(savedData?.brideLastName || "");
  const [partnerFirstName, setPartnerFirstName] = useState<string>(savedData?.partnerFirstName || "");
  const [partnerLastName, setPartnerLastName] = useState<string>(savedData?.partnerLastName || "");
  const [weddingDate, setWeddingDate] = useState<string>(savedData?.weddingDate && savedData.weddingDate !== "undecided" ? savedData.weddingDate : "");
  const [dateUndecided, setDateUndecided] = useState<boolean>(savedData?.dateUndecided || false);

  const handleContinue = () => {
    if (brideFirstName.trim() && brideLastName.trim() && partnerFirstName.trim() && partnerLastName.trim() && (weddingDate || dateUndecided)) {
      updateStepData(3, { 
        brideFirstName: brideFirstName.trim(),
        brideLastName: brideLastName.trim(),
        partnerFirstName: partnerFirstName.trim(),
        partnerLastName: partnerLastName.trim(),
        weddingDate: dateUndecided ? "undecided" : weddingDate,
        dateUndecided
      });
      nextStep();
    }
  };

  const isFormValid = brideFirstName.trim() && brideLastName.trim() && partnerFirstName.trim() && partnerLastName.trim() && (weddingDate || dateUndecided);

  return (
    <OnboardingStep
      stepNumber={3}
      totalSteps={5}
      title="Now for the good part."
      imageUrl="/images/onboarding/onboarding_lemon.png"
      imageAlt="Wedding planning essentials"
    >
      <div className="max-w-lg mx-auto">
        {/* Question */}
        <div className="text-center mb-8">
          <h2 className="text-base font-medium text-[#2D2D2D] mb-1">
            Who&apos;s getting married?
          </h2>
          <p className="text-sm text-[#2D2D2D]/60 font-light">
            Let&apos;s make this personal.
          </p>
        </div>

        {/* Form Fields */}
        <div className="space-y-6">
          {/* Your Names */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="brideFirstName" className="block text-sm font-medium text-[#2D2D2D] mb-1">
                First Name
              </label>
              <input
                id="brideFirstName"
                type="text"
                required
                value={brideFirstName}
                onChange={(e) => setBrideFirstName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#D4A854] focus:border-transparent outline-none transition-all"
                placeholder="Your first name"
              />
            </div>
            <div>
              <label htmlFor="brideLastName" className="block text-sm font-medium text-[#2D2D2D] mb-1">
                Last Name
              </label>
              <input
                id="brideLastName"
                type="text"
                required
                value={brideLastName}
                onChange={(e) => setBrideLastName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#D4A854] focus:border-transparent outline-none transition-all"
                placeholder="Your last name"
              />
            </div>
          </div>

          {/* Partner Names */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="partnerFirstName" className="block text-sm font-medium text-[#2D2D2D] mb-1">
                Partner&apos;s First Name
              </label>
              <input
                id="partnerFirstName"
                type="text"
                required
                value={partnerFirstName}
                onChange={(e) => setPartnerFirstName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#D4A854] focus:border-transparent outline-none transition-all"
                placeholder="Partner's first name"
              />
            </div>
            <div>
              <label htmlFor="partnerLastName" className="block text-sm font-medium text-[#2D2D2D] mb-1">
                Partner&apos;s Last Name
              </label>
              <input
                id="partnerLastName"
                type="text"
                required
                value={partnerLastName}
                onChange={(e) => setPartnerLastName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#D4A854] focus:border-transparent outline-none transition-all"
                placeholder="Partner's last name"
              />
            </div>
          </div>

          {/* Wedding Date */}
          <div>
            <label htmlFor="weddingDate" className="block text-sm font-medium text-[#2D2D2D] mb-1">
              Wedding Date
            </label>
            <input
              id="weddingDate"
              type="date"
              value={weddingDate}
              onChange={(e) => {
                setWeddingDate(e.target.value);
                if (e.target.value) setDateUndecided(false);
              }}
              disabled={dateUndecided}
              className={`w-full max-w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#D4A854] focus:border-transparent outline-none transition-all ${
                dateUndecided ? 'bg-gray-100 text-gray-500' : ''
              }`}
              style={{ minWidth: '0', maxWidth: '100%' }}
            />
            
            <div className="mt-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={dateUndecided}
                  onChange={(e) => {
                    setDateUndecided(e.target.checked);
                    if (e.target.checked) setWeddingDate("");
                  }}
                  className="rounded border-gray-300 text-[#D4A854] focus:ring-[#D4A854] mr-2"
                />
                <span className="text-sm text-[#2D2D2D]/70">We&apos;re still deciding</span>
              </label>
            </div>
          </div>
        </div>
      </div>

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
          disabled={!isFormValid}
          className={`px-8 py-3 rounded-xl font-semibold transition-colors ${
            isFormValid
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
 * Step 4 Component - Wedding Celebration Details
 */
function Step4() {
  const { nextStep, previousStep, updateStepData, state } = useOnboarding();
  
  // Initialize from saved state if available
  const savedData = state.answers.step4 as {
    guestCount?: string;
  } | undefined;

  const [selectedGuestCount, setSelectedGuestCount] = useState<string>(savedData?.guestCount || "");

  const guestCountOptions = [
    { value: "intimate", label: "Intimate gathering (under 50)" },
    { value: "perfect", label: "Perfect size (50-100)" },
    { value: "big", label: "Big celebration (100+)" },
    { value: "undecided", label: "Still figuring it out" },
  ];

  const handleSelection = (value: string) => {
    setSelectedGuestCount(value);
    updateStepData(4, { guestCount: value });
  };

  const handleContinue = () => {
    if (selectedGuestCount) {
      nextStep();
    }
  };

  return (
    <OnboardingStep
      stepNumber={4}
      totalSteps={5}
      title="Tell us about your celebration."
      imageUrl="/images/onboarding/onboarding_lemon.png"
      imageAlt="Wedding planning essentials"
    >
      <div className="max-w-lg mx-auto">
        {/* Question */}
        <div className="text-center mb-8">
          <h2 className="text-base font-medium text-[#2D2D2D] mb-1">
            How many guests are you expecting?
          </h2>
          <p className="text-sm text-[#2D2D2D]/60 font-light">
            This helps us plan the perfect size for your book.
          </p>
        </div>

        {/* Selection Cards */}
        <div className="space-y-3 mb-8">
          {guestCountOptions.map((option) => (
            <SelectionCard
              key={option.value}
              value={option.value}
              label={option.label}
              isSelected={selectedGuestCount === option.value}
              onClick={handleSelection}
            />
          ))}
        </div>
      </div>

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
          disabled={!selectedGuestCount}
          className={`px-8 py-3 rounded-xl font-semibold transition-colors ${
            selectedGuestCount
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
 * Step 5 Component - Checkout & Account Creation
 * Reason: Password removed for soft launch - accounts created manually after Venmo payment
 */
function Step5() {
  const { previousStep, completeOnboarding, updateStepData, state } = useOnboarding();

  // Initialize from saved state if available
  const savedData = state.answers.step5 as {
    email?: string;
    shippingDestination?: string;
  } | undefined;

  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState(savedData?.email || "");
  const [emailError, setEmailError] = useState("");
  const [shippingDestination, setShippingDestination] = useState(savedData?.shippingDestination || "");
  const [shippingError, setShippingError] = useState("");
  const [forceExpanded, setForceExpanded] = useState(false);

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

  const handleShippingChange = (destination: string) => {
    setShippingDestination(destination);
    if (shippingError) setShippingError("");
  };

  const handleCompletePurchase = async () => {
    if (!shippingDestination) {
      setShippingError("Please select a shipping destination");
      setForceExpanded(true);
      return;
    }

    if (!validateEmail(email.trim())) {
      return;
    }

    setLoading(true);

    try {
      // Store email and shipping in context
      await updateStepData(5, {
        email: email.trim(),
        shippingDestination,
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

  // Get couple names from step 3
  const step3Data = state.answers.step3 as {
    brideFirstName?: string;
    brideLastName?: string;
    partnerFirstName?: string;
    partnerLastName?: string;
  } | undefined;
  
  const coupleNames = step3Data
    ? {
        brideFirstName: step3Data.brideFirstName,
        brideLastName: step3Data.brideLastName,
        partnerFirstName: step3Data.partnerFirstName,
        partnerLastName: step3Data.partnerLastName,
      }
    : undefined;

  return (
    <OnboardingStep
      stepNumber={5}
      totalSteps={5}
      title="Complete your purchase."
      imageUrl="/images/onboarding/onboarding_lemon.png"
      imageAlt="Checkout"
    >
      <div className="max-w-lg mx-auto">
        <CheckoutSummary
          selectedTierId={state.selectedProductTier}
          coupleNames={coupleNames}
          email={email}
          emailError={emailError}
          loading={loading}
          onEmailChange={handleEmailChange}
          onEmailBlur={handleEmailBlur}
          onCompletePurchase={handleCompletePurchase}
          isFormValid={isFormValid}
          shippingDestination={shippingDestination}
          onShippingChange={handleShippingChange}
          shippingError={shippingError}
          forceExpanded={forceExpanded}
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
            disabled={loading}
            className={`px-12 py-4 rounded-2xl text-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              isFormValid && shippingDestination
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
      stepNumber={5}
      totalSteps={5}
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
          You just started something beautiful.
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
 * Main Onboarding Page Component
 * Manages the 5-step questionnaire flow
 */
function OnboardingContent() {
  const { state } = useOnboarding();

  // Show success screen when onboarding is complete
  if (state.isComplete) {
    return <SuccessScreen />;
  }

  return (
    <div className="min-h-screen bg-white">
      {state.currentStep === 1 && <Step1 />}
      {state.currentStep === 2 && <Step2 />}
      {state.currentStep === 3 && <Step3 />}
      {state.currentStep === 4 && <Step4 />}
      {state.currentStep === 5 && <Step5 />}
    </div>
  );
}

/**
 * Page wrapper with OnboardingProvider
 */
export default function OnboardingPage() {
  return (
    <OnboardingProvider userType="couple">
      <OnboardingContent />
    </OnboardingProvider>
  );
}
