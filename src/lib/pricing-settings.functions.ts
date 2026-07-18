/**
 * Pricing settings — thin proxies to PHP API (Batch 5 migration).
 */
import { adminPricingApi, pricingApi } from "@/lib/api-client";

export type PricingSetting = {
  service_id: string;
  name: string;
  rate: number;
  unit: string;
  min_qty: number;
  min_order: number;
  fixed: boolean;
  helper: string | null;
  sort_order: number;
  published: boolean;
  updated_at: string;
};

export type PricingAuditChange = { old: string | number | boolean | null; new: string | number | boolean | null };
export type PricingAuditEntry = {
  id: string;
  service_id: string;
  service_name: string | null;
  changed_by: string | null;
  changed_by_email: string | null;
  changes: Record<string, PricingAuditChange>;
  changed_at: string;
};

type Empty = Record<string, never>;

function normalize(row: Record<string, unknown>): PricingSetting {
  return {
    service_id: String(row.service_id),
    name: String(row.name ?? ""),
    rate: Number(row.rate ?? 0),
    unit: String(row.unit ?? ""),
    min_qty: Number(row.min_qty ?? 1),
    min_order: Number(row.min_order ?? 0),
    fixed: Boolean(row.fixed),
    helper: (row.helper as string | null) ?? null,
    sort_order: Number(row.sort_order ?? 0),
    published: row.published === undefined || row.published === null ? true : Boolean(row.published),
    updated_at: String(row.updated_at ?? ""),
  };
}

export async function getPricingSettings(_?: { data?: Empty }): Promise<PricingSetting[]> {
  try {
    const { pricing } = await pricingApi.list();
    return (pricing ?? []).map((r: Record<string, unknown>) => normalize(r));
  } catch (e) {
    console.error("getPricingSettings", e);
    return [];
  }
}

export async function updatePricingSetting(args: {
  data: {
    service_id: string;
    rate: number;
    min_qty: number;
    min_order: number;
    helper?: string | null;
    published?: boolean;
  };
}): Promise<PricingSetting> {
  const { service_id, ...body } = args.data;
  const res = (await adminPricingApi.update(service_id, body)) as { pricing?: Record<string, unknown> };
  return normalize((res?.pricing ?? { ...args.data }) as Record<string, unknown>);
}

export async function setPricingPublished(args: {
  data: { service_id: string; published: boolean };
}): Promise<PricingSetting> {
  const res = (await adminPricingApi.publish(args.data.service_id, args.data.published)) as {
    pricing?: Record<string, unknown>;
  };
  return normalize((res?.pricing ?? { ...args.data }) as Record<string, unknown>);
}

export async function getPricingAudit(_?: { data?: Empty }): Promise<PricingAuditEntry[]> {
  try {
    const { audit } = await adminPricingApi.audit();
    return (audit ?? []) as PricingAuditEntry[];
  } catch (e) {
    console.error("getPricingAudit", e);
    return [];
  }
}
