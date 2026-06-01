"use client";

import React from "react";
import { Lock } from "lucide-react";

export type StepNumber = 1 | 2 | 3 | 4;

interface StepBarProps {
  current: StepNumber;
  // Reason: the highest step the user is allowed to jump to. Steps above this
  // (Quantity/Checkout before the recipe minimum) render locked and are
  // non-clickable.
  unlockedMax: StepNumber;
  onStepClick: (step: StepNumber) => void;
}

const STEPS: { n: StepNumber; label: string }[] = [
  { n: 1, label: "Names & photo" },
  { n: 2, label: "Recipes" },
  { n: 3, label: "Quantity" },
  { n: 4, label: "Checkout" },
];

export function StepBar({ current, unlockedMax, onStepClick }: StepBarProps) {
  return (
    <ol className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4 sm:gap-3">
      {STEPS.map(({ n, label }) => {
        const locked = n > unlockedMax;
        const filled = n <= current;
        const isActive = n === current;

        return (
          <li key={n}>
            <button
              type="button"
              onClick={() => !locked && onStepClick(n)}
              disabled={locked}
              aria-current={isActive ? "step" : undefined}
              className={`group w-full text-left ${
                locked ? "cursor-not-allowed" : "cursor-pointer"
              }`}
            >
              <span
                className={`type-eyebrow mb-1.5 flex items-center gap-1 ${
                  locked
                    ? "text-[hsl(var(--brand-warm-gray))]/55"
                    : isActive
                    ? "text-brand-charcoal"
                    : "text-brand-charcoal/70 group-hover:text-brand-charcoal"
                }`}
              >
                <span className="tabular-nums">{n}</span>
                <span className="truncate">· {label}</span>
                {locked && <Lock className="h-3 w-3 flex-shrink-0" strokeWidth={2} />}
              </span>
              <span
                className={`block h-[5px] rounded-full transition-colors ${
                  locked
                    ? "bg-[hsl(var(--brand-sand))]/60"
                    : filled
                    ? "bg-brand-honey"
                    : "bg-[hsl(var(--brand-sand))] group-hover:bg-brand-honey/40"
                }`}
              />
            </button>
          </li>
        );
      })}
    </ol>
  );
}
