"use client";

import React, { useState } from "react";
import { Info, Lock } from "lucide-react";
import { BASE_BOOK_PRICE, ADDITIONAL_BOOK_PRICE, calculateSubtotal } from "@/lib/stripe/pricing";

interface OrderSummaryStepProps {
  groupId: string;
  qty: number;
  isOwner: boolean;
}

// Reason: Step 4 of the book-review flow. Shows the final order breakdown, then
// hands off to Stripe Checkout (address + promo code are entered there; the
// webhook records the order, saves the address, and closes the book on payment).
// Only the owner can pay — captains can review the whole flow but the pay action
// is disabled for them (the route also 403s non-owners, defense in depth).
export function OrderSummaryStep({ groupId, qty, isOwner }: OrderSummaryStepProps) {
  const [redirecting, setRedirecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const total = calculateSubtotal(qty);
  const extras = qty - 1;

  const handlePay = async () => {
    setRedirecting(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/create-checkout-book-close-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupId, qty }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) {
        setError(data.error || "Something went wrong. Please try again.");
        setRedirecting(false);
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("Something went wrong. Please try again.");
      setRedirecting(false);
    }
  };

  if (redirecting) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-brand-honey" />
        <p className="text-sm text-[hsl(var(--brand-warm-gray))]">Taking you to checkout…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-[460px] flex-col items-center">
      <p className="mb-10 max-w-sm text-center text-[15px] leading-relaxed text-[hsl(var(--brand-warm-gray))]">
        One last look. You&apos;ll add your shipping address on the next screen.
      </p>

      {/* Totals */}
      <div className="mb-6 w-full space-y-2 border-t border-[rgba(45,45,45,0.12)] pt-4 text-[13px]">
        <div className="flex justify-between text-brand-charcoal">
          <span>The book</span>
          <span>${BASE_BOOK_PRICE}</span>
        </div>
        {extras > 0 && (
          <div className="flex justify-between text-brand-charcoal">
            <span>
              {extras} extra {extras === 1 ? "copy" : "copies"}
            </span>
            <span>${extras * ADDITIONAL_BOOK_PRICE}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-[hsl(var(--brand-warm-gray))]">Shipping</span>
          <span className="text-[#14532D]">Free</span>
        </div>
        <div className="flex justify-between border-t border-[rgba(45,45,45,0.12)] pt-2 text-[15px] font-medium text-brand-charcoal">
          <span>Total</span>
          <span>${total}</span>
        </div>
      </div>

      {error && (
        <div className="mb-5 flex w-full items-start gap-3 rounded-xl border border-[rgba(45,45,45,0.12)] bg-[#F5EDD8] px-4 py-3.5">
          <Info className="mt-0.5 h-[18px] w-[18px] flex-shrink-0 text-[#7A5C10]" />
          <p className="text-left text-[14px] leading-relaxed text-[#5A4A1A]">{error}</p>
        </div>
      )}

      {isOwner ? (
        <button type="button" onClick={handlePay} className="btn btn-md btn-dark w-full">
          Go to secure checkout →
        </button>
      ) : (
        <div className="w-full">
          <button type="button" disabled className="btn btn-md btn-dark w-full opacity-40">
            Go to secure checkout →
          </button>
          <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-sm text-[hsl(var(--brand-warm-gray))]">
            <Lock className="h-3.5 w-3.5" strokeWidth={2} />
            Only the owner can order &amp; pay.
          </p>
        </div>
      )}

      <p className="mt-4 text-center text-xs leading-[1.5] text-[hsl(var(--brand-warm-gray))]">
        Closing the book locks the recipes — no more edits after this.
      </p>
    </div>
  );
}
