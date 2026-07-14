/**
 * Referral link capture. Runs client-side.
 *
 * - Reads ?ref=CODE from the current URL on any page load.
 * - Stores it in localStorage for 30 days AND a first-party cookie.
 * - Fires a fire-and-forget click ping to /api/public/referral-click (deduped per code+visitor+day server-side).
 * - Exposes helpers for the auth flow to read the stored code and attach it after sign-in.
 */

const LS_KEY = "lyra_ref";
const COOKIE = "lyra_ref";
const TTL_DAYS = 30;

type Stored = { code: string; ts: number; landing_url?: string };

function isBrowser() {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

function normalize(code: string) {
  return code.trim().toUpperCase().slice(0, 24);
}

function setCookie(name: string, value: string, days: number) {
  if (!isBrowser()) return;
  const d = new Date();
  d.setTime(d.getTime() + days * 864e5);
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${d.toUTCString()}; path=/; SameSite=Lax${secure}`;
}

function getCookie(name: string): string | null {
  if (!isBrowser()) return null;
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? decodeURIComponent(match[2]) : null;
}

async function sha256Hex(s: string): Promise<string> {
  if (!isBrowser() || !window.crypto?.subtle) return "";
  const buf = await window.crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function getVisitorId(): string {
  if (!isBrowser()) return "";
  let id = window.localStorage.getItem("lyra_visitor_id");
  if (!id) {
    id = (crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)) + Date.now().toString(36);
    window.localStorage.setItem("lyra_visitor_id", id);
  }
  return id;
}

export function getStoredReferral(): Stored | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Stored;
      if (parsed?.code && Date.now() - parsed.ts < TTL_DAYS * 864e5) return parsed;
    }
  } catch {
    // ignore
  }
  const cookie = getCookie(COOKIE);
  if (cookie) return { code: cookie, ts: Date.now() };
  return null;
}

export function clearStoredReferral() {
  if (!isBrowser()) return;
  window.localStorage.removeItem(LS_KEY);
  setCookie(COOKIE, "", -1);
}

/** Call once on app mount from the root component. Safe on every route change (idempotent). */
export function captureReferralFromUrl() {
  if (!isBrowser()) return;
  try {
    const params = new URLSearchParams(window.location.search);
    const raw = params.get("ref");
    if (!raw) return;
    const code = normalize(raw);
    if (code.length < 4) return;
    const existing = getStoredReferral();
    // Latest wins if a different code is presented; refresh TTL either way.
    const payload: Stored = { code, ts: Date.now(), landing_url: window.location.href };
    window.localStorage.setItem(LS_KEY, JSON.stringify(payload));
    setCookie(COOKIE, code, TTL_DAYS);
    // Only ping once per session for the same code
    const sessKey = `lyra_ref_pinged_${code}`;
    if (!existing || existing.code !== code || !window.sessionStorage.getItem(sessKey)) {
      window.sessionStorage.setItem(sessKey, "1");
      void pingClick(code, window.location.href);
    }
  } catch {
    // ignore
  }
}

async function pingClick(code: string, landingUrl: string) {
  try {
    const visitorHash = await sha256Hex(getVisitorId());
    const uaHash = await sha256Hex(
      `${navigator.userAgent}|${navigator.language ?? ""}|${(navigator as any).languages?.join(",") ?? ""}`,
    );
    await fetch("/api/public/referral-click", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code,
        visitor_hash: visitorHash,
        ua_hash: uaHash,
        landing_url: landingUrl.slice(0, 2048),
        referer: (document.referrer || "").slice(0, 2048),
      }),
      keepalive: true,
    });
  } catch {
    // ignore — attribution is best-effort
  }
}
