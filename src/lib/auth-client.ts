/**
 * Thin auth facade over the PHP API.
 * Wraps `authApi` from api-client.ts with a compatibility shape that
 * matches the pieces of the Supabase user object the app currently reads
 * (`id`, `email`, `user_metadata`). This lets us migrate consumers off
 * `@supabase/supabase-js` types one at a time.
 */
import { authApi, getToken, setToken, ApiError } from "@/lib/api-client";

export type AuthUser = {
  id: string;
  email: string | null;
  user_metadata?: Record<string, unknown>;
  is_admin?: boolean;
};

type RawMe = {
  user?: { id?: string; email?: string; is_admin?: boolean } & Record<string, unknown>;
  profile?: Record<string, unknown> | null;
};

function normalize(raw: RawMe | null | undefined): AuthUser | null {
  const u = raw?.user;
  if (!u?.id) return null;
  return {
    id: String(u.id),
    email: (u.email as string | undefined) ?? null,
    user_metadata: (raw?.profile ?? {}) as Record<string, unknown>,
    is_admin: Boolean(u.is_admin),
  };
}

export async function apiSignIn(email: string, password: string): Promise<AuthUser> {
  const r = await authApi.login({ email, password });
  const u = normalize(r as RawMe);
  if (!u) throw new Error("Login response missing user");
  return u;
}

export async function apiSignUp(input: {
  email: string;
  password: string;
  full_name?: string;
  referral_code?: string;
}): Promise<AuthUser> {
  const r = await authApi.register(input);
  const u = normalize(r as RawMe);
  if (!u) throw new Error("Register response missing user");
  return u;
}

export async function apiSignOut(): Promise<void> {
  try {
    await authApi.logout();
  } catch {
    /* noop */
  }
  setToken(null);
}

export async function apiFetchMe(): Promise<AuthUser | null> {
  if (!getToken()) return null;
  try {
    const r = (await authApi.me()) as RawMe;
    return normalize(r);
  } catch (e) {
    if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
      setToken(null);
      return null;
    }
    // Network / server down: don't destroy the local token; just return null.
    return null;
  }
}

export function apiHasToken(): boolean {
  return Boolean(getToken());
}

export { getToken, setToken };
