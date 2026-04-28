"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase/client";
import Image from "next/image";

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    let cancelled = false;

    async function handleAuth() {
      const supabase = createSupabaseClient();

      try {
        // Reason: PKCE flow — magic link with ?code= query param.
        const code = searchParams.get("code");
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
          if (!cancelled) router.replace("/profile/groups");
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
            if (!cancelled) router.replace("/profile/groups");
            return;
          }
        }

        // Reason: Fallback — user already has a session (rare but possible
        // if they landed here mid-flow). Check getSession and proceed.
        const { data: { session } } = await supabase.auth.getSession();
        if (session && !cancelled) {
          router.replace("/profile/groups");
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
      className="min-h-screen flex items-center justify-center"
      style={{ background: "#FAF8F4" }}
    >
      <Image
        src="/images/SmallPlates_logo_horizontal.png"
        alt="Small Plates & Co."
        width={160}
        height={40}
        className="h-auto opacity-80"
      />
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
