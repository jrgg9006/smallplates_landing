"use client";

import React from "react";
import { Minus, Plus } from "lucide-react";
import { BASE_BOOK_PRICE, ADDITIONAL_BOOK_PRICE } from "@/lib/stripe/pricing";

// Reason: 1 base book + up to 5 extra copies. The base is required (the book is
// being printed); extras are optional. Tiered pricing ($169 + $129/extra) is why
// quantity lives on our screen, not in Stripe's native quantity selector.
export const MAX_COPIES = 6;

interface QuantityStepProps {
  qty: number;
  onQtyChange: (qty: number) => void;
  onContinue: () => void;
}

export function QuantityStep({ qty, onQtyChange, onContinue }: QuantityStepProps) {
  return (
    <div className="mx-auto flex w-full max-w-[460px] flex-col items-center">
      <p className="mb-10 max-w-sm text-center text-[15px] leading-relaxed text-[hsl(var(--brand-warm-gray))]">
        One copy is yours. Add more if other people should have their own. Same
        book, same hardcover.
      </p>

      {/* Price */}
      <p className="type-eyebrow mb-2">The book</p>
      <div className="mb-1 flex items-baseline justify-center">
        <span className="mr-1 font-serif text-2xl text-[hsl(var(--brand-warm-gray))]">$</span>
        <span className="font-serif text-[56px] leading-none text-brand-charcoal">
          {BASE_BOOK_PRICE}
        </span>
      </div>
      <p className="mb-10 text-sm text-[hsl(var(--brand-warm-gray))]">
        each extra copy ${ADDITIONAL_BOOK_PRICE} · ships free
      </p>

      {/* Stepper */}
      <div className="mb-10 flex items-center gap-6">
        <button
          onClick={() => onQtyChange(Math.max(1, qty - 1))}
          disabled={qty <= 1}
          className="flex h-[50px] w-[50px] items-center justify-center rounded-full border-[1.5px] border-[rgba(45,45,45,0.12)] text-brand-charcoal transition-opacity disabled:opacity-25"
          aria-label="Remove copy"
        >
          <Minus className="h-5 w-5" />
        </button>
        <span className="min-w-[52px] text-center font-serif text-[40px] tabular-nums text-brand-charcoal">
          {qty}
        </span>
        <button
          onClick={() => onQtyChange(Math.min(MAX_COPIES, qty + 1))}
          disabled={qty >= MAX_COPIES}
          className="flex h-[50px] w-[50px] items-center justify-center rounded-full bg-brand-honey text-white transition-opacity disabled:opacity-50"
          aria-label="Add copy"
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>

      <button type="button" onClick={onContinue} className="btn btn-md btn-dark w-full">
        Continue
      </button>
    </div>
  );
}
