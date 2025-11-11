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

        console.log('🔍 handleSession called');
        console.log('🔍 Full URL:', window.location.href);
        console.log('🔍 URL hash:', window.location.hash);

        // Check for hash parameters (from invitation email link)
        const hash = window.location.hash;
        console.log('🔍 Hash length:', hash.length);
        console.log('🔍 Hash content preview:', hash.substring(0, 50) + '...');

        if (!hash || hash.length < 10) {
          console.log('❌ No hash parameters in handleSession');
          setError('Esta invitación ha expirado o ya fue usada. Por favor, solicita una nueva invitación.');
          return;
        }

        // First, check if there's already an active session
        const { data: { session: existingSession } } = await supabase.auth.getSession();

        if (existingSession) {
          console.log('✅ Existing session found, ready for password setup');
          setSessionReady(true);
          return;
        }

        // Parse tokens from URL hash
        const hashParams = new URLSearchParams(hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const type = hashParams.get('type');

        console.log('🔍 Token type:', type);
        console.log('🔍 Access token present:', !!accessToken);
        console.log('🔍 Refresh token present:', !!refreshToken);

        if (!accessToken || !refreshToken) {
          console.log('❌ Missing tokens in URL');
          setError('Invitación inválida. Por favor, solicita una nueva invitación.');
          return;
        }

        // Verify it's an invitation token (different from password recovery)
        if (type !== 'invite') {
          console.log('⚠️ Unexpected token type for invitation:', type);
          // Don't fail - some versions might not include type parameter
        }

        // NEW APPROACH: Store tokens without complex validation
        // We'll let Supabase validate them when the user submits password
        try {
          console.log('🔄 Storing invitation tokens...');
          
          // Basic check - tokens should be non-empty strings
          if (!accessToken || !refreshToken || accessToken.length < 10 || refreshToken.length < 10) {
            console.error('❌ Tokens appear to be invalid (too short)');
            setError('Invitación inválida. Por favor, solicita una nueva invitación.');
            return;
          }

          // Try to extract email for UI purposes (non-critical)
          let userEmail = null;
          try {
            const tokenPayload = JSON.parse(atob(accessToken.split('.')[1]));
            userEmail = tokenPayload.email || null;
            console.log('📧 Email from token:', userEmail);
          } catch (emailError) {
            console.warn('⚠️ Could not extract email from token (non-critical):', emailError);
          }
          
          // Store tokens in localStorage - will be consumed when user submits password
          localStorage.setItem('invitation_access_token', accessToken);
          localStorage.setItem('invitation_refresh_token', refreshToken);
          if (userEmail) {
            localStorage.setItem('invitation_user_email', userEmail);
          }

          setSessionReady(true); // Ready for password input
          
          // Clean URL hash to prevent issues on refresh
          console.log('🧹 Cleaning URL hash...');
          window.history.replaceState(null, '', window.location.pathname);
          
          console.log('✅ Tokens stored successfully, ready for password setup');

        } catch (validationError) {
          console.error('❌ Token storage error:', validationError);
          setError('Error al procesar la invitación. Por favor, intenta de nuevo.');
        }

      } catch (err) {
        console.error('❌ Session setup error:', err);
        setError('Error al inicializar la aceptación de invitación. Por favor, intenta de nuevo.');
      }
    };

    // Check for both stored tokens and URL hash
    const initializeSession = async () => {
      try {
        if (typeof window === 'undefined') return;
        
        const supabase = createSupabaseClient();
        const hash = window.location.hash;
        const storedAccessToken = localStorage.getItem('invitation_access_token');
        const storedRefreshToken = localStorage.getItem('invitation_refresh_token');
        const storedEmail = localStorage.getItem('invitation_user_email');
        
        console.log('🔍 Initialization - Hash present:', !!hash && hash.length > 10);
        console.log('🔍 Initialization - Stored tokens present:', !!storedAccessToken && !!storedRefreshToken);
        
        // Priority 1: If we have URL hash (fresh invitation link), process it
        if (hash && hash.length > 10) {
          console.log('🔄 Processing fresh invitation link...');
          await handleSession();
          return;
        }
        
        // Priority 2: If no hash but we have stored tokens, use them
        if (storedAccessToken && storedRefreshToken) {
          console.log('🔄 Found stored invitation tokens, using them...');
          
          // Basic validation - tokens should be reasonable length
          if (storedAccessToken.length > 10 && storedRefreshToken.length > 10) {
            console.log('✅ Stored tokens look valid, ready for password setup');
            setSessionReady(true);
            return;
          } else {
            console.log('❌ Stored tokens appear invalid, clearing...');
            localStorage.removeItem('invitation_access_token');
            localStorage.removeItem('invitation_refresh_token');
            localStorage.removeItem('invitation_user_email');
            // Fall through to next check
          }
        }
        
        // Priority 3: Check if there's already an active session
        const { data: { session: existingSession } } = await supabase.auth.getSession();
        if (existingSession) {
          console.log('✅ Existing session found, ready for password setup');
          setSessionReady(true);
          return;
        }
        
        // Priority 4: No tokens, no hash, no session - show error
        console.log('❌ No valid invitation found');
        setError('Esta invitación ha expirado o ya fue usada. Por favor, solicita una nueva invitación.');
        
      } catch (err) {
        console.error('❌ Initialization error:', err);
        setError('Error al inicializar la aceptación de invitación. Por favor, intenta de nuevo.');
      }
    };

    // Initialize immediately
    initializeSession();
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
      console.log('⚠️ Resend invitation not implemented - user needs to contact admin');
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
      
      // First, establish session using invitation tokens (this is where we consume them)
      const storedAccessToken = localStorage.getItem('invitation_access_token');
      const storedRefreshToken = localStorage.getItem('invitation_refresh_token');
      
      if (!storedAccessToken || !storedRefreshToken) {
        throw new Error("No invitation tokens found. Please use the invitation link again.");
      }
      
      console.log('🔄 Establishing session with invitation tokens...');
      const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
        access_token: storedAccessToken,
        refresh_token: storedRefreshToken
      });
      
      if (sessionError) {
        // Check if tokens have expired since they were stored
        if (sessionError.message.includes('expired') || 
            sessionError.message.includes('invalid') ||
            sessionError.message.includes('already been used')) {
          
          // Get email before clearing storage
          const storedEmail = localStorage.getItem('invitation_user_email');
          
          // Clear expired tokens and show expiration UI
          localStorage.removeItem('invitation_access_token');
          localStorage.removeItem('invitation_refresh_token');
          localStorage.removeItem('invitation_user_email');
          
          setUserEmail(storedEmail);
          setTokenExpired(true);
          return;
        }
        throw new Error(`Session establishment failed: ${sessionError.message}`);
      }
      
      if (!sessionData.session) {
        throw new Error("No session established from invitation tokens");
      }
      
      console.log('✅ Session established, now updating password...');
      
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

      console.log("✅ Password successfully set for invited user:", data.user.id);
      
      // Wait a moment for session to be fully established
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Call completion endpoint to handle waitlist conversion
      try {
        console.log("🔄 Calling signup completion endpoint...");
        const completeResponse = await fetch('/api/auth/complete-signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        
        const completeResult = await completeResponse.json();
        
        if (completeResponse.ok) {
          console.log("✅ Signup completion processed:", completeResult.message);
          if (completeResult.converted) {
            console.log("📋 Waitlist user converted successfully");
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
      localStorage.removeItem('invitation_user_email');
      
      // Clean up URL hash now that signup is complete
      window.history.replaceState(null, '', window.location.pathname);
      
      // Redirect to profile after showing success message
      setTimeout(() => {
        router.push("/profile");
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