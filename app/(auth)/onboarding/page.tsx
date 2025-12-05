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
  const [selectedRecipeCount, setSelectedRecipeCount] = useState<string>("");

  const recipeOptions = [
    { value: "40-or-less", label: "40 or less" },
    { value: "40-60", label: "40 - 60 recipes" },
    { value: "60-or-more", label: "60 or more" },
  ];

  const handleSelection = (value: string) => {
    setSelectedRecipeCount(value);
    // Store the answer in onboarding context
    updateStepData(1, { recipeCount: value });
  };

  const handleContinue = () => {
    if (selectedRecipeCount) {
      nextStep();
    }
  };

  return (
    <OnboardingStep
      stepNumber={1}
      totalSteps={4}
      title="Let's get started"
      imageUrl="/images/onboarding/onboarding_step_1.jpg"
      imageAlt="Friends cooking together"
    >
      <div className="max-w-lg mx-auto">
        {/* Question */}
        <div className="text-center mb-8">
          <h2 className="text-xl font-medium text-gray-900 mb-2">
            How many plates are you planning to add (approx)?
          </h2>
          <p className="text-gray-600">
            This can change in the future. Dont´t worry about it too much.
          </p>
        </div>

        {/* Selection Cards */}
        <div className="space-y-3 mb-8">
          {recipeOptions.map((option) => (
            <SelectionCard
              key={option.value}
              value={option.value}
              label={option.label}
              isSelected={selectedRecipeCount === option.value}
              onClick={handleSelection}
            />
          ))}
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
          disabled={!selectedRecipeCount}
          className={`px-8 py-3 rounded-xl font-semibold transition-colors ${
            selectedRecipeCount
              ? "bg-black text-white hover:bg-gray-800"
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
 * Step 2 Component - Use Case Question
 */
function Step2() {
  const { nextStep, previousStep, updateStepData } = useOnboarding();
  const [selectedUseCase, setSelectedUseCase] = useState<string>("");

  const useCaseOptions = [
    { value: "gift", label: "A Gift" },
    { value: "personal", label: "For me" },
  ];

  const handleSelection = (value: string) => {
    setSelectedUseCase(value);
    // Store the answer in onboarding context
    updateStepData(2, { useCase: value });
  };

  const handleContinue = () => {
    if (selectedUseCase) {
      nextStep();
    }
  };

  return (
    <OnboardingStep
      stepNumber={2}
      totalSteps={4}
      title="Use Case"
      imageUrl="/images/onboarding/onboarding_step_2.jpg"
      imageAlt="Cookbook use case"
    >
      <div className="max-w-lg mx-auto">
        {/* Question */}
        <div className="text-center mb-8">
          <h2 className="text-xl font-medium text-gray-900 mb-2">
            I want the book for:
          </h2>
        </div>

        {/* Selection Cards */}
        <div className="space-y-3 mb-8">
          {useCaseOptions.map((option) => (
            <SelectionCard
              key={option.value}
              value={option.value}
              label={option.label}
              isSelected={selectedUseCase === option.value}
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
          disabled={!selectedUseCase}
          className={`px-8 py-3 rounded-xl font-semibold transition-colors ${
            selectedUseCase
              ? "bg-black text-white hover:bg-gray-800"
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
 * Step 3 Component - Personal Information Collection
 */
function Step3() {
  const { nextStep, previousStep, updateStepData } = useOnboarding();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [hasPartner, setHasPartner] = useState(false);
  const [partnerFirstName, setPartnerFirstName] = useState("");
  const [partnerLastName, setPartnerLastName] = useState("");

  // Email validation function
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Handle email blur event
  const handleEmailBlur = () => {
    if (email.trim() && !validateEmail(email.trim())) {
      setEmailError("Please enter a valid email address");
    } else {
      setEmailError("");
    }
  };

  // Handle email change
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    // Clear error when user starts typing again
    if (emailError) {
      setEmailError("");
    }
  };

  const handleContinue = () => {
    if (firstName && lastName && email) {
      // Store the answers in onboarding context
      updateStepData(3, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        hasPartner,
        partnerFirstName: hasPartner ? partnerFirstName.trim() : undefined,
        partnerLastName: hasPartner ? partnerLastName.trim() : undefined,
      });
      nextStep();
    }
  };

  const isFormValid = firstName.trim() && lastName.trim() && email.trim() && 
    !emailError && validateEmail(email.trim()) &&
    (!hasPartner || (partnerFirstName.trim() && partnerLastName.trim()));

  return (
    <OnboardingStep
      stepNumber={3}
      totalSteps={4}
      title="Personal Information"
      description="Let's save your info"
      imageUrl="/images/onboarding/onboarding_step_2.jpg"
      imageAlt="Couple cooking together"
    >
      <div className="max-w-lg mx-auto">
        <div className="space-y-6">
          {/* Main Person Information */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                  First Name *
                </label>
                <input
                  id="firstName"
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
                  placeholder="Your first name"
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name *
                </label>
                <input
                  id="lastName"
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
                  placeholder="Your last name"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address *
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
                    : 'border-gray-300 focus:ring-black'
                }`}
                placeholder="you@example.com"
              />
              {emailError && (
                <p className="mt-1 text-sm text-red-600">{emailError}</p>
              )}
            </div>
          </div>

          {/* Partner Option - Hidden for now */}
          {/* <div className="border-t border-gray-200 pt-6">
            <button
              type="button"
              onClick={() => setHasPartner(!hasPartner)}
              className="w-full text-left p-4 rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-gray-900 font-medium">
                  Doing Small Plates with someone else?
                </span>
                <svg 
                  className={`w-5 h-5 text-gray-400 transition-transform ${hasPartner ? 'rotate-180' : ''}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>

            <Partner Fields */}
            {/* {hasPartner && (
              <div className="mt-4 p-4 bg-gray-50 rounded-xl space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="partnerFirstName" className="block text-sm font-medium text-gray-700 mb-1">
                      Partner&apos;s First Name *
                    </label>
                    <input
                      id="partnerFirstName"
                      type="text"
                      required={hasPartner}
                      value={partnerFirstName}
                      onChange={(e) => setPartnerFirstName(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
                      placeholder="Partner&apos;s first name"
                    />
                  </div>
                  <div>
                    <label htmlFor="partnerLastName" className="block text-sm font-medium text-gray-700 mb-1">
                      Partner&apos;s Last Name *
                    </label>
                    <input
                      id="partnerLastName"
                      type="text"
                      required={hasPartner}
                      value={partnerLastName}
                      onChange={(e) => setPartnerLastName(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
                      placeholder="Partner&apos;s last name"
                    />
                  </div>
                </div>
              </div>
            )}
          </div> */}
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
              ? "bg-black text-white hover:bg-gray-800"
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
 * Step 4 Component - Waitlist Signup
 */
function Step4() {
  const { previousStep, completeOnboarding } = useOnboarding();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleJoinWaitlist = async () => {
    setLoading(true);

    try {
      // Simulate waitlist submission
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Complete onboarding (saves data, logs to console in waitlist mode)
      await completeOnboarding();
      
      // Show success message - user can close modal manually
      setSuccess(true);
      setLoading(false);
    } catch (err) {
      setLoading(false);
    }
  };

  return (
    <OnboardingStep
      stepNumber={4}
      totalSteps={4}
      title="Join the Waitlist"
      description={!success ? "✨ Only selected members of the Small Plates circle have access for now." : undefined}
      imageUrl="/images/onboarding/onboarding_step_3.jpg"
      imageAlt="Beautiful book"
      imagePosition="right"
    >
      <div className="max-w-lg mx-auto">
        {!success ? (
          <>
            {/* Waitlist Message */}
            <div className="text-center mb-8 space-y-4">
              <p className="text-lg text-gray-700 leading-relaxed">
                Join the waitlist — you&apos;ll be the first to know when Small Plates opens.
              </p>
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
                onClick={handleJoinWaitlist}
                disabled={loading}
                className="px-12 py-4 bg-black text-white rounded-2xl text-lg font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2 inline-block"></div>
                    Joining...
                  </>
                ) : (
                  "Count me in!"
                )}
              </button>
            </div>
          </>
        ) : (
          /* Success Message */
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-green-100 rounded-full mx-auto flex items-center justify-center mb-6">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-3">
              You&apos;re in!
            </h3>
            <p className="text-lg text-gray-600">
              We&apos;ll be in touch soon.
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
    <OnboardingProvider>
      <OnboardingContent />
    </OnboardingProvider>
  );
}
