/**
 * Emailsly REST API client — talks to the PHP backend.
 *
 * Configure `VITE_API_BASE_URL` in `.env` (e.g. https://api.emailsly.com).
 * Falls back to `/api` for same-origin dev.
 *
 * Auth: JWT bearer token stored in localStorage under `emailsly_jwt`.
 */

const BASE = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/+$/, "");
const TOKEN_KEY = "emailsly_jwt";

export const getToken = () =>
  typeof window === "undefined" ? null : window.localStorage.getItem(TOKEN_KEY);
export const setToken = (t: string | null) => {
  if (typeof window === "undefined") return;
  if (t) window.localStorage.setItem(TOKEN_KEY, t);
  else window.localStorage.removeItem(TOKEN_KEY);
};

export class ApiError extends Error {
  constructor(public status: number, message: string, public body?: unknown) {
    super(message);
  }
}

type Init = Omit<RequestInit, "body"> & {
  body?: unknown;
  auth?: boolean;
};

export async function api<T = unknown>(path: string, init: Init = {}): Promise<T> {
  const { body, auth = true, headers, ...rest } = init;
  const h = new Headers(headers);
  if (body !== undefined && !(body instanceof FormData)) {
    h.set("Content-Type", "application/json");
  }
  if (auth) {
    const t = getToken();
    if (t) h.set("Authorization", `Bearer ${t}`);
  }
  const url = path.startsWith("http") ? path : `${BASE}${path}`;
  const res = await fetch(url, {
    ...rest,
    headers: h,
    body:
      body === undefined
        ? undefined
        : body instanceof FormData
          ? body
          : JSON.stringify(body),
    credentials: "include",
  });
  const text = await res.text();
  const data = text ? safeJson(text) : null;
  if (!res.ok) {
    const msg =
      (data && typeof data === "object" && "error" in data
        ? String((data as { error: unknown }).error)
        : res.statusText) || "Request failed";
    throw new ApiError(res.status, msg, data);
  }
  return data as T;
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

// -------- Auth helpers --------
export const authApi = {
  register: (input: { email: string; password: string; full_name?: string; referral_code?: string }) =>
    api<{ token: string; user: unknown; profile: unknown }>("/api/auth/register", {
      method: "POST",
      body: input,
      auth: false,
    }).then((r) => {
      setToken(r.token);
      return r;
    }),
  login: (input: { email: string; password: string }) =>
    api<{ token: string; user: unknown; profile: unknown }>("/api/auth/login", {
      method: "POST",
      body: input,
      auth: false,
    }).then((r) => {
      setToken(r.token);
      return r;
    }),
  logout: () => {
    setToken(null);
    return api("/api/auth/logout", { method: "POST" }).catch(() => null);
  },
  me: () => api<{ user: unknown; profile: unknown }>("/api/auth/me"),
  refresh: () =>
    api<{ token: string; user: unknown; profile: unknown }>("/api/auth/refresh", {
      method: "POST",
    }).then((r) => {
      setToken(r.token);
      return r;
    }),
  forgotPassword: (email: string) =>
    api("/api/auth/password/forgot", { method: "POST", body: { email }, auth: false }),
  resetPassword: (token: string, password: string) =>
    api("/api/auth/password/reset", { method: "POST", body: { token, password }, auth: false }),
  updateMe: (patch: Record<string, unknown>) =>
    api("/api/auth/me", { method: "PATCH", body: patch }),
};