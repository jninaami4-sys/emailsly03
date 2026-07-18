/**
 * Canonical service pricing catalog — single source of truth.
 *
 * Every surface that displays a service price (ServicesCarousel, OrderBuilder,
 * PricingCalculator, AddOns, pricing.tsx, invoices, etc.) MUST derive its
 * numbers from here. Never hardcode a rate/min in a component again.
 *
 * Admin `pricing_settings` overrides are merged in via `applyCatalogOverride`.
 */

import type { PricingOverride } from "@/hooks/use-pricing-overrides";

export type CatalogEntry = {
  id: string;
  /** Per-unit price in USD. For `fixed` services this is the flat price. */
  rate: number;
  /** Minimum quantity (units or mailboxes). */
  minQty: number;
  /** Minimum order total in USD. */
  minOrder: number;
  /** Singular unit label used in copy (lead, record, setup, kit, site, mailboxes). */
  unit: string;
  /** True for flat-priced services (setup fees, one-off builds). */
  fixed?: boolean;
};

export const SERVICE_CATALOG: Record<string, CatalogEntry> = {
  apollo:    { id: "apollo",    rate: 0.0035, minQty: 5000, minOrder: 20,  unit: "lead" },
  zoominfo:  { id: "zoominfo",  rate: 0.02,   minQty: 1000, minOrder: 20,  unit: "lead" },
  linkedin:  { id: "linkedin",  rate: 0.01,   minQty: 5000, minOrder: 50,  unit: "lead" },
  manual:    { id: "manual",    rate: 0.35,   minQty: 100,  minOrder: 35,  unit: "lead" },
  mobile:    { id: "mobile",    rate: 0.15,   minQty: 100,  minOrder: 15,  unit: "record" },
  warmup:    { id: "warmup",    rate: 50,     minQty: 2,    minOrder: 100, unit: "mailboxes" },
  pixel:     { id: "pixel",     rate: 100,    minQty: 1,    minOrder: 100, unit: "setup", fixed: true },
  ads:       { id: "ads",       rate: 100,    minQty: 1,    minOrder: 100, unit: "setup", fixed: true },
  tracking:  { id: "tracking",  rate: 150,    minQty: 1,    minOrder: 150, unit: "setup", fixed: true },
  logo:      { id: "logo",      rate: 50,     minQty: 1,    minOrder: 50,  unit: "kit",   fixed: true },
  webdesign: { id: "webdesign", rate: 200,    minQty: 1,    minOrder: 200, unit: "site",  fixed: true },
};

export function getCatalogEntry(id: string): CatalogEntry | undefined {
  return SERVICE_CATALOG[id];
}

/** Merge an admin override on top of the canonical catalog entry. */
export function applyCatalogOverride(
  id: string,
  overrides?: Map<string, PricingOverride>,
): CatalogEntry | undefined {
  const base = SERVICE_CATALOG[id];
  if (!base) return undefined;
  const o = overrides?.get(id);
  if (!o) return base;
  return { ...base, rate: o.rate, minQty: o.minQty, minOrder: o.minOrder };
}

// ---------- Display helpers (used by every card/list/invoice) ----------

/** Format a USD amount with cents, e.g. 20 → "$20.00", 0.0035 → "$0.0035". */
export function formatUSD(n: number, opts?: { compactWholes?: boolean }): string {
  if (n < 1) {
    // Preserve small unit rates like $0.0035
    return `$${n.toString()}`;
  }
  if (opts?.compactWholes && Number.isInteger(n)) return `$${n.toLocaleString()}`;
  return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** "$0.0035" for per-unit services, "$100" for flat. */
export function formatUnitPrice(id: string, overrides?: Map<string, PricingOverride>): string {
  const e = applyCatalogOverride(id, overrides);
  if (!e) return "";
  if (e.fixed) return formatUSD(e.rate, { compactWholes: true });
  return `$${e.rate}`;
}

/** "per lead", "flat", "2 mailboxes · 15 days" etc. */
export function formatPerUnit(id: string, overrides?: Map<string, PricingOverride>): string {
  const e = applyCatalogOverride(id, overrides);
  if (!e) return "";
  if (id === "warmup") return `${e.minQty} mailboxes · 15 days`;
  if (e.fixed) return "flat";
  return `per ${e.unit}`;
}

/** "5,000 min", "Single site", "2 mailboxes min". */
export function formatMinOrder(id: string, overrides?: Map<string, PricingOverride>): string {
  const e = applyCatalogOverride(id, overrides);
  if (!e) return "";
  if (id === "webdesign") return "Single site";
  if (id === "logo") return "Single kit";
  if (e.fixed) return "One-time";
  return `${e.minQty.toLocaleString()} ${pluralize(e.unit, e.minQty)} min`;
}

/** "$0.15/record", "$100 flat", "starting at $200". */
export function formatAddOnPrice(id: string, overrides?: Map<string, PricingOverride>): string {
  const e = applyCatalogOverride(id, overrides);
  if (!e) return "";
  if (id === "webdesign") return `starting at ${formatUSD(e.rate, { compactWholes: true })}`;
  if (id === "warmup") return `${formatUSD(e.rate * e.minQty, { compactWholes: true })} flat`;
  if (e.fixed) return `${formatUSD(e.rate, { compactWholes: true })} flat`;
  return `$${e.rate}/${e.unit}`;
}

/** "$20", used on pricing.tsx tier cards as the headline number. */
export function formatTierHeadline(id: string, overrides?: Map<string, PricingOverride>): string {
  const e = applyCatalogOverride(id, overrides);
  if (!e) return "";
  return formatUSD(e.minOrder, { compactWholes: true });
}

/** "/ 5k leads", "/ 100 leads", "flat". */
export function formatTierPer(id: string, overrides?: Map<string, PricingOverride>): string {
  const e = applyCatalogOverride(id, overrides);
  if (!e) return "";
  if (e.fixed) return "flat";
  return `/ ${formatCompact(e.minQty)} ${pluralize(e.unit, e.minQty)}`;
}

/** "$0.0035 per lead · min 5,000". */
export function formatTierSubline(id: string, overrides?: Map<string, PricingOverride>): string {
  const e = applyCatalogOverride(id, overrides);
  if (!e) return "";
  if (e.fixed) return `${formatUSD(e.rate, { compactWholes: true })} flat`;
  return `$${e.rate} per ${e.unit} · min ${e.minQty.toLocaleString()}`;
}

function pluralize(unit: string, n: number): string {
  if (n === 1) return unit;
  if (unit.endsWith("s")) return unit;
  return `${unit}s`;
}

function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${n / 1_000_000}M`;
  if (n >= 1_000) return `${n / 1_000}k`;
  return String(n);
}
