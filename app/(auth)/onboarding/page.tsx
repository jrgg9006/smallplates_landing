"use client";

import React, { useState, useEffect, useRef } from "react";
import { OnboardingProvider, useOnboarding } from "@/lib/contexts/OnboardingContext";
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
function Step2() {
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

      <div className="flex justify-between mt-8">
        <button type="button" onClick={previousStep} className="px-6 py-3 text-gray-600 font-medium hover:text-gray-900 transition-colors">Back</button>
        <button
          type="button"
          onClick={nextStep}
          disabled={!canContinue}
          className={`px-8 py-3 rounded-xl font-semibold transition-colors ${canContinue ? "bg-[#D4A854] text-white hover:bg-[#c49b4a]" : "bg-gray-300 text-gray-500 cursor-not-allowed"}`}
        >
          Continue
        </button>
      </div>
    </OnboardingStep>
  );
}

/**
 * Step 3 — Payment with embedded Stripe Elements
 */
function Step3Payment() {
  const { state, previousStep, nextStep, setPaymentInfo, updateStepData } = useOnboarding();

  const [clientSecret, setClientSecret] = useState<string | null>(state.clientSecret);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(state.paymentIntentId);
  const [isCreatingPI, setIsCreatingPI] = useState(false);
  const [piError, setPiError] = useState("");
  const piCreatedRef = useRef(false);

  const savedEmail = (state.answers.step3 as { email?: string } | undefined)?.email || "";
  const [email, setEmail] = useState(savedEmail);
  const [emailError, setEmailError] = useState("");

  const subtotal = calculateSubtotal(state.bookQuantity);
  const shipping = calculateShipping(state.bookQuantity, 'US');

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

  // Reason: If user went back to Step 2 and changed quantity, PI has stale amount.
  // On remount with existing PI, reset promo and sync PI amount.
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
        userType: "couple",
      }),
    }).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        userType: "couple",
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isCreatingPI || !clientSecret) {
    return (
      <OnboardingStep stepNumber={3} totalSteps={3} title="Let's finish your order" imageUrl="/images/onboarding/onboarding_lemon.png" imageAlt="Checkout">
        <div className="flex items-center justify-center py-16">
          {piError ? (
            <div className="text-center">
              <p className="text-red-600 mb-4">{piError}</p>
              <button onClick={previousStep} className="text-[#D4A854] hover:underline">Go back</button>
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
          variables: { colorPrimary: "#2D2D2D", colorBackground: "#F5F5F5", colorText: "#2D2D2D", borderRadius: "12px", fontFamily: "system-ui, -apple-system, sans-serif" },
          rules: {
            ".Input": { border: "1px solid #E5E7EB", boxShadow: "none", padding: "12px 16px" },
            ".Input:focus": { border: "1px solid #D4A854", boxShadow: "0 0 0 2px rgba(212, 168, 84, 0.2)" },
          },
        },
      }}
    >
      <CouplePaymentForm
        email={email}
        setEmail={setEmail}
        emailError={emailError}
        setEmailError={setEmailError}
        paymentIntentId={paymentIntentId!}
        clientSecret={clientSecret!}
        total={total}
        subtotal={subtotal}
        shipping={shipping}
        bookQuantity={state.bookQuantity}
        previousStep={previousStep}
        nextStep={nextStep}
        updateStepData={updateStepData}
        promoCode={promoCode}
        setPromoCode={setPromoCode}
        promoDiscount={promoDiscount}
        setPromoDiscount={setPromoDiscount}
        promoError={promoError}
        setPromoError={setPromoError}
        isApplyingPromo={isApplyingPromo}
        setIsApplyingPromo={setIsApplyingPromo}
      />
    </Elements>
  );
}

function CouplePaymentForm({
  email, setEmail, emailError, setEmailError,
  paymentIntentId, clientSecret, total, subtotal, shipping, bookQuantity,
  previousStep, nextStep, updateStepData,
  promoCode, setPromoCode, promoDiscount, setPromoDiscount,
  promoError, setPromoError, isApplyingPromo, setIsApplyingPromo,
}: {
  email: string; setEmail: (v: string) => void;
  emailError: string; setEmailError: (v: string) => void;
  paymentIntentId: string; clientSecret: string; total: number; subtotal: number; shipping: number; bookQuantity: number;
  previousStep: () => void; nextStep: () => void;
  updateStepData: (step: number, data: Record<string, unknown>) => Promise<void>;
  promoCode: string; setPromoCode: (v: string) => void;
  promoDiscount: { code: string; discountAmount: number; discountPercent: number | null } | null;
  setPromoDiscount: (v: { code: string; discountAmount: number; discountPercent: number | null } | null) => void;
  promoError: string; setPromoError: (v: string) => void;
  isApplyingPromo: boolean; setIsApplyingPromo: (v: boolean) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [showPromoInput, setShowPromoInput] = useState(false);

  const validateEmail = (val: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;
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
          bookQuantity,
          userType: "couple",
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
    setIsApplyingPromo(true);
    try {
      await fetch("/api/stripe/apply-promo-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentIntentId,
          clientSecret,
          promoCode: "",
          bookQuantity,
          userType: "couple",
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

  const handleEmailBlur = () => {
    if (email.trim() && !validateEmail(email.trim())) setEmailError("Please enter a valid email address");
    else setEmailError("");
  };

  const handleSubmit = async () => {
    if (!stripe || !elements) return;
    if (!email.trim()) { setEmailError("Please enter your email address"); return; }
    if (!validateEmail(email.trim())) { setEmailError("Please enter a valid email address"); return; }

    setIsSubmitting(true);
    setPaymentError("");

    try {
      await fetch("/api/stripe/update-payment-intent", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentIntentId, clientSecret, metadata: { email: email.trim() } }),
      });

      await updateStepData(3, { email: email.trim() });

      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          receipt_email: email.trim(),
          return_url: `${window.location.origin}/order-confirmation?payment_intent=${paymentIntentId}`,
        },
        redirect: "if_required",
      });

      if (error) { setPaymentError(error.message || "Payment failed. Please try again."); setIsSubmitting(false); return; }
      nextStep();
    } catch {
      setPaymentError("Something went wrong. Please try again.");
      setIsSubmitting(false);
    }
  };

  const additionalCopies = bookQuantity - 1;

  return (
    <OnboardingStep stepNumber={3} totalSteps={3} title="Let's finish your order" imageUrl="/images/onboarding/onboarding_lemon.png" imageAlt="Checkout">
      <div className="max-w-lg mx-auto mt-6">
        <div className="mb-4 text-sm text-[#2D2D2D]/60">
          <div className="flex justify-between py-1"><span>The Book</span><span>${BASE_BOOK_PRICE}</span></div>
          {additionalCopies > 0 && (
            <div className="flex justify-between py-1">
              <span>{additionalCopies} additional {additionalCopies === 1 ? "copy" : "copies"}{additionalCopies >= 2 ? ` ($${ADDITIONAL_BOOK_PRICE} each)` : ""}</span>
              <span>${additionalCopies * ADDITIONAL_BOOK_PRICE}</span>
            </div>
          )}
          <div className="flex justify-between py-1"><span>Shipping</span><span>{shipping > 0 ? `$${shipping}` : "Included"}</span></div>
          {promoDiscount && (
            <div className="flex justify-between py-1 text-emerald-600">
              <span className="flex items-center gap-1">
                Discount ({promoDiscount.code})
                <button type="button" onClick={handleRemovePromo} className="text-xs text-[#2D2D2D]/40 hover:text-[#2D2D2D]/70 ml-1" disabled={isApplyingPromo}>&times;</button>
              </span>
              <span>-${promoDiscount.discountAmount}</span>
            </div>
          )}
          <div className="border-t border-gray-200 mt-2 pt-2 flex justify-between text-[#2D2D2D] font-medium"><span>Total</span><span>${total}</span></div>
        </div>

        <div className="mb-4">
          <label htmlFor="couple-email" className="block text-sm font-medium text-[#2D2D2D] mb-1">Your email</label>
          <input id="couple-email" type="email" required value={email}
            onChange={(e) => { setEmail(e.target.value); if (emailError) setEmailError(""); if (paymentError) setPaymentError(""); }}
            onBlur={handleEmailBlur}
            className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#D4A854] focus:border-transparent outline-none transition-all ${emailError ? "border-red-400" : "border-gray-300"}`}
            placeholder="your@email.com" />
          {emailError && <p className="text-sm text-red-500 mt-1">{emailError}</p>}
          <p className="text-xs text-[#2D2D2D]/50 mt-1.5">Receipt and login link will be sent here.</p>
        </div>

        <div className="mb-4"><PaymentElement options={{ layout: "tabs" }} /></div>

        {/* Promotion code — hidden behind toggle, below payment fields */}
        <div className="mb-4">
          {promoDiscount ? (
            <div className="flex items-center justify-between text-sm text-emerald-600">
              <span>Code {promoDiscount.code} applied ({promoDiscount.discountPercent ? `${promoDiscount.discountPercent}% off` : `-$${promoDiscount.discountAmount}`})</span>
              <button type="button" onClick={handleRemovePromo} className="text-sm text-[#2D2D2D]/40 hover:text-[#2D2D2D]/70" disabled={isApplyingPromo}>&times;</button>
            </div>
          ) : !showPromoInput ? (
            <button
              type="button"
              onClick={() => setShowPromoInput(true)}
              className="text-sm text-[#2D2D2D]/50 hover:text-[#2D2D2D]/80 transition-colors"
            >
              Have a referral or promotion code?
            </button>
          ) : (
            <div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => { setPromoCode(e.target.value); if (promoError) setPromoError(""); }}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleApplyPromo(); } }}
                  placeholder="Enter code"
                  autoFocus
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#D4A854] focus:border-transparent outline-none"
                />
                <button
                  type="button"
                  onClick={handleApplyPromo}
                  disabled={!promoCode.trim() || isApplyingPromo}
                  className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    promoCode.trim() && !isApplyingPromo
                      ? "bg-[#F5F5F5] text-[#2D2D2D] hover:bg-gray-200 border border-gray-300"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
                  }`}
                >
                  {isApplyingPromo ? "..." : "Apply"}
                </button>
              </div>
              {promoError && <p className="text-sm text-red-500 mt-1">{promoError}</p>}
            </div>
          )}
        </div>

        {(paymentError || emailError) && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg"><p className="text-sm text-red-600">{emailError || paymentError}</p></div>
        )}

        <div className="flex justify-between items-center mb-4">
          <button type="button" onClick={previousStep} className="px-6 py-3 text-gray-600 font-medium hover:text-gray-900 transition-colors">Back</button>
          <button type="button" onClick={handleSubmit} disabled={!stripe || isSubmitting}
            className={`px-8 py-3 rounded-xl font-semibold transition-colors ${stripe && !isSubmitting ? "bg-[#2D2D2D] text-white hover:bg-[#1a1a1a]" : "bg-gray-300 text-gray-500 cursor-not-allowed"}`}>
            {isSubmitting ? "Processing..." : `Purchase for $${total}`}
          </button>
        </div>

        <div className="flex items-center justify-center gap-2 text-xs text-[#2D2D2D]/40 mb-6">
          <Lock className="w-3 h-3" />
          <span>Secure checkout powered by</span>
          <img src="/images/logo_svg/stripe_logo.png" alt="Stripe" className="h-4 opacity-40" />
        </div>

        {/* Trust details — native <details> accordions, zero state */}
        <div className="mt-8 border-t border-gray-200">
          {[
            {
              title: "Product Features",
              body: (
                <div className="space-y-3">
                  <p>
                    A premium hardcover book made to live on the kitchen counter — opened, stained,
                    and actually used. Every detail is chosen for durability and the kind of finish
                    that still looks good ten years in.
                  </p>
                  <ul className="space-y-1.5 list-disc pl-5 marker:text-[#D4A854]">
                    <li><span className="text-[#2D2D2D]">Format:</span> Hardcover, Adhesive Casebound (PUR)</li>
                    <li><span className="text-[#2D2D2D]">Size:</span> US Letter Tall (8&quot; × 10&quot;) — Portrait</li>
                    <li><span className="text-[#2D2D2D]">Printing:</span> Full-color throughout</li>
                    <li><span className="text-[#2D2D2D]">Paper:</span> 100 lb Satin Text interior pages</li>
                    <li><span className="text-[#2D2D2D]">Finish:</span> Matte lamination on cover</li>
                    <li><span className="text-[#2D2D2D]">Photos:</span> A custom image is created for every recipe — included</li>
                    <li><span className="text-[#2D2D2D]">Recipes:</span> 50 included, additional recipes available</li>
                  </ul>
                </div>
              ),
            },
            {
              title: "Shipping",
              body: (
                <>
                  We ship to the United States, Mexico, and the European Union. To make sure the
                  book arrives in time, close the book at least 3 weeks before you want to give it —
                  that&apos;s the window we need to print, bind, and deliver.
                </>
              ),
            },
            {
              title: "Pricing Details",
              body: (
                <ul className="space-y-1.5 list-disc pl-5">
                  <li>The Book: ${BASE_BOOK_PRICE} USD</li>
                  <li>Each additional copy: ${ADDITIONAL_BOOK_PRICE} USD</li>
                  <li>Up to 50 recipes included</li>
                  <li>Each extra recipe: $1 USD</li>
                </ul>
              ),
            },
            {
              title: "Support",
              body: (
                <>
                  Something off with your book? Email{" "}
                  <a href="mailto:hello@smallplates.co" className="underline hover:text-[#2D2D2D]">
                    hello@smallplates.co
                  </a>{" "}
                  and we&apos;ll fix it. No forms, no hoops.
                </>
              ),
            },
          ].map((item) => (
            <details
              key={item.title}
              className="group border-b border-gray-200 [&_summary::-webkit-details-marker]:hidden"
            >
              <summary className="flex items-center justify-between py-4 cursor-pointer list-none text-sm font-medium text-[#2D2D2D] hover:text-[#2D2D2D]/70 transition-colors">
                <span>{item.title}</span>
                <svg
                  className="w-4 h-4 text-[#2D2D2D]/50 transition-transform duration-200 group-open:rotate-180"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <div className="pb-4 pr-6 text-sm text-[#2D2D2D]/70 leading-relaxed">
                {item.body}
              </div>
            </details>
          ))}
        </div>
      </div>
    </OnboardingStep>
  );
}

/**
 * Main Onboarding Page Component
 */
function OnboardingContent() {
  const { state } = useOnboarding();

  return (
    <div className="min-h-screen bg-white">
      {state.currentStep === 1 && (
        <DatePickerStep
          stepNumber={1}
          totalSteps={3}
          title="Congratulations. Let&apos;s make the book."
          question="When do you want the book?"
          hint="Most couples have it ready a few weeks before the wedding."
          switchFlowText="Giving this as a gift?"
          switchFlowHref="/onboarding-gift"
        />
      )}
      {state.currentStep === 2 && <Step2 />}
      {state.currentStep === 3 && <Step3Payment />}
      {state.currentStep === 4 && <PostPaymentSetup userType="couple" />}
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <OnboardingProvider userType="couple">
      <OnboardingContent />
    </OnboardingProvider>
  );
}
