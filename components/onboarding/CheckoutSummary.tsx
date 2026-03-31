"use client";

import React, { useState } from "react";
import { ShippingCountry } from "@/lib/types/onboarding";

interface CheckoutSummaryProps {
  bookQuantity: number;
  shippingCountry: ShippingCountry | null;
  onShippingChange: (country: ShippingCountry) => void;
  email: string;
  emailError: string;
  onEmailChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onEmailBlur: () => void;
  isFormValid: boolean;
  onPaymentError: (message: string) => void;
  onSavePurchaseIntent: () => Promise<string | null>;
  onBack: () => void;
  userType: 'couple' | 'gift_giver';
  existingUserId?: string;
}

/**
 * Pre-checkout step — collects email + shipping, then redirects to Stripe Hosted Checkout.
 * Intentionally minimal: Stripe handles the order summary and payment form.
 */
export function CheckoutSummary({
  bookQuantity,
  shippingCountry,
  onShippingChange,
  email,
  emailError,
  onEmailChange,
  onEmailBlur,
  isFormValid,
  onPaymentError,
  onSavePurchaseIntent,
  onBack,
  userType,
  existingUserId,
}: CheckoutSummaryProps) {
  const [processing, setProcessing] = useState(false);

  const canPay = isFormValid && shippingCountry !== null;

  const handleCheckout = async () => {
    if (!canPay) return;

    setProcessing(true);

    try {
      const purchaseIntentId = await onSavePurchaseIntent();
      if (!purchaseIntentId) {
        onPaymentError("Failed to save your information. Please try again.");
        setProcessing(false);
        return;
      }

      const res = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          bookQuantity,
          shippingCountry,
          userType,
          purchaseIntentId,
          ...(existingUserId ? { existingUserId } : {}),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.url) {
        onPaymentError(data.error || "Failed to start checkout. Please try again.");
        setProcessing(false);
        return;
      }

      window.location.href = data.url;
    } catch (err) {
      console.error("Checkout error:", err);
      onPaymentError("Something went wrong. Please try again.");
      setProcessing(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto space-y-8 mt-10">
      {/* Email */}
      <div>
        <label
          htmlFor="checkout-email"
          className="block text-sm font-medium text-[#2D2D2D] mb-1"
        >
          Your email
        </label>
        <p className="text-xs text-[#8A8780] font-light mb-2">
          This is where we send your dashboard login. No password needed.
        </p>
        <input
          id="checkout-email"
          type="email"
          required
          value={email}
          onChange={onEmailChange}
          onBlur={onEmailBlur}
          className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:border-transparent outline-none transition-all ${
            emailError
              ? "border-red-500 focus:ring-red-500"
              : "border-gray-300 focus:ring-[#D4A854]"
          }`}
          placeholder="you@example.com"
        />
        {emailError && (
          <p className="mt-1 text-sm text-red-600">{emailError}</p>
        )}
      </div>

      {/* Shipping Destination */}
      <div>
        <p className="text-sm font-medium text-[#2D2D2D] mb-1">
          Where are we shipping?
        </p>
        <p className="text-xs text-[#8A8780] font-light mb-3">
          We&apos;ll collect the full address later.
        </p>
        <div className="grid grid-cols-2 gap-3">
          {([
            { id: "US" as ShippingCountry, label: "United States", flag: "🇺🇸" },
            { id: "MX" as ShippingCountry, label: "Mexico", flag: "🇲🇽" },
          ]).map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => onShippingChange(opt.id)}
              className={`py-3 px-4 rounded-xl text-sm transition-all border ${
                shippingCountry === opt.id
                  ? "bg-[#D4A854]/10 border-[#D4A854] text-[#2D2D2D] font-medium"
                  : "bg-white border-gray-200 text-[#6B6966] hover:border-gray-300"
              }`}
            >
              <span className="mr-1.5">{opt.flag}</span>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="pt-2 space-y-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-4 text-sm text-[#8A8780] hover:text-[#2D2D2D] transition-colors"
          >
            Back
          </button>
          <button
            type="button"
            onClick={handleCheckout}
            disabled={!canPay || processing}
            className={`flex-1 py-4 rounded-2xl text-base font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
              canPay && !processing
                ? "bg-[#2D2D2D] text-white hover:bg-[#1a1a1a]"
                : "bg-gray-200 text-gray-400"
            }`}
          >
            {processing ? (
              <span className="flex items-center justify-center">
                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                One sec...
              </span>
            ) : (
              "Continue to payment"
            )}
          </button>
        </div>

        <div className="flex items-center justify-center gap-1.5">
          <svg className="w-3.5 h-3.5 text-[#8A8780]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <p className="text-xs text-[#8A8780] font-light">
            Secure checkout powered by Stripe
          </p>
        </div>
      </div>
    </div>
  );
}
