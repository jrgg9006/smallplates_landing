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
  const [tokenExpired, setTokenExpired] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  const isFormValid = password.length >= 6 && password === confirmPassword;

  // Handle session exchange when component mounts
  useEffect(() => {
    const handleSession = async () => {
      try {
        if (typeof window === 'undefined') return;

        const supabase = createSupabaseClient();

        // console.log removed for production
        // console.log removed for production

        // First, check if there's already an active session
        const { data: { session: existingSession } } = await supabase.auth.getSession();

        if (existingSession) {
          // console.log removed for production
          setSessionReady(true);
          return;
        }

        // Check for hash parameters (from email link)
        const hash = window.location.hash;
        // console.log removed for production

        if (!hash || hash.length < 10) {
          // console.log removed for production
          setError('Este link de reset ha expirado o ya fue usado. Por favor, solicita un nuevo link de reset.');
          return;
        }

        // Parse tokens from URL hash
        const hashParams = new URLSearchParams(hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const type = hashParams.get('type');

        // console.log removed for production
        // console.log removed for production
        // console.log removed for production

        if (!accessToken || !refreshToken) {
          // console.log removed for production
          setError('Link de reset inválido. Por favor, solicita un nuevo link.');
          return;
        }

        // Verify it's a recovery token
        if (type !== 'recovery') {
          // console.log removed for production
        }

        // Set the session using tokens from URL
        // console.log removed for production
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken
        });

        if (error) {
          console.error('❌ Session error:', error.message, error);

          // Check if error is about expired/used token
          if (error.message.includes('already been used') ||
              error.message.includes('Invalid Refresh Token') ||
              error.message.includes('expired') ||
              error.message.includes('invalid')) {

            // Token is expired/invalid - try to extract email from the access token
            try {
              // Decode JWT to get email (tokens are JWT format)
              const tokenPayload = JSON.parse(atob(accessToken!.split('.')[1]));
              const email = tokenPayload.email;

              // console.log removed for production
              setUserEmail(email);
              setTokenExpired(true);

            } catch (e) {
              console.error('Could not extract email from token:', e);
              setTokenExpired(true);
            }

            return;
          } else {
            setError(`Error estableciendo sesión: ${error.message}`);
          }
          return;
        }

        if (data.session) {
          // console.log removed for production
          // console.log removed for production
          setSessionReady(true);

          // Clean up URL hash to prevent token reuse issues on refresh
          // console.log removed for production
          window.history.replaceState(null, '', window.location.pathname);
        } else {
          // console.log removed for production
          setError('Error estableciendo sesión. Por favor, intenta con un nuevo link.');
        }

      } catch (err) {
        console.error('❌ Session setup error:', err);
        setError('Error al inicializar el reset de contraseña. Por favor, intenta de nuevo.');
      }
    };

    handleSession();
  }, []);

  const handleResendLink = async () => {
    if (!userEmail) {
      setError('No se pudo obtener el email. Por favor, solicita un nuevo link desde el login.');
      return;
    }

    setResendLoading(true);
    setError(null);

    try {
      const supabase = createSupabaseClient();
      const redirectUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/reset-password`
        : `http://localhost:3000/reset-password`;

      const { error } = await supabase.auth.resetPasswordForEmail(userEmail, {
        redirectTo: redirectUrl
      });

      if (error) {
        throw new Error(error.message);
      }

      // console.log removed for production
      setResendSuccess(true);

    } catch (err) {
      console.error('Error sending new link:', err);
      setError(err instanceof Error ? err.message : 'Error enviando el link');
    } finally {
      setResendLoading(false);
    }
  };

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

      // console.log removed for production
      
      // Wait a moment for session to be fully established
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Call completion endpoint to handle waitlist conversion
      try {
        // console.log removed for production
        const completeResponse = await fetch('/api/v1/auth/complete-signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        
        const completeResult = await completeResponse.json();
        
        if (completeResponse.ok) {
          // console.log removed for production
          if (completeResult.converted) {
            // console.log removed for production
          }
        } else {
          console.error("⚠️ Signup completion endpoint failed:", completeResult.error);
          // Don't fail the flow - password was successfully updated
        }
      } catch (completeError) {
        console.error("⚠️ Error calling signup completion:", completeError);
        // Don't fail the flow - password was successfully updated
      }
      
      setSuccess(true);
      
      // Redirect to groups page after showing success message
      setTimeout(() => {
        router.push("/profile/groups");
      }, 2000);
      
    } catch (err) {
      console.error("Password reset error:", err);
      setError(err instanceof Error ? err.message : "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  // Token expired view - show resend option
  if (tokenExpired) {
    if (resendSuccess) {
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
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="font-serif text-3xl font-semibold text-gray-900 mb-3">
              ¡Link Enviado!
            </h1>
            <p className="text-lg text-gray-600 mb-4">
              Te enviamos un nuevo link a:
            </p>
            <p className="text-lg font-semibold text-gray-900 mb-6">
              {userEmail}
            </p>
            <p className="text-sm text-gray-500">
              Revisa tu email y haz click en el nuevo link para configurar tu contraseña.
            </p>
          </div>
        </div>
      );
    }

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
            Este Link Ya Expiró
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            Este link ya fue usado o ha expirado.
          </p>

          {userEmail && (
            <div className="mb-6">
              <p className="text-md text-gray-700 mb-4">
                ¿Quieres que te enviemos un nuevo link?
              </p>
              <p className="text-sm text-gray-500 mb-6">
                Lo enviaremos a: <span className="font-semibold">{userEmail}</span>
              </p>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl mb-6">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <button
            onClick={handleResendLink}
            disabled={resendLoading}
            className="w-full py-3 bg-black text-white rounded-xl font-semibold hover:bg-gray-800 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed mb-4"
          >
            {resendLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block"></div>
                Enviando...
              </>
            ) : (
              '🔄 Enviar Nuevo Link'
            )}
          </button>

          <button
            onClick={() => router.push("/")}
            className="text-gray-600 font-medium hover:text-gray-900 transition-colors"
          >
            Volver al Inicio
          </button>
        </div>
      </div>
    );
  }

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
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-red-700 text-sm font-medium mb-2">{error}</p>
              <p className="text-red-600 text-xs">
                Si necesitas ayuda, contáctanos o solicita un nuevo link desde la página de inicio.
              </p>
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