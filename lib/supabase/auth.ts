import { createSupabaseClient } from "./client";

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
}

/**
 * Sign in with email and password
 *
 * Args:
 *   email (string): User's email address
 *   password (string): User's password
 *
 * Returns:
 *   Promise<{user: AuthUser | null, error: string | null}>
 */
export async function signInWithEmail(email: string, password: string) {
  const supabase = createSupabaseClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { user: null, error: error.message };
  }

  return { user: data.user as AuthUser, error: null };
}

/**
 * Sign up with email and password
 *
 * Args:
 *   email (string): User's email address
 *   password (string): User's password
 *
 * Returns:
 *   Promise<{user: AuthUser | null, error: string | null}>
 */
export async function signUpWithEmail(email: string, password: string) {
  const supabase = createSupabaseClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    return { user: null, error: error.message };
  }

  return { user: data.user as AuthUser, error: null };
}

/**
 * Sign in with Google OAuth
 *
 * Args:
 *   options.loginHint (string): Pre-fill the Google email field
 *   options.redirectTo (string): Override the default post-auth redirect
 *
 * Returns:
 *   Promise<{error: string | null}>
 */
export async function signInWithGoogle(options?: { loginHint?: string; redirectTo?: string }) {
  const supabase = createSupabaseClient();

  const defaultRedirect = `${window.location.origin}/api/v1/auth/callback?next=/profile/groups`;

  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: options?.redirectTo || defaultRedirect,
      ...(options?.loginHint ? { queryParams: { login_hint: options.loginHint } } : {}),
    },
  });

  if (error) {
    return { error: error.message };
  }

  return { error: null };
}

/**
 * Send a one-time magic link to the user's email.
 *
 * Proxies to `/api/auth/send-login-link` which uses `supabaseAdmin.auth.admin.generateLink`
 * on the server. The resulting link uses implicit flow (`#access_token` in hash) so it
 * works across browsers/devices without requiring a PKCE code verifier in localStorage.
 *
 * The endpoint always returns success (even for unknown emails) to avoid account enumeration.
 */
export async function sendMagicLink(
  email: string,
  options?: { allowSignup?: boolean; redirectTo?: string }
) {
  try {
    const res = await fetch("/api/auth/send-login-link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        ...(options?.allowSignup ? { allowSignup: true } : {}),
        ...(options?.redirectTo ? { redirectTo: options.redirectTo } : {}),
      }),
    });

    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      return { error: body.error || "Could not send login link" };
    }
    return { error: null };
  } catch {
    return { error: "Could not send login link. Try again." };
  }
}

/**
 * Verify the 6-digit login code from the login email.
 *
 * The code is the `email_otp` minted by `admin.generateLink({ type: "magiclink" })` —
 * same one-time token as the link, so using either consumes both.
 */
export async function verifyLoginCode(email: string, code: string) {
  const supabase = createSupabaseClient();

  const { error } = await supabase.auth.verifyOtp({
    email,
    token: code,
    type: 'email',
  });

  if (!error) {
    return { error: null };
  }

  // Reason: tokens minted via generateLink({type:'magiclink'}) verify as type
  // 'magiclink' on some GoTrue versions — retry before reporting failure.
  const { error: legacyError } = await supabase.auth.verifyOtp({
    email,
    token: code,
    type: 'magiclink',
  });

  if (legacyError) {
    return { error: 'That code didn’t work. Check for typos, or request a new one.' };
  }

  return { error: null };
}

/**
 * Send password reset email.
 *
 * Proxies to `/api/auth/send-reset-link` which uses `supabaseAdmin.auth.admin.generateLink`
 * on the server. The resulting link uses implicit flow (`#access_token` in hash) so it
 * works across browsers/devices without requiring a PKCE code verifier in localStorage.
 *
 * The endpoint always returns success (even for unknown emails) to avoid account enumeration.
 */
export async function resetPassword(email: string) {
  try {
    const res = await fetch("/api/auth/send-reset-link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      return { error: body.error || "Could not send reset link" };
    }
    return { error: null };
  } catch {
    return { error: "Could not send reset link. Try again." };
  }
}

/**
 * Sign out the current user
 *
 * Returns:
 *   Promise<{error: string | null}>
 */
export async function signOut() {
  const supabase = createSupabaseClient();

  const { error } = await supabase.auth.signOut();

  if (error) {
    return { error: error.message };
  }

  return { error: null };
}

/**
 * Get the current session
 *
 * Returns:
 *   Promise<{user: AuthUser | null, error: string | null}>
 */
export async function getCurrentUser() {
  const supabase = createSupabaseClient();

  const { data, error } = await supabase.auth.getUser();

  if (error) {
    return { user: null, error: error.message };
  }

  return { user: data.user as AuthUser, error: null };
}
