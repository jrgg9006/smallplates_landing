"use client";

import React, { useState, useEffect, useRef } from "react";
import { OnboardingProvider, useOnboarding } from "@/lib/contexts/OnboardingContext";
import OnboardingStep from "@/components/onboarding/OnboardingStep";
import { ProductSelectionStep } from "@/components/onboarding/ProductSelectionStep";
import { DatePickerStep } from "@/components/onboarding/DatePickerStep";
import { Lock, ChevronDown, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { createSupabaseClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/contexts/AuthContext";
import {
  BASE_BOOK_PRICE,
  ADDITIONAL_BOOK_PRICE,
  calculateSubtotal,
  calculateShipping,
} from "@/lib/stripe/pricing";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
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
            canContinue ? "bg-[#D4A854] text-white hover:bg-[#c49b4a]" : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          Continue
        </button>
      </div>
    </OnboardingStep>
  );
}

/**
 * Step 4 — Review + Payment combined, embedded Stripe Elements.
 * Custom two-column shell: left = live order summary, right = payment.
 * Mobile: summary collapses to a <details> above the payment.
 */
function ReviewAndPaymentStep() {
  const { state, previousStep, nextStep, setPaymentInfo, updateStepData } = useOnboarding();
  const { user } = useAuth();

  // Reason: name + email are now collected on this same step (above the PaymentElement).
  // Rehydrate from saved answers if the user went back and forward. If the visitor is
  // logged in (returning customer buying their Nth book), pre-fill with their profile.
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

  const [clientSecret, setClientSecret] = useState<string | null>(state.clientSecret);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(state.paymentIntentId);
  const [isCreatingPI, setIsCreatingPI] = useState(false);
  const [piError, setPiError] = useState("");
  const piCreatedRef = useRef(false);

  const subtotal = calculateSubtotal(state.bookQuantity);
  const shipping = calculateShipping(state.bookQuantity, "US");

  const [promoCode, setPromoCode] = useState("");
  const [promoDiscount, setPromoDiscount] = useState<{
    code: string;
    discountAmount: number;
    discountPercent: number | null;
  } | null>(null);
  const [promoError, setPromoError] = useState("");
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);

  const discountAmount = promoDiscount?.discountAmount ?? 0;
  const total = subtotal - discountAmount + shipping;

  // Reason: If user went back and changed quantity, PI has stale amount.
  // On remount with existing PI, reset promo and sync PI amount.
  // If the saved PI is no longer valid (dev restart, Stripe mode reset, canceled),
  // the apply-promo-code call returns not-ok → we invalidate and force a new PI.
  const hadExistingPI = useRef(!!state.clientSecret);
  useEffect(() => {
    if (!hadExistingPI.current || !paymentIntentId || !clientSecret) return;
    hadExistingPI.current = false;
    setPromoCode("");
    setPromoDiscount(null);
    setPromoError("");
    fetch("/api/stripe/apply-promo-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        paymentIntentId,
        clientSecret,
        promoCode: "",
        bookQuantity: state.bookQuantity,
        userType: "gift_giver",
      }),
    })
      .then((res) => {
        if (!res.ok) {
          console.warn("Saved PaymentIntent is stale — clearing and creating a fresh one");
          setClientSecret(null);
          setPaymentIntentId(null);
          setPaymentInfo("", "");
          piCreatedRef.current = false;
        }
      })
      .catch(() => {
        setClientSecret(null);
        setPaymentIntentId(null);
        setPaymentInfo("", "");
        piCreatedRef.current = false;
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (clientSecret || piCreatedRef.current) return;
    piCreatedRef.current = true;
    setIsCreatingPI(true);

    const step1 = state.answers.step1 as {
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
        giftDate: step1?.gift_date || null,
        giftDateUndecided: step1?.gift_date_undecided || false,
        bookCloseDate: step1?.book_close_date || null,
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleApplyPromo = async () => {
    if (!promoCode.trim() || !paymentIntentId || !clientSecret) return;
    setIsApplyingPromo(true);
    setPromoError("");
    try {
      const res = await fetch("/api/stripe/apply-promo-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentIntentId,
          clientSecret,
          promoCode: promoCode.trim().toUpperCase(),
          bookQuantity: state.bookQuantity,
          userType: "gift_giver",
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setPromoError(data.error || "Invalid promotion code");
        setPromoDiscount(null);
      } else {
        setPromoDiscount({
          code: data.discountCode,
          discountAmount: data.discountAmount,
          discountPercent: data.discountPercent,
        });
        setPromoError("");
      }
    } catch {
      setPromoError("Failed to apply promotion code");
    } finally {
      setIsApplyingPromo(false);
    }
  };

  const handleRemovePromo = async () => {
    if (!paymentIntentId || !clientSecret) return;
    setIsApplyingPromo(true);
    try {
      await fetch("/api/stripe/apply-promo-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentIntentId,
          clientSecret,
          promoCode: "",
          bookQuantity: state.bookQuantity,
          userType: "gift_giver",
        }),
      });
    } catch {
      // Reason: Non-fatal — worst case PI still has old amount, user can retry
    } finally {
      setPromoCode("");
      setPromoDiscount(null);
      setPromoError("");
      setIsApplyingPromo(false);
    }
  };

  const summary = (
    <OrderSummaryPanel
      buyerName={buyerName}
      email={email}
      bookQuantity={state.bookQuantity}
      subtotal={subtotal}
      shipping={shipping}
      total={total}
      promoCode={promoCode}
      setPromoCode={setPromoCode}
      promoDiscount={promoDiscount}
      promoError={promoError}
      setPromoError={setPromoError}
      isApplyingPromo={isApplyingPromo}
      onApplyPromo={handleApplyPromo}
      onRemovePromo={handleRemovePromo}
      canApplyPromo={!!clientSecret}
    />
  );

  const right = isCreatingPI || !clientSecret ? (
    <div className="flex items-center justify-center py-16">
      {piError ? (
        <div className="text-center">
          <p className="text-red-600 mb-4">{piError}</p>
          <button onClick={previousStep} className="text-[#D4A854] hover:underline">
            Go back
          </button>
        </div>
      ) : (
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D4A854]" />
      )}
    </div>
  ) : (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: {
          theme: "stripe",
          variables: {
            colorPrimary: "#2D2D2D",
            colorBackground: "#FFFFFF",
            colorText: "#2D2D2D",
            borderRadius: "12px",
            // Reason: System stack. next/font's Inter can't cross into Stripe's iframe and
            // loading it via `fonts: [{cssSrc}]` has triggered loaderror with Google Fonts'
            // css2 URL. System fonts are visually close and 100% reliable.
            fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          },
          rules: {
            ".Input": { border: "1px solid #E8E0D5", boxShadow: "none", padding: "12px 16px" },
            ".Input:focus": { border: "1px solid #D4A854", boxShadow: "0 0 0 2px rgba(212, 168, 84, 0.2)" },
          },
        },
      }}
    >
      <PaymentForm
        email={email}
        setEmail={setEmail}
        buyerName={buyerName}
        setBuyerName={setBuyerName}
        emailError={emailError}
        setEmailError={setEmailError}
        paymentIntentId={paymentIntentId!}
        clientSecret={clientSecret!}
        total={total}
        previousStep={previousStep}
        nextStep={nextStep}
        persistStep3={(data) => updateStepData(3, data)}
        isReturningCustomer={isReturningCustomer}
      />
    </Elements>
  );

  return <Step4Shell summary={summary} total={total}>{right}</Step4Shell>;
}

/**
 * Two-column shell for Step 4. Left = summary (sticky on desktop, collapsible on mobile).
 * Right = payment form area.
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
          <span className="flex items-center gap-2 text-sm font-medium text-[#2D2D2D]">
            Order summary
            <ChevronDown className="w-4 h-4 transition-transform group-open:rotate-180" />
          </span>
          <span className="text-sm font-semibold text-[#2D2D2D]">${total}</span>
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

        {/* Right: progress + payment — vertically centered */}
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
                  ? "bg-white text-[#9A9590] border-2 border-[#D4A854]"
                  : isDone
                  ? "bg-[#D4A854] text-white"
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
  subtotal: number;
  shipping: number;
  total: number;
  promoCode: string;
  setPromoCode: (v: string) => void;
  promoDiscount: { code: string; discountAmount: number; discountPercent: number | null } | null;
  promoError: string;
  setPromoError: (v: string) => void;
  isApplyingPromo: boolean;
  onApplyPromo: () => void;
  onRemovePromo: () => void;
  canApplyPromo: boolean;
}

function OrderSummaryPanel({
  buyerName, email, bookQuantity, shipping, total,
  promoCode, setPromoCode, promoDiscount, promoError, setPromoError,
  isApplyingPromo, onApplyPromo, onRemovePromo, canApplyPromo,
}: OrderSummaryPanelProps) {
  const [showPromoInput, setShowPromoInput] = useState(false);
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
              <span className="text-[#2D2D2D] text-right">{buyerName}</span>
            </div>
          )}
          {email && (
            <div className="flex justify-between gap-3">
              <span className="text-[#9A9590]">Email</span>
              <span className="text-[#2D2D2D] text-right truncate min-w-0">{email}</span>
            </div>
          )}
        </div>
      )}

      {/* Line items */}
      <div className="text-[15px] space-y-4 mb-8 pb-8 border-b border-[#E8E0D5]/80">
        <div className="flex justify-between items-start gap-3">
          <div className="min-w-0">
            <div className="text-[#2D2D2D] leading-tight">The Book</div>
            <div className="text-xs text-[#9A9590] mt-0.5">Hardcover, 50 recipes</div>
          </div>
          <div className="text-[#2D2D2D] tabular-nums">${BASE_BOOK_PRICE}</div>
        </div>
        {additionalCopies > 0 && (
          <div className="flex justify-between items-start gap-3">
            <div className="min-w-0">
              <div className="text-[#2D2D2D] leading-tight">
                {additionalCopies} extra {additionalCopies === 1 ? "copy" : "copies"}
              </div>
              <div className="text-xs text-[#9A9590] mt-0.5">${ADDITIONAL_BOOK_PRICE} each</div>
            </div>
            <div className="text-[#2D2D2D] tabular-nums">${additionalCopies * ADDITIONAL_BOOK_PRICE}</div>
          </div>
        )}
        <div className="flex justify-between items-center">
          <span className="text-[#9A9590]">Shipping</span>
          <span className={shipping > 0 ? "text-[#2D2D2D] tabular-nums" : "text-[#9A9590]"}>
            {shipping > 0 ? `$${shipping}` : "Included"}
          </span>
        </div>
        {promoDiscount && (
          <div className="flex justify-between items-center text-emerald-700">
            <span className="flex items-center gap-1.5">
              <span className="text-xs uppercase tracking-wide">{promoDiscount.code}</span>
              <button
                type="button"
                onClick={onRemovePromo}
                className="text-[#9A9590] hover:text-[#2D2D2D] leading-none"
                disabled={isApplyingPromo}
                aria-label="Remove promo code"
              >
                &times;
              </button>
            </span>
            <span className="tabular-nums">-${promoDiscount.discountAmount}</span>
          </div>
        )}
      </div>

      {/* Total */}
      <div className="flex justify-between items-baseline mb-8">
        <span className="text-[#2D2D2D]/70 text-[15px]">Total</span>
        <span className="text-[#2D2D2D] font-serif font-semibold text-[32px] tabular-nums leading-none">${total}</span>
      </div>

      {/* Promo code */}
      <div>
        {!promoDiscount && !showPromoInput && (
          <button
            type="button"
            onClick={() => setShowPromoInput(true)}
            className="text-xs text-[#9A9590] hover:text-[#2D2D2D] transition-colors"
            disabled={!canApplyPromo}
          >
            Have a promotion code?
          </button>
        )}
        {!promoDiscount && showPromoInput && (
          <div>
            <div className="flex gap-2">
              <input
                type="text"
                value={promoCode}
                onChange={(e) => {
                  setPromoCode(e.target.value);
                  if (promoError) setPromoError("");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    onApplyPromo();
                  }
                }}
                placeholder="Code"
                autoFocus
                className="flex-1 px-3 py-2 border border-[#E8E0D5] rounded-lg text-sm focus:ring-2 focus:ring-[#D4A854] focus:border-transparent outline-none bg-white"
                disabled={!canApplyPromo}
              />
              <button
                type="button"
                onClick={onApplyPromo}
                disabled={!promoCode.trim() || isApplyingPromo || !canApplyPromo}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  promoCode.trim() && !isApplyingPromo && canApplyPromo
                    ? "bg-[#2D2D2D] text-white hover:bg-[#1a1a1a]"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }`}
              >
                {isApplyingPromo ? "..." : "Apply"}
              </button>
            </div>
            {promoError && <p className="text-sm text-red-500 mt-1">{promoError}</p>}
          </div>
        )}
      </div>
    </div>
  );
}

interface PaymentFormProps {
  email: string;
  setEmail: (v: string) => void;
  buyerName: string;
  setBuyerName: (v: string) => void;
  emailError: string;
  setEmailError: (v: string) => void;
  paymentIntentId: string;
  clientSecret: string;
  total: number;
  previousStep: () => void;
  nextStep: () => void;
  persistStep3: (data: { buyerName: string; email: string }) => Promise<void>;
  isReturningCustomer?: boolean;
}

function PaymentForm({
  email, setEmail, buyerName, setBuyerName, emailError, setEmailError,
  paymentIntentId, clientSecret, total, previousStep, nextStep, persistStep3,
  isReturningCustomer,
}: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAutoLoggingIn, setIsAutoLoggingIn] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  // Reason: Atomic double-click guard. `isSubmitting` state update is async — a second
  // click can slip through before React re-renders. This ref blocks immediately.
  const submittingRef = useRef(false);

  const validateEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  // Reason: F1 — if returning customer has no name in profile, let them type one.
  // Lock name only if we actually have a value to show.
  const isNameLocked = !!isReturningCustomer && buyerName.trim() !== "";
  const isEmailLocked = !!isReturningCustomer;
  const canSubmit = !!stripe && !isSubmitting && buyerName.trim() !== "" && validateEmail(email.trim());

  const handleEmailBlur = () => {
    if (email.trim() && !validateEmail(email.trim())) setEmailError("Please enter a valid email address");
    else setEmailError("");
  };

  const handleSubmit = async () => {
    if (submittingRef.current) return;
    if (!stripe || !elements) return;
    if (!buyerName.trim()) return;
    if (!validateEmail(email.trim())) {
      setEmailError("Please enter a valid email address");
      return;
    }

    submittingRef.current = true;
    setIsSubmitting(true);
    setPaymentError("");

    try {
      // Reason: Persist so going back to edit name/email doesn't lose them.
      await persistStep3({ buyerName: buyerName.trim(), email: email.trim() });

      // Reason: Push buyerName + email to PI metadata so the webhook can read them.
      await fetch("/api/stripe/update-payment-intent", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentIntentId,
          clientSecret,
          metadata: { email: email.trim(), buyerName: buyerName.trim() },
        }),
      });

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

      // Reason: Happy path — auto-login the buyer and drop them on the dashboard
      // directly, instead of asking them to "check your email". The webhook still
      // runs in parallel and sends the magic-link email as a backup.
      setIsAutoLoggingIn(true);
      try {
        const loginRes = await fetch("/api/stripe/post-payment-login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            paymentIntentId,
            email: email.trim(),
            buyerName: buyerName.trim(),
          }),
        });
        const loginData = await loginRes.json().catch(() => ({}));

        if (loginRes.ok) {
          // Reason: A returning customer is already authenticated. Calling verifyOtp
          // with a magic link for the same email triggers Supabase's anti-replay guard
          // and returns 403 "Email link is invalid or has expired". Just navigate —
          // their existing session is preserved and the new book is on their account.
          if (isReturningCustomer) {
            router.push("/profile/groups");
            return;
          }
          if (loginData?.tokenHash) {
            const supabase = createSupabaseClient();
            const { error: otpError } = await supabase.auth.verifyOtp({
              token_hash: loginData.tokenHash,
              type: "magiclink",
            });
            if (!otpError) {
              router.push("/profile/groups");
              return;
            }
            console.error("Auto-login verifyOtp failed:", otpError);
          }
        } else {
          console.error("post-payment-login failed:", loginData);
        }
      } catch (err) {
        console.error("Auto-login network error:", err);
      }

      // Reason: Fallback — show the CheckEmail screen; the webhook email is on its way.
      setIsAutoLoggingIn(false);
      nextStep();
    } catch {
      setPaymentError("Something went wrong. Please try again.");
      setIsSubmitting(false);
      setIsAutoLoggingIn(false);
      submittingRef.current = false;
    }
  };

  return (
    <div>
      {/* Name + email — collected here so we can push them to PI metadata before confirming.
          If the buyer is logged in, lock both fields to their account so the book unambiguously
          goes on their profile. To buy with a different email they must log out first. */}
      <div className="space-y-3 mb-6">
        {isReturningCustomer && (
          <div className="rounded-xl bg-[#FAF7F2] border border-[#E8E0D5] px-4 py-3">
            <p className="text-[13px] text-[#5A5550] leading-relaxed">
              This book will be added to your account —{" "}
              <span className="text-[#2D2D2D] font-medium">{email}</span>. To buy with a different email,{" "}
              <button
                type="button"
                onClick={async () => {
                  const supabase = createSupabaseClient();
                  await supabase.auth.signOut();
                  router.replace("/onboarding");
                }}
                className="underline decoration-dotted underline-offset-2 hover:text-[#2D2D2D]"
              >
                log out
              </button>
              .
            </p>
          </div>
        )}
        <div>
          <label htmlFor="buyer-name" className="block text-sm font-medium text-[#2D2D2D] mb-1.5">
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
                : "bg-white focus:ring-2 focus:ring-[#D4A854] focus:border-transparent"
            }`}
            placeholder="Your name"
            autoComplete="name"
          />
        </div>
        <div>
          <label htmlFor="buyer-email" className="block text-sm font-medium text-[#2D2D2D] mb-1.5">
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
                : `bg-white focus:ring-2 focus:ring-[#D4A854] focus:border-transparent ${
                    emailError ? "border-red-400" : "border-[#E8E0D5]"
                  }`
            }`}
            placeholder="your@email.com"
            autoComplete="email"
          />
          {emailError && !isEmailLocked && <p className="text-sm text-red-500 mt-1">{emailError}</p>}
        </div>
      </div>

      <div className="mb-6">
        <PaymentElement options={{ layout: "tabs" }} />
      </div>

      {paymentError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{paymentError}</p>
        </div>
      )}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={!canSubmit}
        className={`w-full px-8 py-3.5 rounded-xl font-semibold transition-colors ${
          canSubmit ? "bg-[#2D2D2D] text-white hover:bg-[#1a1a1a]" : "bg-gray-300 text-gray-500 cursor-not-allowed"
        }`}
      >
        {isAutoLoggingIn ? "Setting up your book..." : isSubmitting ? "Processing..." : `Purchase for $${total}`}
      </button>

      <button
        type="button"
        onClick={previousStep}
        className="w-full mt-3 px-6 py-3 text-gray-600 font-medium hover:text-gray-900 transition-colors"
      >
        Back
      </button>

      <div className="flex items-center justify-center gap-2 text-xs text-[#2D2D2D]/40 mt-6">
        <Lock className="w-3 h-3" />
        <span>Secure checkout powered by</span>
        <img src="/images/logo_svg/stripe_logo.png" alt="Stripe" className="h-4 opacity-40" />
      </div>
    </div>
  );
}

/**
 * Post-payment confirmation — user waits for the magic link email.
 */
function CheckEmailStep() {
  const { state } = useOnboarding();
  const step3 = (state.answers.step3 as { email?: string } | undefined) || {};

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6 py-16">
      <div className="max-w-md w-full text-center">
        <h1 className="type-display mb-4">Payment received.</h1>
        <p className="type-body text-[#5A5550] mb-2">
          We sent a login link to <span className="text-[#2D2D2D] font-medium">{step3.email || "your inbox"}</span>.
        </p>
        <p className="type-body-small text-[#9A9590]">
          Open it to finish setting up your book.
        </p>
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
      {state.currentStep > 3 && <CheckEmailStep />}
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
