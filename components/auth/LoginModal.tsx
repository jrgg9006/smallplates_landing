"use client";

import React, { useState } from "react";
import { signInWithGoogle, sendMagicLink } from "@/lib/supabase/auth";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
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

  const handleGoogle = async () => {
    setError(null);
    const { error: googleError } = await signInWithGoogle();
    if (googleError) {
      setError(googleError);
    }
  };

  const handleClose = () => {
    setEmail("");
    setStatus("idle");
    setError(null);
    onClose();
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
            <h2 className="type-modal-title text-[hsl(var(--brand-charcoal))] mb-3">
              Check your email
            </h2>
            <p className="text-sm text-gray-600 leading-relaxed mb-6">
              We sent a login link to{" "}
              <span className="font-medium text-gray-900">{email}</span>.
              Click the link to log in.
            </p>

            {isGmail && (
              <a
                href="https://mail.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-md btn-dark w-full mb-3"
              >
                Open Gmail
              </a>
            )}

            <button
              onClick={() => { setStatus("idle"); setEmail(""); }}
              className="w-full text-sm text-gray-500 hover:text-gray-700 transition-colors py-2"
            >
              Use a different email
            </button>

            <div className="border-t border-gray-100 mt-6 pt-5">
              <p className="text-xs text-gray-400 leading-relaxed">
                Don&apos;t want to wait? If your email is linked to Google, you can log in instantly.
              </p>
              <button
                onClick={handleGoogle}
                className="mt-3 w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Sign in with Google
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Default state */}
            <h2 className="type-modal-title text-[hsl(var(--brand-charcoal))] mb-2">
              Log in
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              We&apos;ll send you a link to log in. No password needed.
            </p>

            <form onSubmit={handleSendLink} className="space-y-4 mb-6">
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
                className="btn btn-md btn-honey w-full"
              >
                {status === "sending" ? "Sending..." : "Send login link"}
              </button>
            </form>

            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-3 bg-white text-gray-400">or</span>
              </div>
            </div>

            <button
              onClick={handleGoogle}
              disabled={status === "sending"}
              className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continue with Google
            </button>

            {error && (
              <p className="mt-4 text-sm text-red-600">{error}</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
