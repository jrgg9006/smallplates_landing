"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useOnboarding } from "@/lib/contexts/OnboardingContext";

import { CustomDropdown } from "@/components/onboarding/CustomDropdown";
import { createSupabaseClient } from "@/lib/supabase/client";
import { Calendar, Eye, EyeOff } from "lucide-react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";
import { format } from "date-fns";

interface PostPaymentSetupProps {
  userType: "couple" | "gift_giver";
}

// Reason: Reusable label style matching the editorial design spec
const labelClass = "block text-sm font-medium text-[#2D2D2D] mb-1";
const inputClass = "w-full px-4 py-3.5 bg-white border border-[#E8E0D5] rounded-xl text-[15px] text-[#2D2D2D] outline-none transition-all focus:ring-2 focus:ring-[#D4A854] focus:border-transparent";

/**
 * Shared post-payment setup step for both couple and gift giver flows.
 * Full-screen editorial welcome moment — not a modal step.
 */
export function PostPaymentSetup({ userType }: PostPaymentSetupProps) {
  const { state, completeOnboarding } = useOnboarding();
  const router = useRouter();

  const savedData = state.answers.step4 as {
    buyerName?: string;
    firstName?: string;
    partnerFirstName?: string;
    relationship?: string;
    weddingDate?: string;
    dateUndecided?: boolean;
  } | undefined;

  const [buyerName, setBuyerName] = useState(savedData?.buyerName || "");
  const [firstName, setFirstName] = useState(savedData?.firstName || "");
  const [partnerFirstName, setPartnerFirstName] = useState(savedData?.partnerFirstName || "");
  const [relationship, setRelationship] = useState(savedData?.relationship || "");
  const [weddingDate, setWeddingDate] = useState<Date | undefined>(() => {
    if (savedData?.weddingDate && savedData.weddingDate !== "undecided") {
      return new Date(savedData.weddingDate + "T00:00:00");
    }
    return undefined;
  });
  const [dateUndecided, setDateUndecided] = useState(savedData?.dateUndecided || false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [isExistingUser, setIsExistingUser] = useState(false);
  const [isCheckingUser, setIsCheckingUser] = useState(true);

  const calendarRef = useRef<HTMLDivElement>(null);
  const dateInputRef = useRef<HTMLDivElement>(null);

  const emailFromStep3 = (state.answers.step3 as { email?: string } | undefined)?.email || "";

  // Reason: Detect returning users so we skip password creation and pre-fill their name
  useEffect(() => {
    if (!emailFromStep3) {
      setIsCheckingUser(false);
      return;
    }
    fetch("/api/stripe/check-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: emailFromStep3 }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.exists) {
          setIsExistingUser(true);
          if (data.fullName) setBuyerName(data.fullName);
        }
      })
      .catch(() => {
        // Reason: On failure, fall back to new-user flow (show password field)
      })
      .finally(() => setIsCheckingUser(false));
  }, [emailFromStep3]); // eslint-disable-line react-hooks/exhaustive-deps

  const step1Data = state.answers.step1 as {
    gift_date?: string | null;
    gift_date_undecided?: boolean;
    book_close_date?: string | null;
  } | undefined;

  // Reason: Close calendar on click outside or Escape
  useEffect(() => {
    if (!calendarOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(e.target as Node) &&
          dateInputRef.current && !dateInputRef.current.contains(e.target as Node)) {
        setCalendarOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => { if (e.key === "Escape") setCalendarOpen(false); };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => { document.removeEventListener("mousedown", handleClickOutside); document.removeEventListener("keydown", handleEscape); };
  }, [calendarOpen]);

  const handleDateSelect = useCallback((date: Date | undefined) => {
    setWeddingDate(date);
    setDateUndecided(false);
    if (date) setCalendarOpen(false);
  }, []);

  const isPasswordValid = password.length >= 8;
  const passwordSatisfied = isExistingUser || isPasswordValid;
  // Reason: Skip buyerName validation for existing users — name comes from their profile
  const buyerNameSatisfied = isExistingUser || !!buyerName.trim();
  const isFormValid = !isCheckingUser && (userType === "couple"
    ? buyerNameSatisfied && partnerFirstName.trim() && (weddingDate || dateUndecided) && passwordSatisfied
    : buyerNameSatisfied && firstName.trim() && partnerFirstName.trim() && relationship && passwordSatisfied);

  const handleSubmit = async () => {
    if (!isFormValid) return;
    setIsSubmitting(true);
    setError("");

    try {
      const coupleFirstName = userType === "couple" ? buyerName.trim() : firstName.trim();

      const res = await fetch("/api/stripe/complete-onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentIntentId: state.paymentIntentId,
          email: emailFromStep3,
          buyerName: buyerName.trim(),
          coupleFirstName,
          partnerFirstName: partnerFirstName.trim(),
          relationship: userType === "couple" ? "couple" : relationship,
          giftDate: step1Data?.gift_date || null,
          giftDateUndecided: step1Data?.gift_date_undecided || false,
          bookCloseDate: step1Data?.book_close_date || null,
          weddingDate: userType === "couple"
            ? (dateUndecided ? null : weddingDate ? format(weddingDate, "yyyy-MM-dd") : null)
            : null,
          weddingDateUndecided: userType === "couple" ? dateUndecided : false,
          userType,
          password: isExistingUser ? undefined : password,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        setError(result.error || "Something went wrong. Please try again.");
        setIsSubmitting(false);
        return;
      }

      if (result.tokenHash) {
        const supabase = createSupabaseClient();
        const { error: otpError } = await supabase.auth.verifyOtp({
          token_hash: result.tokenHash,
          type: "magiclink",
        });
        if (otpError) console.error("Auto-login failed:", otpError);
      }

      await completeOnboarding();
      router.push("/profile/groups");
    } catch {
      setError("Something went wrong. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#FAF8F4" }}>
      <div className="max-w-[480px] w-full mx-auto px-6 py-8 flex flex-col items-center">

        {/* Logo */}
        <img
          src="/images/SmallPlates_logo_horizontal1.png"
          alt="Small Plates & Co."
          className="w-auto max-w-[160px] mb-10"
        />

        {/* Headline */}
        <h1
          className="text-center mb-3 font-serif text-[38px] font-light leading-[1.15] text-[#2D2D2D]"
        >
          Your book<br />
          <em>starts here.</em>
        </h1>

        {/* Payment badge */}
        <div className="flex items-center gap-2 mb-8">
          <div className="w-[7px] h-[7px] rounded-full" style={{ background: "#3D9970" }} />
          <span
            className="text-[11px] tracking-[0.12em] uppercase"
            style={{ color: "#3D9970", fontFamily: "'DM Sans', system-ui, sans-serif", fontWeight: 500 }}
          >
            Payment received
          </span>
        </div>

        {/* Welcome back banner — above form for returning users */}
        {!isCheckingUser && isExistingUser && (
          <div className="w-full rounded-xl bg-[#F0EDE8] px-4 py-3.5 mb-2">
            <p className="text-[14px] text-[#2D2D2D]" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
              Welcome back{buyerName ? `, ${buyerName.split(" ")[0]}` : ""}. Your account is already set up.
            </p>
          </div>
        )}

        {/* Form fields */}
        <div className="w-full space-y-6">
          {/* Your name — hidden for returning users */}
          {!isExistingUser && (
            <div>
              <label htmlFor="buyerName" className={labelClass}>Your name</label>
              <input
                id="buyerName"
                type="text"
                required
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
                className={inputClass}
                placeholder="Your name"
                style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
              />
            </div>
          )}

          {userType === "gift_giver" ? (
            <>
              {/* Gift giver: couple's names */}
              <div>
                <p className={labelClass}>Who&apos;s getting married?</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <input id="coupleFirst" type="text" required value={firstName} onChange={(e) => setFirstName(e.target.value)}
                      className={inputClass} placeholder="First name" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }} />
                  </div>
                  <div>
                    <input id="partnerFirst" type="text" required value={partnerFirstName} onChange={(e) => setPartnerFirstName(e.target.value)}
                      className={inputClass} placeholder="Partner's name" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }} />
                  </div>
                </div>
              </div>

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
                  { value: "other", label: "Other" },
                ]}
              />
            </>
          ) : (
            <>
              {/* Couple: partner's name + wedding date */}
              <div>
                <label htmlFor="partnerName" className={labelClass}>Partner&apos;s name</label>
                <input id="partnerName" type="text" required value={partnerFirstName} onChange={(e) => setPartnerFirstName(e.target.value)}
                  className={inputClass} placeholder="Partner's first name" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }} />
              </div>

              {/* Wedding date */}
              <div>
                <label className={labelClass}>Wedding date</label>
                <div className="relative">
                  <div
                    ref={dateInputRef}
                    role="button"
                    tabIndex={0}
                    onClick={() => setCalendarOpen((prev) => !prev)}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setCalendarOpen((prev) => !prev); } }}
                    className="w-full px-4 h-[52px] flex items-center rounded-xl cursor-pointer transition-all duration-200"
                    style={{
                      background: dateUndecided ? "#F3F4F6" : "white",
                      border: `1px solid ${weddingDate ? "#D4A854" : calendarOpen ? "#D4A854" : "#E8E0D5"}`,
                      boxShadow: calendarOpen ? "0 0 0 2px rgba(212, 168, 84, 0.15)" : "none",
                    }}
                  >
                    <Calendar className="w-[18px] h-[18px] text-[#9A9590] mr-2.5 flex-shrink-0" strokeWidth={1.5} />
                    {weddingDate ? (
                      <span className="text-[15px] font-medium text-[#2D2D2D] flex-1 text-left" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>{format(weddingDate, "MMMM d, yyyy")}</span>
                    ) : dateUndecided ? (
                      <span className="text-[15px] italic text-[#9A9590] flex-1 text-left" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>We&apos;ll decide later</span>
                    ) : (
                      <span className="text-[15px] text-[#9A9590] flex-1 text-left" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>Pick a date</span>
                    )}
                  </div>

                  {calendarOpen && (
                    <div ref={calendarRef} className="absolute left-0 right-0 z-50 mt-2 bg-white rounded-xl p-4 flex justify-center"
                      style={{ boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)" }}>
                      <DayPicker
                        mode="single"
                        selected={weddingDate}
                        onSelect={handleDateSelect}
                        defaultMonth={weddingDate || new Date()}
                        style={{
                          ["--rdp-accent-color" as string]: "#D4A854",
                          ["--rdp-accent-background-color" as string]: "#D4A854",
                          ["--rdp-today-color" as string]: "#D4A854",
                          ["--rdp-day-height" as string]: "44px",
                          ["--rdp-day-width" as string]: "44px",
                          ["--rdp-selected-border" as string]: "none",
                          fontFamily: "'DM Sans', system-ui, sans-serif",
                          color: "#2D2D2D",
                        }}
                      />
                    </div>
                  )}
                </div>

                <div className="mt-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={dateUndecided}
                      onChange={(e) => { setDateUndecided(e.target.checked); if (e.target.checked) { setWeddingDate(undefined); setCalendarOpen(false); } }}
                      className="rounded border-gray-300 text-[#D4A854] focus:ring-[#D4A854] mr-2"
                    />
                    <span className="text-sm text-[#2D2D2D]/70" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>We&apos;re still deciding</span>
                  </label>
                </div>
              </div>
            </>
          )}

          {/* Password — hidden for returning users */}
          {isCheckingUser ? null : isExistingUser ? null : (
            <div>
              <label htmlFor="password" className={labelClass}>Create a password</label>
              <p className="text-[13px] text-[#9A9590] mb-2" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
                So you can log back in anytime.
              </p>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputClass}
                  placeholder="Min. 8 characters"
                  style={{ fontFamily: "'DM Sans', system-ui, sans-serif", paddingRight: "48px" }}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#9A9590] hover:text-[#2D2D2D] transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-[18px] h-[18px]" strokeWidth={1.5} /> : <Eye className="w-[18px] h-[18px]" strokeWidth={1.5} />}
                </button>
              </div>
              {password.length > 0 && password.length < 8 && (
                <p className="mt-1.5 text-[12px] text-red-500" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
                  Password must be at least 8 characters.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Error block */}
        {error && (
          <div className="w-full mb-6 mt-6 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Submit button */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!isFormValid || isSubmitting}
          className={`w-full mt-10 py-4 px-6 rounded-xl text-[15px] font-medium transition-colors ${
            isFormValid && !isSubmitting
              ? "bg-[#2D2D2D] text-white hover:bg-[#1a1a1a]"
              : "bg-gray-300 text-gray-400 cursor-not-allowed"
          }`}
          style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
        >
          {isSubmitting ? "Setting up your book..." : "Open your dashboard \u2192"}
        </button>

        {/* Footer note */}
        <p className="mt-5 text-[14px] text-[#C8C3BC] text-center" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
          {isExistingUser
            ? <>You&apos;re already set up. We&apos;ll send a confirmation to <span className="font-medium text-[#9A9590]">{emailFromStep3}</span>.</>
            : <>We&apos;ll also email a login link to <span className="font-medium text-[#9A9590]">{emailFromStep3}</span>.</>}
        </p>

        <p className="mt-3 text-[12px] text-[#C8C3BC] text-center" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
          Need help? <a href="mailto:team@smallplatesandcompany.com" className="underline underline-offset-2 hover:text-[#9A9590] transition-colors">team@smallplatesandcompany.com</a>
        </p>
      </div>
    </div>
  );
}
