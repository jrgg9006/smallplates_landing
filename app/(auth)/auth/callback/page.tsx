"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase/client";
import Image from "next/image";

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

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    let cancelled = false;

    async function handleAuth() {
      const supabase = createSupabaseClient();

      // Reason: final destination passed by send-login-link as ?next=. Validate it
      // is a relative path to avoid open-redirects; fall back to the dashboard.
      const rawNext = searchParams.get("next");
      const next = rawNext && rawNext.startsWith("/") ? rawNext : "/profile/groups";

      try {
        // Reason: PKCE flow — magic link with ?code= query param.
        const code = searchParams.get("code");
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
          if (!cancelled) router.replace(next);
          return;
        }

        // Reason: Implicit flow — magic link with #access_token in hash.
        // Next.js router doesn't parse hash automatically; read from window.
        if (typeof window !== "undefined" && window.location.hash) {
          const hashParams = new URLSearchParams(window.location.hash.slice(1));
          const accessToken = hashParams.get("access_token");
          const refreshToken = hashParams.get("refresh_token");

          if (accessToken && refreshToken) {
            const { error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            if (error) throw error;
            if (!cancelled) router.replace(next);
            return;
          }
        }

        // Reason: Fallback — user already has a session (rare but possible
        // if they landed here mid-flow). Check getSession and proceed.
        const { data: { session } } = await supabase.auth.getSession();
        if (session && !cancelled) {
          router.replace(next);
          return;
        }

        // Reason: No valid auth path worked. Send home.
        if (!cancelled) router.replace("/");
      } catch (err) {
        console.error("auth/callback: error processing magic link", err);
        if (!cancelled) router.replace("/");
      }
    }

    handleAuth();

    return () => {
      cancelled = true;
    };
  }, [router, searchParams]);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-4"
      style={{ background: "#FAF8F4" }}
    >
      <Image
        src="/images/SmallPlates_logo_horizontal.png"
        alt="Small Plates & Co."
        width={160}
        height={40}
        className="h-auto opacity-80"
      />
      <p className="text-sm tracking-wide" style={{ color: "rgba(45,45,45,0.4)" }}>
        Signing you in<AnimatedDots />
      </p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div
          className="min-h-screen flex items-center justify-center"
          style={{ background: "#FAF8F4" }}
        />
      }
    >
      <CallbackContent />
    </Suspense>
  );
}
