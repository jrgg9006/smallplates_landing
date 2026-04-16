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
export async function sendMagicLink(email: string) {
  try {
    const res = await fetch("/api/auth/send-login-link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
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
