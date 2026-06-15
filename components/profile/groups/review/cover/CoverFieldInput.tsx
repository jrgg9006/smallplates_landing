"use client";

import React from "react";

interface CoverFieldInputProps {
  label: string;
  value: string;
  max: number;
  placeholder?: string;
  /** Eyebrow styling: small uppercase letterspaced text. */
  uppercase?: boolean;
  tip?: React.ReactNode;
  onChange: (v: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  autoFocus?: boolean;
}

// Reason: feedback is "invisible until it matters" — no counter while there's
// room; a subtle gray counter only within the last 8 chars; hard-stop via
// maxLength (no red error). The live cover's font-shrink is the main feedback.
export function CoverFieldInput({
  label,
  value,
  max,
  placeholder,
  uppercase,
  tip,
  onChange,
  onFocus,
  onBlur,
  autoFocus,
}: CoverFieldInputProps) {
  const nearLimit = max - value.length <= 8;

  return (
    <div className="flex flex-col">
      <p className="type-eyebrow mb-3">{label}</p>
      <input
        type="text"
        value={value}
        maxLength={max}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        onBlur={onBlur}
        autoFocus={autoFocus}
        placeholder={placeholder}
        className={`w-full rounded-xl border border-gray-200 bg-white px-4 py-4 text-center text-brand-charcoal transition-colors focus:border-brand-honey focus:outline-none focus:ring-1 focus:ring-brand-honey/30 ${
          uppercase ? "text-sm uppercase tracking-[0.18em]" : "font-serif text-2xl"
        }`}
      />
      <div className="mt-2 flex min-h-[20px] items-center justify-between gap-3">
        <span className="text-sm text-[hsl(var(--brand-warm-gray))]/80">{tip}</span>
        {nearLimit && (
          <span className="flex-shrink-0 text-xs text-[hsl(var(--brand-warm-gray))]/70">
            {value.length}/{max}
          </span>
        )}
      </div>
    </div>
  );
}
