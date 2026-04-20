"use client";

import React, { useState, useEffect } from "react";
import { OnboardingProvider, useOnboarding } from "@/lib/contexts/OnboardingContext";
import OnboardingStep from "@/components/onboarding/OnboardingStep";
import { ProductSelectionStep } from "@/components/onboarding/ProductSelectionStep";
import { DatePickerStep } from "@/components/onboarding/DatePickerStep";
import { Lock, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/contexts/AuthContext";
import {
  BASE_BOOK_PRICE,
  ADDITIONAL_BOOK_PRICE,
  calculateSubtotal,
} from "@/lib/stripe/pricing";

const TOTAL_STEPS = 3;

/**
 * Step 2 — Product Selection (quantity)
 */
function ProductStep() {
  const { nextStep, previousStep, updateBookSelection, state } = useOnboarding();
  const canContinue = state.bookQuantity >= 1;

  return (
    <OnboardingStep
      stepNumber={2}
      totalSteps={TOTAL_STEPS}
      title="How many copies?"
      imageUrl="/images/onboarding/onboarding_lemon.png"
      imageAlt="Product selection"
    >
      <ProductSelectionStep
        bookQuantity={state.bookQuantity}
        shippingCountry={state.shippingCountry}
        onUpdateQuantity={(qty) => updateBookSelection(qty, state.shippingCountry || "US")}
        onUpdateCountry={(country) => updateBookSelection(state.bookQuantity, country)}
      />

      <div className="flex justify-between mt-8">
        <button type="button" onClick={previousStep} className="px-6 py-3 text-gray-600 font-medium hover:text-gray-900 transition-colors">
          Back
        </button>
        <button
          type="button"
          onClick={nextStep}
          disabled={!canContinue}
          className={`px-8 py-3 rounded-xl font-semibold transition-colors ${
            canContinue ? "bg-brand-honey text-white hover:bg-[#c49b4a]" : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          Continue
        </button>
      </div>
    </OnboardingStep>
  );
}

/**
 * Step 3 — Review + "Continue to payment".
 *
 * Collects name + email, then redirects to Stripe Checkout hosted via
 * `/api/stripe/create-checkout-session`. Stripe handles card entry,
 * Apple Pay/Google Pay/Link, and promo codes natively on their page.
 * Post-payment processing happens via the checkout.session.completed
 * webhook; this component never sees the PaymentIntent.
 */
function ReviewAndPaymentStep() {
  const { state, previousStep, updateStepData } = useOnboarding();
  const { user } = useAuth();
  const router = useRouter();

  // Reason: name + email are collected here. Rehydrate from saved answers if
  // the user went back and forth. If the visitor is logged in (returning
  // customer buying their Nth book), pre-fill with their profile.
  const savedStep3 = (state.answers.step3 as { buyerName?: string; email?: string } | undefined) || {};
  const [buyerName, setBuyerName] = useState(savedStep3.buyerName || "");
  const [email, setEmail] = useState(savedStep3.email || "");
  const [emailError, setEmailError] = useState("");
  const [isReturningCustomer, setIsReturningCustomer] = useState(false);

  // Reason: Pre-fill from the authenticated user's profile. Runs once when user resolves.
  useEffect(() => {
    if (!user) return;
    setIsReturningCustomer(true);
    if (!buyerName && !savedStep3.buyerName) {
      const metaName =
        (user.user_metadata?.full_name as string | undefined) ||
        (user.user_metadata?.name as string | undefined) ||
        "";
      if (metaName) setBuyerName(metaName);
    }
    if (!email && !savedStep3.email && user.email) {
      setEmail(user.email);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const [isRedirectingToCheckout, setIsRedirectingToCheckout] = useState(false);
  const [redirectError, setRedirectError] = useState("");

  const subtotal = calculateSubtotal(state.bookQuantity);
  const total = subtotal;

  const validateEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  // Reason: If returning customer has no name in profile, let them type one.
  // Lock name only if we actually have a value to show.
  const isNameLocked = !!isReturningCustomer && buyerName.trim() !== "";
  const isEmailLocked = !!isReturningCustomer;
  const canSubmit =
    !isRedirectingToCheckout &&
    buyerName.trim() !== "" &&
    validateEmail(email.trim());

  const handleEmailBlur = () => {
    if (email.trim() && !validateEmail(email.trim())) {
      setEmailError("Please enter a valid email address");
    } else {
      setEmailError("");
    }
  };

  const handleContinueToPayment = async () => {
    if (!buyerName.trim()) return;
    if (!validateEmail(email.trim())) {
      setEmailError("Please enter a valid email address");
      return;
    }

    setRedirectError("");
    setIsRedirectingToCheckout(true);

    try {
      // Reason: Persist so going back to edit name/email doesn't lose them.
      await updateStepData(3, { buyerName: buyerName.trim(), email: email.trim().toLowerCase() });

      const step1 = state.answers.step1 as {
        gift_date?: string | null;
        gift_date_undecided?: boolean;
        book_close_date?: string | null;
      } | undefined;

      const response = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookQuantity: state.bookQuantity,
          userType: "gift_giver",
          giftDate: step1?.gift_date ?? null,
          giftDateUndecided: step1?.gift_date_undecided === true,
          bookCloseDate: step1?.book_close_date,
          email: email.trim().toLowerCase(),
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.url) {
        console.error("create-checkout-session failed:", data);
        setRedirectError(
          data?.error || "Could not start checkout. Please try again."
        );
        setIsRedirectingToCheckout(false);
        return;
      }

      window.location.href = data.url;
    } catch (err) {
      console.error("handleContinueToPayment error:", err);
      setRedirectError("Could not start checkout. Please try again.");
      setIsRedirectingToCheckout(false);
    }
  };

  const summary = (
    <OrderSummaryPanel
      buyerName={buyerName}
      email={email}
      bookQuantity={state.bookQuantity}
      total={total}
    />
  );

  const right = (
    <div>
      {/* Name + email — collected here so we can pass email to the Checkout
          Session and persist name into step3 answers for the webhook to read.
          If the buyer is logged in, lock both fields to their account so the
          book unambiguously goes on their profile. To buy with a different
          email they must log out first. */}
      <div className="space-y-3 mb-6">
        {isReturningCustomer && (
          <div className="rounded-xl bg-[#FAF7F2] border border-[#E8E0D5] px-4 py-3">
            <p className="text-[13px] text-[#5A5550] leading-relaxed">
              This book will be added to your account —{" "}
              <span className="text-brand-charcoal font-medium">{email}</span>. To buy with a different email,{" "}
              <button
                type="button"
                onClick={async () => {
                  const supabase = createSupabaseClient();
                  await supabase.auth.signOut();
                  router.replace("/onboarding");
                }}
                className="underline decoration-dotted underline-offset-2 hover:text-brand-charcoal"
              >
                log out
              </button>
              .
            </p>
          </div>
        )}
        <div>
          <label htmlFor="buyer-name" className="block text-sm font-medium text-brand-charcoal mb-1.5">
            Your name
          </label>
          <input
            id="buyer-name"
            type="text"
            value={buyerName}
            onChange={(e) => !isNameLocked && setBuyerName(e.target.value)}
            readOnly={isNameLocked}
            style={{ fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", fontSize: "15px" }}
            className={`w-full px-4 py-3 border border-[#E8E0D5] rounded-xl outline-none ${
              isNameLocked
                ? "bg-[#F5F1EA] text-[#5A5550] cursor-not-allowed"
                : "bg-white focus:ring-2 focus:ring-brand-honey focus:border-transparent"
            }`}
            placeholder="Your name"
            autoComplete="name"
          />
        </div>
        <div>
          <label htmlFor="buyer-email" className="block text-sm font-medium text-brand-charcoal mb-1.5">
            Your email
          </label>
          <input
            id="buyer-email"
            type="email"
            value={email}
            onChange={(e) => {
              if (isEmailLocked) return;
              setEmail(e.target.value);
              if (emailError) setEmailError("");
            }}
            onBlur={handleEmailBlur}
            readOnly={isEmailLocked}
            style={{ fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", fontSize: "15px" }}
            className={`w-full px-4 py-3 border rounded-xl outline-none ${
              isEmailLocked
                ? "bg-[#F5F1EA] text-[#5A5550] cursor-not-allowed border-[#E8E0D5]"
                : `bg-white focus:ring-2 focus:ring-brand-honey focus:border-transparent ${
                    emailError ? "border-red-400" : "border-[#E8E0D5]"
                  }`
            }`}
            placeholder="your@email.com"
            autoComplete="email"
          />
          {emailError && !isEmailLocked && <p className="text-sm text-red-500 mt-1">{emailError}</p>}
        </div>
      </div>

      {redirectError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{redirectError}</p>
        </div>
      )}

      <button
        type="button"
        onClick={handleContinueToPayment}
        disabled={!canSubmit}
        className={`w-full px-8 py-3.5 rounded-xl font-semibold transition-colors ${
          canSubmit ? "bg-brand-charcoal text-white hover:bg-[#1a1a1a]" : "bg-gray-300 text-gray-500 cursor-not-allowed"
        }`}
      >
        {isRedirectingToCheckout ? "Redirecting…" : "Continue to payment →"}
      </button>

      <button
        type="button"
        onClick={previousStep}
        disabled={isRedirectingToCheckout}
        className="w-full mt-3 px-6 py-3 text-gray-600 font-medium hover:text-gray-900 transition-colors disabled:opacity-50"
      >
        Back
      </button>

      <div className="flex items-center justify-center gap-2 text-xs text-brand-charcoal/40 mt-6">
        <Lock className="w-3 h-3" />
        <span>Secure checkout powered by</span>
        <img src="/images/logo_svg/stripe_logo.png" alt="Stripe" className="h-4 opacity-40" />
      </div>
    </div>
  );

  return <Step4Shell summary={summary} total={total}>{right}</Step4Shell>;
}

/**
 * Two-column shell for Step 3. Left = summary (sticky on desktop, collapsible on mobile).
 * Right = name/email + Continue-to-payment area.
 */
function Step4Shell({ summary, total, children }: { summary: React.ReactNode; total: number; children: React.ReactNode }) {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white">
      <button
        onClick={() => router.push("/")}
        className="fixed top-4 right-4 z-50 text-gray-600 hover:text-gray-900 transition-colors"
        aria-label="Close onboarding"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Mobile: summary collapsible above payment */}
      <details className="lg:hidden group border-b border-[#E8E0D5] bg-[#FAF7F2] [&_summary::-webkit-details-marker]:hidden">
        <summary className="px-6 py-4 flex justify-between items-center cursor-pointer list-none">
          <span className="flex items-center gap-2 text-sm font-medium text-brand-charcoal">
            Order summary
          </span>
          <span className="text-sm font-semibold text-brand-charcoal">${total}</span>
        </summary>
        <div className="px-6 pb-6">{summary}</div>
      </details>

      <div className="lg:grid lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:min-h-screen">
        {/* Desktop left: sticky summary — vertically centered */}
        <aside className="hidden lg:block bg-[#FAF7F2]">
          <div className="sticky top-0 min-h-screen flex items-center">
            <div className="w-full max-w-[440px] mx-auto px-8 py-16">
              {summary}
            </div>
          </div>
        </aside>

        {/* Right: progress + form — vertically centered */}
        <main className="px-6 py-10 lg:px-14 xl:px-20 lg:py-16 w-full lg:min-h-screen lg:flex lg:items-center">
          <div className="w-full max-w-md mx-auto">
            <ProgressBar step={3} total={TOTAL_STEPS} />
            <h1 className="font-serif text-2xl md:text-3xl font-semibold text-gray-900 text-center mb-10">
              Almost there.
            </h1>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

function ProgressBar({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {Array.from({ length: total }, (_, i) => {
        const n = i + 1;
        const isActive = n === step;
        const isDone = n < step;
        return (
          <div key={n} className="flex items-center">
            <div
              className={`w-6 h-6 lg:w-8 lg:h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                isActive
                  ? "bg-white text-[#9A9590] border-2 border-brand-honey"
                  : isDone
                  ? "bg-brand-honey text-white"
                  : "bg-white text-gray-400 border border-gray-200"
              }`}
              aria-current={isActive ? "step" : undefined}
            >
              {isDone ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                n
              )}
            </div>
            {n < total && <div className="w-8 lg:w-12 h-0.5 mx-1 bg-gray-200" />}
          </div>
        );
      })}
    </div>
  );
}

interface OrderSummaryPanelProps {
  buyerName: string;
  email: string;
  bookQuantity: number;
  total: number;
}

function OrderSummaryPanel({
  buyerName, email, bookQuantity, total,
}: OrderSummaryPanelProps) {
  const additionalCopies = bookQuantity - 1;

  return (
    <div>
      <p className="type-eyebrow mb-8 text-[#9A9590] tracking-widest text-[12px]">Order summary</p>

      {/* Buyer info */}
      {(buyerName || email) && (
        <div className="text-[15px] space-y-2.5 mb-8 pb-8 border-b border-[#E8E0D5]/80">
          {buyerName && (
            <div className="flex justify-between gap-3">
              <span className="text-[#9A9590]">Name</span>
              <span className="text-brand-charcoal text-right">{buyerName}</span>
            </div>
          )}
          {email && (
            <div className="flex justify-between gap-3">
              <span className="text-[#9A9590]">Email</span>
              <span className="text-brand-charcoal text-right truncate min-w-0">{email}</span>
            </div>
          )}
        </div>
      )}

      {/* Line items */}
      <div className="text-[15px] space-y-4 mb-8 pb-8 border-b border-[#E8E0D5]/80">
        <div className="flex justify-between items-start gap-3">
          <div className="min-w-0">
            <div className="text-brand-charcoal leading-tight">The Book</div>
            <div className="text-xs text-[#9A9590] mt-0.5">Hardcover, 50 recipes</div>
          </div>
          <div className="text-brand-charcoal tabular-nums">${BASE_BOOK_PRICE}</div>
        </div>
        {additionalCopies > 0 && (
          <div className="flex justify-between items-start gap-3">
            <div className="min-w-0">
              <div className="text-brand-charcoal leading-tight">
                {additionalCopies} extra {additionalCopies === 1 ? "copy" : "copies"}
              </div>
              <div className="text-xs text-[#9A9590] mt-0.5">${ADDITIONAL_BOOK_PRICE} each</div>
            </div>
            <div className="text-brand-charcoal tabular-nums">${additionalCopies * ADDITIONAL_BOOK_PRICE}</div>
          </div>
        )}
        <div className="flex justify-between items-center">
          <span className="text-[#9A9590]">Shipping</span>
          <span className="text-[#9A9590]">Included</span>
        </div>
      </div>

      {/* Total */}
      <div className="flex justify-between items-baseline">
        <span className="text-brand-charcoal/70 text-[15px]">Total</span>
        <span className="text-brand-charcoal font-serif font-semibold text-[32px] tabular-nums leading-none">${total}</span>
      </div>
    </div>
  );
}

function OnboardingContent() {
  const { state } = useOnboarding();

  return (
    <div className="min-h-screen bg-white">
      {state.currentStep === 1 && (
        <DatePickerStep
          stepNumber={1}
          totalSteps={TOTAL_STEPS}
          title="Let&apos;s make the book."
          question="When do you want to give the book?"
          hint="Most people have it ready a few weeks before the wedding."
        />
      )}
      {state.currentStep === 2 && <ProductStep />}
      {state.currentStep === 3 && <ReviewAndPaymentStep />}
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <OnboardingProvider userType="gift_giver">
      <OnboardingContent />
    </OnboardingProvider>
  );
}
