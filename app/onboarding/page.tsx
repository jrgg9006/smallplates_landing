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
      totalSteps={3}
      title="Let's get started"
      imageUrl="/images/onboarding/onboarding_step_1.jpg"
      imageAlt="Friends cooking together"
    >
      <div className="max-w-lg mx-auto">
        {/* Question */}
        <div className="text-center mb-8">
          <h2 className="text-xl font-medium text-gray-900 mb-2">
            How many recipes are you planning to add (approx)?
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
 * Step 2 Component - Personal Information Collection
 */
function Step2() {
  const { nextStep, previousStep, updateStepData } = useOnboarding();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [hasPartner, setHasPartner] = useState(false);
  const [partnerFirstName, setPartnerFirstName] = useState("");
  const [partnerLastName, setPartnerLastName] = useState("");

  const handleContinue = () => {
    if (firstName && lastName && email) {
      // Store the answers in onboarding context
      updateStepData(2, {
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
    (!hasPartner || (partnerFirstName.trim() && partnerLastName.trim()));

  return (
    <OnboardingStep
      stepNumber={2}
      totalSteps={3}
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
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
                placeholder="you@example.com"
              />
            </div>
          </div>

          {/* Partner Option */}
          <div className="border-t border-gray-200 pt-6">
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

            {/* Partner Fields */}
            {hasPartner && (
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
 * Step 3 Component - Stripe Checkout Process
 */
function Step3() {
  const { previousStep, completeOnboarding, state } = useOnboarding();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePayment = async () => {
    setLoading(true);
    setError(null);

    try {
      // TODO: Integrate with Stripe here
      // For now, simulate payment process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Store payment completion in onboarding context
      // updateStepData(3, { paymentComplete: true, stripeSessionId: 'placeholder' });
      
      await completeOnboarding();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed");
      setLoading(false);
    }
  };

  // Get user's name for personalization
  const step2Data = state.answers.step2;
  const userName = step2Data?.hasPartner 
    ? `${step2Data.firstName} and ${step2Data.partnerFirstName}`
    : step2Data?.firstName;

  const step1Data = state.answers.step1;
  const recipeCount = step1Data?.recipeCount;

  return (
    <OnboardingStep
      stepNumber={3}
      totalSteps={3}
      title="Let's complete your purchase"
      description="You're almost done!"
      imageUrl="/images/onboarding/onboarding_step_3.jpg"
      imageAlt="Beautiful cookbook"
      imagePosition="right"
    >
      <div className="max-w-lg mx-auto">
        {/* Order Summary */}
        <div className="bg-gray-50 rounded-xl p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Customer:</span>
              <span className="font-medium">{userName || "Guest"}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Recipe Goal:</span>
              <span className="font-medium">{recipeCount || "Not specified"}</span>
            </div>
            <div className="border-t border-gray-200 pt-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Small Plates Cookbook:</span>
                <span className="font-semibold">$29.99</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stripe Placeholder */}
        <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center mb-6">
          <div className="space-y-4">
            <div className="w-16 h-16 bg-gray-200 rounded-xl mx-auto flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Stripe Checkout Integration</h4>
              <p className="text-sm text-gray-500 mb-4">
                This is where the Stripe payment form will be integrated
              </p>
              <p className="text-xs text-gray-400">
                Placeholder for secure payment processing
              </p>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm mb-6">
            {error}
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between">
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
            onClick={handlePayment}
            disabled={loading}
            className="px-8 py-3 bg-black text-white rounded-xl font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block"></div>
                Processing...
              </>
            ) : (
              "Complete Purchase - $29.99"
            )}
          </button>
        </div>
      </div>
    </OnboardingStep>
  );
}

/**
 * Main Onboarding Page Component
 * Manages the 3-step questionnaire flow
 */
function OnboardingContent() {
  const { state } = useOnboarding();

  return (
    <div className="min-h-screen bg-white">
      {state.currentStep === 1 && <Step1 />}
      {state.currentStep === 2 && <Step2 />}
      {state.currentStep === 3 && <Step3 />}
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
