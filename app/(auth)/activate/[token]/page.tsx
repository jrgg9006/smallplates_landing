"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase/client";
import Image from "next/image";

export default function ActivateAccountPage({ params }: { params: Promise<{ token: string }> }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const [tokenData, setTokenData] = useState<{ email: string; coupleNames?: string } | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const isFormValid = password.length >= 8 && password === confirmPassword;

  // Get token from params
  useEffect(() => {
    params.then((resolvedParams) => {
      setToken(resolvedParams.token);
    });
  }, [params]);

  // Validate token when component mounts
  useEffect(() => {
    const validateToken = async () => {
      if (!token) return;

      try {
        const response = await fetch(`/api/v1/purchase-activations/validate?token=${token}`);
        const data = await response.json();

        if (!response.ok) {
          setError(data.error || 'Invalid activation token');
          setTokenValid(false);
          return;
        }

        setTokenValid(true);
        setTokenData({
          email: data.email,
          coupleNames: data.coupleNames
        });
      } catch (err) {
        console.error('Error validating token:', err);
        setError('Error validating activation token. Please try again.');
        setTokenValid(false);
      }
    };

    if (token) {
      validateToken();
    }
  }, [token]);

  const handleActivation = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token) {
      setError("Token is missing");
      return;
    }
    
    if (!isFormValid) {
      setError("Please ensure passwords match and are at least 8 characters long");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/v1/purchase-activations/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to activate account');
      }

      setSuccess(true);
      
      // Redirect to login after showing success message
      setTimeout(() => {
        router.push("/?login=true");
      }, 2000);
      
    } catch (err) {
      console.error("Activation error:", err);
      setError(err instanceof Error ? err.message : "Failed to activate account");
    } finally {
      setLoading(false);
    }
  };

  // Token invalid or expired view
  if (tokenValid === false) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="max-w-md mx-auto text-center p-8">
          <Image
            src="/images/SmallPlates_logo_horizontal.png"
            alt="Small Plates & Co."
            width={200}
            height={40}
            className="mx-auto mb-8"
            priority
          />
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="font-serif text-3xl font-semibold text-gray-900 mb-3">
            Invalid Activation Link
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            This activation link has expired or has already been used.
          </p>
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl mb-6">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}
          <p className="text-sm text-gray-500 mb-6">
            Please contact us at{" "}
            <a
              href="mailto:team@smallplatesandcompany.com"
              className="text-[#D4A854] hover:underline"
            >
              team@smallplatesandcompany.com
            </a>
            {" "}for assistance.
          </p>
          <button
            onClick={() => router.push("/")}
            className="text-gray-600 font-medium hover:text-gray-900 transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  // Success view
  if (success) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="max-w-md mx-auto text-center p-8">
          <div className="mb-6">
            <Image
              src="/images/SmallPlates_logo_horizontal.png"
              alt="Small Plates & Co."
              width={200}
              height={40}
              className="mx-auto mb-8"
              priority
            />
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="font-serif text-3xl font-semibold text-gray-900 mb-3">
              Welcome to Small Plates!
            </h1>
            <p className="text-lg text-gray-600 mb-6">
              Your account has been activated successfully. Redirecting you to login...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Loading token validation
  if (tokenValid === null) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="max-w-md mx-auto text-center p-8">
          <Image
            src="/images/SmallPlates_logo_horizontal.png"
            alt="Small Plates & Co."
            width={200}
            height={40}
            className="mx-auto mb-8"
            priority
          />
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D4A854] mx-auto"></div>
          <p className="text-gray-600 mt-4">Validating activation link...</p>
        </div>
      </div>
    );
  }

  // Main form view
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-full max-w-lg mx-auto px-6 py-8">
        {/* Close button */}
        <button
          onClick={() => router.push("/")}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors z-10"
          aria-label="Close"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* Logo */}
        <div className="text-center mb-8">
          <Image
            src="/images/SmallPlates_logo_horizontal.png"
            alt="Small Plates & Co."
            width={200}
            height={40}
            className="mx-auto mb-8"
            priority
          />
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="font-serif text-3xl md:text-4xl font-semibold text-gray-900 mb-3">
            Welcome to Small Plates!
          </h1>
          <p className="text-lg text-gray-600 max-w-xl mx-auto mb-2">
            Create your password to activate your account
          </p>
          {tokenData?.email && (
            <p className="text-sm text-gray-500">
              Account: <span className="font-medium">{tokenData.email}</span>
            </p>
          )}
          {tokenData?.coupleNames && (
            <p className="text-sm text-[#D4A854] mt-2">
              {tokenData.coupleNames}&apos;s Recipe Book
            </p>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleActivation} className="space-y-6">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password *
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#D4A854] focus:border-transparent outline-none transition-all"
              placeholder="Enter your password"
              minLength={8}
            />
            <p className="text-xs text-gray-500 mt-1">Must be at least 8 characters long</p>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password *
            </label>
            <input
              id="confirmPassword"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#D4A854] focus:border-transparent outline-none transition-all"
              placeholder="Confirm your password"
              minLength={8}
            />
            {confirmPassword && password !== confirmPassword && (
              <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-red-700 text-sm font-medium mb-2">{error}</p>
              <p className="text-red-600 text-xs">
                If you need help, please contact us at{" "}
                <a
                  href="mailto:team@smallplatesandcompany.com"
                  className="underline"
                >
                  team@smallplatesandcompany.com
                </a>
              </p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!isFormValid || loading}
            className={`w-full py-3 rounded-xl font-semibold transition-colors ${
              isFormValid && !loading
                ? "bg-[#D4A854] text-white hover:bg-[#c49b4a]"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block"></div>
                Activating Account...
              </>
            ) : (
              "Activate Account"
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="text-center mt-8">
          <button
            onClick={() => router.push("/")}
            className="text-gray-600 font-medium hover:text-gray-900 transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}
