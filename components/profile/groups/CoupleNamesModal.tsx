"use client";

import { useEffect, useRef, useState } from "react";
import type { OrganizerRelationship } from "@/lib/types/database";

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
const LABEL_CLASS = "block text-[13px] font-medium text-[#2D2D2D] mb-1.5";
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
        <span className={selected ? "text-[#2D2D2D]" : "text-[#9A9590]"}>
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
                value === opt.value ? "bg-[#FDF9F0] text-[#2D2D2D]" : "text-[#2D2D2D]"
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

  const canSubmit =
    relationship !== "" &&
    coupleFirstName.trim() !== "" &&
    partnerFirstName.trim() !== "";

  const handleSubmit = async () => {
    if (!canSubmit || submitting) return;
    setError(null);
    setSubmitting(true);

    try {
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
        <h1 className="text-center mb-3 font-serif text-[38px] font-light leading-[1.15] text-[#2D2D2D]">
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
            <span className="text-[#2D2D2D]">{userEmail}</span>.
          </p>
          <p
            className="text-center text-[12px] text-[#C8C3BC]"
            style={{ fontFamily: SANS_FONT }}
          >
            Need help?{" "}
            <a
              href="mailto:team@smallplatesandcompany.com"
              className="underline hover:text-[#2D2D2D]"
            >
              team@smallplatesandcompany.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
