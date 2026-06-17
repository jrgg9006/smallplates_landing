"use client";

import React from "react";
import { Minus, Plus, Info, Lock } from "lucide-react";
import { OrderCart } from "./OrderCart";
import type { GroupWithMembers } from "@/lib/types/database";

// Reason: 1 base book + up to 9 extra copies. The base is required (the book is
// being printed); extras are optional. Declining per-copy pricing (see
// calculateSubtotal) is why quantity lives on our screen, not in Stripe's native
// quantity selector.
export const MAX_COPIES = 10;

interface QuantityStepProps {
  qty: number;
  onQtyChange: (qty: number) => void;
  // Reason: "Continue to payment" goes straight to Stripe (step 4 IS the Stripe
  // page). The redirect/error state lives in the container, so the step bar can
  // light up step 4 while we redirect.
  onPay: () => void;
  isOwner: boolean;
  redirecting: boolean;
  error: string | null;
  group: GroupWithMembers;
  recipeCount: number;
}

export function QuantityStep({
  qty,
  onQtyChange,
  onPay,
  isOwner,
  redirecting,
  error,
  group,
  recipeCount,
}: QuantityStepProps) {
  return (
    <div className="grid gap-12 lg:grid-cols-[1fr_360px] lg:items-start">
      {/* Left — quantity picker */}
      <div className="flex flex-col">
        <p className="type-body-small mb-8 max-w-xl text-pretty">
          One copy is yours. Add one for everyone else who should have their own —
          same book, same hardcover. The more you add, the less each one costs.
        </p>

        <div className="flex flex-col items-center pt-6 text-center">
          <p className="type-eyebrow mb-4">How many copies?</p>
          <div className="flex items-center gap-6">
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
        </div>
      </div>

      {/* Right — cart preview + continue to payment (→ Stripe) */}
      <div className="flex flex-col gap-4">
        <OrderCart qty={qty} group={group} recipeCount={recipeCount} />

        {error && (
          <div className="flex items-start gap-3 rounded-xl border border-[rgba(45,45,45,0.12)] bg-[#F5EDD8] px-4 py-3.5">
            <Info className="mt-0.5 h-[18px] w-[18px] flex-shrink-0 text-[#7A5C10]" />
            <p className="text-left text-[14px] leading-relaxed text-[#5A4A1A]">{error}</p>
          </div>
        )}

        {isOwner ? (
          <button
            type="button"
            onClick={onPay}
            disabled={redirecting}
            className="btn btn-md btn-dark w-full"
          >
            {redirecting ? "Taking you to checkout…" : "Continue to payment →"}
          </button>
        ) : (
          <div>
            <button type="button" disabled className="btn btn-md btn-dark w-full opacity-40">
              Continue to payment →
            </button>
            <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-sm text-[hsl(var(--brand-warm-gray))]">
              <Lock className="h-3.5 w-3.5" strokeWidth={2} />
              Only the owner can order &amp; pay.
            </p>
          </div>
        )}

        <p className="text-center text-[13px] leading-relaxed text-[hsl(var(--brand-warm-gray))]">
          Once you pay, the book closes. It&apos;s printed and at your door in about three weeks.
        </p>
      </div>
    </div>
  );
}
