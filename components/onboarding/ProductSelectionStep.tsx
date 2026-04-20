"use client";

import React, { useState } from "react";
import { ShippingCountry } from "@/lib/types/onboarding";
import {
  BASE_BOOK_PRICE,
  ADDITIONAL_BOOK_PRICE,
  calculateSubtotal,
} from "@/lib/stripe/pricing";

interface ProductSelectionStepProps {
  bookQuantity: number;
  onUpdateQuantity: (quantity: number) => void;
  // Reason: Keep these props for backward compat — not used in current design
  shippingCountry?: ShippingCountry | null;
  onUpdateCountry?: (country: ShippingCountry) => void;
  selectedTierId?: string | null;
  onSelect?: (tierId: string) => void;
}

const bookOptions = Array.from({ length: 10 }, (_, i) => {
  const qty = i + 1;
  const total = calculateSubtotal(qty);
  return { qty, total };
});

/**
 * Product Selection Step Component
 * Clean dropdown selector inspired by Storyworth, styled in Small Plates brand
 */
export function ProductSelectionStep({
  bookQuantity,
  shippingCountry,
  onUpdateQuantity,
  onUpdateCountry,
}: ProductSelectionStepProps) {
  const [isOpen, setIsOpen] = useState(false);
  const subtotal = calculateSubtotal(bookQuantity);

  const handleSelect = (qty: number) => {
    onUpdateQuantity(qty);
    setIsOpen(false);
  };

  return (
    <div className="max-w-lg mx-auto">
      {/* Book quantity selector */}
      <div className="mb-6">
        <p className="text-base font-medium text-brand-charcoal mb-6 text-center">
          First book $169. Each additional copy $129.
        </p>

        {/* Custom dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl border border-gray-300 bg-white text-left transition-all hover:border-brand-honey focus:outline-none focus:ring-2 focus:ring-brand-honey/20 focus:border-brand-honey"
          >
            <span className="text-[15px] text-brand-charcoal">
              {bookQuantity === 1
                ? `1 copy — $${BASE_BOOK_PRICE}`
                : `${bookQuantity} copies — $${subtotal}`}
            </span>
            <svg
              className={`w-4 h-4 text-[#8A8780] transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {isOpen && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsOpen(false)}
              />

              {/* Dropdown */}
              <div
                className="absolute left-0 right-0 z-50 mt-1 bg-white rounded-xl border border-gray-200 overflow-hidden"
                style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}
              >
                {bookOptions.map(({ qty, total }) => (
                  <button
                    key={qty}
                    type="button"
                    onClick={() => handleSelect(qty)}
                    className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors ${
                      bookQuantity === qty
                        ? "bg-[#FAF7F2] text-brand-charcoal"
                        : "hover:bg-[#FAF7F2]/60 text-brand-charcoal"
                    }`}
                  >
                    <span className="text-[14px]">
                      {qty === 1 ? "1 copy" : `${qty} copies`}
                      {qty > 1 && (
                        <span className="text-[12px] text-[#9A9590] ml-1.5">
                          +${ADDITIONAL_BOOK_PRICE * (qty - 1)}
                        </span>
                      )}
                    </span>
                    <span className="text-[14px] text-brand-charcoal/70">
                      ${total}
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="mt-5 px-5 py-4 rounded-xl bg-[#F5F3F0] text-center">
          <span className="text-brand-honey text-base mr-1.5" style={{ fontFamily: "'Georgia', serif", fontStyle: "italic" }}>
            Tip
          </span>
          <span className="text-[13px] text-[#6B6560]">
            Many people want extra copies for family and close friends.
          </span>
        </div>
      </div>

    </div>
  );
}
