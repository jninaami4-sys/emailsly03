/**
 * Lightweight event/pageview dedupe.
 *
 * Backed by sessionStorage so it survives SPA route changes and full
 * refreshes within the same tab, without persisting across sessions.
 * IDs are deterministic so the same logical event never fires twice —
 * even across React re-renders, `history.pushState` doubles, or a
 * refresh that lands on the same route.
 */

const STORE_KEY = "tracking-dedupe-v1";
const DEFAULT_TTL_MS = 30_000; // dedupe window
const MAX_ENTRIES = 200;

type Store = Record<string, number>; // id -> expiresAt (ms epoch)

function now() {
  return Date.now();
}

function readStore(): Store {
  if (typeof window === "undefined") return {};
  try {
    const raw = sessionStorage.getItem(STORE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Store;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeStore(s: Store) {
  if (typeof window === "undefined") return;
  try {
    // Drop expired + cap size (oldest first)
    const t = now();
    const alive = Object.entries(s).filter(([, exp]) => exp > t);
    alive.sort((a, b) => a[1] - b[1]);
    const trimmed = alive.slice(-MAX_ENTRIES);
    sessionStorage.setItem(STORE_KEY, JSON.stringify(Object.fromEntries(trimmed)));
  } catch {
    /* ignore */
  }
}

/** Stable string hash (djb2). Deterministic across reloads. */
export function stableHash(input: string): string {
  let h = 5381;
  for (let i = 0; i < input.length; i++) {
    h = ((h << 5) + h) ^ input.charCodeAt(i);
  }
  // Force unsigned + base36 for compactness
  return (h >>> 0).toString(36);
}

/** Deterministic serialize for objects — keys sorted so payloads collide. */
export function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`).join(",")}}`;
}

/**
 * Reserve an event id. Returns true if the caller should fire, false if
 * this id was already seen within the dedupe window.
 */
export function reserveEvent(id: string, ttlMs = DEFAULT_TTL_MS): boolean {
  const store = readStore();
  const t = now();
  const exp = store[id];
  if (exp && exp > t) return false;
  store[id] = t + ttlMs;
  writeStore(store);
  return true;
}

export function pageviewId(path: string): string {
  // Bucket to 1s so React StrictMode double-invocations and rapid replays
  // collapse to the same id, but genuine re-visits later still fire.
  const bucket = Math.floor(now() / 1000);
  return `pv_${stableHash(path)}_${bucket}`;
}

export function conversionEventId(
  key: string,
  overrides?: Record<string, unknown>,
): string {
  // Bucket to 2s — the same call from two providers or effects within the
  // same tick dedupes, but a legitimate second purchase seconds later does
  // not. Callers that need finer control pass `event_id` in overrides.
  const bucket = Math.floor(now() / 2000);
  const explicit =
    overrides &&
    typeof overrides === "object" &&
    typeof (overrides as { event_id?: unknown }).event_id === "string"
      ? String((overrides as { event_id: string }).event_id)
      : null;
  if (explicit) return `ev_${key}_${stableHash(explicit)}`;
  const payload = stableStringify(overrides ?? {});
  return `ev_${key}_${stableHash(payload)}_${bucket}`;
}
