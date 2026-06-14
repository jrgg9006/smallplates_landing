"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Calendar, X } from "lucide-react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";
import { addDays, addMonths, subDays, format } from "date-fns";
import { OnboardingShell } from "@/components/onboarding/OnboardingShell";
import { useOnboardingState } from "@/components/onboarding/onboardingState";

function getOrdinalDay(day: number): string {
  if (day >= 11 && day <= 13) return `${day}th`;
  switch (day % 10) {
    case 1: return `${day}st`;
    case 2: return `${day}nd`;
    case 3: return `${day}rd`;
    default: return `${day}th`;
  }
}

export default function BookDatePage() {
  const router = useRouter();
  const bookDate = useOnboardingState((s) => s.bookDate);
  const setBookDate = useOnboardingState((s) => s.setBookDate);
  const bookDateUndecided = useOnboardingState((s) => s.bookDateUndecided);
  const setBookDateUndecided = useOnboardingState((s) => s.setBookDateUndecided);

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(() => {
    if (bookDate) return new Date(bookDate + "T00:00:00");
    return undefined;
  });
  const [isUndecided, setIsUndecided] = useState(bookDateUndecided);
  const [popoverOpen, setPopoverOpen] = useState(false);

  const popoverRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLDivElement>(null);

  const today = new Date();
  const fromDate = addDays(today, 24);
  const toDate = addMonths(today, 18);
  const bookCloseDate = selectedDate ? subDays(selectedDate, 20) : null;
  const canContinue = !!selectedDate || isUndecided;

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

  const handleDateSelect = useCallback((date: Date | undefined) => {
    setSelectedDate(date);
    setIsUndecided(false);
    if (date) {
      setBookDate(format(date, "yyyy-MM-dd"));
      setBookDateUndecided(false);
      setPopoverOpen(false);
    }
  }, [setBookDate, setBookDateUndecided]);

  const handleClearDate = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedDate(undefined);
    setIsUndecided(false);
    setBookDate(null);
    setBookDateUndecided(false);
  }, [setBookDate, setBookDateUndecided]);

  const handleIDontKnow = useCallback(() => {
    setIsUndecided(true);
    setSelectedDate(undefined);
    setPopoverOpen(false);
    setBookDate(null);
    setBookDateUndecided(true);
  }, [setBookDate, setBookDateUndecided]);

  function handleContinue() {
    router.push("/onboarding/about-you");
  }

  const showIDontKnow = !selectedDate && !isUndecided;

  const saveTheDateCard = selectedDate && bookCloseDate ? (
    <div
      className="bg-white border border-brand-sand rounded-2xl text-center py-10 px-8 sm:py-12 sm:px-16 w-full max-w-md"
      style={{
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
        animation: "cardIn 400ms ease-out forwards",
      }}
    >
      <p className="text-[16px] font-serif font-normal uppercase tracking-[0.05em] text-[hsl(var(--brand-warm-gray-light))] mb-2.5">
        RECIPES MUST BE SUBMITTED BY
      </p>
      <div className="w-10 h-px bg-brand-honey mx-auto mb-2.5" />
      <p className="text-2xl font-semibold text-brand-charcoal leading-snug">
        {format(bookCloseDate, "EEEE")}, {format(bookCloseDate, "MMMM")} {getOrdinalDay(bookCloseDate.getDate())}
      </p>
      <p className="text-[13px] italic text-[hsl(var(--brand-warm-gray-light))] mt-4">
        Your book arrives by {format(selectedDate, "MMMM")} {selectedDate.getDate()}.
      </p>
      <style jsx>{`
        @keyframes cardIn {
          from { opacity: 0; transform: scale(0.97); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  ) : <div />;

  return (
    <OnboardingShell
      title="When do you want your cookbook?"
      subtitle="We use this date to schedule reminders. You can change it later."
      imageUrl=""
      rightContent={saveTheDateCard}
      backHref="/onboarding/occasion"
      onContinue={handleContinue}
      continueDisabled={!canContinue}
    >
      <div className="max-w-md">
        {/* Date input field */}
        <div className="relative mb-6">
          <div
            ref={inputRef}
            role="button"
            tabIndex={0}
            onClick={() => setPopoverOpen((prev) => !prev)}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setPopoverOpen((prev) => !prev); } }}
            className="w-full h-12 px-4 flex items-center rounded-lg cursor-pointer transition-all duration-200 bg-brand-warm-white-warm"
            style={{
              border: `1px solid ${selectedDate ? "hsl(var(--brand-honey))" : popoverOpen ? "hsl(var(--brand-honey))" : "hsl(var(--brand-sand))"}`,
              boxShadow: popoverOpen ? "0 0 0 2px rgba(212, 168, 84, 0.15)" : "none",
            }}
          >
            <Calendar className="w-[18px] h-[18px] text-[hsl(var(--brand-warm-gray-light))] mr-2.5 flex-shrink-0" strokeWidth={1.5} />
            {selectedDate ? (
              <span className="text-[15px] font-medium text-brand-charcoal flex-1 text-left">
                {format(selectedDate, "MMMM d, yyyy")}
              </span>
            ) : isUndecided ? (
              <span className="text-[15px] italic text-[hsl(var(--brand-warm-gray-light))] flex-1 text-left">
                I&apos;ll decide later
              </span>
            ) : (
              <span className="text-[15px] text-[hsl(var(--brand-warm-gray-light))] flex-1 text-left">
                Pick a date
              </span>
            )}
            {selectedDate && (
              <button
                type="button"
                onClick={handleClearDate}
                className="p-1 rounded-full hover:bg-brand-sand transition-colors ml-1"
                aria-label="Clear date"
              >
                <X className="w-4 h-4 text-[hsl(var(--brand-warm-gray-light))] hover:text-brand-charcoal" strokeWidth={1.5} />
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

        {/* "I don't know yet" link */}
        <div
          className="overflow-hidden transition-all duration-200 ease-in-out"
          style={{
            maxHeight: showIDontKnow ? "40px" : "0px",
            opacity: showIDontKnow ? 1 : 0,
          }}
        >
          <button
            type="button"
            onClick={handleIDontKnow}
            className="text-sm text-brand-charcoal/50 hover:text-brand-honey transition-colors font-light underline underline-offset-2"
          >
            I don&apos;t know yet
          </button>
        </div>

        {/* Undecided message */}
        {isUndecided && (
          <p className="text-sm text-[hsl(var(--brand-warm-gray-light))]">
            No problem. You can set this from your dashboard anytime.
          </p>
        )}

        {/* Mobile-only: the shell's right panel (where this card shows on
            desktop) is hidden below lg, so render the card here too. */}
        {selectedDate && bookCloseDate && (
          <div className="lg:hidden mt-8">{saveTheDateCard}</div>
        )}
      </div>
    </OnboardingShell>
  );
}
