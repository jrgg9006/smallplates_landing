"use client";

import React from "react";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  signInWithEmail,
  signInWithGoogle,
  resetPassword,
} from "@/lib/supabase/auth";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ModalMode = "login" | "forgot-password";

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<ModalMode>("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  // Swipe-to-dismiss state (mobile)
  const [dragStartY, setDragStartY] = useState<number | null>(null);
  const [dragTranslateY, setDragTranslateY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartTimeRef = useRef(0);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Touch handlers for swipe-to-dismiss (mobile only)
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    // Ignore on desktop widths
    if (typeof window !== "undefined" && window.innerWidth >= 768) return;
    // Only start drag if touch begins near top area (handle zone ~56px)
    const touch = e.touches[0];
    const target = e.currentTarget;
    const rect = target.getBoundingClientRect();
    const localY = touch.clientY - rect.top;
    if (localY > 56) return; // start only from header/handle area
    setIsDragging(true);
    setDragStartY(touch.clientY);
    setDragTranslateY(0);
    dragStartTimeRef.current = Date.now();
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (dragStartY === null || !isDragging) return;
    const touch = e.touches[0];
    const delta = touch.clientY - dragStartY;
    if (delta > 0) {
      // prevent page scroll while dragging down
      e.preventDefault();
      setDragTranslateY(delta);
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    const elapsed = Date.now() - dragStartTimeRef.current;
    const distance = dragTranslateY;
    const shouldDismiss = distance > 120 || (elapsed < 200 && distance > 60);
    setIsDragging(false);
    setDragStartY(null);
    if (shouldDismiss) {
      onClose();
      setDragTranslateY(0);
    } else {
      // snap back
      setDragTranslateY(0);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (mode === "login") {
        const { user, error } = await signInWithEmail(email, password);
        if (error) {
          setError(error);
        } else {
          onClose();
          router.push("/profile/groups");
        }
      } else if (mode === "forgot-password") {
        const { error } = await resetPassword(email);
        if (error) {
          setError(error);
        } else {
          setMessage("Password reset email sent! Check your inbox.");
          setTimeout(() => {
            setMode("login");
            setMessage(null);
          }, 2000);
        }
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);

    const { error } = await signInWithGoogle();
    if (error) {
      setError(error);
      setLoading(false);
    }
    // Google OAuth will redirect, so no need to stop loading
  };

  return (
    <>
      {/* Modal Container with Backdrop */}
      <div
        className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black bg-opacity-50 animate-in fade-in-0 duration-200"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-t-3xl md:rounded-2xl shadow-xl max-w-md w-full pt-10 md:pt-8 pb-8 px-8 relative md:mx-4 max-h-[90vh] md:max-h-[85vh] overflow-y-auto transform transition-transform ease-out animate-in slide-in-from-bottom-full md:slide-in-from-bottom-0 md:zoom-in-95"
          style={{ transform: `translateY(${dragTranslateY}px)` }}
          onClick={(e) => e.stopPropagation()}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Drag Handle - Mobile Only */}
          <div className="md:hidden absolute top-3 left-1/2 transform -translate-x-1/2 w-12 h-1 bg-gray-300 rounded-full"></div>
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-6 md:top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-10"
            aria-label="Close modal"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Modal Content */}
          <div className="text-center mb-6">
            <h2 className="text-4xl font-serif font-semibold text-gray-900">
              {mode === "login" ? "Log in" : "Reset password"}
            </h2>
            {mode === "forgot-password" && (
              <p className="text-gray-600 mt-2">
                Enter your email to reset password
              </p>
            )}
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}
          {message && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
              {message}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
                placeholder="you@example.com"
                disabled={loading}
              />
            </div>

            {mode !== "forgot-password" && (
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
                  placeholder="••••••••"
                  disabled={loading}
                />
              </div>
            )}

            {mode === "login" && (
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setMode("forgot-password")}
                  className="text-sm text-gray-600 hover:text-black transition-colors"
                  disabled={loading}
                >
                  Forgot password?
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white py-3 rounded-lg font -semibold hover:bg-gray-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-black disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? "Loading..."
                : mode === "login"
                ? "Log in"
                : "Send reset email"}
            </button>

            {mode === "forgot-password" && (
              <button
                type="button"
                onClick={() => setMode("login")}
                className="w-full text-sm text-gray-600 hover:text-black transition-colors"
                disabled={loading}
              >
                Back to login
              </button>
            )}
          </form>

          {/* Divider - only show for login/signup */}
          {mode !== "forgot-password" && (
            <>
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">
                    Or continue with
                  </span>
                </div>
              </div>

              {/* Social Login Buttons */}
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-3 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
                  <span className="text-gray-700 font-medium">
                    Continue with Google
                  </span>
                </button>
              </div>
            </>
          )}

          {/* Sign Up/Login Toggle Link */}
          {mode === "login" && (
            <p className="text-center text-sm text-gray-600 mt-6">
              Don&rsquo;t have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  router.push("/onboarding");
                }}
                disabled={loading}
                className="text-black font-semibold hover:underline disabled:opacity-50"
              >
                Sign up
              </button>
            </p>
          )}
        </div>
      </div>
    </>
  );
}
