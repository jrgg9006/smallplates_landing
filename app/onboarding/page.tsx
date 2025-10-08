"use client";

import React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
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
 * Step 2 Component - Placeholder for future questions
 */
function Step2() {
  const { nextStep, previousStep } = useOnboarding();

  return (
    <OnboardingStep
      stepNumber={2}
      totalSteps={3}
      title="Tell us more"
      description="Help us understand your preferences."
    >
      <div className="bg-gray-50 rounded-xl p-8 text-center">
        <p className="text-gray-600 mb-4">
          Questions for Step 2 will be added here
        </p>
        <p className="text-sm text-gray-500">
          This is a placeholder for the questionnaire content
        </p>
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
          onClick={nextStep}
          className="px-8 py-3 bg-black text-white rounded-xl font-semibold hover:bg-gray-800 transition-colors"
        >
          Continue
        </button>
      </div>
    </OnboardingStep>
  );
}

/**
 * Step 3 Component - Final step with account creation
 */
function Step3() {
  const { previousStep, completeOnboarding } = useOnboarding();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await completeOnboarding(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create account");
      setLoading(false);
    }
  };

  return (
    <OnboardingStep
      stepNumber={3}
      totalSteps={3}
      title="Create your account"
      description="Almost done! Let's set up your account."
    >
      <form onSubmit={handleComplete} className="space-y-6">
        {/* Placeholder for Step 3 questions */}
        <div className="bg-gray-50 rounded-xl p-8 text-center mb-6">
          <p className="text-gray-600 mb-4">
            Questions for Step 3 will be added here
          </p>
          <p className="text-sm text-gray-500">
            This is a placeholder for the questionnaire content
          </p>
        </div>

        {/* Account Creation Fields */}
        <div className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
              placeholder="you@example.com"
              disabled={loading}
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
              placeholder="••••••••"
              disabled={loading}
              minLength={6}
            />
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <button
            type="button"
            onClick={previousStep}
            disabled={loading}
            className="px-6 py-3 text-gray-600 font-medium hover:text-gray-900 transition-colors disabled:opacity-50"
          >
            Back
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-3 bg-black text-white rounded-xl font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Creating account..." : "Complete"}
          </button>
        </div>
      </form>
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
      <div className="max-w-7xl mx-auto py-12 md:py-20">
        {state.currentStep === 1 && <Step1 />}
        {state.currentStep === 2 && <Step2 />}
        {state.currentStep === 3 && <Step3 />}
      </div>
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
