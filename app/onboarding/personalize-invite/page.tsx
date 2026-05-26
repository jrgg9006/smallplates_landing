"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { OnboardingShell } from "@/components/onboarding/OnboardingShell";

const DEFAULT_MESSAGE =
  "I'm putting together a recipe book for the couple. Can you send one recipe? It takes about 5 minutes.";

function PersonalizeInviteContent() {
  const router = useRouter();
  const params = useSearchParams();
  const groupId = params.get("groupId");
  const [message, setMessage] = useState(DEFAULT_MESSAGE);
  const [showPreview, setShowPreview] = useState(false);

  const nextHref = `/onboarding/invite-first?groupId=${groupId}`;

  function handleContinue() {
    // Reason: invite_message column may not exist yet. Persisting deferred to M2.
    router.push(nextHref);
  }

  return (
    <OnboardingShell
      title="Personalize your invite"
      subtitle="This is the message your guests will receive."
      backHref={`/onboarding/event-details?groupId=${groupId}`}
      onContinue={handleContinue}
      continueDisabled={!message.trim()}
    >
      <div className="space-y-3">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={5}
          className="input-field resize-none"
        />
        <button
          type="button"
          onClick={() => setShowPreview(true)}
          className="text-link"
        >
          Preview invite email →
        </button>
      </div>

      {showPreview && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center p-6 z-50">
          <div className="modal">
            <div className="border-b border-[hsl(var(--brand-sand))] pb-3 mb-3">
              <div className="type-caption">From: Small Plates</div>
              <div className="type-caption">Subject: A recipe for the book</div>
            </div>
            <p className="type-body-small">{message}</p>
            <div className="mt-4">
              <span className="btn btn-sm btn-honey pointer-events-none">
                Submit my recipe →
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowPreview(false)}
              className="mt-4 text-link"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </OnboardingShell>
  );
}

export default function PersonalizeInvitePage() {
  return (
    <Suspense>
      <PersonalizeInviteContent />
    </Suspense>
  );
}
