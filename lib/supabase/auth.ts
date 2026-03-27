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
 * Send password reset email
 *
 * Args:
 *   email (string): User's email address
 *
 * Returns:
 *   Promise<{error: string | null}>
 */
export async function resetPassword(email: string) {
  const supabase = createSupabaseClient();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });

  if (error) {
    return { error: error.message };
  }

  return { error: null };
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
