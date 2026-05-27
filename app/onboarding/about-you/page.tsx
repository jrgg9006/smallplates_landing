"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { OnboardingShell } from "@/components/onboarding/OnboardingShell";
import { useOnboardingState } from "@/components/onboarding/onboardingState";
import { createSupabaseClient } from "@/lib/supabase/client";

export default function AboutYouPage() {
  const router = useRouter();
  const { occasion, bookDate, bookDateUndecided, reset } = useOnboardingState();
  const [coupleFirstName, setCoupleFirstName] = useState("");
  const [partnerFirstName, setPartnerFirstName] = useState("");
  const [yourName, setYourName] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    setSubmitting(true);
    setError("");

    try {
      // 1. Create user + group + get session token — single request.
      const res = await fetch("/api/v1/groups/free", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          yourName,
          coupleFirstName,
          partnerFirstName,
          occasion,
          bookDate,
          bookDateUndecided,
        }),
      });

      if (!res.ok) {
        const { error: errMsg } = await res.json();
        setError(errMsg || "Something went wrong");
        setSubmitting(false);
        return;
      }

      const { groupId, tokenHash } = await res.json();

      // 2. Establish session in the browser using the token hash.
      const supabase = createSupabaseClient();
      await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: "magiclink",
      });

      // 3. Done — clear onboarding state and advance.
      reset();
      router.push(`/onboarding/co-organizer?groupId=${groupId}`);
    } catch {
      setError("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  const canSubmit = !submitting
    && coupleFirstName.trim() !== ""
    && partnerFirstName.trim() !== ""
    && yourName.trim() !== ""
    && email.trim() !== "";

  return (
    <OnboardingShell
      title="Let's get started."
      imageUrl=""
      backHref="/onboarding/book-date"
      onContinue={handleSubmit}
      continueDisabled={!canSubmit}
    >
      <div className="space-y-5 max-w-lg">
        {/* Couple names */}
        <div>
          <label className="input-label">Who&apos;s the book for?</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              value={coupleFirstName}
              onChange={(e) => setCoupleFirstName(e.target.value)}
              className="input-field"
              placeholder="First name"
            />
            <input
              type="text"
              value={partnerFirstName}
              onChange={(e) => setPartnerFirstName(e.target.value)}
              className="input-field"
              placeholder="Partner's first name"
            />
          </div>
        </div>

        {/* Organizer name */}
        <div>
          <label htmlFor="your-name" className="input-label">Your name</label>
          <input
            id="your-name"
            type="text"
            value={yourName}
            onChange={(e) => setYourName(e.target.value)}
            className="input-field"
            placeholder="Maria Garcia"
          />
        </div>

        {/* Email */}
        <div>
          <label htmlFor="your-email" className="input-label">Your email</label>
          <input
            id="your-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-field"
            placeholder="maria@example.com"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <p className="text-[12px] text-gray-400 leading-relaxed pt-2">
          By continuing, you agree to our{" "}
          <a href="/terms" target="_blank" className="underline hover:text-gray-600">terms of service</a>
          {" "}and{" "}
          <a href="/privacy" target="_blank" className="underline hover:text-gray-600">privacy policy</a>.
        </p>
      </div>
    </OnboardingShell>
  );
}
