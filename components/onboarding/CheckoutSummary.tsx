"use client";

import React, { useState } from "react";
import { getProductTierById, ProductTier } from "@/lib/data/productTiers";

interface CheckoutSummaryProps {
  selectedTierId: string | null;
  coupleNames?: {
    brideFirstName?: string;
    brideLastName?: string;
    partnerFirstName?: string;
    partnerLastName?: string;
  };
  giftGiverName?: string;
  email: string;
  password?: string;
  emailError: string;
  loading: boolean;
  onEmailChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onEmailBlur: () => void;
  onPasswordChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onCompletePurchase: () => void;
  isFormValid: boolean;
}

/**
 * Checkout Summary Component
 * Displays order summary and account creation form before payment
 */
export function CheckoutSummary({
  selectedTierId,
  coupleNames,
  giftGiverName,
  email,
  password,
  emailError,
  loading,
  onEmailChange,
  onEmailBlur,
  onPasswordChange,
  onCompletePurchase,
  isFormValid,
}: CheckoutSummaryProps) {
  const selectedTier: ProductTier | undefined = selectedTierId
    ? getProductTierById(selectedTierId)
    : undefined;

  const [isExpanded, setIsExpanded] = useState(false);

  if (!selectedTier) {
    return (
      <div className="text-center text-red-600">
        Please select a product tier to continue.
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-8">
      {/* Order Summary - Collapsible */}
      <div className="bg-[#FAF9F7] rounded-lg border border-gray-200 overflow-hidden">
        {/* Header - Always Visible */}
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between p-4 hover:bg-[#F5F3EF] transition-colors"
        >
          <div className="flex items-center gap-3">
            <h3 className="font-serif text-base text-[#2D2D2D]">Order Summary</h3>
            <span className="text-xs text-[#8A8780] font-light">
              {selectedTier.name}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="font-serif text-lg text-[#2D2D2D]">
                ${selectedTier.price}
              </p>
              <p className="text-xs text-[#8A8780] font-light">
                + Shipping
              </p>
            </div>
            <svg
              className={`w-4 h-4 text-[#8A8780] transition-transform duration-200 ${
                isExpanded ? "rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </button>

        {/* Expandable Content */}
        {isExpanded && (
          <div className="px-4 pb-4 border-t border-gray-200 pt-4 space-y-4">
            {/* Selected Product Details */}
            <div>
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-medium text-[#2D2D2D] text-sm">{selectedTier.name}</p>
                  <p className="text-xs text-[#8A8780] font-light mt-0.5">
                    {selectedTier.tagline}
                  </p>
                </div>
              </div>
              
              {/* Features included */}
              <ul className="mt-2 space-y-1">
                {selectedTier.features.map((feature, i) => (
                  <li
                    key={i}
                    className="text-xs text-[#6B6966] font-light flex items-start"
                  >
                    <span className="mr-2 text-[#D4A854]">•</span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            {/* Couple Names */}
            {coupleNames && (
              <div className="pt-3 border-t border-gray-200">
                <p className="text-xs text-[#8A8780] font-light mb-1">For:</p>
                <p className="text-sm text-[#2D2D2D] font-medium">
                  {coupleNames.brideFirstName} {coupleNames.brideLastName}
                  {coupleNames.partnerFirstName &&
                    ` & ${coupleNames.partnerFirstName} ${coupleNames.partnerLastName || ""}`}
                </p>
              </div>
            )}

            {/* Gift Giver Name */}
            {giftGiverName && (
              <div className="pt-3 border-t border-gray-200">
                <p className="text-xs text-[#8A8780] font-light mb-1">From:</p>
                <p className="text-sm text-[#2D2D2D] font-medium">{giftGiverName}</p>
              </div>
            )}

            {/* Subtotal */}
            <div className="flex justify-between items-center pt-3 border-t border-gray-200">
              <p className="text-[#2D2D2D] text-sm font-light">Subtotal</p>
              <p className="font-serif text-base text-[#2D2D2D]">
                ${selectedTier.price}
              </p>
            </div>

            {/* Shipping */}
            <div className="flex justify-between items-start pt-2">
              <div className="flex-1">
                <p className="text-[#2D2D2D] text-sm font-light">Shipping</p>
                <p className="text-xs text-[#8A8780] font-light mt-0.5">
                  Calculated at checkout
                </p>
                <p className="text-xs text-[#8A8780] font-light italic">
                  (based on delivery location)
                </p>
              </div>
              <p className="text-sm text-[#8A8780] font-light ml-4">
                TBD
              </p>
            </div>

            {/* Total */}
            <div className="flex justify-between items-center pt-3 border-t border-gray-200">
              <p className="font-medium text-[#2D2D2D] text-sm">Total</p>
              <p className="font-serif text-lg text-[#2D2D2D]">
                ${selectedTier.price} + shipping
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Account Creation Form */}
      <div>
        <div className="text-center mb-6">
          <h2 className="text-lg font-medium text-[#2D2D2D] mb-2">
            Create your account
          </h2>
          <p className="text-sm text-[#2D2D2D]/60 font-light">
            We&apos;ll use this to manage your book and send updates.
          </p>
        </div>

        <div className="space-y-4 mb-6">
          <div>
            <label
              htmlFor="checkout-email"
              className="block text-sm font-medium text-[#2D2D2D] mb-1"
            >
              Email Address
            </label>
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

          {/* Reason: Password field hidden for soft launch - accounts created manually after payment */}
          {onPasswordChange && (
            <div>
              <label
                htmlFor="checkout-password"
                className="block text-sm font-medium text-[#2D2D2D] mb-1"
              >
                Password
              </label>
              <input
                id="checkout-password"
                type="password"
                required
                value={password}
                onChange={onPasswordChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#D4A854] focus:border-transparent outline-none transition-all"
                placeholder="At least 6 characters"
                minLength={6}
              />
              {password && password.length > 0 && password.length < 6 && (
                <p className="mt-1 text-sm text-red-600">
                  Password must be at least 6 characters
                </p>
              )}
            </div>
          )}
        </div>

        {/* Confidence Building Message */}
        <div className="text-center text-sm text-[#2D2D2D]/50 font-light mb-6">
          Secure checkout. Your information is protected.
        </div>
      </div>
    </div>
  );
}
