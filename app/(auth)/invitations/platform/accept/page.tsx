"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase/client";
import Image from "next/image";

export default function AcceptInvitationPage() {
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

        // Check for hash parameters (from invitation email link)
        const hash = window.location.hash;
        const search = window.location.search;
        
        // console.log removed for production
        // console.log removed for production
        // console.log removed for production
        // console.log removed for production

        // Try hash first, then search params
        let params = null;
        if (hash && hash.length > 10) {
          // console.log removed for production
          params = new URLSearchParams(hash.substring(1));
        } else if (search && search.length > 10) {
          // console.log removed for production
          params = new URLSearchParams(search.substring(1));
        }

        if (!params) {
          // console.log removed for production
          setError('Esta invitación ha expirado o ya fue usada. Por favor, solicita una nueva invitación.');
          return;
        }

        // Parse tokens from URL parameters
        const hashParams = params;
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const type = hashParams.get('type');

        // console.log removed for production
        // console.log removed for production
        // console.log removed for production

        if (!accessToken || !refreshToken) {
          // console.log removed for production
          setError('Invitación inválida. Por favor, solicita una nueva invitación.');
          return;
        }

        // Verify it's an invitation token (different from password recovery)
        if (type !== 'invite') {
          // console.log removed for production
          // Don't fail - some versions might not include type parameter
        }

        // NEW APPROACH: Instead of immediately consuming tokens, verify they're valid
        // without establishing a session until the user actually needs it
        try {
          // Validate tokens by attempting to set session, but in a non-persistent way
          // console.log removed for production
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });

          if (error) {
            console.error('❌ Session validation error:', error.message);

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

              // Clear any stored tokens since they're expired/invalid
              localStorage.removeItem('invitation_access_token');
              localStorage.removeItem('invitation_refresh_token');
              
              return;
            } else {
              setError(`Error estableciendo sesión: ${error.message}`);
            }
            return;
          }

          if (data.session) {
            // console.log removed for production
            // console.log removed for production
            // console.log removed for production
            setSessionReady(true);

            // Store tokens in localStorage so they persist even if user closes tab completely
            localStorage.setItem('invitation_access_token', accessToken);
            localStorage.setItem('invitation_refresh_token', refreshToken);

            // Clean up URL hash but keep tokens available for password setup
            // console.log removed for production
            window.history.replaceState(null, '', window.location.pathname);
          } else {
            // console.log removed for production
            setError('Error estableciendo sesión. Por favor, intenta con una nueva invitación.');
          }

        } catch (validationError) {
          console.error('❌ Token validation error:', validationError);
          setError('Error al validar la invitación. Por favor, intenta de nuevo.');
        }

      } catch (err) {
        console.error('❌ Session setup error:', err);
        setError('Error al inicializar la aceptación de invitación. Por favor, intenta de nuevo.');
      }
    };

    // Also check localStorage for stored tokens (if user closed tab and came back)
    const handleStoredTokens = async () => {
      const storedAccessToken = localStorage.getItem('invitation_access_token');
      const storedRefreshToken = localStorage.getItem('invitation_refresh_token');
      
      if (storedAccessToken && storedRefreshToken && !window.location.hash) {
        // console.log removed for production
        
        const supabase = createSupabaseClient();
        
        try {
          const { data, error } = await supabase.auth.setSession({
            access_token: storedAccessToken,
            refresh_token: storedRefreshToken
          });

          if (data.session && !error) {
            // console.log removed for production
            setSessionReady(true);
            return;
          } else {
            // console.log removed for production
            localStorage.removeItem('invitation_access_token');
            localStorage.removeItem('invitation_refresh_token');
          }
        } catch (restoreError) {
          console.error('❌ Error restoring session from stored tokens:', restoreError);
          localStorage.removeItem('invitation_access_token');
          localStorage.removeItem('invitation_refresh_token');
        }
      }
      
      // If no stored tokens or they failed, proceed with URL hash check
      handleSession();
    };

    handleStoredTokens();
  }, []);

  const handleResendInvitation = async () => {
    if (!userEmail) {
      setError('No se pudo obtener el email. Por favor, contacta al administrador para una nueva invitación.');
      return;
    }

    setResendLoading(true);
    setError(null);

    try {
      // Note: We can't directly resend invitations from client side
      // This would need to be handled by contacting the admin or through a special API
      // console.log removed for production
      setError('Por favor, contacta al administrador para solicitar una nueva invitación.');

    } catch (err) {
      console.error('Error with resend request:', err);
      setError('Error al solicitar nueva invitación');
    } finally {
      setResendLoading(false);
    }
  };

  const handlePasswordSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!sessionReady) {
      setError("Sesión no está lista. Por favor espera o intenta de nuevo.");
      return;
    }
    
    if (!isFormValid) {
      setError("Por favor asegúrate que las contraseñas coincidan y tengan al menos 6 caracteres");
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
        throw new Error("Password setup failed - user not authenticated");
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
      
      // Clean up stored invitation tokens since signup is complete
      localStorage.removeItem('invitation_access_token');
      localStorage.removeItem('invitation_refresh_token');
      
      // Redirect to groups section after showing success message
      setTimeout(() => {
        router.push("/profile/groups");
      }, 2000);
      
    } catch (err) {
      console.error("Password setup error:", err);
      setError(err instanceof Error ? err.message : "Failed to set up password");
    } finally {
      setLoading(false);
    }
  };

  // Token expired view - show contact admin option
  if (tokenExpired) {
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
            Esta Invitación Ya Expiró
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            Esta invitación ya fue usada o ha expirado.
          </p>

          {userEmail && (
            <div className="mb-6">
              <p className="text-md text-gray-700 mb-4">
                Tu email de invitación era: <span className="font-semibold">{userEmail}</span>
              </p>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl mb-6">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <p className="text-sm text-gray-500 mb-6">
            Por favor contacta al administrador para solicitar una nueva invitación.
          </p>

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
              ¡Bienvenido a Small Plates!
            </h1>
            <p className="text-lg text-gray-600 mb-6">
              Tu contraseña ha sido configurada exitosamente. Te redirigimos a tu perfil...
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
            Configura tu Contraseña
          </h1>
          <p className="text-lg text-gray-600 max-w-xl mx-auto">
            ¡Bienvenido! Crea una contraseña segura para acceder a tu cuenta de Small Plates
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handlePasswordSetup} className="space-y-6">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Nueva Contraseña *
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
              placeholder="Ingresa tu nueva contraseña"
              minLength={6}
            />
            <p className="text-xs text-gray-500 mt-1">Debe tener al menos 6 caracteres</p>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Confirmar Contraseña *
            </label>
            <input
              id="confirmPassword"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
              placeholder="Confirma tu nueva contraseña"
              minLength={6}
            />
            {confirmPassword && password !== confirmPassword && (
              <p className="text-xs text-red-500 mt-1">Las contraseñas no coinciden</p>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-red-700 text-sm font-medium mb-2">{error}</p>
              <p className="text-red-600 text-xs">
                Si necesitas ayuda, contáctanos o solicita una nueva invitación.
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
                Configurando Contraseña...
              </>
            ) : !sessionReady ? (
              "Inicializando..."
            ) : (
              "Configurar Contraseña"
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="text-center mt-8">
          <button
            onClick={() => router.push("/")}
            className="text-gray-600 font-medium hover:text-gray-900 transition-colors"
          >
            Volver al Inicio
          </button>
        </div>
      </div>
    </div>
  );
}