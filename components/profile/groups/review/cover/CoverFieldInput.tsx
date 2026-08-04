"use client";

import React, { useCallback, useEffect, useRef } from "react";

interface CoverFieldInputProps {
  label: string;
  value: string;
  max: number;
  placeholder?: string;
  /** Eyebrow styling: small uppercase letterspaced text. */
  uppercase?: boolean;
  /** Wrap onto extra lines instead of scrolling sideways when the text is long. */
  multiline?: boolean;
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
  multiline,
  tip,
  onChange,
  onFocus,
  onBlur,
  autoFocus,
}: CoverFieldInputProps) {
  const nearLimit = max - value.length <= 8;
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Reason: a textarea's height is fixed by `rows`, so match it to the content.
  // The field then sits on one line on desktop and grows to two on a narrow
  // phone instead of hiding the tail of the line behind a sideways scroll.
  const fitHeight = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, []);

  useEffect(() => {
    if (!multiline) return;
    fitHeight();
    // Reason: the wrap point moves with the viewport (rotation, desktop resize).
    window.addEventListener("resize", fitHeight);
    return () => window.removeEventListener("resize", fitHeight);
  }, [multiline, value, fitHeight]);

  const fieldClassName = `w-full rounded-xl border border-gray-200 bg-white px-4 py-4 text-center text-brand-charcoal transition-colors focus:border-brand-honey focus:outline-none focus:ring-1 focus:ring-brand-honey/30 ${
    uppercase ? "text-sm uppercase tracking-[0.18em]" : "font-serif text-2xl"
  }`;

  return (
    <div className="flex flex-col">
      <p className="type-eyebrow mb-3">{label}</p>
      {multiline ? (
        <textarea
          ref={textareaRef}
          rows={1}
          value={value}
          maxLength={max}
          // Reason: it prints as a single line, so newlines never survive — strip
          // them from pastes and don't let Enter insert one.
          onChange={(e) => onChange(e.target.value.replace(/\s*\n+\s*/g, " "))}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.preventDefault();
          }}
          onFocus={onFocus}
          onBlur={onBlur}
          autoFocus={autoFocus}
          placeholder={placeholder}
          className={`${fieldClassName} resize-none overflow-hidden leading-relaxed`}
        />
      ) : (
        <input
          type="text"
          value={value}
          maxLength={max}
          onChange={(e) => onChange(e.target.value)}
          onFocus={onFocus}
          onBlur={onBlur}
          autoFocus={autoFocus}
          placeholder={placeholder}
          className={fieldClassName}
        />
      )}
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
