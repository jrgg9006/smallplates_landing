"use client";

import React from "react";

export type CoverSubStep = "cover" | "inside";

interface SubStepIndicatorProps {
  current: CoverSubStep;
  onSelect: (s: CoverSubStep) => void;
}

const STEPS: { key: CoverSubStep; label: string }[] = [
  { key: "cover", label: "Cover" },
  { key: "inside", label: "Inside" },
];

// Reason: a light, clickable sub-progress for the two-screen book editor
// (Cover → Inside) that lives under the main step bar without adding a real step.
export function SubStepIndicator({ current, onSelect }: SubStepIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-3">
      {STEPS.map((s, i) => (
        <React.Fragment key={s.key}>
          {i > 0 && <span className="h-px w-8 bg-black/15" />}
          <button
            type="button"
            onClick={() => onSelect(s.key)}
            className="group flex items-center gap-2"
          >
            <span
              className={`h-2 w-2 rounded-full transition-colors ${
                current === s.key ? "bg-brand-honey" : "bg-black/20 group-hover:bg-black/40"
              }`}
            />
            <span
              className={`type-eyebrow transition-colors ${
                current === s.key
                  ? "text-brand-charcoal"
                  : "text-[hsl(var(--brand-warm-gray))]/70 group-hover:text-brand-charcoal"
              }`}
            >
              {s.label}
            </span>
          </button>
        </React.Fragment>
      ))}
    </div>
  );
}
