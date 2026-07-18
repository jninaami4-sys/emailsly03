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
  const url = (path.startsWith("http") ? path : `${BASE}${path}`) + qs(query);
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

const j = <T = unknown>(path: string, body?: unknown, method = "POST") =>
  api<T>(path, { method, body });
const g = <T = unknown>(path: string, query?: Init["query"]) => api<T>(path, { query });
const del = <T = unknown>(path: string) => api<T>(path, { method: "DELETE" });
const patch = <T = unknown>(path: string, body?: unknown) =>
  api<T>(path, { method: "PATCH", body });

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
  export: () => g<{ backup: any }>("/api/admin/backup"),
  import: (backup: unknown) => j("/api/admin/restore", { backup }),
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

// -------- Reviews --------
export const reviewsApi = {
  list: () => g<{ reviews: any[] }>("/api/reviews"),
  create: (body: unknown) => j("/api/reviews", body),
};
export const adminReviewsApi = {
  list: () => g<{ reviews: any[] }>("/api/admin/reviews"),
  moderate: (id: string, status: "approved" | "rejected" | "pending") =>
    patch(`/api/admin/reviews/${id}`, { status }),
};

// -------- Support tickets --------
export const ticketsApi = {
  list: () => g<{ tickets: any[] }>("/api/tickets"),
  create: (body: unknown) => j<{ id: string }>("/api/tickets", body),
  get: (id: string) => g<{ ticket: any; messages: any[] }>(`/api/tickets/${id}`),
  postMessage: (id: string, body: string) => j(`/api/tickets/${id}/messages`, { body }),
};
export const adminTicketsApi = {
  list: () => g<{ tickets: any[] }>("/api/admin/tickets"),
  update: (id: string, body: unknown) => patch(`/api/admin/tickets/${id}`, body),
  postMessage: (id: string, body: string) => j(`/api/admin/tickets/${id}/messages`, { body }),
};

// -------- Pricing --------
export const pricingApi = { list: () => g<{ pricing: any[] }>("/api/pricing") };
export const adminPricingApi = {
  list: () => g<{ pricing: any[] }>("/api/admin/pricing"),
  update: (id: string, body: unknown) => patch(`/api/admin/pricing/${id}`, body),
};

// -------- Referrals --------
export const referralsApi = {
  me: () => g<{ profile: any; credits: any[]; balance_cents: number; referrals: any[] }>("/api/referrals/me"),
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
};

// -------- Announcements --------
export const announcementsApi = { active: () => g<{ announcements: any[] }>("/api/announcements") };
export const adminAnnouncementsApi = {
  list: () => g<{ announcements: any[] }>("/api/admin/announcements"),
  create: (body: unknown) => j<{ id: string }>("/api/admin/announcements", body),
  update: (id: string, body: unknown) => patch(`/api/admin/announcements/${id}`, body),
  destroy: (id: string) => del(`/api/admin/announcements/${id}`),
};

// -------- Chatbot --------
export const chatbotApi = {
  config: () => g<{ config: any }>("/api/chatbot/config"),
  start: () => j<{ conversation_id: string }>("/api/chatbot/conversations"),
  sendMessage: (conversation_id: string, message: string) =>
    j<{ reply: string }>(`/api/chatbot/conversations/${conversation_id}/messages`, { message }),
};
export const adminChatbotApi = {
  kbList: () => g<{ items: any[] }>("/api/admin/chatbot/kb"),
  kbUpsert: (body: unknown) => j("/api/admin/chatbot/kb", body),
  conversations: () => g<{ conversations: any[] }>("/api/admin/chatbot/conversations"),
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
    j("/api/admin/users/roles", { user_id: id, role, enabled }),
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
};
