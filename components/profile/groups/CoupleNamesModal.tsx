"use client";

import { useEffect, useRef, useState } from "react";
import type { OrganizerRelationship } from "@/lib/types/database";
import { createSupabaseClient } from "@/lib/supabase/client";

interface CoupleNamesModalProps {
  open: boolean;
  groupId: string;
  userEmail: string;
  isFirstBook?: boolean;
  onComplete: () => Promise<void> | void;
}

const RELATIONSHIP_OPTIONS = [
  { value: "couple", label: "I'm one of the couple" },
  { value: "family", label: "I'm family" },
  { value: "friend", label: "I'm a friend" },
  { value: "wedding-planner", label: "I'm the wedding planner" },
];

const SANS_FONT = "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
const LABEL_CLASS = "block text-[13px] font-medium text-brand-charcoal mb-1.5";
const INPUT_CLASS =
  "w-full px-4 h-[52px] border border-[#E8E0D5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4A854] focus:border-transparent text-[15px] bg-white transition-all";

/**
 * Inline dropdown styled identically to the text inputs (same height, border, font size).
 * Lightweight alternative to components/onboarding/CustomDropdown which uses a different
 * heavier visual treatment.
 */
function RelationshipDropdown({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selected = RELATIONSHIP_OPTIONS.find((o) => o.value === value);

  return (
    <div className="relative" ref={ref}>
      <label className={LABEL_CLASS} style={{ fontFamily: SANS_FONT }}>
        Your relationship to the couple
      </label>

      <button
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        className={`${INPUT_CLASS} flex items-center justify-between text-left`}
        style={{ fontFamily: SANS_FONT }}
      >
        <span className={selected ? "text-brand-charcoal" : "text-[#9A9590]"}>
          {selected ? selected.label : "Select your relationship"}
        </span>
        <svg
          className={`w-4 h-4 text-[#9A9590] transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div
          className="absolute z-[60] w-full mt-2 bg-white border border-[#E8E0D5] rounded-xl shadow-lg overflow-hidden"
          style={{ fontFamily: SANS_FONT }}
        >
          {RELATIONSHIP_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
              className={`w-full px-4 py-3 text-left text-[15px] hover:bg-[#FAF7F2] transition-colors ${
                value === opt.value ? "bg-[#FDF9F0] text-brand-charcoal" : "text-brand-charcoal"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Full-page setup screen shown post-payment on /profile/groups when the user's group
 * is still `pending_setup`. Collects organizer relationship + couple first names.
 */
export function CoupleNamesModal({ open, groupId, userEmail, isFirstBook = true, onComplete }: CoupleNamesModalProps) {
  const [relationship, setRelationship] = useState<string>("");
  const [coupleFirstName, setCoupleFirstName] = useState("");
  const [partnerFirstName, setPartnerFirstName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const hasPassword = password.length > 0;
  const isPasswordValid = !hasPassword || password.length >= 8;

  const canSubmit =
    relationship !== "" &&
    coupleFirstName.trim() !== "" &&
    partnerFirstName.trim() !== "" &&
    isPasswordValid;

  const handleSubmit = async () => {
    if (!canSubmit || submitting) return;
    setError(null);
    setPasswordError(null);
    setSubmitting(true);

    try {
      // 1. Persist names + relationship (the critical work — blocks the flow if it fails).
      const res = await fetch(`/api/v1/groups/${groupId}/complete-setup`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          coupleFirstName: coupleFirstName.trim(),
          partnerFirstName: partnerFirstName.trim(),
          organizerRelationship: relationship as OrganizerRelationship,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || "Could not save. Try again.");
      }

      // 2. Optional password — if the user typed one, try to set it on their Supabase
      //    auth user. Failure here is non-blocking: names are already saved, and they
      //    can always set a password later from account settings.
      let passwordSetFailed = false;
      if (hasPassword) {
        try {
          const supabase = createSupabaseClient();
          const { error: passwordErr } = await supabase.auth.updateUser({
            password,
          });
          if (passwordErr) {
            console.error("CoupleNamesModal: password update failed", passwordErr);
            passwordSetFailed = true;
          }
        } catch (err) {
          console.error("CoupleNamesModal: password update threw", err);
          passwordSetFailed = true;
        }
      }

      // 3. If the password set failed, surface a non-blocking banner before the modal
      //    unmounts. Give the user ~2.5s to read it. The main flow still proceeds.
      if (passwordSetFailed) {
        setPasswordError(
          "Password couldn't be set. You can try again from your account settings."
        );
        await new Promise((resolve) => setTimeout(resolve, 2500));
      }

      // 4. Complete flow — parent will re-fetch, group becomes 'active', modal unmounts.
      await onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 min-h-screen overflow-y-auto"
      style={{ background: "#FAF8F4" }}
    >
      <div className="max-w-[480px] w-full mx-auto px-6 py-12 md:py-16 flex flex-col items-center">
        {/* Logo */}
        <img
          src="/images/SmallPlates_logo_horizontal1.png"
          alt="Small Plates & Co."
          className="w-auto max-w-[160px] mb-20"
        />

        {/* Headline — swaps copy for returning customers buying their Nth book. */}
        <h1 className="text-center mb-3 font-serif text-[38px] font-light leading-[1.15] text-brand-charcoal">
          {isFirstBook ? (
            <>
              Your book<br />
              <em>starts here.</em>
            </>
          ) : (
            <>
              Your next book<br />
              <em>starts here.</em>
            </>
          )}
        </h1>

        {/* Payment received badge */}
        <div className="flex items-center gap-2 mb-10">
          <div className="w-[7px] h-[7px] rounded-full" style={{ background: "#3D9970" }} />
          <span
            className="text-[11px] tracking-[0.12em] uppercase"
            style={{ color: "#3D9970", fontFamily: SANS_FONT, fontWeight: 500 }}
          >
            Payment received
          </span>
        </div>

        <div className="w-full space-y-6">
          {/* Couple first names */}
          <div>
            <p className={LABEL_CLASS} style={{ fontFamily: SANS_FONT }}>
              Who&apos;s getting married?
            </p>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                value={coupleFirstName}
                onChange={(e) => setCoupleFirstName(e.target.value)}
                placeholder="First name"
                className={INPUT_CLASS}
                style={{ fontFamily: SANS_FONT }}
              />
              <input
                type="text"
                value={partnerFirstName}
                onChange={(e) => setPartnerFirstName(e.target.value)}
                placeholder="Partner's first name"
                className={INPUT_CLASS}
                style={{ fontFamily: SANS_FONT }}
              />
            </div>
          </div>

          {/* Relationship dropdown — matches input styling */}
          <RelationshipDropdown value={relationship} onChange={setRelationship} />

          {/* Password field — optional. For future email+password logins; the user
              can always request a magic link if they forget it.
              Gated on isFirstBook: returning customers already have credentials
              and supabase.auth.updateUser would silently overwrite their password. */}
          {isFirstBook && (
            <div className="w-full">
              <label
                className={LABEL_CLASS}
                style={{ fontFamily: SANS_FONT }}
                htmlFor="password-input"
              >
                Create a password
              </label>
              <p
                className="text-[13px] text-[#9A9590] mb-2"
                style={{ fontFamily: SANS_FONT }}
              >
                So you can log in later without waiting for an email.
              </p>

              <div className="relative">
                <input
                  id="password-input"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (passwordError) setPasswordError(null);
                  }}
                  className={`${INPUT_CLASS} pr-12`}
                  style={{ fontFamily: SANS_FONT }}
                  placeholder="8+ characters"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9A9590] hover:text-brand-charcoal transition-colors p-1"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>

              {hasPassword && !isPasswordValid && (
                <p
                  className="text-[12px] text-red-500 mt-1.5"
                  style={{ fontFamily: SANS_FONT }}
                >
                  Password must be at least 8 characters.
                </p>
              )}
            </div>
          )}

          {passwordError && (
            <div className="w-full rounded-lg border border-blue-200 bg-blue-50 p-3">
              <p
                className="text-[13px] text-blue-700"
                style={{ fontFamily: SANS_FONT }}
              >
                {passwordError}
              </p>
            </div>
          )}

          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3">
              <p className="text-[13px] text-red-600" style={{ fontFamily: SANS_FONT }}>
                {error}
              </p>
            </div>
          )}

          {/* CTA */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit || submitting}
            className="w-full h-[56px] bg-[#D4A854] hover:bg-[#c49b4a] disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors text-[15px] mt-2"
            style={{ fontFamily: SANS_FONT }}
          >
            {submitting ? "Saving..." : "Open your dashboard →"}
          </button>

          {/* Footer copy under CTA */}
          <p
            className="text-center text-[13px] text-[#9A9590] leading-relaxed"
            style={{ fontFamily: SANS_FONT }}
          >
            We&apos;ll also email a login link to{" "}
            <span className="text-brand-charcoal">{userEmail}</span>.
          </p>
          <p
            className="text-center text-[12px] text-[#C8C3BC]"
            style={{ fontFamily: SANS_FONT }}
          >
            Need help?{" "}
            <a
              href="mailto:team@smallplatesandcompany.com"
              className="underline hover:text-brand-charcoal"
            >
              team@smallplatesandcompany.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
