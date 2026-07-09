"use client";

import React from "react";
import { Check } from "lucide-react";
import { calculateSubtotal, pricePerCopy } from "@/lib/stripe/pricing";
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
  const perPerson = pricePerCopy(qty);
  // Reason: price per person × copies IS the model (matches the pricing page).
  // A flat "base book + extras" split would contradict the per-person number we
  // show right below the total.
  const split = qty > 1;

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
            <p className="text-brand-charcoal">
              {qty} {qty === 1 ? "copy" : "copies"}
            </p>
            <p className="text-xs text-[hsl(var(--brand-warm-gray))]">
              {split ? "Everyone gets their own" : "Hardcover, printed and bound"}
            </p>
          </div>
          <span className="tabular-nums text-brand-charcoal">
            ${perPerson}
            {split && (
              <span className="ml-0.5 text-xs text-[hsl(var(--brand-warm-gray))]">
                {" "}/ person
              </span>
            )}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-[hsl(var(--brand-warm-gray))]">Shipping</span>
          <span className="text-[#14532D]">Free</span>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-[hsl(var(--brand-border))] pt-4">
        <span className="font-medium text-brand-charcoal">Total</span>
        <span className="font-serif text-2xl tabular-nums text-brand-charcoal">${total}</span>
      </div>

      {/* Reason: the total just landed — this names the invisible service (recipes
          are cleaned on upload, photos/design happen after payment) at the exact
          moment the buyer weighs the price. */}
      <div className="mt-5 border-t border-[hsl(var(--brand-border))] pt-4">
        <p className="mb-3 font-sans text-[11px] font-medium uppercase tracking-[0.12em] text-brand-charcoal/50">
          From here, we take over
        </p>
        <ul className="space-y-2">
          {[
            "Every recipe reviewed and standardized — already done",
            "A photo for every recipe",
            "The whole book designed and laid out",
            "Hardcover printing, shipped to your door",
          ].map((item) => (
            <li key={item} className="flex items-start gap-2.5">
              <Check
                className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-brand-honey"
                strokeWidth={2}
              />
              <span className="text-[13px] leading-snug text-brand-charcoal/70">
                {item}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {children}
    </div>
  );
}
