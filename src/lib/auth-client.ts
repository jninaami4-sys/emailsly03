/**
 * Thin auth facade over the PHP API.
 * Wraps `authApi` from api-client.ts with a compatibility shape that
 * mirrors the pieces of the Supabase user object the app still reads
 * (`id`, `email`, `user_metadata`), so migration can proceed one consumer
 * at a time. `is_admin` is derived from the JWT `roles` claim returned by
 * `/api/auth/me`.
 */
import { authApi, getToken, setToken, ApiError } from "@/lib/api-client";

export type AuthUser = {
  id: string;
  email: string | null;
  user_metadata?: Record<string, unknown>;
  roles: string[];
  is_admin: boolean;
};

type RawMe = {
  user?: {
    id?: string;
    email?: string;
    full_name?: string | null;
    avatar_url?: string | null;
    roles?: string[];
    is_admin?: boolean;
  } & Record<string, unknown>;
  profile?: Record<string, unknown> | null;
};

function normalize(raw: RawMe | null | undefined): AuthUser | null {
  const u = raw?.user;
  if (!u?.id) return null;
  const roles = Array.isArray(u.roles) ? u.roles.map(String) : [];
  const isAdmin = Boolean(u.is_admin) || roles.includes("admin");
  const profile = (raw?.profile ?? {}) as Record<string, unknown>;
  // Provide user_metadata for legacy consumers (chatbot prefill, review modal)
  const meta: Record<string, unknown> = {
    ...profile,
    full_name: u.full_name ?? profile.full_name ?? null,
    avatar_url: u.avatar_url ?? profile.avatar_url ?? null,
  };
  return {
    id: String(u.id),
    email: (u.email as string | undefined) ?? null,
    user_metadata: meta,
    roles,
    is_admin: isAdmin,
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
