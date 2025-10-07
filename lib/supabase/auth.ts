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
 * Returns:
 *   Promise<{error: string | null}>
 */
export async function signInWithGoogle() {
  const supabase = createSupabaseClient();

  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/api/auth/callback?next=/profile`,
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
