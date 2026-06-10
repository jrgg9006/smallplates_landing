"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createSupabaseClient } from "@/lib/supabase/client";
import { OnboardingHeaderClient } from "@/components/onboarding/OnboardingHeader";

interface GroupInvitationData {
  email: string;
  name: string | null;
  group: {
    id: string;
    name: string;
    description?: string | null;
  };
  inviter: {
    name: string;
  };
}

export default function GroupInvitationPage() {
  const params = useParams();
  const router = useRouter();
  const token = (params?.token as string) || "";

  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorTitle, setErrorTitle] = useState("Invalid invitation");
  const [invitation, setInvitation] = useState<GroupInvitationData | null>(null);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    if (!token) return;

    const verify = async () => {
      try {
        setVerifying(true);
        setError(null);

        const res = await fetch(`/api/v1/invitations/group/${token}`);
        const data = await res.json();

        if (!res.ok) {
          if (data.status === "expired") {
            setErrorTitle("Invitation expired");
            setError("This invitation has expired. Ask the person who invited you to send a new one.");
          } else if (data.status === "used") {
            setErrorTitle("Invitation already used");
            setError("This invitation has already been accepted. If you already joined, sign in from the home page.");
          } else {
            setErrorTitle("Invalid invitation");
            setError(data.error || "This invitation link is not valid.");
          }
          return;
        }

        setInvitation(data.data);
      } catch {
        setError("Couldn't verify the invitation. Please try again.");
      } finally {
        setVerifying(false);
      }
    };

    verify();
  }, [token]);

  const handleJoin = useCallback(async () => {
    setJoining(true);
    setError(null);

    try {
      const res = await fetch(`/api/v1/invitations/group/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Couldn't join the cookbook. Please try again.");
        setJoining(false);
        return;
      }

      const { tokenHash, groupId } = data.data;

      // Reason: redeem the magic-link token_hash for a session — passwordless login.
      const supabase = createSupabaseClient();
      const { error: otpError } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: "magiclink",
      });

      if (otpError) {
        setError("You're in, but automatic sign-in failed. Please sign in from the home page.");
        setJoining(false);
        return;
      }

      router.replace(`/profile/groups?group=${groupId}`);
    } catch {
      setError("Something went wrong. Please try again.");
      setJoining(false);
    }
  }, [token, router]);

  return (
    <div className="min-h-screen bg-white">
      {/* Header — matches the onboarding shell */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8 h-14 sm:h-16 flex items-center justify-between">
          <Link href="/" className="inline-block">
            <Image
              src="/images/SmallPlates_logo_horizontal.png"
              alt="Small Plates & Company"
              width={200}
              height={40}
              priority
              className="w-[140px] sm:w-[200px] h-auto"
            />
          </Link>
          <OnboardingHeaderClient />
        </div>
      </header>

      {/* Centered content */}
      <div className="min-h-[calc(100vh-3.5rem)] sm:min-h-[calc(100vh-4rem)] flex items-center justify-center px-5 sm:px-8 pt-14 sm:pt-16 pb-12">
        <div className="w-full max-w-md text-center">
          {verifying ? (
            <p className="text-base text-gray-500">Verifying your invitation…</p>
          ) : error && !invitation ? (
            <>
              <h1 className="font-serif text-4xl lg:text-[46px] leading-tight font-light text-gray-900 mb-3">
                {errorTitle}
              </h1>
              <p className="text-lg font-light text-gray-500 leading-relaxed mb-8">{error}</p>
              <button onClick={() => router.push("/")} className="btn btn-lg btn-honey px-14 w-full sm:w-auto">
                Go to home
              </button>
            </>
          ) : invitation ? (
            <>
              <h1 className="font-serif text-4xl lg:text-[46px] leading-tight font-light text-gray-900 mb-4">
                Join the cookbook
              </h1>
              <p className="text-lg font-light text-gray-700 leading-relaxed mb-2">
                {invitation.inviter.name} invited you to help with{" "}
                {/* Reason: "a cookbook titled X" reads right for both a couple's
                    name ("Ana & Rich") and a renamed book title ("The Best
                    Recipes…"), avoiding the possessive that breaks after an
                    Edit Book rename ("The Best Recipes's cookbook"). */}
                a cookbook titled{" "}
                <span className="text-gray-900">&ldquo;{invitation.group.name}&rdquo;</span>.
              </p>
              <p className="text-base font-light text-gray-500 leading-relaxed mb-8">
                You&apos;ll be a captain, with full access to the dashboard to invite people,
                review recipes, and help shape the book.
              </p>

              <button
                onClick={handleJoin}
                disabled={joining}
                className="btn btn-lg btn-honey px-14 w-full sm:w-auto"
              >
                {joining ? "Joining…" : "Join the cookbook"}
              </button>

              {error && <p className="text-sm text-red-600 mt-4">{error}</p>}

              <p className="text-[13px] text-gray-400 mt-6">
                No password needed. We&apos;ll sign you in automatically.
              </p>

              {/* Reason: joining creates an account for new users, so surface the
                  same terms/privacy consent shown on the other captain join form. */}
              <p className="text-[12px] text-gray-400 leading-relaxed mt-2">
                By joining, you agree to our{" "}
                <a href="/terms" target="_blank" rel="noreferrer" className="underline hover:text-gray-600">terms of service</a>
                {" "}and{" "}
                <a href="/privacy" target="_blank" rel="noreferrer" className="underline hover:text-gray-600">privacy policy</a>.
              </p>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
