import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AuthCtx = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);

const REMEMBER_ME_KEY = "lyra_remember_me";

/**
 * Wipe every trace of the current auth session from the browser:
 * - Remember-me preference
 * - Any Supabase-persisted auth tokens (sb-* keys) in local/session storage
 * - App-scoped caches under the "lyra_" namespace (except the remember-me key,
 *   which we've already removed)
 */
function clearPersistedAuthState() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(REMEMBER_ME_KEY);

    const drop = (storage: Storage) => {
      const keys: string[] = [];
      for (let i = 0; i < storage.length; i++) {
        const k = storage.key(i);
        if (!k) continue;
        if (
          k.startsWith("sb-") ||
          k.startsWith("supabase.") ||
          k.startsWith("lyra_")
        ) {
          keys.push(k);
        }
      }
      keys.forEach((k) => storage.removeItem(k));
    };

    drop(window.localStorage);
    drop(window.sessionStorage);
  } catch {
    // storage may be unavailable (private mode, quota) — ignore
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <Ctx.Provider
      value={{
        user: session?.user ?? null,
        session,
        loading,
        signOut: async () => {
          // Sign out globally so all tabs/devices lose the session.
          try {
            await supabase.auth.signOut({ scope: "global" });
          } catch {
            // fall back to a local sign-out if the network call fails
            try {
              await supabase.auth.signOut({ scope: "local" });
            } catch {
              /* noop */
            }
          }
          // Clear locally-persisted state regardless of what the server said.
          clearPersistedAuthState();
          setSession(null);
        },
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be used within AuthProvider");
  return c;
}
