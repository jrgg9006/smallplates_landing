"use client";

import React from "react";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Auth Provider component to wrap the app
 *
 * Args:
 *   children (ReactNode): Child components
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const supabase = createSupabaseClient();

    // Get initial session - handle errors silently
    // This prevents console errors when refresh tokens are invalid/expired
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        // Silently handle invalid refresh token errors
        // This is expected when there's no valid session (e.g., on landing page)
        // Common errors: "Invalid Refresh Token: Refresh Token Not Found"
        setUser(null);
      } else {
        setUser(session?.user ?? null);
      }
      setLoading(false);
    }).catch((err) => {
      // Catch any unexpected errors and handle gracefully
      // This ensures the app doesn't break if there's an auth error
      setUser(null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    const supabase = createSupabaseClient();
    await supabase.auth.signOut();
    setUser(null);
    router.push("/");
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut: handleSignOut }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to use auth context
 *
 * Returns:
 *   AuthContextType: Auth context with user, loading, and signOut
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
