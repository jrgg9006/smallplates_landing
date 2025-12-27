"use client";

import React, { Suspense } from "react";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { OnboardingProvider, useOnboarding } from "@/lib/contexts/OnboardingContext";
import { useAuth } from "@/lib/contexts/AuthContext";
import OnboardingStep from "@/components/onboarding/OnboardingStep";
import { SelectionCard } from "@/components/onboarding/SelectionCard";
import { CustomDropdown } from "@/components/onboarding/CustomDropdown";


/**
 * Step 1 Component - Wedding Timeline
 */
function Step1({ isAddBookMode = false }: { isAddBookMode?: boolean }) {
  const { nextStep, previousStep, updateStepData } = useOnboarding();
  const [selectedTimeline, setSelectedTimeline] = useState<string>("");

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
      totalSteps={isAddBookMode ? 2 : 3}
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

        {/* Selection Cards with subtexts */}
        <div className="space-y-3 mb-8">
          {timelineOptions.map((option) => (
            <div key={option.value}>
              <SelectionCard
                value={option.value}
                label={option.label}
                isSelected={selectedTimeline === option.value}
                onClick={handleSelection}
              />
              {selectedTimeline === option.value && (
                <p className="mt-2 text-sm text-[#D4A854] font-light italic pl-4">
                  {option.subtext}
                </p>
              )}
            </div>
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
 * Step 2 Component - Contact & Gift Setup
 */
function Step2({ isAddBookMode = false }: { isAddBookMode?: boolean }) {
  const { state, nextStep, previousStep, updateStepData, completeOnboarding } = useOnboarding();
  const [giftGiverName, setGiftGiverName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [partnerFirstName, setPartnerFirstName] = useState("");
  const [relationship, setRelationship] = useState("");
  const [loading, setLoading] = useState(false);


  const handleContinue = async () => {
    // Reason: Skip giftGiverName validation when user is already authenticated
    if ((!isAddBookMode && !giftGiverName.trim()) || !firstName.trim() || !partnerFirstName.trim() || !relationship) {
      return;
    }

    // Build step2 data
    const step2Data = {
      ...(isAddBookMode ? {} : { giftGiverName: giftGiverName.trim() }),
      firstName: firstName.trim(),
      partnerFirstName: partnerFirstName.trim(),
      relationship: relationship
    };

    // Store gift info in context
    await updateStepData(2, step2Data);
    
    // Reason: If add-book mode, complete onboarding directly (skip Step3 account creation)
    if (isAddBookMode) {
      setLoading(true);
      try {
        // Pass step1 and step2 data directly to avoid async state timing issues
        await completeOnboarding(undefined, undefined, { 
          step1: state.answers.step1,
          step2: step2Data 
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
      stepNumber={2}
      totalSteps={isAddBookMode ? 2 : 3}
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
 * Step 3 Component - Account Creation & Launch
 */
function Step3() {
  const { previousStep, completeOnboarding, updateStepData } = useOnboarding();
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
      // Store account info in context
      updateStepData(3, {
        email: email.trim(),
        password // In real app, this would be hashed
      });
      
      // Complete onboarding with all collected data
      await completeOnboarding(email.trim(), password);
      
      setSuccess(true);
      setLoading(false);
    } catch (err) {
      setLoading(false);
    }
  };

  const isFormValid = validateEmail(email.trim()) && password.length >= 6 && !emailError;

  return (
    <OnboardingStep
      stepNumber={3}
      totalSteps={3}
      title=""
      imageUrl="/images/onboarding/onboarding_lemon.png"
      imageAlt="Wedding planning essentials"
    >
      <div className="max-w-lg mx-auto">
        {!success ? (
          <>
            {/* Personalized Message */}
            <div className="text-center mb-8 space-y-4">
              <h2 className="text-lg font-medium text-[#2D2D2D]">
                Perfect choice.
              </h2>
              <p className="text-base text-[#2D2D2D]/70 font-light leading-relaxed">
                You&apos;re giving something they&apos;ll treasure forever.
                <br />Let&apos;s create your account to get started.
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
                  Create a password
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

            {/* Confidence building message */}
            <div className="text-center text-sm text-[#2D2D2D]/50 font-light mb-8">
              The thoughtful gift everyone will remember.
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
                  "Start Creating Their Gift"
                )}
              </button>
            </div>
          </>
        ) : (
          /* Success Message */
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-[#D4A854]/10 rounded-full mx-auto flex items-center justify-center mb-6">
              <svg className="w-10 h-10 text-[#D4A854]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-2xl font-semibold text-[#2D2D2D] mb-3">
              Perfect choice.
            </h3>
            <p className="text-lg text-[#2D2D2D]/70 font-light mb-6">
              You&apos;re giving them something they&apos;ll treasure forever.
            </p>
            <p className="text-base text-[#D4A854] italic font-serif">
              Still at the table.
            </p>
          </div>
        )}
      </div>
    </OnboardingStep>
  );
}

/**
 * Main Gift Onboarding Page Component
 * Manages the 3-step gift giver flow
 */
function GiftOnboardingContent({ isAddBookMode }: { isAddBookMode: boolean }) {
  const { state } = useOnboarding();

  return (
    <div className="min-h-screen bg-white">
      {state.currentStep === 1 && <Step1 isAddBookMode={isAddBookMode} />}
      {state.currentStep === 2 && <Step2 isAddBookMode={isAddBookMode} />}
      {state.currentStep === 3 && !isAddBookMode && <Step3 />}
    </div>
  );
}

/**
 * Inner component that uses useSearchParams (requires Suspense boundary)
 */
function GiftOnboardingPageInner() {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  
  // Reason: add-book mode only applies when user is already authenticated
  const isAddBookMode = searchParams.get('mode') === 'add-book' && !!user;

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