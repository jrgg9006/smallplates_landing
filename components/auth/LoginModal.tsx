"use client";

import React, { useState } from "react";
import { signInWithGoogle, signInWithEmail, sendMagicLink, verifyLoginCode } from "@/lib/supabase/auth";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function GoogleButton({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full flex items-center justify-center gap-3 px-4 py-3.5 border border-gray-200 rounded-full hover:bg-gray-50 transition-colors text-[15px] font-medium text-gray-700"
    >
      <svg className="w-4 h-4" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
      </svg>
      Continue with Google
    </button>
  );
}

function OrDivider() {
  return (
    <div className="relative my-5">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-gray-200" />
      </div>
      <div className="relative flex justify-center text-xs">
        <span className="px-3 bg-white text-gray-400">or</span>
      </div>
    </div>
  );
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [mode, setMode] = useState<"email" | "password">("email");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSendLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("sending");
    setError(null);

    const { error: linkError } = await sendMagicLink(email.trim().toLowerCase());
    if (linkError) {
      setError(linkError);
      setStatus("error");
    } else {
      setStatus("sent");
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim().length < 6) return;
    setVerifying(true);
    setError(null);

    const { error: codeError } = await verifyLoginCode(email.trim().toLowerCase(), code.trim());
    if (codeError) {
      setError(codeError);
      setVerifying(false);
    } else {
      window.location.href = "/profile/groups";
    }
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setStatus("sending");
    setError(null);

    const { error: loginError } = await signInWithEmail(email.trim().toLowerCase(), password);
    if (loginError) {
      setError("Email or password is incorrect.");
      setStatus("idle");
    } else {
      window.location.href = "/profile/groups";
    }
  };

  const handleGoogle = async () => {
    setError(null);
    const { error: googleError } = await signInWithGoogle();
    if (googleError) {
      setError(googleError);
    }
  };

  const handleClose = () => {
    setEmail("");
    setPassword("");
    setCode("");
    setMode("email");
    setStatus("idle");
    setError(null);
    onClose();
  };

  const switchMode = (next: "email" | "password") => {
    setMode(next);
    setPassword("");
    setStatus("idle");
    setError(null);
  };

  const isGmail = email.toLowerCase().includes("gmail");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 sm:p-10 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {status === "sent" ? (
          <>
            {/* Sent state */}
            <h2 className="type-modal-title text-[hsl(var(--brand-charcoal))] mb-5">
              Check your email
            </h2>
            <p className="text-base text-gray-600 leading-relaxed mb-6">
              We sent a code and a login link to{" "}
              <span className="font-medium text-gray-900">{email}</span>. Click the link, or type
              the code here:
            </p>

            <form onSubmit={handleVerifyCode} className="space-y-3 mb-2">
              <input
                id="login-code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                className="input-field text-center text-2xl tracking-[0.5em] font-medium"
                placeholder="······"
                disabled={verifying}
                autoFocus
              />
              <button
                type="submit"
                disabled={verifying || code.trim().length < 6}
                className="btn btn-honey w-full rounded-full px-4 py-3.5 text-[15px] border border-transparent"
              >
                {verifying ? "Checking..." : "Continue"}
              </button>
            </form>

            {error && <p className="mb-2 text-sm text-red-600">{error}</p>}

            {isGmail && (
              <a
                href="https://mail.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="block mx-auto mt-3 text-center text-sm text-gray-500 underline hover:text-gray-700 transition-colors"
              >
                Open Gmail
              </a>
            )}

            <button
              onClick={() => { setStatus("idle"); setEmail(""); setCode(""); setError(null); }}
              className="block mx-auto mt-4 text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              Use a different email
            </button>
          </>
        ) : mode === "password" ? (
          <>
            {/* Password state */}
            <h2 className="type-modal-title text-[hsl(var(--brand-charcoal))] mb-2">
              Log in
            </h2>
            <p className="text-base text-gray-600 leading-relaxed mb-6">
              Use the password you set in your account.
            </p>

            <form onSubmit={handlePasswordLogin} className="space-y-4 mb-2">
              <div>
                <label htmlFor="login-email-pw" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email
                </label>
                <input
                  id="login-email-pw"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field"
                  placeholder="you@example.com"
                  disabled={status === "sending"}
                  autoFocus
                />
              </div>
              <div>
                <label htmlFor="login-password" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Password
                </label>
                <input
                  id="login-password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field"
                  disabled={status === "sending"}
                />
              </div>
              <button
                type="submit"
                disabled={status === "sending" || !email.trim() || !password}
                className="btn btn-honey w-full rounded-full px-4 py-3.5 text-[15px] border border-transparent"
              >
                {status === "sending" ? "Logging in..." : "Log in"}
              </button>
            </form>

            {error && <p className="mb-2 text-sm text-red-600">{error}</p>}

            <button
              onClick={() => switchMode("email")}
              className="block mx-auto mt-3 text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              Email me a code instead
            </button>
          </>
        ) : (
          <>
            {/* Default state */}
            <h2 className="type-modal-title text-[hsl(var(--brand-charcoal))] mb-2">
              Log in
            </h2>
            <p className="text-base text-gray-600 leading-relaxed mb-6">
              We&apos;ll email you a code and a link to log in. No password needed.
            </p>

            <form onSubmit={handleSendLink} className="space-y-4">
              <div>
                <label htmlFor="login-email" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email
                </label>
                <input
                  id="login-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field"
                  placeholder="you@example.com"
                  disabled={status === "sending"}
                  autoFocus
                />
              </div>
              <button
                type="submit"
                disabled={status === "sending" || !email.trim()}
                className="btn btn-honey w-full rounded-full px-4 py-3.5 text-[15px] border border-transparent"
              >
                {status === "sending" ? "Sending..." : "Continue with email"}
              </button>
            </form>

            <button
              onClick={() => switchMode("password")}
              className="block mx-auto mt-3 text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              Sign in with password
            </button>

            <OrDivider />

            <GoogleButton onClick={handleGoogle} disabled={status === "sending"} />

            <p className="mt-5 text-[12px] text-gray-400 leading-relaxed text-center">
              By continuing, you agree to our{" "}
              <a href="/terms" target="_blank" rel="noreferrer" className="underline hover:text-gray-600">Terms of Service</a>
              {" "}and{" "}
              <a href="/privacy" target="_blank" rel="noreferrer" className="underline hover:text-gray-600">Privacy Policy</a>.
            </p>

            {error && (
              <p className="mt-4 text-sm text-red-600">{error}</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
