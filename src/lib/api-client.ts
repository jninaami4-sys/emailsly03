/**
 * Emailsly REST API client — talks to the PHP backend.
 *
 * Base URL resolution (first match wins):
 *   1. Runtime override:  window.__API_BASE__            (set in index.html or by hosting)
 *   2. Runtime meta tag:  <meta name="api-base" content="https://api.example.com">
 *   3. Build-time env:    VITE_API_BASE_URL              (baked in during `bun run build`)
 *   4. Same-origin fallback: "" (calls hit "/api/..." on the current host —
 *      ideal when the PHP API is co-hosted with the SPA on cPanel).
 *
 * Set VITE_API_BASE_URL in a `.env.local` or `.env.production` file, e.g.:
 *   VITE_API_BASE_URL="https://api.emailsly.com"
 *
 * For zero-rebuild deploys, drop this into `index.html` before the app script:
 *   <script>window.__API_BASE__="https://api.emailsly.com";</script>
 *
 * Auth: JWT bearer token stored in localStorage under `emailsly_jwt`.
 */

declare global {
  interface Window {
    __API_BASE__?: string;
  }
}

function resolveBase(): string {
  // 1) Runtime global
  if (typeof window !== "undefined" && typeof window.__API_BASE__ === "string") {
    return window.__API_BASE__.replace(/\/+$/, "");
  }
  // 2) Meta tag
  if (typeof document !== "undefined") {
    const m = document.querySelector('meta[name="api-base"]');
    const c = m?.getAttribute("content");
    if (c) return c.replace(/\/+$/, "");
  }
  // 3) Build-time env
  const envBase = (import.meta.env.VITE_API_BASE_URL as string | undefined) || "";
  return envBase.replace(/\/+$/, "");
}

// Cache after first read; can be reset via setApiBase() for tests/multi-tenant.
let BASE = resolveBase();

/** Current resolved API base URL (empty string = same-origin). */
export const getApiBase = () => BASE;

/** Programmatically override the API base URL (persists for the session only). */
export const setApiBase = (url: string) => {
  BASE = (url || "").replace(/\/+$/, "");
};

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
  query?: Record<string, string | number | boolean | undefined | null>;
};

function qs(query?: Init["query"]) {
  if (!query) return "";
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v === undefined || v === null || v === "") continue;
    p.set(k, String(v));
  }
  const s = p.toString();
  return s ? `?${s}` : "";
}

export async function api<T = unknown>(path: string, init: Init = {}): Promise<T> {
  const { body, auth = true, headers, query, ...rest } = init;
  const h = new Headers(headers);
  if (body !== undefined && !(body instanceof FormData)) {
    h.set("Content-Type", "application/json");
  }
  if (auth) {
    const t = getToken();
    if (t) h.set("Authorization", `Bearer ${t}`);
  }
  const method = (rest.method || "GET").toUpperCase();
  const url = (path.startsWith("http") ? path : `${BASE}${path}`) + qs(query);
  const startedAt = Date.now();
  let status = 0;
  let contentType = "";
  let ok = false;
  let errorMessage: string | undefined;
  try {
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
    status = res.status;
    contentType = res.headers.get("content-type") || "";
    const text = await res.text();
    const looksHtml = contentType.includes("text/html") || text.trimStart().startsWith("<");
    const data = text ? safeJson(text) : null;
    if (!res.ok) {
      if (looksHtml) {
        errorMessage = `Expected JSON, got HTML (HTTP ${res.status})`;
        throw new ApiError(
          res.status,
          `API unreachable at ${BASE || window.location.origin}${path} — expected JSON, got HTML (HTTP ${res.status}). Check VITE_API_BASE_URL or window.__API_BASE__.`,
          null,
        );
      }
      const msg =
        (data && typeof data === "object" && "error" in data
          ? String((data as { error: unknown }).error)
          : res.statusText) || "Request failed";
      errorMessage = msg;
      throw new ApiError(res.status, msg, data);
    }
    if (looksHtml) {
      errorMessage = "Expected JSON, got HTML";
      throw new ApiError(
        res.status,
        `API unreachable at ${BASE || window.location.origin}${path} — expected JSON, got HTML. Check VITE_API_BASE_URL or window.__API_BASE__.`,
        null,
      );
    }
    ok = true;
    return data as T;
  } catch (e) {
    if (!errorMessage) errorMessage = e instanceof Error ? e.message : String(e);
    throw e;
  } finally {
    recordApiCall({
      id: `${startedAt}-${Math.random().toString(36).slice(2, 8)}`,
      at: startedAt,
      method,
      url,
      path,
      status,
      ok,
      contentType,
      durationMs: Date.now() - startedAt,
      error: ok ? undefined : errorMessage,
    });
  }
}

// -------- Diagnostics: request log ring buffer --------
export type ApiLogEntry = {
  id: string;
  at: number;
  method: string;
  url: string;
  path: string;
  status: number;
  ok: boolean;
  contentType: string;
  durationMs: number;
  error?: string;
};

const API_LOG_LIMIT = 50;
const apiLog: ApiLogEntry[] = [];
const apiLogListeners = new Set<(entries: ApiLogEntry[]) => void>();

function recordApiCall(entry: ApiLogEntry) {
  apiLog.unshift(entry);
  if (apiLog.length > API_LOG_LIMIT) apiLog.length = API_LOG_LIMIT;
  for (const l of apiLogListeners) {
    try { l([...apiLog]); } catch { /* ignore */ }
  }
}

export function getApiLog(): ApiLogEntry[] {
  return [...apiLog];
}

export function subscribeApiLog(fn: (entries: ApiLogEntry[]) => void): () => void {
  apiLogListeners.add(fn);
  return () => { apiLogListeners.delete(fn); };
}

export function clearApiLog() {
  apiLog.length = 0;
  for (const l of apiLogListeners) {
    try { l([]); } catch { /* ignore */ }
  }
}


function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

const j = <T = unknown>(path: string, body?: unknown, method = "POST") =>
  api<T>(path, { method, body });
const g = <T = unknown>(path: string, query?: Init["query"]) => api<T>(path, { query });
const del = <T = unknown>(path: string) => api<T>(path, { method: "DELETE" });
const patch = <T = unknown>(path: string, body?: unknown) =>
  api<T>(path, { method: "PATCH", body });

// -------- Health check --------
export type HealthResult = {
  ok: boolean;
  baseUrl: string;       // resolved base ("" = same-origin)
  effectiveUrl: string;  // full URL that was probed
  status: number;        // HTTP status, 0 on network error
  latencyMs: number;
  message: string;       // human readable
  payload?: unknown;     // parsed JSON if any
};

export async function checkApiHealth(timeoutMs = 4000): Promise<HealthResult> {
  const base = BASE;
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const effectiveUrl = `${base || origin}/api/health`;
  const started = Date.now();
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(effectiveUrl, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: ctrl.signal,
      credentials: "include",
    });
    const latencyMs = Date.now() - started;
    const text = await res.text();
    const ct = res.headers.get("content-type") || "";
    const looksHtml = ct.includes("text/html") || text.trimStart().startsWith("<");
    if (looksHtml) {
      return {
        ok: false, baseUrl: base, effectiveUrl, status: res.status, latencyMs,
        message: `Got HTML instead of JSON (HTTP ${res.status}) — PHP /api/health not mounted at this origin.`,
      };
    }
    const payload = text ? safeJson(text) : null;
    if (!res.ok) {
      return {
        ok: false, baseUrl: base, effectiveUrl, status: res.status, latencyMs,
        message: `HTTP ${res.status} ${res.statusText || ""}`.trim(),
        payload,
      };
    }
    return {
      ok: true, baseUrl: base, effectiveUrl, status: res.status, latencyMs,
      message: "OK", payload,
    };
  } catch (e) {
    const latencyMs = Date.now() - started;
    const msg = e instanceof Error ? e.message : String(e);
    return {
      ok: false, baseUrl: base, effectiveUrl, status: 0, latencyMs,
      message: msg.includes("aborted") ? `Timed out after ${timeoutMs}ms` : `Network error: ${msg}`,
    };
  } finally {
    clearTimeout(t);
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
  // OTP verification for signup + email change
  verifyOtp: (email: string, code: string) =>
    api("/api/auth/otp/verify", { method: "POST", body: { email, code }, auth: false }),
  resendOtp: (email: string) =>
    api("/api/auth/otp/resend", { method: "POST", body: { email }, auth: false }),
};

// -------- Orders (customer) --------
export const ordersApi = {
  // Authenticated tracking — server filters by JWT subject and only returns
  // orders owned by the caller. No guest lookup surface.
  track: (query: string) =>
    api<{ order: any; stageIndex: number; stages?: any[] }>(
      `/api/orders/track`,
      { method: "POST", body: { query }, auth: true },
    ),

  list: (query?: { from?: string; to?: string; status?: string }) =>
    g<{ orders: any[] }>("/api/orders", query),
  get: (id: string) => g<{ order: any }>(`/api/orders/${id}`),
  create: (body: unknown) => j<{ id: string }>("/api/orders", body),
  update: (id: string, body: unknown) => patch(`/api/orders/${id}`, body),
  invoice: (id: string) => g<{ order: any; company: any; invoice: any }>(`/api/orders/${id}/invoice`),
  messages: (id: string) => g<{ messages: any[] }>(`/api/orders/${id}/messages`),
  postMessage: (id: string, body: string) => j(`/api/orders/${id}/messages`, { body }),
};

// -------- Admin — Orders --------
export const adminOrdersApi = {
  list: (query?: { from?: string; to?: string; status?: string; q?: string }) =>
    g<{ orders: any[] }>("/api/admin/orders", query),
  get: (id: string) => g<{ order: any }>(`/api/admin/orders/${id}`),
  create: (body: unknown) => j<{ id: string }>("/api/admin/orders", body),
  update: (id: string, body: unknown) => patch(`/api/admin/orders/${id}`, body),
  destroy: (id: string) => del(`/api/admin/orders/${id}`),
  bulk: (action: "archive" | "restore" | "delete" | "cancel" | "deliver", ids: string[]) =>
    j("/api/admin/orders/bulk", { action, ids }),
  events: (id: string) => g<{ events: any[] }>(`/api/admin/orders/${id}/events`),
  messages: (id: string) => g<{ messages: any[] }>(`/api/admin/orders/${id}/messages`),
  postMessage: (id: string, body: string) => j(`/api/admin/orders/${id}/messages`, { body }),
};

// -------- Admin — Products --------
export const adminProductsApi = {
  list: () => g<{ products: any[] }>("/api/admin/products"),
  create: (body: unknown) => j<{ id: string }>("/api/admin/products", body),
  update: (id: string, body: unknown) => patch(`/api/admin/products/${id}`, body),
  destroy: (id: string) => del(`/api/admin/products/${id}`),
};
export const productsApi = { list: () => g<{ products: any[] }>("/api/products") };

// -------- Admin — Store offers --------
export const adminOffersApi = {
  list: () => g<{ offers: any[] }>("/api/admin/offers"),
  create: (body: unknown) => j<{ id: string }>("/api/admin/offers", body),
  update: (id: string, body: unknown) => patch(`/api/admin/offers/${id}`, body),
  destroy: (id: string) => del(`/api/admin/offers/${id}`),
};
export const offersApi = { list: () => g<{ offers: any[] }>("/api/offers") };

// -------- Admin — Telegram bots --------
export const adminTelegramApi = {
  list: () => g<{ bots: any[] }>("/api/admin/telegram/bots"),
  create: (body: unknown) => j<{ id: string }>("/api/admin/telegram/bots", body),
  update: (id: string, body: unknown) => patch(`/api/admin/telegram/bots/${id}`, body),
  destroy: (id: string) => del(`/api/admin/telegram/bots/${id}`),
  test: (id: string, text?: string) => j("/api/admin/telegram/test", { id, text }),
};

// -------- Admin — Campaigns --------
export const adminCampaignsApi = {
  list: () => g<{ campaigns: any[] }>("/api/admin/campaigns"),
  create: (body: unknown) => j<{ id: string }>("/api/admin/campaigns", body),
  update: (id: string, body: unknown) => patch(`/api/admin/campaigns/${id}`, body),
  destroy: (id: string) => del(`/api/admin/campaigns/${id}`),
};

// -------- Admin — Legacy CSV imports --------
export const adminLegacyImportsApi = {
  list: () => g<{ batches: any[] }>("/api/admin/legacy-imports"),
  import: (rows: any[], batch_ref?: string) =>
    j<{ batch_id: string; imported: number; errors: any[] }>("/api/admin/legacy-imports", { rows, batch_ref }),
};

// -------- Admin — Backup / Restore --------
export const adminBackupApi = {
  export: () => g<{ backup: any }>("/api/admin/backup/export"),
  import: (backup: unknown) => j("/api/admin/backup/restore", { backup }),
};


// -------- Site content (public + admin) --------
export const siteContentApi = {
  get: (section: string) => g<{ content: any }>(`/api/site-content/${section}`),
  list: () => g<{ sections: any[] }>("/api/site-content"),
};
export const adminSiteContentApi = {
  upsert: (section: string, content: unknown) =>
    j(`/api/admin/site-content/${section}`, { content }, "PUT"),
};

// -------- Site settings + brand assets --------
export const siteSettingsApi = { get: () => g<{ settings: any }>("/api/site-settings") };
export const adminSiteSettingsApi = {
  update: (body: unknown) => patch("/api/admin/site-settings", body),
};

// -------- File uploads / downloads --------
export const uploadsApi = {
  /**
   * Upload a file to the PHP storage endpoint. Server returns a ready-to-use
   * URL (public for public buckets, pre-signed for private buckets).
   */
  upload: async (
    bucket: string,
    file: File | Blob,
    opts?: { path?: string; contentType?: string; cacheControl?: string; upsert?: boolean },
  ) => {
    const fd = new FormData();
    fd.append("bucket", bucket);
    const filename = (file as File).name || opts?.path?.split("/").pop() || "upload.bin";
    fd.append("file", file, filename);
    if (opts?.path) fd.append("path", opts.path);
    if (opts?.contentType) fd.append("content_type", opts.contentType);
    if (opts?.cacheControl) fd.append("cache_control", opts.cacheControl);
    if (opts?.upsert) fd.append("upsert", "1");
    return api<{ url: string; path: string; bucket: string }>("/api/uploads", {
      method: "POST",
      body: fd,
    });
  },
  /** Get a fresh signed/expiring URL for a stored object. */
  sign: (bucket: string, path: string, expiresIn = 60 * 60) =>
    j<{ url: string; expires_at: string }>("/api/uploads/sign", {
      bucket,
      path,
      expires_in: expiresIn,
    }),
  /** Public URL helper for public buckets (no signature). */
  publicUrl: (bucket: string, path: string) =>
    `${BASE}/api/uploads/public/${encodeURIComponent(bucket)}/${path
      .split("/")
      .map(encodeURIComponent)
      .join("/")}`,
  /** Delete a stored object. */
  destroy: (bucket: string, path: string) =>
    del(`/api/uploads?bucket=${encodeURIComponent(bucket)}&path=${encodeURIComponent(path)}`),
};

// -------- Blog --------
export const blogApi = {
  list: (query?: { status?: string; tag?: string; q?: string }) =>
    g<{ posts: any[] }>("/api/blog/posts", query),
  get: (slug: string) => g<{ post: any }>(`/api/blog/posts/${slug}`),
};
export const adminBlogApi = {
  list: () => g<{ posts: any[] }>("/api/admin/blog/posts"),
  create: (body: unknown) => j<{ id: string }>("/api/admin/blog/posts", body),
  update: (id: string, body: unknown) => patch(`/api/admin/blog/posts/${id}`, body),
  destroy: (id: string) => del(`/api/admin/blog/posts/${id}`),
};

// -------- Blog SEO overrides --------
export const blogSeoApi = {
  get: (slug: string) => g<{ override: any | null }>(`/api/blog/seo/${encodeURIComponent(slug)}`),
};
export const adminBlogSeoApi = {
  list: () => g<{ overrides: any[] }>("/api/admin/blog/seo"),
  upsert: (body: unknown) => j("/api/admin/blog/seo", body, "PUT"),
  destroy: (slug: string) => del(`/api/admin/blog/seo/${encodeURIComponent(slug)}`),
};

// -------- Blog analytics --------
export const blogAnalyticsApi = {
  track: (body: {
    slug: string;
    event_type: string;
    session_id?: string;
    meta?: Record<string, unknown>;
    path?: string;
    referrer?: string;
  }) => api("/api/blog/analytics/track", { method: "POST", body, auth: false }),
};
export const adminBlogAnalyticsApi = {
  summary: (query?: { days?: number }) =>
    g<{ rows: any[] }>("/api/admin/blog/analytics/summary", query),
  forSlug: (query: { slug: string; days?: number }) =>
    g<{ report: any }>("/api/admin/blog/analytics/slug", query),
};

// -------- Product details (extended per-slug CMS) --------
export const productDetailsApi = {
  get: (slug: string) => g<{ details: any | null }>(`/api/product-details/${encodeURIComponent(slug)}`),
};
export const adminProductDetailsApi = {
  list: () => g<{ items: any[] }>("/api/admin/product-details"),
  upsert: (body: unknown) => j("/api/admin/product-details", body, "PUT"),
  destroy: (slug: string) => del(`/api/admin/product-details/${encodeURIComponent(slug)}`),
};

// -------- Reviews --------
export const reviewsApi = {
  list: () => g<{ reviews: any[]; count: number }>("/api/reviews"),
  submit: (body: unknown) => j<{ id: string }>("/api/reviews", body),
  listMine: () => g<{ reviews: any[] }>("/api/reviews/mine"),
};
export const adminReviewsApi = {
  list: () => g<{ reviews: any[] }>("/api/admin/reviews"),
  moderate: (id: string, body: { action: "approve" | "reject" | "delete"; reason?: string | null }) =>
    j(`/api/admin/reviews/${id}/moderate`, body),
};


// -------- Support tickets --------
export const ticketsApi = {
  list: () => g<{ tickets: any[] }>("/api/tickets"),
  create: (body: unknown) => j<{ id: string }>("/api/tickets", body),
  get: (id: string) => g<{ ticket: any; messages: any[] }>(`/api/tickets/${id}`),
  postMessage: (id: string, body: string) => j(`/api/tickets/${id}/messages`, { body }),
  close: (id: string) => j(`/api/tickets/${id}/close`, {}),
};
export const adminTicketsApi = {
  list: (query?: { status?: string; search?: string }) =>
    g<{ tickets: any[] }>("/api/admin/tickets", query),
  get: (id: string) => g<{ ticket: any; messages: any[] }>(`/api/admin/tickets/${id}`),
  update: (id: string, body: unknown) => patch(`/api/admin/tickets/${id}`, body),
  postMessage: (id: string, body: string, status?: string) =>
    j(`/api/admin/tickets/${id}/messages`, { body, status }),
};

// -------- Pricing --------
export const pricingApi = { list: () => g<{ pricing: any[] }>("/api/pricing") };
export const adminPricingApi = {
  list: () => g<{ pricing: any[] }>("/api/admin/pricing"),
  update: (id: string, body: unknown) => patch(`/api/admin/pricing/${id}`, body),
  publish: (id: string, published: boolean) =>
    j(`/api/admin/pricing/${id}/publish`, { published }),
  audit: () => g<{ audit: any[] }>("/api/admin/pricing/audit"),
};

// -------- Referrals --------
export const referralsApi = {
  me: () => g<{ profile: any; credits: any[]; balance_cents: number; referrals: any[]; totals?: any; ledger?: any[] }>("/api/referrals/me"),
  balance: () => g<{ balance_cents: number; currency: string }>("/api/referrals/balance"),
  attach: (code: string) => j<{ ok: boolean; reason?: string }>("/api/referrals/attach", { code }),
  redeem: (order_id: string, requested_cents: number, subtotal_cents: number) =>
    j<{ applied_cents: number }>("/api/referrals/redeem", { order_id, requested_cents, subtotal_cents }),
};

// -------- Contact form + leads --------
export const contactApi = {
  submit: (body: unknown) => j("/api/contact", body),
};
export const adminLeadsApi = {
  list: () => g<{ leads: any[] }>("/api/admin/leads"),
  update: (id: string, body: unknown) => patch(`/api/admin/leads/${id}`, body),
  destroy: (id: string) => del(`/api/admin/leads/${id}`),
};

// -------- Announcements --------
export const announcementsApi = { active: () => g<{ announcements: any[] }>("/api/announcements") };
export const adminAnnouncementsApi = {
  list: () => g<{ announcements: any[] }>("/api/admin/announcements"),
  create: (body: unknown) => j<{ id: string }>("/api/admin/announcements", body),
  update: (id: string, body: unknown) => patch(`/api/admin/announcements/${id}`, body),
  destroy: (id: string) => del(`/api/admin/announcements/${id}`),
};

// -------- Chatbot (public widget) --------
export const chatbotApi = {
  config: () => g<{ enabled: boolean; greeting: string; human_hours_note: string }>("/api/chatbot/config"),
  listKb: () => g<{ items: any[] }>("/api/chatbot/kb"),
  startConversation: (body: { sessionId: string; visitorName: string; orderId?: string; email?: string }) =>
    j<{ conversation: any }>("/api/chatbot/conversations", body),
  listMessages: (sessionId: string) =>
    g<{ messages: any[] }>("/api/chatbot/messages", { session_id: sessionId }),
  postMessage: (body: { sessionId: string; sender: string; text: string }) =>
    j<{ ok: boolean }>("/api/chatbot/messages", body),
  lookupOrder: (body: { orderId: string; verify?: string }) =>
    j<{ found: boolean; order?: any }>("/api/chatbot/lookup-order", body),
  createOrder: (body: unknown) => j<{ order_id: string }>("/api/chatbot/orders", body),
  createTicket: (body: unknown) => j<{ ticket_no: string }>("/api/chatbot/tickets", body),
  handoff: (body: { sessionId: string; lastMessage?: string }) =>
    j<{ ok: boolean; note?: string }>("/api/chatbot/handoff", body),
};
export const adminChatbotApi = {
  getConfig: () => g<{ config: any }>("/api/admin/chatbot/config"),
  saveConfig: (body: unknown) => j("/api/admin/chatbot/config", body, "PUT"),
  conversations: () => g<{ conversations: any[] }>("/api/admin/chatbot/conversations"),
  messages: (conversationId: string) =>
    g<{ messages: any[] }>(`/api/admin/chatbot/conversations/${conversationId}/messages`),
  reply: (conversationId: string, text: string) =>
    j(`/api/admin/chatbot/conversations/${conversationId}/messages`, { text }),
  closeConversation: (conversationId: string) =>
    j(`/api/admin/chatbot/conversations/${conversationId}/close`, {}),
  kbList: () => g<{ items: any[] }>("/api/admin/chatbot/kb"),
  kbUpsert: (body: unknown) => j("/api/admin/chatbot/kb", body),
  kbDelete: (id: string) => del(`/api/admin/chatbot/kb/${id}`),
  ordersList: () => g<{ orders: any[] }>("/api/admin/chatbot/orders"),
  orderUpsert: (body: unknown) => j("/api/admin/chatbot/orders", body),
  orderDelete: (id: string) => del(`/api/admin/chatbot/orders/${id}`),
  ticketsList: () => g<{ tickets: any[] }>("/api/admin/chatbot/tickets"),
  ticketUpdate: (id: string, body: unknown) => patch(`/api/admin/chatbot/tickets/${id}`, body),
  telegramWebhook: (webhookUrl: string) =>
    j<{ ok: boolean; description?: string }>("/api/admin/chatbot/telegram-webhook", { webhookUrl }),
  syncKb: () => j<{ ok: true; inserted: number; removed: number; categories: Record<string, number> }>(
    "/api/admin/chatbot/kb/sync",
    {},
  ),
};

// -------- Samples --------
export const samplesApi = { list: () => g<{ samples: any[] }>("/api/samples") };
export const adminSamplesApi = {
  list: () => g<{ samples: any[] }>("/api/admin/samples"),
  upsert: (body: unknown) => j("/api/admin/samples", body),
  destroy: (id: string) => del(`/api/admin/samples/${id}`),
};

// -------- Users / roles --------
export const adminUsersApi = {
  list: (query?: { q?: string }) => g<{ users: any[] }>("/api/admin/users", query),
  update: (id: string, body: unknown) => patch(`/api/admin/users/${id}`, body),
  setRole: (id: string, role: "admin" | "user", enabled: boolean) =>
    j(`/api/admin/users/${id}/roles`, { role, enabled }),
};


// -------- Analytics --------
export const adminAnalyticsApi = {
  overview: (query?: { from?: string; to?: string }) =>
    g<{ metrics: any; series: any[] }>("/api/admin/analytics/overview", query),
};

// -------- Social links --------
export const socialLinksApi = { list: () => g<{ links: any[] }>("/api/social-links") };
export const adminSocialLinksApi = {
  list: () => g<{ links: any[] }>("/api/admin/social-links"),
  upsert: (body: unknown) => j("/api/admin/social-links", body),
  destroy: (id: string) => del(`/api/admin/social-links/${id}`),
};

// -------- Stripe --------
export const stripeApi = {
  checkout: (order_id: string) =>
    j<{ url: string }>("/api/stripe/checkout", { order_id }),
};

// -------- Admin — Referrals (extended) --------
export const adminReferralsApi = {
  list: (query?: { status?: string; review_state?: string; search?: string; limit?: number }) =>
    g<{ referrals: any[] }>("/api/admin/referrals", query),
  stats: () => g<{ stats: any }>("/api/admin/referrals/stats"),
  update: (id: string, body: unknown) => patch(`/api/admin/referrals/${id}`, body),
  approve: (id: string, notes?: string) => j(`/api/admin/referrals/${id}/approve`, { notes }),
  reject: (id: string, notes?: string) => j(`/api/admin/referrals/${id}/reject`, { notes }),
  chain: (referrer_id: string) => g<{ chain: any }>(`/api/admin/referrals/chain`, { referrer_id }),
  funnel: (days?: number) => g<{ funnel: any }>(`/api/admin/referrals/funnel`, { days }),
  leaderboard: (limit?: number) =>
    g<{ leaderboard: any[] }>(`/api/admin/referrals/leaderboard`, { limit }),
  markPaidOut: (user_ids: string[], notes?: string) =>
    j<{ batch_id: string | null; count: number; total_cents: number }>(
      `/api/admin/referrals/payout`,
      { user_ids, notes },
    ),
  exportOwedCsv: () => g<{ csv: string; count: number }>(`/api/admin/referrals/owed.csv`),
};

// -------- Admin — Stripe events / webhook deliveries --------
export const adminStripeApi = {
  events: (query?: { limit?: number; type?: string }) =>
    g<{ events: any[] }>("/api/admin/stripe/events", query),
  deliveries: (query?: { limit?: number; status?: string }) =>
    g<{ deliveries: any[] }>("/api/admin/stripe/deliveries", query),
};

// -------- Conversion events (public + admin) --------
export const conversionEventsApi = {
  list: () => g<{ events: any[] }>("/api/conversion-events"),
};
export const adminConversionEventsApi = {
  list: () => g<{ events: any[] }>("/api/admin/conversion-events"),
  upsert: (body: unknown) => j<{ event: any }>("/api/admin/conversion-events", body),
  destroy: (id: string) => del(`/api/admin/conversion-events/${id}`),
};

// -------- Admin — Server-side tracking config --------
export const adminServerTrackingApi = {
  get: () => g<{ config: any }>("/api/admin/server-tracking/config"),
  update: (body: unknown) => patch("/api/admin/server-tracking/config", body),
  log: () => g<{ events: any[] }>("/api/admin/server-tracking/log"),
};

// -------- Admin — Data portability (bulk import / export) --------
export const adminPortabilityApi = {
  import: (body: unknown) =>
    j<{ ok: true; users_created: number; clients_processed: number; orders_upserted: number }>(
      "/api/admin/portability/import",
      body,
    ),
  export: () =>
    g<{ exported_at: string; profiles: any[]; orders: any[]; order_events: any[] }>(
      "/api/admin/portability/export",
    ),
};

// -------- Sample datasets (public + admin extras) --------
export const sampleDatasetsApi = {
  get: () => g<{ data: any; meta: any; totalRows: number }>("/api/samples/data"),
};
export const adminSampleDatasetsApi = {
  list: () => g<{ datasets: any[] }>("/api/admin/sample-datasets"),
  upsert: (body: unknown) => j("/api/admin/sample-datasets", body),
  upload: (body: { source: string; filename: string; contentBase64: string }) =>
    j<{ ok: true; storage_path: string }>("/api/admin/sample-datasets/upload", body),
  audit: () => g<{ entries: any[] }>("/api/admin/sample-datasets/audit"),
  preview: (body: unknown) => j<{ preview: any }>("/api/admin/sample-datasets/preview", body),
};

// -------- Google Drive proxy (public file fetch) --------
export const driveApi = {
  fetch: (url: string) =>
    j<{ fileId: string; contentType: string; size: number; base64: string }>(
      "/api/admin/drive/fetch",
      { url },
    ),
};

// Convenience default export
export default {
  api,
  auth: authApi,
  orders: ordersApi,
  adminOrders: adminOrdersApi,
  products: productsApi,
  adminProducts: adminProductsApi,
  offers: offersApi,
  adminOffers: adminOffersApi,
  adminTelegram: adminTelegramApi,
  adminCampaigns: adminCampaignsApi,
  adminLegacyImports: adminLegacyImportsApi,
  adminBackup: adminBackupApi,
  siteContent: siteContentApi,
  adminSiteContent: adminSiteContentApi,
  siteSettings: siteSettingsApi,
  adminSiteSettings: adminSiteSettingsApi,
  uploads: uploadsApi,
  blog: blogApi,
  adminBlog: adminBlogApi,
  blogSeo: blogSeoApi,
  adminBlogSeo: adminBlogSeoApi,
  blogAnalytics: blogAnalyticsApi,
  adminBlogAnalytics: adminBlogAnalyticsApi,
  productDetails: productDetailsApi,
  adminProductDetails: adminProductDetailsApi,
  reviews: reviewsApi,
  adminReviews: adminReviewsApi,
  tickets: ticketsApi,
  adminTickets: adminTicketsApi,
  pricing: pricingApi,
  adminPricing: adminPricingApi,
  referrals: referralsApi,
  contact: contactApi,
  adminLeads: adminLeadsApi,
  announcements: announcementsApi,
  adminAnnouncements: adminAnnouncementsApi,
  chatbot: chatbotApi,
  adminChatbot: adminChatbotApi,
  samples: samplesApi,
  adminSamples: adminSamplesApi,
  adminUsers: adminUsersApi,
  adminAnalytics: adminAnalyticsApi,
  socialLinks: socialLinksApi,
  adminSocialLinks: adminSocialLinksApi,
  stripe: stripeApi,
  adminReferrals: adminReferralsApi,
  adminStripe: adminStripeApi,
  conversionEvents: conversionEventsApi,
  adminConversionEvents: adminConversionEventsApi,
  adminServerTracking: adminServerTrackingApi,
  adminPortability: adminPortabilityApi,
  sampleDatasets: sampleDatasetsApi,
  adminSampleDatasets: adminSampleDatasetsApi,
  drive: driveApi,
};

