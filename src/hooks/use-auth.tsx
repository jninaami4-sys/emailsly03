import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { ensureUserRole } from "@/lib/ensure-admin-role.functions";
import { apiFetchMe, apiHasToken, apiSignOut, type AuthUser } from "@/lib/auth-client";

/**
 * Compatibility auth hook. Prefers the PHP API session (JWT in localStorage)
 * and falls back to the existing Supabase session while individual features
 * are migrated. Consumers keep reading `user.id` / `user.email` — those
 * fields exist on both shapes.
 *
 * Rewiring plan lives in `.lovable/plan.md`.
 */
type AuthCtx = {
  user: (User | AuthUser) | null;
  session: Session | null;
  loading: boolean;
  isApiSession: boolean;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);

const REMEMBER_ME_KEY = "lyra_remember_me";

function clearPersistedAuthState() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(REMEMBER_ME_KEY);
    const drop = (storage: Storage) => {
      const keys: string[] = [];
      for (let i = 0; i < storage.length; i++) {
        const k = storage.key(i);
        if (!k) continue;
        if (k.startsWith("sb-") || k.startsWith("supabase.") || k.startsWith("lyra_")) {
          keys.push(k);
        }
      }
      keys.forEach((k) => storage.removeItem(k));
    };
    drop(window.localStorage);
    drop(window.sessionStorage);
  } catch {
    /* noop */
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [apiUser, setApiUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (apiHasToken()) {
      const u = await apiFetchMe();
      setApiUser(u);
    } else {
      setApiUser(null);
    }
  }, []);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      if (event === "SIGNED_IN" && s?.user) {
        void ensureUserRole().catch((e) => console.warn("ensureUserRole failed", e));
      }
    });

    (async () => {
      try {
        const [{ data }, apiMe] = await Promise.all([
          supabase.auth.getSession(),
          apiHasToken() ? apiFetchMe() : Promise.resolve(null),
        ]);
        setSession(data.session);
        setApiUser(apiMe);
      } finally {
        setLoading(false);
      }
    })();

    // Cross-tab sync: another tab logs in/out via API → refresh here.
    const onStorage = (e: StorageEvent) => {
      if (e.key === "emailsly_jwt") void refresh();
    };
    if (typeof window !== "undefined") window.addEventListener("storage", onStorage);

    return () => {
      sub.subscription.unsubscribe();
      if (typeof window !== "undefined") window.removeEventListener("storage", onStorage);
    };
  }, [refresh]);

  const signOut = useCallback(async () => {
    // Sign out of both stacks so the user is fully logged out during migration.
    try {
      await apiSignOut();
    } catch {
      /* noop */
    }
    try {
      await supabase.auth.signOut({ scope: "global" });
    } catch {
      try {
        await supabase.auth.signOut({ scope: "local" });
      } catch {
        /* noop */
      }
    }
    clearPersistedAuthState();
    setSession(null);
    setApiUser(null);
  }, []);

  const user: User | AuthUser | null = apiUser ?? session?.user ?? null;

  return (
    <Ctx.Provider
      value={{
        user,
        session,
        loading,
        isApiSession: Boolean(apiUser),
        refresh,
        signOut,
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
