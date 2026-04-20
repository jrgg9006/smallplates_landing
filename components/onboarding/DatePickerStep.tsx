"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Calendar, X } from "lucide-react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";
import { addDays, addMonths, subDays, format } from "date-fns";
import OnboardingStep from "@/components/onboarding/OnboardingStep";
import { useOnboarding } from "@/lib/contexts/OnboardingContext";
import { trackEvent } from "@/lib/analytics";

function getOrdinalDay(day: number): string {
  if (day >= 11 && day <= 13) return `${day}th`;
  switch (day % 10) {
    case 1: return `${day}st`;
    case 2: return `${day}nd`;
    case 3: return `${day}rd`;
    default: return `${day}th`;
  }
}

interface DatePickerStepProps {
  stepNumber: number;
  totalSteps: number;
  title: string;
  question: string;
  hint: React.ReactNode;
  switchFlowText?: string;
  switchFlowHref?: string;
  isAddBookMode?: boolean;
}

export function DatePickerStep({
  stepNumber,
  totalSteps,
  title,
  question,
  hint,
  switchFlowText,
  switchFlowHref,
  isAddBookMode = false,
}: DatePickerStepProps) {
  const { nextStep, updateStepData, state } = useOnboarding();

  const savedData = state.answers.step1 as {
    gift_date?: string | null;
    gift_date_undecided?: boolean;
  } | undefined;

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(() => {
    if (savedData?.gift_date) return new Date(savedData.gift_date + "T00:00:00");
    return undefined;
  });
  const [isUndecided, setIsUndecided] = useState(savedData?.gift_date_undecided || false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);

  const popoverRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  const today = new Date();
  const fromDate = addDays(today, 14);
  const toDate = addMonths(today, 18);
  const bookCloseDate = selectedDate ? subDays(selectedDate, 12) : null;

  const canContinue = !!selectedDate || isUndecided;

  const stepViewedRef = useRef(false);
  useEffect(() => {
    if (stepViewedRef.current) return;
    stepViewedRef.current = true;
    trackEvent('onboarding_step_view', { step_number: 1, flow: 'gift' });
  }, []);

  // Reason: Close popover on click outside or Escape key
  useEffect(() => {
    if (!popoverOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        popoverRef.current && !popoverRef.current.contains(e.target as Node) &&
        inputRef.current && !inputRef.current.contains(e.target as Node)
      ) {
        setPopoverOpen(false);
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPopoverOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [popoverOpen]);

  // Reason: Scroll timeline into view on mobile when it first appears
  useEffect(() => {
    if (selectedDate && !hasAnimated && timelineRef.current) {
      setHasAnimated(true);
      setTimeout(() => {
        timelineRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 350);
    }
  }, [selectedDate, hasAnimated]);

  const handleDateSelect = useCallback((date: Date | undefined) => {
    setSelectedDate(date);
    setIsUndecided(false);
    if (date) setPopoverOpen(false);
  }, []);

  const handleClearDate = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedDate(undefined);
    setIsUndecided(false);
    setHasAnimated(false);
  }, []);

  const handleIDontKnow = useCallback(() => {
    setIsUndecided(true);
    setSelectedDate(undefined);
    setPopoverOpen(false);
    setHasAnimated(false);
  }, []);

  const handleInputClick = useCallback(() => {
    // Reason: Clicking the input always opens calendar, even in undecided state
    setPopoverOpen((prev) => !prev);
  }, []);

  const handleContinue = () => {
    if (!canContinue) return;

    if (selectedDate) {
      const giftDateStr = format(selectedDate, "yyyy-MM-dd");
      const closeDateStr = bookCloseDate ? format(bookCloseDate, "yyyy-MM-dd") : null;
      updateStepData(1, {
        gift_date: giftDateStr,
        gift_date_undecided: false,
        book_close_date: closeDateStr,
      });
    } else {
      updateStepData(1, {
        gift_date: null,
        gift_date_undecided: true,
        book_close_date: null,
      });
    }
    trackEvent('onboarding_step_complete', {
      step_number: 1,
      flow: 'gift',
      gift_date_selected: selectedDate ? 'yes' : 'no',
    });
    nextStep();
  };

  // Reason: Determine visual state for conditional rendering
  const showHint = !selectedDate && !isUndecided;
  const showIDontKnow = !selectedDate && !isUndecided;

  return (
    <OnboardingStep
      stepNumber={stepNumber}
      totalSteps={totalSteps}
      title={title}
      imageUrl="/images/onboarding/onboarding_lemon.png"
      imageAlt="Wedding planning essentials"
    >
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div
          className="text-center transition-all duration-200 ease-in-out"
          style={{ marginBottom: showHint ? "16px" : "24px" }}
        >
          <h2 className="text-base font-medium text-brand-charcoal">
            {question}
          </h2>
        </div>

        {/* Consolidated hint — fades out + collapses when date selected or undecided */}
        <div
          className="overflow-hidden transition-all duration-200 ease-in-out"
          style={{
            maxHeight: showHint ? "80px" : "0px",
            opacity: showHint ? 1 : 0,
            marginBottom: showHint ? "16px" : "0px",
          }}
        >
          <div className="text-sm text-brand-charcoal/60 font-light text-center">
            {hint}
          </div>
        </div>

        {/* Date input field + popover wrapper */}
        <div className="relative mb-6" style={{ maxWidth: "420px", margin: "0 auto 24px" }}>
          <div
            ref={inputRef}
            role="button"
            tabIndex={0}
            onClick={handleInputClick}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleInputClick(); } }}
            className="w-full h-12 px-4 flex items-center rounded-lg cursor-pointer transition-all duration-200"
            style={{
              background: "#FAF7F2",
              border: `1px solid ${selectedDate ? "hsl(var(--brand-honey))" : popoverOpen ? "hsl(var(--brand-honey))" : "#E8E0D5"}`,
              boxShadow: popoverOpen ? "0 0 0 2px rgba(212, 168, 84, 0.15)" : "none",
            }}
          >
            <Calendar className="w-[18px] h-[18px] text-[#9A9590] mr-2.5 flex-shrink-0" strokeWidth={1.5} />
            {selectedDate ? (
              <span className="text-[15px] font-medium text-brand-charcoal flex-1 text-left">
                {format(selectedDate, "MMMM d, yyyy")}
              </span>
            ) : isUndecided ? (
              <span className="text-[15px] italic text-[#9A9590] flex-1 text-left">
                I&apos;ll decide later
              </span>
            ) : (
              <span className="text-[15px] text-[#9A9590] flex-1 text-left">
                Pick a date
              </span>
            )}
            {selectedDate && (
              <button
                type="button"
                onClick={handleClearDate}
                className="p-1 rounded-full hover:bg-[#E8E0D5] transition-colors ml-1"
                aria-label="Clear date"
              >
                <X className="w-4 h-4 text-[#9A9590] hover:text-brand-charcoal" strokeWidth={1.5} />
              </button>
            )}
          </div>

          {/* Calendar popover */}
          {popoverOpen && (
            <div
              ref={popoverRef}
              className="absolute left-0 right-0 z-50 mt-2 bg-white rounded-xl p-4 flex justify-center"
              style={{
                boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
                animation: "popoverIn 200ms ease-out forwards",
              }}
            >
              <DayPicker
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                startMonth={fromDate}
                endMonth={toDate}
                disabled={{ before: fromDate, after: toDate }}
                defaultMonth={selectedDate || fromDate}
                style={{
                  ["--rdp-accent-color" as string]: "hsl(var(--brand-honey))",
                  ["--rdp-accent-background-color" as string]: "hsl(var(--brand-honey))",
                  ["--rdp-today-color" as string]: "hsl(var(--brand-honey))",
                  ["--rdp-selected-font" as string]: "bold",
                  ["--rdp-day-height" as string]: "44px",
                  ["--rdp-day-width" as string]: "44px",
                  ["--rdp-selected-border" as string]: "none",
                  fontFamily: "inherit",
                  color: "hsl(var(--brand-charcoal))",
                }}
              />
            </div>
          )}
        </div>

        {/* Save-the-Date Card */}
        {selectedDate && bookCloseDate && (
          <div ref={timelineRef}>
            <div
              className="bg-white border border-[#E8E0D5] rounded-2xl text-center mt-5 mb-4 py-8 px-10 sm:py-8 sm:px-10"
              style={{
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
                maxWidth: "420px",
                margin: "20px auto 16px",
                animation: hasAnimated ? "none" : "cardIn 400ms ease-out forwards",
              }}
            >
              <p className="text-[16px] font-serif font-normal uppercase tracking-[0.05em] text-[#9A9590] mb-2.5">
                RECIPES MUST BE SUBMITTED BY
              </p>
              <div className="w-10 h-px bg-brand-honey mx-auto mb-2.5" />
              <p className="text-2xl sm:text-2xl font-semibold text-brand-charcoal leading-snug">
                {format(bookCloseDate, "EEEE")}, {format(bookCloseDate, "MMMM")} {getOrdinalDay(bookCloseDate.getDate())}
              </p>
            </div>
            <p
              className="text-center text-[13px] italic text-[#9A9590] mb-6"
              style={{
                animation: hasAnimated ? "none" : "fadeIn 300ms ease 150ms both",
              }}
            >
              Your book arrives by {format(selectedDate, "MMMM")} {selectedDate.getDate()}.
              {" "}
            </p>
          </div>
        )}

        {/* "I don't know yet" — fades out + collapses when date selected */}
        <div
          className="overflow-hidden transition-all duration-200 ease-in-out"
          style={{
            maxHeight: showIDontKnow ? "40px" : "0px",
            opacity: showIDontKnow ? 1 : 0,
            marginBottom: showIDontKnow ? "24px" : "0px",
          }}
        >
          <div className="text-center">
            <button
              type="button"
              onClick={handleIDontKnow}
              className="text-sm text-brand-charcoal/50 hover:text-brand-honey transition-colors font-light underline underline-offset-2"
            >
              I don&apos;t know yet
            </button>
          </div>
        </div>

        {/* Undecided fallback message */}
        <div
          className="overflow-hidden transition-all duration-200 ease-in-out"
          style={{
            maxHeight: isUndecided ? "40px" : "0px",
            opacity: isUndecided ? 1 : 0,
            marginBottom: isUndecided ? "24px" : "0px",
          }}
        >
          <p className="text-center text-sm text-[#9A9590]">
            No problem. You can set this from your dashboard anytime.
          </p>
        </div>

      </div>

      {/* Navigation */}
      <div className="flex justify-between mt-8">
        <button
          type="button"
          onClick={() => window.history.back()}
          className="px-6 py-3 text-gray-600 font-medium hover:text-gray-900 transition-colors"
        >
          Back
        </button>
        <button
          type="button"
          onClick={handleContinue}
          disabled={!canContinue}
          className={`px-8 py-3 rounded-xl font-semibold transition-colors ${
            canContinue
              ? "bg-brand-honey text-white hover:bg-[#c49b4a]"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          Continue
        </button>
      </div>

      {/* Switch flow link — rendered only when both props are provided */}
      {switchFlowHref && switchFlowText && (
        <div className="text-center mt-6">
          <a
            href={switchFlowHref}
            className="text-xs text-brand-charcoal/50 hover:text-brand-honey hover:underline underline-offset-2 transition-colors font-light"
          >
            {switchFlowText}
          </a>
        </div>
      )}

      <style jsx>{`
        @keyframes cardIn {
          from { opacity: 0; transform: scale(0.97); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes popoverIn {
          from { opacity: 0; transform: scale(0.98); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </OnboardingStep>
  );
}
