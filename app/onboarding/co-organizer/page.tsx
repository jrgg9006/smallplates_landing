"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { OnboardingShell } from "@/components/onboarding/OnboardingShell";

function CoOrganizerContent() {
  const router = useRouter();
  const params = useSearchParams();
  const groupId = params.get("groupId");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const nextHref = `/onboarding/event-details?groupId=${groupId}`;

  function handleContinue() {
    // Reason: co-organizer invite logic deferred to M2 (needs invitation_type column).
    router.push(nextHref);
  }

  return (
    <OnboardingShell
      title="Add a co-organizer?"
      subtitle="Co-organizers can invite others and review recipes."
      skipHref={nextHref}
      onContinue={handleContinue}
    >
      <div className="space-y-3">
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
