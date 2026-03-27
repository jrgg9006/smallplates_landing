"use client";

import { useState } from "react";
import { signInWithGoogle } from "@/lib/supabase/auth";

interface OrderConfirmationClientProps {
  email: string;
  buyerName: string;
}

export function OrderConfirmationClient({ email, buyerName }: OrderConfirmationClientProps) {
  const [isSigningIn, setIsSigningIn] = useState(false);

  const handleContinue = async () => {
    setIsSigningIn(true);
    const { error } = await signInWithGoogle({
      loginHint: email,
      redirectTo: `${window.location.origin}/api/v1/auth/callback?next=/profile/groups`,
    });
    if (error) {
      setIsSigningIn(false);
    }
  };

  const displayName = buyerName || "";

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 text-center"
      style={{ background: "#FAF7F2" }}
    >
      <h1
        className="text-[#2D2D2D] mb-4"
        style={{ fontFamily: "Minion Pro, Georgia, serif", fontSize: "2rem" }}
      >
        {displayName ? `You're in, ${displayName}.` : "You're in."}
      </h1>

      <p className="text-[#2D2D2D] max-w-[380px] mb-8">
        Your book is in the works. Time to get your guests in on it.
      </p>

      <button
        onClick={handleContinue}
        disabled={isSigningIn}
        className="inline-flex items-center justify-center rounded-full bg-[#D4A854] hover:bg-[#c49b4a] text-white px-8 py-4 text-lg font-medium shadow-lg transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#D4A854] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSigningIn ? "Redirecting..." : "Continue to dashboard \u2192"}
      </button>

      <p className="text-[#8A8780] mt-4 text-sm max-w-[380px]">
        We sent a login link to <strong>{email}</strong> — just in case.
      </p>

      <p className="text-sm text-[#2D2D2D]/40 font-light mt-12">
        Questions?{" "}
        <a
          href="mailto:team@smallplatesandcompany.com"
          className="text-[#2D2D2D]/50 hover:text-[#D4A854] transition-colors"
        >
          team@smallplatesandcompany.com
        </a>
      </p>
    </div>
  );
}
