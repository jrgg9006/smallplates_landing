"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/contexts/AuthContext";
import { OnboardingProvider, useOnboarding } from "@/lib/contexts/OnboardingContext";
import { PostPaymentSetup } from "@/components/onboarding/PostPaymentSetup";
import { createSupabaseClient } from "@/lib/supabase/client";

/**
 * Injects paymentIntentId + email into context, then renders PostPaymentSetup.
 */
function SetupWithContext({ pi, email, userType }: { pi: string; email: string; userType: "couple" | "gift_giver" }) {
  const { setPaymentInfo, updateStepData } = useOnboarding();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setPaymentInfo(pi, "");
    updateStepData(3, { email }).then(() => setReady(true));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#FAF8F4" }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D4A854]" />
      </div>
    );
  }

  return <PostPaymentSetup userType={userType} />;
}

function CompleteSetupContent() {
  const searchParams = useSearchParams();
  const { user, loading } = useAuth();
  const router = useRouter();
  const pi = searchParams.get("pi");
  const type = searchParams.get("type") === "couple" ? "couple" : "gift_giver";
  const [settingSession, setSettingSession] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  // Reason: generateLink (admin API) produces implicit flow links with #access_token in the hash.
  // But createBrowserClient from @supabase/ssr uses PKCE and ignores hash fragments.
  // We manually extract the tokens and call setSession() to establish the auth session.
  useEffect(() => {
    if (loading || user) return;

    const hash = window.location.hash;
    if (!hash.includes("access_token")) return;

    setSettingSession(true);
    const params = new URLSearchParams(hash.substring(1));
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");

    if (!accessToken || !refreshToken) {
      setSettingSession(false);
      return;
    }

    const supabase = createSupabaseClient();
    supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
      .then(() => {
        // Reason: Clean the hash from URL so a page refresh doesn't re-process stale tokens
        window.history.replaceState(null, "", window.location.pathname + window.location.search);
        setSettingSession(false);
      })
      .catch(() => setSettingSession(false));
  }, [loading, user]);

  if (loading || settingSession || redirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#FAF8F4" }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D4A854]" />
      </div>
    );
  }

  if (!user || !pi) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: "#FAF8F4" }}>
        <p className="text-[#9A9590]">This link has expired or is invalid.</p>
        <a
          href="/recover-setup"
          className="text-[14px] text-[#D4A854] underline underline-offset-2 hover:text-[#c49b4a] transition-colors"
        >
          Get a new login link
        </a>
        <p className="text-[13px] text-[#9A9590] mt-2">
          Need help?{" "}
          <a href="mailto:team@smallplatesandcompany.com" className="text-[#D4A854] hover:underline">
            team@smallplatesandcompany.com
          </a>
        </p>
      </div>
    );
  }

  return (
    <OnboardingProvider userType={type}>
      <SetupWithContext pi={pi} email={user.email || ""} userType={type} />
    </OnboardingProvider>
  );
}

export default function CompleteSetupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center" style={{ background: "#FAF8F4" }}>Loading...</div>}>
      <CompleteSetupContent />
    </Suspense>
  );
}
