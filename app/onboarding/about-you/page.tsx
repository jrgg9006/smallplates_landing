"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { OnboardingShell } from "@/components/onboarding/OnboardingShell";
import { useOnboardingState } from "@/components/onboarding/onboardingState";
import { createSupabaseClient } from "@/lib/supabase/client";
import { sendMagicLink } from "@/lib/supabase/auth";
import { isFreeTierEnabled } from "@/lib/feature-flags";

function AboutYouContent() {
  const router = useRouter();
  const params = useSearchParams();
  const fromGoogle = params.get("from_google") === "true";
  const continuing = params.get("continue") === "true";

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

  useEffect(() => {
    if ((continuing || fromGoogle) && isAuthed) {
      const stashed = sessionStorage.getItem("sp-pending-about-you");
      if (stashed) {
        try {
          const parsed = JSON.parse(stashed);
          if (parsed.coupleFirstName) setCoupleFirstName(parsed.coupleFirstName);
          if (parsed.partnerFirstName) setPartnerFirstName(parsed.partnerFirstName);
          if (parsed.yourName) setYourName(parsed.yourName);
        } catch { /* ignore */ }
        sessionStorage.removeItem("sp-pending-about-you");
      }
    }
  }, [continuing, fromGoogle, isAuthed]);

  const bookName = coupleFirstName && partnerFirstName
    ? `${coupleFirstName} & ${partnerFirstName}'s Book`
    : coupleFirstName
    ? `${coupleFirstName}'s Book`
    : "My Book";

  async function handleSubmit() {
    setSubmitting(true);
    setError("");

    if (!isAuthed) {
      sessionStorage.setItem("sp-pending-about-you", JSON.stringify({
        coupleFirstName, partnerFirstName, yourName,
      }));
      const { error: linkError } = await sendMagicLink(email, {
        allowSignup: isFreeTierEnabled(),
        redirectTo: "/onboarding/about-you?continue=true",
      });
      if (linkError) {
        setError(linkError);
        setSubmitting(false);
        return;
      }
      router.push("/signin?check_email=" + encodeURIComponent(email));
      return;
    }

    const res = await fetch("/api/v1/groups/free", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bookName,
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
    const { groupId } = await res.json();
    reset();
    router.push(`/onboarding/co-organizer?groupId=${groupId}`);
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
          <div className="grid grid-cols-2 gap-3">
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
            disabled={isAuthed}
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

export default function AboutYouPage() {
  return (
    <Suspense>
      <AboutYouContent />
    </Suspense>
  );
}
