"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { OnboardingShell } from "@/components/onboarding/OnboardingShell";

function InviteFirstContent() {
  const router = useRouter();
  const params = useSearchParams();
  const groupId = params.get("groupId");
  const [copied, setCopied] = useState(false);

  // Reason: Real /evento/[token] URL is built in M2. For M1, use a stub link.
  const inviteLink = typeof window !== "undefined"
    ? `${window.location.origin}/collect/${groupId}`
    : "";

  const whatsappMsg = encodeURIComponent(
    `Help me with a recipe book — takes 5 min: ${inviteLink}`
  );

  function handleCopy() {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <OnboardingShell
      title="Invite a few people to start"
      subtitle="Share the link via WhatsApp or copy it wherever you like."
      backHref={`/onboarding/personalize-invite?groupId=${groupId}`}
      onContinue={() => router.push("/profile/groups")}
      continueLabel="Go to dashboard"
    >
      <div className="space-y-4">
        <div className="border border-[hsl(var(--brand-sand))] rounded-lg p-3 bg-white flex items-center justify-between gap-3">
          <code className="type-caption truncate flex-1">{inviteLink}</code>
          <button
            onClick={handleCopy}
            className="btn btn-sm btn-outline shrink-0"
          >
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
        <a
          href={`https://wa.me/?text=${whatsappMsg}`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-sm inline-flex items-center gap-2"
          style={{ backgroundColor: "#25D366", color: "#fff" }}
        >
          Send via WhatsApp
        </a>
      </div>
    </OnboardingShell>
  );
}

export default function InviteFirstPage() {
  return (
    <Suspense>
      <InviteFirstContent />
    </Suspense>
  );
}
