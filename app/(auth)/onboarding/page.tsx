"use client";

import React from "react";
import { useState } from "react";
import { OnboardingProvider, useOnboarding } from "@/lib/contexts/OnboardingContext";
import OnboardingStep from "@/components/onboarding/OnboardingStep";
import { SelectionCard } from "@/components/onboarding/SelectionCard";

/**
 * Step 1 Component - Recipe Count Question
 */
function Step1() {
  const { nextStep, updateStepData } = useOnboarding();
  const [selectedPlanningStage, setSelectedPlanningStage] = useState<string>("");

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
      totalSteps={4}
      title="Let's start with the basics."
      imageUrl="/images/onboarding/onboarding_step_1.jpg"
      imageAlt="Wedding planning essentials"
    >
      <div className="max-w-lg mx-auto">
        {/* Question */}
        <div className="text-center mb-8 mt-6">
          <h2 className="text-lg font-medium text-[#2D2D2D] mb-0">
            Where are you in the wedding planning?
          </h2>
          <p className="text-base text-[#2D2D2D]/60 font-light">
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
            className="text-sm text-[#2D2D2D]/50 hover:text-[#D4A854] transition-colors font-light"
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
 * Step 2 Component - Couple Information
 */
function Step2() {
  const { nextStep, previousStep, updateStepData } = useOnboarding();
  const [brideFirstName, setBrideFirstName] = useState<string>("");
  const [brideLastName, setBrideLastName] = useState<string>("");
  const [partnerFirstName, setPartnerFirstName] = useState<string>("");
  const [partnerLastName, setPartnerLastName] = useState<string>("");
  const [weddingDate, setWeddingDate] = useState<string>("");
  const [dateUndecided, setDateUndecided] = useState<boolean>(false);

  const handleContinue = () => {
    if (brideFirstName.trim() && brideLastName.trim() && partnerFirstName.trim() && partnerLastName.trim() && (weddingDate || dateUndecided)) {
      updateStepData(2, { 
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
      stepNumber={2}
      totalSteps={4}
      title="Now for the good part."
      imageUrl="/images/onboarding/onboarding_step_2.jpg"
      imageAlt="Happy couple"
    >
      <div className="max-w-lg mx-auto">
        {/* Question */}
        <div className="text-center mb-8">
          <h2 className="text-lg font-medium text-[#2D2D2D] mb-0">
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
 * Step 3 Component - Wedding Celebration Details
 */
function Step3() {
  const { nextStep, previousStep, updateStepData } = useOnboarding();
  const [selectedGuestCount, setSelectedGuestCount] = useState<string>("");

  const guestCountOptions = [
    { value: "intimate", label: "Intimate gathering (under 50)" },
    { value: "perfect", label: "Perfect size (50-100)" },
    { value: "big", label: "Big celebration (100+)" },
    { value: "undecided", label: "Still figuring it out" },
  ];

  const handleSelection = (value: string) => {
    setSelectedGuestCount(value);
    updateStepData(3, { guestCount: value });
  };

  const handleContinue = () => {
    if (selectedGuestCount) {
      nextStep();
    }
  };

  return (
    <OnboardingStep
      stepNumber={3}
      totalSteps={4}
      title="Tell us about your celebration."
      imageUrl="/images/onboarding/onboarding_step_3.jpg"
      imageAlt="Wedding reception celebration"
    >
      <div className="max-w-lg mx-auto">
        {/* Question */}
        <div className="text-center mb-8">
          <h2 className="text-lg font-medium text-[#2D2D2D] mb-0">
            How many guests are you expecting?
          </h2>
          <p className="text-[#2D2D2D]/60 font-light">
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
 * Step 4 Component - Account Creation & Launch
 */
function Step4() {
  const { previousStep, completeOnboarding, updateStepData, state } = useOnboarding();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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

  const handleCreateAccount = async () => {
    if (!validateEmail(email.trim()) || password.length < 6) {
      return;
    }

    setLoading(true);

    try {
      // Store account info in context and wait for state update
      await updateStepData(4, {
        email: email.trim(),
        password // In real app, this would be hashed
      });
      
      // Complete onboarding with all collected data - pass email/password directly
      await completeOnboarding(email.trim(), password);
      
      setSuccess(true);
      setLoading(false);
    } catch (err) {
      console.error("Error in handleCreateAccount:", err);
      setLoading(false);
    }
  };

  const isFormValid = validateEmail(email.trim()) && password.length >= 6 && !emailError;

  return (
    <OnboardingStep
      stepNumber={4}
      totalSteps={4}
      title="You're about to start something beautiful."
      imageUrl="/images/onboarding/onboarding_step_4.jpg"
      imageAlt="Beautiful wedding cookbook"
      hideProgress={success}
    >
      <div className="max-w-lg mx-auto">
        {!success ? (
          <>
            {/* Personalized Message */}
            <div className="text-center mb-8 space-y-4">
              <h2 className="text-lg font-medium text-[#2D2D2D]">
                We&apos;re so excited for you!
              </h2>
              <p className="text-base text-[#2D2D2D]/70 font-light leading-relaxed">
                Your wedding cookbook is about to become reality. 
                <br />Let&apos;s create your account and get started.
              </p>
            </div>

            {/* Account Creation Form */}
            <div className="space-y-6 mb-8">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-[#2D2D2D] mb-1">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={handleEmailChange}
                  onBlur={handleEmailBlur}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:border-transparent outline-none transition-all ${
                    emailError 
                      ? 'border-red-500 focus:ring-red-500' 
                      : 'border-gray-300 focus:ring-[#D4A854]'
                  }`}
                  placeholder="you@example.com"
                />
                {emailError && (
                  <p className="mt-1 text-sm text-red-600">{emailError}</p>
                )}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-[#2D2D2D] mb-1">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#D4A854] focus:border-transparent outline-none transition-all"
                  placeholder="At least 6 characters"
                  minLength={6}
                />
                {password.length > 0 && password.length < 6 && (
                  <p className="mt-1 text-sm text-red-600">Password must be at least 6 characters</p>
                )}
              </div>
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
                onClick={handleCreateAccount}
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
                    Creating...
                  </>
                ) : (
                  "Start Your Book"
                )}
              </button>
            </div>
          </>
        ) : (
          /* Success Message */
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-[#D4A854]/10 rounded-full mx-auto flex items-center justify-center mb-8">
              <svg className="w-12 h-12 text-[#D4A854]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-3xl font-medium text-[#2D2D2D] mb-6 leading-tight">
              You&apos;re about to start something beautiful.
            </h2>
            <p className="text-xl text-[#D4A854] italic font-serif">
              Still at the table.
            </p>
          </div>
        )}
      </div>
    </OnboardingStep>
  );
}

/**
 * Main Onboarding Page Component
 * Manages the 4-step questionnaire flow
 */
function OnboardingContent() {
  const { state } = useOnboarding();

  return (
    <div className="min-h-screen bg-white">
      {state.currentStep === 1 && <Step1 />}
      {state.currentStep === 2 && <Step2 />}
      {state.currentStep === 3 && <Step3 />}
      {state.currentStep === 4 && <Step4 />}
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
