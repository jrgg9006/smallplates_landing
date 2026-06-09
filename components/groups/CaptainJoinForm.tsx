"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createSupabaseClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle, MailCheck } from "lucide-react";

// Reason: matches the loading pattern from GroupJoinForm + /auth/callback.
function AnimatedDots() {
  return (
    <span className="inline-flex gap-[2px] ml-[1px]">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="animate-bounce"
          style={{ animationDelay: `${i * 0.15}s`, animationDuration: "1s" }}
        >
          .
        </span>
      ))}
    </span>
  );
}

interface GroupInfo {
  id: string;
  name: string;
  description?: string;
}

interface CaptainJoinFormProps {
  groupId: string;
  token: string;
  groupData: GroupInfo | null;
  coupleImageUrl?: string | null;
  inviterName?: string;
  // Reason: shown in the footer ("This captain invite was sent by X"). Kept
  // separate from `inviterName` (which fills the title slot) so each can be
  // controlled independently.
  senderName?: string | null;
  verifying?: boolean;
  verifyMessage?: string;
  verifyError?: string | null;
  errorTitle?: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ERROR_COPY: Record<string, string> = {
  token_missing: "This invite link is missing a token. Ask the organizer for a new link.",
  token_invalid: "This invite link is not valid. Ask the organizer for a new link.",
  token_expired: "This invite link has expired. Ask the organizer for a new link.",
  token_max_uses: "This invite link has reached its limit. Ask the organizer for a new link.",
};

export function CaptainJoinForm({
  groupId,
  token,
  groupData,
  coupleImageUrl,
  inviterName,
  senderName,
  verifying = false,
  verifyMessage = "Loading...",
  verifyError = null,
  errorTitle = "Error",
}: CaptainJoinFormProps) {
  const router = useRouter();

  const [imageError, setImageError] = useState(false);
  const displayImage = coupleImageUrl && !imageError ? coupleImageUrl : null;

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // "sent" state: existing-user took-over defense path. We tell them to check
  // their inbox; we DON'T sign them in here.
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [joinedAsNewUser, setJoinedAsNewUser] = useState(false);

  const groupName = groupData?.name || "this cookbook";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    const cleanName = fullName.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName) {
      setError("Please enter your name.");
      return;
    }
    if (!EMAIL_REGEX.test(cleanEmail)) {
      setError("Please enter a valid email.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/v1/groups/${groupId}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, fullName: cleanName, email: cleanEmail }),
      });

      const payload = await res.json().catch(() => ({}));

      if (!res.ok) {
        const code = typeof payload?.error === "string" ? payload.error : "";
        setError(ERROR_COPY[code] || payload?.error || "Something went wrong. Please try again.");
        setLoading(false);
        return;
      }

      // Existing user → real magic link sent to their inbox. They MUST click it.
      if (payload.existingUser) {
        // Trigger the OTP email from the client (Supabase only sends emails
        // through the public client API, not via admin.generateLink).
        const supabase = createSupabaseClient();
        const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
        const { error: otpError } = await supabase.auth.signInWithOtp({
          email: cleanEmail,
          options: {
            shouldCreateUser: false,
            emailRedirectTo: `${baseUrl}/profile/groups?group=${groupId}`,
          },
        });
        if (otpError) {
          setError("Could not send your login link. Try again.");
          setLoading(false);
          return;
        }
        setSentTo(cleanEmail);
        setLoading(false);
        return;
      }

      // New user → frictionless verifyOtp with the backend-provided hashed_token.
      if (payload.tokenHash) {
        const supabase = createSupabaseClient();
        const { error: otpError } = await supabase.auth.verifyOtp({
          token_hash: payload.tokenHash,
          type: "magiclink",
        });
        if (otpError) {
          setError("Could not complete sign-in. Try again.");
          setLoading(false);
          return;
        }
        setJoinedAsNewUser(true);
        // Reason: brief success state, then redirect to the group dashboard.
        setTimeout(() => {
          router.push(`/profile/groups?group=${groupId}`);
        }, 1200);
        return;
      }

      setError("Something went wrong. Please try again.");
      setLoading(false);
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  // ── Verifying state ──
  if (verifying) {
    const cleanMessage = verifyMessage.replace(/\.{3,}$/, "");
    return (
      <div className="min-h-screen bg-brand-warm-white-airy flex flex-col items-center justify-center gap-4">
        <Image
          src="/images/SmallPlates_logo_horizontal.png"
          alt="Small Plates & Co."
          width={160}
          height={40}
          className="h-auto opacity-80"
        />
        <p className="text-sm tracking-wide" style={{ color: "rgba(45,45,45,0.4)" }}>
          {cleanMessage}<AnimatedDots />
        </p>
      </div>
    );
  }

  // ── Verification error / invalid token state ──
  if (verifyError && !groupData) {
    return (
      <div className="min-h-screen bg-brand-warm-white-airy flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="h-12 w-12 text-red-500 mx-auto mb-4 flex items-center justify-center">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="type-subheading mb-4">{errorTitle}</h1>
          <p className="text-brand-warm-gray-light mb-6">{verifyError}</p>
          <Button
            onClick={() => router.push("/")}
            className="bg-brand-charcoal text-white hover:bg-brand-charcoal-deep"
          >
            Go to Home Page
          </Button>
        </div>
      </div>
    );
  }

  // ── Existing-user "check your email" state ──
  if (sentTo) {
    const isGmail = sentTo.includes("gmail");
    return (
      <div className="min-h-screen bg-brand-warm-white-airy flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <MailCheck className="h-12 w-12 text-brand-honey mx-auto mb-4" />
          <h1 className="type-subheading mb-3">Check your email</h1>
          <p className="text-brand-warm-gray-light mb-6">
            We sent a login link to <span className="font-medium text-brand-charcoal">{sentTo}</span>.
            Click it to finish joining <span className="font-medium text-brand-charcoal">{groupName}</span>.
          </p>
          {isGmail && (
            <a
              href="https://mail.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-brand-charcoal text-white hover:bg-brand-charcoal-deep px-6 py-2.5 rounded-md text-sm font-medium"
            >
              Open Gmail
            </a>
          )}
          <p className="text-xs text-brand-warm-gray-light mt-6">
            You&apos;re already on the captain list — clicking the link in your inbox just logs you in.
          </p>
        </div>
      </div>
    );
  }

  // ── New-user success state ──
  if (joinedAsNewUser) {
    return (
      <div className="min-h-screen bg-brand-warm-white-airy flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h1 className="type-subheading mb-4">You&rsquo;re in.</h1>
          <p className="text-brand-warm-gray-light mb-6">
            You joined <span className="font-medium text-brand-charcoal">{groupName}</span>.
          </p>
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 mx-auto"></div>
        </div>
      </div>
    );
  }

  // ── Main form ──
  return (
    <div className="min-h-screen bg-brand-warm-white-airy">
      {/* Header */}
      <div className="border-b border-brand-sand">
        <div className="max-w-md mx-auto px-6 h-14 flex items-center justify-center">
          <Link href="/" className="flex items-center hover:opacity-70 transition-opacity">
            <Image
              src="/images/SmallPlates_logo_horizontal.png"
              alt="Small Plates & Co."
              width={180}
              height={28}
              className="mx-auto"
            />
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto">
        <div className={`lg:items-center lg:min-h-[calc(100vh-3.5rem)] ${displayImage ? "lg:grid lg:grid-cols-2 lg:gap-8" : "flex justify-center"}`}>
          {displayImage && (
            <div className="flex items-center justify-center lg:justify-start mb-6 lg:mb-0">
              <div className="w-full lg:max-w-sm lg:mx-auto">
                <div className="relative w-full h-40 sm:h-44 lg:h-[450px] lg:max-h-[60vh] overflow-hidden rounded-lg lg:rounded-xl shadow-sm border border-brand-sand">
                  <Image
                    src={displayImage}
                    alt={groupData?.name || "Wedding cookbook"}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 400px"
                    priority
                    onError={() => setImageError(true)}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-brand-charcoal/5 via-transparent to-transparent lg:bg-gradient-to-r lg:from-brand-charcoal/3 lg:via-transparent lg:to-transparent" />
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center">
            <div className="w-full max-w-md mx-auto px-6 py-8 lg:py-6">
              {/* Title */}
              <div className="text-center mb-5">
                <h2 className="type-subheading mb-1">Join the Cookbook</h2>
                {groupData && (
                  <div className="mt-3">
                    {inviterName ? (
                      <p className="text-brand-warm-gray-light text-sm">
                        <span className="font-medium text-brand-charcoal">{inviterName}</span> invited you to join:
                      </p>
                    ) : (
                      <p className="text-brand-warm-gray-light text-sm">You&apos;ve been invited to join:</p>
                    )}
                    <h3 className="type-heading mt-1">
                      {groupData.name}
                    </h3>
                    <p className="text-gray-600 text-base leading-relaxed mt-8">
                      You&apos;ll help collect recipes and make a real cookbook.
                    </p>
                  </div>
                )}
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <Label htmlFor="captain-fullName" className="text-xs font-medium text-brand-warm-gray-light uppercase tracking-wide">
                    Name
                  </Label>
                  <Input
                    id="captain-fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your full name"
                    required
                    disabled={loading}
                    autoFocus
                    className="mt-1.5"
                  />
                </div>

                <div>
                  <Label htmlFor="captain-email" className="text-xs font-medium text-brand-warm-gray-light uppercase tracking-wide">
                    Email
                  </Label>
                  <Input
                    id="captain-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    disabled={loading}
                    className="mt-1.5"
                  />
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-3">
                    <p className="text-red-600 text-sm">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  className="btn btn-md btn-honey w-full mt-2"
                  disabled={loading}
                >
                  {loading ? "Joining..." : "Join the Cookbook"}
                </button>

                {/* Reason: this form creates an account for new users, so surface
                    the same terms/privacy consent shown on the onboarding signup. */}
                <p className="text-[12px] text-gray-400 leading-relaxed text-center pt-1">
                  By joining, you agree to our{" "}
                  <a href="/terms" target="_blank" rel="noreferrer" className="underline hover:text-gray-600">terms of service</a>
                  {" "}and{" "}
                  <a href="/privacy" target="_blank" rel="noreferrer" className="underline hover:text-gray-600">privacy policy</a>.
                </p>
              </form>

              <div className="mt-6 text-center space-y-1">
                <p className="text-xs text-brand-warm-gray-light">
                  Once you&apos;re in, add a recipe whenever you&apos;re ready.
                </p>
                {senderName && (
                  <p className="text-xs text-brand-warm-gray-light">
                    This captain invite was sent by {senderName}.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
