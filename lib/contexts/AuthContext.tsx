"use client";

import React from "react";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase/client";
import { syncEmailFromAuth } from "@/lib/supabase/profiles";
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
  const lastSyncedEmail = useRef<string | null>(null);

  // Reason: auth.users triggers are not allowed by Supabase, so we mirror
  // confirmed email changes into profiles/guests from the client. The ref
  // ensures we query at most once per email value per page load, and the
  // setTimeout avoids the known supabase-js deadlock when calling the
  // client inside onAuthStateChange.
  const reconcileEmail = (sessionUser: User | null) => {
    if (!sessionUser?.email || lastSyncedEmail.current === sessionUser.email) return;
    lastSyncedEmail.current = sessionUser.email;
    setTimeout(() => {
      syncEmailFromAuth(sessionUser).catch(() => {});
    }, 0);
  };

  useEffect(() => {
    const supabase = createSupabaseClient();

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
      reconcileEmail(session?.user ?? null);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
      reconcileEmail(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
