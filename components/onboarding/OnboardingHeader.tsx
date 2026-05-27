"use client";

import { useState, useEffect } from "react";
import LoginModal from "@/components/auth/LoginModal";
import { createSupabaseClient } from "@/lib/supabase/client";

export function OnboardingHeaderClient() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const supabase = createSupabaseClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setIsLoggedIn(true);
    });
  }, []);

  if (isLoggedIn) return null;

  return (
    <>
      <button
        onClick={() => setIsLoginOpen(true)}
        className="inline-flex items-center justify-center rounded-full px-5 py-2 text-sm font-semibold border border-brand-charcoal/20 text-brand-charcoal hover:bg-brand-charcoal/5 transition-colors"
      >
        Login
      </button>
      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
    </>
  );
}
