"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase/client";
import Image from "next/image";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);

  const isFormValid = password.length >= 6 && password === confirmPassword;

  // Handle session exchange when component mounts
  useEffect(() => {
    const handleSession = async () => {
      try {
        // Ensure we're on the client side
        if (typeof window === 'undefined') return;
        
        const supabase = createSupabaseClient();
        
        // Check if there are hash parameters (from email link)
        const hash = window.location.hash;
        console.log('🔍 URL hash:', hash);
        console.log('🔍 Full URL:', window.location.href);
        
        if (!hash) {
          // No hash parameters, check for existing session or URL params
          console.log('⚠️ No hash parameters, checking for existing session');
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            console.log('✅ User already authenticated, allowing password change');
            setSessionReady(true);
          } else {
            // Check if there's an email in URL params (for reused links)
            const urlParams = new URLSearchParams(window.location.search);
            const email = urlParams.get('email');
            
            if (email) {
              console.log('ℹ️ Found email in URL params, sending fresh reset link');
              // Send a fresh reset password email
              const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: window.location.origin + '/reset-password'
              });
              
              if (!resetError) {
                setError('Se ha enviado un nuevo link de reset a tu email. Por favor revisa tu correo.');
              } else {
                setError('Error enviando el email. Intenta más tarde.');
              }
            } else {
              setError('Link expirado o ya usado. Solicita un nuevo reset desde el login.');
            }
          }
          return;
        }
        
        const hashParams = new URLSearchParams(hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        
        console.log('🔍 Access token:', accessToken ? 'Found' : 'Missing');
        console.log('🔍 Refresh token:', refreshToken ? 'Found' : 'Missing');
        console.log('🔍 All hash params:', Object.fromEntries(hashParams.entries()));
        
        if (accessToken && refreshToken) {
          // Set the session using the tokens from URL
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });
          
          if (error) {
            console.error('Session error:', error);
            setError('Invalid reset link. Please request a new password reset.');
            return;
          }
          
          if (data.session) {
            console.log('✅ Session established for password reset');
            setSessionReady(true);
          }
        } else {
          console.log('⚠️ Tokens missing from hash parameters');
          // Check if user is already authenticated
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            console.log('✅ Found existing session, allowing password change');
            setSessionReady(true);
          } else {
            setError('Los tokens del email están faltando o ya se usaron. Solicita un nuevo link de reset.');
          }
        }
      } catch (err) {
        console.error('Session setup error:', err);
        setError('Failed to initialize password reset. Please try again.');
      }
    };

    handleSession();
  }, []);

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!sessionReady) {
      setError("Session not ready. Please wait or try again.");
      return;
    }
    
    if (!isFormValid) {
      setError("Please ensure passwords match and are at least 6 characters long");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const supabase = createSupabaseClient();
      
      // Update the user's password in Supabase Auth
      const { data, error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        throw new Error(error.message);
      }

      // Verify the user is properly authenticated after password update
      if (!data.user) {
        throw new Error("Password update failed - user not authenticated");
      }

      console.log("✅ Password successfully updated for user:", data.user.id);
      
      setSuccess(true);
      
      // Redirect to profile after showing success message
      setTimeout(() => {
        router.push("/profile");
      }, 2000);
      
    } catch (err) {
      console.error("Password reset error:", err);
      setError(err instanceof Error ? err.message : "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

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
              Password Updated!
            </h1>
            <p className="text-lg text-gray-600 mb-6">
              Your password has been successfully updated. Redirecting to your profile...
            </p>
          </div>
        </div>
      </div>
    );
  }

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
            Set Your Password
          </h1>
          <p className="text-lg text-gray-600 max-w-xl mx-auto">
            Create a secure password for your Small Plates account
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handlePasswordReset} className="space-y-6">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              New Password *
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
              placeholder="Enter your new password"
              minLength={6}
            />
            <p className="text-xs text-gray-500 mt-1">Must be at least 6 characters long</p>
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
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
              placeholder="Confirm your new password"
              minLength={6}
            />
            {confirmPassword && password !== confirmPassword && (
              <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!isFormValid || loading || !sessionReady}
            className={`w-full py-3 rounded-xl font-semibold transition-colors ${
              isFormValid && !loading && sessionReady
                ? "bg-black text-white hover:bg-gray-800"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block"></div>
                Updating Password...
              </>
            ) : !sessionReady ? (
              "Initializing..."
            ) : (
              "Update Password"
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