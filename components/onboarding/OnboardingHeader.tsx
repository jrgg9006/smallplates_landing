"use client";

import { useState } from "react";
import LoginModal from "@/components/auth/LoginModal";

export function OnboardingHeaderClient() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);

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
