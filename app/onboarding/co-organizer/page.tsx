"use client";

import { Suspense, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { OnboardingShell } from "@/components/onboarding/OnboardingShell";

function CoOrganizerContent() {
  const router = useRouter();
  const params = useSearchParams();
  const groupId = params.get("groupId");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const nextHref = `/onboarding/personalize-invite?groupId=${groupId}`;
  const hasInput = name.trim() !== "" && email.trim() !== "";

  async function handleContinue() {
    if (!hasInput) {
      router.push(nextHref);
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch(`/api/v1/groups/${groupId}/invitations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim() }),
      });

      if (!res.ok) {
        const { error: errMsg } = await res.json();
        setError(errMsg || "Could not send invitation");
        setSubmitting(false);
        return;
      }

      router.push(nextHref);
    } catch {
      setError("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <OnboardingShell
      title="Add a Captain"
      subtitle="A captain shares your dashboard: they invite people, review recipes, and help run the book."
      skipHref={nextHref}
      onContinue={handleContinue}
      continueLabel={hasInput ? "Invite & Continue" : "Continue"}
      continueDisabled={submitting}
      rightContent={
        <div className="relative w-[22rem] h-[22rem]">
          <Image
            src="/images/onboarding/occasions/captains_icon.png"
            alt=""
            fill
            sizes="352px"
            quality={95}
            className="object-contain"
          />
        </div>
      }
    >
      <div className="space-y-3 max-w-md">
        <div>
          <label htmlFor="co-name" className="input-label">Name</label>
          <input
            id="co-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input-field"
            placeholder="Ana Garcia"
          />
        </div>
        <div>
          <label htmlFor="co-email" className="input-label">Email</label>
          <input
            id="co-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-field"
            placeholder="ana@example.com"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </OnboardingShell>
  );
}

export default function CoOrganizerPage() {
  return (
    <Suspense>
      <CoOrganizerContent />
    </Suspense>
  );
}
