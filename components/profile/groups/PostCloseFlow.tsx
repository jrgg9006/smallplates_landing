"use client";

import React, { useState } from "react";
import { ArrowLeft, Minus, Plus, Info } from "lucide-react";
import { BASE_BOOK_PRICE, ADDITIONAL_BOOK_PRICE, calculateSubtotal } from "@/lib/stripe/pricing";

interface PostCloseFlowProps {
  groupId: string;
  onDone: () => void;
  onBack: () => void;
}

// Reason: 1 base book + up to 5 extra copies. The base is required (the book is
// being printed); extras are optional. Tiered pricing ($169 + $129/extra) is why
// quantity lives on our screen, not in Stripe's native quantity selector.
const MAX_COPIES = 6;

export function PostCloseFlow({ groupId, onBack }: PostCloseFlowProps) {
  const [qty, setQty] = useState(1);
  const [redirecting, setRedirecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const total = calculateSubtotal(qty);
  const extras = qty - 1;

  const handlePay = async () => {
    setRedirecting(true);
    setError(null);
    try {
      // Reason: Redirect to Stripe Checkout. The address + promo code are entered
      // there; the webhook (book_close_purchase) records the order, saves the
      // address, and closes the book once payment confirms.
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
    } catch (err) {
      console.error("PostCloseFlow handlePay error:", err);
      setError("Something went wrong. Please try again.");
      setRedirecting(false);
    }
  };

  if (redirecting) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#F5F3EF]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-honey mb-4" />
        <p className="text-sm text-[hsl(var(--brand-warm-gray))]">Taking you to checkout…</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F3EF]">
      <div className="flex items-center px-4 py-3 flex-shrink-0 min-h-[52px]">
        <button
          onClick={onBack}
          className="p-2 rounded-full hover:bg-white/60 transition-colors"
          aria-label="Back"
        >
          <ArrowLeft className="h-5 w-5 text-brand-charcoal" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="flex items-start justify-center min-h-full px-6 pt-4 pb-16">
          <div className="w-full max-w-[460px] flex flex-col items-center">
            <h1 className="font-serif text-[34px] font-normal text-brand-charcoal text-center leading-tight mb-3">
              How many copies?
            </h1>
            <p className="text-[15px] text-[hsl(var(--brand-warm-gray))] text-center leading-relaxed mb-10 max-w-sm">
              One copy is yours. Add more if other people should have their own.
              Same book, same hardcover.
            </p>

            {/* Price */}
            <p className="text-[11px] uppercase tracking-[0.08em] text-[hsl(var(--brand-warm-gray))] mb-2">
              The book
            </p>
            <div className="flex items-baseline justify-center mb-1">
              <span className="font-serif text-2xl text-[hsl(var(--brand-warm-gray))] mr-1">$</span>
              <span className="font-serif text-[56px] text-brand-charcoal leading-none">{BASE_BOOK_PRICE}</span>
            </div>
            <p className="text-sm text-[hsl(var(--brand-warm-gray))] mb-10">
              each extra copy ${ADDITIONAL_BOOK_PRICE} · ships free
            </p>

            {/* Stepper */}
            <div className="flex items-center gap-6 mb-10">
              <button
                onClick={() => setQty(Math.max(1, qty - 1))}
                disabled={qty <= 1}
                className="w-[50px] h-[50px] rounded-full border-[1.5px] border-[rgba(45,45,45,0.12)] flex items-center justify-center text-brand-charcoal disabled:opacity-25 transition-opacity"
                aria-label="Remove copy"
              >
                <Minus className="w-5 h-5" />
              </button>
              <span className="font-serif text-[40px] text-brand-charcoal min-w-[52px] text-center tabular-nums">
                {qty}
              </span>
              <button
                onClick={() => setQty(Math.min(MAX_COPIES, qty + 1))}
                disabled={qty >= MAX_COPIES}
                className="w-[50px] h-[50px] rounded-full bg-brand-honey flex items-center justify-center text-white disabled:opacity-50 transition-opacity"
                aria-label="Add copy"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            {/* Totals */}
            <div className="w-full border-t border-[rgba(45,45,45,0.12)] pt-4 mb-6 space-y-2 text-[13px]">
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
              <div className="flex justify-between font-medium text-[15px] text-brand-charcoal pt-2 border-t border-[rgba(45,45,45,0.12)]">
                <span>Total</span>
                <span>${total}</span>
              </div>
            </div>

            {error && (
              <div className="w-full flex items-start gap-3 rounded-xl border border-[rgba(45,45,45,0.12)] bg-[#F5EDD8] px-4 py-3.5 mb-5">
                <Info className="h-[18px] w-[18px] text-[#7A5C10] flex-shrink-0 mt-0.5" />
                <p className="text-[14px] text-[#5A4A1A] leading-relaxed text-left">{error}</p>
              </div>
            )}

            <button type="button" onClick={handlePay} className="btn btn-md btn-dark w-full">
              Review and pay →
            </button>

            <p className="text-xs text-[hsl(var(--brand-warm-gray))] text-center mt-4 leading-[1.5]">
              You&apos;ll add your shipping address on the next screen. Closing the
              book locks the recipes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
