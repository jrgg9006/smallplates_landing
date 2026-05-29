"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
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
  const [isAuthed, setIsAuthed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const supabase = createSupabaseClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setIsAuthed(true);
        setEmail(user.email || "");
        setYourName(user.user_metadata?.full_name || user.user_metadata?.name || "");
      }
    });
  }, []);

  async function handleSubmit() {
    setSubmitting(true);
    setError("");

    try {
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

      if (!isAuthed) {
        const supabase = createSupabaseClient();
        await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: "magiclink",
        });
      }

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
    && (isAuthed || (yourName.trim() !== "" && email.trim() !== ""));

  return (
    <OnboardingShell
      title={isAuthed ? "Your next book." : "Let's get started."}
      imageUrl=""
      rightContent={
        <Image
          src="/images/onboarding/drawing_champaign_glasses.svg"
          alt=""
          width={934}
          height={697}
          className="w-full max-w-md h-auto"
          priority
        />
      }
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

        {/* Only show name + email for new users */}
        {!isAuthed && (
          <>
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

            <p className="text-[12px] text-gray-400 leading-relaxed pt-2">
              By continuing, you agree to our{" "}
              <a href="/terms" target="_blank" className="underline hover:text-gray-600">terms of service</a>
              {" "}and{" "}
              <a href="/privacy" target="_blank" className="underline hover:text-gray-600">privacy policy</a>.
            </p>
          </>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </OnboardingShell>
  );
}
