"use client";

import React, { Suspense, useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { OnboardingProvider, useOnboarding } from "@/lib/contexts/OnboardingContext";
import { useAuth } from "@/lib/contexts/AuthContext";
import OnboardingStep from "@/components/onboarding/OnboardingStep";
import { ProductSelectionStep } from "@/components/onboarding/ProductSelectionStep";
import { DatePickerStep } from "@/components/onboarding/DatePickerStep";
import { PostPaymentSetup } from "@/components/onboarding/PostPaymentSetup";
import { Lock } from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import {
  BASE_BOOK_PRICE,
  ADDITIONAL_BOOK_PRICE,
  calculateSubtotal,
  calculateShipping,
} from "@/lib/stripe/pricing";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

/**
 * Step 2 Component - Product Selection (quantity-based)
 */
function Step2Product({ isAddBookMode = false }: { isAddBookMode?: boolean }) {
  const { nextStep, previousStep, updateBookSelection, state } = useOnboarding();

  const canContinue = state.bookQuantity >= 1;

  return (
    <OnboardingStep
      stepNumber={2}
      totalSteps={3}
      title="How many copies?"
      imageUrl="/images/onboarding/onboarding_lemon.png"
      imageAlt="Product selection"
    >
      <ProductSelectionStep
        bookQuantity={state.bookQuantity}
        shippingCountry={state.shippingCountry}
        onUpdateQuantity={(qty) =>
          updateBookSelection(qty, state.shippingCountry || 'US')
        }
        onUpdateCountry={(country) =>
          updateBookSelection(state.bookQuantity, country)
        }
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
          onClick={nextStep}
          disabled={!canContinue}
          className={`px-8 py-3 rounded-xl font-semibold transition-colors ${
            canContinue
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
 * Step 3 — Payment with embedded Stripe Elements
 * Collects email + card, processes payment inline
 */
function Step3Payment({ isAddBookMode = false }: { isAddBookMode?: boolean }) {
  const { state, previousStep, nextStep, setPaymentInfo, updateStepData } = useOnboarding();
  const { user } = useAuth();

  const [clientSecret, setClientSecret] = useState<string | null>(state.clientSecret);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(state.paymentIntentId);
  const [isCreatingPI, setIsCreatingPI] = useState(false);
  const [piError, setPiError] = useState("");
  const piCreatedRef = useRef(false);

  const savedEmail = (state.answers.step3 as { email?: string } | undefined)?.email || "";
  const [email, setEmail] = useState(
    savedEmail || (isAddBookMode && user?.email ? user.email : "")
  );
  const [emailError, setEmailError] = useState("");

  const subtotal = calculateSubtotal(state.bookQuantity);
  const total = subtotal + calculateShipping(state.bookQuantity, 'US');

  // Create PaymentIntent on mount if we don't have one
  useEffect(() => {
    if (clientSecret || piCreatedRef.current) return;
    piCreatedRef.current = true;
    setIsCreatingPI(true);

    const step1Data = state.answers.step1 as {
      gift_date?: string | null;
      gift_date_undecided?: boolean;
      book_close_date?: string | null;
    } | undefined;

    fetch("/api/stripe/create-payment-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bookQuantity: state.bookQuantity,
        userType: "gift_giver",
        giftDate: step1Data?.gift_date || null,
        giftDateUndecided: step1Data?.gift_date_undecided || false,
        bookCloseDate: step1Data?.book_close_date || null,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.clientSecret && data.paymentIntentId) {
          setClientSecret(data.clientSecret);
          setPaymentIntentId(data.paymentIntentId);
          setPaymentInfo(data.paymentIntentId, data.clientSecret);
        } else {
          setPiError(data.error || "Failed to initialize payment");
        }
      })
      .catch(() => setPiError("Failed to initialize payment"))
      .finally(() => setIsCreatingPI(false));
  // Reason: Only run once on mount — deps intentionally limited
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isCreatingPI || !clientSecret) {
    return (
      <OnboardingStep
        stepNumber={3}
        totalSteps={3}
        title="Let's finish your order"
        imageUrl="/images/onboarding/onboarding_lemon.png"
        imageAlt="Checkout"
      >
        <div className="flex items-center justify-center py-16">
          {piError ? (
            <div className="text-center">
              <p className="text-red-600 mb-4">{piError}</p>
              <button
                onClick={previousStep}
                className="text-[#D4A854] hover:underline"
              >
                Go back
              </button>
            </div>
          ) : (
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D4A854]" />
          )}
        </div>
      </OnboardingStep>
    );
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: {
          theme: "stripe",
          variables: {
            colorPrimary: "#2D2D2D",
            colorBackground: "#F5F5F5",
            colorText: "#2D2D2D",
            borderRadius: "12px",
            fontFamily: "system-ui, -apple-system, sans-serif",
          },
          rules: {
            ".Input": {
              border: "1px solid #E5E7EB",
              boxShadow: "none",
              padding: "12px 16px",
            },
            ".Input:focus": {
              border: "1px solid #D4A854",
              boxShadow: "0 0 0 2px rgba(212, 168, 84, 0.2)",
            },
          },
        },
      }}
    >
      <PaymentForm
        email={email}
        setEmail={setEmail}
        emailError={emailError}
        setEmailError={setEmailError}
        paymentIntentId={paymentIntentId!}
        clientSecret={clientSecret!}
        total={total}
        subtotal={subtotal}
        bookQuantity={state.bookQuantity}
        previousStep={previousStep}
        nextStep={nextStep}
        setPaymentInfo={setPaymentInfo}
        updateStepData={updateStepData}
        isAddBookMode={isAddBookMode}
        existingUserId={user?.id}
      />
    </Elements>
  );
}

/**
 * Inner payment form — must be inside <Elements> to use useStripe/useElements
 */
function PaymentForm({
  email,
  setEmail,
  emailError,
  setEmailError,
  paymentIntentId,
  clientSecret,
  total,
  subtotal,
  bookQuantity,
  previousStep,
  nextStep,
  setPaymentInfo,
  updateStepData,
  isAddBookMode,
  existingUserId,
}: {
  email: string;
  setEmail: (v: string) => void;
  emailError: string;
  setEmailError: (v: string) => void;
  paymentIntentId: string;
  clientSecret: string;
  total: number;
  subtotal: number;
  bookQuantity: number;
  previousStep: () => void;
  nextStep: () => void;
  setPaymentInfo: (piId: string, cs: string) => void;
  updateStepData: (step: number, data: Record<string, unknown>) => Promise<void>;
  isAddBookMode: boolean;
  existingUserId?: string;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentError, setPaymentError] = useState("");

  const validateEmail = (val: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);

  const handleEmailBlur = () => {
    if (email.trim() && !validateEmail(email.trim())) {
      setEmailError("Please enter a valid email address");
    } else {
      setEmailError("");
    }
  };

  const handleSubmit = async () => {
    if (!stripe || !elements) return;
    if (!email.trim()) {
      setEmailError("Please enter your email address");
      return;
    }
    if (!validateEmail(email.trim())) {
      setEmailError("Please enter a valid email address");
      return;
    }

    setIsSubmitting(true);
    setPaymentError("");

    try {
      // Reason: Attach email to PI metadata before confirming so the webhook has it
      await fetch("/api/stripe/update-payment-intent", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentIntentId,
          clientSecret,
          metadata: {
            email: email.trim(),
            ...(isAddBookMode && existingUserId ? { existingUserId } : {}),
          },
        }),
      });

      // Save email to step 3 data
      await updateStepData(3, { email: email.trim() });

      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          receipt_email: email.trim(),
          return_url: `${window.location.origin}/order-confirmation?payment_intent=${paymentIntentId}`,
        },
        redirect: "if_required",
      });

      if (error) {
        setPaymentError(error.message || "Payment failed. Please try again.");
        setIsSubmitting(false);
        return;
      }

      // Payment succeeded without redirect — move to step 4
      nextStep();
    } catch {
      setPaymentError("Something went wrong. Please try again.");
      setIsSubmitting(false);
    }
  };

  const additionalCopies = bookQuantity - 1;

  return (
    <OnboardingStep
      stepNumber={3}
      totalSteps={3}
      title="Let's finish your order"
      imageUrl="/images/onboarding/onboarding_lemon.png"
      imageAlt="Checkout"
    >
      <div className="max-w-lg mx-auto mt-6">
        {/* Order summary */}
        <div className="mb-6 text-sm text-[#2D2D2D]/60">
          <div className="flex justify-between py-1">
            <span>The Book</span>
            <span>${BASE_BOOK_PRICE}</span>
          </div>
          {additionalCopies > 0 && (
            <div className="flex justify-between py-1">
              <span>{additionalCopies} additional {additionalCopies === 1 ? "copy" : "copies"}{additionalCopies >= 2 ? ` ($${ADDITIONAL_BOOK_PRICE} each)` : ""}</span>
              <span>${additionalCopies * ADDITIONAL_BOOK_PRICE}</span>
            </div>
          )}
          <div className="flex justify-between py-1">
            <span>Shipping</span>
            <span>${calculateShipping(bookQuantity, 'US')}</span>
          </div>
          <div className="border-t border-gray-200 mt-2 pt-2 flex justify-between text-[#2D2D2D] font-medium">
            <span>Total</span>
            <span>${total}</span>
          </div>
        </div>

        {/* Email field */}
        <div className="mb-4">
          <label htmlFor="payment-email" className="block text-sm font-medium text-[#2D2D2D] mb-1">
            Your email
          </label>
          <input
            id="payment-email"
            type="email"
            required
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (emailError) setEmailError("");
              if (paymentError) setPaymentError("");
            }}
            onBlur={handleEmailBlur}
            className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#D4A854] focus:border-transparent outline-none transition-all ${
              emailError ? "border-red-400" : "border-gray-300"
            }`}
            placeholder="your@email.com"
          />
          {emailError && (
            <p className="text-sm text-red-500 mt-1">{emailError}</p>
          )}
          <p className="text-xs text-[#2D2D2D]/50 mt-1.5">
            Receipt and login link will be sent here.
          </p>
        </div>

        {/* Stripe Payment Element */}
        <div className="mb-6">
          <PaymentElement
            options={{
              layout: "tabs",
            }}
          />
        </div>

        {(paymentError || emailError) && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{emailError || paymentError}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-between items-center mb-4">
          <button
            type="button"
            onClick={previousStep}
            className="px-6 py-3 text-gray-600 font-medium hover:text-gray-900 transition-colors"
          >
            Back
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!stripe || isSubmitting}
            className={`px-8 py-3 rounded-xl font-semibold transition-colors ${
              stripe && !isSubmitting
                ? "bg-[#2D2D2D] text-white hover:bg-[#1a1a1a]"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            {isSubmitting ? "Processing..." : `Purchase for $${total}`}
          </button>
        </div>

        <div className="flex items-center justify-center gap-2 text-xs text-[#2D2D2D]/40">
          <Lock className="w-3 h-3" />
          <span>Secure checkout powered by</span>
          <img src="/images/logo_svg/stripe_logo.png" alt="Stripe" className="h-4 opacity-40" />
        </div>
      </div>
    </OnboardingStep>
  );
}

/**
 * Main Gift Onboarding Page Component
 * Steps 1-3 visible in progress bar, step 4 is post-payment setup (no progress)
 */
function GiftOnboardingContent({ isAddBookMode }: { isAddBookMode: boolean }) {
  const { state } = useOnboarding();

  return (
    <div className="min-h-screen bg-white">
      {state.currentStep === 1 && (
        <DatePickerStep
          stepNumber={1}
          totalSteps={3}
          title="They&apos;re lucky to have you."
          question="When do you want to give the book?"
          hint={
            <span className="text-[13px] text-[#6B6560]">
              Bridal shower <span className="text-[#D4A854] mx-1">·</span> Rehearsal dinner <span className="text-[#D4A854] mx-1">·</span> Bachelor party <span className="text-[#D4A854] mx-1">·</span> Whenever feels right
            </span>
          }
          switchFlowText="Are you the couple getting married?"
          switchFlowHref="/onboarding"
          isAddBookMode={isAddBookMode}
        />
      )}
      {state.currentStep === 2 && <Step2Product isAddBookMode={isAddBookMode} />}
      {state.currentStep === 3 && <Step3Payment isAddBookMode={isAddBookMode} />}
      {state.currentStep === 4 && <PostPaymentSetup userType="gift_giver" />}
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
