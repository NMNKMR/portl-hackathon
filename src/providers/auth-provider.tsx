import type { Session, User } from "@supabase/supabase-js";
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from "react";

import {
    signInWithGoogle as apiGoogle,
    signOut as apiSignOut,
    fetchProfile,
    signInWithPhonePassword,
    signUpWithPhonePassword,
    updateUserPhone,
    type UserProfile,
} from "@/lib/api/auth";
import { supabase } from "@/lib/supabase";

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
  signInWithPhone: (phoneLocal: string, password: string) => Promise<void>;
  signUpWithPhone: (input: {
    fullName: string;
    phoneLocal: string;
    password: string;
    email?: string;
  }) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  updatePhone: (phoneLocal: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadProfile = useCallback(async (userId: string) => {
    try {
      const next = await fetchProfile(userId);
      setProfile(next);
    } catch {
      setProfile(null);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      if (data.session?.user) {
        void loadProfile(data.session.user.id).finally(() => {
          if (mounted) setIsLoading(false);
        });
      } else {
        setIsLoading(false);
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      if (next?.user) {
        void loadProfile(next.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [loadProfile]);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      isLoading,
      signInWithPhone: async (phoneLocal, password) => {
        await signInWithPhonePassword(phoneLocal, password);
      },
      signUpWithPhone: async (input) => {
        const result = await signUpWithPhonePassword(input);
        if (!result.session) {
          // Phone confirmation may be required — try immediate password sign-in.
          try {
            await signInWithPhonePassword(input.phoneLocal, input.password);
          } catch {
            throw new Error(
              "Account created. If phone confirmation is enabled in Supabase, verify the OTP / disable Confirm phone for hackathon testing, then sign in.",
            );
          }
        }
      },
      signInWithGoogle: async () => {
        await apiGoogle();
      },
      updatePhone: async (phoneLocal) => {
        await updateUserPhone(phoneLocal);
        if (session?.user) await loadProfile(session.user.id);
      },
      signOut: async () => {
        try {
          await apiSignOut();
        } catch {
          // Still clear local session if network/signOut fails
          await supabase.auth.signOut({ scope: 'local' }).catch(() => undefined);
        }
        setSession(null);
        setProfile(null);
      },
      refreshProfile: async () => {
        if (session?.user) await loadProfile(session.user.id);
      },
    }),
    [session, profile, isLoading, loadProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
