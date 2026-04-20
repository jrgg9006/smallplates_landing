"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

function WelcomeContent() {
  const router = useRouter();
  const [sessionUser, setSessionUser] = useState<User | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Reason: /welcome can be reached via three paths:
  //   1. PKCE magic link (signInWithOtp from login modal) → `?code=` → exchangeCodeForSession.
  //   2. Implicit magic link (admin.generateLink from webhook) → `#access_token` → setSession.
  //   3. Already-authenticated user who arrived from elsewhere → getSession returns existing user.
  // We manage session locally (not via AuthContext) to avoid race conditions between the
  // async context update and our redirect logic.
  useEffect(() => {
    let cancelled = false;
    const supabase = createSupabaseClient();

    async function resolveSession() {
      // 1. Check for existing session first.
      const { data: existing } = await supabase.auth.getSession();
      if (cancelled) return;
      if (existing.session?.user) {
        setSessionUser(existing.session.user);
        setLoadingSession(false);
        return;
      }

      const url = new URL(window.location.href);
      const code = url.searchParams.get("code");
      const hash = window.location.hash;

      // 2. PKCE flow.
      if (code) {
        try {
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          url.searchParams.delete("code");
          window.history.replaceState(null, "", url.pathname + (url.search || "") + url.hash);
          if (cancelled) return;
          if (exchangeError || !data.session) {
            console.error("welcome: exchangeCodeForSession failed", exchangeError);
            setLoadingSession(false);
            return;
          }
          setSessionUser(data.session.user);
          setLoadingSession(false);
          return;
        } catch (err) {
          if (cancelled) return;
          console.error("welcome: exchangeCodeForSession threw", err);
          setLoadingSession(false);
          return;
        }
      }

      // 3. Implicit flow.
      if (hash.includes("access_token")) {
        const params = new URLSearchParams(hash.substring(1));
        const accessToken = params.get("access_token");
        const refreshToken = params.get("refresh_token");
        if (accessToken && refreshToken) {
          try {
            const { data, error: setError2 } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            window.history.replaceState(null, "", window.location.pathname + window.location.search);
            if (cancelled) return;
            if (setError2 || !data.session) {
              console.error("welcome: setSession failed", setError2);
              setLoadingSession(false);
              return;
            }
            setSessionUser(data.session.user);
            setLoadingSession(false);
            return;
          } catch (err) {
            if (cancelled) return;
            console.error("welcome: setSession threw", err);
            setLoadingSession(false);
            return;
          }
        }
      }

      // 4. No way to establish session — send home.
      setLoadingSession(false);
      router.replace("/");
    }

    resolveSession();
    return () => {
      cancelled = true;
    };
  }, [router]);

  const handleSave = async () => {
    setError(null);
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }

    setSaving(true);
    const supabase = createSupabaseClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setSaving(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }
    router.replace("/profile/groups");
  };

  const handleSkip = () => {
    router.replace("/profile/groups");
  };

  if (loadingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#FAF8F4" }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-honey" />
      </div>
    );
  }

  if (!sessionUser) return null;

  const sansFont = "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  const labelClass = "block text-[13px] font-medium text-brand-charcoal mb-1.5";
  const inputClass =
    "w-full px-4 h-[52px] border border-[#E8E0D5] rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-honey focus:border-transparent text-[15px] bg-white transition-all";

  return (
    <div className="min-h-screen" style={{ background: "#FAF8F4" }}>
      <div className="max-w-[480px] w-full mx-auto px-6 py-12 md:py-16 flex flex-col items-center">
        {/* Logo */}
        <img
          src="/images/SmallPlates_logo_horizontal1.png"
          alt="Small Plates & Co."
          className="w-auto max-w-[160px] mb-20"
        />

        {/* Headline */}
        <h1 className="text-center mb-3 font-serif text-[38px] font-light leading-[1.15] text-brand-charcoal">
          One quick <em>thing.</em>
        </h1>
        <p
          className="text-center text-[15px] text-brand-charcoal/70 mb-10 max-w-[380px]"
          style={{ fontFamily: sansFont }}
        >
          Want to set a password so you can log in faster next time?
        </p>

        {/* Form */}
        <div className="w-full space-y-6">
          <div>
            <label htmlFor="password" className={labelClass} style={{ fontFamily: sansFont }}>
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              className={inputClass}
              style={{ fontFamily: sansFont }}
              autoComplete="new-password"
            />
          </div>

          <div>
            <label htmlFor="confirm" className={labelClass} style={{ fontFamily: sansFont }}>
              Confirm password
            </label>
            <input
              id="confirm"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className={inputClass}
              style={{ fontFamily: sansFont }}
              autoComplete="new-password"
            />
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3">
              <p className="text-[13px] text-red-600" style={{ fontFamily: sansFont }}>
                {error}
              </p>
            </div>
          )}

          <p
            className="text-[12px] text-[#9A9590] text-center -mt-2"
            style={{ fontFamily: sansFont }}
          >
            If you already had a password, this will replace it.
          </p>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="w-full h-[56px] bg-brand-honey hover:bg-brand-honey-dark disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors text-[15px]"
            style={{ fontFamily: sansFont }}
          >
            {saving ? "Saving..." : "Save password and continue"}
          </button>

          <button
            type="button"
            onClick={handleSkip}
            className="w-full text-center text-[14px] text-[#9A9590] hover:text-brand-charcoal transition-colors py-2"
            style={{ fontFamily: sansFont }}
          >
            Skip — I&apos;ll log in by email next time →
          </button>
        </div>

        {/* Footer */}
        <p
          className="mt-12 text-[12px] text-[#C8C3BC] text-center"
          style={{ fontFamily: sansFont }}
        >
          Need help?{" "}
          <a
            href="mailto:team@smallplatesandcompany.com"
            className="underline hover:text-brand-charcoal"
          >
            team@smallplatesandcompany.com
          </a>
        </p>
      </div>
    </div>
  );
}

export default function WelcomePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center" style={{ background: "#FAF8F4" }}>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-honey" />
        </div>
      }
    >
      <WelcomeContent />
    </Suspense>
  );
}
