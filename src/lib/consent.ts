export type ConsentCategories = {
  necessary: true; // always on
  analytics: boolean; // GA4, GTM
  marketing: boolean; // Meta Pixel, TikTok Pixel, custom HTML
};

export type ConsentRecord = {
  categories: ConsentCategories;
  decidedAt: string; // ISO
  version: number;
};

export const CONSENT_VERSION = 1;
export const CONSENT_STORAGE_KEY = "cookie-consent";
export const CONSENT_EVENT = "cookie-consent:change";

export const DEFAULT_CONSENT: ConsentCategories = {
  necessary: true,
  analytics: false,
  marketing: false,
};

export function readConsent(): ConsentRecord | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ConsentRecord;
    if (!parsed || parsed.version !== CONSENT_VERSION) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeConsent(categories: Omit<ConsentCategories, "necessary">) {
  const record: ConsentRecord = {
    categories: { necessary: true, ...categories },
    decidedAt: new Date().toISOString(),
    version: CONSENT_VERSION,
  };
  try {
    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(record));
  } catch {
    /* ignore */
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: record }));
  }
  return record;
}

export function clearConsent() {
  try {
    localStorage.removeItem(CONSENT_STORAGE_KEY);
  } catch {
    /* ignore */
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: null }));
  }
}

export function openConsentPreferences() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("cookie-consent:open"));
  }
}
