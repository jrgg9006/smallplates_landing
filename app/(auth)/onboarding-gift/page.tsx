"use client";

import React, { Suspense } from "react";
import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { OnboardingProvider, useOnboarding } from "@/lib/contexts/OnboardingContext";
import { useAuth } from "@/lib/contexts/AuthContext";
import OnboardingStep from "@/components/onboarding/OnboardingStep";
import { CustomDropdown } from "@/components/onboarding/CustomDropdown";
import { ProductSelectionStep } from "@/components/onboarding/ProductSelectionStep";
import { CheckoutSummary } from "@/components/onboarding/CheckoutSummary";
import { CheckCircle, Calendar, X } from "lucide-react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";
import { addDays, addMonths, subDays, format } from "date-fns";


function getOrdinalDay(day: number): string {
  if (day >= 11 && day <= 13) return `${day}th`;
  switch (day % 10) {
    case 1: return `${day}st`;
    case 2: return `${day}nd`;
    case 3: return `${day}rd`;
    default: return `${day}th`;
  }
}

/**
 * Step 1 Component - Gift Date Picker (popover calendar)
 */
function Step1({ isAddBookMode = false }: { isAddBookMode?: boolean }) {
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
    nextStep();
  };

  // Reason: Determine visual state for conditional rendering
  const showHint = !selectedDate && !isUndecided;
  const showIDontKnow = !selectedDate && !isUndecided;

  return (
    <OnboardingStep
      stepNumber={1}
      totalSteps={isAddBookMode ? 3 : 4}
      title="They&apos;re lucky to have you."
      imageUrl="/images/onboarding/onboarding_lemon.png"
      imageAlt="Wedding planning essentials"
    >
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div
          className="text-center transition-all duration-200 ease-in-out"
          style={{ marginBottom: showHint ? "16px" : "24px" }}
        >
          <h2 className="text-base font-medium text-[#2D2D2D]">
            When do you want to give the book?
          </h2>
        </div>

        {/* Consolidated hint — fades out + collapses when date selected or undecided */}
        <div
          className="overflow-hidden transition-all duration-200 ease-in-out"
          style={{
            maxHeight: showHint ? "50px" : "0px",
            opacity: showHint ? 1 : 0,
            marginBottom: showHint ? "16px" : "0px",
          }}
        >
          <p className="text-sm text-[#2D2D2D]/60 font-light text-center">
            Pick a date. Bridal shower, rehearsal dinner, bachelor party, or whenever feels right.
          </p>
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
              border: `1px solid ${selectedDate ? "#D4A854" : popoverOpen ? "#D4A854" : "#E8E0D5"}`,
              boxShadow: popoverOpen ? "0 0 0 2px rgba(212, 168, 84, 0.15)" : "none",
            }}
          >
            <Calendar className="w-[18px] h-[18px] text-[#9A9590] mr-2.5 flex-shrink-0" strokeWidth={1.5} />
            {selectedDate ? (
              <span className="text-[15px] font-medium text-[#2D2D2D] flex-1 text-left">
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
                <X className="w-4 h-4 text-[#9A9590] hover:text-[#2D2D2D]" strokeWidth={1.5} />
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
                  ["--rdp-accent-color" as string]: "#D4A854",
                  ["--rdp-accent-background-color" as string]: "#D4A854",
                  ["--rdp-today-color" as string]: "#D4A854",
                  ["--rdp-selected-font" as string]: "bold",
                  ["--rdp-day-height" as string]: "44px",
                  ["--rdp-day-width" as string]: "44px",
                  ["--rdp-selected-border" as string]: "none",
                  fontFamily: "inherit",
                  color: "#2D2D2D",
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
                RECIPES DUE BY
              </p>
              <div className="w-10 h-px bg-[#D4A854] mx-auto mb-2.5" />
              <p className="text-2xl sm:text-2xl font-semibold text-[#2D2D2D] leading-snug">
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
              {" "}You collect the recipes &mdash; we handle the rest.
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
              className="text-sm text-[#2D2D2D]/50 hover:text-[#D4A854] transition-colors font-light underline underline-offset-2"
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
              ? "bg-[#D4A854] text-white hover:bg-[#c49b4a]"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          Continue
        </button>
      </div>

      {/* Couple flow link */}
      <div className="text-center mt-6">
        <a
          href="/onboarding"
          className="text-xs text-[#2D2D2D]/50 hover:text-[#D4A854] hover:underline underline-offset-2 transition-colors font-light"
        >
          Are you the couple getting married?
        </a>
      </div>

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

/**
 * Step 2 Component - Product Selection
 */
function Step2Product({ isAddBookMode = false }: { isAddBookMode?: boolean }) {
  const { nextStep, previousStep, updateProductTier, state } = useOnboarding();

  const handleSelection = (tierId: string) => {
    updateProductTier(tierId);
  };

  const handleContinue = () => {
    if (state.selectedProductTier) {
      nextStep();
    }
  };

  return (
    <OnboardingStep
      stepNumber={2}
      totalSteps={isAddBookMode ? 3 : 4}
      title="Choose your collection."
      imageUrl="/images/onboarding/onboarding_lemon.png"
      imageAlt="Product selection"
    >
      <ProductSelectionStep
        selectedTierId={state.selectedProductTier}
        onSelect={handleSelection}
      />

      {/* Navigation */}
      <div className="flex justify-between mt-8">
        <button
          type="button"
          onClick={previousStep}
          className="px-6 py-3 text-gray-600 font-medium hover:text-gray-900 transition-colors"
        >
          Back
        </button>
        <button
          type="button"
          onClick={handleContinue}
          disabled={!state.selectedProductTier}
          className={`px-8 py-3 rounded-xl font-semibold transition-colors ${
            state.selectedProductTier
              ? "bg-[#D4A854] text-white hover:bg-[#c49b4a]"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          Continue
        </button>
      </div>
    </OnboardingStep>
  );
}

/**
 * Step 3 Component - Contact & Gift Setup
 */
function Step3({ isAddBookMode = false }: { isAddBookMode?: boolean }) {
  const { state, nextStep, previousStep, updateStepData, completeOnboarding } = useOnboarding();
  const { user } = useAuth();
  
  // Initialize from saved state if available
  const savedData = state.answers.step3 as {
    giftGiverName?: string;
    firstName?: string;
    partnerFirstName?: string;
    relationship?: string;
  } | undefined;

  const [giftGiverName, setGiftGiverName] = useState(savedData?.giftGiverName || "");
  const [firstName, setFirstName] = useState(savedData?.firstName || "");
  const [partnerFirstName, setPartnerFirstName] = useState(savedData?.partnerFirstName || "");
  const [relationship, setRelationship] = useState(savedData?.relationship || "");
  const [loading, setLoading] = useState(false);


  const handleContinue = async () => {
    // Reason: Skip giftGiverName validation when user is already authenticated
    if ((!isAddBookMode && !giftGiverName.trim()) || !firstName.trim() || !partnerFirstName.trim() || !relationship) {
      return;
    }

    // Build step3 data
    const step3Data = {
      ...(isAddBookMode ? {} : { giftGiverName: giftGiverName.trim() }),
      firstName: firstName.trim(),
      partnerFirstName: partnerFirstName.trim(),
      relationship: relationship
    };

    // Store gift info in context
    await updateStepData(3, step3Data);
    
    // Reason: If add-book mode, complete onboarding directly (skip Step4 account creation)
    if (isAddBookMode) {
      setLoading(true);
      try {
        // Pass step1 and step3 data directly to avoid async state timing issues
        // Use existing user's email since they're already authenticated
        await completeOnboarding(user?.email, undefined, {
          step1: state.answers.step1,
          step3: step3Data
        });
      } finally {
        setLoading(false);
      }
    } else {
      nextStep();
    }
  };

  // Reason: Skip giftGiverName validation when user is already authenticated
  const isFormValid = (isAddBookMode || giftGiverName.trim()) && firstName.trim() && partnerFirstName.trim() && relationship;

  return (
    <OnboardingStep
      stepNumber={3}
      totalSteps={isAddBookMode ? 3 : 4}
      title="Almost there."
      imageUrl="/images/onboarding/onboarding_lemon.png"
      imageAlt="Wedding planning essentials"
    >
      <div className="max-w-lg mx-auto">
        {/* Personalized Message */}
        <div className="text-center mb-8">
          <h2 className="text-base font-medium text-[#2D2D2D] mb-1">
            Just a few details. Then the fun part starts.
          </h2>
        </div>

        {/* Gift Setup Form */}
        <div className="space-y-6 mb-8">
              {/* Hide "Your name" for authenticated users creating additional books */}
              {!isAddBookMode && (
                <div>
                  <label htmlFor="giftGiverName" className="block text-sm font-medium text-[#2D2D2D] mb-1">
                    Your name
                  </label>
                  <input
                    id="giftGiverName"
                    type="text"
                    required
                    value={giftGiverName}
                    onChange={(e) => setGiftGiverName(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#D4A854] focus:border-transparent outline-none transition-all"
                    placeholder="Your name"
                  />
                </div>
              )}

              {/* Couple Names */}
              <div>
                <p className="block text-sm font-medium text-[#2D2D2D] mb-3">Who&apos;s getting married?</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="block text-xs font-medium text-[#2D2D2D]/70 mb-1">
                      First name
                    </label>
                  <input
                    id="firstName"
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#D4A854] focus:border-transparent outline-none transition-all"
                    placeholder="First name"
                  />
                </div>
                  <div>
                    <label htmlFor="partnerFirstName" className="block text-xs font-medium text-[#2D2D2D]/70 mb-1">
                      Partner&apos;s first name
                    </label>
                  <input
                    id="partnerFirstName"
                    type="text"
                    required
                    value={partnerFirstName}
                    onChange={(e) => setPartnerFirstName(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#D4A854] focus:border-transparent outline-none transition-all"
                    placeholder="Partner's name"
                  />
                  </div>
                </div>
              </div>

              {/* Relationship */}
              <CustomDropdown
                label="Your relationship to the couple"
                placeholder="Select your relationship"
                value={relationship}
                onChange={setRelationship}
                options={[
                  { value: "friend", label: "I'm a friend" },
                  { value: "family", label: "I'm family" },
                  { value: "bridesmaid", label: "I'm a bridesmaid" },
                  { value: "wedding-planner", label: "I'm a wedding planner" },
                  { value: "other", label: "Other" }
                ]}
              />

            </div>

            {/* Confidence building message */}

            {/* Navigation */}
            <div className="flex justify-between items-center">
              <button
                type="button"
                onClick={previousStep}
                disabled={loading}
                className="px-6 py-3 text-gray-600 font-medium hover:text-gray-900 transition-colors disabled:opacity-50"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleContinue}
                disabled={!isFormValid || loading}
                className={`px-8 py-3 rounded-xl font-semibold transition-colors ${
                  isFormValid && !loading
                    ? "bg-[#D4A854] text-white hover:bg-[#c49b4a]"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                {loading ? (
                  <>
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block"></span>
                    Creating...
                  </>
                ) : isAddBookMode ? (
                  "Create Book"
                ) : (
                  "Continue"
                )}
              </button>
            </div>
      </div>
    </OnboardingStep>
  );
}

/**
 * Step 4 Component - Checkout & Account Creation
 * Reason: Password removed for soft launch - accounts created manually after Venmo payment
 */
function Step4() {
  const { previousStep, completeOnboarding, updateStepData, state } = useOnboarding();

  // Initialize from saved state if available
  const savedData = state.answers.step4 as {
    email?: string;
    shippingDestination?: string;
  } | undefined;

  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState(savedData?.email || "");
  const [emailError, setEmailError] = useState("");
  const [shippingDestination, setShippingDestination] = useState(savedData?.shippingDestination || "");
  const [shippingError, setShippingError] = useState("");
  const [forceExpanded, setForceExpanded] = useState(false);

  // Email validation
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailBlur = () => {
    if (email.trim() && !validateEmail(email.trim())) {
      setEmailError("Please enter a valid email address");
    } else {
      setEmailError("");
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (emailError) {
      setEmailError("");
    }
  };

  const handleShippingChange = (destination: string) => {
    setShippingDestination(destination);
    if (shippingError) setShippingError("");
  };

  const handleCompletePurchase = async () => {
    if (!shippingDestination) {
      setShippingError("Please select a shipping destination");
      setForceExpanded(true);
      return;
    }

    if (!validateEmail(email.trim())) {
      return;
    }

    setLoading(true);

    try {
      // Store email and shipping in context
      await updateStepData(4, {
        email: email.trim(),
        shippingDestination,
      });

      // Save to purchase_intents and show success screen
      await completeOnboarding(email.trim());

      // Note: completeOnboarding sets isComplete=true, which triggers success screen
      setLoading(false);
    } catch (err) {
      console.error("Error in handleCompletePurchase:", err);
      setLoading(false);
    }
  };

  const isFormValid = validateEmail(email.trim()) && !emailError;

  // Get gift giver and couple info from step 3 (gift giver info step)
  const step3Data = state.answers.step3 as {
    giftGiverName?: string;
    firstName?: string;
    partnerFirstName?: string;
    relationship?: string;
  } | undefined;
  
  const giftGiverName = step3Data?.giftGiverName;
  const coupleNames = step3Data
    ? {
        brideFirstName: step3Data.firstName,
        partnerFirstName: step3Data.partnerFirstName,
      }
    : undefined;

  return (
    <OnboardingStep
      stepNumber={4}
      totalSteps={4}
      title="Complete your purchase."
      imageUrl="/images/onboarding/onboarding_lemon.png"
      imageAlt="Checkout"
    >
      <div className="max-w-lg mx-auto">
        <CheckoutSummary
          selectedTierId={state.selectedProductTier}
          coupleNames={coupleNames}
          giftGiverName={giftGiverName}
          email={email}
          emailError={emailError}
          loading={loading}
          onEmailChange={handleEmailChange}
          onEmailBlur={handleEmailBlur}
          onCompletePurchase={handleCompletePurchase}
          isFormValid={isFormValid}
          shippingDestination={shippingDestination}
          onShippingChange={handleShippingChange}
          shippingError={shippingError}
          forceExpanded={forceExpanded}
        />

        {/* Navigation */}
        <div className="flex justify-between items-center mt-8">
          <button
            type="button"
            onClick={previousStep}
            disabled={loading}
            className="px-6 py-3 text-gray-600 font-medium hover:text-gray-900 transition-colors disabled:opacity-50"
          >
            Back
          </button>
          <button
            type="button"
            onClick={handleCompletePurchase}
            disabled={loading}
            className={`px-12 py-4 rounded-2xl text-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              isFormValid && shippingDestination
                ? "bg-[#D4A854] text-white hover:bg-[#c49b4a]"
                : "bg-gray-300 text-gray-500"
            }`}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2 inline-block"></div>
                Processing...
              </>
            ) : (
              "Reserve Your Book"
            )}
          </button>
        </div>
      </div>
    </OnboardingStep>
  );
}

/**
 * Success Screen Component - Shown after completing soft launch checkout
 * Uses OnboardingStep for consistent styling and X button to close
 */
function SuccessScreen() {
  return (
    <OnboardingStep
      stepNumber={4}
      totalSteps={4}
      title="It's happening."
      imageUrl="/images/onboarding/onboarding_lemon.png"
      imageAlt="Success"
      hideProgress={true}
    >
      <div className="max-w-sm mx-auto text-center">
        {/* Success Icon */}
        <div className="w-16 h-16 mx-auto mb-12 rounded-full bg-[#D4A854]/10 flex items-center justify-center">
          <CheckCircle className="w-8 h-8 text-[#D4A854]" />
        </div>

        {/* Single Line */}
        <p className="text-[#2D2D2D]/60 font-light mb-12">
          We&apos;ll be in touch within 24 hours.
        </p>

        {/* Tagline */}
        <p className="text-[#D4A854] font-medium text-lg mb-16">
          You&apos;re about to be the MVP of this wedding.
        </p>

        {/* Contact */}
        <p className="text-sm text-[#2D2D2D]/40 font-light">
          Questions?{" "}
          <a
            href="mailto:team@smallplatesandcompany.com"
            className="text-[#2D2D2D]/50 hover:text-[#D4A854] transition-colors"
          >
            team@smallplatesandcompany.com
          </a>
        </p>
      </div>
    </OnboardingStep>
  );
}

/**
 * Main Gift Onboarding Page Component
 * Manages the 4-step gift giver flow
 */
function GiftOnboardingContent({ isAddBookMode }: { isAddBookMode: boolean }) {
  const { state } = useOnboarding();

  // Show success screen when onboarding is complete
  if (state.isComplete) {
    return <SuccessScreen />;
  }

  return (
    <div className="min-h-screen bg-white">
      {state.currentStep === 1 && <Step1 isAddBookMode={isAddBookMode} />}
      {state.currentStep === 2 && <Step2Product isAddBookMode={isAddBookMode} />}
      {state.currentStep === 3 && <Step3 isAddBookMode={isAddBookMode} />}
      {state.currentStep === 4 && !isAddBookMode && <Step4 />}
    </div>
  );
}

/**
 * Inner component that uses useSearchParams (requires Suspense boundary)
 */
function GiftOnboardingPageInner() {
  const searchParams = useSearchParams();
  const { user, loading } = useAuth();

  // Reason: add-book mode only applies when user is already authenticated
  const wantsAddBookMode = searchParams.get('mode') === 'add-book';
  const isAddBookMode = wantsAddBookMode && !!user;

  // Reason: Wait for auth to load before rendering if user wants add-book mode
  // This prevents flash of wrong content and ensures user state is known
  if (wantsAddBookMode && loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D4A854]"></div>
      </div>
    );
  }

  return (
    <OnboardingProvider
      userType="gift_giver"
      skipAuth={isAddBookMode}
      existingUserId={user?.id}
    >
      <GiftOnboardingContent isAddBookMode={isAddBookMode} />
    </OnboardingProvider>
  );
}

/**
 * Page wrapper with Suspense boundary for useSearchParams
 */
export default function GiftOnboardingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center">Loading...</div>}>
      <GiftOnboardingPageInner />
    </Suspense>
  );
}