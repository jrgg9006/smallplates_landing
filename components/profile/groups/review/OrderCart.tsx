"use client";

import React from "react";
import { BASE_BOOK_PRICE, ADDITIONAL_BOOK_PRICE, calculateSubtotal } from "@/lib/stripe/pricing";
import { BookPreviewPanel } from "../BookPreviewPanel";
import type { GroupWithMembers } from "@/lib/types/database";

interface OrderCartProps {
  qty: number;
  // Reason: when provided, render the personalized book mockup at the top of the
  // cart so the buyer sees what they're ordering (couple photo + names + recipe
  // count), reusing the dashboard BookPreviewPanel.
  group?: GroupWithMembers;
  recipeCount?: number;
  // Optional footer rendered inside the cart card (e.g. the pay button on step 4).
  children?: React.ReactNode;
}

// Reason: The "Your cart" summary card, shared by the Quantity step (read-only,
// continue lives outside) and the Checkout step (with the pay button passed as
// children). Single source for the price breakdown so the two steps never drift.
export function OrderCart({ qty, group, recipeCount, children }: OrderCartProps) {
  const total = calculateSubtotal(qty);
  const extras = qty - 1;

  return (
    <div className="rounded-2xl border border-[hsl(var(--brand-border))] bg-white p-6 sm:p-7">
      <p className="type-eyebrow mb-5">Your cart</p>

      {group && (
        <div className="mb-6 flex justify-center">
          <div className="w-[150px]">
            <BookPreviewPanel
              group={group}
              recipeCount={recipeCount ?? 0}
              onPreviewClick={() => {}}
            />
          </div>
        </div>
      )}

      <div className="space-y-3 text-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-brand-charcoal">The book</p>
            <p className="text-xs text-[hsl(var(--brand-warm-gray))]">
              Hardcover, printed and bound
            </p>
          </div>
          <span className="tabular-nums text-brand-charcoal">${BASE_BOOK_PRICE}</span>
        </div>

        {extras > 0 && (
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-brand-charcoal">
                {extras} extra {extras === 1 ? "copy" : "copies"}
              </p>
              <p className="text-xs text-[hsl(var(--brand-warm-gray))]">
                ${ADDITIONAL_BOOK_PRICE} each
              </p>
            </div>
            <span className="tabular-nums text-brand-charcoal">
              ${extras * ADDITIONAL_BOOK_PRICE}
            </span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className="text-[hsl(var(--brand-warm-gray))]">Shipping</span>
          <span className="text-[#14532D]">Free</span>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-[hsl(var(--brand-border))] pt-4">
        <span className="font-medium text-brand-charcoal">Total</span>
        <span className="font-serif text-2xl tabular-nums text-brand-charcoal">${total}</span>
      </div>

      {children}
    </div>
  );
}
