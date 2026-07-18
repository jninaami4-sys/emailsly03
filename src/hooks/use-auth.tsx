import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { apiFetchMe, apiHasToken, apiSignOut, type AuthUser } from "@/lib/auth-client";

/**
 * Auth hook — talks to the PHP API exclusively.
 * Reads a JWT from localStorage (`emailsly_jwt`) and hydrates the current user.
 */
type AuthCtx = {
  user: AuthUser | null;
  session: null;
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
    (async () => {
      try {
        const me = apiHasToken() ? await apiFetchMe() : null;
        setApiUser(me);
      } finally {
        setLoading(false);
      }
    })();

    // Cross-tab sync: another tab logs in/out → refresh here.
    const onStorage = (e: StorageEvent) => {
      if (e.key === "emailsly_jwt") void refresh();
    };
    if (typeof window !== "undefined") window.addEventListener("storage", onStorage);
    return () => {
      if (typeof window !== "undefined") window.removeEventListener("storage", onStorage);
    };
  }, [refresh]);

  const signOut = useCallback(async () => {
    try {
      await apiSignOut();
    } catch {
      /* noop */
    }
    clearPersistedAuthState();
    setApiUser(null);
  }, []);

  return (
    <Ctx.Provider
      value={{
        user: apiUser,
        session: null,
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
